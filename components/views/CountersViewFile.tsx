"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Plus, Monitor, User, Power, MoreVertical, Edit2, Trash2, Search, SlidersHorizontal, CheckCircle2, XCircle } from "lucide-react"
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
  const { counters, services, setCounters, agents, fetchServices, fetchCounters } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCounter, setNewCounter] = useState({ name: "", serviceId: "", agentId: "" })
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [editingCounter, setEditingCounter] = useState<any>(null)
  const [agentSearch, setAgentSearch] = useState("")

  // ── Recherche + filtres ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [filterServiceId, setFilterServiceId] = useState("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")

  const filteredCounters = useMemo(() => {
    return counters.filter(c => {
      const matchName = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchService = filterServiceId === "all" || c.serviceId === filterServiceId
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && c.isActive) ||
        (filterStatus === "inactive" && !c.isActive)
      return matchName && matchService && matchStatus
    })
  }, [counters, searchQuery, filterServiceId, filterStatus])

  const handleUpdate = async () => {
    if (!editingCounter?.name) return
    if (isNameTaken(editingCounter.name, editingCounter.id)) {
      toast.error("Un autre guichet porte déjà ce nom.")
      return
    }
    const { error } = await supabase
      .from("guichet")
      .update({
        numero: editingCounter.name,
        id_service: editingCounter.serviceId,
        id_agent_actuel: editingCounter.id_agent_actuel
      })
      .eq("id", editingCounter.id)

    if (error) {
      toast.error("Erreur lors de la mise à jour")
    } else {
      toast.success("Guichet mis à jour !")
      fetchCounters()
      setShowEditModal(false)
    }
  }

  const toggleCounter = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const newStatusText = newStatus ? "Actif" : "Inactif"
    setCounters(counters.map(c => c.id === id ? { ...c, isActive: newStatus } : c))
    const { error } = await supabase.from("guichet").update({ statut: newStatusText }).eq("id", id)
    if (error) {
      toast.error("Échec de la mise à jour du statut.")
      setCounters(counters.map(c => c.id === id ? { ...c, isActive: currentStatus } : c))
    } else {
      toast.success(`Guichet ${newStatusText.toLowerCase()} avec succès.`)
      await fetchCounters()
    }
  }

  useEffect(() => {
    fetchServices()
    fetchCounters()
  }, [fetchServices, fetchCounters])

  const handleCreate = async () => {
    if (isNameTaken(newCounter.name)) { toast.error("Ce nom de guichet existe déjà !"); return }
    if (!newCounter.name || !newCounter.serviceId) { toast.error("Veuillez remplir le nom et le service."); return }
    const { error } = await supabase.from("guichet").insert([{
      numero: newCounter.name,
      id_service: newCounter.serviceId,
      id_agent_actuel: newCounter.agentId || null,
      statut: "Inactif"
    }]).select()
    if (error) {
      toast.error("Erreur lors de la création du guichet.")
    } else {
      toast.success("Guichet créé avec succès !")
      await fetchCounters()
      setShowCreateModal(false)
      setNewCounter({ name: "", serviceId: "", agentId: "" })
      setAgentSearch("")
    }
  }

  const getServiceName = (serviceId: string) => services.find(s => s.id === serviceId)?.name || "Non assigné"

  const getAgentName = (agentId?: string | null) => {
    if (!agentId) return null
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.firstName} ${agent.name}` : null
  }

  const isNameTaken = (name: string, excludeId?: string) =>
    counters.some(c => c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.id !== excludeId)

  const activeCount = counters.filter(c => c.isActive).length
  const inactiveCount = counters.filter(c => !c.isActive).length

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-8 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Guichets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gérez les guichets physiques et leurs affectations</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90 px-5 shadow-sm">
            <Plus className="size-4" /> Nouveau guichet
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{counters.length}</p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="size-5 text-primary" />
            </div>
          </div>
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
        </div>

        {/* ── Barre de recherche + filtres ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher par nom de guichet..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-accent/40"
            />
          </div>

          <Select value={filterServiceId} onValueChange={setFilterServiceId}>
            <SelectTrigger className="h-10 w-full sm:w-52 rounded-xl bg-accent/40 border-border">
              <SlidersHorizontal className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tous les services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="h-10 w-full sm:w-40 rounded-xl bg-accent/40 border-border">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Grille guichets ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCounters.map((counter, index) => {
            const agentName = getAgentName(counter.id_agent_actuel)
            const serviceName = getServiceName(counter.serviceId)
            return (
              <motion.div
                key={counter.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, ease: "easeOut" }}
              >
                <Card className={`h-full border transition-all duration-200 hover:shadow-md ${
                  counter.isActive ? "border-emerald/40 bg-card" : "border-border bg-muted/20"
                }`}>
                  <CardContent className="p-5 flex flex-col gap-4">

                    {/* Top row : icône + nom + menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                          counter.isActive ? "bg-emerald text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <Monitor className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{counter.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingCounter(counter); setShowEditModal(true) }}>
                            <Edit2 className="mr-2 size-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 size-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Agent */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/40 border border-border/50">
                      <User className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground truncate">
                        {agentName
                          ? <span className="font-medium">{agentName}</span>
                          : <span className="text-muted-foreground italic">Aucun agent assigné</span>
                        }
                      </span>
                    </div>

                    {/* Footer : badge + toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <Badge className={`text-xs px-2.5 py-0.5 ${
                        counter.isActive
                          ? "bg-emerald/10 text-emerald border border-emerald/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`} variant="outline">
                        {counter.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Power className={`size-3.5 ${counter.isActive ? "text-emerald" : "text-muted-foreground"}`} />
                        <Switch
                          checked={counter.isActive}
                          onCheckedChange={() => toggleCounter(counter.id, counter.isActive)}
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredCounters.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
            <Monitor className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterServiceId !== "all" || filterStatus !== "all"
                ? "Aucun guichet ne correspond à ces filtres."
                : "Aucun guichet créé pour le moment."}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal Édition ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le guichet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Nom du guichet</FieldLabel>
              <Input
                value={editingCounter?.name || ""}
                onChange={e => setEditingCounter({ ...editingCounter, name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Service</FieldLabel>
              <Select value={editingCounter?.serviceId || ""} onValueChange={val => setEditingCounter({ ...editingCounter, serviceId: val })}>
                <SelectTrigger><SelectValue>{services.find(s => s.id === editingCounter?.serviceId)?.name || "Sélectionner un service"}</SelectValue></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Agent assigné</FieldLabel>
              <Select
                value={editingCounter?.id_agent_actuel || "none"}
                onValueChange={val => setEditingCounter({ ...editingCounter, id_agent_actuel: val === "none" ? null : val })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {editingCounter?.id_agent_actuel
                      ? (agents.find(a => a.id === editingCounter.id_agent_actuel)?.firstName + " " + agents.find(a => a.id === editingCounter.id_agent_actuel)?.name)
                      : "Aucun agent"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun agent</SelectItem>
                  {agents.map(a => {
                    const isOccupied = counters.some(c => c.id_agent_actuel === a.id && c.id !== editingCounter?.id)
                    return (
                      <SelectItem key={a.id} value={a.id} disabled={isOccupied}>
                        {a.firstName} {a.name} {isOccupied ? "(Occupé)" : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90" onClick={handleUpdate}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Création ── */}
      <Dialog open={showCreateModal} onOpenChange={open => { setShowCreateModal(open); if (!open) setNewCounter({ name: "", serviceId: "", agentId: "" }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau guichet</DialogTitle>
            <DialogDescription>Créer un nouveau guichet physique</DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Nom du guichet</FieldLabel>
              <Input placeholder="Ex: Guichet A3" value={newCounter.name} onChange={e => setNewCounter({ ...newCounter, name: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Service assigné</FieldLabel>
              <Select value={newCounter.serviceId} onValueChange={value => setNewCounter({ ...newCounter, serviceId: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Agent assigné (optionnel)</FieldLabel>
              <Input
                placeholder="Rechercher un agent..."
                className="mb-2"
                value={agentSearch}
                onChange={e => { setAgentSearch(e.target.value); setIsSelectOpen(true) }}
                onClick={() => setIsSelectOpen(true)}
              />
              <Select
                open={isSelectOpen}
                onOpenChange={setIsSelectOpen}
                disabled={!newCounter.serviceId}
                value={newCounter.agentId}
                onValueChange={value => { setNewCounter({ ...newCounter, agentId: value }); setIsSelectOpen(false) }}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un agent..." /></SelectTrigger>
                <SelectContent>
                  {agents
                    .filter(a => `${a.firstName} ${a.name}`.toLowerCase().includes(agentSearch.toLowerCase()))
                    .map(agent => {
                      const occupiedBy = counters.find(c => String(c.id_agent_actuel) === String(agent.id))
                      return (
                        <SelectItem key={agent.id} value={agent.id} disabled={!!occupiedBy}>
                          {agent.firstName} {agent.name} {occupiedBy ? `(Occupé - ${occupiedBy.name})` : "(Libre)"}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90" onClick={handleCreate} disabled={!newCounter.name || !newCounter.serviceId}>
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}