"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

const data = [
  {
    name: "En attente",
    value: 15,
    color: "#2563eb",
  },
  {
    name: "Traités",
    value: 45,
    color: "#22c55e",
  },
  {
    name: "Absents",
    value: 3,
    color: "#ef4444",
  },
]

export function TicketsDistribution() {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  )

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-[420px]">

      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Répartition des tickets
      </h2>

      <div className="flex items-center justify-between h-[300px]">

        <div className="w-[55%] h-full">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>

              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={0}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <text
                x="50%"
                y="46%"
                textAnchor="middle"
                className="fill-gray-500 text-sm"
              >
                Total
              </text>

              <text
                x="50%"
                y="57%"
                textAnchor="middle"
                className="fill-gray-900 text-3xl font-bold"
              >
                {total}
              </text>

            </PieChart>
          </ResponsiveContainer>

        </div>

        <div className="space-y-8 pl-8">

          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-blue-600" />

            <span className="font-medium">
              En attente
            </span>

            <span className="font-bold">
              15 (23%)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />

            <span className="font-medium">
              Traités
            </span>

            <span className="font-bold">
              45 (71%)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />

            <span className="font-medium">
              Absents
            </span>

            <span className="font-bold">
              3 (6%)
            </span>
          </div>

        </div>

      </div>

    </div>
  )
}