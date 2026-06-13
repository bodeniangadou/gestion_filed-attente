"use client"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <div className="p-8 text-center bg-background min-h-screen text-foreground">
      <h2 className="text-xl font-bold">Paramètres de l'hôpital</h2>
      <p className="text-muted-foreground mb-4">Vue de configuration des horaires et du nom de l'établissement à implémenter.</p>
      <Link href="/admin" className="text-primary underline">Retour au Dashboard</Link>
    </div>
  )
}