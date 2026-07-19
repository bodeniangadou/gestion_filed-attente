

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
  const [loginMode, setLoginMode] = useState<"login" | "register">("login")
  const [isScannerOpen, setIsScannerOpen] = useState(false)

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

  const handleLogin = (mode: "login" | "register" = "login") => {
    setLoginMode(mode)
    setIsLoginOpen(true)
  }

  const handleServiceScanned = (service: Service) => {
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
        defaultMode={loginMode}
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