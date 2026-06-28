"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useApp } from "@/lib/app-context"

export function TicketsDistribution() {
  const { tickets, getAgentCounter } = useApp()
  const counter = getAgentCounter()

  // Tickets du service de l'agent connecté
  const serviceTickets = tickets.filter((t) =>
    counter ? t.service?.id === counter.serviceId : false
  )

  const waiting = serviceTickets.filter(
    (t) => t.statut === "waiting" || t.statut === "called" || t.statut === "serving"
  ).length
  const completed = serviceTickets.filter((t) => t.statut === "completed").length
  const absent = serviceTickets.filter((t) => t.statut === "absent").length

  const data = [
    { name: "En attente", value: waiting, color: "#2563eb" },
    { name: "Traités", value: completed, color: "#22c55e" },
    { name: "Absents", value: absent, color: "#ef4444" },
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-[400px] flex flex-col">
      <h2 className="text-lg font-bold text-foreground mb-6">Répartition des tickets</h2>

      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="outline-none transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>

            <Tooltip
              wrapperStyle={{
                outline: 'none',
                zIndex: 9999
              }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px',
                color: '#1f2937'
              }}
              itemStyle={{
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="text-3xl font-bold text-foreground">{total}</span>
        </div>
      </div>

      {/* Légende interactive */}
      <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-border">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm group">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-bold">
              {item.value} <span className="text-muted-foreground font-normal">
                ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}