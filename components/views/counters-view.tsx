"use client"

import { useState , useEffect } from "react"
import { supabase } from "@/lib/supabase"; // Assure-toi d'importer ton client supabase
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
const [editingCounter, setEditingCounter] = useState<{ id: string; name: string } | null>(null);
const handleUpdate = async () => {
  if (!editingCounter?.name) return;

  const { error } = await supabase
    .from("guichet")
    .update({ numero: editingCounter.name })
    .eq("id", editingCounter.id);

  if (error) {
    toast.error("Erreur lors de la modification");
  } else {
    toast.success("Nom du guichet mis à jour !");
    // Mise à jour de l'affichage localement
    setCounters(counters.map(c => 
      c.id === editingCounter.id ? { ...c, name: editingCounter.name } : c
    ));
    setShowEditModal(false);
  }
};
 const toggleCounter = async (id: string, currentStatus: boolean) => {
    // 1. Calcul du nouveau statut
    const newStatus = !currentStatus;
    const newStatusText = newStatus ? 'Actif' : 'Inactif';

    // 2. Mise à jour optimiste (on change l'UI tout de suite pour la fluidité)
    setCounters(
      counters.map(c => 
        c.id === id ? { ...c, isActive: newStatus } : c
      )
    );

    // 3. Appel Supabase pour persister le changement
    const { error } = await supabase
      .from("guichet")
      .update({ statut: newStatusText })
      .eq("id", id);

    if (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Échec de la mise à jour du statut.");
      
      // En cas d'erreur, on annule le changement local
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
  if (!newCounter.name || !newCounter.serviceId) {
    toast.error("Veuillez remplir le nom et le service.");
    return;
  }

  // Préparation de l'objet selon ta table
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

  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Non assigné"
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.firstName} ${agent.name}` : "Non assigné"
  }
  // Liste des agents du service choisi qui n'ont pas encore de guichet
const availableAgents = agents.filter(agent => {
  // On vérifie si l'agent est déjà dans la liste des guichets actifs
  const isAlreadyAssigned = counters.some(c => c.agentId === agent.id);
  
  // L'agent est disponible s'il n'est assigné nulle part
  return !isAlreadyAssigned;
});

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
  setEditingCounter({ id: counter.id, name: counter.name });
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
    <FieldGroup className="space-y-4">
      <Field>
        <FieldLabel>Nouveau nom</FieldLabel>
        <Input
          value={editingCounter?.name || ""}
          onChange={(e) => setEditingCounter({ ...editingCounter!, name: e.target.value })}
        />
      </Field>
    </FieldGroup>
    <div className="mt-6 flex gap-3">
      <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Annuler</Button>
      <Button className="flex-1 bg-emerald" onClick={handleUpdate}>Enregistrer</Button>
    </div>
  </DialogContent>
</Dialog>
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
    setShowCreateModal(open);
    if (!open) {
      // Vide les champs dès que le modal se ferme
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
  <Select 
    disabled={!newCounter.serviceId} // Bloqué tant qu'un service n'est pas choisi
    value={newCounter.agentId}
    onValueChange={(value) => setNewCounter({ ...newCounter, agentId: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder={!newCounter.serviceId ? "Sélectionnez d'abord un service" : "Choisir un agent disponible"} />
    </SelectTrigger>
    <SelectContent>
      {availableAgents.length > 0 ? (
        availableAgents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.firstName} {agent.name}
          </SelectItem>
        ))
      ) : (
        <div className="p-2 text-sm text-muted-foreground">Aucun agent disponible pour ce service</div>
      )}
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
