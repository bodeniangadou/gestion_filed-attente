"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Clock, Activity, Ticket, CheckCircle, Settings,
  AlertCircle, Power, Bell, ChevronRight, Stethoscope,
  Monitor, UserCog, Calendar, Download, FileSpreadsheet,
  FileText, TrendingUp, TrendingDown, Minus, ChevronDown, Check , CheckCircle2 , TicketIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useApp } from "@/lib/app-context"


type Period = "today" | "yesterday" | "week" | "month" | "custom"
type ExportSection = "stats" | "ticketsPerService" | "serviceStatus" | "ticketList"

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  month: "Ce mois",
  custom: "Période personnalisée",
}

interface ExportData {
  stats: {
    totalWaiting: number
    avgWaitTime: number
    ticketsCount: number
    activeAgents: number
    totalAgents: number
    completedCount: number
    cancelledCount: number
  }
  ticketsPerService: { name: string; count: number; waiting: number; done: number }[]
  serviceStatus: { name: string; active: boolean; activeCounters: number; waiting: number; total: number }[]
  ticketList: { number: string; service: string; status: string; time: string; counter: string }[]
}

const EXPORT_SECTION_LABELS: Record<ExportSection, { label: string; sub: string }> = {
  stats: { label: "Statistiques générales", sub: "Patients, temps moyen, tickets, agents" },
  ticketsPerService: { label: "Tickets par service", sub: "Nombre, en attente et traités par service" },
  serviceStatus: { label: "État des services", sub: "Statut actif/fermé, guichets, files" },
  ticketList: { label: "Liste détaillée des tickets", sub: "Numéro, service, heure, statut, guichet" },
}


function startOfDay(d: Date) {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c
}

function getDateRange(period: Period, customFrom?: string, customTo?: string) {
  const now = new Date()
  switch (period) {
    case "today": return { from: startOfDay(now), to: now }
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: new Date(new Date(y).setHours(23, 59, 59, 999)) }
    }
    case "week": {
      const w = new Date(now); w.setDate(w.getDate() - ((w.getDay() + 6) % 7))
      return { from: startOfDay(w), to: now }
    }
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    case "custom": {
      const from = customFrom ? new Date(customFrom) : startOfDay(now)
      const to = customTo ? new Date(new Date(customTo).setHours(23, 59, 59, 999)) : now
      return { from, to }
    }
  }
}

const STATUS_MAP = {
  waiting: "En attente",
  called: "Appelé",
  serving: "En cours",
  completed: "Terminé",
  absent: "Absent",
  cancelled: "Annulé"
} as const; 

type StatusKey = keyof typeof STATUS_MAP;

const translateStatus = (status: string | undefined) => {
  const key = status?.toLowerCase() as StatusKey;
  
  const label = STATUS_MAP[key] || status;
  
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
};
async function exportToPDF(sections: ExportSection[], data: ExportData, label: string) {
const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
  const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()


  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, pageW, 22, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text("Rapport de gestion", 14, 10)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`Période : ${label}`, 14, 16)
  doc.text(`Exporté le ${new Date().toLocaleString("fr-FR")}`, pageW - 14, 16, { align: "right" })

  let y = 30
  doc.setTextColor(30, 30, 30)

  function sectionTitle(title: string) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(29, 158, 117)
    doc.text(title, 14, y)
    doc.setTextColor(30, 30, 30)
    y += 2
  }

  if (sections.includes("stats")) {
    sectionTitle("Statistiques générales")
    autoTable(doc, {
      startY: y,
      head: [["Indicateur", "Valeur"]],
body: [
  ["Patients en attente", String(data.stats.totalWaiting)],
  ["Tickets traités", String(data.stats.ticketsCount)],
  ["Tickets terminés", String(data.stats.completedCount)],
  ["Tickets annulés", String(data.stats.cancelledCount)],
  ["Temps moyen (min)", String(data.stats.avgWaitTime)],
  ["Agents actifs", `${data.stats.activeAgents} / ${data.stats.totalAgents}`],
],
      theme: "striped",
      headStyles: { fillColor: [29, 158, 117] },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  if (sections.includes("ticketsPerService")) {
    sectionTitle("Tickets par service")
    autoTable(doc, {
      startY: y,
head: [["Service", "Total", "En attente", "Traités"]], 
      body: data.ticketsPerService.map(r => [r.name, r.count, r.waiting, r.done]),
      theme: "striped",
      headStyles: { fillColor: [29, 158, 117] },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  if (sections.includes("serviceStatus")) {
    sectionTitle("État des services")
    autoTable(doc, {
      startY: y,
head: [["Service", "Statut", "Guichets actifs", "En attente", "Total tickets"]], 
body: data.serviceStatus.map(r => [
      r.name, 
      r.active ? "Actif" : "Fermé", 
      r.activeCounters, 
      r.waiting, 
      r.total
  ]),
theme: "striped",
      headStyles: { fillColor: [29, 158, 117] },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  if (sections.includes("ticketList")) {
    sectionTitle("Liste des tickets")
    autoTable(doc, {
      startY: y,
      head: [["Numéro", "Service", "Guichet", "Heure", "Statut"]],
body: data.ticketList.map(t => [t.number, t.service, t.counter, t.time, translateStatus(t.status)]),
      theme: "striped",
      headStyles: { fillColor: [29, 158, 117] },
      margin: { left: 14, right: 14 },
    })
  }

  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Page ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: "center" })
  }

  doc.save(`rapport-${label.replace(/[^a-z0-9]/gi, "-")}.pdf`)
}


async function exportToExcel(sections: ExportSection[], data: ExportData, label: string) {
  const XLSX = await import("xlsx")
  const wb = XLSX.utils.book_new()

  if (sections.includes("stats")) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Indicateur", "Valeur"],
      ["Patients en attente", data.stats.totalWaiting],
      ["Tickets traités", data.stats.ticketsCount],
      ["Tickets terminés", data.stats.completedCount],
      ["Tickets annulés", data.stats.cancelledCount],
      ["Temps moyen (min)", data.stats.avgWaitTime],
      ["Agents actifs", `${data.stats.activeAgents} / ${data.stats.totalAgents}`],
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Statistiques")
  }

  if (sections.includes("ticketsPerService")) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Service", "Total", "En attente", "Traités"],
      ...data.ticketsPerService.map(r => [r.name, r.count, r.waiting, r.done]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Par service")
  }

  if (sections.includes("serviceStatus")) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Service", "Statut", "Guichets actifs", "En attente", "Total tickets"],
      ...data.serviceStatus.map(r => [r.name, r.active ? "Actif" : "Fermé", r.activeCounters, r.waiting, r.total]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Services")
  }

  if (sections.includes("ticketList")) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Numéro", "Service", "Guichet", "Heure", "Statut"],
      ...data.ticketList.map(t => [t.number, t.service, t.counter, t.time, translateStatus(t.status)]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Tickets")
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `rapport-${label.replace(/[^a-z0-9]/gi, "-")}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


function ExportDialog({
  open, type, onClose, data, periodLabel,
}: {
  open: boolean; type: "pdf" | "excel"; onClose: () => void; data: ExportData; periodLabel: string
}) {
  const [selected, setSelected] = useState<ExportSection[]>(["stats", "ticketsPerService", "serviceStatus"])
  const [loading, setLoading] = useState(false)

  function toggle(s: ExportSection) {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function run() {
    if (!selected.length) return
    setLoading(true)
    try {
      if (type === "pdf") await exportToPDF(selected, data, periodLabel)
      else await exportToExcel(selected, data, periodLabel)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const Icon = type === "pdf" ? FileText : FileSpreadsheet
  const color = type === "pdf" ? "text-red-600" : "text-green-700"

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`size-5 ${color}`} />
            Exporter en {type === "pdf" ? "PDF" : "Excel (.xlsx)"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1 mb-1">
          Période sélectionnée : <span className="font-medium text-foreground">{periodLabel}</span>
        </p>
        <div className="space-y-2">
          {(Object.entries(EXPORT_SECTION_LABELS) as [ExportSection, { label: string; sub: string }][]).map(([key, { label, sub }]) => (
            <label
              key={key}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <Checkbox
                id={key}
                checked={selected.includes(key)}
                onCheckedChange={() => toggle(key)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={run} disabled={!selected.length || loading} className="gap-2 min-w-[140px]">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Génération…
              </span>
            ) : (
              <>
                <Download className="size-4" />
                Télécharger {type === "pdf" ? "PDF" : "Excel"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


function PeriodFilterBar({
  period,
  onChange,
  customFrom,
  customTo,
  onCustomChange,
  onApplyCustom
}: {
  period: Period;
  onChange: (p: Period) => void;
  customFrom: string;
  customTo: string;
  onCustomChange: (from: string, to: string) => void;
  onApplyCustom: () => void;
}) {
  const [showCustomPopover, setShowCustomPopover] = useState(false)

  const handlePeriodClick = (p: Period) => {
    onChange(p)
    if (p === "custom") {
      setShowCustomPopover(!showCustomPopover)
    } else {
      setShowCustomPopover(false)
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-1.5 px-3 shadow-sm w-full sm:w-auto inline-flex">
      <div className="flex items-center gap-1.5 shrink-0 border-r border-border/60 pr-2.5 my-1">
        <Calendar className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground/80">Filtre</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {(["today", "yesterday", "week", "month"] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => handlePeriodClick(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200
              ${period === p
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10 font-semibold"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
              }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}

        <div className="relative">
          <button
            onClick={() => handlePeriodClick("custom")}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center gap-1
              ${period === "custom"
                ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                : "border-border/60 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
          >
            <span>{PERIOD_LABELS["custom"]}</span>
            <ChevronDown className={`size-3 transition-transform duration-200 ${showCustomPopover ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {period === "custom" && showCustomPopover && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-[280px] p-4 rounded-xl border border-border bg-card shadow-xl"
              >
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1">
                  <Calendar className="size-3 text-primary" /> Choisir l'intervalle
                </p>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date de début</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => onCustomChange(e.target.value, customTo)}
                      className="h-8.5 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date de fin</label>
                    <input
                      type="date"
                      value={customTo}
                      min={customFrom}
                      onChange={e => onCustomChange(customFrom, e.target.value)}
                      className="h-8.5 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1.5">
                    <Button
                      size="sm"
                      className="h-8 text-xs w-full rounded-lg font-medium gap-1.5"
                      onClick={() => { onApplyCustom(); setShowCustomPopover(false) }}
                      disabled={!customFrom || !customTo}
                    >
                      <Check className="size-3.5" />
                      Appliquer
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}



function Trend({ value, unit = "" }: { value: number; unit?: string }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="size-3" /> stable</span>
  const up = value > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}{value}{unit} vs période préc.
    </span>
  )
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell , AreaChart , Area  } from 'recharts';
interface ServiceChartData {
  name: string;
  value: number;
}
export function ServiceChart({ data }: { data: ServiceChartData[] }) {
    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
        />
        <Tooltip cursor={{fill: 'transparent'}} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}


export function AdminDashboard() {
  const { services, counters, agents, tickets, hospitalSettings, getStatistics, user } = useApp()

  const [greeting, setGreeting] = useState("Bonjour")
  const [period, setPeriod] = useState<Period>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [appliedCustomFrom, setAppliedCustomFrom] = useState("")
  const [appliedCustomTo, setAppliedCustomTo] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf")

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h >= 18 || h < 5 ? "Bonsoir" : "Bonjour")
  }, [])

  
  const { from, to } = useMemo(
    () => getDateRange(period, appliedCustomFrom || undefined, appliedCustomTo || undefined),
    [period, appliedCustomFrom, appliedCustomTo]
  )

  const prevRange = useMemo(() => {
    const duration = to.getTime() - from.getTime()
    return { from: new Date(from.getTime() - duration), to: new Date(from.getTime()) }
  }, [from, to])

  const periodTickets = useMemo(
    () => tickets.filter(t => { const d = new Date(t.createdAt); return d >= from && d <= to }),
    [tickets, from, to]
  )

  const prevTickets = useMemo(
    () => tickets.filter(t => { const d = new Date(t.createdAt); return d >= prevRange.from && d <= prevRange.to }),
    [tickets, prevRange]
  )

  const stats = getStatistics()
  const activeAgents = agents.filter(a => a.isOnline).length

  const periodLabel = useMemo(() => {
    if (period !== "custom") return PERIOD_LABELS[period]
    if (appliedCustomFrom && appliedCustomTo) {
      const f = new Date(appliedCustomFrom).toLocaleDateString("fr-FR")
      const t2 = new Date(appliedCustomTo).toLocaleDateString("fr-FR")
      return `${f} – ${t2}`
    }
    return PERIOD_LABELS.custom
  }, [period, appliedCustomFrom, appliedCustomTo])


  const waitingCount = periodTickets.filter(t => {
    const s = String(t.statut).toLowerCase();
    return s === "waiting" || s === "en attente" || s.includes("attente");
  }).length

  const completedCount = periodTickets.filter(t => {
    const s = String(t.statut).toLowerCase();
    return s === "completed" || s === "serving" || s === "done" || s === "terminé" || s === "termine" || s.includes("trait");
  }).length

  const cancelledCount = periodTickets.filter(t => {
    const s = String(t.statut).toLowerCase();
    return s === "cancelled" || s === "annulé" || s === "annule";
  }).length
const prevWaiting     = prevTickets.filter(t => (t.statut as string) === "waiting").length
  const prevTotal = prevTickets.length
const ticketsPerService = useMemo(() => {
  const map: Record<string, { name: string; count: number; waiting: number; done: number }> = {};
  
  periodTickets.forEach(t => {
    const sId = t.service?.id || t.service?.name || "inconnu";
    
    if (!map[sId]) {
      map[sId] = { name: t.service?.name || "Service inconnu", count: 0, waiting: 0, done: 0 };
    }
    
    map[sId].count++;
    
    const s = String(t.statut || "").toLowerCase();
    if (s === "waiting" || s.includes("attente")) map[sId].waiting++;
    if (s === "completed" || s === "serving" || s.includes("trait")) map[sId].done++;
  });
  
  return Object.values(map).sort((a, b) => b.count - a.count);
}, [periodTickets]);

  const maxTickets = Math.max(...ticketsPerService.map(s => s.count), 1)

const exportData = useMemo(() => {
  return {
    stats: {
      totalWaiting: waitingCount,
      avgWaitTime: stats.avgWaitTime || 18,
      ticketsCount: periodTickets.length,
      activeAgents,
      totalAgents: agents.length,
      completedCount,
      cancelledCount,
    },
    ticketsPerService,
    
    serviceStatus: services.map(s => {
      const sTickets = periodTickets.filter(t => t.service?.name === s.name);
      return {
        name: s.name,
        active: !!s.isActive,
        activeCounters: counters.filter(c => c.serviceId === s.id && c.isActive).length,
        waiting: sTickets.filter(t => t.statut === "waiting").length,
        total: sTickets.length,
      };
    }),

    ticketList: periodTickets.map(t => ({
      number: t.number || "—",
      service: t.service?.name || "Non assigné",
      status: t.statut || "—",
      time: new Date(t.createdAt).toLocaleTimeString("fr-FR"),
      counter: t.counterName || "Non assigné",
    })),
  };
}, [periodTickets, services, counters, waitingCount, completedCount, cancelledCount, stats, activeAgents, agents, ticketsPerService]);
const formatRelativeTime = (dateInput: string | Date) => {
  const date = new Date(dateInput);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  // 1. Moins d'une minute
  if (diffInSeconds < 60) return "à l'instant";
  
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
  
  if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const hier = new Date(now);
  hier.setDate(now.getDate() - 1);
  if (date.getDate() === hier.getDate() && date.getMonth() === hier.getMonth()) {
    return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};
const chartData = useMemo(() => {
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const count = tickets.filter(t => new Date(t.createdAt).toDateString() === d.toDateString()).length;
    return { name: dateStr, total: count };
  }).reverse();

 const serviceStats = tickets.reduce((acc: Record<string, number>, t) => {
  const serviceName = t.service?.name ||  "Inconnu";
  
  if (serviceName !== "Inconnu") {
    acc[serviceName] = (acc[serviceName] || 0) + 1;
  }
  
  return acc;
}, {});
  
  const serviceData = Object.entries(serviceStats).map(([name, value]) => ({ 
    name, 
    value 
  }));

  return { last7Days, serviceData };
}, [tickets]);
  const recentActivity = useMemo(() => {
  return tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 9) 
    .map(t => {
     
const type = t.statut === 'completed' ? 'complete' : 'ticket';
      return {
message: `${t.userName} a pris un ticket ${t.number}`,
time: formatRelativeTime(t.createdAt), 
type: type,
        icon: t.statut === 'completed' ? CheckCircle2 : TicketIcon,
      };
    });
}, [tickets]);

  function openExport(type: "pdf" | "excel") { setExportType(type); setExportOpen(true) }

  function handlePeriodChange(p: Period) {
    setPeriod(p)
    if (p !== "custom") { setAppliedCustomFrom(""); setAppliedCustomTo("") }
  }
  
const activeServicesCount = useMemo(() => {
  return services.filter(s => s.isActive === true).length; 
}, [services]);

const openCountersCount = useMemo(() => {
  return counters.filter(c => c.isActive === true).length;
}, [counters]);

const activeAgentsCount = useMemo(() => {
  return agents.filter(a => a.isOnline === true).length;
}, [agents]);
const activeServices = services.filter(s => s.isActive).length;
const openCounters = counters.filter(c => c.isActive).length;
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <div className="px-6 pt-8 pb-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting}, {user?.name || "Administrateur"}  👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Espace de gestion — Hopital du Mali
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openExport("pdf")}>
              <FileText className="size-4 text-red-500" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openExport("excel")}>
              <FileSpreadsheet className="size-4 text-green-700" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-4 space-y-6">

        {/* ── Period filter ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <PeriodFilterBar
            period={period}
            onChange={handlePeriodChange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomChange={(f, t2) => { setCustomFrom(f); setCustomTo(t2) }}
            onApplyCustom={() => { setAppliedCustomFrom(customFrom); setAppliedCustomTo(customTo) }}
          />
        </motion.div>

        {/* ── Stats grid ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Patients en attente", value: waitingCount,
              icon: Users, color: "text-blue-600", bg: "bg-blue-100",
              trend: waitingCount - prevWaiting,
            },
            {
              label: "Temps moyen d'attente", value: `${stats.avgWaitTime || 18} min`,
              icon: Clock, color: "text-amber-600", bg: "bg-amber-100",
              trend: 0,
            },
            {
              label: "Tickets sur la période", value: periodTickets.length,
              icon: Ticket, color: "text-primary", bg: "bg-primary/10",
              trend: periodTickets.length - prevTotal,
            },
            {
              label: "Agents actifs", value: `${activeAgents}/${agents.length}`,
              icon: UserCog, color: "text-violet-600", bg: "bg-violet-100",
              trend: 0,
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                        <Trend value={stat.trend} />
                      </div>
                      <div className={`flex size-12 items-center justify-center rounded-xl ${stat.bg}`}>
                        <Icon className={`size-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* ── Secondary stats row ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Tickets terminés", value: completedCount, color: "text-emerald-600", bar: "bg-emerald-500", pct: periodTickets.length ? Math.round(completedCount / periodTickets.length * 100) : 0 },
              { label: "Tickets annulés", value: cancelledCount, color: "text-rose-500", bar: "bg-rose-400", pct: periodTickets.length ? Math.round(cancelledCount / periodTickets.length * 100) : 0 },
              { label: "Taux de service", value: `${periodTickets.length ? Math.round(completedCount / periodTickets.length * 100) : 0}%`, color: "text-primary", bar: "bg-primary", pct: periodTickets.length ? Math.round(completedCount / periodTickets.length * 100) : 0 },
            ].map((s, i) => (
              <Card key={s.label} className="border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                  <Progress value={s.pct} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ── Quick access ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-base font-semibold text-foreground mb-3">Accès rapide</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
    { label: "Services", desc: `${activeServices} actifs`, icon: Stethoscope, path: "/admin/services" },
    { label: "Guichets", desc: `${openCounters} ouverts`, icon: Monitor, path: "/admin/counters" },
    { label: "Agents", desc: `${activeAgents} en ligne`, icon: UserCog, path: "/admin/agent" },
  ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.08 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.path}
                    className="flex w-full items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
  {/* Graphique 1 déjà existant */}
  
      <Card className="p-4">
  <h3 className="text-sm font-semibold mb-4">Affluence par jour</h3>
  <ResponsiveContainer width="100%" height={200}>
    <AreaChart data={chartData.last7Days}>
      <XAxis dataKey="name" fontSize={12} />
      <YAxis fontSize={12} />
      <Tooltip />
      <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#bfdbfe" />
    </AreaChart>
  </ResponsiveContainer>
</Card>
  {/* Graphique 2 : Le nouveau */}
  <Card className="p-4">
    <h3 className="text-sm font-semibold mb-4">Répartition par service</h3>
<ServiceChart data={chartData.serviceData} />
  </Card>
</div>

        {/* ── Main grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Tickets par service — bar chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Bar chart card */}
      

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="size-4 text-primary" />
                  Tickets par service
                  <Badge variant="outline" className="ml-1 font-normal text-xs">{periodLabel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketsPerService.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun ticket sur cette période</p>
                )}
                {ticketsPerService.slice(0, 6).map(svc => (
                  <div key={svc.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[160px]">{svc.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-muted-foreground">{svc.waiting} att.</span>
                        <span className="font-semibold text-foreground">{svc.count} total</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(svc.count / maxTickets) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Services status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Stethoscope className="size-4 text-primary" />
                  État des services
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                  <Link href="/admin/services">Voir tout</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {services.sort((a, b) => {
    const totalA = periodTickets.filter(t => t.service?.id === a.id).length;
    const totalB = periodTickets.filter(t => t.service?.id === b.id).length;
    return totalB - totalA; 
}).slice(0, 5).map(service => {
const activeCountersCount = counters.filter(c => String(c.serviceId) === String(service.id)).length
                    const queueCount = periodTickets.filter(t => t.service?.id === service.id && t.statut === "waiting").length
                    const totalForSvc = periodTickets.filter(t => t.service?.id === service.id).length
                    return (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`size-2.5 rounded-full ${service.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-sm text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeCountersCount} guichet{activeCountersCount !== 1 ? "s" : ""} · {totalForSvc} ticket{totalForSvc !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-sm text-foreground">{queueCount}</p>
                            <p className="text-xs text-muted-foreground">en att.</p>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs">
                            {service.isActive ? "Actif" : "Fermé"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent activity */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="size-4 text-primary" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
  {recentActivity.length > 0 ? (
    recentActivity.map((activity, index) => {
      const Icon = activity.icon;
      return (
        <div key={index} className="flex items-start gap-3">
          <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
            activity.type === "ticket" ? "bg-blue-100 text-blue-600" :
            activity.type === "agent" ? "bg-violet-100 text-violet-600" :
            activity.type === "complete" ? "bg-emerald-100 text-emerald-600" :
            "bg-amber-100 text-amber-600"
          }`}>
            <Icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{activity.message}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      );
    })
  ) : (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-muted-foreground italic">Aucune activité récente</p>
    </div>
  )}
</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Hospital control ── */}
      

      </div>

      {/* ── Export dialog ── */}
      <ExportDialog
        open={exportOpen}
        type={exportType}
        onClose={() => setExportOpen(false)}
        data={exportData}
        periodLabel={periodLabel}
      />
    </div>
  )
}