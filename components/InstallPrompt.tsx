"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Si l'utilisateur a déjà refusé récemment, on ne le harcèle pas
    const dismissed = localStorage.getItem("rang_plus_install_dismissed")
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("rang_plus_install_dismissed", "true")
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-2xl sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Installer Rang+</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ajoutez l&apos;app à votre écran d&apos;accueil pour un accès rapide.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall} className="h-8 rounded-lg text-xs">
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 rounded-lg text-xs">
              Plus tard
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}