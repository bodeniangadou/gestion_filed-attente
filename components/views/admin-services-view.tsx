"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Power, 
  Clock,
  Users,
  QrCode,
  ArrowLeft,
  Stethoscope,
  Siren,
  ScanLine,
  FlaskConical,
  Pill,
  HeartPulse,
  Eye,
  Brain,
  Bone
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApp, Service } from "@/lib/app-context"

interface AdminServicesViewProps {
  onBack: () => void
}

const iconOptions = [
  { value: "stethoscope", label: "Stethoscope", icon: Stethoscope },
  { value: "siren", label: "Urgences", icon: Siren },
  { value: "scan", label: "Radiologie", icon: ScanLine },
  { value: "flask", label: "Laboratoire", icon: FlaskConical },
  { value: "pill", label: "Pharmacie", icon: Pill },
  { value: "heart-pulse", label: "Cardiologie", icon: HeartPulse },
  { value: "eye", label: "Ophtalmologie", icon: Eye },
  { value: "brain", label: "Neurologie", icon: Brain },
  { value: "bone", label: "Orthopedie", icon: Bone },
]

const getIconComponent = (iconName: string) => {
  const found = iconOptions.find(i => i.value === iconName)
  return found ? found.icon : Stethoscope
}

export function AdminServicesView({ onBack }: AdminServicesViewProps) {
  const { services, counters, tickets, createService, updateService, deleteService } = useApp()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "stethoscope",
    openTime: "08:00",
    closeTime: "17:00",
    isActive: true
  })

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = () => {
    createService({
      ...formData,
      waitTime: 15,
      currentQueue: 0
    })
    setShowCreateModal(false)
    resetForm()
  }

  const handleUpdate = () => {
    if (editingService) {
      updateService(editingService.id, formData)
      setEditingService(null)
      resetForm()
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Etes-vous sur de vouloir supprimer ce service ?")) {
      deleteService(id)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "stethoscope",
      openTime: "08:00",
      closeTime: "17:00",
      isActive: true
    })
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      icon: service.icon,
      openTime: service.openTime,
      closeTime: service.closeTime,
      isActive: service.isActive
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Gestion des Services</h1>
              <p className="text-sm text-muted-foreground">{services.length} services configures</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nouveau service</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service, index) => {
            const Icon = getIconComponent(service.icon)
            const serviceCounters = counters.filter(c => c.serviceId === service.id)
            const activeCounters = serviceCounters.filter(c => c.isActive)
            const queueCount = tickets.filter(t => 
              t.service.id === service.id && t.status === "waiting"
            ).length

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${!service.isActive ? "opacity-60" : ""}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${service.isActive ? "bg-primary" : "bg-muted-foreground"}`} />
                  
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-12 items-center justify-center rounded-xl ${service.isActive ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`size-6 ${service.isActive ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(service)}>
                            <Edit className="size-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <QrCode className="size-4 mr-2" />
                            Generer QR
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="p-2 bg-accent/50 rounded-lg">
                        <p className="text-lg font-bold text-foreground">{queueCount}</p>
                        <p className="text-[10px] text-muted-foreground">En attente</p>
                      </div>
                      <div className="p-2 bg-accent/50 rounded-lg">
                        <p className="text-lg font-bold text-foreground">{activeCounters.length}</p>
                        <p className="text-[10px] text-muted-foreground">Guichets</p>
                      </div>
                      <div className="p-2 bg-accent/50 rounded-lg">
                        <p className="text-lg font-bold text-foreground">~{service.waitTime}</p>
                        <p className="text-[10px] text-muted-foreground">min</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {service.openTime} - {service.closeTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {service.isActive ? "Actif" : "Ferme"}
                        </span>
                        <Switch 
                          checked={service.isActive}
                          onCheckedChange={(checked) => updateService(service.id, { isActive: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="mx-auto size-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucun service trouve</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
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
            <DialogTitle>
              {editingService ? "Modifier le service" : "Nouveau service"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Modifiez les informations du service" 
                : "Creez un nouveau service medical"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nom du service</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pediatrie"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Soins pour enfants"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Icone</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {iconOptions.map((option) => {
                  const IconOption = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        formData.icon === option.value 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <IconOption className={`size-5 mx-auto ${
                        formData.icon === option.value ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Ouverture</label>
                <Input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Fermeture</label>
                <Input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Service actif</p>
                <p className="text-sm text-muted-foreground">Visible par les patients</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowCreateModal(false)
                setEditingService(null)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button 
              className="flex-1"
              onClick={editingService ? handleUpdate : handleCreate}
              disabled={!formData.name}
            >
              {editingService ? "Enregistrer" : "Creer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
