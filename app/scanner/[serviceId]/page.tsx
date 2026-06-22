"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context" // Ton hook qui connaît l'utilisateur

export default function ScannerRedirect() {
  const params = useParams()
  const router = useRouter()
  const { user } = useApp() // On récupère l'état de connexion
  const serviceId = params.serviceId 

  useEffect(() => {
    if (!serviceId) return

    // Si l'utilisateur est connecté, on l'envoie sur sa page patient
    if (user) {
      router.push(`/patient/services?service=${serviceId}`)
    } else {
      // Sinon, on l'envoie sur la page vitrine (accueil)
      router.push(`/?service=${serviceId}`)
    }
  }, [serviceId, router, user])

  return <div>Redirection...</div>
}