"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DailyEvolution } from "@/components/ui/dashbord/DailyEvolution"
import { TicketsDistribution } from "@/components/ui/dashbord/TicketsDistribution"
import { RecentActivities } from "@/components/ui/dashbord/RecentActivities"
import {
  Phone, PhoneOff, UserX, CheckCircle, Users, Clock,
  Wifi, WifiOff, Play, Pause, Loader2, CalendarIcon,
  XCircle, AlertTriangle, ChevronRight, Info,
  type LucideIcon,
} from "lucide-react"
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subDays,
  isWithinInterval, isSameDay, format,
} from "date-fns"
import { fr } from "date-fns/locale"
import { type DateRange } from "react-day-picker"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useApp, Ticket, Counter } from "@/lib/app-context"
import { toast } from "sonner"

type DatePreset = "today" | "yesterday" | "week" | "month" | "custom"

const PRESET_LABELS: Record<Exclude<DatePreset, "custom">, string> = {
  today: "Aujourd'hui", yesterday: "Hier",
  week: "Cette semaine", month: "Ce mois-ci",
}

function getRangeForPreset(preset: Exclude<DatePreset, "custom">): { from: Date; to: Date } {
  const now = new Date()
  switch (preset) {
    case "today":     return { from: startOfDay(now), to: endOfDay(now) }
    case "yesterday": { const d = subDays(now, 1); return { from: startOfDay(d), to: endOfDay(d) } }
    case "week":      return { from: startOfWeek(now, { locale: fr }), to: endOfWeek(now, { locale: fr }) }
    case "month":     return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

function ticketInRange(ticket: Ticket, from: Date, to: Date): boolean {
  return isWithinInterval(new Date(ticket.createdAt), { start: from, end: to })
}

function StatCard({ icon: Icon, value, label, iconClassName, iconBgClassName }: {
  icon: LucideIcon; value: number | string; label: string
  iconClassName?: string; iconBgClassName?: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", iconBgClassName ?? "bg-primary/10")}>
          <Icon className={cn("size-5", iconClassName ?? "text-primary")} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AgentDashboard() {
  const {
    tickets, getCurrentAgent, getAgentCounter, getAgentQueue,
    toggleCounter, requestCloseCounter, redirectPendingTicketsAndClose,
    cancelPendingTicketsAndClose, keepPendingTicketsAndClose,
  } = useApp()

  const agent   = getCurrentAgent()
  const counter = getAgentCounter()
  const queue   = getAgentQueue() || []

  const [showCloseDialog,   setShowCloseDialog]   = useState(false)
  const [pendingTickets,    setPendingTickets]     = useState<Ticket[]>([])

  // Le guichet de repli est calculé une seule fois, à l'ouverture du dialog
  // (dans requestCloseCounter), donc le bouton "Rediriger" est désactivé dès
  // l'affichage si aucun autre guichet actif n'existe pour ce service.
  const [availableCounter,  setAvailableCounter]  = useState<Counter | null>(null)
  const [isCheckingCounters, setIsCheckingCounters] = useState(false)

  const [isProcessingClose, setIsProcessingClose] = useState(false)
  const [isToggling,        setIsToggling]        = useState(false)
  const [isLoading,         setIsLoading]         = useState(true)

  const [datePreset, setDatePreset] = useState<DatePreset>("today")
  const [dateRange,  setDateRange]  = useState<DateRange | undefined>(() => {
    const { from, to } = getRangeForPreset("today")
    return { from, to }
  })

  useEffect(() => {
    if (counter) setIsLoading(false)
    else { const t = setTimeout(() => setIsLoading(false), 1500); return () => clearTimeout(t) }
  }, [counter])

  const activeRange = useMemo(() => {
    if (datePreset === "custom" && dateRange?.from) {
      return { from: startOfDay(dateRange.from), to: endOfDay(dateRange.to ?? dateRange.from) }
    }
    return getRangeForPreset(datePreset as Exclude<DatePreset, "custom">)
  }, [datePreset, dateRange])

  const filteredTickets = useMemo(() => {
    if (!counter?.serviceId) return []
    return tickets
    .filter(t => t.counterId === counter.id)
      .filter(t => ticketInRange(t, activeRange.from, activeRange.to))
  }, [tickets, counter?.serviceId, activeRange])

  const ticketStats = useMemo(() => ({
    waiting:   filteredTickets.filter(t => ["waiting","called","serving"].includes(t.statut)).length,
    completed: filteredTickets.filter(t => t.statut === "completed" ).length,
    cancelled: filteredTickets.filter(t => t.statut === "cancelled").length,
    absent:    filteredTickets.filter(t => t.statut === "absent").length,
  }), [filteredTickets])

  const dateLabel = useMemo(() => {
    if (datePreset !== "custom") return PRESET_LABELS[datePreset as Exclude<DatePreset,"custom">]
    if (dateRange?.from) {
      if (dateRange.to && !isSameDay(dateRange.from, dateRange.to))
        return `${format(dateRange.from, "d MMM", { locale: fr })} – ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`
      return format(dateRange.from, "d MMMM yyyy", { locale: fr })
    }
    return "Période personnalisée"
  }, [datePreset, dateRange])

  const handlePresetChange = (preset: Exclude<DatePreset, "custom">) => {
    setDatePreset(preset)
    const r = getRangeForPreset(preset)
    setDateRange({ from: r.from, to: r.to })
  }

  // ── Ouverture du guichet — un seul point d'entrée pour le bandeau et la carte du bas
  const handleOpenCounter = useCallback(async () => {
    setIsToggling(true)
    try { await toggleCounter(true) } finally { setIsToggling(false) }
  }, [toggleCounter])

  // ── Demande de fermeture : ferme direct si rien en attente, sinon ouvre le dialog
  // avec les tickets + le guichet de repli déjà résolus par le contexte.
  const handleRequestClose = useCallback(async () => {
    setIsCheckingCounters(true)
    const result = await requestCloseCounter()
    setIsCheckingCounters(false)
    if (result.needsConfirmation) {
      setPendingTickets(result.pendingTickets)
      setAvailableCounter(result.availableCounter)
      setShowCloseDialog(true)
    }
  }, [requestCloseCounter])

  const handleSwitchToggle = async (checked: boolean) => {
    if (checked) await handleOpenCounter()
    else await handleRequestClose()
  }

  const handleRedirectAndClose = async () => {
    if (!availableCounter) return
    setIsProcessingClose(true)
    const ok = await redirectPendingTicketsAndClose(pendingTickets.map(t => t.id), availableCounter.id)
    setIsProcessingClose(false)
    if (ok) setShowCloseDialog(false)
  }

  const handleCancelAndClose = async () => {
    setIsProcessingClose(true)
    const ok = await cancelPendingTicketsAndClose(pendingTickets.map(t => t.id))
    setIsProcessingClose(false)
    if (ok) setShowCloseDialog(false)
  }

  const handleKeepWaitingAndClose = async () => {
    setShowCloseDialog(false)
    await keepPendingTicketsAndClose()
  }

  const handleStayOpen = () => {
    setShowCloseDialog(false)
    toast.info("Fermeture annulée.", { id: "counter-status" })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Chargement de votre guichet...</p>
      </div>
    )
  }

  if (!counter) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="size-10 opacity-30" />
        <p className="font-medium">Aucun guichet assigné</p>
        <p className="text-sm">Contactez votre administrateur.</p>
      </div>
    )
  }

  const counterInitials = (() => {
    const parts = counter.name.split(" ")
    return parts.length >= 2 ? parts[1] : counter.name.substring(0, 2)
  })()

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">

      {/* Header sticky */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex size-12 items-center justify-center rounded-xl font-bold text-lg transition-colors ${
              counter.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {counterInitials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{counter.name}</h1>
              <p className="text-sm text-muted-foreground">{counter.serviceName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {counter.isActive
                ? <Wifi className="size-4 text-emerald-500" />
                : <WifiOff className="size-4 text-muted-foreground" />
              }
              <span className={`text-sm font-medium hidden sm:inline ${counter.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                {counter.isActive ? "En ligne" : "Hors ligne"}
              </span>
            </div>
            <Switch
              checked={counter.isActive}
              onCheckedChange={handleSwitchToggle}
              disabled={isToggling || isCheckingCounters}
            />
          </div>
        </div>
      </div>

      {/* Bandeau guichet fermé */}
      <AnimatePresence>
        {!counter.isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-auto max-w-5xl px-6 pt-4"
          >
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="size-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700">Guichet fermé</p>
                <p className="text-xs text-amber-600">Les patients ne sont pas dirigés vers votre guichet.</p>
              </div>
              <Button
                size="sm"
                onClick={handleOpenCounter}
                disabled={isToggling}
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 shrink-0"
              >
                {isToggling ? <Loader2 className="size-3.5 animate-spin" /> : <Phone className="size-3.5" />}
                Ouvrir
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-6 pt-5">
        <h2 className="text-xl font-semibold text-foreground">
          {new Date().getHours() < 18 ? "Bonjour" : "Bonsoir"}, {agent?.name || "Agent"}
        </h2>
        <p className="text-sm text-muted-foreground mb-2">Ravi de vous retrouver sur votre interface de gestion.</p>
      </div>

      <div className="mx-auto max-w-5xl p-6 space-y-6">

        {/* Filtre date */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as Array<Exclude<DatePreset,"custom">>).map(preset => (
              <Button
                key={preset}
                variant={datePreset === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange(preset)}
              >
                {PRESET_LABELS[preset]}
              </Button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 justify-start sm:justify-center">
                <CalendarIcon className="size-4 shrink-0" />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(r) => { setDateRange(r); if (r?.from) setDatePreset("custom") }}
                locale={fr}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users}       value={ticketStats.waiting}   label="En attente" />
          <StatCard icon={CheckCircle} value={ticketStats.completed} label="Traités" />
          <StatCard icon={XCircle}     value={ticketStats.cancelled} label="Annulés"
            iconClassName="text-muted-foreground" iconBgClassName="bg-muted" />
          <StatCard icon={UserX}       value={ticketStats.absent}    label="Absents"
            iconClassName="text-red-500" iconBgClassName="bg-red-500/10" />
          <StatCard icon={Clock}       value={`~${Math.round(queue.length * 5)}`} label="min attente" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DailyEvolution />
          <TicketsDistribution />
          <RecentActivities />
        </div>

        {/* Bouton fermeture bas de page */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={counter.isActive ? "border-emerald-200 bg-emerald-50/50" : "border-muted bg-muted/20"}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {counter.isActive
                  ? <Play className="size-5 text-emerald-500" />
                  : <Pause className="size-5 text-muted-foreground" />
                }
                <div>
                  <p className="font-medium text-foreground">
                    {counter.isActive ? "Guichet actif" : "Guichet fermé"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {counter.isActive
                      ? "Vous recevez des patients"
                      : "Les patients ne sont pas dirigés vers ce guichet"}
                  </p>
                </div>
              </div>
              <Button
                onClick={counter.isActive ? handleRequestClose : handleOpenCounter}
                disabled={isToggling || isCheckingCounters}
                variant={counter.isActive ? "destructive" : "default"}
                className={cn("gap-2", !counter.isActive && "bg-emerald-500 hover:bg-emerald-600 text-white")}
              >
                {(isToggling || isCheckingCounters)
                  ? <Loader2 className="size-4 animate-spin" />
                  : counter.isActive
                    ? <><PhoneOff className="size-4" /> Fermer le guichet</>
                    : <><Phone className="size-4" /> Ouvrir le guichet</>
                }
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Dialog fermeture avec tickets en attente ─── */}
     <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
  <DialogContent className="sm:max-w-md rounded-2xl">
    <DialogHeader>
      <div className="flex items-center justify-center mb-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="size-6 text-amber-500" />
        </div>
      </div>
      <DialogTitle className="text-center text-lg font-bold">
        Fermer le guichet ?
      </DialogTitle>
      <DialogDescription className="text-center">
        Il y a actuellement <span className="font-bold text-amber-600">{pendingTickets.length}</span> patient{pendingTickets.length > 1 ? "s" : ""} en attente.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-2 mt-4">
      {/* Option 1 : Rediriger */}
      <Button
        onClick={handleRedirectAndClose}
        disabled={isProcessingClose || !availableCounter}
        className={cn(
          "w-full h-auto rounded-xl gap-3 font-semibold justify-start px-4 py-3",
          availableCounter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <ChevronRight className="size-5 shrink-0" />
        <div className="text-left overflow-hidden">
          <p className="text-sm truncate">Rediriger vers guichet {availableCounter?.number || "..."}</p>
          <p className="text-[11px] opacity-80 font-normal truncate">Les patients gardent leur place</p>
        </div>
      </Button>

      {/* Option 2 : Conserver */}
      <Button
        onClick={handleKeepWaitingAndClose}
        disabled={isProcessingClose}
        variant="outline"
        className="w-full h-auto rounded-xl gap-3 border-2 font-semibold justify-start px-4 py-3"
      >
        <Info className="size-5 shrink-0" />
        <div className="text-left overflow-hidden">
          <p className="text-sm truncate">Laisser en attente</p>
          <p className="text-[11px] text-muted-foreground font-normal truncate">Un autre agent prendra le relais</p>
        </div>
      </Button>

      {/* Option 3 : Annuler */}
      <Button
        onClick={handleCancelAndClose}
        disabled={isProcessingClose}
        variant="outline"
        className="w-full h-auto rounded-xl gap-3 border-2 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold justify-start px-4 py-3"
      >
        {isProcessingClose ? <Loader2 className="size-5 animate-spin shrink-0" /> : <XCircle className="size-5 shrink-0" />}
        <div className="text-left overflow-hidden">
          <p className="text-sm truncate">Annuler tous les tickets</p>
          <p className="text-[11px] opacity-70 font-normal truncate">Les patients devront se réinscrire</p>
        </div>
      </Button>

      {/* Option 4 : Rester ouvert */}
      <Button
        onClick={handleStayOpen}
        variant="ghost"
        className="w-full h-auto rounded-xl gap-3 text-muted-foreground hover:bg-muted font-medium justify-start px-4 py-3"
      >
        <Info className="size-5 shrink-0" />
        <p className="text-sm">Annuler et continuer à travailler</p>
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}