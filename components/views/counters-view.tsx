"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Monitor, User, Power, MoreVertical, Edit2, Trash2, ShieldAlert } from "lucide-react"
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
    setCounters(counters.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
  }

  const handleDelete = (id: string) => {
    const counter = counters.find(c => c.id === id);
    if (counter && !counter.agentId && !counter.isActive) {
      setCounters(counters.filter(c => c.id !== id));
    } else {
      alert("Impossible de supprimer : le guichet est actif ou possède un agent assigné.");
    }
  };

 const handleCreate = () => {
  if (!newCounter.name || !newCounter.serviceId) return
  
  const counter: Counter = {
    id: `counter-${Date.now()}`,
    name: newCounter.name,
    serviceId: newCounter.serviceId,
    agentId: newCounter.agentId === "none" ? undefined : newCounter.agentId || undefined,
    isActive: false,
    number: 0,                   // Initialisation du numéro de guichet
    serviceName: getServiceName(newCounter.serviceId), // Récupération via ta fonction existante
    ticketsServed: 0,            // Initialisation à 0
  }
  
  setCounters([...counters, counter])
  setShowCreateModal(false)
  setNewCounter({ name: "", serviceId: "", agentId: "" })
 }
  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || "Non assigné"
  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Aucun agent connecté"
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.firstName} ${agent.name}` : "Aucun agent connecté"
  }

  return (
    <div className="min-h-screen bg-background/50 pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-8 py-5 sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Guichets Physiques</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pilotez les points d'accueil et leurs affectations</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90 h-9 px-4 text-xs font-medium rounded-lg shadow-sm">
            <Plus className="size-4" /> Nouveau guichet
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-8 space-y-8">
        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{counters.length}</p>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Total Guichets</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-emerald/20 bg-emerald/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald">{counters.filter(c => c.isActive).length}</p>
              <p className="text-[10px] uppercase text-emerald/80 font-semibold">Actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{counters.filter(c => !c.isActive).length}</p>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Fermés</p>
            </CardContent>
          </Card>
        </div>

        {/* Grille */}
        <div className="grid gap-6 sm:grid-cols-2">
          {counters.map((counter, index) => (
            <motion.div key={counter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className={`group relative transition-all ${counter.isActive ? "border-emerald/30 shadow-md" : "opacity-75 border-dashed border-border"}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${counter.isActive ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"}`}>
                        <Monitor className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{counter.name}</h3>
                        <p className="text-xs text-muted-foreground">{getServiceName(counter.serviceId)}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem><Edit2 className="mr-2 size-3.5" /> Modifier</DropdownMenuItem>
                        {!counter.agentId && !counter.isActive && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(counter.id)}>
                            <Trash2 className="mr-2 size-3.5" /> Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <User className="size-3.5" /> {getAgentName(counter.agentId)}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={counter.isActive ? "default" : "secondary"}>{counter.isActive ? "En ligne" : "Hors-ligne"}</Badge>
                    <Switch checked={counter.isActive} onCheckedChange={() => toggleCounter(counter.id)} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nouveau guichet</DialogTitle></DialogHeader>
          <FieldGroup className="space-y-4">
            <Field><FieldLabel className="text-xs">Nom</FieldLabel><Input className="h-9" value={newCounter.name} onChange={(e) => setNewCounter({...newCounter, name: e.target.value})} /></Field>
            <Field>
              <FieldLabel className="text-xs">Service</FieldLabel>
              <Select value={newCounter.serviceId} onValueChange={(v) => setNewCounter({...newCounter, serviceId: v})}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Agent (Disponible uniquement)</FieldLabel>
              <Select value={newCounter.agentId} onValueChange={(v) => setNewCounter({...newCounter, agentId: v})}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Choisir un agent" /></SelectTrigger>
                <SelectContent>
                  {agents.filter(a => (a.serviceId === newCounter.serviceId && !a.counterId) || (!a.serviceId && !a.counterId)).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.firstName} {a.name}</SelectItem>
                  ))}
                  <SelectItem value="none" className="italic text-muted-foreground">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Button className="w-full mt-4 bg-emerald hover:bg-emerald/90" onClick={handleCreate} disabled={!newCounter.name || !newCounter.serviceId}>Créer</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}