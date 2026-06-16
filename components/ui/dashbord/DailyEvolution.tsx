"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-[420px]">

      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Évolution du jour
      </h2>

      <div className="h-[260px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={data}
            margin={{
              top: 15,
              right: 20,
              left: 20,
              bottom: 15,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="heure"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />

            <Line
              type="monotone"
              dataKey="tickets"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 3 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      <div className="mt-6 flex items-center gap-2">

        <div className="w-4 h-1 bg-blue-600 rounded-full" />

        <span className="text-sm font-medium text-gray-600">
          Tickets traités
        </span>

      </div>

    </div>
  )
}