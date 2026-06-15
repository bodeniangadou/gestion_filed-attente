import {
  Building2,
  User,
  Stethoscope,
  Clock,
  CheckCircle,
} from "lucide-react"

export function CounterStatus() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 min-h-[500px] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Statut du guichet
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Informations du poste de travail
          </p>
        </div>

        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
          <CheckCircle size={16} />
          Ouvert
        </div>

      </div>

      {/* Informations */}
      <div className="flex-1 space-y-4">

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-green-600" />
            <span className="text-gray-600">Guichet</span>
          </div>

          <span className="font-semibold text-gray-900">
            A1
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
          <div className="flex items-center gap-3">
            <Stethoscope size={20} className="text-green-600" />
            <span className="text-gray-600">Service</span>
          </div>

          <span className="font-semibold text-gray-900">
            Consultation Générale
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
          <div className="flex items-center gap-3">
            <User size={20} className="text-green-600" />
            <span className="text-gray-600">Agent</span>
          </div>

          <span className="font-semibold text-gray-900">
            Mamadou Diallo
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-green-600" />
            <span className="text-gray-600">Ouverture</span>
          </div>

          <span className="font-semibold text-gray-900">
            07:30
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-green-600" />
            <span className="text-gray-600">Fermeture</span>
          </div>

          <span className="font-semibold text-gray-900">
            17:00
          </span>
        </div>

      </div>

    </div>
  )
}