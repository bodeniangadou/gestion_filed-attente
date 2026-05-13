"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AppProvider, useApp } from "@/lib/app-context"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { LandingView } from "@/components/views/landing-view"
import { ServicesView } from "@/components/views/services-view"
import { TicketsView } from "@/components/views/tickets-view"
import { ProfileView } from "@/components/views/profile-view"
import { DashboardView } from "@/components/views/dashboard-view"
import { AgentConsoleView } from "@/components/views/agent-console-view"
import { CountersView } from "@/components/views/counters-view"
import { AgentsView } from "@/components/views/agents-view"
import { TicketModal } from "@/components/ticket-modal"
import { LoginModal } from "@/components/login-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Camera } from "lucide-react"

function AppContent() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState("home")
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleTicketSuccess = () => {
    setActiveTab("tickets")
  }

  const handleLoginSuccess = () => {
    setActiveTab("home")
  }

  // Determine if we should show the landing page (visitor mode)
  const isVisitor = !user || user.role === "visitor" || user.role === "patient"
  const showLanding = activeTab === "home" && isVisitor

  const renderView = () => {
    // Show landing page for visitors on home tab
    if (showLanding) {
      return (
        <LandingView 
          onNavigate={handleTabChange} 
          onScanQR={() => setShowQRScanner(true)}
          onTakeTicket={() => setShowTicketModal(true)}
          onLogin={() => setShowLoginModal(true)}
        />
      )
    }

    switch (activeTab) {
      case "home":
        if (user?.role === "admin") return <DashboardView />
        if (user?.role === "agent") return <AgentConsoleView />
        return (
          <LandingView 
            onNavigate={handleTabChange} 
            onScanQR={() => setShowQRScanner(true)}
            onTakeTicket={() => setShowTicketModal(true)}
            onLogin={() => setShowLoginModal(true)}
          />
        )
      case "services":
        return <ServicesView isAdmin={user?.role === "admin"} />
      case "tickets":
        return <TicketsView />
      case "profile":
        return <ProfileView />
      case "dashboard":
        return <DashboardView />
      case "console":
        return <AgentConsoleView />
      case "queue":
        return <AgentConsoleView />
      case "status":
        return <AgentConsoleView />
      case "counters":
        return <CountersView />
      case "agents":
        return <AgentsView />
      case "qrcodes":
        return <ServicesView isAdmin={true} />
      case "settings":
        return <DashboardView />
      default:
        return (
          <LandingView 
            onNavigate={handleTabChange} 
            onScanQR={() => setShowQRScanner(true)}
            onTakeTicket={() => setShowTicketModal(true)}
            onLogin={() => setShowLoginModal(true)}
          />
        )
    }
  }

  // Determine if sidebar should be visible (only for admin/agent)
  const showSidebar = user && (user.role === "admin" || user.role === "agent")
  // Determine if bottom nav should be visible
  const showBottomNav = !showLanding || (user && (user.role === "patient" || user.role === "visitor"))

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Only for Admin/Agent */}
      {showSidebar && (
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Main Content */}
      <main className={showSidebar ? "lg:pl-64" : ""}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - For patients/visitors when not on landing */}
      {showBottomNav && !showLanding && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onTakeTicket={() => setShowTicketModal(true)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={handleLoginSuccess}
      />

      {/* Ticket Modal */}
      <TicketModal 
        open={showTicketModal} 
        onOpenChange={setShowTicketModal}
        onSuccess={handleTicketSuccess}
      />

      {/* QR Scanner Modal */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5" />
              Scanner un QR Code
            </DialogTitle>
            <DialogDescription>
              Pointez votre caméra vers le QR Code du service
            </DialogDescription>
          </DialogHeader>
          
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-accent">
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <Camera className="size-16 opacity-50" />
              <p className="text-sm">Caméra en cours de chargement...</p>
              <p className="text-xs text-center px-4">
                (Démo: la caméra n&apos;est pas disponible, utilisez le bouton ci-dessous)
              </p>
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={() => {
              setShowQRScanner(false)
              setShowTicketModal(true)
            }}
          >
            Prendre un ticket manuellement
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
