"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

export default function ScannerExternalRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user } = useApp()

  const rawServiceId = params?.serviceId
  const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId

  useEffect(() => {
    if (!serviceId) return

    const targetUrl = user
      ? `/patient/services?service=${encodeURIComponent(serviceId)}`
      : `/?service=${encodeURIComponent(serviceId)}`

    try {
      router.replace(targetUrl)
    } catch {
      window.location.href = targetUrl
    }
  }, [serviceId, user, router])
  

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