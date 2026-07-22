"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, Clock, MapPin, Bell, History, ChevronRight, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/lib/app-context"
import { useRouter } from "next/navigation"

export function TicketsView() {
  const { currentTicket, tickets, user } = useApp()
  const [activeTab, setActiveTab] = useState("active")
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (currentTicket && currentTicket.statut === "waiting") {
      const total = Math.max(currentTicket.totalInQueue || 1, 1)
      const pos = Math.max(currentTicket.position || 1, 1)
      const targetProgress = ((total - pos) / total) * 100

      const timer = setTimeout(() => {
        setProgress(Math.max(0, Math.min(targetProgress, 95))) 
      }, 500)
      return () => clearTimeout(timer)
    } else if (currentTicket && (currentTicket.statut === "called" || currentTicket.statut === "serving")) {
      setProgress(100)
    } else {
      setProgress(0)
    }
  }, [currentTicket])

  const statusConfig: Record<string, { label: string, color: string, textColor: string }> = {
    "waiting": { label: "En attente", color: "bg-amber-500", textColor: "text-amber-500" },
    "called": { label: "Appelé", color: "bg-emerald", textColor: "text-emerald" },
    "serving": { label: "En cours", color: "bg-blue-500", textColor: "text-blue-500" },
    "completed": { label: "Terminé", color: "bg-gray-400", textColor: "text-gray-500" },
    "absent": { label: "Absent", color: "bg-red-500", textColor: "text-red-500" },
    "cancelled": { label: "Annulé", color: "bg-rose-500", textColor: "text-rose-500" },
  }

  const getStatusConfig = (statut: string) => {
    return statusConfig[statut] || { label: statut || "Inconnu", color: "bg-gray-500", textColor: "text-gray-500" }
  }

  const getEstimatedTime = (position: number) => {
    if (position <= 1) return "Moins de 5 minutes"
    if (position === 2) return "Environ 10 minutes"
    return `Environ ${position * 5} minutes`
  }

  const pastTickets = tickets.filter(
    (t) =>
      t.userId === user?.id &&
      (t.statut === "completed" || t.statut === "absent" || t.statut === "cancelled")
  )

  const formatCounterName = (name: string) => {
    if (!name) return ""
    if (name.toLowerCase().includes("guichet")) {
      return name
    }
    return `Guichet ${name}`
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* En-tête */}
      <div className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold text-foreground">Mes Tickets</h1>
          <p className="text-sm text-muted-foreground">Suivez votre passage en temps réel</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              <Bell className="size-4" />
              Ticket actif
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="size-4" />
              Historique
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          {/* VUE TICKET ACTIF */}
          {activeTab === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentTicket ? (
                <>
                  <Card className="overflow-hidden border-0 shadow-xl">
                    <div className={`${currentTicket.statut === "serving" ? "bg-blue-500" : "bg-emerald"} p-6 text-primary-foreground transition-colors duration-300`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-white/80">Numéro de ticket</p>
                          <p className="text-4xl font-bold tracking-tight">{currentTicket.number}</p>
                        </div>
                        <Badge className={`${getStatusConfig(currentTicket.statut).color} text-white border-none shadow-sm`}>
                          {getStatusConfig(currentTicket.statut).label}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-light">
                          <MapPin className="size-5 text-emerald" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{currentTicket.service?.name || "Service"}</p>
                          <p className="text-sm text-muted-foreground">Veuillez patienter en salle d'attente</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Votre position</span>
                          <span className="font-semibold text-foreground">
                            {currentTicket.statut === "called" || currentTicket.statut === "serving"
                              ? "C'est votre tour !"
                              : `${currentTicket.position} sur ${currentTicket.totalInQueue}`}
                          </span>
                        </div>

                        {/* Barre de progression animée */}
                        <div className="relative h-3 overflow-hidden rounded-full bg-accent">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 rounded-full ${currentTicket.statut === "serving" ? "bg-blue-500" : "bg-emerald"}`}
                          />
                          <motion.div
                            animate={{
                              x: [0, 100, 0],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Indicateurs visuels */}
                        {currentTicket.statut !== "called" && currentTicket.statut !== "serving" && (
                          <div className="mt-3 flex justify-between">
                            {[...Array(Math.min(currentTicket.totalInQueue || 1, 5))].map((_, i) => {
                              const isPast = i < (currentTicket.totalInQueue - currentTicket.position)
                              const isCurrent = i === (currentTicket.totalInQueue - currentTicket.position)

                              return (
                                <motion.div
                                  key={i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.1 * i }}
                                  className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                                    isPast
                                      ? "bg-emerald text-primary-foreground"
                                      : isCurrent
                                      ? "border-2 border-emerald bg-emerald-light text-emerald"
                                      : "bg-accent text-muted-foreground"
                                  }`}
                                >
                                  {i + 1}
                                </motion.div>
                              )
                            })}
                            {(currentTicket.totalInQueue > 5) && (
                              <div className="flex size-8 items-center justify-center text-muted-foreground">
                                ...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Informations de temps */}
                      <div className="flex items-center gap-3 rounded-xl bg-emerald-light p-4">
                        <Clock className="size-5 text-emerald shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald">
                            {currentTicket.statut === "called" || currentTicket.statut === "serving"
                              ? "Présentez-vous au guichet indiqué"
                              : `Temps estimé : ${getEstimatedTime(currentTicket.position || 1)}`
                            }
                          </p>
                          <p className="text-xs text-emerald/70">
                            Pris à {new Date(currentTicket.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      {/* Alerte XXL quand le ticket est appelé ou en cours */}
                      <AnimatePresence>
                        {(currentTicket.statut === "called" || currentTicket.statut === "serving") && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0, height: 0 }}
                            animate={{ scale: 1, opacity: 1, height: "auto" }}
                            exit={{ scale: 0.9, opacity: 0, height: 0 }}
                            className={`mt-4 overflow-hidden rounded-xl ${
                              currentTicket.statut === "serving" ? "bg-blue-600" : "bg-emerald"
                            } text-primary-foreground shadow-lg`}
                          >
                            <div className="p-6 text-center">
                              {currentTicket.statut === "called" && (
                                <motion.div
                                  animate={{ scale: [1, 1.15, 1], rotate: [0, -10, 10, -10, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  <Bell className="mx-auto mb-3 size-10 text-white" />
                                </motion.div>
                              )}
                              <p className="text-xl font-bold mb-2">
                                {currentTicket.statut === "called" ? "C'est votre tour !" : "Prise en charge en cours"}
                              </p>

                              {currentTicket.counterName ? (
                                <div className="mt-4 rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                                  <p className="text-sm font-medium text-white/90 mb-1">
                                    Dirigez-vous vers le :
                                  </p>
                                  <p className="text-4xl sm:text-5xl font-black uppercase tracking-widest text-white drop-shadow-md">
                                    {formatCounterName(currentTicket.counterName)}
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm font-medium text-white/90">
                                  Veuillez vous avancer vers le guichet disponible.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  <Card className="mt-4 shadow-sm">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Patient</p>
                        <p className="font-medium text-foreground">{currentTicket.userName || "Non renseigné"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* EMPTY STATE : Aucun ticket actif */
                <Card className="border-dashed border-2 shadow-none bg-accent/30">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-emerald-light">
                      <Ticket className="size-10 text-emerald" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Aucun ticket en cours</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                      Vous n'avez pas de ticket actif pour le moment.
                    </p>
                    <Button
                      onClick={() => router.push('/patient/services')}
                      className="mt-6 bg-emerald text-primary-foreground hover:bg-emerald/90"
                    >
                      Prendre un ticket
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* VUE HISTORIQUE */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {pastTickets.length === 0 ? (
                /* EMPTY STATE : Aucun historique */
                <Card className="border-dashed border-2 shadow-none bg-accent/30">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
                      <History className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Historique vide</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Vos tickets terminés ou annulés apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastTickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                        ticket.statut === "completed" ? "bg-emerald-light" : "bg-red-100"
                      }`}>
                        <Ticket className={`size-5 ${
                          ticket.statut === "completed" ? "text-emerald" : "text-red-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground truncate">{ticket.number}</p>
                          <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-wider ${getStatusConfig(ticket.statut).textColor} bg-transparent border`}>
                            {getStatusConfig(ticket.statut).label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.service?.name || "Service inconnu"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {new Date(ticket.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}