"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  RotateCcw,
  UserX,
  Volume2,
  CheckCircle,
  ChevronRight,
  Clock,
  Users,
  VolumeX,
  Timer,
  Star,
  Play,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import type { Ticket } from "@/lib/app-context";

export default function ConsoleAppel() {
  // --- Récupération du contexte ---
  const {
    getAgentQueue,
    callNextPatient,
    markAbsent,
    recallPatient,
    completeService,
    toggleCounter,
    getAgentCounter,
    getCurrentAgent,
    tickets,
    setTickets,
  } = useApp();

  const agent = getCurrentAgent();
  const counter = getAgentCounter();
  const fileAttente = getAgentQueue();

  // --- États locaux pour l'UI ---
  const [patientActuel, setPatientActuel] = useState<Ticket | null>(null);
  const [consultationActive, setConsultationActive] = useState(false);
  const [debutConsultation, setDebutConsultation] = useState<number | null>(
    null,
  );
  const [dureeConsultationReelle, setDureeConsultationReelle] = useState<
    number | null
  >(0);
  const [nbTraites, setNbTraites] = useState(0);
  const [sonActif, setSonActif] = useState(true);
  const [modalPriorite, setModalPriorite] = useState(false);
  const [numeroPriorite, setNumeroPriorite] = useState("");
  const [annonceKey, setAnnonceKey] = useState(0);

  // Synthèse vocale
  const syntheseVocale = useRef<SpeechSynthesisUtterance | null>(null);

  // --- Effets ---
  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    syntheseVocale.current = utterance;
  }, []);

  // Timer de consultation
  useEffect(() => {
    let intervalle: ReturnType<typeof setInterval> | undefined;
    if (consultationActive && debutConsultation) {
      intervalle = setInterval(() => {
        setDureeConsultationReelle(
          Math.floor((Date.now() - debutConsultation) / 1000),
        );
      }, 1000);
    }
    return () => {
      if (intervalle) clearInterval(intervalle);
    };
  }, [consultationActive, debutConsultation]);

  // Mise à jour du patient actuel à partir du contexte
  useEffect(() => {
    const current = tickets.find(
      (t) =>
        (t.status === "called" || t.status === "serving") &&
        t.service.id === counter?.serviceId,
    );
    if (current) {
      setPatientActuel(current);
      if (current.status === "serving") {
        setConsultationActive(true);
        if (!debutConsultation) setDebutConsultation(Date.now());
      } else {
        setConsultationActive(false);
        setDebutConsultation(null);
        setDureeConsultationReelle(0);
      }
    } else {
      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
      setDureeConsultationReelle(0);
    }
  }, [tickets, counter, debutConsultation]);

  // --- Fonction de formatage pour la voix (lecture exacte) ---
  const formaterPourVoix = (texte: string): string => {
    if (!texte) return "disponible";
    // Ajoute un espace entre les lettres majuscules consécutives
    // Ex: "CG" → "C G", "CHIR" → "C H I R"
    return texte.replace(/([A-Z])([A-Z])/g, "$1 $2");
  };

  // --- Fonctions vocales ---
  const parler = (message: string) => {
    if (!sonActif) return;
    if (syntheseVocale.current) {
      syntheseVocale.current.text = message;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(syntheseVocale.current);
    }
  };

  const annoncerPatient = (ticket: Ticket) => {
    const nomGuichet = ticket.counterName || counter?.name || "disponible";
    const nomPourVoix = formaterPourVoix(nomGuichet);
    const phrase = `Ticket ${ticket.number}, veuillez vous présenter au guichet ${nomPourVoix}.`;
    parler(phrase);
  };

  // --- Appeler le prochain patient (async) ---
  const appelerSuivant = async () => {
    if (!counter?.isActive || fileAttente.length === 0) return;
    const prochain = await callNextPatient(); // ✅ await
    if (prochain) {
      setPatientActuel(prochain);
      setConsultationActive(false);
      setDebutConsultation(null);
      setDureeConsultationReelle(0);
      setAnnonceKey(annonceKey + 1);
      annoncerPatient(prochain);
    }
  };

  // --- Démarrer la consultation ---
  const demarrerConsultation = () => {
    if (!patientActuel) return;

    // Mettre à jour le ticket dans le contexte avec le statut "serving"
    setTickets((prev) =>
      prev.map((t) =>
        t.id === patientActuel.id ? { ...t, status: "serving" as const } : t,
      ),
    );
    // Le useEffect détectera le changement et activera le timer
  };

  // --- Rappeler (async) ---
  const rappeler = async () => {
    if (!patientActuel) return;
    await recallPatient(patientActuel.id); // ✅ await
    setAnnonceKey(annonceKey + 1);
    annoncerPatient(patientActuel);
  };

  // --- Marquer absent (async) ---
  const marquerAbsent = async () => {
    if (!patientActuel) return;
    if (confirm(`Absent·e : ${patientActuel.userName} ?`)) {
      await markAbsent(patientActuel.id); // ✅ await
      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
      setDureeConsultationReelle(0);
    }
  };

  // --- Terminer la consultation (async) ---
  const terminerConsultation = async () => {
    if (!patientActuel || !consultationActive) return;
    await completeService(patientActuel.id); // ✅ await
    setNbTraites(nbTraites + 1);
    setPatientActuel(null);
    setConsultationActive(false);
    setDebutConsultation(null);
    setDureeConsultationReelle(0);
  };

  // --- Fin de file ---
  const reporterFinFile = () => {
    if (!patientActuel) return;

    const autresTickets = tickets.filter(
      (t) =>
        t.service.id === patientActuel.service.id &&
        t.status === "waiting" &&
        t.id !== patientActuel.id,
    );

    const nouvellePosition = autresTickets.length + 1;

    const ticketRepousse: Ticket = {
      ...patientActuel,
      status: "waiting",
      position: nouvellePosition,
      counterId: undefined,
      counterName: undefined,
      calledAt: undefined,
      completedAt: undefined,
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === patientActuel.id ? ticketRepousse : t)),
    );

    setPatientActuel(null);
    setConsultationActive(false);
    setDebutConsultation(null);
    setDureeConsultationReelle(0);
  };

  // --- Priorité ---
  const ouvrirModalPriorite = () => {
    if (fileAttente.length === 0) return;
    setModalPriorite(true);
  };

  const validerPriorite = () => {
    if (!numeroPriorite.trim()) return alert("Entrez un numéro");
    const recherche = numeroPriorite.trim().toUpperCase();
    const index = fileAttente.findIndex((t) => t.number === recherche);
    if (index === -1) return alert("Ticket introuvable");
    alert("Fonction priorité non implémentée dans le contexte.");
    setNumeroPriorite("");
    setModalPriorite(false);
  };

  const formaterDuree = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- Rendu ---
  if (!agent || !counter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700">
            Aucun guichet assigné
          </h2>
          <p className="text-slate-500 mt-2">
            Veuillez contacter l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-100/30 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 bg-gradient-to-b from-emerald-500 to-emerald-700 rounded-full" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Console d'appel
              </h1>
              <p className="text-sm text-slate-500">
                Guichet {counter.name} — {counter.serviceName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2">
              <Users size={14} className="text-emerald-600" />
              <span className="text-sm font-semibold">{nbTraites} traités</span>
            </div>
            <div
              className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                counter.isActive
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {counter.isActive ? "Ouvert" : "Fermé"}
            </div>
            <button
              onClick={() => setSonActif(!sonActif)}
              className="p-2 rounded-full bg-white shadow-sm"
            >
              {sonActif ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Carte patient actuel */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-8">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-2">
                Patient actuel
              </p>
              <AnimatePresence mode="wait">
                {patientActuel ? (
                  <motion.div
                    key={patientActuel.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                      <div>
                        <span className="text-6xl font-black text-white">
                          {patientActuel.number}
                        </span>
                        <p className="text-white text-xl font-semibold mt-2">
                          {patientActuel.userName}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-white/15 rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-2 text-white/80 text-xs">
                            <Timer size={14} /> consultation
                          </div>
                          <span className="text-white text-xl font-mono">
                            {formaterDuree(dureeConsultationReelle ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-white/80 text-2xl font-medium">
                      Aucun patient
                    </p>
                    <p className="text-emerald-100 text-sm mt-1">
                      Appuyez sur « Suivant »
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Boutons d'action */}
            <div className="p-5 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-8 gap-3">
                <button
                  onClick={appelerSuivant}
                  disabled={!counter.isActive || fileAttente.length === 0}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Phone size={22} />
                  <span className="text-xs">Suivant</span>
                </button>

                <button
                  onClick={demarrerConsultation}
                  disabled={!patientActuel || consultationActive}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-blue-500 text-white shadow-md hover:bg-blue-600 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Play size={20} />
                  <span className="text-xs">Démarrer</span>
                </button>

                <button
                  onClick={rappeler}
                  disabled={!patientActuel}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-amber-500 text-white shadow-md hover:bg-amber-400 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <RotateCcw size={20} />
                  <span className="text-xs">Rappeler</span>
                </button>
                <button
                  onClick={marquerAbsent}
                  disabled={!patientActuel}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-rose-500 text-white shadow-md hover:bg-rose-600 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <UserX size={20} />
                  <span className="text-xs">Absent</span>
                </button>
                <button
                  onClick={terminerConsultation}
                  disabled={!patientActuel || !consultationActive}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <CheckCircle size={20} />
                  <span className="text-xs">Terminer</span>
                </button>
                <button
                  onClick={reporterFinFile}
                  disabled={!patientActuel}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-slate-500 text-white shadow-md hover:bg-slate-600 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <span className="text-lg font-bold">⟳</span>
                  <span className="text-xs">Fin file</span>
                </button>
                <button
                  onClick={ouvrirModalPriorite}
                  disabled={fileAttente.length === 0}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-purple-300 text-white shadow-md hover:bg-purple-400 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Star size={20} />
                  <span className="text-xs">Prioritaire</span>
                </button>
              </div>

              {/* Annonce vocale (animation) */}
              <AnimatePresence>
                {patientActuel && (
                  <motion.div
                    key={annonceKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-4"
                  >
                    <div className="p-2 bg-white rounded-full text-emerald-600">
                      <Volume2 size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-800 text-sm font-medium">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-700 text-xs mr-2">
                          ANNONCE VOCALE
                        </span>
                        Ticket <strong>{patientActuel.number}</strong>, veuillez
                        vous présenter au guichet{" "}
                        <strong>
                          {patientActuel.counterName || counter.name}
                        </strong>
                      </p>
                      <div className="w-full bg-emerald-200 rounded-full h-1 mt-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* File d'attente */}
        <div className="mb-7">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800">File d'attente</h3>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm font-semibold">
                {fileAttente.length} patient(s)
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto custom-scroll">
              {fileAttente.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle
                    className="mx-auto mb-2 text-emerald-500"
                    size={32}
                  />
                  <p>Aucun patient en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fileAttente.map((patient, idx) => (
                    <div
                      key={patient.id}
                      className={`flex justify-between items-center p-3 rounded-xl ${
                        idx === 0
                          ? "bg-emerald-50 border-l-4 border-emerald-500"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">
                              {patient.number}
                            </span>
                            <span className="text-slate-500 text-sm">
                              {patient.userName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <Clock size={12} />
                            <span>
                              attente estimée : {patient.waitTime ?? "?"} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton ouvrir/fermer le guichet (async) */}
        <button
          onClick={async () => await toggleCounter(!counter.isActive)}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${
            counter.isActive
              ? "bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {counter.isActive ? (
            <>
              <PhoneOff size={20} /> Fermer le guichet
            </>
          ) : (
            <>
              <Phone size={20} /> Ouvrir le guichet
            </>
          )}
        </button>
      </div>

      {/* Modal priorité */}
      {modalPriorite && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModalPriorite(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Star size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold">Passer en priorité</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Numéro du ticket (ex: C045)
            </p>
            <input
              type="text"
              value={numeroPriorite}
              onChange={(e) => setNumeroPriorite(e.target.value)}
              placeholder="C045"
              className="w-full px-4 py-3 border rounded-xl mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModalPriorite(false)}
                className="flex-1 py-2 border rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={validerPriorite}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
