"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LandingView } from "@/components/views/landing-view"
import { LoginModal } from "@/components/login-modal" 

export default function HomePage() {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const handleTakeTicket = () => {
    const element = document.getElementById("services-section")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/services")
    }
  }

  const handleScanQR = () => {
    alert("Fonctionnalité de scan QR Code (Simulation) : Caméra indisponible en maquette locale.")
  }

  const handleLogin = () => {
    setIsLoginOpen(true)
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
    </div>
  )
}