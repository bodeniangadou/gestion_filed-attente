"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { QrCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApp, Service, Counter } from "@/lib/app-context"

interface LandingScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceScanned: (service: Service) => void
}

// Même logique de statut dynamique que LandingView/ServicesView, pour rester cohérent
const checkServiceStatus = (service: Service, counters: Counter[]) => {
  if (!service?.openTime || !service?.closeTime) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = service.openTime.split(':').map(Number)
  const [endH, endM] = service.closeTime.split(':').map(Number)

  const openMinutes = startH * 60 + startM
  const closeMinutes = endH * 60 + endM

  const isTimeValid = currentMinutes >= openMinutes && currentMinutes <= closeMinutes
  const hasActiveCounter = counters.some(c => c.serviceId === service.id && c.isActive)

  return isTimeValid && hasActiveCounter
}

// CORRIGÉ : extraction plus robuste de l'identifiant du service depuis le texte décodé
// du QR. Gère désormais : un slash final éventuel (/scanner/{id}/), des espaces
// invisibles en bout de chaîne, une éventuelle URL encodée, et un éventuel UUID brut
// scanné directement (sans URL autour) — au lieu de ne gérer qu'un seul format strict.
function extractServiceKey(decodedText: string): string {
  const cleaned = decodedText.trim()

  // Format URL : .../scanner/{id} (avec ou sans slash final, query params, etc.)
  const match = cleaned.match(/\/scanner\/([^/?#]+)/)
  if (match) {
    return decodeURIComponent(match[1]).trim()
  }

  // Format ?service=xxx ou ?scan=xxx quelque part dans le texte
  if (cleaned.includes("?")) {
    const queryPart = cleaned.split("?")[1]
    const urlParams = new URLSearchParams(queryPart)
    const fromQuery = urlParams.get("service") || urlParams.get("scan")
    if (fromQuery) return fromQuery.trim()
  }

  // Sinon, on suppose que le QR contient directement l'identifiant brut
  return cleaned
}

export function LandingScannerModal({ open, onOpenChange, onServiceScanned }: LandingScannerModalProps) {
  const { services, counters } = useApp()
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) {
      setIsReady(false)
      return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(err => console.error(err))
        }
      }
    }

    // CORRIGÉ : on n'autorise plus le scan tant que la liste des services n'est pas
    // chargée. Avant, un scan effectué dans les toutes premières secondes (avant que
    // fetchServices() ait fini son premier appel) tombait toujours sur "QR invalide",
    // même avec un QR parfaitement correct, puisque `services` était encore vide.
    if (services.length === 0) {
      setIsReady(false)
      return
    }

    setIsReady(true)
    setScannerError(null)

    const timer = setTimeout(() => {
      const html5QrCode = new Html5Qrcode("landing-reader")
      html5QrCodeRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const serviceKey = extractServiceKey(decodedText)
          const matchedService = services.find(s => s.id === serviceKey)

          if (!matchedService) {
            setScannerError(`QR code invalide ou service non reconnu. (Code détecté : ${serviceKey.substring(0, 40)})`)
            return
          }

          const isReallyActive = checkServiceStatus(matchedService, counters)

          if (!isReallyActive) {
            setScannerError(`Le service ${matchedService.name} n'est pas disponible actuellement (fermé, hors horaires, ou aucun guichet actif).`)
            return
          }

          html5QrCode.stop().then(() => {
            onOpenChange(false)
            onServiceScanned(matchedService)
          }).catch(err => console.error(err))
        },
        () => {}
      ).catch((err) => {
        console.error(err)
        setScannerError("Impossible d'accéder à la caméra de votre appareil.")
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error(err))
      }
    }
  }, [open, services, counters, onOpenChange, onServiceScanned])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <QrCode className="size-5 text-primary" /> Scanner le QR Code du Service
          </DialogTitle>
        </DialogHeader>
        <div className="relative my-4 aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 border flex flex-col items-center justify-center">
          {!isReady ? (
            <div className="flex flex-col items-center gap-2 text-white/70">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-xs">Chargement des services...</p>
            </div>
          ) : (
            <div id="landing-reader" className="w-full h-full"></div>
          )}
        </div>
        {scannerError && (
          <p className="text-center text-xs font-semibold text-destructive pb-2">{scannerError}</p>
        )}
        <Button variant="outline" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  )
}