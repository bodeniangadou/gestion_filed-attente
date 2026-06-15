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

const ticketsSimules = [
  {
    id: "1",
    numero: "C045",
    nom: "Aminata Keita",
    tempsAttenteEstime: 12,
    arrivee: Date.now() - 1000 * 60 * 14,
    prioritaire: false,
  },
  {
    id: "2",
    numero: "C046",
    nom: "Ibrahim Traoré",
    tempsAttenteEstime: 8,
    arrivee: Date.now() - 1000 * 60 * 9,
    prioritaire: false,
  },
  {
    id: "3",
    numero: "C047",
    nom: "Fatou Diallo",
    tempsAttenteEstime: 5,
    arrivee: Date.now() - 1000 * 60 * 6,
    prioritaire: false,
  },
  {
    id: "4",
    numero: "C048",
    nom: "Moussa Konaté",
    tempsAttenteEstime: 3,
    arrivee: Date.now() - 1000 * 60 * 4,
    prioritaire: false,
  },
  {
    id: "5",
    numero: "C049",
    nom: "Mariam Coulibaly",
    tempsAttenteEstime: 1,
    arrivee: Date.now() - 1000 * 60 * 2,
    prioritaire: false,
  },
];

export default function ConsoleAppel() {
  const [patientActuel, setPatientActuel] = useState(null);
  const [fileAttente, setFileAttente] = useState(ticketsSimules);
  const [guichetOuvert, setGuichetOuvert] = useState(true);
  const [sonActif, setSonActif] = useState(true);
  const [nbTraites, setNbTraites] = useState(0);

  const [consultationActive, setConsultationActive] = useState(false);
  const [debutConsultation, setDebutConsultation] = useState(null);
  const [dureeConsultationReelle, setDureeConsultationReelle] = useState(0);

  const [modalPriorite, setModalPriorite] = useState(false);
  const [numeroPriorite, setNumeroPriorite] = useState("");
  const [annonceKey, setAnnonceKey] = useState(0);

  const syntheseVocale = useRef(null);

  useEffect(() => {
    syntheseVocale.current = new SpeechSynthesisUtterance();
    syntheseVocale.current.lang = "fr-FR";
    syntheseVocale.current.rate = 0.9;
  }, []);

  useEffect(() => {
    let intervalle;
    if (consultationActive && debutConsultation) {
      intervalle = setInterval(() => {
        setDureeConsultationReelle(
          Math.floor((Date.now() - debutConsultation) / 1000),
        );
      }, 1000);
    }
    return () => clearInterval(intervalle);
  }, [consultationActive, debutConsultation]);

  const parler = (message) => {
    if (!sonActif) return;
    if (syntheseVocale.current) {
      syntheseVocale.current.text = message;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(syntheseVocale.current);
    }
  };

  const annoncerPatient = (ticket) => {
    const phrase = `Ticket ${ticket.numero}, veuillez vous présenter au guichet A1.`;
    parler(phrase);
  };

  const appelerSuivant = () => {
    if (!guichetOuvert || fileAttente.length === 0) return;
    const prochain = fileAttente[0];
    setPatientActuel(prochain);
    setFileAttente(fileAttente.slice(1));
    setConsultationActive(false);
    setDebutConsultation(null);
    setDureeConsultationReelle(0);
    setAnnonceKey(annonceKey + 1);
    annoncerPatient(prochain);
  };

  const demarrerConsultation = () => {
    if (!patientActuel || consultationActive) return;
    setConsultationActive(true);
    setDebutConsultation(Date.now());
    setDureeConsultationReelle(0);
  };

  const rappeler = () => {
    if (!patientActuel) return;
    setAnnonceKey(annonceKey + 1);
    annoncerPatient(patientActuel);
  };

  const marquerAbsent = () => {
    if (!patientActuel) return;
    if (confirm(`Absent·e : ${patientActuel.nom} ?`)) {
      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
    }
  };

  const terminerConsultation = () => {
    if (!patientActuel || !consultationActive) return;
    setPatientActuel(null);
    setConsultationActive(false);
    setDebutConsultation(null);
    setNbTraites(nbTraites + 1);
  };

  const reporterFinFile = () => {
    if (!patientActuel) return;
    const repousse = {
      ...patientActuel,
      arrivee: Date.now(),
      prioritaire: false,
    };
    setFileAttente([...fileAttente, repousse]);
    setPatientActuel(null);
    setConsultationActive(false);
    setDebutConsultation(null);
  };

  const ouvrirModalPriorite = () => {
    if (fileAttente.length === 0) return;
    setModalPriorite(true);
  };

  const validerPriorite = () => {
    if (!numeroPriorite.trim()) return alert("Entrez un numéro");
    const recherche = numeroPriorite.trim().toUpperCase();
    const index = fileAttente.findIndex((t) => t.numero === recherche);
    if (index === -1) return alert("Ticket introuvable");
    const prioritaire = { ...fileAttente[index], prioritaire: true };
    const nouvelleFile = [
      prioritaire,
      ...fileAttente.slice(0, index),
      ...fileAttente.slice(index + 1),
    ];
    setFileAttente(nouvelleFile);
    setNumeroPriorite("");
    setModalPriorite(false);
  };

  const formaterDuree = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
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
                Guichet A1 — Consultation générale
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
                guichetOuvert
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {guichetOuvert ? "Ouvert" : "Fermé"}
            </div>
            <button
              onClick={() => setSonActif(!sonActif)}
              className="p-2 rounded-full bg-white shadow-sm"
            >
              {sonActif ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

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
                          {patientActuel.numero}
                        </span>
                        <p className="text-white text-xl font-semibold mt-2">
                          {patientActuel.nom}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-white/15 rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-2 text-white/80 text-xs">
                            <Timer size={14} /> consultation
                          </div>
                          <span className="text-white text-xl font-mono">
                            {formaterDuree(dureeConsultationReelle)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-white/80 text-2xl font-medium">
                      ✨ Aucun patient
                    </p>
                    <p className="text-emerald-100 text-sm mt-1">
                      Appuyez sur « Suivant »
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                <button
                  onClick={appelerSuivant}
                  disabled={!guichetOuvert || fileAttente.length === 0}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Phone size={22} />
                  <span className="text-xs">Suivant</span>
                </button>
                <button
                  onClick={demarrerConsultation}
                  disabled={!patientActuel || consultationActive}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-teal-500 text-white shadow-md hover:bg-teal-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
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
                        Ticket <strong>{patientActuel.numero}</strong>, veuillez
                        vous présenter au guichet A1
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
                          ? patient.prioritaire
                            ? "bg-purple-50 border-l-4 border-purple-500"
                            : "bg-emerald-50 border-l-4 border-emerald-500"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0
                              ? patient.prioritaire
                                ? "bg-purple-500 text-white"
                                : "bg-emerald-500 text-white"
                              : "bg-slate-100"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">
                              {patient.numero}
                            </span>
                            <span className="text-slate-500 text-sm">
                              {patient.nom}
                            </span>
                            {patient.prioritaire && (
                              <span className="text-purple-600 text-xs bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star size={10} /> Prioritaire
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <Clock size={12} />
                            <span>
                              attente estimée : {patient.tempsAttenteEstime} min
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

        <button
          onClick={() => setGuichetOuvert(!guichetOuvert)}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${
            guichetOuvert
              ? "bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {guichetOuvert ? (
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
