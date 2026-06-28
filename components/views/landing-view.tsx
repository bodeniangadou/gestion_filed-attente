"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import * as LucideIcons from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  UserCheck,
  Eye,
  QrCode,
  Building2,
  Clock,
  Users,
  CheckCircle2,
  Smartphone,
  Bell,
  Shield,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Siren,
  ScanLine,
  FlaskConical,
  Pill,
  HeartPulse,
  ArrowRight,
  Star,
  LogIn,
  Menu,
  X,
  UserPlus,
  RefreshCw
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useApp, Service, Counter } from "@/lib/app-context"
import { TicketTrackingModal } from "./TicketTrackingModal"

interface LandingViewProps {
  onNavigate: (tab: string) => void
  onScanQR: () => void
  onTakeTicket: () => void
  onLogin: () => void
}

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const LucideIcon = (LucideIcons as any)[name] || LucideIcons.Building2
  return <LucideIcon className={className} />
}

const features = [
  {
    icon: <Smartphone className="size-6" />,
    title: "Prise de ticket en ligne",
    description: "Plus besoin de faire la queue physiquement. Prenez votre ticket depuis votre téléphone."
  },
  {
    icon: <Bell className="size-6" />,
    title: "Notifications en temps réel",
    description: "Recevez une alerte quand votre tour approche. Ne manquez plus jamais votre appel."
  },
  {
    icon: <Clock className="size-6" />,
    title: "Estimation du temps d'attente",
    description: "Consultez le temps d'attente estimé et planifiez votre visite en conséquence."
  },
  {
    icon: <Shield className="size-6" />,
    title: "Sécurité et confidentialité",
    description: "Vos données sont protégées et traitées avec la plus grande confidentialité."
  }
]

const testimonials = [
  {
    name: "Aminata D.",
    text: "Grâce à Rang+, je n'ai plus besoin d'arriver à 6h du matin. Je prends mon ticket depuis chez moi !",
    rating: 5
  },
  {
    name: "Oumar T.",
    text: "Application très pratique. Je suis notifié quand mon tour approche, c'est révolutionnaire.",
    rating: 5
  },
  {
    name: "Fatoumata K.",
    text: "Le suivi en temps réel me permet de mieux gérer mon temps. Merci Rang+ !",
    rating: 5
  }
]

// Décide si un service est réellement actif (horaires + guichet actif disponible)
const checkServiceStatus = (service: Service, counters: Counter[]) => {
  if (!service?.openTime || !service?.closeTime) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = service.openTime.split(':').map(Number)
  const [endH, endM] = service.closeTime.split(':').map(Number)

  const openMinutes = startH * 60 + startM
  const closeMinutes = endH * 60 + endM

  const isTimeValid = currentMinutes >= openMinutes && currentMinutes <= closeMinutes

  const hasActiveCounter = counters.some(c =>
    c.serviceId === service.id &&
    c.isActive
  )

  return isTimeValid && hasActiveCounter
}

// Génère un code ticket unique, même format que ServicesView (cohérence dans toute l'app)
function generateUniqueTicketCode(serviceName: string): string {
  const firstLetter = serviceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 1)
    .toUpperCase()

  const num1 = Math.floor(10 + Math.random() * 90)
  const num2 = Math.floor(10 + Math.random() * 90)

  return `${firstLetter}-${num1}-${num2}`
}

const calculateQueuePosition = (serviceId: string, allTickets: { service?: { id?: string }; statut: string }[]) => {
  return allTickets.filter(t => t.service?.id === serviceId && t.statut === "waiting").length
}

export function LandingView({ onNavigate, onScanQR, onTakeTicket, onLogin }: LandingViewProps) {
  const { services, counters, tickets, fetchTickets } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({ nomComplet: "", telephone: "" })

  // Ticket anonyme suivi via son ID réel en BDD (pas via user/currentTicket,
  // puisque la landing page sert des visiteurs sans compte connecté)
  const [trackedTicketId, setTrackedTicketId] = useState<string | null>(null)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Récupère l'ID du ticket anonyme suivi depuis le localStorage au montage
  useEffect(() => {
    const savedId = localStorage.getItem("rang_plus_anonymous_ticket_id")
    if (savedId) {
      setTrackedTicketId(savedId)
    }
  }, [])

  useEffect(() => {
    if (trackedTicketId) {
      localStorage.setItem("rang_plus_anonymous_ticket_id", trackedTicketId)
    } else {
      localStorage.removeItem("rang_plus_anonymous_ticket_id")
    }
  }, [trackedTicketId])

  // Ticket suivi = celui dont l'id correspond, retrouvé dans la liste temps réel
  // du context (`tickets` est rechargé par le canal Realtime sur la table "ticket").
  // Si le ticket n'est plus actif (terminé/annulé/absent), on arrête de le suivre.
  const trackedTicket = useMemo(() => {
    if (!trackedTicketId) return null
    const found = tickets.find(t => t.id === trackedTicketId)
    if (!found) return null
    if (!["waiting", "called", "serving"].includes(found.statut)) return null
    return found
  }, [trackedTicketId, tickets])

  // Objet compatible avec ce que LandingView affichait avant (number/service/waitTime/queuePos)
  const generatedTicket = trackedTicket
    ? {
        id: trackedTicket.id,
        number: trackedTicket.number,
        service: trackedTicket.service?.name || "",
        waitTime: Math.max(5, (trackedTicket.position || 1) * 5),
        queuePos: trackedTicket.position,
        statut: trackedTicket.statut,
        counterName: trackedTicket.counterName,
        phoneNumber: trackedTicket.phone,
      }
    : null

  // Si le ticket suivi disparaît de la liste (terminé/annulé), on nettoie le suivi local
  useEffect(() => {
    if (trackedTicketId && !trackedTicket) {
      setTrackedTicketId(null)
    }
  }, [trackedTicketId, trackedTicket])

  const totalWaiting = tickets.filter(t => t.statut === "waiting").length

  const servicesWithStatus = useMemo(() => {
    return services.map(s => ({
      ...s,
      isActive: checkServiceStatus(s, counters)
    }))
  }, [services, counters])

  const handleOpenTicketModal = (service: Service) => {
    if (!service.isActive) return
    setSelectedService(service)
    setShowTicketModal(true)
  }

  // CORRIGÉ : Ouverture automatique du modal via ?service=xxx dans l'URL (venant du
  // scan d'un QR code, soit directement, soit via la redirection de /scanner/[serviceId]).
  // On vérifie désormais le statut RÉEL et dynamique du service (horaires + guichet actif
  // disponible, via servicesWithStatus) plutôt que le simple champ `isActive` statique de
  // la base — pour rester cohérent avec ce qui est affiché ailleurs sur la page : un
  // service marqué actif en base mais hors horaires ou sans guichet ne doit pas ouvrir
  // le formulaire de prise de ticket.
  useEffect(() => {
    if (services.length === 0 || selectedService) return

    const params = new URLSearchParams(window.location.search)
    const serviceId = params.get("service") || params.get("scan")
    if (!serviceId) return

    const serviceToSelect = services.find(s => s.id === serviceId)
    if (!serviceToSelect) return

    const isReallyActive = servicesWithStatus.find(s => s.id === serviceId)?.isActive ?? false

    if (isReallyActive) {
      handleOpenTicketModal(serviceToSelect)
    } else {
      toast.error("Service indisponible", {
        description: `Le service ${serviceToSelect.name} n'est pas disponible actuellement (fermé, hors horaires, ou aucun guichet actif).`
      })
    }

    window.history.replaceState({}, document.title, window.location.pathname)
  }, [services, servicesWithStatus, selectedService])

  const activeServices = services.filter(s => s.isActive)
  const avgWaitTime = activeServices.length > 0
    ? Math.round(
        activeServices.reduce((acc, s) => {
          const queueForService = tickets.filter(t => t.service?.id === s.id && t.statut === "waiting").length
          return acc + (queueForService * 5)
        }, 0) / activeServices.length
      )
    : 0

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Vérification anti-doublon en BDD (nom ET téléphone) avant insertion réelle
  // dans Supabase + resynchronisation, exactement comme ServicesView.
  const handleConfirmTicket = async () => {
    if (!selectedService || !formData.nomComplet || !formData.telephone || isSubmitting) return

    setIsSubmitting(true)

    try {
      const fullName = formData.nomComplet.trim()
      const phoneValue = formData.telephone.trim()

      // Vérifie qu'aucun ticket actif n'existe déjà pour ce nom sur ce service
      const { data: existingActiveTickets, error: checkError } = await supabase
        .from("ticket")
        .select("id")
        .ilike("patient_nom", fullName)
        .eq("id_service", selectedService.id)
        .in("statut", ["En attente", "Appelé", "En cours", "waiting", "called", "serving"])

      if (checkError) throw checkError

      if (existingActiveTickets && existingActiveTickets.length > 0) {
        toast.error("Ticket déjà actif", {
          description: `Un ticket actif existe déjà au nom de ${fullName} pour le service ${selectedService.name}.`
        })
        setIsSubmitting(false)
        return
      }

      // Vérifie aussi par numéro de téléphone, pour éviter le contournement par nom légèrement différent
      const { data: existingPhoneTickets, error: checkPhoneError } = await supabase
        .from("ticket")
        .select("id")
        .eq("telephone_patient", phoneValue)
        .eq("id_service", selectedService.id)
        .in("statut", ["En attente", "Appelé", "En cours", "waiting", "called", "serving"])

      if (checkPhoneError) throw checkPhoneError

      if (existingPhoneTickets && existingPhoneTickets.length > 0) {
        toast.error("Ticket déjà actif", {
          description: "Ce numéro de téléphone a déjà un ticket actif pour ce service."
        })
        setIsSubmitting(false)
        return
      }

      // Trouve un guichet actif disponible pour ce service
      const activeCounters = counters.filter(c => c.serviceId === selectedService.id && c.isActive)
      if (activeCounters.length === 0) {
        toast.error("Service indisponible", {
          description: "Aucun guichet n'est disponible pour ce service actuellement."
        })
        setIsSubmitting(false)
        return
      }

      let targetCounter = activeCounters[0]
      let minWaiting = Infinity
      activeCounters.forEach((counter) => {
        const waitingAtThisCounter = tickets.filter(
          (t) => t.counterId === counter.id && t.statut === "waiting"
        ).length
        if (waitingAtThisCounter < minWaiting) {
          minWaiting = waitingAtThisCounter
          targetCounter = counter
        }
      })

      const ticketNumber = generateUniqueTicketCode(selectedService.name)

      const { data, error } = await supabase
        .from("ticket")
        .insert([
          {
            code: ticketNumber,
            id_service: selectedService.id,
            id_guichet: targetCounter.id,
            id_patient_connecte: null,
            statut: "waiting",
            patient_nom: fullName,
            telephone_patient: phoneValue,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Resynchronisation immédiate du state global temps réel
      await fetchTickets()

      // On suit ce ticket par son vrai ID BDD désormais
      setTrackedTicketId(data.id)

      setShowTicketModal(false)
      setShowSuccessModal(true)
      setFormData({ nomComplet: "", telephone: "" })
      toast.success("Ticket créé avec succès !")

    } catch (err) {
      console.error(err)
      toast.error("Erreur", { description: "Impossible d'enregistrer votre ticket. Veuillez réessayer." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseTicketModal = (open: boolean) => {
    if (!open) {
      setShowTicketModal(false)
      setFormData({ nomComplet: "", telephone: "" })
    } else {
      setShowTicketModal(true)
    }
  }

  // Annulation réelle en BDD du ticket suivi
  const handleCancelTrackedTicket = async () => {
    if (!trackedTicketId) return
    try {
      const { error } = await supabase
        .from("ticket")
        .update({ statut: "cancelled" })
        .eq("id", trackedTicketId)

      if (error) throw error

      await fetchTickets()
      toast.success("Ticket annulé")
    } catch (err) {
      console.error(err)
      toast.error("Erreur", { description: "Impossible d'annuler le ticket." })
    } finally {
      setTrackedTicketId(null)
      setShowTrackingModal(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="flex flex-col items-start">
              <img src="/placeholder-logo.svg" alt="Rang+" className="h-8 w-auto" />
              <span className="text-[11px] font-semibold text-[#1e293b]/70 italic tracking-tight mt-0.5">
                Hôpital du Mali
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </button>

            {generatedTicket ? (
              <button
                onClick={() => setShowTrackingModal(true)}
                className="text-sm font-semibold text-primary animate-pulse flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className="size-3.5 animate-spin text-primary" />
                Suivre mon ticket ({generatedTicket.number})
              </button>
            ) : (
              <button
                onClick={onTakeTicket}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Prendre un ticket
              </button>
            )}

            <button onClick={onScanQR} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Scanner QR
            </button>
            <button
              onClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin} className="gap-2 text-sm font-medium">
              <LogIn className="size-4" /> Connexion
            </Button>
            <Button onClick={onLogin} className="gap-2 rounded-xl">
              <UserPlus className="size-4" /> Inscription
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center size-10 rounded-xl hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col p-4 gap-2">
              <a
                href="#services-section"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
          >
                <Stethoscope className="size-5 text-primary" />
                Services
              </a>
              <button
                onClick={() => { onTakeTicket(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
              >
                <CheckCircle2 className="size-5 text-primary" />
                Prendre un ticket
              </button>
              <button
                onClick={() => { onScanQR(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
              >
                <QrCode className="size-5 text-primary" />
                Scanner QR Code
              </button>
              <div className="border-t border-border my-2" />
              <Button
                variant="outline"
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="w-full gap-2 justify-center h-12 rounded-xl"
              >
                <LogIn className="size-4" /> Connexion
              </Button>
              <Button
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="w-full gap-2 justify-center h-12 rounded-xl"
              >
                <UserPlus className="size-4" /> Inscription
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-6 py-16 lg:py-24">
          <motion.div initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex flex-col items-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
                Plateforme officielle de gestion des files d&apos;attente
              </Badge>
            </div>

            <motion.h1
              initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-6xl text-balance"
            >
              Bienvenue à l&apos; <span className="text-primary">Hôpital du Mali</span>
            </motion.h1>

            <motion.p
              initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 text-lg text-muted-foreground lg:text-xl text-pretty max-w-2xl mx-auto"
            >
              Avec <span className="font-semibold text-primary">Rang+</span>, prenez votre ticket en ligne
              et suivez votre position dans la file d&apos;attente en temps réel.
              Fini les longues heures d&apos;attente inutiles !
            </motion.p>

            <motion.div
              initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })}
                className="h-14 px-8 gap-3 rounded-2xl bg-primary text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all w-full sm:w-auto"
              >
                <CheckCircle2 className="size-5" /> Prendre un ticket
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onScanQR}
                className="h-14 px-8 gap-3 rounded-2xl border-2 text-lg font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all w-full sm:w-auto"
              >
                <QrCode className="size-5" /> Scanner QR Code
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS CARDS */}
      <section className="px-6 -mt-4 lg:mt-0">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="relative mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="size-6 text-primary" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalWaiting}</p>
                  <p className="text-sm text-muted-foreground">Patients en attente</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{avgWaitTime} min</p>
                  <p className="text-sm text-muted-foreground">Temps moyen</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{services.length}</p>
                  <p className="text-sm text-muted-foreground">Services actifs</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">24/7</p>
                  <p className="text-sm text-muted-foreground">Disponibilité</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services-section" className="px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">Nos Services Médicaux</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Recherchez ou scanner le service dont vous avez besoin pour prendre votre ticket immédiatement.
            </p>
          </motion.div>

          <div className="relative mb-8">
  {/* Icône de recherche à gauche */}
  <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
  
  <Input
    placeholder="Rechercher un service..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    /* On change 'pr-4' en 'pr-14' pour laisser la place à l'icône de droite */
    className="h-14 rounded-2xl border-2 bg-card pl-12 pr-14 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
  />

  {/* Icône de scan à droite */}
  <button 
    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
    onClick={onScanQR}
  >
    <QrCode className="size-6" />
  </button>
</div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices
              .map((service) => ({
                ...service,
                isActive: servicesWithStatus.find(s => s.id === service.id)?.isActive ?? service.isActive
              }))
              .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
              .map((service) => (
                <motion.div key={service.id} variants={itemVariants}>
                  <Card
                    className={`group border-2 bg-card flex flex-col h-full justify-between transition-all ${service.isActive
                        ? "cursor-pointer border-transparent hover:border-primary hover:shadow-lg"
                        : "opacity-65 border-border bg-muted/20 cursor-not-allowed"
                      }`}
                    onClick={() => handleOpenTicketModal(service)}
                  >
                    <CardContent className="p-5 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`flex size-12 items-center justify-center rounded-xl transition-colors ${service.isActive
                              ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                            }`}>
                            <DynamicIcon name={service.icon} className="size-5" />
                          </div>
                          <Badge
                            variant={service.isActive ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {service.isActive
                              ? `${tickets.filter(t => t.service?.id === service.id && t.statut === "waiting").length} en attente`
                              : "Fermé"
                            }
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="size-4" />
                          <span>{service.isActive ? `~${service.waitTime} min` : "Indisponible"}</span>
                        </div>
                        {service.isActive ? (
                          <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Prendre ticket <ChevronRight className="size-4" />
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-destructive">Fermé</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </motion.div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => onNavigate("services")} className="gap-2 rounded-xl">
              Voir tous les services <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* DIALOG : SAISIE INFOS PATIENT */}
      <Dialog open={showTicketModal} onOpenChange={handleCloseTicketModal}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Prise de ticket instantanée</DialogTitle>
            <DialogDescription>
              Service sélectionné : <span className="font-semibold text-primary">{selectedService?.name}</span>.
              Veuillez entrer vos informations pour recevoir votre numéro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Nom complet</label>
              <Input
                placeholder="Ex: Aminata Diallo"
                value={formData.nomComplet}
                onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Numéro de téléphone</label>
              <Input
                type="tel"
                placeholder="Ex: 76XXXXXX"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="h-12 rounded-xl border-2"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => handleCloseTicketModal(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold"
              onClick={handleConfirmTicket}
              disabled={!formData.nomComplet || !formData.telephone || isSubmitting}
            >
              {isSubmitting ? "Validation..." : "Confirmer mon rang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG : TICKET ENREGISTRÉ AVEC SUCCÈS */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center rounded-2xl bg-card">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Ticket Enregistré !</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Votre rang a bien été calculé pour le service {generatedTicket?.service}.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 rounded-2xl bg-primary/5 p-6 border-2 border-dashed border-primary/20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Votre Numéro de Passage</p>
            <p className="text-5xl font-black text-primary mt-1 tracking-tight">{generatedTicket?.number}</p>
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl mb-4">
            💡 Gardez bien ce numéro en tête ou faites une capture d&apos;écran. Il vous sera demandé au guichet d&apos;appel.
          </p>

          <Button
            className="w-full bg-primary text-white h-12 rounded-xl font-semibold"
            onClick={() => {
              setShowSuccessModal(false);
              setTimeout(() => setShowTrackingModal(true), 200);
            }}
          >
            Suivre mon attente en direct
          </Button>
        </DialogContent>
      </Dialog>

      {generatedTicket && (
        <TicketTrackingModal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          ticket={generatedTicket}
          onCancelTicket={handleCancelTrackedTicket}
        />
      )}


      {/* COMPOSANT WHY US */}
      <section className="px-6 py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Pourquoi Rang+ ?</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">Une expérience patient repensée</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Découvrez les avantages de notre plateforme de gestion de file d&apos;attente intelligente
            </p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-0 shadow-md bg-card">
                  <CardContent className="p-6">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Comment ça marche ?</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">3 étapes simples</h2>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 lg:grid-cols-3">
            {[
              { step: "1", title: "Choisissez votre service", desc: "Sélectionnez le service médical dont vous avez besoin dans la liste" },
              { step: "2", title: "Prenez votre ticket", desc: "Entrez vos informations et recevez votre numéro de ticket instantanément" },
              { step: "3", title: "Suivez votre position", desc: "Consultez votre rang en temps réel et soyez alerté quand c'est votre tour" }
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 shadow-md">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Témoignages</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">Ce que disent nos patients</h2>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-0 shadow-md bg-card">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="size-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.text}&quot;</p>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 py-16 lg:py-24">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-0 bg-primary text-primary-foreground">
            <CardContent className="p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">Prêt à gagner du temps ?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Rejoignez les milliers de patients qui utilisent déjà Rang+ pour éviter les files d&apos;attente
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" onClick={onTakeTicket} className="h-14 px-8 gap-3 rounded-2xl text-lg font-semibold w-full sm:w-auto">
                  <CheckCircle2 className="size-5" /> Prendre mon Ticket
                </Button>
                <Button size="lg" variant="outline" onClick={onScanQR} className="h-14 px-8 gap-3 rounded-2xl text-lg font-semibold bg-transparent border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 w-full sm:w-auto">
                  <QrCode className="size-5" /> Scanner QR
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <footer id="contact-section" className="px-6 py-12 bg-foreground text-background">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-start">
                  <img
                    onClick={() => onNavigate("#")}
                    src="/placeholder-logo-white.svg"
                    alt="Rang+"
                    className="h-8 w-auto cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-background/70 italic tracking-tight mt-0.5">
                    Hôpital du Mali
                  </span>
                </div>
              </div>
              <p className="text-sm text-background/60">
                Votre santé, notre priorité. Gestion intelligente des files d&apos;attente hospitalières.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-background/60">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <span>Bamako, Mali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>+223 20 22 50 02</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>contact@hopitaldumali.ml</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Horaires</h4>
              <div className="space-y-2 text-sm text-background/60">
                <p>Lundi - Vendredi: 7h00 - 18h00</p>
                <p>Samedi: 8h00 - 14h00</p>
                <p>Urgences: 24h/24, 7j/7</p>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 text-center text-sm text-background/60">
            <p>&copy; 2026 Hôpital du Mali - Rang+. Tous droits réservés.</p>
          </div>
        </div>
      </footer>


      {/* BOUTON FLOTTANT D'ACCÈS DIRECT AU TICKET ACTIF */}
      <AnimatePresence>
        {generatedTicket && !showTrackingModal && (
          <motion.div
            initial={isMounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setShowTrackingModal(true)}
              className="h-14 px-5 rounded-2xl bg-primary text-white font-bold shadow-2xl flex items-center gap-3 border border-white/20 hover:scale-105 transition-transform"
            >
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span>Ticket {generatedTicket.number} ({generatedTicket.queuePos || 1}e)</span>
              <Eye className="size-5 ml-1 opacity-80" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}