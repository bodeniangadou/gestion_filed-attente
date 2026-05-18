"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, CheckCircle2, UserX, Clock, Search, Filter, AlertCircle, PhoneForwarded } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"

export default function AgentQueueManagerPage() {
  const { tickets, getAgentCounter, callNextPatient, recallPatient, markAbsent, completeService } = useApp()
  const counter = getAgentCounter()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("waiting")

  // 1. Filtrage et Mémoïsation des tickets du service du guichet actuel pour éviter les re-renders inutiles
  const serviceTickets = useMemo(() => {
    if (!counter?.serviceId) return []
    return tickets.filter(t => t.service.id === counter.serviceId)
  }, [tickets, counter?.serviceId])

  // 2. Séparation précise par statuts
  const waitingTickets = useMemo(() => {
    return serviceTickets
      .filter(t => t.status === "waiting" || t.status === "called" || t.status === "serving")
      .sort((a, b) => {
        // Mettre le patient "appelé" ou "en cours" tout en haut
        if (a.status === "called" || a.status === "serving") return -1
        if (b.status === "called" || b.status === "serving") return 1
        return a.position - b.position
      })
  }, [serviceTickets])

  const processedTickets = useMemo(() => {
    return serviceTickets
      .filter(t => t.status === "completed" || t.status === "absent" || t.status === "cancelled")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [serviceTickets])

  // 3. Application du filtre de recherche (Numéro de ticket ou Nom du Patient)
  const filteredWaiting = useMemo(() => {
    return waitingTickets.filter(t => 
      t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [waitingTickets, searchQuery])

  const filteredProcessed = useMemo(() => {
    return processedTickets.filter(t => 
      t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [processedTickets, searchQuery])

  // Formattage de l'heure
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion de la File</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {counter?.name || "Guichet"} — {counter?.serviceName || "Consultation Générale"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald">
          <Clock className="size-3.5 animate-pulse" />
          Synchronisé en direct
        </div>
      </div>

      {/* Barre de Recherche et Filtres Globaux */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un ticket ou un patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm focus-visible:ring-emerald text-sm"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center justify-end gap-2 text-xs text-muted-foreground font-medium">
          <Filter className="size-3.5" />
          <span>{serviceTickets.length} tickets au total</span>
        </div>
      </div>

      {/* Onglets Principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl border border-border/60">
          <TabsTrigger value="waiting" className="rounded-lg font-bold text-sm gap-2 px-5 py-2">
            <Users className="size-4" />
            File active
            <Badge variant="secondary" className="font-mono px-1.5 py-0 bg-emerald/10 text-emerald border-0 font-bold">
              {waitingTickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="processed" className="rounded-lg font-bold text-sm gap-2 px-5 py-2">
            <CheckCircle2 className="size-4" />
            Historique du jour
            <Badge variant="secondary" className="font-mono px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground border-0 font-bold">
              {processedTickets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ================= CONTENU : FILE ACTIVE ================= */}
        <TabsContent value="waiting" className="space-y-3 focus-visible:outline-none">
          <AnimatePresence mode="popLayout">
            {filteredWaiting.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 border-2 border-dashed border-border rounded-2xl bg-card/40">
                <AlertCircle className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-muted-foreground text-sm font-medium">Aucun patient en attente ou correspondant à la recherche.</p>
              </motion.div>
            ) : (
              filteredWaiting.map((ticket, index) => {
                const isCurrent = ticket.status === "called" || ticket.status === "serving"
                
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                      isCurrent 
                        ? "bg-emerald/5 border-emerald/40 shadow-sm ring-1 ring-emerald/20" 
                        : "bg-card border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Numéro ou indicateur visuel */}
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                        isCurrent ? "bg-emerald text-primary-foreground animate-pulse" : "bg-accent border border-border text-foreground"
                      }`}>
                        {isCurrent ? "▶" : `#${ticket.position}`}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-extrabold font-mono text-primary tracking-tight">
                            {ticket.number}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-emerald text-primary-foreground text-[10px] font-bold border-0 px-2 py-0 animate-bounce">
                              Au guichet
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{ticket.userName}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {formatTime(ticket.createdAt)}
                          </span>
                          <span>•</span>
                          <span>Priorité Standard</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions d'urgence ou de contrôle direct sur la ligne */}
                    <div className="flex items-center justify-end gap-2 border-t sm:border-0 pt-3 sm:pt-0 border-border/60">
                      {isCurrent ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => markAbsent(ticket.id)}
                            className="text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-50"
                          >
                            Signaler Absent
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => completeService(ticket.id)}
                            className="text-xs h-8 bg-emerald text-primary-foreground hover:bg-emerald/90"
                          >
                            Terminer
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs font-semibold text-muted-foreground px-2">
                          En attente
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ================= CONTENU : HISTORIQUE DU JOUR ================= */}
        <TabsContent value="processed" className="space-y-3 focus-visible:outline-none">
          <AnimatePresence mode="popLayout">
            {filteredProcessed.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 border-2 border-dashed border-border rounded-2xl bg-card/40">
                <AlertCircle className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-muted-foreground text-sm font-medium">L&apos;historique de traitement est vide pour le moment.</p>
              </motion.div>
            ) : (
              filteredProcessed.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    {/* Icône de statut final */}
                    <div className={`flex size-9 items-center justify-center rounded-lg ${
                      ticket.status === "completed" 
                        ? "bg-emerald/10 text-emerald" 
                        : ticket.status === "absent" 
                        ? "bg-amber-500/10 text-amber-600" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {ticket.status === "completed" ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <UserX className="size-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                          {ticket.number}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-bold border-0 px-2 py-0 capitalize ${
                          ticket.status === "completed" 
                            ? "bg-emerald/10 text-emerald" 
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {ticket.status === "completed" ? "Consulté" : "Absent"}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-foreground text-sm">{ticket.userName}</h4>
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground space-y-1 font-medium">
                    <p>Enregistré : {formatTime(ticket.createdAt)}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {ticket.completedAt ? `Clôturé à ${formatTime(ticket.completedAt)}` : "Non spécifié"}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}