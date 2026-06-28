"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Search, Download, FileText, FileSpreadsheet, Ticket, Clock,
  CheckCircle, XCircle, PlayCircle, X, CalendarIcon, Monitor,
  Filter, Bell, UserX, User, type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useApp, Ticket as TicketType, Counter, Agent } from "@/lib/app-context"

// ── Config statuts ───────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; badge: string; dot: string; icon: LucideIcon }> = {
  waiting:   { label: "En attente", badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",   dot: "bg-amber-500",   icon: Clock },
  called:    { label: "Appelé",     badge: "bg-primary/10 text-primary border-primary/20",           dot: "bg-primary",     icon: Bell },
  serving:   { label: "En cours",   badge: "bg-blue-500/10 text-blue-700 border-blue-500/20",       dot: "bg-blue-500",    icon: PlayCircle },
  served:    { label: "Servi",      badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle },
  completed: { label: "Terminé",    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle },
  absent:    { label: "Absent",     badge: "bg-red-500/10 text-red-700 border-red-500/20",           dot: "bg-red-500",     icon: UserX },
  cancelled: { label: "Annulé",     badge: "bg-muted text-muted-foreground border-border",           dot: "bg-muted-foreground", icon: XCircle },
}

const getStatus = (s: string) => STATUS[s] ?? { label: s, badge: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", icon: Ticket }

type NormalizedTicket = {
  id: string; number: string; userName: string; status: string
  serviceId?: string; serviceName: string; counterId?: string; counterName: string
  agentId?: string; agentName: string; createdAt?: Date; calledAt?: Date; completedAt?: Date
}

// Résout l'agent réel via le guichet (counter.id_agent_actuel), car le ticket
// lui-même ne porte ni agentId ni agentName en BDD
function normalize(t: TicketType, counters: Counter[], agents: Agent[]): NormalizedTicket {
  const svc = t.service as { id?: string; name?: string } | undefined

  // counterId vient du ticket ; on remonte au guichet pour trouver l'agent qui l'occupe
  const matchingCounter = counters.find(c => c.id === t.counterId)
  const agentId = matchingCounter?.id_agent_actuel || undefined
  const matchingAgent = agentId ? agents.find(a => a.id === agentId) : undefined

  return {
    id: t.id,
    number: t.number ?? "—",
    userName: t.userName ?? "Anonyme",
    status: String(t.statut ?? "waiting"),

    serviceId: svc?.id,
    serviceName: String(svc?.name ?? "—"),
    counterId: t.counterId,
    counterName: t.counterName ?? "—",
    agentId: agentId,
    agentName: matchingAgent ? `${matchingAgent.firstName} ${matchingAgent.name}`.trim() : "—",
    createdAt: t.createdAt,
    calledAt: t.calledAt,
    completedAt: t.completedAt,
  }
}

function fmtDate(d?: Date | string) {
  if (!d) return "—"
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

/** Affichage relatif pour la liste : instant → min → HH:mm → jour+heure → date complète */
function fmtRelative(d?: Date | string) {
  if (!d) return "—"
  const date = new Date(d)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)

  if (diffMs < 60_000) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffHours < 24) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }
  if (diffHours < 72) {
    return date.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return fmtDate(d)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const { tickets, services, counters, agents } = useApp()

  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({ service: "all", counter: "all", agent: "all", status: "all", dateFrom: "", dateTo: "" })
  const [sheetOpen, setSheetOpen] = useState(false)

  const normalized = useMemo(
    () => tickets.map(t => normalize(t, counters, agents)),
    [tickets, counters, agents]
  )

  const availableCounters = useMemo(
    () => filters.service === "all" ? counters : counters.filter(c => c.serviceId === filters.service),
    [counters, filters.service]
  )
  // Agents disponibles pour le guichet sélectionné — résolus via id_agent_actuel du guichet
  const availableAgents = useMemo(() => {
    if (filters.counter === "all") return agents
    const counter = counters.find(c => c.id === filters.counter)
    return counter?.id_agent_actuel ? agents.filter(a => a.id === counter.id_agent_actuel) : []
  }, [agents, counters, filters.counter])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return normalized.filter(t => {
      const matchSearch = !q || [t.number, t.serviceName, t.counterName, t.agentName, t.userName, t.status]
        .some(v => v?.toLowerCase().includes(q))
      const matchService = filters.service === "all" || t.serviceId === filters.service
      const matchCounter = filters.counter === "all" || t.counterId === filters.counter
      const matchAgent = filters.agent === "all" || t.agentId === filters.agent
      const matchStatus = filters.status === "all" || t.status === filters.status
      let matchDate = true
      if (t.createdAt) {
        const d = new Date(t.createdAt)
        if (filters.dateFrom) matchDate = matchDate && d >= new Date(filters.dateFrom)
        if (filters.dateTo) {
          const end = new Date(filters.dateTo)
          end.setHours(23, 59, 59, 999)
          matchDate = matchDate && d <= end
        }
      }
      return matchSearch && matchService && matchCounter && matchAgent && matchStatus && matchDate
    })
  }, [normalized, search, filters])

  const stats = useMemo(() => ({
    total: filtered.length,
    waiting: filtered.filter(t => t.status === "waiting").length,
    active: filtered.filter(t => ["called", "serving"].includes(t.status)).length,
    done: filtered.filter(t => ["served", "completed"].includes(t.status)).length,
    cancelled: filtered.filter(t => t.status === "cancelled").length,
  }), [filtered])

  const activeFilterCount = [
    filters.service, filters.counter, filters.agent, filters.dateFrom, filters.dateTo,
  ].filter(v => v && v !== "all").length + (filters.status !== "all" ? 1 : 0)

  const resetFilters = () => {
    setSearch("")
    setFilters({ service: "all", counter: "all", agent: "all", status: "all", dateFrom: "", dateTo: "" })
  }

  const exportRows = filtered.map(t => ({
    "Numéro": t.number, "Patient": t.userName, "Statut": getStatus(t.status).label,
    "Service": t.serviceName, "Guichet": t.counterName, "Agent": t.agentName,
    "Création": fmtDate(t.createdAt), "Clôture": fmtDate(t.completedAt),
  }))

  const exportCSV = () => {
    if (!exportRows.length) return toast.error("Aucun ticket à exporter")
    const headers = Object.keys(exportRows[0])
    const csv = [headers.join(";"), ...exportRows.map(r => headers.map(h => `"${(r as Record<string, string>)[h] ?? ""}"`).join(";"))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success("CSV téléchargé")
  }

  const exportPDF = async () => {
    if (!exportRows.length) return toast.error("Aucun ticket à exporter")
    const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js")
    const { default: autoTable } = await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const w = doc.internal.pageSize.getWidth()

    doc.setFillColor(29, 158, 117)
    doc.rect(0, 0, w, 18, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Rapport des tickets", 14, 8)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Généré le ${new Date().toLocaleString("fr-FR")} — ${filtered.length} ticket(s)`, 14, 14)

    autoTable(doc, {
      startY: 24,
      head: [["Numéro", "Patient", "Statut", "Service", "Guichet", "Agent", "Création", "Clôture"]],
      body: exportRows.map(r => [r["Numéro"], r["Patient"], r["Statut"], r["Service"], r["Guichet"], r["Agent"], r["Création"], r["Clôture"]]),
      theme: "striped",
      headStyles: { fillColor: [29, 158, 117], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    })

    doc.save(`tickets_${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success("PDF téléchargé")
  }

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev, [key]: value,
      ...(key === "service" ? { counter: "all", agent: "all" } : {}),
      ...(key === "counter" ? { agent: "all" } : {}),
    }))
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Tickets</h1>
            <p className="text-sm text-muted-foreground">{stats.total} résultat{stats.total > 1 ? "s" : ""}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}>
                <Download className="size-4" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="size-4 text-emerald-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
                <FileText className="size-4 text-red-500" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 space-y-5">
        {/* Stats compactes */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: "Total", value: stats.total, icon: Ticket, cls: "text-foreground bg-muted" },
            { label: "Attente", value: stats.waiting, icon: Clock, cls: "text-amber-600 bg-amber-500/10" },
            { label: "Actifs", value: stats.active, icon: PlayCircle, cls: "text-blue-600 bg-blue-500/10" },
            { label: "Servis", value: stats.done, icon: CheckCircle, cls: "text-emerald-600 bg-emerald-500/10" },
            { label: "Annulés", value: stats.cancelled, icon: XCircle, cls: "text-muted-foreground bg-muted" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", s.cls.split(" ").slice(1).join(" "))}>
                  <s.icon className={cn("size-4", s.cls.split(" ")[0])} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Barre de recherche légère */}
        <section className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher ticket, patient, service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>

          <Select value={filters.status} onValueChange={v => updateFilter("status", v)}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 shrink-0">
                <Filter className="size-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="size-5 p-0 justify-center text-[10px]">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filtres avancés</SheetTitle>
              </SheetHeader>
              <div className="px-4 space-y-4">
                <FilterSelect label="Service" value={filters.service} onChange={v => updateFilter("service", v)}
                  options={[{ id: "all", name: "Tous" }, ...services.map(s => ({ id: s.id, name: s.name }))]} />
                <FilterSelect label="Guichet" value={filters.counter} onChange={v => updateFilter("counter", v)}
                  options={[{ id: "all", name: "Tous" }, ...availableCounters.map(c => ({ id: c.id, name: c.name }))]} />
                <FilterSelect label="Agent" value={filters.agent} onChange={v => updateFilter("agent", v)}
                  options={[{ id: "all", name: "Tous" }, ...availableAgents.map(a => ({ id: a.id, name: `${a.firstName} ${a.name}` }))]} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Du</label>
                    <Input type="date" value={filters.dateFrom} onChange={e => updateFilter("dateFrom", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Au</label>
                    <Input type="date" value={filters.dateTo} onChange={e => updateFilter("dateTo", e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={resetFilters}>Réinitialiser</Button>
                  <Button className="flex-1" onClick={() => setSheetOpen(false)}>Appliquer</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </section>

        {/* Tableau */}
        <section>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ticket className="size-4 text-primary" />
                Liste des tickets
                <Badge variant="secondary" className="ml-auto font-mono">{filtered.length}</Badge>
              </CardTitle>
            </CardHeader>

            {filtered.length === 0 ? (
              <CardContent className="py-16 text-center">
                <Ticket className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium">Aucun ticket trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">Modifiez votre recherche ou vos filtres.</p>
              </CardContent>
            ) : (
              <>
                {/* Desktop / tablette : tableau */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="pl-4">Code</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead className="hidden lg:table-cell">Service</TableHead>
                        <TableHead className="hidden lg:table-cell">Guichet</TableHead>
                        <TableHead className="hidden xl:table-cell">Agent</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="pr-4 text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(t => (
                        <TicketRow key={t.id} ticket={t} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile : liste compacte */}
                <div className="md:hidden divide-y divide-border">
                  {filtered.map(t => {
                    const cfg = getStatus(t.status)
                    const Icon = cfg.icon
                    return (
                      <div key={t.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <TicketCode number={t.number} />
                          <Badge variant="outline" className={cn("text-[10px] shrink-0 gap-1 mt-1", cfg.badge)}>
                            <Icon className="size-3" />{cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold uppercase text-primary shrink-0">
                            {t.userName.charAt(0)}
                          </div>
                          <p className="text-sm font-medium truncate">{t.userName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate pl-10">{t.serviceName}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pl-1">
                          <span className="flex items-center gap-1"><Monitor className="size-3" />{t.counterName}</span>
                          <span className="flex items-center gap-1"><User className="size-3" />{t.agentName}</span>
                          <span className="flex items-center gap-1"><CalendarIcon className="size-3" />{fmtRelative(t.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}

// ── Sous-composants légers ─────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { id: string; name: string }[]
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function TicketCode({ number }: { number: string }) {
  return (
    <span className="font-mono text-sm font-semibold text-primary">{number}</span>
  )
}

function TicketRow({ ticket: t }: { ticket: NormalizedTicket }) {
  const cfg = getStatus(t.status)
  const Icon = cfg.icon
  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      <TableCell className="pl-4 py-3.5">
        <TicketCode number={t.number} />
      </TableCell>
      <TableCell className="py-3.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold uppercase text-primary shrink-0">
            {t.userName.charAt(0)}
          </div>
          <span className="text-sm font-medium truncate max-w-[120px]">{t.userName}</span>
        </div>
      </TableCell>
      <TableCell className="py-3.5 hidden lg:table-cell">
        <span className="text-sm text-muted-foreground truncate max-w-[140px]">{t.serviceName}</span>
      </TableCell>
      <TableCell className="py-3.5 hidden lg:table-cell">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Monitor className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate max-w-[100px]">{t.counterName}</span>
        </span>
      </TableCell>
      <TableCell className="py-3.5 hidden xl:table-cell">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate max-w-[100px]">{t.agentName}</span>
        </span>
      </TableCell>
      <TableCell className="py-3.5">
        <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium px-2.5 py-1", cfg.badge)}>
          <Icon className="size-3 shrink-0" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell className="pr-4 py-3.5 text-right">
        <div className="text-sm text-muted-foreground">
          <p>{fmtRelative(t.createdAt)}</p>
          {t.completedAt && (
            <p className="text-[11px] mt-0.5 opacity-70">Clôturé {fmtRelative(t.completedAt)}</p>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}