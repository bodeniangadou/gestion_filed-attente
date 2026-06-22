"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode,
  Stethoscope,
  Siren,
  ScanLine,
  FlaskConical,
  Pill,
  HeartPulse,
  Eye,
  Brain,
  Bone,
  Printer,
  Users
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const found = iconOptions.find(i => i.value === iconName)
  return found ? found.icon : Stethoscope
}

interface ServiceFormData {
  name: string
  description: string
  icon: string
  isActive: boolean
  openTime: string
  closeTime: string
}
export  function AdminServicesView() {
  const { services, counters, tickets, createService, updateService, deleteService , fetchServices } = useApp()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [qrCodeService, setQrCodeService] = useState<Service | null>(null)

  // Ajoute <ServiceFormData> après useState
const [formData, setFormData] = useState<ServiceFormData>({
  name: "",
  description: "",
  icon: "stethoscope",
  isActive: true,
  openTime: "08:00",
  closeTime: "17:00"
})

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

 const handleCreate = async () => {
  const MON_ID_HOPITAL = "1789ea4c-f298-4109-803a-b036cda79ed0";

  const { error } = await supabase
    .from("service")
    .insert([
      {
        nom: formData.name,
        description: formData.description,
        icon: formData.icon,
        is_active: false, 
        open_time: `${formData.openTime}:00`,
        close_time: `${formData.closeTime}:00`,
        wait_time: 15,
        current_queue: 0,
        id_hopital: MON_ID_HOPITAL
      }
    ]);

  if (error) {
    toast.error("Erreur", { description: error.message });
    return;
  }

  toast.success("Succès", { description: "Le service a été créé." });
  setShowCreateModal(false);
  resetForm();
  await fetchServices();
}

  const handleUpdate = () => {
    if (editingService) {
      updateService(editingService.id, formData)
      setEditingService(null)
      resetForm()
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
      deleteService(id)
    }
  }

  const resetForm = () => {
  setFormData({
    name: "",
    description: "",
    icon: "stethoscope",
    isActive: true,
    openTime: "08:00",
    closeTime: "17:00"
  })
}

const openEditModal = (service: Service) => {
  setEditingService(service)
  setFormData({
    name: service.name,
    description: service.description,
    icon: service.icon,
    isActive: service.isActive,
    openTime: service.openTime || "08:00",
    closeTime: service.closeTime || "17:00"
  })
}

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Services Médicaux</h1>
            <p className="text-xs text-muted-foreground">{services.length} départements configurés</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5 bg-primary text-primary-foreground text-xs h-9">
            <Plus className="size-3.5" />
            Nouveau service
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>

        {/* Grille de Cartes Ultra-Compactes */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service, index) => {
            const Icon = getIconComponent(service.icon)
            const queueCount = tickets.filter(t => t.service.id === service.id && t.status === "waiting").length
  const hasTickets = tickets.some(t => t.service.id === service.id);
const hasCounters = counters.some(c => c.serviceId === service.id);
  const canDelete = !hasTickets && !hasCounters;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className={`overflow-hidden border border-border/60 shadow-sm transition-all hover:border-primary/20 bg-card ${!service.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-3.5 flex flex-col justify-between h-full min-h-[130px]">
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate tracking-tight">{service.name}</h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={service.isActive}
                        onCheckedChange={(checked) => updateService(service.id, { isActive: checked })}
                        className="scale-75 origin-top-right"
                      />
                    </div>

                    {/* Partie Milieu: Badge File d'attente mini */}
                    <div className="mt-2.5 flex items-center justify-between px-2 py-1 rounded-md bg-muted/50 border border-border/20">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="size-3" />
                        <span>En attente :</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-foreground bg-background px-1.5 py-0.5 rounded border border-border/30 shadow-2xs">
                        {queueCount}
                      </span>
                    </div>
{/* Heures d'ouverture et fermeture */}
<div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
  <span>Ouverture: <strong className="text-foreground">{service.openTime?.substring(0, 5) || "08:00"}</strong></span>
  <span className="text-border">|</span>
  <span>Fermeture: <strong className="text-foreground">{service.closeTime?.substring(0, 5) || "17:00"}</strong></span>
</div>
                    {/* Partie Basse: Actions discrètes */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQrCodeService(service)}
                        className="h-7 px-2 text-[11px] font-medium text-primary hover:bg-primary/5 gap-1"
                      >
                        <QrCode className="size-3" />
                        Code QR
                      </Button>

                      <div className="flex items-center">
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
                className={`size-7 ${canDelete ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground/30 cursor-not-allowed"}`}
                disabled={!canDelete}
                onClick={() => canDelete && handleDelete(service.id)}
                title={canDelete ? "Supprimer" : "Impossible : Service lié à des tickets ou guichets."}
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
          <div className="text-center py-8 text-muted-foreground text-xs">
            Aucun service trouvé.
          </div>
        )}
      </div>

      {/* Modale de création / Édition */}
      <Dialog 
        open={showCreateModal || !!editingService} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            setEditingService(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingService ? "Modifier le service" : "Ajouter un service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-medium text-muted-foreground uppercase text-[10px]">Nom du service</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pédiatrie"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-medium text-muted-foreground uppercase text-[10px]">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Consultations enfants"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-medium text-muted-foreground uppercase text-[10px]">Icône</label>
              <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                {iconOptions.map((option) => {
                  const IconOption = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                      className={`p-2 rounded-lg border transition-all ${
                        formData.icon === option.value 
                          ? "border-primary bg-primary/10 shadow-xs" 
                          : "border-border/60 hover:border-primary/20"
                      }`}
                    >
                      <IconOption className={`size-4 mx-auto ${
                        formData.icon === option.value ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="font-medium text-muted-foreground uppercase text-[10px]">Ouverture</label>
    <Input
      type="time"
      value={formData.openTime}
      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
      className="mt-1 h-9 text-xs"
    />
  </div>
  <div>
    <label className="font-medium text-muted-foreground uppercase text-[10px]">Fermeture</label>
    <Input
      type="time"
      value={formData.closeTime}
      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
      className="mt-1 h-9 text-xs"
    />
  </div>
</div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={() => { setShowCreateModal(false); setEditingService(null); resetForm(); }}>
              Annuler
            </Button>
            <Button size="sm" className="flex-1 h-9 text-xs bg-primary text-primary-foreground" onClick={editingService ? handleUpdate : handleCreate} disabled={!formData.name}>
              {editingService ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale QR Code */}
      <Dialog open={!!qrCodeService} onOpenChange={(open) => !open && setQrCodeService(null)}>
        <DialogContent className="sm:max-w-xs text-center p-5">
          <DialogHeader className="items-center">
            <DialogTitle className="text-sm font-bold">Code QR Officiel</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-primary">
              {qrCodeService?.name}
            </DialogDescription>
          </DialogHeader>

          {qrCodeService && (
            <div className="flex flex-col items-center justify-center gap-4 py-1">
              <div className="border border-border p-4 rounded-xl bg-white shadow-xs flex flex-col items-center justify-center">
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
              
              <Button 
                onClick={() => window.print()} 
                variant="outline" 
                size="sm"
                className="w-full gap-1.5 h-9 border-border text-xs text-foreground"
              >
                <Printer className="size-3.5" />
                Imprimer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}