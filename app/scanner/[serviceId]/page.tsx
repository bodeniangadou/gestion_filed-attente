"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

export default function ScannerRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useApp()
  const hasRedirected = useRef(false)

  const rawServiceId = params?.serviceId
  const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId

  useEffect(() => {
    // Si pas de serviceId, ou si c'est encore en chargement, ou si on a DÉJÀ redirigé -> STOP
    if (!serviceId || isLoading || hasRedirected.current) return

    // On verrouille la redirection pour éviter les boucles
    hasRedirected.current = true

    const targetUrl = user 
      ? `/patient/services?service=${encodeURIComponent(serviceId)}`
      : `/?service=${encodeURIComponent(serviceId)}`

    // Navigation propre Next.js avec fallback natif si Next.js n'est pas prêt
    try {
      router.replace(targetUrl)
    } catch {
      window.location.replace(targetUrl)
    }
  }, [serviceId, user, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  )
}