"use client"

import { PhoneCall } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TablePagination } from "./TablePagination"

const ITEMS_PER_PAGE = 2

const patients = [
  {
    ticket: "C001",
    nom: "Aminata Keita",
    sexe: "F",
    age: 28,
    heure: "08:15",
    position: 1,
    borderColor: "border-orange-500",
  },
  {
    ticket: "C002",
    nom: "Boubacar Sidibe",
    sexe: "H",
    age: 35,
    heure: "08:25",
    position: 2,
    borderColor: "border-green-500",
  },
  {
    ticket: "C003",
    nom: "Fatoumata Diarra",
    sexe: "F",
    age: 42,
    heure: "08:35",
    position: 3,
    borderColor: "border-red-500",
  },
  {
    ticket: "C004",
    nom: "Moussa Traore",
    sexe: "H",
    age: 29,
    heure: "08:45",
    position: 4,
    borderColor: "border-slate-700",
  },
  {
    ticket: "C005",
    nom: "Mariama Camara",
    sexe: "F",
    age: 50,
    heure: "08:55",
    position: 5,
    borderColor: "border-yellow-500",
  },
]

interface QueueTableProps {
  search: string
}

export function QueueTable({ search }: QueueTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredPatients = patients.filter((patient) => {
    const patientText = [
      patient.ticket,
      patient.nom,
      patient.sexe,
      patient.age,
      patient.heure,
      patient.position,
      "en attente",
    ].join(" ").toLowerCase()

    return patientText.includes(normalizedSearch)
  })

  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="w-24 px-6 py-4 text-sm text-gray-500">
                No Ticket
              </th>
              <th className="w-56 px-6 py-4 text-sm text-gray-500">
                Patient
              </th>
              <th className="w-36 px-6 py-4 text-sm text-gray-500">
                Heure d'arrivee
              </th>
              <th className="w-28 px-6 py-4 text-sm text-gray-500">
                Position
              </th>
              <th className="w-36 px-6 py-4 text-sm text-gray-500">
                Statut
              </th>
              <th className="px-6 py-4 text-sm text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedPatients.map((patient) => (
              <tr
                key={patient.ticket}
                className={`
                  border-t
                  border-gray-100
                  hover:bg-gray-50
                  border-l-4
                  ${patient.borderColor}
                `}
              >
                <td className="px-6 py-5 font-bold text-gray-900">
                  {patient.ticket}
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-700">
                      {patient.nom.charAt(0)}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {patient.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.sexe}, {patient.age} ans
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-gray-600">
                  {patient.heure}
                </td>

                <td className="px-6 py-5">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                    {patient.position}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className="inline-flex items-center whitespace-nowrap bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    En attente
                  </span>
                </td>

                <td className="px-6 py-5">
                  <button
                    type="button"
                    onClick={() => router.push(`/agent/console?ticket=${patient.ticket}`)}
                    className="
                      bg-green-600
                      hover:bg-green-700
                      text-white
                      px-5
                      py-2.5
                      rounded-lg
                      flex
                      items-center
                      gap-2
                      transition-all
                    "
                  >
                    <PhoneCall size={16} />
                    Appeler
                  </button>
                </td>
              </tr>
            ))}

            {paginatedPatients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  Aucun patient trouve
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalItems={filteredPatients.length}
        itemsPerPage={ITEMS_PER_PAGE}
        label="Total en attente"
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
