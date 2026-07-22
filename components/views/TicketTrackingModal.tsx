import React, { useEffect, useRef } from 'react'
import {
  X, CheckCircle2, MessageSquare,
  MapPin, Clock, AlertCircle, Trash2, Activity, Ban, XCircle
} from 'lucide-react'

interface TicketTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: {
    number: string
    service: string
    waitTime: number
    queuePos: number
    totalInQueue?: number
    statut?: string
    isYourTurn?: boolean
    counterName?: string
    phoneNumber?: string
  } | null
  onCancelTicket: () => void
}

export const TicketTrackingModal: React.FC<TicketTrackingModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onCancelTicket
}) => {
  const prevStatutRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!ticket) return
    const prev = prevStatutRef.current
    const nowCalled = ticket.statut === "called"

    if (nowCalled && prev !== "called") {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300])
      }

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx()
        const playBeep = (delay: number) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 880
          osc.type = "sine"
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4)
          osc.start(ctx.currentTime + delay)
          osc.stop(ctx.currentTime + delay + 0.4)
        }
        playBeep(0)
        playBeep(0.5)
        playBeep(1)
      } catch (e) {
        console.warn("Alerte sonore indisponible:", e)
      }
    }

    prevStatutRef.current = ticket.statut
  }, [ticket?.statut])

  if (!isOpen || !ticket) return null

  const isCalled = ticket.isYourTurn ?? (ticket.statut === "called" || ticket.statut === "serving")
  const isCompleted = ticket.statut === "completed"
  const isAbsent = ticket.statut === "absent"
  const isCancelled = ticket.statut === "cancelled"
  const isClosed = isCompleted || isCancelled 

  const guichet = ticket.counterName || "Guichet à confirmer"
  const displayPhone = ticket.phoneNumber || "+223 XX XX XX XX"
  const peopleAhead = Math.max(0, (ticket.queuePos || 1) - 1)

  const progress = isClosed
    ? 100
    : isCalled
      ? 100
      : ticket.totalInQueue && ticket.totalInQueue > 0
        ? Math.max(5, Math.min(95, Math.round(((ticket.totalInQueue - (ticket.queuePos || 1) + 1) / ticket.totalInQueue) * 100)))
        : Math.max(15, Math.min(95, 100 - (ticket.queuePos || 1) * 10))

  let badgeText = "Ticket Actif & Validé"
  let badgeIcon = <CheckCircle2 className="size-4" />
  let badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  let progressBarClass = "bg-emerald-500"
  let headerBg = "bg-emerald-500"

  let positionMessage = peopleAhead === 0
    ? "Vous êtes le prochain à être appelé"
    : `${peopleAhead} ${peopleAhead > 1 ? 'personnes attendent' : 'personne attend'} avant vous`

  if (isCalled) {
    badgeText = "C'est votre tour !"
    positionMessage = "Présentez-vous au guichet"
  } else if (isAbsent) {
    badgeText = "Marqué absent"
    badgeIcon = <AlertCircle className="size-4" />
    badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    progressBarClass = "bg-amber-500"
    headerBg = "bg-amber-500"
    positionMessage = "Vous ne vous êtes pas présenté à temps"
  } else if (isCompleted) {
    badgeText = "Consultation terminée"
    badgeIcon = <CheckCircle2 className="size-4" />
    badgeClass = "bg-slate-500/10 text-slate-500 dark:text-slate-400"
    progressBarClass = "bg-slate-400"
    headerBg = "bg-slate-500"
    positionMessage = "Merci, votre passage est clôturé"
  } else if (isCancelled) {
    badgeText = "Ticket annulé"
    badgeIcon = <XCircle className="size-4" />
    badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    progressBarClass = "bg-rose-400"
    headerBg = "bg-rose-500"
    positionMessage = "Ce ticket n'est plus valide"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">

      {/* CARD PRINCIPALE */}
      <div className="relative w-full max-w-4xl bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-[24px] shadow-2xl border border-border overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 max-h-[95vh] flex flex-col">

        {/* EN-TÊTE MODAL */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-card border-b border-border/60 shrink-0">
          <div>
            <h2 className="font-bold text-lg sm:text-xl text-foreground tracking-tight">Suivi de mon ticket en direct</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">Votre position dans la file en temps réel</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground border border-border/50 shrink-0">
            <X className="size-5" />
          </button>
        </div>

        {/* CONTENU EN DEUX COLONNES */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto flex-1">

          {/* COLONNE GAUCHE (7/12) */}
          <div className="md:col-span-7 space-y-4 sm:space-y-6">

            <div className={`${headerBg} text-white p-4 sm:p-6 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-500`}>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Service</span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">{ticket.service}</h3>
                {!isClosed && (
                  <div className="flex items-center gap-2 text-sm font-bold pt-1">
                    <MapPin className="size-4 shrink-0 text-white/70" />
                    <span>{guichet}</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white/10 rounded-xl hidden sm:block">
                <Activity className={`size-10 text-white ${isCalled ? "animate-pulse" : ""}`} />
              </div>
            </div>

            {/* BLOCK CENTRAL : LE NUMÉRO */}
            <div className={`bg-card border rounded-2xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-sm relative ${isCalled ? "border-emerald-400 ring-2 ring-emerald-400/40" : "border-border"}`}>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Votre Numéro de Passage
              </span>
              <h1 className={`text-5xl sm:text-7xl font-black tracking-tighter my-2 ${isClosed ? "text-slate-400" : "text-emerald-500"} ${isCalled ? "animate-pulse" : ""}`}>
                {ticket.number}
              </h1>
              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${badgeClass}`}>
                {badgeIcon}
                {badgeText}
              </div>

              {!isClosed && (
                <div className="space-y-2 pt-4 border-t border-border text-left">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Avancement de la file</span>
                    <span className="text-sm font-black" style={{ color: "inherit" }}>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                    <div className={`h-full ${progressBarClass} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (5/12) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">

            {!isClosed && (
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`size-14 sm:size-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${isAbsent ? "border-amber-500 bg-amber-500/5" : "border-emerald-500 bg-emerald-500/5"}`}>
                    <span className={`text-xl sm:text-2xl font-black leading-none ${isAbsent ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{ticket.queuePos}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Rang</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm sm:text-base text-foreground">
                      {positionMessage}
                    </p>
                    {!isAbsent && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-4 text-amber-500 shrink-0" />
                        <span className="text-foreground font-semibold">~ {ticket.waitTime} min d'attente</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl text-xs font-medium flex gap-2.5 items-start ${isAbsent ? "bg-rose-500/5 border border-rose-500/20" : "bg-amber-500/5 border border-amber-500/20"}`}>
                  <AlertCircle className={`size-4 shrink-0 mt-0.5 ${isAbsent ? "text-rose-500" : "text-amber-500"}`} />
                  <p>
                    {isAbsent
                      ? <>Présentez-vous rapidement au <span className="font-bold text-foreground">{guichet}</span> ou reprenez un nouveau ticket.</>
                      : <>Dès que votre tour approche, veuillez vous diriger vers le <span className="font-bold text-emerald-600 dark:text-emerald-400">{guichet}</span>.</>
                    }
                  </p>
                </div>
              </div>
            )}

            {isClosed && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center space-y-2">
                {isCompleted ? (
                  <CheckCircle2 className="size-8 mx-auto text-slate-400" />
                ) : (
                  <Ban className="size-8 mx-auto text-rose-400" />
                )}
                <p className="text-sm text-muted-foreground font-medium">
                  {isCompleted ? "Ce ticket a été traité avec succès." : "Ce ticket a été annulé."}
                </p>
              </div>
            )}

            {/* NOTIFICATION SMS */}
            {!isClosed && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 sm:p-3.5 shadow-sm">
                  <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                    <MessageSquare className="size-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Notification active</p>
                    <p className="text-muted-foreground">
                      Vous recevrez une notification SMS automatique sur votre numéro : <span className="font-bold text-foreground">{displayPhone}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BOUTON D'ANNULATION — désactivé si le ticket est déjà clos */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (isClosed) return
                  onCancelTicket()
                }}
                disabled={isClosed}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isClosed
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30"
                }`}
              >
                <Trash2 className="size-4" />
                {isClosed ? "Ticket clôturé" : "Annuler mon ticket"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}