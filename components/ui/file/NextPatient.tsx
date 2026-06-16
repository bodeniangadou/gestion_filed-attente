"use client"

import {
  Users,
  PhoneCall,
} from "lucide-react"

import { useRouter } from "next/navigation"

export function NextPatient() {
  const router = useRouter()

  return (
    <div className="bg-slate-50 border border-green-200 rounded-3xl p-6">

      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Prochain à appeler
      </h2>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-10">

          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Users
              size={28}
              className="text-green-600"
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Ticket
            </p>

            <h3 className="text-4xl font-bold text-gray-900">
              C001
            </h3>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Patient
            </p>

            <p className="font-bold text-gray-900">
              Aminata Keita
            </p>

            <p className="text-sm text-gray-500">
              F, 28 ans
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Arrivée
            </p>

            <p className="text-2xl font-bold text-gray-900">
              08:15
            </p>
          </div>

        </div>

        <button onClick={() => router.push("/agent/console?ticket=C001")}
          className="
            mt-6
            lg:mt-0
            h-12
            px-8
            rounded-xl
            bg-green-600
            hover:bg-green-700
            text-white
            font-semibold
            flex
            items-center
            gap-2
            transition-all
          "
        >
          <PhoneCall size={18} />
           Appeler maintenant

        </button>

      </div>

    </div>
  )
}