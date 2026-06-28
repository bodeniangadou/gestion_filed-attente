"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

export default function ScannerRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useApp()

  // useParams peut renvoyer un tableau si la route a plusieurs segments dynamiques —
  // ici on s'assure d'avoir bien une simple chaîne de caractères
  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId

  useEffect(() => {
    if (!serviceId) return

    // CORRIGÉ : on attend que le chargement de la session (loadUserProfile dans le
    // context) soit terminé avant de décider de la redirection. Sans cette attente,
    // un patient connecté qui scanne le QR avec l'appareil photo natif de son téléphone
    // (donc un chargement à froid de la page) pouvait être envoyé par erreur vers la
    // landing page anonyme, simplement parce que `user` n'avait pas encore eu le temps
    // de se peupler au moment du premier rendu.
    if (isLoading) return

    if (user) {
      router.replace(`/patient/services?service=${serviceId}`)
    } else {
      router.replace(`/?service=${serviceId}`)
    }
  }, [serviceId, router, user, isLoading])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  )
}