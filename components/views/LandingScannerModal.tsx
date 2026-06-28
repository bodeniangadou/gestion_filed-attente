"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { QrCode } from "lucide-react"
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

export function LandingScannerModal({ open, onOpenChange, onServiceScanned }: LandingScannerModalProps) {
  const { services, counters } = useApp()
  const [scannerError, setScannerError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (open) {
      setScannerError(null)
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("landing-reader")
        html5QrCodeRef.current = html5QrCode

        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Le QR généré côté admin contient une URL du type
            // https://.../scanner/{serviceId} — on en extrait l'identifiant,
            // ou on accepte aussi un identifiant brut si le QR le contient directement
            let serviceKey = decodedText
            const match = decodedText.match(/\/scanner\/([^/?#]+)/)
            if (match) {
              serviceKey = match[1]
            } else if (decodedText.includes("?service=")) {
              const urlParams = new URLSearchParams(decodedText.split("?")[1])
              serviceKey = urlParams.get("service") || decodedText
            }

            const matchedService = services.find(s => s.id === serviceKey)

            if (!matchedService) {
              setScannerError("QR code invalide ou service non reconnu.")
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

      return () => clearTimeout(timer)
    }

    return () => {
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
          <div id="landing-reader" className="w-full h-full"></div>
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