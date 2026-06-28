"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  History,
  User,
  Bell,
  MapPin,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApp, Ticket as TicketType } from "@/lib/app-context"

export default function PatientPage() {
  const router = useRouter()
  const { user, getActiveTickets, getPatientHistory, cancelTicket } = useApp()
  
  const activeTickets = getActiveTickets()
  const history = getPatientHistory()
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  // Met à jour automatiquement le ticket sélectionné si la liste change en temps réel
  useEffect(() => {
    if (activeTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(activeTickets[0].id)
    } else if (activeTickets.length === 0) {
      setSelectedTicketId(null)
    }
  }, [activeTickets, selectedTicketId])

  const selectedTicket = activeTickets.find(t => t.id === selectedTicketId) || activeTickets[0] || null
  const completedTickets = history.filter(t => t.statut === "completed")

  // Historique trié du plus récent au plus ancien
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const getStatusInfo = (statut: TicketType["statut"]) => {
    switch (statut) {
      case "waiting":
        return { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock }
      case "called":
        return { label: "Appelé", color: "bg-emerald-100 text-emerald-700", icon: Bell }
      case "serving":
        return { label: "En cours", color: "bg-blue-100 text-blue-700", icon: User }
      case "completed":
        return { label: "Terminé", color: "bg-green-100 text-green-700", icon: CheckCircle }
      case "absent":
        return { label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle }
      case "cancelled":
        return { label: "Annulé", color: "bg-muted text-muted-foreground", icon: XCircle }
      default:
        return { label: statut, color: "bg-muted text-muted-foreground", icon: AlertCircle }
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
    if (minutes < 0) return "À l'instant"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}min`
  }

  const formatCounterName = (name: string) => {
    if (!name) return ""
    if (name.toLowerCase().includes("guichet")) return name
    return `Guichet ${name}`
  }

  // Action d'annulation asynchrone pour la persistance BDD
  const handleCancelTicket = async (ticketId: string) => {
    try {
      await cancelTicket(ticketId)
      // L'état local se mettra à jour automatiquement via le context temps réel
    } catch (error) {
      console.error("Erreur lors de l'annulation du ticket en BDD:", error)
    }
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
          <Button 
            onClick={() => router.push("/patient/services")} 
            className="gap-2 bg-emerald text-white hover:bg-emerald/90"
          >
            <Ticket className="size-4" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Ticket Actif */}
        {activeTickets.length > 0 && selectedTicket && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className={`p-6 ${
                selectedTicket.statut === "called" 
                  ? "bg-emerald text-white" 
                  : selectedTicket.statut === "serving"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-r from-emerald to-emerald/80 text-white"
              } transition-colors duration-300`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/80">Votre ticket</p>
                    <motion.p 
                      className="text-5xl font-bold mt-2 tracking-tight"
                      animate={selectedTicket.statut === "called" ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: selectedTicket.statut === "called" ? Infinity : 0, duration: 1.5 }}
                    >
                      {selectedTicket.number}
                    </motion.p>
                    <p className="mt-2 text-white/95 font-medium">{selectedTicket.service.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={selectedTicket.statut === "called" || selectedTicket.statut === "serving" ? "bg-white text-foreground border-none" : "bg-white/20 text-white border-none"}>
                      {getStatusInfo(selectedTicket.statut).label}
                    </Badge>
                    {selectedTicket.counterName && (
                      <p className="mt-2 text-sm text-white/90 font-medium">
                        <MapPin className="inline size-3.5 mr-1 align-text-top" />
                        {formatCounterName(selectedTicket.counterName)}
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedTicket.statut === "called" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-4 bg-white/20 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                      <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Bell className="size-6 text-white" />
                      </motion.div>
                      <div>
                        <p className="font-bold">C'est votre tour !</p>
                        <p className="text-sm text-white/90">
                          Présentez-vous au <span className="underline font-semibold">{formatCounterName(selectedTicket.counterName)}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <CardContent className="p-6">
                {selectedTicket.statut === "waiting" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-accent/50 rounded-xl">
                      <p className="text-3xl font-bold text-emerald">{selectedTicket.position}</p>
                      <p className="text-sm text-muted-foreground">Position dans la file</p>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-xl">
                      <p className="text-3xl font-bold text-foreground">~{Math.max(5, selectedTicket.position * 5)} min</p>
                      <p className="text-sm text-muted-foreground">Temps estimé</p>
                    </div>
                  </div>
                )}

                {selectedTicket.statut === "waiting" && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progression</span>
                      <span>{selectedTicket.totalInQueue ? Math.min(100, Math.round(((selectedTicket.totalInQueue - selectedTicket.position + 1) / selectedTicket.totalInQueue) * 100)) : 0}%</span>
                    </div>
                    <div className="h-3 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedTicket.totalInQueue ? ((selectedTicket.totalInQueue - selectedTicket.position + 1) / selectedTicket.totalInQueue) * 100 : 0}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-emerald rounded-full"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6 border-t pt-4 border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pris à</span>
                    <span className="font-medium text-foreground">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Temps écoulé</span>
                    <span className="font-medium text-foreground">{formatWaitTime(selectedTicket.createdAt)}</span>
                  </div>
                  {selectedTicket.calledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Appelé à</span>
                      <span className="font-medium text-foreground">{formatDate(selectedTicket.calledAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {selectedTicket.statut === "waiting" && (
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => handleCancelTicket(selectedTicket.id)}
                    >
                      <XCircle className="size-4" />
                      Annuler mon passage
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Aucun ticket actif */}
        {activeTickets.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-dashed border-2 bg-accent/20 border-muted-foreground/20">
              <CardContent className="p-8 text-center">
                <Ticket className="mx-auto size-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun ticket actif</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Prenez un ticket numérique pour rejoindre une file d'attente à distance.</p>
                <Button onClick={() => router.push("/patient/services")} className="gap-2 bg-emerald text-white hover:bg-emerald/90">
                  <Ticket className="size-4" />
                  Prendre un ticket
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Multi-tickets */}
        {activeTickets.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Vos autres files d'attente actives</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {activeTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`flex-shrink-0 text-left p-3.5 rounded-xl border transition-all ${ticket.id === selectedTicket?.id ? "bg-emerald/10 border-emerald text-emerald font-medium shadow-sm" : "bg-card border-border hover:border-muted-foreground/30 text-foreground"}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{ticket.number}</p>
                    <span className={`size-2 rounded-full ${ticket.statut === 'called' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{ticket.service.name}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Statistiques Rapides */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald">{activeTickets.length}</p><p className="text-xs text-muted-foreground">En cours</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{completedTickets.length}</p><p className="text-xs text-muted-foreground">Terminés</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{history.length}</p><p className="text-xs text-muted-foreground">Total visites</p></CardContent></Card>
        </motion.div>

        {/* Historique */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground"><History className="size-4 text-emerald" />Historique récent</CardTitle>
              {history.length > 5 && <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">Voir tout</Button>}
            </CardHeader>
            <CardContent className="pt-0">
              {sortedHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm"><Calendar className="mx-auto size-10 mb-2 text-muted-foreground/20" /><p>Aucune visite passée enregistrée.</p></div>
              ) : (
                <div className="space-y-2.5">
                  {sortedHistory.slice(0, 5).map((ticket, index) => {
                    const statusInfo = getStatusInfo(ticket.statut)
                    const StatusIcon = statusInfo.icon
                    return (
                      <motion.div key={ticket.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + index * 0.04 }} className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-transparent hover:border-border transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${statusInfo.color}`}><StatusIcon className="size-4" /></div>
                          <div className="min-w-0"><p className="font-bold text-sm text-foreground">{ticket.number}</p><p className="text-xs text-muted-foreground truncate max-w-[180px]">{ticket.service.name}</p></div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide font-semibold ${statusInfo.color} border-none`}>{statusInfo.label}</Badge>
                          <p className="text-[11px] text-muted-foreground/80 mt-1">{formatDate(ticket.createdAt)}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Rapides */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2 rounded-xl hover:bg-accent/50 hover:border-emerald/30 transition-all"
            onClick={() => router.push("/patient/services")} 
          >
            <RefreshCw className="size-5 text-emerald" />
            <span className="text-xs font-medium">Consulter les services</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2 rounded-xl hover:bg-accent/50 hover:border-emerald/30 transition-all"
            onClick={() => router.push("/patient/profile")} 
          >
            <User className="size-5 text-emerald" />
            <span className="text-xs font-medium">Gérer mon profil</span>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}