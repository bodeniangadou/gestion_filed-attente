"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Calendar,
  History,
  User,
  Bell,
  MapPin,
  QrCode,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApp, Ticket as TicketType } from "@/lib/app-context"
import { supabase } from "@/lib/supabase"

interface PatientDashboardProps {
  onNavigate: (tab: string) => void
  onTakeTicket: () => void
}

export  default function PatientDashboard({ onNavigate, onTakeTicket }: PatientDashboardProps) {

const { user, cancelTicket } = useApp()

const [activeTickets, setActiveTickets] = useState<TicketType[]>([])
const [history, setHistory] = useState<TicketType[]>([])
const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)

useEffect(() => {
  if (!user) return

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from("ticket")
      .select(`
        *,
        service(*)
      `)
      .eq("patient_nom", `${user.firstName} ${user.name}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const tickets: TicketType[] = data.map((t: any) => ({
      id: t.id,
      number: t.code,
      service: {
        id: t.service.id,
        name: t.service.nom,
        description: t.service.description,
        icon: t.service.icon,
        waitTime: t.service.wait_time,
        currentQueue: t.service.current_queue,
        isActive: t.service.is_active,
        openTime: t.service.open_time,
        closeTime: t.service.close_time,
      },
      userId: user.id,
      userName: t.patient_nom,
      status:
        t.statut === "En attente"
          ? "waiting"
          : t.statut === "Appelé"
          ? "called"
          : t.statut === "En cours"
          ? "serving"
          : t.statut === "Terminé"
          ? "completed"
          : t.statut === "Absent"
          ? "absent"
          : "cancelled",
      position: t.position,
      totalInQueue: t.position,
      createdAt: new Date(t.created_at),
      calledAt: t.called_at ? new Date(t.called_at) : undefined,
      completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
      counterId: t.id_guichet,
      counterName: t.nom_guichet,
    }))

    setHistory(tickets)

    const actifs = tickets.filter(
      t =>
        t.status === "waiting" ||
        t.status === "called" ||
        t.status === "serving"
    )

    setActiveTickets(actifs)

    if (actifs.length > 0) {
      setSelectedTicket(actifs[0])
    } else {
      setSelectedTicket(null)
    }
  }

  loadTickets()

  const channel = supabase
    .channel("patient-tickets")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ticket",
      },
      () => {
        loadTickets()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])

  const completedTickets = history.filter(t => t.status === "completed")
  const cancelledTickets = history.filter(t => t.status === "cancelled" || t.status === "absent")

  const getStatusInfo = (status: TicketType["status"]) => {
    switch (status) {
      case "waiting":
        return { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock }
      case "called":
        return { label: "Appele", color: "bg-primary/10 text-primary", icon: Bell }
      case "serving":
        return { label: "En cours", color: "bg-blue-100 text-blue-700", icon: User }
      case "completed":
        return { label: "Termine", color: "bg-green-100 text-green-700", icon: CheckCircle }
      case "absent":
        return { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle }
      case "cancelled":
        return { label: "Annule", color: "bg-muted text-muted-foreground", icon: XCircle }
      default:
        return { label: status, color: "bg-muted text-muted-foreground", icon: AlertCircle }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date))
  }

  const formatWaitTime = (createdAt: Date) => {
    const minutes = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}min`
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Bonjour, {user?.firstName || "Patient"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeTickets.length > 0 
                ? `${activeTickets.length} ticket${activeTickets.length > 1 ? "s" : ""} en cours`
                : "Aucun ticket actif"
              }
            </p>
          </div>
          <Button onClick={onTakeTicket} className="gap-2">
            <Ticket className="size-4" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Active Ticket Display */}
        {activeTickets.length > 0 && selectedTicket && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className={`p-6 ${
                selectedTicket.status === "called" 
                  ? "bg-primary" 
                  : "bg-gradient-to-r from-primary to-primary/80"
              } text-primary-foreground`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/80">Votre ticket</p>
                    <motion.p 
                      className="text-5xl font-bold mt-2"
                      animate={selectedTicket.status === "called" ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: selectedTicket.status === "called" ? Infinity : 0, duration: 1.5 }}
                    >
                      {selectedTicket.number}
                    </motion.p>
                    <p className="mt-2 text-white/90">{selectedTicket.service.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${
                      selectedTicket.status === "called" 
                        ? "bg-white text-primary" 
                        : "bg-white/20 text-white border-0"
                    }`}>
                      {getStatusInfo(selectedTicket.status).label}
                    </Badge>
                    {selectedTicket.counterName && (
                      <p className="mt-2 text-sm text-white/80">
                        <MapPin className="inline size-3 mr-1" />
                        {selectedTicket.counterName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Called Alert */}
                <AnimatePresence>
                  {selectedTicket.status === "called" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-white/20 rounded-xl flex items-center gap-3"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <Bell className="size-6" />
                      </motion.div>
                      <div>
                        <p className="font-semibold">C&apos;est votre tour !</p>
                        <p className="text-sm text-white/80">
                          Presentez-vous au {selectedTicket.counterName}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <CardContent className="p-6">
                {/* Position & Wait Time */}
                {selectedTicket.status === "waiting" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-accent/50 rounded-xl">
                      <p className="text-3xl font-bold text-primary">{selectedTicket.position}</p>
                      <p className="text-sm text-muted-foreground">Position</p>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-xl">
                      <p className="text-3xl font-bold text-foreground">
                        ~{selectedTicket.position * 5} min
                      </p>
                      <p className="text-sm text-muted-foreground">Temps estime</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {selectedTicket.status === "waiting" && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progression</span>
                      <span>{Math.round(((selectedTicket.totalInQueue - selectedTicket.position + 1) / selectedTicket.totalInQueue) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${((selectedTicket.totalInQueue - selectedTicket.position + 1) / selectedTicket.totalInQueue) * 100}%` 
                        }}
                        transition={{ duration: 1 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Ticket Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pris a</span>
                    <span className="font-medium">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Temps d&apos;attente</span>
                    <span className="font-medium">{formatWaitTime(selectedTicket.createdAt)}</span>
                  </div>
                  {selectedTicket.calledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Appele a</span>
                      <span className="font-medium">{formatDate(selectedTicket.calledAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <QrCode className="size-4" />
                    QR Code
                  </Button>
                  {selectedTicket.status === "waiting" && (
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => cancelTicket(selectedTicket.id)}
                    >
                      <XCircle className="size-4" />
                      Annuler
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Active Tickets */}
        {activeTickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-dashed border-2 bg-accent/20">
              <CardContent className="p-8 text-center">
                <Ticket className="mx-auto size-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun ticket actif
                </h3>
                <p className="text-muted-foreground mb-6">
                  Prenez un ticket pour rejoindre une file d&apos;attente
                </p>
                <Button onClick={onTakeTicket} className="gap-2">
                  <Ticket className="size-4" />
                  Prendre un ticket
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Multiple Active Tickets */}
        {activeTickets.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Autres tickets actifs
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {activeTickets.filter(t => t.id !== selectedTicket?.id).map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="flex-shrink-0 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <p className="font-bold text-foreground">{ticket.number}</p>
                  <p className="text-xs text-muted-foreground">{ticket.service.name}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid grid-cols-3 gap-4"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{activeTickets.length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{completedTickets.length}</p>
              <p className="text-xs text-muted-foreground">Termines</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{history.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-5 text-primary" />
                Historique
              </CardTitle>
              {history.length > 5 && (
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Calendar className="mx-auto size-12 mb-3 text-muted-foreground/30" />
                  <p>Aucun historique</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((ticket, index) => {
                    const statusInfo = getStatusInfo(ticket.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-accent/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-full ${statusInfo.color}`}>
                            <StatusIcon className="size-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{ticket.number}</p>
                            <p className="text-sm text-muted-foreground">{ticket.service.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => onNavigate("services")}
          >
            <RefreshCw className="size-5 text-primary" />
            <span>Voir les services</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => onNavigate("profile")}
          >
            <User className="size-5 text-primary" />
            <span>Mon profil</span>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
