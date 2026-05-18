"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LandingView } from "@/components/views/landing-view"
import { LoginModal } from "@/components/login-modal" // 💡 Ajuste le chemin vers ton LoginModal s'il est ailleurs

export default function HomePage() {
  const router = useRouter()
  // 💡 ÉTAT : Permet de savoir si le modal doit être affiché ou masqué
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

  // 💡 CORRECTION : Au lieu de router.push, on passe l'état à true pour ouvrir le modal
  const handleLogin = () => {
    setIsLoginOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ta Landing principale */}
      <LandingView 
        onNavigate={(tab) => router.push(`/${tab}`)}
        onScanQR={handleScanQR}
        onTakeTicket={handleTakeTicket}
        onLogin={handleLogin}
      />

      {/* 💡 AJOUT : On pose le modal ici à la racine. Il écoute l'état 'isLoginOpen' */}
      <LoginModal 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen}
        onSuccess={() => {
          // Ce code s'exécutera si tu as besoin de faire une action 
          // supplémentaire après la connexion réussie.
          console.log("Utilisateur connecté avec succès !")
        }}
      />
    </div>
  )
}