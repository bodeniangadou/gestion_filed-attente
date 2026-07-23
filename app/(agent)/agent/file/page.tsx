"use client"

import { useState, useMemo } from "react"
import { RotateCw, Search, Clock, Users, CheckCircle2, UserX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useApp } from "@/lib/app-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const formatDateTime = (dateInput: Date | string) => {
  const date = new Date(dateInput)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")

  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) {
    if (diffMinutes < 1) return "À l'instant"
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    return `${h}h${m}`
  }
  if (isYesterday) return `Hier, ${h}h${m}`
  if (diffMs < 1000 * 60 * 60 * 24 * 7)
    return date.toLocaleDateString("fr-FR", { weekday: "long" }) + ` ${h}h${m}`
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const getDuration = (ticket: any) => {
  if (ticket.statut !== "completed" || !ticket.completedAt) return null;
  
  const start = ticket.calledAt || ticket.createdAt;
  if (!start) return null;
  
  const diffMs = new Date(ticket.completedAt).getTime() - new Date(start).getTime();
  const totalSeconds = Math.round(diffMs / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds} seconde${totalSeconds > 1 ? 's' : ''}`;
  }
  
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (totalMinutes < 60) {
    if (remainingSeconds === 0) {
      return `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}`;
    }
    return `${totalMinutes} min ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours < 24) {
    if (minutes === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${minutes}min`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  if (minutes === 0) {
    return `${days}j ${remainingHours}h`;
  }
  return `${days}j ${remainingHours}h ${minutes}min`;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  waiting:   { label: "En attente", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  called:    { label: "Appelé",     className: "bg-primary/10 text-primary border-primary/20" },
  serving:   { label: "En cours",   className: "bg-primary text-primary-foreground border-primary" },
  completed: { label: "Terminé",    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  absent:    { label: "Absent",     className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Annulé",     className: "bg-muted text-muted-foreground border-border" },
}

type Tab = "queue" | "history" | "absent"

export default function FilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue")
  const [search, setSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { tickets, getAgentCounter, fetchTickets } = useApp()

  const counter = getAgentCounter()

  const serviceTickets = useMemo(() =>
    tickets.filter(t => counter ? t.counterId === counter.id : false),
    [tickets, counter]
  )

  const tabCounts = useMemo(() => ({
    queue:   serviceTickets.filter(t => ["waiting", "called", "serving"].includes(t.statut)).length,
    history: serviceTickets.filter(t => t.statut === "completed").length,
    absent:  serviceTickets.filter(t => t.statut === "absent").length,
  }), [serviceTickets])

  const filteredData = useMemo(() => {
    return serviceTickets
      .filter(t => {
        if (activeTab === "queue") return ["waiting", "called", "serving"].includes(t.statut)
        if (activeTab === "history") return t.statut === "completed"
        if (activeTab === "absent") return t.statut === "absent"
        return true
      })
      .filter(t => {
        const q = search.toLowerCase()
        return (
          t.userName.toLowerCase().includes(q) ||
          t.number.toLowerCase().includes(q) ||
          (t.phone || "").includes(search)
        )
      })
      .sort((a, b) => {
        if (activeTab === "queue") {
          const order: Record<string, number> = { called: 0, serving: 1, waiting: 2 }
          const statusDiff = (order[a.statut] ?? 3) - (order[b.statut] ?? 3)
          if (statusDiff !== 0) return statusDiff
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [serviceTickets, activeTab, search])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTickets()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "queue",   label: "En attente", icon: <Clock className="size-3.5" /> },
    { key: "history", label: "Historique", icon: <CheckCircle2 className="size-3.5" /> },
    { key: "absent",  label: "Absents",    icon: <UserX className="size-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-background pb-10">

      <div className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">File d'attente</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {counter ? `Guichet ${counter.name || counter.number}` : "Aucun guichet assigné"}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm font-semibold shadow-sm"
          >
            <RotateCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6 space-y-5">

        {!counter ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
            <Users className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Aucun guichet assigné pour le moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "En attente", value: tabCounts.queue, color: "text-amber-600", iconBg: "bg-amber-500/10", icon: <Clock className="size-4 text-amber-600" /> },
                { label: "Terminés", value: tabCounts.history, color: "text-emerald-600", iconBg: "bg-emerald-500/10", icon: <CheckCircle2 className="size-4 text-emerald-600" /> },
                { label: "Absents", value: tabCounts.absent, color: "text-destructive", iconBg: "bg-destructive/10", icon: <UserX className="size-4 text-destructive" /> },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                  <div className={`size-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                    {s.icon}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher par ticket, nom ou téléphone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-accent/40"
                />
              </div>
              <div className="flex bg-muted rounded-xl p-1 gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
                    }`}>
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

      
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      {["Ticket", "Patient", "Téléphone", "Statut", "Heure", "Durée"].map(col => (
                        <th key={col} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <AnimatePresence mode="wait">
                    <motion.tbody
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="divide-y divide-border/60"
                    >
                      {filteredData.map((t) => {
                        const statusCfg = STATUS_CONFIG[t.statut] || { label: t.statut, className: "bg-muted text-muted-foreground border-border" }
                        const duration = getDuration(t)
                        return (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-black text-primary font-mono text-base tracking-tight">
                                {t.number}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">{t.userName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-muted-foreground text-xs tracking-wider">
                                {t.phone || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border", statusCfg.className)}>
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatDateTime(t.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {duration
                                ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{duration}</span>
                                : <span className="text-xs text-muted-foreground">—</span>
                              }
                            </td>
                          </tr>
                        )
                      })}

                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-14 text-center">
                            <Clock className="size-7 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-sm text-muted-foreground">
                              {search ? `Aucun résultat pour "${search}"` : "Aucun ticket dans cette catégorie."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </motion.tbody>
                  </AnimatePresence>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}