"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Monitor,
  User,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApp, Counter } from "@/lib/app-context"

interface AdminCountersViewProps {
  onBack: () => void
}

export function AdminCountersView({ onBack }: AdminCountersViewProps) {
  const { 
    services, 
    counters, 
    agents, 
    createCounter, 
    updateCounter, 
    deleteCounter,
    assignAgentToCounter,
    unassignAgent 
  } = useApp()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterService, setFilterService] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<Counter | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    number: 1,
    serviceId: "",
    isActive: false
  })

  const filteredCounters = counters.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesService = filterService === "all" || c.serviceId === filterService
    return matchesSearch && matchesService
  })

  const availableAgents = agents.filter(a => !a.counterId)

  const handleCreate = () => {
    const service = services.find(s => s.id === formData.serviceId)
    if (!service) return
    
    createCounter({
      ...formData,
      serviceName: service.name,
      ticketsServed: 0
    })
    setShowCreateModal(false)
    resetForm()
  }

  
  const handleUpdate = () => {
    if (editingCounter) {
      const service = services.find(s => s.id === formData.serviceId)
      updateCounter(editingCounter.id, {
        ...formData,
        serviceName: service?.name || editingCounter.serviceName
      })
      setEditingCounter(null)
      resetForm()
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Etes-vous sur de vouloir supprimer ce guichet ?")) {
      deleteCounter(id)
    }
  }

  const handleAssign = (agentId: string) => {
    if (showAssignModal) {
      assignAgentToCounter(agentId, showAssignModal.id)
      setShowAssignModal(null)
    }
  }

  const handleUnassign = (counter: Counter) => {
    if (counter.agentId) {
      unassignAgent(counter.agentId)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      number: 1,
      serviceId: "",
      isActive: false
    })
  }

  const openEditModal = (counter: Counter) => {
    console.log("Edit fonctionne")
    setEditingCounter(counter)
    setFormData({
      name: counter.name,
      number: counter.number,
      serviceId: counter.serviceId,
      isActive: counter.isActive
    })
  }

  // Group counters by service
  const countersByService = services.map(service => ({
    service,
    counters: filteredCounters.filter(c => c.serviceId === service.id)
  })).filter(group => group.counters.length > 0 || filterService === "all")

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
              <h1 className="text-lg font-bold text-foreground">Gestion des Guichets</h1>
              <p className="text-sm text-muted-foreground">
                {counters.filter(c => c.isActive).length} guichets actifs sur {counters.length}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nouveau guichet</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un guichet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous les services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Counters by Service */}
        <div className="space-y-8">
          {countersByService.map(({ service, counters: serviceCounters }) => (
            <div key={service.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">{service.name}</h2>
                <Badge variant={service.isActive ? "default" : "secondary"}>
                  {serviceCounters.filter(c => c.isActive).length} / {serviceCounters.length} actifs
                </Badge>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {serviceCounters.map((counter, index) => (
                  <motion.div
                    key={counter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`relative overflow-hidden ${!counter.isActive ? "opacity-60" : ""}`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${counter.isActive ? "bg-primary" : "bg-muted-foreground"}`} />
                      
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex size-12 items-center justify-center rounded-xl font-bold text-lg ${
                              counter.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {counter.number}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{counter.name}</h3>
                              <p className="text-xs text-muted-foreground">{counter.serviceName}</p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    openEditModal(counter)
                                  }}
                                >
                                Modifier
                              </DropdownMenuItem>
                              {counter.agentId ? (
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault()
                                      setShowAssignModal(counter)
                                    }}
                                  >
                                  Retirer l&apos;agent
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setShowAssignModal(counter)}>
                                  <UserPlus className="size-4 mr-2" />
                                  Assigner un agent
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    handleDelete(counter.id)
                                  }}
                                >
                                <Trash2 className="size-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Agent Info */}
                        <div className={`p-3 rounded-xl mb-4 ${counter.agentId ? "bg-primary/5 border border-primary/20" : "bg-accent/50"}`}>
                          {counter.agentId ? (
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                                <User className="size-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{counter.agentName}</p>
                                <p className="text-xs text-muted-foreground">Agent assigne</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="size-4" />
                              <span className="text-sm">Aucun agent assigne</span>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="text-muted-foreground">Tickets servis</span>
                          <span className="font-semibold text-foreground">{counter.ticketsServed}</span>
                        </div>

                        {/* Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {counter.isActive ? (
                              <CheckCircle className="size-4 text-primary" />
                            ) : (
                              <XCircle className="size-4 text-muted-foreground" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {counter.isActive ? "Ouvert" : "Ferme"}
                            </span>
                          </div>
                          <Switch 
                            checked={counter.isActive}
                            onCheckedChange={(checked) => updateCounter(counter.id, { isActive: checked })}
                            disabled={!counter.agentId}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Add Counter Card */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: serviceCounters.length * 0.05 }}
                  onClick={() => {
                    setFormData({ ...formData, serviceId: service.id })
                    setShowCreateModal(true)
                  }}
                  className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-accent/30 transition-colors"
                >
                  <Plus className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Ajouter un guichet</span>
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        {filteredCounters.length === 0 && filterService !== "all" && (
          <div className="text-center py-12">
            <Monitor className="mx-auto size-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucun guichet pour ce service</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog 
        open={showCreateModal || !!editingCounter} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            setEditingCounter(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCounter ? "Modifier le guichet" : "Nouveau guichet"}
            </DialogTitle>
            <DialogDescription>
              {editingCounter 
                ? "Modifiez les informations du guichet" 
                : "Creez un nouveau guichet"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nom du guichet</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Guichet A1"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Numero</label>
              <Input
                type="number"
                min={1}
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Service</label>
              <Select 
                value={formData.serviceId} 
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowCreateModal(false)
                setEditingCounter(null)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button 
              className="flex-1"
              onClick={editingCounter ? handleUpdate : handleCreate}
              disabled={!formData.name || !formData.serviceId}
            >
              {editingCounter ? "Enregistrer" : "Creer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Modal */}
      <Dialog open={!!showAssignModal} onOpenChange={(open) => !open && setShowAssignModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un agent</DialogTitle>
            <DialogDescription>
              Selectionnez un agent pour le guichet {showAssignModal?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="mx-auto size-12 mb-3 text-muted-foreground/30" />
                <p>Aucun agent disponible</p>
                <p className="text-sm">Tous les agents sont deja assignes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => handleAssign(agent.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{agent.firstName} {agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
