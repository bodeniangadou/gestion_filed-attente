"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LandingView } from "@/components/views/landing-view"
import { LoginModal } from "@/components/login-modal"
import { LandingScannerModal } from "@/components/views/LandingScannerModal"
import { Service } from "@/lib/app-context"

export default function HomePage() {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  // NOUVEAU : au lieu de router.push, on passe l'id directement comme prop React
  // pour que LandingView réagisse instantanément via useEffect
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null)

  const handleTakeTicket = () => {
    const element = document.getElementById("services-section")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/services")
    }
  }

  const handleScanQR = () => {
    setIsScannerOpen(true)
  }

  const handleLogin = () => {
    setIsLoginOpen(true)
  }

  const handleServiceScanned = (service: Service) => {
    // CORRIGÉ : on ne fait plus router.push (qui ne retrigger pas le useEffect)
    // on passe l'id comme état React — LandingView le surveille et ouvre le modal
    setIsScannerOpen(false)
    setPendingServiceId(service.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingView
        onNavigate={(tab) => router.push(`/${tab}`)}
        onScanQR={handleScanQR}
        onTakeTicket={handleTakeTicket}
        onLogin={handleLogin}
        pendingServiceId={pendingServiceId}
        onPendingServiceConsumed={() => setPendingServiceId(null)}
      />

      <LoginModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        onSuccess={() => {
          console.log("Utilisateur connecté avec succès !")
        }}
      />

      <LandingScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onServiceScanned={handleServiceScanned}
      />
    </div>
  )
}