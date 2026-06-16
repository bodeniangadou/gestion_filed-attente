"use client"

import { ArrowRight } from "lucide-react"

interface StatsCardProps {
  icon: React.ReactNode
  value: string
  title: string
  action: string
  bgColor: string
  onClick?: () => void
}

export function StatsCard({
  icon,
  value,
  title,
  action,
  bgColor,
  onClick,
}: StatsCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${bgColor}
        w-full
        rounded-2xl
        p-5
        min-h-40
        border
        border-gray-100
        shadow-sm
        flex
        flex-col
        text-left
        overflow-hidden
        transition-all
        cursor-pointer
        hover:shadow-md
      `}
    >
      {/* Icône */}
      <div className="mb-4">
        {icon}
      </div>

      {/* Contenu principal */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">
          {value}
        </h2>

        <p className="mt-2 text-sm font-medium text-gray-600">
          {title}
        </p>
      </div>

      {/* Bouton */}
      <div className="pt-3">
        <span
          className="
            flex
            items-center
            gap-2
            text-sm
            text-green-600
            font-semibold
            hover:text-green-700
            transition-colors
          "
        >
          {action}
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  )
}
