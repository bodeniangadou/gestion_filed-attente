"use client"

import {
  Search,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface FileFiltersProps {
  search: string
  status: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function FileFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: FileFiltersProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()

    window.setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Recherche */}
      <div className="lg:col-span-6 relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un patient ou un ticket..."
          className="
            w-full
            h-12
            pl-11
            pr-4
            rounded-2xl
            border
            border-gray-200
            bg-white
            outline-none
            focus:ring-2
            focus:ring-green-500
          "
        />
      </div>

      {/* Filtre statut */}
      <div className="lg:col-span-3 relative">
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="
            w-full
            h-12
            px-4
            rounded-2xl
            border
            border-gray-200
            bg-white
            appearance-none
            outline-none
          "
        >
          <option value="waiting">
            En attente
          </option>

          <option value="completed">
            Consulte
          </option>

          <option value="absent">
            Absent
          </option>
        </select>

        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={18}
        />
      </div>

      {/* Actualiser */}
      <div className="lg:col-span-3">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="
            w-full
            h-12
            rounded-2xl
            bg-green-600
            hover:bg-green-700
            text-white
            font-medium
            flex
            items-center
            justify-center
            gap-2
            transition-all
            disabled:opacity-80
            disabled:cursor-wait
          "
        >
          <RefreshCw
            size={18}
            className={isRefreshing ? "animate-spin" : ""}
          />
          {isRefreshing ? "Actualisation..." : "Actualiser"}
        </button>
      </div>
    </div>
  )
}
