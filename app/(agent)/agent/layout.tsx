"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useApp } from "@/lib/app-context" 
import { UserX } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useApp()

  // Sécurité : Si l'utilisateur n'est pas un agent, on bloque l'accès
  if (!user || user.role !== "agent") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl bg-card">
          <UserX className="mx-auto size-16 text-blue-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès réservé</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Vous devez être connecté en tant qu'Agent pour accéder à cet espace.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* La Sidebar commune */}
      <AppSidebar />

      {/* Contenu principal */}
      <main className="flex-1 bg-background pb-20 lg:pb-0 lg:pl-64"> 
        {children}
      </main>

      {/* La BottomNav commune */}
      <BottomNav />
    </div>
  )
}