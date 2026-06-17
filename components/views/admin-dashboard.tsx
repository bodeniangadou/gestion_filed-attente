"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Activity, 
  Ticket, 
  CheckCircle, 
  Building2,
  Settings,
  BarChart3,
  Calendar,
  AlertCircle,
  Power,
  Bell,
  ChevronRight,
  Stethoscope,
  Monitor,
  UserCog,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/lib/app-context"

interface AdminDashboardProps {
  onNavigate: (tab: string) => void
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { services, counters, agents, tickets, hospitalSettings, setHospitalSettings, getStatistics } = useApp()
  
  const stats = getStatistics()
  
  const activeAgents = agents.filter(a => a.isOnline).length
  const todayTickets = tickets.filter(t => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(t.createdAt) >= today
  })

  const recentActivity = [
    { type: "ticket", message: "Nouveau ticket C045 - Consultation", time: "Il y a 2 min", icon: Ticket },
    { type: "agent", message: "Agent Diallo connecte - Guichet A1", time: "Il y a 5 min", icon: UserCog },
    { type: "complete", message: "Ticket L023 termine - Laboratoire", time: "Il y a 8 min", icon: CheckCircle },
    { type: "alert", message: "File d'attente > 15 - Urgences", time: "Il y a 12 min", icon: AlertCircle },
  ]

  const handleToggleAllServices = (active: boolean) => {
    // This would toggle all services
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="size-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Administration</h1>
              <p className="text-sm text-muted-foreground">{hospitalSettings.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => onNavigate("settings")}>
              <Settings className="size-4" />
              <span className="hidden sm:inline">Parametres</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Patients en attente", value: stats.totalPatients, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Temps moyen", value: `${stats.avgWaitTime || 18} min`, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
            { label: "Tickets aujourd'hui", value: stats.ticketsToday || todayTickets.length, icon: Ticket, color: "text-primary", bg: "bg-primary/10" },
            { label: "Agents actifs", value: `${activeAgents}/${agents.length}`, icon: UserCog, color: "text-violet-600", bg: "bg-violet-100" },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`flex size-12 items-center justify-center rounded-xl ${stat.bg}`}>
                        <Icon className={`size-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Acces rapide</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Services", desc: `${services.filter(s => s.isActive).length} actifs`, icon: Stethoscope, tab: "admin-services" },
              { label: "Guichets", desc: `${counters.filter(c => c.isActive).length} ouverts`, icon: Monitor, tab: "admin-counters" },
              { label: "Agents", desc: `${activeAgents} en ligne`, icon: UserCog, tab: "admin-agents" },
              { label: "Statistiques", desc: "Rapports", icon: BarChart3, tab: "admin-stats" },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.label}
                  onClick={() => onNavigate(item.tab)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Services Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-5 text-primary" />
                  Etat des services
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("admin-services")}>
                  Voir tout
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.slice(0, 5).map((service) => {
                    const serviceCounters = counters.filter(c => c.serviceId === service.id)
                    const activeCountersCount = serviceCounters.filter(c => c.isActive).length
                    const queueCount = tickets.filter(t => t.service.id === service.id && t.status === "waiting").length
                    
                    return (
                      <div key={service.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30">
                        <div className="flex items-center gap-3">
                          <div className={`size-3 rounded-full ${service.isActive ? "bg-primary" : "bg-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeCountersCount} guichet{activeCountersCount > 1 ? "s" : ""} actif{activeCountersCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{queueCount}</p>
                            <p className="text-xs text-muted-foreground">en attente</p>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Actif" : "Ferme"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-5 text-primary" />
                  Activite recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                          activity.type === "ticket" ? "bg-blue-100 text-blue-600" :
                          activity.type === "agent" ? "bg-violet-100 text-violet-600" :
                          activity.type === "complete" ? "bg-primary/10 text-primary" :
                          "bg-amber-100 text-amber-600"
                        }`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Hospital Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
                    <Power className="size-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Controle global</h3>
                    <p className="text-sm text-muted-foreground">
                      Horaires : {hospitalSettings.openTime} - {hospitalSettings.closeTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Services actifs</p>
                    <p className="text-2xl font-bold text-foreground">
                      {services.filter(s => s.isActive).length}/{services.length}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => onNavigate("admin-settings")}
                  >
                    <Settings className="size-4" />
                    Configurer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
