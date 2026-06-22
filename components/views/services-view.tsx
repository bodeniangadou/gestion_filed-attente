"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Users, Stethoscope, Siren, ScanLine, FlaskConical, Pill, HeartPulse, Plus, QrCode, X, Ban } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { useRouter, useSearchParams } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode" 

import { useApp, Service } from "@/lib/app-context"     

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

export default function ServicesView({ isAdmin = false }: ServicesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, user, takeTicket } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({ nom: "", prenom: "" })
  const [newTicket, setNewTicket] = useState<{ number: string; service: string } | null>(null)

  // États pour le Scanner Interne
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ACTION CENTRALISÉE DE PRISE DE TICKET
  const handleTakeTicket = (service: Service) => {
    // Double sécurité : On bloque l'action si le service est inactif
    if (!service.isActive) {
      alert(`Le service ${service.name} est actuellement fermé ou indisponible.`)
      return
    }

    setSelectedService(service)
    if (user && user.role === "patient") {
      const ticket = takeTicket(service, user.name, user.firstName)
      setNewTicket({ number: ticket.number, service: service.name })
      setShowSuccessModal(true)
    } else {
      setShowTicketModal(true)
    }
  }

  // INTERCEPTION AUTOMATIQUE DU PARAMÈTRE URL (?scan=...)
 useEffect(() => {
  const serviceId = searchParams.get("scan") || searchParams.get("service");

  // AJOUT : Vérification si le service est déjà sélectionné pour éviter la boucle
  if (serviceId && services.length > 0 && !selectedService) {
    const targetService = services.find(
      s => s.id === serviceId || s.name.toLowerCase() === serviceId.toLowerCase()
    );

    if (targetService) {
      if (targetService.isActive) {
        // On exécute l'action
        handleTakeTicket(targetService);
        
        // On nettoie l'URL IMMÉDIATEMENT pour que ce bloc ne se relance plus
        router.replace(window.location.pathname);
      } else {
        alert(`Le service ${targetService.name} est fermé.`);
        router.replace(window.location.pathname);
      }
    }
  }
  // On retire 'router' et 'searchParams' des dépendances si nécessaire, 
  // mais ici le 'selectedService' va bloquer la boucle.
}, [searchParams, services, selectedService]);

  // GESTION DU SCANNER INTERNE (CAMÉRA)
  useEffect(() => {
    if (showScannerModal) {
      setScannerError(null)
      setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader")
        html5QrCodeRef.current = html5QrCode

        html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            let serviceKey = decodedText
            if (decodedText.includes("?scan=")) {
              const urlParams = new URLSearchParams(decodedText.split("?")[1])
              serviceKey = urlParams.get("scan") || decodedText
            }

            const matchedService = services.find(
              s => s.id === serviceKey || s.name.toLowerCase() === serviceKey.toLowerCase()
            )

            if (matchedService) {
              // SÉCURITÉ SCANNER : On vérifie l'état du service scanné en direct
              if (matchedService.isActive) {
                html5QrCode.stop().then(() => {
                  setShowScannerModal(false)
                  handleTakeTicket(matchedService)
                }).catch(err => console.error(err))
              } else {
                setScannerError(`Le service ${matchedService.name} est fermé. Impossible de prendre un ticket.`)
              }
            } else {
              setScannerError("Service hospitalier introuvable ou QR code invalide.")
            }
          },
          () => {}
        ).catch((err) => {
          console.error("Erreur de caméra:", err)
          setScannerError("Impossible d'accéder à votre caméra. Veuillez autoriser l'accès.")
        })
      }, 300)
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error(err))
      }
    }
  }, [showScannerModal, services])

  const handleSubmitForm = () => {
    if (!selectedService || !formData.nom || !formData.prenom) return
    const ticket = takeTicket(selectedService, formData.nom, formData.prenom)
    setNewTicket({ number: ticket.number, service: selectedService.name })
    setShowTicketModal(false)
    setShowSuccessModal(true)
    setFormData({ nom: "", prenom: "" })
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Services</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Gérer les services hospitaliers" : "Choisissez un service pour prendre un ticket"}
              </p>
            </div>
            {isAdmin && (
              <Button className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90">
                <Plus className="size-4" />
                Nouveau
              </Button>
            )}
          </div>
          
          {/* Barre de Recherche + Bouton Scan */}
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
              title="Scanner un QR Code"
            >
              <QrCode className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-4xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredServices            
            .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
          .map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                {/* AJUSTEMENT : On grise la carte (opacity-65) et retire le survol si inactif */}
                <Card className={`group border border-border/50 transition-all ${
                  service.isActive 
                    ? "cursor-pointer hover:border-emerald hover:shadow-lg" 
                    : "opacity-65 cursor-not-allowed bg-accent/20"
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* AJUSTEMENT : Icône grise si service fermé */}
                      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                        service.isActive 
                          ? "bg-emerald-light text-emerald group-hover:bg-emerald group-hover:text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {iconMap[service.icon] || <Stethoscope className="size-6" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          {/* AJUSTEMENT : Badge Statut Fermé/Indisponible */}
                          {!service.isActive && (
                            <Badge variant="destructive" className="gap-1 px-2 py-0.5 text-[10px] font-bold shrink-0">
                              <Ban className="size-3" /> Fermé
                            </Badge>
                          )}
                        </div>
                        
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                        
                        {/* On affiche les métriques d'attente uniquement si le service est actif */}
                        {service.isActive && (
                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span>~{service.waitTime} min</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="size-3.5" />
                              <span>{service.currentQueue} en attente</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          {/* AJUSTEMENT : Bouton désactivé et relooké si service inactif */}
                          <Button 
                            onClick={() => service.isActive && handleTakeTicket(service)}
                            disabled={!service.isActive}
                            className={`flex-1 ${
                              service.isActive 
                                ? "bg-emerald text-primary-foreground hover:bg-emerald/90" 
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            {service.isActive ? "Prendre un ticket" : "Service Indisponible"}
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

        {filteredServices.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Aucun service trouvé</p>
            <p className="text-sm text-muted-foreground">Essayez avec d&apos;autres termes de recherche</p>
          </div>
        )}
      </div>

      {/* MODAL DU SCANNER CAMERA */}
      <Dialog open={showScannerModal} onOpenChange={(open) => {
        if (!open) setShowScannerModal(false);
      }}>
        <DialogContent className="sm:max-w-md overflow-hidden bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <QrCode className="size-5 text-emerald" />
              Scanner le QR Code du service
            </DialogTitle>
            <DialogDescription>
              Placez le QR Code affiché dans le service en face de la caméra de votre smartphone.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-4 aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 border border-border/40 flex flex-col items-center justify-center">
            <div id="reader" className="w-full h-full"></div>
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
              <div className="w-[220px] h-[220px] border-2 border-dashed border-emerald relative animate-pulse">
                <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </div>
            </div>
          </div>

          {scannerError && (
            <p className="text-center text-xs font-semibold text-destructive px-2 pb-2">
              {scannerError}
            </p>
          )}

          <Button 
            variant="outline" 
            className="w-full rounded-xl border-border/70 hover:bg-accent" 
            onClick={() => setShowScannerModal(false)}
          >
            Fermer l'appareil photo
          </Button>
        </DialogContent>
      </Dialog>

      {/* Ticket Form Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre un ticket</DialogTitle>
            <DialogDescription>
              Veuillez renseigner vos informations pour {selectedService?.name}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Prénom</FieldLabel>
              <Input
                placeholder="Votre prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Nom</FieldLabel>
              <Input
                placeholder="Votre nom"
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

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-emerald">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="text-4xl text-primary-foreground">✓</motion.div>
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Ticket créé !</DialogTitle>
            <DialogDescription className="text-center">Votre ticket pour {newTicket?.service}</DialogDescription>
          </DialogHeader>
          <div className="my-6 rounded-2xl bg-emerald-light p-6">
            <p className="text-sm text-emerald">Votre numéro</p>
            <p className="text-4xl font-bold text-emerald">{newTicket?.number}</p>
          </div>
          <Badge variant="secondary" className="mx-auto">Vous recevrez une notification quand ce sera votre tour</Badge>
          <Button className="mt-6 w-full bg-emerald text-primary-foreground hover:bg-emerald/90" onClick={() => router.push("/patient/tickets")}>
            Suivre mon ticket
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}