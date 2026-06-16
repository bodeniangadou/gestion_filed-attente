"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav" // 👈 On importe la barre mobile

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar : Visible uniquement sur PC (lg) */}
      <AppSidebar />

      {/* Contenu principal : On ajoute une marge en bas sur mobile (pb-24) pour que la barre ne cache pas le contenu */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        {children}
      </main>

      {/* BottomNav : Visible uniquement sur mobile et tablette, cachée sur PC (lg:hidden est déjà dans son composant) */}
      <BottomNav />
    </div>
  )
}