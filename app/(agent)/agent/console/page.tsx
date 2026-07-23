"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, Ticket, Counter } from "@/lib/app-context";
import { Button } from "@/components/ui/button" 
import { toast } from "sonner";
import { sendCalledSms, sendAbsentSms, sendCompletedSms } from "@/lib/sms-confirmation";
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
  Play,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog" 
export default function Page() {
  const {
    tickets, getAgentCounter, getAgentQueue, callNextPatient, recallPatient,
    markAbsent, completeService, startConsultation, toggleCounter,
    requestCloseCounter, redirectPendingTicketsAndClose,
    cancelPendingTicketsAndClose, keepPendingTicketsAndClose,
  } = useApp();

  const counter = getAgentCounter();
  const fileAttente = getAgentQueue();

  const [patientActuel, setPatientActuel] = useState<Ticket | null>(null);
  const [sonActif, setSonActif] = useState(true);
  const [nbTraites, setNbTraites] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [consultationActive, setConsultationActive] = useState(false);
  const [debutConsultation, setDebutConsultation] = useState<number | null>(null);
  const [dureeConsultationReelle, setDureeConsultationReelle] = useState<number>(0);
  const [annonceKey, setAnnonceKey] = useState(0);

  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
  const [availableCounter, setAvailableCounter] = useState<Counter | null>(null);
  const [isCheckingCounters, setIsCheckingCounters] = useState(false);
  const [isProcessingClose, setIsProcessingClose] = useState(false);

  const syntheseVocale = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    syntheseVocale.current = utterance;
  }, []);

  useEffect(() => {
    if (!counter) {
      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
      return;
    }

    const ticketActif = tickets.find(
      (t) => t.counterId === counter.id && (t.statut === "called" || t.statut === "serving")
    );

    if (!ticketActif) {
      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
      return;
    }

    setPatientActuel(ticketActif);

    if (ticketActif.statut === "serving" && ticketActif.calledAt) {
      setConsultationActive(true);
      setDebutConsultation(ticketActif.calledAt.getTime());
    } else {
      setConsultationActive(false);
      setDebutConsultation(null);
    }
  }, [tickets, counter]);

  useEffect(() => {
    let intervalle: ReturnType<typeof setInterval> | undefined;
    if (consultationActive && debutConsultation) {
      setDureeConsultationReelle(
        Math.floor((Date.now() - debutConsultation) / 1000)
      );
      intervalle = setInterval(() => {
        setDureeConsultationReelle(
          Math.floor((Date.now() - debutConsultation) / 1000)
        );
      }, 1000);
    }
    return () => {
      if (intervalle) clearInterval(intervalle);
    };
  }, [consultationActive, debutConsultation]);

  const parler = (message: string) => {
    if (!sonActif) return;
    if (syntheseVocale.current) {
      syntheseVocale.current.text = message;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(syntheseVocale.current);
    }
  };

  const annoncerPatient = (ticket: Ticket) => {
    const phrase = `Ticket ${ticket.number}, veuillez vous présenter au guichet ${ticket.counterName || counter?.name || "disponible"}.`;
    parler(phrase);
  };

  const appelerSuivant = async () => {
    if (!counter?.isActive || fileAttente.length === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      const prochain = await callNextPatient();
      if (prochain) {
        setPatientActuel(prochain);
        setConsultationActive(false);
        setDebutConsultation(null);
        setDureeConsultationReelle(0);
        setAnnonceKey((k) => k + 1);
        annoncerPatient(prochain);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const demarrerConsultation = async () => {
    if (!patientActuel || consultationActive || actionLoading) return;
    setActionLoading(true);
    try {
      await startConsultation(patientActuel.id);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ FIX : on vérifie maintenant le booléen renvoyé par recallPatient.
  // Si l'écriture en base a échoué, on ne renvoie pas de SMS et on ne
  // fait pas croire à l'agent que le rappel a fonctionné (un toast
  // d'erreur est déjà déclenché côté app-context).
  const rappeler = async () => {
    if (!patientActuel || actionLoading) return;
    setActionLoading(true);
    try {
      const ok = await recallPatient(patientActuel.id);
      if (!ok) return;

      setAnnonceKey((k) => k + 1);
      annoncerPatient(patientActuel);

      if (patientActuel.phone) {
        const result = await sendCalledSms({
          id: patientActuel.id,
          number: patientActuel.number,
          phone: patientActuel.phone,
          userName: patientActuel.userName,
          counterName: patientActuel.counterName || counter?.name,
          service: patientActuel.service,
        });

        if (result) {
          toast.success("SMS de rappel renvoyé au patient.");
        } else {
          toast.error("Le SMS de rappel n'a pas pu être envoyé.");
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ FIX : idem, on vérifie le retour de markAbsent avant de vider
  // patientActuel et d'envoyer le SMS. Avant ce fix, si l'écriture Supabase
  // échouait, le patient disparaissait quand même de l'écran de l'agent
  // alors qu'il restait "en cours" côté base — c'était la cause probable
  // du bouton "Absent" qui "ne marchait pas toujours".
  const marquerAbsent = async () => {
    if (!patientActuel || actionLoading) return;
    if (confirm(`Absent·e : ${patientActuel.userName} ?`)) {
      setActionLoading(true);
      try {
        const patientAvantReset = patientActuel;
        const ok = await markAbsent(patientAvantReset.id);
        if (!ok) return;

        setPatientActuel(null);
        setConsultationActive(false);
        setDebutConsultation(null);

        if (patientAvantReset.phone) {
          const result = await sendAbsentSms({
            id: patientAvantReset.id,
            number: patientAvantReset.number,
            phone: patientAvantReset.phone,
            userName: patientAvantReset.userName,
            service: patientAvantReset.service,
          });

          if (!result) {
            toast.error("Le SMS d'absence n'a pas pu être envoyé.");
          }
        }
      } finally {
        setActionLoading(false);
      }
    }
  };

  // ✅ FIX : même logique pour "Terminer".
  const terminerConsultation = async () => {
    if (!patientActuel || !consultationActive || actionLoading) return;
    setActionLoading(true);
    try {
      const patientAvantReset = patientActuel;
      const ok = await completeService(patientAvantReset.id);
      if (!ok) return;

      setPatientActuel(null);
      setConsultationActive(false);
      setDebutConsultation(null);
      setNbTraites((n) => n + 1);

      if (!patientAvantReset.phone) {
        console.warn(`Pas de SMS "terminé" envoyé pour ticket ${patientAvantReset.number} : aucun numéro de téléphone enregistré.`);
      } else {
        const result = await sendCompletedSms({
          id: patientAvantReset.id,
          number: patientAvantReset.number,
          phone: patientAvantReset.phone,
          userName: patientAvantReset.userName,
          service: patientAvantReset.service,
        });

        if (!result) {
          toast.error("SMS de fin de consultation non envoyé.", { description: "Vérifiez la connexion à SMS Gateway." });
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleGuichet = async () => {
    if (!counter || actionLoading || isCheckingCounters) return;

    if (!counter.isActive) {
      setActionLoading(true);
      try {
        await toggleCounter(true);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setIsCheckingCounters(true);
    const result = await requestCloseCounter();
    setIsCheckingCounters(false);

    if (result.needsConfirmation) {
      setPendingTickets(result.pendingTickets);
      setAvailableCounter(result.availableCounter);
      setShowCloseDialog(true);
    }
  };

  const handleRedirectAndClose = async () => {
    if (!availableCounter) return;
    setIsProcessingClose(true);
    const ok = await redirectPendingTicketsAndClose(pendingTickets.map((t) => t.id), availableCounter.id);
    setIsProcessingClose(false);
    if (ok) setShowCloseDialog(false);
  };

  const handleCancelTicketsAndClose = async () => {
    setIsProcessingClose(true);
    const ok = await cancelPendingTicketsAndClose(pendingTickets.map((t) => t.id));
    setIsProcessingClose(false);
    if (ok) setShowCloseDialog(false);
  };

  const handleKeepWaitingAndClose = async () => {
    setShowCloseDialog(false);
    await keepPendingTicketsAndClose();
  };

  const handleStayOpen = () => {
    setShowCloseDialog(false);
    toast.info("Fermeture annulée.", { id: "counter-status" });
  };

  const formaterDuree = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTempsAttenteEstime = (idx: number) => (idx + 1) * 5;

  if (!counter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-100/30">
        <p className="text-slate-400">Chargement du guichet...</p>
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
                {counter.name} — {counter.serviceName}
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
                            {formaterDuree(dureeConsultationReelle)}
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

            <div className="p-5 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={appelerSuivant}
                  disabled={!counter.isActive || fileAttente.length === 0 || !!patientActuel || actionLoading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Phone size={22} />
                  <span className="text-xs">Suivant</span>
                </button>

                <button
                  onClick={demarrerConsultation}
                  disabled={!patientActuel || consultationActive || actionLoading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-blue-500 text-white shadow-md hover:bg-blue-600 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Play size={20} />
                  <span className="text-xs">Démarrer</span>
                </button>

                <button
  onClick={rappeler}
  disabled={!patientActuel || actionLoading || consultationActive}
  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-amber-500 text-white shadow-md hover:bg-amber-400 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
>
  <RotateCcw size={20} />
  <span className="text-xs">Rappeler</span>
</button>
                <button
                  onClick={marquerAbsent}
                  disabled={!patientActuel || actionLoading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-rose-500 text-white shadow-md hover:bg-rose-600 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <UserX size={20} />
                  <span className="text-xs">Absent</span>
                </button>
                <button
                  onClick={terminerConsultation}
                  disabled={!patientActuel || !consultationActive || actionLoading}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <CheckCircle size={20} />
                  <span className="text-xs">Terminer</span>
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
                        Ticket <strong>{patientActuel.number}</strong>, veuillez
                        vous présenter au guichet {counter.name}
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
                              attente estimée : {getTempsAttenteEstime(idx)} min
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
          onClick={handleToggleGuichet}
          disabled={actionLoading || isCheckingCounters}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${
            counter.isActive
              ? "bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          } disabled:opacity-60`}
        >
          {isCheckingCounters ? (
            <Loader2 size={20} className="animate-spin" />
          ) : counter.isActive ? (
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

     
     <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
  <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden gap-0">
    <div className="px-6 pt-7 pb-4 text-center border-b border-slate-100">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="size-6 text-amber-500" />
      </div>
      <DialogTitle className="text-lg font-bold text-slate-800">
        {pendingTickets.length} ticket{pendingTickets.length > 1 ? "s" : ""} en attente
      </DialogTitle>
      <DialogDescription className="text-sm text-slate-500 mt-1">
        Que souhaitez-vous faire avant de fermer votre guichet ?
      </DialogDescription>
    </div>

    <div className="p-5 space-y-2.5">
      <Button
        onClick={handleRedirectAndClose}
        disabled={isProcessingClose || !availableCounter}
        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 h-auto justify-start transition ${
          availableCounter
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
      >
        {isProcessingClose ? <Loader2 className="size-4 animate-spin shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
        <div className="text-left">
          <p className="text-sm font-semibold">{availableCounter ? `Rediriger vers guichet ${availableCounter.number}` : "Aucun guichet disponible"}</p>
          <p className="text-xs opacity-80 font-normal">Les patients gardent leur place</p>
        </div>
      </Button>

      <Button
        onClick={handleKeepWaitingAndClose}
        disabled={isProcessingClose}
        variant="outline"
        className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 h-auto justify-start"
      >
        <Info className="size-4 shrink-0 text-slate-500" />
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-800">Conserver les tickets</p>
          <p className="text-xs text-slate-500 font-normal">Un autre agent prendra le relais</p>
        </div>
      </Button>

      <Button
        onClick={handleCancelTicketsAndClose}
        disabled={isProcessingClose}
        variant="outline"
        className="w-full flex items-center gap-3 rounded-xl border-2 border-rose-200 px-4 py-3 h-auto justify-start text-rose-600 hover:bg-rose-50"
      >
        {isProcessingClose ? <Loader2 className="size-4 animate-spin shrink-0" /> : <UserX className="size-4 shrink-0" />}
        <div className="text-left">
          <p className="text-sm font-semibold">Annuler les tickets</p>
          <p className="text-xs opacity-80 font-normal">Les patients devront se réinscrire</p>
        </div>
      </Button>

      <Button
        onClick={handleStayOpen}
        disabled={isProcessingClose}
        variant="ghost"
        className="w-full text-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600"
      >
        Rester ouvert et gérer les tickets
      </Button>
    </div>
  </DialogContent>
</Dialog>

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