"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LandingView } from "@/components/views/landing-view"
import { LoginModal } from "@/components/login-modal"
import { LandingScannerModal } from "@/components/views/LandingScannerModal"
import { Service } from "@/lib/app-context"

// Composant interne qui gère la logique de la page et `useSearchParams`
function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginMode, setLoginMode] = useState<"login" | "register">("login")
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null)

  // Intercepter le serviceId depuis l'URL (ex: /?service=UUID)
  useEffect(() => {
    const serviceFromUrl = searchParams.get("service")
    if (serviceFromUrl) {
      setPendingServiceId(serviceFromUrl)
    }
  }, [searchParams])

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

// Export par défaut entouré du composant Suspense pour satisfaire Next.js
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}