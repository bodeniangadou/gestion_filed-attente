"use client"

import {
  Users,
  History,
  UserX,
} from "lucide-react"

interface FileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function FileTabs({
  activeTab,
  onTabChange,
}: FileTabsProps) {
  return (
    <div>

      {/* Onglets */}

      <div className="flex items-center gap-10">

        <button
          onClick={() => onTabChange("queue")}
          className={`
            flex items-center gap-2
            pb-4
            text-base
            font-semibold
            border-b-2
            transition-all

            ${
              activeTab === "queue"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500"
            }
          `}
        >
          <Users size={18} />
          File d'attente
        </button>

        <button
          onClick={() => onTabChange("history")}
          className={`
            flex items-center gap-2
            pb-4
            text-base
            font-semibold
            border-b-2
            transition-all

            ${
              activeTab === "history"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500"
            }
          `}
        >
          <History size={18} />
          Historique
        </button>

        <button
          onClick={() => onTabChange("absent")}
          className={`
            flex items-center gap-2
            pb-4
            text-base
            font-semibold
            border-b-2
            transition-all

            ${
              activeTab === "absent"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500"
            }
          `}
        >
          <UserX size={18} />
          Absents
        </button>

      </div>

      {/* Trait horizontal */}

      <hr className="border-gray-200" />

    </div>
  )
}