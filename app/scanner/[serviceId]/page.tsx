"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

export default function ScannerRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useApp()


  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId

  useEffect(() => {
    if (!serviceId) return

 
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