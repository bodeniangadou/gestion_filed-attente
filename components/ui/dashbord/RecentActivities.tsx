"use client"

import {
  Megaphone,
  CheckCircle,
  UserX,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

const statusConfig: Record<string, { action: string; icon: any; color: string }> = {
  waiting: { action: "en attente", icon: Clock, color: "bg-amber-100 text-amber-700" },
  called: { action: "a été appelé", icon: Megaphone, color: "bg-green-100 text-green-700" },
  serving: { action: "en cours de service", icon: Megaphone, color: "bg-blue-100 text-blue-700" },
  completed: { action: "a été terminé", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  absent: { action: "absent", icon: UserX, color: "bg-red-100 text-red-600" },
  cancelled: { action: "a été annulé", icon: XCircle, color: "bg-gray-100 text-gray-600" },
}

function formatRelativeTime(date: Date) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export function RecentActivities() {
  const router = useRouter()
  const { tickets, getAgentCounter } = useApp()

  const counter = getAgentCounter()

  const activities = tickets
    .filter((t) => counter ? t.service?.id === counter.serviceId : false)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 min-h-[500px] flex flex-col">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Activités récentes
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Dernières actions effectuées
          </p>
        </div>

        <button onClick={() => router.push("/agent/console")} className="flex items-center gap-2 text-green-600 font-semibold text-sm">
          Voir tout
          <ArrowRight size={16} />
        </button>

      </div>

      {/* Liste */}
      <div className="flex-1 space-y-4">

        {activities.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Aucune activité pour le moment
          </div>
        ) : (
          activities.map((activity) => {
            const config = statusConfig[activity.statut] || statusConfig.waiting
            const Icon = config.icon

            return (
              <div
                key={activity.id}
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                  rounded-2xl
                  bg-gray-50
                  hover:bg-gray-100
                  transition-all
                "
              >
                <div className="flex items-center gap-4">

                  <div
                    className={`
                      h-10
                      w-10
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${config.color}
                    `}
                  >
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {activity.number}
                    </p>

                    <p className="text-sm text-gray-500">
                      {config.action}
                    </p>
                  </div>

                </div>

                <span className="text-sm text-gray-500">
                  {formatRelativeTime(activity.createdAt)}
                </span>

              </div>
            )
          })
        )}

      </div>

    </div>
  )
}