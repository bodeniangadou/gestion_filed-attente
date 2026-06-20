"use client"
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function StatsCards() {
  const [stats, setStats] = useState({ services: 0, patients: 0 });

  useEffect(() => {
    async function fetchStats() {
      // Compte les services ouverts
      const { count: services } = await supabase
        .from('service')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'ouvert');

      // Compte les patients en attente
      const { count: patients } = await supabase
        .from('ticket')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'waiting');

      setStats({ services: services || 0, patients: patients || 0 });
    }
    fetchStats();
  }, []);

  return (
    <div className="flex gap-4 p-4 justify-center">
      <div className="bg-blue-600 text-white p-4 rounded-lg">
        <p className="text-sm">Services Actifs</p>
        <p className="text-2xl font-bold">{stats.services}</p>
      </div>
      <div className="bg-green-600 text-white p-4 rounded-lg">
        <p className="text-sm">Patients en attente</p>
        <p className="text-2xl font-bold">{stats.patients}</p>
      </div>
    </div>
  );
}