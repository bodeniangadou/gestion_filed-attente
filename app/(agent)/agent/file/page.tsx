"use client"

import { useState } from "react"
import { RotateCw, Search } from "lucide-react"
import { useApp } from "@/lib/app-context"

export default function FilePage() {
  const [activeTab, setActiveTab] = useState("queue")
  const [search, setSearch] = useState("")
  const { tickets, getAgentCounter, fetchTickets } = useApp()

  const counter = getAgentCounter()

const formatDateTime = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const now = new Date();
  
  // Fonctions de comparaison calendaire
  const isToday = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  
  const isYesterday = (d1: Date, d2: Date) => {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return d1.getDate() === yesterday.getDate() && d1.getMonth() === yesterday.getMonth() && d1.getFullYear() === yesterday.getFullYear();
  };

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // 1. Aujourd'hui
  if (isToday(date, now)) {
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return ` Il y'a ${diffMinutes} min`;
    return `${hours}h${minutes}`; // Exemple: "14h30"
  }

  // 2. Hier
  if (isYesterday(date, now)) {
    return `Hier, ${hours}h${minutes}`;
  }

  // 3. Cette semaine (moins de 7 jours)
  if (diffMs < 1000 * 60 * 60 * 24 * 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' }) + ` à ${hours}h${minutes}`;
  }

  // 4. Plus vieux
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

  // Tickets du service géré par l'agent connecté uniquement
  const serviceTickets = tickets.filter((t) =>
    counter ? t.service?.id === counter.serviceId : false
  )

  const filteredData = serviceTickets
    .filter((t) => {
      if (activeTab === "queue") return t.statut === "waiting" || t.statut === "called" || t.statut === "serving"
      if (activeTab === "history") return t.statut === "completed"
      if (activeTab === "absent") return t.statut === "absent"
      return true
    })
    .filter((t) => {
      const q = search.toLowerCase()
      return (
        t.userName.toLowerCase().includes(q) ||
        t.number.toLowerCase().includes(q) ||
        (t.phone || "").includes(search)
      )
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getDuration = (ticket: typeof serviceTickets[number]) => {
  if (ticket.statut !== "completed" || !ticket.completedAt) return "-";

  const diffInMs = new Date(ticket.completedAt).getTime() - new Date(ticket.createdAt).getTime();
  const totalMinutes = Math.round(diffInMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
};

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[13px]">
      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
        <h1 className="font-bold text-gray-800">Gestion de la File d'Attente</h1>
        <button onClick={() => fetchTickets()} className="flex items-center gap-2 px-3 py-1.5 bg-emerald text-white rounded text-[12px] font-bold hover:bg-green-700">
          <RotateCw size={12} /> Actualiser
        </button>
      </div>

      {!counter ? (
        <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-400 text-[12px] italic">
          Aucun guichet assigné pour le moment.
        </div>
      ) : (
        <>
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
                  {tab === "queue" ? "En attente" : tab === "history" ? "Historique" : "Absents"}
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
                  <th className="px-4 py-2">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 text-gray-700">
                    <td className="px-4 py-2 font-black text-green-700 font-mono text-[14px]">{t.number}</td>
                    <td className="px-4 py-2 font-medium">{t.userName}</td>
                    <td className="px-4 py-2 font-mono text-gray-600 tracking-wider">{t.phone || "-"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.statut === 'waiting' || t.statut === 'called' || t.statut === 'serving' ? 'bg-amber-100 text-amber-700' : 
                        t.statut === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.statut}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-[12px]">{formatDateTime(t.createdAt)}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-[12px]">{getDuration(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-[12px] italic">Aucun résultat.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}