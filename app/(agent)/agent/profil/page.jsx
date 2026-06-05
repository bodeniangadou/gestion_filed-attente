"use client";

import { useApp } from "@/lib/app-context";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  CreditCard,
  Activity,
  ShieldCheck,
} from "lucide-react";

export default function ProfilPage() {
  const { getCurrentAgent, getAgentCounter } = useApp();

  const agentData = getCurrentAgent();
  const counterData = getAgentCounter();

  const agent = {
    id: agentData?.id || "AG-001",
    nom: agentData?.nom || "Fatoumata Diallo",
    email: agentData?.email || "fatoumata.diallo@hopitalmali.org",
    telephone: agentData?.telephone || "+223 70 12 34 56",
    fonction: agentData?.fonction || "Médecin généraliste",
  };

  const counter = {
    numero: counterData?.numero || "A1",
    type: counterData?.type || "Consultation générale",
  };

  const initiales =
    agent.nom.charAt(0) + (agent.nom.split(" ")[1]?.charAt(0) || "");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {initiales}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-md">
                  <Activity size={16} className="text-white" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white">{agent.nom}</h1>
                <p className="text-emerald-100 text-lg mt-1">
                  {agent.fonction}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white">
                    <CreditCard size={12} /> Matricule {agent.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white">
                    <Briefcase size={12} /> Guichet {counter.numero}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow transition">
                  <Mail size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-slate-700 font-medium">{agent.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow transition">
                  <Phone size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Téléphone
                  </p>
                  <p className="text-slate-700 font-medium">
                    {agent.telephone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow transition">
                  <Briefcase size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Service
                  </p>
                  <p className="text-slate-700 font-medium">{counter.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow transition">
                  <User size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Statut
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-700 font-medium">En ligne</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Accès sécurisé</span>
              </div>
              <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                Dernière connexion : Aujourd'hui, 08:30
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
