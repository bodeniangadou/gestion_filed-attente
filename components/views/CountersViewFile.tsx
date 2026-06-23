"use client"

import { useState , useEffect } from "react"
import { supabase } from "@/lib/supabase"; 
import { toast } from "sonner";
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

export   function CountersView() {
const { counters, services, setCounters , agents, fetchServices, fetchCounters } = useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCounter, setNewCounter] = useState({ name: "", serviceId: "", agentId: "" })
const [showEditModal, setShowEditModal] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

const [editingCounter, setEditingCounter] = useState<any>(null);
const [agentSearch, setAgentSearch] = useState("");
const handleUpdate = async () => {
  if (!editingCounter?.name) return;
  if (isNameTaken(editingCounter.name, editingCounter.id)) {
    toast.error("Un autre guichet porte déjà ce nom.");
    return;
  }

  const { error } = await supabase
    .from("guichet")
    .update({ 
      numero: editingCounter.name,
      id_service: editingCounter.serviceId,
      id_agent_actuel: editingCounter.id_agent_actuel 
    })
    .eq("id", editingCounter.id);

  if (error) {
    toast.error("Erreur lors de la mise à jour");
  } else {
    toast.success("Guichet mis à jour !");
    fetchCounters(); 
    setShowEditModal(false);
  }
};
 const toggleCounter = async (id: string, currentStatus: boolean) => {

    const newStatus = !currentStatus;
    const newStatusText = newStatus ? 'Actif' : 'Inactif';

    setCounters(
      counters.map(c => 
        c.id === id ? { ...c, isActive: newStatus } : c
      )
    );

    const { error } = await supabase
      .from("guichet")
      .update({ statut: newStatusText })
      .eq("id", id);

    if (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Échec de la mise à jour du statut.");
      
      setCounters(
        counters.map(c => 
          c.id === id ? { ...c, isActive: currentStatus } : c
        )
      );
    } else {
      toast.success(`Guichet ${newStatusText.toLowerCase()} avec succès.`);
    }
  };
useEffect(() => {
    fetchServices();
    fetchCounters();
  }, [fetchServices, fetchCounters]);
 const handleCreate = async () => {
  if (isNameTaken(newCounter.name)) {
    toast.error("Ce nom de guichet existe déjà !");
    return;
  }
  if (!newCounter.name || !newCounter.serviceId) {
    toast.error("Veuillez remplir le nom et le service.");
    return;
  }

  const counterData = {
    numero: newCounter.name,
    id_service: newCounter.serviceId,
    id_agent_actuel: newCounter.agentId || null, 
    statut: 'Inactif'
  };

  const { data, error } = await supabase
    .from("guichet")
    .insert([counterData])
    .select();

  if (error) {
    console.error("Erreur SQL:", error);
    toast.error("Erreur lors de la création du guichet.");
  } else {
    toast.success("Guichet créé avec succès !");
    setCounters([...counters, { ...data[0], name: data[0].numero, isActive: true }]);
    setShowCreateModal(false);
    setNewCounter({ name: "", serviceId: "", agentId: "" });
    setNewCounter({ name: "", serviceId: "", agentId: "" });
  }
};

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || "Non assigné"
  }

  const getAgentName = (agentId?: string | null) => {
  if (!agentId) return "Non assigné";

  const agent = agents.find(a => a.id === agentId);

  return agent ? `${agent.firstName} ${agent.name}` : "Agent introuvable";
};
// const availableAgents = agents.filter(agent => {
//   const isAlreadyAssigned = counters.some(c => c.id_agent_actuel === agent.id);
  
//   return !isAlreadyAssigned;
// })
const isNameTaken = (name: string, excludeId?: string) => {
  return counters.some(c => 
    c.name.toLowerCase().trim() === name.toLowerCase().trim() && 
    c.id !== excludeId
  );
};

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
<DropdownMenuItem onClick={() => {
  setEditingCounter(counter); 
  setShowEditModal(true);
}}>
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
    {/* Utilise counter.id_agent_actuel au lieu de counter.agentId */}
    Agent: {getAgentName(counter.id_agent_actuel)}
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
  onCheckedChange={() => toggleCounter(counter.id, counter.isActive)}
/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
 <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Modifier le guichet</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Modification Nom */}
      <Field>
        <FieldLabel>Nom du guichet</FieldLabel>
        <Input
          value={editingCounter?.name || ""}
          onChange={(e) => setEditingCounter({ ...editingCounter, name: e.target.value })}
        />
      </Field>

      {/* Modification Service */}
      <Field>
        <FieldLabel>Service</FieldLabel>
        <Select 
          value={editingCounter?.serviceId || ""} 
          onValueChange={(val) => setEditingCounter({ ...editingCounter, serviceId: val })}
        >
          <SelectTrigger>
            <SelectValue>
              {services.find(s => s.id === editingCounter?.serviceId)?.name || "Sélectionner un service"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Modification Agent */}
      <Field>
        <FieldLabel>Agent assigné</FieldLabel>
        <Select 
          value={editingCounter?.id_agent_actuel || "none"} 
          onValueChange={(val) => setEditingCounter({ ...editingCounter, id_agent_actuel: val === "none" ? null : val })}
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
              const isOccupied = counters.some(c => c.id_agent_actuel === a.id && c.id !== editingCounter?.id);
              return (
                <SelectItem key={a.id} value={a.id} disabled={isOccupied}>
                  {a.firstName} {a.name} {isOccupied ? "(Occupé)" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Field>
    </div>

    <div className="mt-6 flex gap-3">
      <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
        Annuler
      </Button>
      <Button className="flex-1 bg-emerald" onClick={handleUpdate}>
        Enregistrer
      </Button>
    </div>
  </DialogContent>
</Dialog>
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
    setShowCreateModal(open);
    if (!open) {
      setNewCounter({ name: "", serviceId: "", agentId: "" });
    }}}>
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
  {/* Barre de recherche */}
 <Input 
    placeholder="Rechercher ou sélectionner un agent..." 
    className="mb-2"
    value={agentSearch}
    onChange={(e) => {
      setAgentSearch(e.target.value);
      setIsSelectOpen(true); 
    }}
    onClick={() => setIsSelectOpen(true)}
  />
  <Select 
    open={isSelectOpen}
    onOpenChange={setIsSelectOpen}
    disabled={!newCounter.serviceId}
    value={newCounter.agentId}
    onValueChange={(value) => {
      setNewCounter({ ...newCounter, agentId: value });
      setIsSelectOpen(false); 
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Choisir un agent..." />
    </SelectTrigger>
    <SelectContent>
      {agents
        .filter(a => `${a.firstName} ${a.name}`.toLowerCase().includes(agentSearch.toLowerCase()))
        .map((agent) => {
    
{console.log("Premier guichet de la liste:", counters[0])}
const occupiedBy = counters.find(c => String(c.id_agent_actuel) === String(agent.id));
          const isOccupied = !!occupiedBy;
          
          return (
            <SelectItem 
              key={agent.id} 
              value={agent.id} 
              disabled={isOccupied}
            >
{agent.firstName} {agent.name} {isOccupied ? `(Occupé - Guichet ${occupiedBy?.name})` : "(Libre)"}            </SelectItem>
          );
        })}
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
