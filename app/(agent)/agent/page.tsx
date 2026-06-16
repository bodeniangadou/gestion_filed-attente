"use client"

import {
  Users,
  CheckCircle,
  Clock,
  UserX,
} from "lucide-react"

import { StatsCard } from "@/components/ui/dashbord/StatsCard"
import { CounterStatus } from "@/components/ui/dashbord/CounterStatus"
import { RecentActivities } from "@/components/ui/dashbord/RecentActivities"
import { TicketsDistribution } from "@/components/ui/dashbord/TicketsDistribution"
import { DailyEvolution } from "@/components/ui/dashbord/DailyEvolution"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

  {/* Partie gauche */}

  <div>

    <h1 className="text-3xl font-bold text-gray-900 mb-6">
      Dashboard Agent
    </h1>

    <h2 className="text-2xl font-medium text-gray-700">

      Bienvenue,

      <span className="text-green-600 font-bold ml-2">
        Mamadou Diallo
      </span>

    </h2>

    <p className="text-gray-500 text-base mt-2">
      Voici un aperçu de votre activité aujourd'hui.
    </p>

  </div>

  {/* Carte guichet */}

  <div
    className="
      bg-white
      rounded-3xl
      border
      border-gray-100
      shadow-sm
      p-6
      w-full
      lg:w-[300px]
    "
  >

    <div className="flex justify-between items-center mb-6">

      <h3 className="text-lg font-semibold text-gray-900">
        Guichet actuel
      </h3>

      <div
          className="
            bg-green-100
            text-green-700
            text-sm
            font-semibold
            px-3
            py-1.5
            rounded-xl
          "
        >
        A1
      </div>

    </div>

    <p className="text-lg font-semibold text-gray-800">
      Consultation Générale
    </p>

  </div>

</div>

      {/* Cartes statistiques */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatsCard
          icon={<Users size={24} className="text-green-600" />}
          value="12"
          title="Patients en attente"
          action="Voir la file"
          bgColor="bg-green-50"
          onClick={() => router.push("/agent/file")}
        />

        <StatsCard
          icon={<CheckCircle size={24} className="text-emerald-600" />}
          value="48"
          title="Patients traités"
          action="Voir l'historique"
          bgColor="bg-emerald-50"
          onClick={() => router.push("/agent/file?tab=history")}
        />

        <StatsCard
          icon={<Clock size={24} className="text-lime-600" />}
          value="08 min"
          title="Temps moyen"
          action="Ouvrir la console"
          bgColor="bg-lime-50"
          onClick={() => router.push("/agent/console")}
        />

        <StatsCard
          icon={<UserX size={24} className="text-teal-600" />}
          value="03"
          title="Patients absents"
          action="Voir les absents"
          bgColor="bg-teal-50"
          onClick={() => router.push("/agent/file?tab=absent")}
        />

      </div>

      {/* Activités + Statut */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        <div className="xl:col-span-2">
          <RecentActivities />
        </div>

        <div className="xl:col-span-2">
          <CounterStatus />
        </div>

      </div>

      {/* Graphiques */}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        <div className="xl:col-span-2">
          <TicketsDistribution />
        </div>

        <div className="xl:col-span-2">
          <DailyEvolution />
        </div>

      </div>
    </div>
  )
}
