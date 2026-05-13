"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, Clock, MapPin, Bell, History, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/lib/app-context"

export function TicketsView() {
  const { currentTicket, tickets, user } = useApp()
  const [activeTab, setActiveTab] = useState("active")
  const [progress, setProgress] = useState(0)

  // Simulate progress animation
  useEffect(() => {
    if (currentTicket && currentTicket.status === "waiting") {
      const targetProgress = ((currentTicket.totalInQueue - currentTicket.position) / currentTicket.totalInQueue) * 100
      const timer = setTimeout(() => {
        setProgress(targetProgress)
      }, 500)
      return () => clearTimeout(timer)
    } else if (currentTicket && currentTicket.status === "called") {
      setProgress(100)
    }
  }, [currentTicket])

  const statusConfig = {
    waiting: { label: "En attente", color: "bg-amber-500", textColor: "text-amber-500" },
    called: { label: "Appelé", color: "bg-emerald", textColor: "text-emerald" },
    serving: { label: "En cours", color: "bg-blue-500", textColor: "text-blue-500" },
    completed: { label: "Terminé", color: "bg-gray-400", textColor: "text-gray-500" },
    absent: { label: "Absent", color: "bg-red-500", textColor: "text-red-500" },
  }

  const pastTickets = tickets.filter(t => t.status === "completed" || t.status === "absent")

  if (!currentTicket && tickets.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-24 lg:pb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-light"
        >
          <Ticket className="size-12 text-emerald" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">Aucun ticket actif</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Prenez un ticket pour un service et suivez votre position ici
        </p>
        <Button className="mt-6 bg-emerald text-primary-foreground hover:bg-emerald/90">
          Prendre un ticket
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold text-foreground">Mes Tickets</h1>
          <p className="text-sm text-muted-foreground">Suivez vos tickets en temps réel</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        {/* Tabs */}
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
          {activeTab === "active" && currentTicket && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Main Ticket Card */}
              <Card className="overflow-hidden border-0 shadow-xl">
                {/* Ticket Header */}
                <div className="bg-emerald p-6 text-primary-foreground">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/80">Numéro de ticket</p>
                      <p className="text-4xl font-bold">{currentTicket.number}</p>
                    </div>
                    <Badge className={`${statusConfig[currentTicket.status].color} text-white`}>
                      {statusConfig[currentTicket.status].label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Service Info */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-light">
                      <MapPin className="size-5 text-emerald" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{currentTicket.service.name}</p>
                      <p className="text-sm text-muted-foreground">{currentTicket.service.description}</p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Votre position</span>
                      <span className="font-semibold text-foreground">
                        {currentTicket.status === "called" ? "C'est votre tour !" : `${currentTicket.position} sur ${currentTicket.totalInQueue}`}
                      </span>
                    </div>
                    
                    {/* Animated Progress Bar */}
                    <div className="relative h-3 overflow-hidden rounded-full bg-accent">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald"
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

                    {/* Position indicators */}
                    <div className="mt-3 flex justify-between">
                      {[...Array(Math.min(currentTicket.totalInQueue, 5))].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 * i }}
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                            i < currentTicket.totalInQueue - currentTicket.position
                              ? "bg-emerald text-primary-foreground"
                              : i === currentTicket.totalInQueue - currentTicket.position
                              ? "border-2 border-emerald bg-emerald-light text-emerald"
                              : "bg-accent text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </motion.div>
                      ))}
                      {currentTicket.totalInQueue > 5 && (
                        <div className="flex size-8 items-center justify-center text-muted-foreground">
                          ...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-light p-4">
                    <Clock className="size-5 text-emerald" />
                    <div>
                      <p className="text-sm font-medium text-emerald">
                        {currentTicket.status === "called" 
                          ? "Présentez-vous au guichet"
                          : `Temps d'attente estimé: ~${currentTicket.position * 5} min`
                        }
                      </p>
                      <p className="text-xs text-emerald/70">
                        Ticket pris à {currentTicket.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Called Alert */}
                  {currentTicket.status === "called" && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-4 rounded-xl bg-emerald p-4 text-center text-primary-foreground"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Bell className="mx-auto mb-2 size-8" />
                      </motion.div>
                      <p className="text-lg font-semibold">C&apos;est votre tour !</p>
                      <p className="text-sm text-white/80">Veuillez vous présenter au guichet</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Info */}
              <Card className="mt-4">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium text-foreground">{currentTicket.userName}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {pastTickets.length === 0 ? (
                <div className="py-16 text-center">
                  <History className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun historique de tickets</p>
                </div>
              ) : (
                pastTickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`flex size-12 items-center justify-center rounded-xl ${
                        ticket.status === "completed" ? "bg-emerald-light" : "bg-red-100"
                      }`}>
                        <Ticket className={`size-5 ${
                          ticket.status === "completed" ? "text-emerald" : "text-red-500"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{ticket.number}</p>
                          <Badge variant="secondary" className="text-xs">
                            {statusConfig[ticket.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ticket.service.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.createdAt.toLocaleDateString("fr-FR")}
                      </p>
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
