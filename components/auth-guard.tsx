"use client"
import { useApp } from "@/lib/app-context"
import { redirect } from "next/navigation"

export function AuthGuard({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const { user } = useApp()

  // Si pas de user ou mauvais rôle
  if (!user || user.role !== allowedRole) {
    return <div className="p-10 text-center">Accès interdit : Vous n'avez pas les droits requis.</div>
  }

  return <>{children}</>
}