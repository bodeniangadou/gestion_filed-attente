"use client"

import { useEffect, useState } from "react"
import { TablePagination } from "./TablePagination"

const ITEMS_PER_PAGE = 2

const historyPatients = [
  {
    ticket: "C010",
    nom: "Ibrahim Kone",
    sexe: "H",
    age: 41,
    heure: "08:00",
    duree: "10 min",
    borderColor: "border-green-500",
  },
  {
    ticket: "C011",
    nom: "Awa Diop",
    sexe: "F",
    age: 33,
    heure: "08:30",
    duree: "12 min",
    borderColor: "border-green-500",
  },
  {
    ticket: "C013",
    nom: "Seydina Ba",
    sexe: "H",
    age: 29,
    heure: "09:20",
    duree: "08 min",
    borderColor: "border-green-500",
  },
  {
    ticket: "C014",
    nom: "Hawa Sy",
    sexe: "F",
    age: 45,
    heure: "09:45",
    duree: "15 min",
    borderColor: "border-green-500",
  },
  {
    ticket: "C015",
    nom: "Mariam Coulibaly",
    sexe: "F",
    age: 37,
    heure: "10:15",
    duree: "11 min",
    borderColor: "border-green-500",
  },
]

interface HistoryTableProps {
  search: string
}

export function HistoryTable({ search }: HistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredPatients = historyPatients.filter((patient) => {
    const patientText = [
      patient.ticket,
      patient.nom,
      patient.sexe,
      patient.age,
      patient.heure,
      patient.duree,
      "consulte",
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
                Heure
              </th>
              <th className="w-28 px-6 py-4 text-sm text-gray-500">
                Duree
              </th>
              <th className="w-36 px-6 py-4 text-sm text-gray-500">
                Statut
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

                <td className="px-6 py-5 text-gray-600">
                  {patient.duree}
                </td>

                <td className="px-6 py-5">
                  <span className="inline-flex items-center whitespace-nowrap bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    Consulte
                  </span>
                </td>
              </tr>
            ))}

            {paginatedPatients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
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
        label="Total consultes"
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
