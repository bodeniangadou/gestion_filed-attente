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
    router.push(`/?service=${service.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingView
        onNavigate={(tab) => router.push(`/${tab}`)}
        onScanQR={handleScanQR}
        onTakeTicket={handleTakeTicket}
        onLogin={handleLogin}
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