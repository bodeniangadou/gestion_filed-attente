"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
      .filter((t) => t.service.id === counter.serviceId)
      .filter((t) => ticketInRange(t, activeRange.from, activeRange.to))
  }, [tickets, counter?.serviceId, activeRange])

  const ticketStats = useMemo(() => ({
    waiting: filteredTickets.filter(
      (t) => t.status === "waiting" || t.status === "called" || t.status === "serving"
    ).length,
    completed: filteredTickets.filter((t) => t.status === "completed").length,
    cancelled: filteredTickets.filter((t) => t.status === "cancelled").length,
    absent: filteredTickets.filter((t) => t.status === "absent").length,
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

  useEffect(() => {
    if (counter) {
      if (counter.currentTicket) {
        setCurrentPatient(counter.currentTicket)
      } else {
        setCurrentPatient(null)
      }
      setIsLoading(false)
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [counter])

  const handleCallNext = () => {
    if (!counter) return
    const nextTicket = callNextPatient()
    if (nextTicket) {
      setCurrentPatient(nextTicket)
      setIsAnnouncing(true)
      setLastAction(`Ticket ${nextTicket.number} appelé`)
      setTimeout(() => setIsAnnouncing(false), 3000)
    }
  }

  const handleRecall = () => {
    if (currentPatient) {
      recallPatient(currentPatient.id)
      setIsAnnouncing(true)
      setLastAction(`Rappel du ticket ${currentPatient.number}`)
      setTimeout(() => setIsAnnouncing(false), 3000)
    }
  }

  const handleMarkAbsent = () => {
    if (currentPatient) {
      markAbsent(currentPatient.id)
      setLastAction(`Ticket ${currentPatient.number} marqué absent`)
      setCurrentPatient(null)
    }
  }

  const handleComplete = () => {
    if (currentPatient) {
      completeService(currentPatient.id)
      setLastAction(`Ticket ${currentPatient.number} terminé`)
      setCurrentPatient(null)
    }
  }

  const handleToggleCounter = (open: boolean) => {
    toggleCounter(open)
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

  if (!agent || !counter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border-0 shadow-lg bg-card">
          <AlertTriangle className="mx-auto size-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Aucun guichet assigné</h2>
          <p className="text-muted-foreground">
            Vous n&apos;êtes pas assigné à un guichet actif pour l&apos;Hôpital du Mali. Contactez votre administrateur.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              {counter.name.split(" ")[1] || "G1"}
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
                checked={counter.isActive} 
                onCheckedChange={handleToggleCounter}
              />
            </div>
          </div>
        </div>
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

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main Console */}
          <div className="lg:col-span-3">
            {/* Current Patient Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden border-0 shadow-xl">
                {/* Correction de la chaîne de classe Tailwind dynamique */}
                <div className={`p-6 transition-colors duration-200 ${currentPatient ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm ${currentPatient ? "text-white/80" : "text-muted-foreground"}`}>
                        Patient actuel
                      </p>
                      <AnimatePresence mode="wait">
                        {currentPatient ? (
                          <motion.div
                            key={currentPatient.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <p className="text-5xl font-bold mt-2">{currentPatient.number}</p>
                            <p className="mt-2 text-lg font-medium">{currentPatient.userName}</p>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p className="text-3xl font-medium mt-2 text-muted-foreground">
                              Aucun patient
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground/80">
                              Cliquez sur &quot;Appeler Suivant&quot; pour commencer
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {currentPatient && (
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                        {currentPatient.status === "called" ? "Appelé" : "En cours"}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleCallNext}
                      disabled={!counter.isActive || queue.length === 0 || !!currentPatient}
                      size="lg"
                      className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Phone className="size-7" />
                      <span>Appeler Suivant</span>
                    </Button>

                    <Button
                      onClick={handleRecall}
                      disabled={!currentPatient}
                      variant="outline"
                      size="lg"
                      className="h-20 flex-col gap-2 border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      <RotateCcw className="size-7" />
                      <span>Rappeler</span>
                    </Button>

                    <Button
                      onClick={handleMarkAbsent}
                      disabled={!currentPatient}
                      variant="outline"
                      size="lg"
                      className="h-20 flex-col gap-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <UserX className="size-7" />
                      <span>Absent</span>
                    </Button>

                    <Button
                      onClick={handleComplete}
                      disabled={!currentPatient}
                      variant="outline"
                      size="lg"
                      className="h-20 flex-col gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <CheckCircle className="size-7" />
                      <span>Terminer</span>
                    </Button>
                  </div>

                  {/* Voice Announcement */}
                  <AnimatePresence>
                    {isAnnouncing && currentPatient && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 flex items-center gap-3 rounded-xl bg-primary/10 p-4"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Volume2 className="size-5 text-primary" />
                        </motion.div>
                        <p className="text-sm text-primary font-medium">
                          Annonce : &quot;Ticket {currentPatient.number}, {counter.name}&quot;
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Last Action */}
                  {lastAction && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-center text-sm font-medium text-muted-foreground"
                    >
                      {lastAction}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Queue Sidebar */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      File d&apos;attente
                    </span>
                    <Badge variant="secondary">{queue.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {queue.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle className="mx-auto mb-3 size-12 text-primary/30" />
                      <p className="text-muted-foreground">Aucun patient</p>
                      <p className="text-sm text-muted-foreground/70">La file est vide</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {queue.map((ticket, index) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center justify-between rounded-xl p-3 ${
                            index === 0 ? "bg-primary/10 border border-primary/20" : "bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${
                              index === 0 ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{ticket.number}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {ticket.userName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {ticket.createdAt ? `${Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60000)} min` : "0 min"}
                            </p>
                            {index === 0 && (
                              <Badge variant="outline" className="text-[10px] mt-1 border-primary text-primary bg-background">
                                Prochain
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
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

