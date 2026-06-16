import {
  Megaphone,
  CheckCircle,
  UserX,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"

const activities = [
  {
    ticket: "C001",
    action: "a été appelé",
    time: "Il y a 2 min",
    icon: Megaphone,
    color: "bg-green-100 text-green-700",
  },
  {
    ticket: "C002",
    action: "a été terminé",
    time: "Il y a 15 min",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    ticket: "C003",
    action: "absent",
    time: "Il y a 28 min",
    icon: UserX,
    color: "bg-red-100 text-red-600",
  },
  {
    ticket: "C004",
    action: "a été appelé",
    time: "Il y a 35 min",
    icon: Megaphone,
    color: "bg-green-100 text-green-700",
  },
]

export function RecentActivities() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 min-h-[500px] flex flex-col">

      {/* Header */}
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

        {activities.map((activity, index) => {
          const Icon = activity.icon

          return (
            <div
              key={index}
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
                    ${activity.color}
                  `}
                >
                  <Icon size={18} />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    {activity.ticket}
                  </p>

                  <p className="text-sm text-gray-500">
                    {activity.action}
                  </p>
                </div>

              </div>

              <span className="text-sm text-gray-500">
                {activity.time}
              </span>

            </div>
          )
        })}

      </div>

    </div>
  )
}