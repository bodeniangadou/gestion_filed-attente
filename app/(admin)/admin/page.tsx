"use client"

import { useState } from "react"
import { AdminDashboard } from "@/components/views/admin-dashboard" // Ajuste le chemin si nécessaire
import { AdminServicesView } from "@/components/views/admin-services-view"
import { CountersView } from "@/components/views/counters-view"
import { AgentsView } from "@/components/views/agents-view"

export default function AdminMainPage() {
  // L'état 'tab' contrôle le composant actuellement affiché à l'écran
  const [currentTab, setCurrentTab] = useState<string>("dashboard")

  // Fonction de retour au menu principal
  const handleBack = () => setCurrentTab("dashboard")

  switch (currentTab) {
    case "dashboard":
      return <AdminDashboard onNavigate={setCurrentTab} />

    case "admin-services":
      return <AdminServicesView onBack={handleBack} />

    case "admin-counters":
      // Si ton composant CountersView n'a pas de prop onBack, enveloppe-le ou ajoute-lui un bouton retour si besoin
      return (
        <div className="relative">
          <CountersView />
        </div>
      )

    case "admin-agents":
      return <AgentsView />

    case "admin-settings":
    case "settings":
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Paramètres de l'hôpital</h2>
          <p className="text-muted-foreground mb-4">Vue de configuration des horaires et du nom de l'établissement à implémenter.</p>
          <button onClick={handleBack} className="text-primary underline">Retour</button>
        </div>
      )

    case "admin-stats":
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Rapports & Statistiques</h2>
          <p className="text-muted-foreground mb-4">Analyses détaillées de l'affluence et des temps d'attente.</p>
          <button onClick={handleBack} className="text-primary underline">Retour</button>
        </div>
      )

    default:
      return <AdminDashboard onNavigate={setCurrentTab} />
  }
}