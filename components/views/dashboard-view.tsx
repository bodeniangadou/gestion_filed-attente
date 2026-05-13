"use client"

import { motion } from "framer-motion"
import { Users, Clock, TrendingUp, Activity, Ticket, CheckCircle, AlertCircle, Timer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/lib/app-context"

const stats = [
  { label: "Patients en attente", value: "48", change: "+12%", icon: Users, trend: "up" },
  { label: "Temps moyen d'attente", value: "18 min", change: "-5%", icon: Clock, trend: "down" },
  { label: "Tickets traités", value: "156", change: "+8%", icon: CheckCircle, trend: "up" },
  { label: "Services actifs", value: "6", change: "0%", icon: Activity, trend: "neutral" },
]

const recentActivity = [
  { type: "ticket", message: "Nouveau ticket C045 - Consultation Générale", time: "Il y a 2 min" },
  { type: "call", message: "Ticket L023 appelé au Guichet B1", time: "Il y a 5 min" },
  { type: "complete", message: "Ticket R012 traité - Radiologie", time: "Il y a 8 min" },
  { type: "absent", message: "Ticket C042 marqué absent", time: "Il y a 12 min" },
  { type: "ticket", message: "Nouveau ticket U007 - Urgences", time: "Il y a 15 min" },
]

export function DashboardView() {
  const { services, counters, user } = useApp()

  const activeCounters = counters.filter(c => c.isActive).length

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "admin" ? "Vue d'ensemble de l'hôpital" : "Bienvenue sur Rang+"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
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
                        <p className={`mt-1 text-xs ${
                          stat.trend === "up" ? "text-emerald" : 
                          stat.trend === "down" ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {stat.change} vs hier
                        </p>
                      </div>
                      <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-light">
                        <Icon className="size-6 text-emerald" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Services Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-emerald" />
                  Affluence par service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      <span className="text-sm text-muted-foreground">{service.currentQueue} patients</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-accent">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((service.currentQueue / 20) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full bg-emerald"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5 text-emerald" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                        activity.type === "ticket" ? "bg-blue-100 text-blue-600" :
                        activity.type === "call" ? "bg-amber-100 text-amber-600" :
                        activity.type === "complete" ? "bg-emerald-light text-emerald" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {activity.type === "ticket" && <Ticket className="size-4" />}
                        {activity.type === "call" && <Timer className="size-4" />}
                        {activity.type === "complete" && <CheckCircle className="size-4" />}
                        {activity.type === "absent" && <AlertCircle className="size-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="bg-emerald text-primary-foreground">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-lg font-semibold">Guichets actifs</p>
                <p className="text-sm text-white/80">{activeCounters} sur {counters.length} guichets en service</p>
              </div>
              <div className="text-4xl font-bold">{activeCounters}/{counters.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
