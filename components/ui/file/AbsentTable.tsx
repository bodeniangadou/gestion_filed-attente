"use client"

import { useEffect, useState } from "react"
import { TablePagination } from "./TablePagination"

const ITEMS_PER_PAGE = 2

const absentPatients = [
  {
    ticket: "C012",
    nom: "Cheick Diallo",
    sexe: "H",
    age: 38,
    heure: "09:00",
    tentatives: 3,
    borderColor: "border-red-500",
  },
  {
    ticket: "C020",
    nom: "Mamadou Traore",
    sexe: "H",
    age: 26,
    heure: "09:45",
    tentatives: 2,
    borderColor: "border-red-500",
  },
  {
    ticket: "C021",
    nom: "Aissata Coulibaly",
    sexe: "F",
    age: 34,
    heure: "10:10",
    tentatives: 3,
    borderColor: "border-red-500",
  },
  {
    ticket: "C022",
    nom: "Fatoumata Camara",
    sexe: "F",
    age: 31,
    heure: "10:45",
    tentatives: 2,
    borderColor: "border-red-500",
  },
]

interface AbsentTableProps {
  search: string
}

export function AbsentTable({ search }: AbsentTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredPatients = absentPatients.filter((patient) => {
    const patientText = [
      patient.ticket,
      patient.nom,
      patient.sexe,
      patient.age,
      patient.heure,
      patient.tentatives,
      "absent",
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
                Tentatives
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
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-semibold text-red-600">
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
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                    {patient.tentatives}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className="inline-flex items-center whitespace-nowrap bg-red-100 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                    Absent
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
        label="Total absents"
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
