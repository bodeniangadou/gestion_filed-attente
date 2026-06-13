"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "react-redux" // ou framer-motion selon tes imports standard
import { motion as motionFramer } from "framer-motion"
import { 
  Building2, 
  Clock, 
  Sliders, 
  ShieldAlert, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  FileText
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/lib/app-context"

export default function SettingsPage() {
  const { hospitalSettings, services, updateHospitalSettings } = useApp()
  const [isLoading, setIsLoading] = useState(false)

  // États locaux pour le formulaire
  const [hospitalName, setHospitalName] = useState(hospitalSettings?.name || "Hôpital du Mali")
  const [openTime, setOpenTime] = useState(hospitalSettings?.openTime || "08:00")
  const [closeTime, setCloseTime] = useState(hospitalSettings?.closeTime || "17:00")
  const [alertSeuil, setAlertSeuil] = useState(15)
  const [avgTime, setAvgTime] = useState(15)
  const [isEmergencyStop, setIsEmergencyStop] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // Simuler ou appeler la mise à jour (Supabase / Context)
    setTimeout(() => {
      setIsLoading(false)
      alert("Paramètres enregistrés avec succès !")
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Paramètres globaux</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure la logique métier et le comportement du système Rang+
            </p>
          </div>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="size-4" />
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-4">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="size-4" /> Général
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="size-4" /> File d'attente
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Sliders className="size-4" /> Système
            </TabsTrigger>
          </TabsList>

          {/* 🏥 ONGLET 1 : CONFIGURATION GÉNÉRALE */}
          <TabsContent value="general">
            <motionFramer.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Informations de l'établissement</CardTitle>
                  <CardDescription>Ces données apparaissent sur l'espace client et les tickets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hospital-name">Nom de l'établissement</Label>
                    <Input 
                      id="hospital-name" 
                      value={hospitalName} 
                      onChange={(e) => setHospitalName(e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="open-time">Heure d'ouverture</Label>
                      <Input 
                        id="open-time" 
                        type="time" 
                        value={openTime} 
                        onChange={(e) => setOpenTime(e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="close-time">Heure de fermeture</Label>
                      <Input 
                        id="close-time" 
                        type="time" 
                        value={closeTime} 
                        onChange={(e) => setCloseTime(e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motionFramer.div>
          </TabsContent>

          {/* ⏱️ ONGLET 2 : LOGIQUE DE LA FILE D'ATTENTE */}
          <TabsContent value="queue">
            <motionFramer.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Seuils & Estimations</CardTitle>
                  <CardDescription>Ajuste l'algorithme de calcul du temps d'attente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border p-4 bg-accent/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Temps moyen par consultation</Label>
                      <p className="text-sm text-muted-foreground">Utilisé pour estimer l'attente du patient (en minutes).</p>
                    </div>
                    <Input 
                      type="number" 
                      className="w-20 text-center font-bold" 
                      value={avgTime} 
                      onChange={(e) => setAvgTime(Number(e.target.value))} 
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-accent/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Seuil d'alerte critique</Label>
                      <p className="text-sm text-muted-foreground">Déclenche une alerte si la file dépasse ce nombre de patients.</p>
                    </div>
                    <Input 
                      type="number" 
                      className="w-20 text-center font-bold text-destructive" 
                      value={alertSeuil} 
                      onChange={(e) => setAlertSeuil(Number(e.target.value))} 
                    />
                  </div>
                </CardContent>
              </Card>
            </motionFramer.div>
          </TabsContent>

          {/* ⚙️ ONGLET 3 : MAINTENANCE ET ACTIONS CRITIQUES */}
          <TabsContent value="system">
            <motionFramer.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Arrêt d'urgence */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <ShieldAlert className="size-5" /> Arrêt d'urgence du système
                  </CardTitle>
                  <CardDescription>
                    Bloque instantanément la génération de nouveaux tickets pour tous les patients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Statut du blocage</p>
                    <p className="text-xs text-muted-foreground">À n'activer qu'en cas de surcharge ou panne majeure.</p>
                  </div>
                  <Switch 
                    checked={isEmergencyStop} 
                    onCheckedChange={setIsEmergencyStop} 
                  />
                </CardContent>
              </Card>

              {/* Maintenance journalière */}
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance des données</CardTitle>
                  <CardDescription>Actions de réinitialisation quotidiennes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/30">
                    <div className="flex items-start gap-3">
                      <RefreshCw className="size-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Remise à zéro des tickets</p>
                        <p className="text-xs text-muted-foreground">Archive les tickets de la veille et réinitialise à 001.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      Réinitialiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motionFramer.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}