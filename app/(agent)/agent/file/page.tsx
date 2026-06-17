"use client"

import { useState } from "react"
import { RotateCw, Search } from "lucide-react"

// Données : Ajout du champ téléphone (crucial)
const patients = [
  { ticket: "C-001", nom: "Aminata Keita", phone: "76 45 32 10", arrival: new Date(Date.now() - 1000 * 60 * 15), status: "waiting", duration: "-" },
  { ticket: "C-002", nom: "Boubacar Sidibe", phone: "65 90 12 34", arrival: new Date(Date.now() - 1000 * 60 * 60 * 2), status: "waiting", duration: "-" },
  { ticket: "C-010", nom: "Ibrahim Koné", phone: "82 11 55 99", arrival: new Date(Date.now() - 1000 * 60 * 60 * 25), status: "completed", duration: "25 min" },
  { ticket: "C-012", nom: "Cheick Diallo", phone: "73 44 22 11", arrival: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), status: "absent", duration: "-" },
]

export default function FilePage() {
  const [activeTab, setActiveTab] = useState("queue")
  const [search, setSearch] = useState("")

const formatDateTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime(); // différence en ms
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  // 1. Moins d'une minute
  if (minutes < 1) return "À l'instant";

  // 2. Entre 1 et 59 minutes
  if (minutes < 60) return `Il y a ${minutes} min`;

  // 3. Entre 1h et 24h
  if (hours < 24) return `Il y a ${hours} h`;

  // 4. Si c'est aujourd'hui (hors calcul des heures ci-dessus) ou hier
  // On affiche le jour de la semaine (ex: Mardi)
  if (diff < 1000 * 60 * 60 * 24 * 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  }

  // 5. Plus d'une semaine : format complet
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

  const filteredData = patients.filter(p => 
    (activeTab === "queue" ? p.status === "waiting" : p.status === activeTab) &&
    (p.nom.toLowerCase().includes(search.toLowerCase()) || p.ticket.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[13px]">
      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
        <h1 className="font-bold text-gray-800">Gestion de la File d'Attente</h1>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-1.5 bg-emerald text-white rounded text-[12px] font-bold hover:bg-green-700">
          <RotateCw size={12} /> Actualiser
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Rechercher par ticket, nom ou téléphone..." 
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded text-[13px] focus:outline-none focus:ring-1 focus:ring-green-600"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-0.5 rounded">
          {["queue", "history", "absent"].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-1 text-[12px] font-bold rounded capitalize transition-all ${activeTab === tab ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}
            >
              {tab === "queue" ? "En attente" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
            <tr>
              <th className="px-4 py-2">Ticket</th>
              <th className="px-4 py-2">Nom du Patient</th>
              <th className="px-4 py-2">Téléphone</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Date / Heure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((p) => (
              <tr key={p.ticket} className="hover:bg-gray-50 text-gray-700">
                <td className="px-4 py-2 font-black text-green-700 font-mono text-[14px]">{p.ticket}</td>
                <td className="px-4 py-2 font-medium">{p.nom}</td>
                {/* Numéro de téléphone bien visible */}
                <td className="px-4 py-2 font-mono text-gray-600 tracking-wider">{p.phone}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 
                    p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 font-mono text-[12px]">{formatDateTime(p.arrival)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-6 text-center text-gray-400 text-[12px] italic">Aucun résultat.</div>
        )}
      </div>
    </div>
  )
}