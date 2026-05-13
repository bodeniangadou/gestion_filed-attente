"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Monitor, User, Power, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/lib/app-context"

export function CountersView() {
  const { counters, setCounters, services, agents } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCounter, setNewCounter] = useState({ name: "", serviceId: "", agentId: "" })

  const toggleCounter = (id: string) => {
    setCounters(
      counters.map(c => 
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    )
  }

  const handleCreate = () => {
    if (!newCounter.name || !newCounter.serviceId) return
    
    const counter = {
      id: `counter-${Date.now()}`,
      name: newCounter.name,
      serviceId: newCounter.serviceId,
      agentId: newCounter.agentId || undefined,
      isActive: false,
    }
    
    setCounters([...counters, counter])
    setShowCreateModal(false)
    setNewCounter({ name: "", serviceId: "", agentId: "" })
  }

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || "Non assigné"
  }

  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Non assigné"
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.firstName} ${agent.name}` : "Non assigné"
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Guichets</h1>
            <p className="text-sm text-muted-foreground">Gérer les guichets physiques</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90"
          >
            <Plus className="size-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{counters.length}</p>
              <p className="text-sm text-muted-foreground">Total guichets</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald">
                {counters.filter(c => c.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md sm:col-span-1 col-span-2">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">
                {counters.filter(c => !c.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Inactifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Counters Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {counters.map((counter, index) => (
            <motion.div
              key={counter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border-2 transition-colors ${
                counter.isActive ? "border-emerald" : "border-border"
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-12 items-center justify-center rounded-xl ${
                        counter.isActive ? "bg-emerald text-primary-foreground" : "bg-accent text-muted-foreground"
                      }`}>
                        <Monitor className="size-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{counter.name}</h3>
                        <p className="text-sm text-muted-foreground">{getServiceName(counter.serviceId)}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 size-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 size-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Agent: {getAgentName(counter.agentId)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={counter.isActive ? "default" : "secondary"} className={
                      counter.isActive ? "bg-emerald text-primary-foreground" : ""
                    }>
                      {counter.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Power className={`size-4 ${counter.isActive ? "text-emerald" : "text-muted-foreground"}`} />
                      <Switch
                        checked={counter.isActive}
                        onCheckedChange={() => toggleCounter(counter.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau guichet</DialogTitle>
            <DialogDescription>Créer un nouveau guichet physique</DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Nom du guichet</FieldLabel>
              <Input
                placeholder="Ex: Guichet A3"
                value={newCounter.name}
                onChange={(e) => setNewCounter({ ...newCounter, name: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel>Service assigné</FieldLabel>
              <Select 
                value={newCounter.serviceId}
                onValueChange={(value) => setNewCounter({ ...newCounter, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Agent assigné (optionnel)</FieldLabel>
              <Select 
                value={newCounter.agentId}
                onValueChange={(value) => setNewCounter({ ...newCounter, agentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button 
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleCreate}
              disabled={!newCounter.name || !newCounter.serviceId}
            >
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
