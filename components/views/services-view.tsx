"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Users, Stethoscope, Siren, ScanLine, FlaskConical, Pill, HeartPulse, Plus, QrCode, Ban } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { useRouter, useSearchParams } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { useApp, Service, Ticket } from "@/lib/app-context"

function generateUniqueTicketCode(servicePrefix: string, position: number): string {
  return `${servicePrefix}-${String(position).padStart(3, "0")}`
}

const iconMap: Record<string, React.ReactNode> = {
  "stethoscope": <Stethoscope className="size-6" />,
  "siren": <Siren className="size-6" />,
  "scan": <ScanLine className="size-6" />,
  "flask": <FlaskConical className="size-6" />,
  "pill": <Pill className="size-6" />,
  "heart-pulse": <HeartPulse className="size-6" />,
}

interface ServicesViewProps {
  isAdmin?: boolean
}

const calculateQueue = (serviceId: string, allTickets: Ticket[]) =>
  allTickets.filter(t => t.service?.id === serviceId && t.statut === "waiting").length

const isWithinOperatingHours = (openTime: string, closeTime: string) => {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return currentTime >= openTime && currentTime <= closeTime
}

function extractServiceKey(decodedText: string): string {
  const cleaned = decodedText.trim()
  const match = cleaned.match(/\/scanner\/([^/?#]+)/)
  if (match) return decodeURIComponent(match[1]).trim()
  if (cleaned.includes("?")) {
    const urlParams = new URLSearchParams(cleaned.split("?")[1])
    const fromQuery = urlParams.get("service") || urlParams.get("scan")
    if (fromQuery) return fromQuery.trim()
  }
  return cleaned
}

function getServiceAvailability(
  service: Service,
  counters: ReturnType<typeof useApp>["counters"],
  agents: ReturnType<typeof useApp>["agents"]
): { isEffectivelyActive: boolean; closingReason: string } {
  if (!service.isActive) return { isEffectivelyActive: false, closingReason: "Fermé" }

  const isTimeOpen = isWithinOperatingHours(service.openTime, service.closeTime)
  if (!isTimeOpen) return { isEffectivelyActive: false, closingReason: "Hors Horaires" }

  
  const hasAvailableAgent = counters.some(
    counter =>
      counter.serviceId === service.id &&
      counter.isActive &&
      agents.some(
        agent =>
          agent.id === (counter as any).id_agent_actuel &&
          agent.isOnline &&
          !agent.est_banni
      )
  )

  if (!hasAvailableAgent) return { isEffectivelyActive: false, closingReason: "Aucun Guichet Dispo" }

  return { isEffectivelyActive: true, closingReason: "" }
}

export default function ServicesView({ isAdmin = false }: ServicesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, user, tickets, counters, agents, fetchTickets } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCounter, setSelectedCounter] = useState<any>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({ nom: "", prenom: "" })
  const [newTicket, setNewTicket] = useState<{ code: string; service: string; counterName?: string; position?: number } | null>(null)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [localTakenServices, setLocalTakenServices] = useState<string[]>([])

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isRealPatient = user && user.role?.toLowerCase() === "patient"

  const handleTakeTicket = async (service: Service) => {
    const { isEffectivelyActive, closingReason } = getServiceAvailability(service, counters, agents)

    if (!isEffectivelyActive) {
      toast.error("Service indisponible", { description: closingReason })
      return
    }

    const activeCounters = counters.filter(c => c.serviceId === service.id && c.isActive)

    if (!isAdmin && isRealPatient) {
      const hasActiveTicket =
        localTakenServices.includes(service.id) ||
        tickets.some(
          t =>
            t.userId === user.id &&
            t.service?.id === service.id &&
            (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
        )

      if (hasActiveTicket) {
        toast.error("Demande refusée", {
          description: `Vous avez déjà un ticket actif pour le service ${service.name}.`,
        })
        return
      }
    }

    let targetCounter = activeCounters[0]
    let minWaiting = Infinity
    activeCounters.forEach(counter => {
      const w = tickets.filter(t => t.counterId === counter.id && t.statut === "waiting").length
      if (w < minWaiting) { minWaiting = w; targetCounter = counter }
    })

    setSelectedService(service)
    setSelectedCounter(targetCounter)

    if (!isAdmin && isRealPatient) {
      try {
        const { data: existingActiveTickets, error: checkError } = await supabase
          .from("ticket")
          .select("id")
          .eq("id_patient_connecte", user.id)
          .eq("id_service", service.id)
          .in("statut", ["En attente", "Appelé", "En cours", "waiting", "called", "serving"])

        if (checkError) throw checkError

        if (existingActiveTickets && existingActiveTickets.length > 0) {
          setLocalTakenServices(prev => [...prev, service.id])
          toast.error("Demande refusée", { description: "Un ticket actif existe déjà sur le serveur." })
          return
        }

        const currentPosition = calculateQueue(service.id, tickets) + 1
        const servicePrefix = service.name.substring(0, 1).toUpperCase()
        const ticketNumber = generateUniqueTicketCode(servicePrefix, currentPosition)

        const { data, error } = await supabase
          .from("ticket")
          .insert([{
            code: ticketNumber,
            id_service: service.id,
            id_guichet: targetCounter.id,
            id_patient_connecte: user.id,
            statut: "waiting",
            patient_nom: `${user.firstName || ''} ${user.name || ''}`.trim(),
            telephone_patient: user.phone || null,
            position: currentPosition,
          }])
          .select()
          .single()

        if (error) throw error

        await fetchTickets()
        setLocalTakenServices(prev => [...prev, service.id])
        setNewTicket({ code: data.code, service: service.name, counterName: targetCounter.name, position: currentPosition })
        setShowSuccessModal(true)
        toast.success("Ticket créé avec succès !")
        router.refresh()

      } catch (err) {
        console.error(err)
        toast.error("Erreur système", { description: "Impossible d'enregistrer votre ticket." })
      }
    } else {
      setShowTicketModal(true)
    }
  }

  const handleSubmitForm = async () => {
    if (!selectedService || !selectedCounter || !formData.nom || !formData.prenom) return

    const fullFormName = `${formData.prenom} ${formData.nom}`.trim()

    try {
      const { data: existingActiveAnonTickets, error: checkAnonError } = await supabase
        .from("ticket")
        .select("id")
        .ilike("patient_nom", fullFormName)
        .eq("id_service", selectedService.id)
        .in("statut", ["En attente", "Appelé", "En cours", "waiting", "called", "serving"])

      if (checkAnonError) throw checkAnonError

      if (existingActiveAnonTickets && existingActiveAnonTickets.length > 0 && !isAdmin) {
        toast.error("Nom déjà enregistré", {
          description: `Un ticket actif existe déjà au nom de ${fullFormName} pour ce service.`,
        })
        return
      }

      const currentPosition = calculateQueue(selectedService.id, tickets) + 1
      const servicePrefix = selectedService.name.substring(0, 1).toUpperCase()
      const ticketNumber = generateUniqueTicketCode(servicePrefix, currentPosition)

      const { data, error } = await supabase
        .from("ticket")
        .insert([{
          code: ticketNumber,
          id_service: selectedService.id,
          id_guichet: selectedCounter.id,
          id_patient_connecte: null,
          statut: "waiting",
          patient_nom: fullFormName,
        }])
        .select()
        .single()

      if (error) throw error

      await fetchTickets()

      if (!isAdmin) setLocalTakenServices(prev => [...prev, selectedService.id])

      setNewTicket({ code: data.code, service: selectedService.name, counterName: selectedCounter.name, position: currentPosition })
      setShowTicketModal(false)
      setShowSuccessModal(true)
      setFormData({ nom: "", prenom: "" })
      toast.success("Ticket créé !")
      router.refresh()

    } catch (err) {
      console.error(err)
      toast.error("Erreur", { description: "Échec de la validation du ticket." })
    }
  }

  useEffect(() => {
    const serviceId = searchParams.get("scan") || searchParams.get("service")
    if (serviceId && services.length > 0 && !selectedService) {
      const targetService = services.find(s => s.id === serviceId)
      if (targetService) {
        const { isEffectivelyActive, closingReason } = getServiceAvailability(targetService, counters, agents)
        if (isEffectivelyActive) {
          handleTakeTicket(targetService)
        } else {
          toast.error("Service indisponible", { description: closingReason })
        }
        router.replace(window.location.pathname)
      }
    }
  }, [searchParams, services, selectedService, counters, agents])

  useEffect(() => {
    if (showScannerModal && services.length > 0) {
      setScannerError(null)
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader")
        html5QrCodeRef.current = html5QrCode

        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            const serviceKey = extractServiceKey(decodedText)
            const matchedService = services.find(s => s.id === serviceKey)

            if (!matchedService) {
              setScannerError(`QR code invalide ou service non reconnu. (Code détecté : ${serviceKey.substring(0, 40)})`)
              return
            }

            // CORRIGÉ : on utilise getServiceAvailability — la même fonction que la liste.
            // Avant, le scanner n'appliquait pas la vérification de l'agent, ce qui
            // permettait de scanner un service "Aucun guichet dispo" et de prendre quand
            // même un ticket dessus.
            const { isEffectivelyActive, closingReason } = getServiceAvailability(matchedService, counters, agents)

            if (!isEffectivelyActive) {
              setScannerError(`Le service ${matchedService.name} est indisponible : ${closingReason}.`)
              return
            }

            const hasTicketLocal =
              !isAdmin &&
              isRealPatient &&
              (localTakenServices.includes(matchedService.id) ||
                tickets.some(
                  t =>
                    t.userId === user?.id &&
                    t.service?.id === matchedService.id &&
                    (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
                ))

            if (hasTicketLocal) {
              setScannerError(`Vous avez déjà un ticket actif pour le service ${matchedService.name}.`)
              return
            }

            html5QrCode.stop().then(() => {
              setShowScannerModal(false)
              handleTakeTicket(matchedService)
            }).catch(err => console.error(err))
          },
          () => {}
        ).catch(err => {
          console.error(err)
          setScannerError("Impossible d'accéder à la caméra de votre appareil.")
        })
      }, 300)

      return () => clearTimeout(timer)

    } else if (showScannerModal && services.length === 0) {
      setScannerError("Chargement des services en cours, veuillez patienter...")
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error(err))
      }
    }
  }, [showScannerModal, services, tickets, localTakenServices, user, counters, agents])

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Services hospitaliers</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Gérer les services hospitaliers / Mode Borne" : "Choisissez un service pour prendre un ticket d'attente"}
              </p>
            </div>
            {isAdmin && (
              <Button className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90">
                <Plus className="size-4" /> Nouveau Service
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-xl bg-accent/50 pl-10"
              />
            </div>
            <Button
              onClick={() => setShowScannerModal(true)}
              className="h-12 w-12 rounded-xl bg-emerald text-white hover:bg-emerald/90 shrink-0"
              size="icon"
            >
              <QrCode className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        <div className="grid gap-4 sm:grid-cols-2 auto-rows-fr">
          <AnimatePresence mode="popLayout">
            {filteredServices
              .map(service => {
                const { isEffectivelyActive, closingReason } = getServiceAvailability(service, counters, agents)
                const waitingCount = calculateQueue(service.id, tickets)
                const estimatedWait = waitingCount > 0 ? waitingCount * 8 : 5

                const hasTicketLocal =
                  !isAdmin &&
                  isRealPatient &&
                  (localTakenServices.includes(service.id) ||
                    tickets.some(
                      t =>
                        t.userId === user?.id &&
                        t.service?.id === service.id &&
                        (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
                    ))

                return { service, isEffectivelyActive, closingReason, waitingCount, estimatedWait, hasTicketLocal }
              })
              .sort((a, b) => (a.isEffectivelyActive === b.isEffectivelyActive ? 0 : a.isEffectivelyActive ? -1 : 1))
              .map(({ service, isEffectivelyActive, closingReason, waitingCount, estimatedWait, hasTicketLocal }, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="h-full"
                >
                  <Card
                    onClick={() => isEffectivelyActive && !hasTicketLocal && handleTakeTicket(service)}
                    className={`group border border-border/50 transition-all h-full flex flex-col ${
                      isEffectivelyActive && !hasTicketLocal
                        ? "cursor-pointer hover:border-emerald hover:shadow-lg select-none"
                        : "bg-accent/10"
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                          isEffectivelyActive && !hasTicketLocal
                            ? "bg-emerald-light text-emerald group-hover:bg-emerald group-hover:text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {iconMap[service.icon] || <Stethoscope className="size-6" />}
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full min-h-[135px]">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-foreground line-clamp-1">{service.name}</h3>
                              {!isEffectivelyActive && !hasTicketLocal && (
                                <Badge variant="destructive" className="gap-1 px-2 py-0.5 text-[10px] font-bold shrink-0">
                                  <Ban className="size-3" /> {closingReason}
                                </Badge>
                              )}
                              {hasTicketLocal && (
                                <Badge className="gap-1 px-2 py-0.5 text-[10px] font-bold shrink-0 bg-amber-500 text-white">
                                  Actif
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>

                            <div className="mt-3 flex items-center gap-4 min-h-[20px]">
                              {isEffectivelyActive ? (
                                <>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" />
                                    <span>~{estimatedWait} min</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Users className="size-3.5" />
                                    <span>{waitingCount} en attente</span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground/50 italic">Indisponible</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-4">
                            <Button
                              disabled={!isEffectivelyActive || hasTicketLocal}
                              className={`w-full pointer-events-none ${
                                hasTicketLocal
                                  ? "bg-amber-500 text-white"
                                  : isEffectivelyActive
                                  ? "bg-emerald text-primary-foreground group-hover:bg-emerald/90"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {hasTicketLocal
                                ? "Ticket en cours"
                                : isEffectivelyActive
                                ? "Prendre un ticket"
                                : closingReason}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Scanner QR Code */}
      <Dialog open={showScannerModal} onOpenChange={setShowScannerModal}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <QrCode className="size-5 text-emerald" /> Scanner le QR Code du Service
            </DialogTitle>
          </DialogHeader>
          <div className="relative my-4 aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 border flex flex-col items-center justify-center">
            <div id="reader" className="w-full h-full"></div>
          </div>
          {scannerError && <p className="text-center text-xs font-semibold text-destructive pb-2">{scannerError}</p>}
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowScannerModal(false)}>Fermer</Button>
        </DialogContent>
      </Dialog>

      {/* Formulaire Patient Anonyme / Admin */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre un ticket d'accès</DialogTitle>
            <DialogDescription>Veuillez renseigner les informations du patient pour le service : {selectedService?.name}</DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Prénom du Patient</FieldLabel>
              <Input
                placeholder="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Nom du Patient</FieldLabel>
              <Input
                placeholder="Nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </Field>
          </FieldGroup>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowTicketModal(false)}>Annuler</Button>
            <Button
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleSubmitForm}
              disabled={!formData.nom || !formData.prenom}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Succès Génération Ticket */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-emerald text-4xl text-primary-foreground">✓</div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Ticket généré !</DialogTitle>
            <DialogDescription className="text-center">Le ticket a été validé pour le service {newTicket?.service}</DialogDescription>
          </DialogHeader>
          <div className="my-6 rounded-2xl bg-emerald-light p-6">
            <p className="text-sm text-emerald">Numéro de passage</p>
            <p className="text-4xl font-bold text-emerald">{newTicket?.code}</p>
            <p className="text-sm font-semibold text-emerald/90 mt-2">Position dans la file : Rang {newTicket?.position}</p>
            {newTicket?.counterName && <p className="text-xs text-emerald/80 mt-1">Dirigez-vous vers le : {newTicket.counterName}</p>}
          </div>
          <Button
            className="mt-6 w-full bg-emerald text-primary-foreground hover:bg-emerald/90"
            onClick={() => {
              setShowSuccessModal(false)
              if (!isAdmin) router.push("/patient/tickets")
            }}
          >
            {isAdmin ? "Prendre un autre ticket" : "Suivre mon rang d'attente"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}