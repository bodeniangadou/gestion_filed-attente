"use client"

import { motion } from "framer-motion"
import { Search, QrCode, Building2, Clock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useApp } from "@/lib/app-context"

interface HomeViewProps {
  onNavigate: (tab: string) => void
  onScanQR: () => void
}

export function HomeView({ onNavigate, onScanQR }: HomeViewProps) {
  const { services, getStatistics } = useApp()

  const totalWaiting = services.reduce((acc, s) => acc + s.currentQueue, 0)
  const stats = getStatistics()
  const avgWaitTime = stats.avgWaitTime

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald to-emerald/80 px-6 pb-16 pt-12 text-primary-foreground"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoLTR2LTJoNHYtNGgydjRoNHYyaC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Building2 className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hôpital du Mali</h1>
              <p className="text-sm text-white/80">Bienvenue sur Rang+</p>
            </div>
          </div>
          
          <p className="mb-8 text-white/90">
            Prenez votre ticket en ligne et suivez votre position dans la file d&apos;attente en temps réel.
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un service..."
              className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-foreground shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50"
              onClick={() => onNavigate("services")}
              readOnly
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="relative z-10 -mt-8 px-6">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-light">
                  <Users className="size-5 text-emerald" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalWaiting}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-light">
                  <Clock className="size-5 text-emerald" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgWaitTime > 0 ? `${avgWaitTime} min` : "–"}</p>
                  <p className="text-xs text-muted-foreground">Temps moyen</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-auto mt-8 max-w-2xl space-y-4 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => onNavigate("services")}
            className="h-16 w-full gap-3 rounded-2xl bg-emerald text-lg font-semibold text-primary-foreground shadow-lg shadow-emerald/30 hover:bg-emerald/90"
          >
            <Building2 className="size-6" />
            Prendre un Ticket
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={onScanQR}
            variant="outline"
            className="h-16 w-full gap-3 rounded-2xl border-2 border-emerald text-lg font-semibold text-emerald hover:bg-emerald hover:text-primary-foreground"
          >
            <QrCode className="size-6" />
            Scanner un QR Code
          </Button>
        </motion.div>
      </div>

      {/* Popular Services */}
      <div className="mx-auto mt-10 max-w-2xl px-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Services populaires</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.slice(0, 6).map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card 
                className="cursor-pointer border border-border/50 transition-all hover:border-emerald hover:shadow-md"
                onClick={() => onNavigate("services")}
              >
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-light">
                    <Building2 className="size-5 text-emerald" />
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{service.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{service.currentQueue} en attente</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
