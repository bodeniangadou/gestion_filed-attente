"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts"
import { useMemo } from "react"
import { useApp } from "@/lib/app-context"

export function DailyEvolution() {
  const { tickets, getAgentCounter } = useApp()
  const counter = getAgentCounter()

  const data = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Tickets du service de l'agent, pris aujourd'hui uniquement
    const todayServiceTickets = tickets.filter((t) => {
      if (!counter || t.service?.id !== counter.serviceId) return false
      return new Date(t.createdAt) >= today
    })

    // Heures de service : 08h à 18h (ajuste si ton hôpital a d'autres horaires)
    const startHour = 8
    const endHour = 18
    const hourBuckets: { heure: string; tickets: number }[] = []

    let cumulative = 0
    for (let h = startHour; h <= endHour; h++) {
      const countThisHour = todayServiceTickets.filter((t) => {
        const ticketHour = new Date(t.createdAt).getHours()
        return ticketHour === h
      }).length

      cumulative += countThisHour
      hourBuckets.push({
        heure: `${String(h).padStart(2, "0")}h`,
        tickets: cumulative,
      })
    }

    return hourBuckets
  }, [tickets, counter])

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Évolution du jour</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
          Aujourd'hui
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="heure" 
              tickLine={false} 
              axisLine={false} 
              fontSize={12} 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              fontSize={12} 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
              }}
            />
            <Area 
              type="monotone" 
              dataKey="tickets" 
              stroke="#2563eb" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTickets)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}