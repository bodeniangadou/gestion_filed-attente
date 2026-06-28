"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DailyEvolution } from "@/components/ui/dashbord/DailyEvolution"
import { TicketsDistribution } from "@/components/ui/dashbord/TicketsDistribution"
import { RecentActivities } from "@/components/ui/dashbord/RecentActivities"
import { 
  Phone, 
  PhoneOff, 
  RotateCcw, 
  UserX, 
  Volume2, 
  CheckCircle,
  Users,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Loader2,
  CalendarIcon,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
  isSameDay,
  format,
} from "date-fns"
import { fr } from "date-fns/locale"
import { type DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useApp, Ticket } from "@/lib/app-context"

type DatePreset = "today" | "yesterday" | "week" | "month" | "custom"

const PRESET_LABELS: Record<Exclude<DatePreset, "custom">, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  month: "Ce mois-ci",
}

function getRangeForPreset(preset: Exclude<DatePreset, "custom">): { from: Date; to: Date } {
  const now = new Date()
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) }
    case "yesterday": {
      const day = subDays(now, 1)
      return { from: startOfDay(day), to: endOfDay(day) }
    }
    case "week":
      return {
        from: startOfWeek(now, { locale: fr }),
        to: endOfWeek(now, { locale: fr }),
      }
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

function ticketInRange(ticket: Ticket, from: Date, to: Date): boolean {
  return isWithinInterval(new Date(ticket.createdAt), { start: from, end: to })
}

function StatCard({
  icon: Icon,
  value,
  label,
  iconClassName,
  iconBgClassName,
}: {
  icon: LucideIcon
  value: number | string
  label: string
  iconClassName?: string
  iconBgClassName?: string
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
    tickets,
    getCurrentAgent,
    getAgentCounter,
    getAgentQueue,
    callNextPatient,
    markAbsent,
    recallPatient,
    completeService,
    toggleCounter
  } = useApp()
  
  const agent = getCurrentAgent()
  const counter = getAgentCounter()
  const queue = getAgentQueue() || []

  const [datePreset, setDatePreset] = useState<DatePreset>("today")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const { from, to } = getRangeForPreset("today")
    return { from, to }
  })
  
  const [currentPatient, setCurrentPatient] = useState<Ticket | null>(null)
  const [isAnnouncing, setIsAnnouncing] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const activeRange = useMemo(() => {
    if (datePreset === "custom" && dateRange?.from) {
      return {
        from: startOfDay(dateRange.from),
        to: endOfDay(dateRange.to ?? dateRange.from),
      }
    }
    if (datePreset !== "custom") {
      return getRangeForPreset(datePreset)
    }
    return getRangeForPreset("today")
  }, [datePreset, dateRange])

  const filteredTickets = useMemo(() => {
    if (!counter?.serviceId) return []
    return tickets
      .filter((t) => t.service?.id === counter.serviceId)
      .filter((t) => ticketInRange(t, activeRange.from, activeRange.to))
  }, [tickets, counter?.serviceId, activeRange])

  const ticketStats = useMemo(() => ({
    waiting: filteredTickets.filter(
      (t) => t.statut === "waiting" || t.statut === "called" || t.statut === "serving"
    ).length,
    completed: filteredTickets.filter((t) => t.statut === "completed").length,
    cancelled: filteredTickets.filter((t) => t.statut === "cancelled").length,
    absent: filteredTickets.filter((t) => t.statut === "absent").length,
  }), [filteredTickets])

  const dateLabel = useMemo(() => {
    if (datePreset !== "custom") return PRESET_LABELS[datePreset]
    if (dateRange?.from) {
      if (dateRange.to && !isSameDay(dateRange.from, dateRange.to)) {
        return `${format(dateRange.from, "d MMM", { locale: fr })} – ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`
      }
      return format(dateRange.from, "d MMMM yyyy", { locale: fr })
    }
    return "Période personnalisée"
  }, [datePreset, dateRange])

  const handlePresetChange = (preset: Exclude<DatePreset, "custom">) => {
    setDatePreset(preset)
    const range = getRangeForPreset(preset)
    setDateRange({ from: range.from, to: range.to })
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from) setDatePreset("custom")
  }

  // CORRIGÉ : counter.currentTicket n'existe pas dans le type Counter.
  // Le patient actuel est désormais dérivé du tableau `tickets` (temps réel via
  // le canal Realtime du context) : ticket rattaché à ce guichet avec statut
  // "called" ou "serving".
  useEffect(() => {
    if (!counter) {
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    }

    const ticketActif = tickets.find(
      (t) => t.counterId === counter.id && (t.statut === "called" || t.statut === "serving")
    )
    setCurrentPatient(ticketActif || null)
    setIsLoading(false)
  }, [counter, tickets])

  const handleCallNext = async () => {
    if (!counter || actionLoading) return
    setActionLoading(true)
    try {
      const nextTicket = await callNextPatient()
      if (nextTicket) {
        setCurrentPatient(nextTicket)
        setIsAnnouncing(true)
        setLastAction(`Ticket ${nextTicket.number} appelé`)
        setTimeout(() => setIsAnnouncing(false), 3000)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecall = async () => {
    if (!currentPatient || actionLoading) return
    setActionLoading(true)
    try {
      await recallPatient(currentPatient.id)
      setIsAnnouncing(true)
      setLastAction(`Rappel du ticket ${currentPatient.number}`)
      setTimeout(() => setIsAnnouncing(false), 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkAbsent = async () => {
    if (!currentPatient || actionLoading) return
    setActionLoading(true)
    try {
      await markAbsent(currentPatient.id)
      setLastAction(`Ticket ${currentPatient.number} marqué absent`)
      setCurrentPatient(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!currentPatient || actionLoading) return
    setActionLoading(true)
    try {
      await completeService(currentPatient.id)
      setLastAction(`Ticket ${currentPatient.number} terminé`)
      setCurrentPatient(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleCounter = async (open: boolean) => {
    await toggleCounter(open)
    setLastAction(open ? "Guichet ouvert" : "Guichet fermé")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Chargement de votre guichet Rang+...</p>
      </div>
    )
  }

  // if (!agent || !counter) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-background p-6">
  //       <Card className="max-w-md w-full text-center p-8 border-0 shadow-lg bg-card">
  //         <AlertTriangle className="mx-auto size-16 text-amber-500 mb-4" />
  //         <h2 className="text-xl font-bold text-foreground mb-2">Aucun guichet assigné</h2>
  //         <p className="text-muted-foreground">
  //           Vous n&apos;êtes pas assigné à un guichet actif pour l&apos;Hôpital du Mali. Contactez votre administrateur.
  //         </p>
  //       </Card>
  //     </div>
  //   )
  // }
if (!counter) {
  return (
    <div className="flex h-20 items-center justify-center text-muted-foreground">
      Chargement du guichet...
    </div>
  );
}
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              {counter.name.split(" ")[1] || "Guichet Inconnu Erreur"}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{counter.name}</h1>
              <p className="text-sm text-muted-foreground">{counter.serviceName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {counter.isActive ? (
                <Wifi className="size-4 text-primary" />
              ) : (
                <WifiOff className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {counter.isActive ? "En ligne" : "Hors ligne"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={counter?.isActive} 
                onCheckedChange={handleToggleCounter}
              />
            </div>
          </div>
        </div>
      </div>
<div className="mx-auto max-w-5xl px-6 pt-6">
        <h2 className="text-xl font-semibold text-foreground">
          {new Date().getHours() < 18 ? "Bonjour" : "Bonsoir"}, {agent?.name || "Agent"}
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Ravi de vous retrouver sur votre interface de gestion.
        </p>
      </div>
      <div className="mx-auto max-w-5xl p-6">
        {/* Filtre par date */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as Array<Exclude<DatePreset, "custom">>).map((preset) => (
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
                onSelect={handleCalendarSelect}
                locale={fr}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Statistiques filtrées */}
        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users} value={ticketStats.waiting} label="En attente" />
          <StatCard icon={CheckCircle} value={ticketStats.completed} label="Traités" />
          <StatCard
            icon={XCircle}
            value={ticketStats.cancelled}
            label="Annulés"
            iconClassName="text-muted-foreground"
            iconBgClassName="bg-muted"
          />
          <StatCard
            icon={UserX}
            value={ticketStats.absent}
            label="Absents"
            iconClassName="text-red-500"
            iconBgClassName="bg-red-500/10"
          />
          <StatCard icon={Clock} value={`~${Math.round(queue.length * 5)}`} label="min attente" />
        </div>

 
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <DailyEvolution />
            <TicketsDistribution />
          <RecentActivities />
</div>

        {/* Counter Control */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <Card className={counter.isActive ? "border-primary/30 bg-primary/5" : "border-red-200 bg-red-50"}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {counter.isActive ? (
                  <Play className="size-5 text-primary" />
                ) : (
                  <Pause className="size-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {counter.isActive ? "Guichet actif" : "Guichet fermé"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {counter.isActive 
                      ? "Vous recevez des patients" 
                      : "Les patients ne sont pas dirigés vers ce guichet"
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleToggleCounter(!counter.isActive)}
                variant={counter.isActive ? "destructive" : "default"}
                className="gap-2"
              >
                {counter.isActive ? (
                  <>
                    <PhoneOff className="size-4" />
                    Fermer
                  </>
                ) : (
                  <>
                    <Phone className="size-4" />
                    Ouvrir
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>

  )
}