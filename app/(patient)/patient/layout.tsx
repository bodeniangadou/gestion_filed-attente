"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useApp } from "@/lib/app-context" 
import { UserX } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [activeTab, setActiveTab] = useState("home")
  
  const { user } = useApp()

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleTakeTicket = () => {
    setActiveTab("take-ticket")
  }

  if (!user || (user.role !== "patient" && user.role !== "visitor")) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl bg-card">
          <UserX className="mx-auto size-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès non identifié</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Veuillez vous connecter en tant que patient pour accéder à cet espace.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 bg-background pb-20 lg:pb-0 lg:pl-64"> 
        {children}
      </main>
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onTakeTicket={handleTakeTicket}
      />
    </div>
  )
}