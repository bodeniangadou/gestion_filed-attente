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

const data = [
  { heure: "08h", tickets: 3 },
  { heure: "09h", tickets: 9 },
  { heure: "10h", tickets: 11 },
  { heure: "11h", tickets: 18 },
  { heure: "12h", tickets: 19 },
  { heure: "13h", tickets: 34 },
  { heure: "14h", tickets: 34 },
  { heure: "15h", tickets: 38 },
  { heure: "16h", tickets: 41 },
  { heure: "17h", tickets: 52 },
  { heure: "18h", tickets: 52 },
]

export function DailyEvolution() {
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