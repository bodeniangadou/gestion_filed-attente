"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

export default function ScannerExternalRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useApp()
  const [isReady, setIsReady] = useState(false)

  const rawServiceId = params?.serviceId
  const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId

  // 1. Attendre un court instant pour s'assurer que le client Next.js est totalement hydraté
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 400) // 400ms de sécurité
    return () => clearTimeout(timer)
  }, [])

  // 2. Déclencher la redirection uniquement quand l'app et le serviceId sont prêts
  useEffect(() => {
    if (!isReady || isLoading || !serviceId) return

    const targetUrl = user
      ? `/patient/services?service=${encodeURIComponent(serviceId)}`
      : `/?service=${encodeURIComponent(serviceId)}`

    // Navigation de secours si Next Router n'est pas encore prêt suite au scan externe
    try {
      router.replace(targetUrl)
    } catch {
      window.location.href = targetUrl
    }
  }, [isReady, isLoading, serviceId, user, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 shadow-lg">
        <div className="size-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Rang+ | Hôpital du Mali</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ouverture du service en cours...</p>
        </div>
        
        {/* Bouton de secours au cas où le navigateur bloque la redirection auto */}
        {serviceId && (
          <button
            onClick={() => {
              const target = user 
                ? `/patient/services?service=${encodeURIComponent(serviceId)}` 
                : `/?service=${encodeURIComponent(serviceId)}`
              window.location.href = target
            }}
            className="mt-2 text-xs text-primary underline underline-offset-4"
          >
            Cliquez ici si la page ne s'ouvre pas
          </button>
        )}
      </div>
    </div>
  )
}