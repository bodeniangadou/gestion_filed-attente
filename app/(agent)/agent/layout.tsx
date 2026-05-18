"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useApp } from "@/lib/app-context" // On importe le contexte ici
import { AlertTriangle, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState("console")
  
  // On récupère les infos du guichet directement dans le layout
  const { getCurrentAgent, getAgentCounter } = useApp()
  const agent = getCurrentAgent()
  const counter = getAgentCounter()

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // 1. SI PAS DE GUICHET ASSIGNÉ : On bloque TOUT le layout (Pas de sidebar, pas de nav, juste l'erreur)
  if (!agent || !counter) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl bg-card">
          <AlertTriangle className="mx-auto size-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Aucun guichet assigné</h2>
          <p className="text-muted-foreground mb-4">
            Vous n&apos;êtes pas assigné à un guichet actif pour l&apos;Hôpital du Mali.
          </p>
          <p className="text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
            L&apos;accès aux menus et aux fonctionnalités est bloqué. Veuillez contacter votre administrateur.
          </p>
        </Card>
      </div>
    )
  }

  // 2. SI TOUT EST OK : On affiche l'application normalement avec ses menus
  return (
    <div className="flex min-h-screen bg-background">
      {/* Menu pour Ordinateur (Sidebar Gauche) - S'affiche uniquement si connecté à un guichet */}
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Contenu principal au milieu */}
      <main className="flex-1 bg-background pb-20 lg:pb-0 lg:pl-64"> 
        {children}
      </main>

      {/* Menu pour Téléphone (Barre du Bas) - S'affiche uniquement si connecté à un guichet */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}