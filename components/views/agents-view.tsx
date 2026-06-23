"use client"

import { useState , useEffect } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, Monitor, Stethoscope, MoreVertical, Link2, Mail, ShieldCheck, ShieldAlert } from "lucide-react"
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
  name: string;
  firstName: string;
  email: string;
  password: string;
  phone: string; 
  serviceId: string;
  counterId: string;
}
export  function AgentsView() {
const { agents, services, counters, createAgent, assignAgentToCounter, fetchAgents, fetchCounters, setAgents } = useApp();
const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [newAgent, setNewAgent] = useState<AgentFormState>({ 
  name: "", firstName: "", email: "", password: "", phone: "", serviceId: "", counterId: "" 
})
const [isBusy, setIsBusy] = useState(false);
const handleCreate = async () => {
  setIsBusy(true); 
  // CORRECTION : utilisation de newAgent.phone au lieu de newAgent.telephone
  if (!newAgent.name || !newAgent.firstName || !newAgent.email || !newAgent.phone || !newAgent.password) {
    toast.error("Tous les champs sont requis");
    setIsBusy(false); // Ajouté pour arrêter le chargement en cas d'erreur
    return;
  }

  const { data: existingUsers, error: fetchError } = await supabase
    .from("utilisateur")
    .select("email, telephone")
    .or(`email.eq.${newAgent.email},telephone.eq.${newAgent.phone}`);

  if (fetchError) {
    console.error("Erreur vérification:", fetchError);
    setIsBusy(false);
    return;
  }

  if (existingUsers && existingUsers.length > 0) {
    const isEmailTaken = existingUsers.some(u => u.email === newAgent.email);
    const isPhoneTaken = existingUsers.some(u => u.telephone === newAgent.phone);
    
    if (isEmailTaken) toast.error("Cet email existe déjà.");
    if (isPhoneTaken) toast.error("Ce numéro existe déjà.");
    setIsBusy(false);
    return;
  }

  const { data: { session: adminSession } } = await supabase.auth.getSession();
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: newAgent.email,
    password: newAgent.password,
  });

  if (authError) {
    toast.error("Erreur Auth: " + authError.message);
    setIsBusy(false);
    return;
  }

  if (authData.user) {
    const { error: insertError } = await supabase
      .from("utilisateur")
      .insert([{
        id: authData.user.id,
        nom: `${newAgent.firstName} ${newAgent.name}`,
        email: newAgent.email,
        telephone: newAgent.phone, // CORRECTION ICI
        role: "agent",
        disponibilite: true
      }]);

    if (insertError) {
      toast.error("Erreur enregistrement profil");
      console.error(insertError);
    } else {
      toast.success("Agent créé avec succès !");
      if (adminSession) {
        await supabase.auth.setSession(adminSession);
      }
      setShowCreateModal(false);
      resetForm();
    }
  }
  setIsBusy(false);
};
const handleAssign = async () => {
  if (!selectedAgent || !newAgent.counterId) {
    toast.error("Veuillez sélectionner un agent et un guichet.");
    return;
  }
  
  setIsBusy(true);

  try {
    // 1. On libère l'agent de tout guichet où il était précédemment affecté
    // On utilise 'agentId' car c'est le nom dans ton interface Counter
    const { error: clearOldError } = await supabase
      .from("guichet")
      .update({ id_agent_actuel: null }) 
      .eq("id_agent_actuel", selectedAgent.id);

    if (clearOldError) throw clearOldError;

    // 2. On libère le guichet cible si un autre agent y est déjà (optionnel)
    await supabase
      .from("guichet")
     .update({ id_agent_actuel: null })
      .eq("id", newAgent.counterId);

    // 3. Enfin, on assigne l'agent au guichet choisi
    const { error: assignError } = await supabase
      .from("guichet")
      .update({ id_agent_actuel: selectedAgent.id })
      .eq("id", newAgent.counterId);

    if (assignError) throw assignError;

    toast.success("Assignation réussie !");
    setShowAssignModal(false);
    
    // Rafraîchir les données pour mettre à jour l'interface
    await fetchCounters();
    await fetchAgents();
    
  } catch (err: any) {
    console.error("Erreur assignation:", err);
    toast.error("Erreur lors de l'assignation : " + (err.message || "Erreur inconnue"));
  } finally {
    setIsBusy(false);
  }
};

 const toggleAgentStatus = async (agentId: string) => {
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return;

  const newStatus = !agent.isOnline;
  
  // Mise à jour BDD
  await supabase
    .from("utilisateur")
    .update({ disponibilite: newStatus })
    .eq("id", agentId);

  // Mise à jour locale
  setAgents(agents.map(a => a.id === agentId ? { ...a, isOnline: newStatus } : a));
}

  const openAssignModal = (agent: Agent) => {
  setSelectedAgent(agent)
  setNewAgent({ 
    name: agent.name || "", 
    firstName: agent.firstName || "", 
    email: agent.email || "",
    password: "", 
    phone: agent.phone || "",
    serviceId: agent.serviceId || "", 
    counterId: agent.counterId || "" 
  })
  setShowAssignModal(true)
}

  const resetForm = () => {
    setNewAgent({ name: "", firstName: "", email: "", password: "", phone: "", serviceId: "", counterId: "" })
  }

  

const getAssignmentDisplay = (agentId: string) => {
  // Recherche l'agent dans le guichet via l'ID
  const counterObj = counters.find(c => c.id_agent_actuel === agentId);
  
  if (!counterObj) return { service: "Non assigné", counter: "Non assigné" };
  
  return { 
    service: counterObj.serviceName || "Service inconnu", 
    counter: counterObj.number // Directement la chaîne de caractère
  };
};
useEffect(() => {
  console.log("Agents reçus par l'interface:", agents);
}, [agents]);
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Bar - Structure Premium */}
      <div className="border-b border-border bg-card px-8 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Agents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pilotez les habilitations et les affectations aux guichets</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90 px-5 shadow-sm"
          >
            <Plus className="size-4" />
            Nouvel agent
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-8 space-y-8">
        {/* Section Compteurs Statuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agents Actifs</p>
              <p className="text-2xl font-bold text-emerald mt-1">
                {agents.filter(a => a.isOnline).length}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Accès Bloqués</p>
              <p className="text-2xl font-bold text-destructive mt-1">
{agents.filter(a => a.est_banni).length}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="size-5" />
            </div>
          </div>
        </div>

        {/* Grille de Cartes Majeures (2 Colonnes sur PC, 1 sur Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent, index) => {
            const { service, counter } = getAssignmentDisplay(agent.id);
            return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, ease: "easeOut" }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 border-border/60 hover:shadow-md ${
                !agent.isOnline ? "opacity-60 bg-muted/30 border-dashed shadow-none" : "bg-card"
              }`}>
                <CardContent className="p-6">
                  {/* Top: Avatar, Infos & Badge Statut */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-14 ring-2 ring-border shadow-inner shrink-0">
                        <AvatarImage src={agent.photo} />
                        <AvatarFallback className={`${agent.isOnline ? "bg-emerald" : "bg-muted-foreground"} text-primary-foreground font-semibold`}>
                          {agent.firstName?.charAt(0)}{agent.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-foreground tracking-tight">
                          {agent.firstName} {agent.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Mail className="size-3.5" /> {agent.email}
                        </p>
                        {agent.est_banni && (
  <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">Banni</Badge>
)}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <MoreVertical className="size-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          disabled={!agent.isOnline}
                          onSelect={(e) => { e.preventDefault(); openAssignModal(agent); }}
                        >
                          <Link2 className="mr-2 size-4" />
                          Assigner au guichet
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={agent.isOnline ? "text-destructive" : "text-emerald"}
                          onClick={() => toggleAgentStatus(agent.id)}
                        >
                          <Plus className={`mr-2 size-4 rotate-45 ${!agent.isOnline ? "rotate-0" : ""}`} />
                          {agent.isOnline ? "Désactiver l'accès" : "Réactiver l'accès"}
                        </DropdownMenuItem>
               <DropdownMenuItem 
  className="text-destructive font-bold"
  onClick={async () => {
    const nouvelEtat = !agent.est_banni;
console.log(`Changement de bannissement pour ${agent.firstName} ${agent.name}: ${nouvelEtat ? "Banni" : "Révoqué"}`);
    // On fait l'update ET on demande à Supabase de nous renvoyer l'objet modifié
    const { data, error } = await supabase
      .from("utilisateur")
      .update({ est_banni: nouvelEtat })
      .eq("id", agent.id)
      .select(); // <--- C'EST ÇA LA CLÉ

    if (error) {
      toast.error("Erreur : " + error.message);
    } else if (data) {
      // data[0] contient maintenant ton agent avec `est_banni: true` (ou false)
      // On met à jour l'état global immédiatement avec cette donnée certifiée
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...data[0] } : a));
      toast.success("Statut mis à jour");
    }
  }}
>
  {agent.est_banni ? "Révoquer le bannissement" : "Bannir définitivement"}
</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Bottom: Séparateur et Zone des Badges Spacieux */}
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {agent.isOnline ? (
                        <>
                          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-muted border border-border/40">
                            <Stethoscope className="size-3.5 text-muted-foreground" />
{service}                          </Badge>
                          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-muted border border-border/40">
                            <Monitor className="size-3.5 text-muted-foreground" />
{counter}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground/80 italic flex items-center gap-1">
                           Compte suspendu par la direction
                        </span>
                      )}
                    </div>

                    {/* Badge État Fixe à droite pour équilibrer */}
                    <div>
                      {agent.isOnline ? (
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-md">
                          En ligne
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-md">
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )})}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
            <p className="text-sm text-muted-foreground">Aucun compte agent créé pour le moment.</p>
          </div>
        )}
      </div>

      {/* Modals de création et d'assignation parfaitement dimensionnées */}
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un compte Agent</DialogTitle>
            <DialogDescription>Saisissez les informations d'identification initiales de l'agent.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Prénom</FieldLabel>
                <Input placeholder="Ex: Moussa" value={newAgent.firstName} onChange={(e) => setNewAgent({ ...newAgent, firstName: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Nom</FieldLabel>
                <Input placeholder="Ex: Diarra" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Adresse Email professionnel</FieldLabel>
              <Input type="email" placeholder="m.diarra@hopital.com" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} />
            </Field>
            <Field>
  <FieldLabel>Numéro de téléphone</FieldLabel>
  <Input 
    placeholder="+223 XX XX XX XX" 
value={newAgent.phone}    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} 
  />
</Field>
            <Field>
              <FieldLabel>Mot de passe temporaire</FieldLabel>
              <Input type="password" placeholder="••••••••" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} />
            </Field>
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Annuler
            </Button>
            <Button 
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleCreate}
              disabled={!newAgent.name || !newAgent.firstName || !newAgent.email || !newAgent.password}
            >
              Créer les accès
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={(open) => { setShowAssignModal(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assignation de poste</DialogTitle>
            <DialogDescription>
              Attribuez un service et un guichet de travail pour {selectedAgent?.firstName}.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4 pt-2">
            <Field>
              <FieldLabel>Service</FieldLabel>
              <Select value={newAgent.serviceId} onValueChange={(value) => setNewAgent({ ...newAgent, serviceId: value, counterId: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Guichet de destination</FieldLabel>
<Select 
  value={newAgent.counterId} 
  onValueChange={(value) => setNewAgent({ ...newAgent, counterId: value })} 
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
    {counters
      .filter(c => c.serviceId === newAgent.serviceId)
      .map((counter) => (
        <SelectItem key={counter.id} value={counter.id}>
          {counter.name} {counter.id_agent_actuel ? "(Occupé)" : "(Libre)"}
        </SelectItem>
      ))
    }
  </SelectContent>
</Select>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowAssignModal(false); resetForm(); }}>
              Annuler
            </Button>
            <Button className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90" onClick={handleAssign}>
              Valider l'affectation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}