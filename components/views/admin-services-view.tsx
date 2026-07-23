"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Plus, Search, Edit, Trash2, QrCode,
  Stethoscope, Siren, ScanLine, FlaskConical, Pill, HeartPulse,
  Eye, Brain, Bone, Printer, Users, Clock, CheckCircle2, XCircle,
  SlidersHorizontal
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { useApp, Service } from "@/lib/app-context"

const iconOptions = [
  { value: "stethoscope", label: "Stéthoscope", icon: Stethoscope },
  { value: "siren", label: "Urgences", icon: Siren },
  { value: "scan", label: "Radiologie", icon: ScanLine },
  { value: "flask", label: "Laboratoire", icon: FlaskConical },
  { value: "pill", label: "Pharmacie", icon: Pill },
  { value: "heart-pulse", label: "Cardiologie", icon: HeartPulse },
  { value: "eye", label: "Ophtalmologie", icon: Eye },
  { value: "brain", label: "Neurologie", icon: Brain },
  { value: "bone", label: "Orthopédie", icon: Bone },
]

const getIconComponent = (iconName: string) => {
  return iconOptions.find(i => i.value === iconName)?.icon || Stethoscope
}

interface ServiceFormData {
  name: string
  description: string
  icon: string
  isActive: boolean
  openTime: string
  closeTime: string
}

export function AdminServicesView() {
  const { services, counters, tickets, agents, deleteService, fetchServices } = useApp()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [qrCodeService, setQrCodeService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "", description: "", icon: "stethoscope",
    isActive: true, openTime: "08:00", closeTime: "17:00"
  })

  // ── Filtres ──────────────────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && s.isActive) ||
          (filterStatus === "inactive" && !s.isActive)
        return matchSearch && matchStatus
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [services, searchQuery, filterStatus])

  // Stats
  const activeCount = services.filter(s => s.isActive).length
  const inactiveCount = services.filter(s => !s.isActive).length
  const totalWaiting = tickets.filter(t => t.statut === "waiting").length

  // ── Logique de suppression : bloquée si tickets, guichets ou agents liés ────
  const getServiceDependencies = (serviceId: string) => {
    const linkedTickets = tickets.filter(t => t.service?.id === serviceId).length
    const linkedCounters = counters.filter(c => c.serviceId === serviceId).length
    const linkedAgents = agents.filter(a => {
      const counter = counters.find(c => c.id_agent_actuel === a.id)
      return counter?.serviceId === serviceId
    }).length
    return { linkedTickets, linkedCounters, linkedAgents }
  }

  const canDelete = (serviceId: string) => {
    const { linkedTickets, linkedCounters, linkedAgents } = getServiceDependencies(serviceId)
    return linkedTickets === 0 && linkedCounters === 0 && linkedAgents === 0
  }

  const getDeleteTooltip = (serviceId: string) => {
    const { linkedTickets, linkedCounters, linkedAgents } = getServiceDependencies(serviceId)
    const reasons = []
    if (linkedTickets > 0) reasons.push(`${linkedTickets} ticket(s)`)
    if (linkedCounters > 0) reasons.push(`${linkedCounters} guichet(s)`)
    if (linkedAgents > 0) reasons.push(`${linkedAgents} agent(s)`)
    return reasons.length > 0 ? `Impossible de supprimer (Lié à : ${reasons.join(", ")})` : "Supprimer le service"
  }

  // ── Toggle statut ────────────────────────────────────────────────────────────
  const toggleServiceStatus = async (service: Service) => {
    await supabase.from("service").update({ is_active: !service.isActive }).eq("id", service.id)
    fetchServices()
    toast.success(`Service ${!service.isActive ? "activé" : "désactivé"}.`)
  }

  // ── Création ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const MON_ID_HOPITAL = "1789ea4c-f298-4109-803a-b036cda79ed0"
    const { error } = await supabase.from("service").insert([{
      nom: formData.name,
      description: formData.description,
      icon: formData.icon,
      is_active: false,
      open_time: formData.openTime.length > 5 ? formData.openTime : `${formData.openTime}:00`,
      close_time: formData.closeTime.length > 5 ? formData.closeTime : `${formData.closeTime}:00`,
      wait_time: 15,
      current_queue: 0,
      id_hopital: MON_ID_HOPITAL
    }])
    if (error) { toast.error("Erreur", { description: error.message }); return }
    toast.success("Service créé avec succès.")
    setShowCreateModal(false)
    resetForm()
    await fetchServices()
  }

  // ── Modification ─────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editingService) return
    setEditingService(null)
    const { error } = await supabase.from("service").update({
      nom: formData.name,
      description: formData.description,
      icon: formData.icon,
      open_time: formData.openTime.length > 5 ? formData.openTime : `${formData.openTime}:00`,
      close_time: formData.closeTime.length > 5 ? formData.closeTime : `${formData.closeTime}:00`,
    }).eq("id", editingService.id)
    if (error) { toast.error("Erreur de sauvegarde", { description: error.message }); return }
    toast.success("Service mis à jour.")
    await fetchServices()
    resetForm()
  }

  // ── Suppression ──────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!canDelete(id)) return
    if (confirm("Supprimer ce service définitivement ?")) deleteService(id)
  }

  const resetForm = () => setFormData({
    name: "", description: "", icon: "stethoscope",
    isActive: true, openTime: "08:00", closeTime: "17:00"
  })

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name, description: service.description,
      icon: service.icon, isActive: service.isActive,
      openTime: service.openTime || "08:00",
      closeTime: service.closeTime || "17:00"
    })
  }

  return (
    <div className="min-h-screen bg-background pb-12">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-8 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Services Médicaux</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{services.length} département{services.length !== 1 ? "s" : ""} configuré{services.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90 px-5 shadow-sm">
            <Plus className="size-4" /> Nouveau service
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-8 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Actifs</p>
              <p className="text-2xl font-bold text-emerald mt-0.5">{activeCount}</p>
            </div>
            <div className="size-10 rounded-lg bg-emerald/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-emerald" />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Inactifs</p>
              <p className="text-2xl font-bold text-destructive mt-0.5">{inactiveCount}</p>
            </div>
            <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="size-5 text-destructive" />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total services</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{services.length}</p>
            </div>
            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="size-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* ── Recherche + filtre ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-accent/40"
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl bg-accent/40 border-border">
              <SlidersHorizontal className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Grille services ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service, index) => {
            const Icon = getIconComponent(service.icon)
            const queueCount = tickets.filter(t => t.service?.id === service.id && t.statut === "waiting").length
            const deletable = canDelete(service.id)
            const deleteTitle = getDeleteTooltip(service.id)
            const { linkedCounters, linkedAgents } = getServiceDependencies(service.id)

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={`h-full border transition-all duration-200 hover:shadow-md ${
                  service.isActive
                    ? "border-emerald/30 bg-card"
                    : "border-border bg-muted/20 opacity-70"
                }`}>
                  <CardContent className="p-4 flex flex-col gap-3">

                    {/* Top : icône + nom + toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          service.isActive ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">{service.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => toggleServiceStatus(service)}
                        className="shrink-0 mt-0.5"
                      />
                    </div>

                    {/* Méta : file + horaires */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-accent/40 border border-border/40">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          <span>En attente</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{queueCount}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-accent/40 border border-border/40">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>Horaires</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {service.openTime?.substring(0, 5) || "08:00"} – {service.closeTime?.substring(0, 5) || "17:00"}
                        </span>
                      </div>
                    </div>

                    {/* Badges dépendances */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/60 text-muted-foreground">
                        {linkedCounters} guichet{linkedCounters !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/60 text-muted-foreground">
                        {linkedAgents} agent{linkedAgents !== 1 ? "s" : ""}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 ${
                          service.isActive
                            ? "border-emerald/30 text-emerald bg-emerald/5"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {service.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQrCodeService(service)}
                        className="h-7 px-2 text-xs text-primary hover:bg-primary/5 gap-1"
                      >
                        <QrCode className="size-3.5" /> QR Code
                      </Button>

                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditModal(service)}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={deleteTitle}
                          disabled={!deletable}
                          className={`size-7 ${deletable ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground/30 cursor-not-allowed"}`}
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
            <Stethoscope className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "Aucun service ne correspond à ces filtres."
                : "Aucun service configuré pour le moment."}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal Création / Édition ── */}
      <Dialog
        open={showCreateModal || !!editingService}
        onOpenChange={open => { if (!open) { setShowCreateModal(false); setEditingService(null); resetForm() } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">
              {editingService ? "Modifier le service" : "Nouveau service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom du service</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pédiatrie"
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Consultations enfants"
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icône</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {iconOptions.map(option => {
                  const IconOption = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                      title={option.label}
                      className={`p-2.5 rounded-xl border transition-all ${
                        formData.icon === option.value
                          ? "border-emerald bg-emerald/10 shadow-sm"
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <IconOption className={`size-4 mx-auto ${formData.icon === option.value ? "text-emerald" : "text-muted-foreground"}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ouverture</label>
                <Input type="time" value={formData.openTime} onChange={e => setFormData({ ...formData, openTime: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fermeture</label>
                <Input type="time" value={formData.closeTime} onChange={e => setFormData({ ...formData, closeTime: e.target.value })} className="mt-1.5 h-10" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); setEditingService(null); resetForm() }}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={editingService ? handleUpdate : handleCreate}
              disabled={!formData.name}
            >
              {editingService ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal QR Code ── */}
      <Dialog open={!!qrCodeService} onOpenChange={open => !open && setQrCodeService(null)}>
        <DialogContent className="sm:max-w-xs text-center p-6">
          <DialogHeader className="items-center">
            <DialogTitle className="font-bold">QR Code officiel</DialogTitle>
            <DialogDescription className="font-semibold text-emerald">
              {qrCodeService?.name}
            </DialogDescription>
          </DialogHeader>
          {qrCodeService && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="border border-border p-4 rounded-2xl bg-white shadow-sm flex flex-col items-center">
                <QRCodeSVG
                  value={`${window.location.origin}/scanner/${qrCodeService.id}`}
                  size={140}
                  level="H"
                />
                <p className="text-[11px] font-bold font-mono text-slate-800 mt-3 uppercase tracking-wider">
                  {qrCodeService.name}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Rang+ • Hôpital du Mali</p>
              </div>
              <Button onClick={() => window.print()} variant="outline" className="w-full gap-2 h-10">
                <Printer className="size-4" /> Imprimer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}