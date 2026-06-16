"use client"

import {
  CheckCircle,
  UserX,
} from "lucide-react"


import { useRouter } from "next/navigation"

const history = [
  {
    ticket: "C010",
    patient: "Ibrahim Koné",
    heure: "08:00",
    statut: "Consulté",
  },
  {
    ticket: "C011",
    patient: "Awa Diop",
    heure: "08:30",
    statut: "Consulté",
  },
  {
    ticket: "C012",
    patient: "Cheick Diallo",
    heure: "09:00",
    statut: "Absent",
  },
  {
    ticket: "C013",
    patient: "Seydina Ba",
    heure: "09:20",
    statut: "Consulté",
  },
  {
    ticket: "C014",
    patient: "Hawa Sy",
    heure: "09:45",
    statut: "Consulté",
  },
]

export function QuickHistory() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-bold text-gray-900">
          Historique rapide
        </h2>

        <button onClick={() => router.push("/agent/file?tab=history")} className="text-green-600 font-semibold text-sm hover:text-green-700">
         Voir tout
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

        {history.map((item) => (
          <div
            key={item.ticket}
            className="
              border
              border-gray-100
              rounded-2xl
              p-4
              hover:shadow-sm
              transition-all
            "
          >

            <div className="mb-4">

              {item.statut === "Consulté" ? (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle
                    size={16}
                    className="text-green-600"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <UserX
                    size={16}
                    className="text-red-500"
                  />
                </div>
              )}

            </div>

            <h3 className="font-bold text-gray-900 text-sm">
              {item.ticket}
            </h3>

            <p className="text-sm text-gray-700 mt-2">
              {item.patient}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              {item.heure}
            </p>

            <p
              className={`mt-3 text-sm font-semibold ${
                item.statut === "Consulté"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {item.statut === "Consulté"
                ? "✓ Consulté"
                : "Absent"}
            </p>

          </div>
        ))}

      </div>

    </div>
  )
}