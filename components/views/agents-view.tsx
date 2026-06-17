"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, UserCog, Monitor, Stethoscope, MoreVertical, Edit2, Trash2, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp, Agent } from "@/lib/app-context"

export function AgentsView() {
  const { agents, setAgents, services, counters } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [newAgent, setNewAgent] = useState({ name: "", firstName: "", serviceId: "", counterId: "" })

  const handleCreate = () => {
    if (!newAgent.name || !newAgent.firstName) return
    
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgent.name,
      firstName: newAgent.firstName,
      role: "agent",
      serviceId: newAgent.serviceId || undefined,
      counterId: newAgent.counterId || undefined,
    }
    
    setAgents([...agents, agent])
    setShowCreateModal(false)
    setNewAgent({ name: "", firstName: "", serviceId: "", counterId: "" })
  }

  const handleAssign = () => {
    if (!selectedAgent) return
    
    setAgents(agents.map(a => 
      a.id === selectedAgent.id 
        ? { ...a, serviceId: newAgent.serviceId || undefined, counterId: newAgent.counterId || undefined }
        : a
    ))
    setShowAssignModal(false)
    setSelectedAgent(null)
    setNewAgent({ name: "", firstName: "", serviceId: "", counterId: "" })
  }

  const openAssignModal = (agent: Agent) => {
    setSelectedAgent(agent)
    setNewAgent({ 
      name: "", 
      firstName: "", 
      serviceId: agent.serviceId || "", 
      counterId: agent.counterId || "" 
    })
    setShowAssignModal(true)
  }

  const getServiceName = (serviceId?: string) => {
    if (!serviceId) return "Non assigné"
    return services.find(s => s.id === serviceId)?.name || "Non assigné"
  }

  const getCounterName = (counterId?: string) => {
    if (!counterId) return "Non assigné"
    return counters.find(c => c.id === counterId)?.name || "Non assigné"
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Agents</h1>
            <p className="text-sm text-muted-foreground">Gérer les comptes agents et leurs assignations</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90"
          >
            <Plus className="size-4" />
            Nouvel agent
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{agents.length}</p>
              <p className="text-sm text-muted-foreground">Total agents</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald">
                {agents.filter(a => a.counterId).length}
              </p>
              <p className="text-sm text-muted-foreground">Assignés</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="size-14">
                      <AvatarImage src={agent.photo} />
                      <AvatarFallback className="bg-emerald text-primary-foreground">
                        {agent.firstName?.charAt(0)}{agent.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {agent.firstName} {agent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Agent hospitalier</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAssignModal(agent)}>
                              <Link2 className="mr-2 size-4" />
                              Assigner
                            </DropdownMenuItem>
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

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Stethoscope className="size-3" />
                          {getServiceName(agent.serviceId)}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Monitor className="size-3" />
                          {getCounterName(agent.counterId)}
                        </Badge>
                      </div>
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
            <DialogTitle>Nouvel agent</DialogTitle>
            <DialogDescription>Créer un nouveau compte agent</DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Prénom</FieldLabel>
              <Input
                placeholder="Prénom de l'agent"
                value={newAgent.firstName}
                onChange={(e) => setNewAgent({ ...newAgent, firstName: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel>Nom</FieldLabel>
              <Input
                placeholder="Nom de l'agent"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel>Service (optionnel)</FieldLabel>
              <Select 
                value={newAgent.serviceId}
                onValueChange={(value) => setNewAgent({ ...newAgent, serviceId: value })}
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
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button 
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleCreate}
              disabled={!newAgent.name || !newAgent.firstName}
            >
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner {selectedAgent?.firstName}</DialogTitle>
            <DialogDescription>
              Lier l&apos;agent à un service et un guichet
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Service</FieldLabel>
              <Select 
                value={newAgent.serviceId}
                onValueChange={(value) => setNewAgent({ ...newAgent, serviceId: value })}
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
              <FieldLabel>Guichet</FieldLabel>
              <Select 
                value={newAgent.counterId}
                onValueChange={(value) => setNewAgent({ ...newAgent, counterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un guichet" />
                </SelectTrigger>
                <SelectContent>
                  {counters
                    .filter(c => !newAgent.serviceId || c.serviceId === newAgent.serviceId)
                    .map((counter) => (
                      <SelectItem key={counter.id} value={counter.id}>
                        {counter.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowAssignModal(false)}>
              Annuler
            </Button>
            <Button 
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleAssign}
            >
              Assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
