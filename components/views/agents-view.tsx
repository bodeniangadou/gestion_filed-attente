"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Plus, Monitor, Stethoscope, MoreVertical, Link2, Mail,
  ShieldCheck, ShieldAlert, Trash2, Search, Wifi, User
} from "lucide-react"
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
import { supabase } from "@/lib/supabase"

interface AgentFormState {
  name: string
  firstName: string
  email: string
  password: string
  phone: string
  serviceId: string
  counterId: string
}

export function AgentsView() {
  const { agents, services, counters, fetchAgents, fetchCounters, setAgents } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [newAgent, setNewAgent] = useState<AgentFormState>({
    name: "", firstName: "", email: "", password: "", phone: "", serviceId: "", counterId: ""
  })
  const [isBusy, setIsBusy] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline" | "banned">("all")

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch = !q ||
        `${agent.firstName ?? ""} ${agent.name ?? ""}`.toLowerCase().includes(q) ||
        (agent.email ?? "").toLowerCase().includes(q)
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "online" && agent.isOnline && !agent.est_banni) ||
        (filterStatus === "offline" && !agent.isOnline && !agent.est_banni) ||
        (filterStatus === "banned" && agent.est_banni)
      return matchSearch && matchStatus
    })
  }, [agents, searchQuery, filterStatus])

  const handleCreate = async () => {
  setIsBusy(true)

  if (!newAgent.name || !newAgent.firstName || !newAgent.email || !newAgent.phone || !newAgent.password) {
    toast.error("Tous les champs sont requis")
    setIsBusy(false)
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newAgent.email)) {
    toast.error("Adresse email invalide.")
    setIsBusy(false)
    return
  }

  if (newAgent.password.length < 8) {
    toast.error("Le mot de passe doit contenir au moins 8 caractères.")
    setIsBusy(false)
    return
  }

  const { data: existingUsers, error: fetchError } = await supabase
    .from("utilisateur")
    .select("email, telephone")
    .or(`email.eq.${newAgent.email},telephone.eq.${newAgent.phone}`)

  if (fetchError) { toast.error("Erreur lors de la vérification."); setIsBusy(false); return }

  if (existingUsers && existingUsers.length > 0) {
    if (existingUsers.some(u => u.email === newAgent.email)) toast.error("Cet email existe déjà.")
    if (existingUsers.some(u => u.telephone === newAgent.phone)) toast.error("Ce numéro de téléphone existe déjà.")
    setIsBusy(false)
    return
  }

  setShowCreateModal(false)
  resetForm()
  setIsBusy(false)

  const toastId = toast.loading("Création du compte en cours...")

  const res = await fetch("/api/create-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: newAgent.email,
      password: newAgent.password,
      nom: `${newAgent.firstName} ${newAgent.name}`,
      telephone: newAgent.phone,
    }),
  })

  const result = await res.json()

  if (!res.ok) {
    toast.dismiss(toastId)
    toast.error("Erreur : " + (result.error || "Impossible de créer l'agent."))
    return
  }

  
  setAgents(prev => [...prev, {
    id: result.id,
    name: newAgent.name,
    firstName: newAgent.firstName,
    email: newAgent.email,
    phone: newAgent.phone,
    isOnline: false,
    est_banni: false,
    photo: undefined,
    serviceId: "",
    counterId: "",
  } as Agent])

  toast.dismiss(toastId)
  toast.success("Agent créé avec succès !")

  fetchAgents()
}

  const handleAssign = async () => {
    if (!selectedAgent || !newAgent.counterId) {
      toast.error("Veuillez sélectionner un agent et un guichet.")
      return
    }
    setIsBusy(true)
    try {
      await supabase.from("guichet").update({ id_agent_actuel: null }).eq("id_agent_actuel", selectedAgent.id)
      await supabase.from("guichet").update({ id_agent_actuel: null }).eq("id", newAgent.counterId)
      const { error } = await supabase.from("guichet").update({ id_agent_actuel: selectedAgent.id }).eq("id", newAgent.counterId)
      if (error) throw error
      toast.success("Assignation réussie !")
      setShowAssignModal(false)
      await fetchCounters()
      await fetchAgents()
    } catch (err: any) {
      toast.error("Erreur : " + (err.message || "Erreur inconnue"))
    } finally {
      setIsBusy(false)
    }
  }

  const toggleAgentStatus = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    const newStatus = !agent.isOnline
    const { error } = await supabase.from("utilisateur").update({ disponibilite: newStatus }).eq("id", agentId)
    if (error) { toast.error("Erreur lors du changement de statut."); return }
    setAgents(agents.map(a => a.id === agentId ? { ...a, isOnline: newStatus } : a))
    toast.success(newStatus ? "Agent réactivé." : "Agent désactivé.")
    await fetchAgents()
  }

  const toggleBan = async (agent: Agent) => {
    const nouvelEtat = !agent.est_banni
    const { error } = await supabase
      .from("utilisateur")
      .update({ est_banni: nouvelEtat, disponibilite: nouvelEtat ? false : agent.isOnline })
      .eq("id", agent.id)
    if (error) { toast.error("Erreur : " + error.message); return }
    setAgents(prev => prev.map(a =>
      a.id === agent.id ? { ...a, est_banni: nouvelEtat, isOnline: nouvelEtat ? false : a.isOnline } : a
    ))
    toast.success(nouvelEtat ? "Agent banni." : "Bannissement révoqué.")
    await fetchAgents()
  }

  const handleDelete = async () => {
    if (!agentToDelete) return
    setIsBusy(true)
    try {
      const id = agentToDelete.id
      await supabase.from("ticket").delete().eq("id_agent", id)
      await supabase.from("guichet").update({ id_agent_actuel: null }).eq("id_agent_actuel", id)
      const { error } = await supabase.from("utilisateur").delete().eq("id", id)
      if (error) throw error
      setAgents(prev => prev.filter(a => a.id !== id))
      toast.success(`${agentToDelete.firstName} ${agentToDelete.name} supprimé.`)
      setShowDeleteModal(false)
      setAgentToDelete(null)
      await fetchCounters()
      await fetchAgents()
    } catch (err: any) {
      toast.error("Erreur : " + (err.message || "Erreur inconnue"))
    } finally {
      setIsBusy(false)
    }
  }

  const openAssignModal = (agent: Agent) => {
    const assignedCounter = counters.find(c => c.id_agent_actuel === agent.id)
    setSelectedAgent(agent)
    setNewAgent({
      name: agent.name || "", firstName: agent.firstName || "",
      email: agent.email || "", password: "",
      phone: agent.phone || "",
      serviceId: assignedCounter?.serviceId || "",
      counterId: assignedCounter?.id || ""
    })
    setShowAssignModal(true)
  }

  const resetForm = () =>
    setNewAgent({ name: "", firstName: "", email: "", password: "", phone: "", serviceId: "", counterId: "" })

  const getAssignmentDisplay = (agentId: string) => {
    const c = counters.find(c => c.id_agent_actuel === agentId)
    return c
      ? { service: c.serviceName || "Service inconnu", counter: c.number || c.name }
      : { service: null, counter: null }
  }

  useEffect(() => { console.log("Agents:", agents) }, [agents])

  return (
    <div className="min-h-screen bg-background pb-24">

      <div className="border-b border-border bg-card px-8 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Agents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pilotez les habilitations et les affectations aux guichets</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90 px-5 shadow-sm">
            <Plus className="size-4" /> Nouvel agent
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-8 space-y-6">

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total agents</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{agents.length}</p>
            </div>
            <div className="size-10 rounded-lg bg-emerald/10 flex items-center justify-center">
              <ShieldCheck className="size-5 text-emerald" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Accès bloqués</p>
              <p className="text-2xl font-bold text-destructive mt-0.5">{agents.filter(a => a.est_banni).length}</p>
            </div>
            <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">En ligne</p>
              <p className="text-2xl font-bold text-blue-500 mt-0.5">{agents.filter(a => a.isOnline && !a.est_banni).length}</p>
            </div>
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wifi className="size-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-accent/40"
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl bg-accent/40 border-border">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="online">En ligne</SelectItem>
              <SelectItem value="offline">Hors ligne</SelectItem>
              <SelectItem value="banned">Bannis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map((agent, index) => {
            const { service, counter } = getAssignmentDisplay(agent.id)
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, ease: "easeOut" }}
              >
                <Card className={`h-full border transition-all duration-200 hover:shadow-md ${
                  agent.est_banni
                    ? "border-destructive/30 bg-destructive/5"
                    : agent.isOnline
                      ? "border-emerald/30 bg-card"
                      : "border-border bg-muted/20 opacity-70"
                }`}>
                  <CardContent className="p-4 flex flex-col gap-3">

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-11 ring-2 ring-border shrink-0">
                          <AvatarImage src={agent.photo} />
                          <AvatarFallback className={`text-sm font-semibold text-primary-foreground ${
                            agent.est_banni ? "bg-destructive" : agent.isOnline ? "bg-emerald" : "bg-muted-foreground"
                          }`}>
                            {agent.firstName?.charAt(0)}{agent.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {agent.firstName} {agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="size-3 shrink-0" /> {agent.email}
                          </p>
                          {agent.est_banni && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-0.5">Banni</Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-lg">
                            <MoreVertical className="size-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem disabled={!agent.isOnline} onSelect={e => { e.preventDefault(); openAssignModal(agent) }}>
                            <Link2 className="mr-2 size-4" /> Assigner au guichet
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={agent.isOnline ? "text-destructive" : "text-emerald"}
                            onClick={() => toggleAgentStatus(agent.id)}
                          >
                            <Plus className={`mr-2 size-4 ${agent.isOnline ? "rotate-45" : ""}`} />
                            {agent.isOnline ? "Désactiver l'accès" : "Réactiver l'accès"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-semibold" onClick={() => toggleBan(agent)}>
                            <ShieldAlert className="mr-2 size-4" />
                            {agent.est_banni ? "Révoquer le bannissement" : "Bannir définitivement"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-semibold" onClick={() => { setAgentToDelete(agent); setShowDeleteModal(true) }}>
                            <Trash2 className="mr-2 size-4" /> Supprimer le compte
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/40 border border-border/40">
                      {service && counter ? (
                        <>
                          <Stethoscope className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground truncate font-medium">{service}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <Monitor className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground truncate">{counter}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                          <User className="size-3.5" /> Aucune affectation
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end pt-1 border-t border-border/40">
                      {agent.est_banni ? (
                        <span className="text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-md">
                          Banni
                        </span>
                      ) : agent.isOnline ? (
                        <span className="text-[11px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-md">
                          En ligne
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
                          Hors ligne
                        </span>
                      )}
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
            <User className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "Aucun agent ne correspond à ces filtres."
                : "Aucun compte agent créé pour le moment."}
            </p>
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={open => { setShowCreateModal(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un compte Agent</DialogTitle>
            <DialogDescription>Les accès seront créés sans interrompre votre session.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Prénom</FieldLabel>
                <Input placeholder="Ex: Moussa" value={newAgent.firstName} onChange={e => setNewAgent({ ...newAgent, firstName: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Nom</FieldLabel>
                <Input placeholder="Ex: Diarra" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Adresse email professionnelle</FieldLabel>
              <Input type="email" placeholder="m.diarra@hopital.com" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Numéro de téléphone</FieldLabel>
              <Input placeholder="+223 XX XX XX XX" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel>Mot de passe temporaire</FieldLabel>
              <Input type="password" placeholder="Min. 8 caractères" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} />
            </Field>
          </FieldGroup>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm() }}>Annuler</Button>
            <Button
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleCreate}
              disabled={isBusy || !newAgent.name || !newAgent.firstName || !newAgent.email || !newAgent.password || !newAgent.phone}
            >
              {isBusy ? "Création..." : "Créer les accès"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignModal} onOpenChange={open => { setShowAssignModal(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assignation de poste</DialogTitle>
            <DialogDescription>Attribuez un service et un guichet pour {selectedAgent?.firstName}.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="space-y-4 pt-2">
            <Field>
              <FieldLabel>Service</FieldLabel>
              <Select value={newAgent.serviceId} onValueChange={v => setNewAgent({ ...newAgent, serviceId: v, counterId: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Guichet de destination</FieldLabel>
              <Select
                value={newAgent.counterId}
                onValueChange={v => setNewAgent({ ...newAgent, counterId: v })}
                disabled={!newAgent.serviceId || counters.filter(c => c.serviceId === newAgent.serviceId).length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !newAgent.serviceId ? "Sélectionnez d'abord un service" :
                    counters.filter(c => c.serviceId === newAgent.serviceId).length === 0 ? "Aucun guichet disponible" :
                    "Sélectionner un guichet"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {counters.filter(c => c.serviceId === newAgent.serviceId).map(counter => (
                    <SelectItem key={counter.id} value={counter.id}>
                      {counter.name} {counter.id_agent_actuel ? "(Occupé)" : "(Libre)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowAssignModal(false); resetForm() }}>Annuler</Button>
            <Button className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90" onClick={handleAssign} disabled={isBusy}>
              {isBusy ? "Assignation..." : "Valider l'affectation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={open => { if (!open) { setShowDeleteModal(false); setAgentToDelete(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Supprimer le compte agent
            </DialogTitle>
            <DialogDescription className="pt-1">
              Action <span className="font-semibold text-foreground">irréversible</span>. La suppression de{" "}
              <span className="font-semibold text-foreground">{agentToDelete?.firstName} {agentToDelete?.name}</span> entraînera :
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2 text-sm text-muted-foreground">
            {["La suppression de tous ses tickets et de son historique.", "La libération de son guichet et de ses affectations.", "La suppression définitive du compte et de ses accès."].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteModal(false); setAgentToDelete(null) }}>Annuler</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isBusy}>
              {isBusy ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}