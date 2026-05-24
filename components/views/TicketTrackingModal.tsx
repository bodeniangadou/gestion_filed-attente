import React from 'react'
import { 
  X, CheckCircle2, MessageSquare, QrCode, 
  MapPin, Clock, AlertCircle, Trash2, Activity 
} from 'lucide-react'

interface TicketTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: { 
    number: string; 
    service: string; 
    waitTime: number; 
    queuePos: number;
    guichet?: string;     
    phoneNumber?: string; 
  } | null
  onCancelTicket: () => void 
}

export const TicketTrackingModal: React.FC<TicketTrackingModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onCancelTicket
}) => {
  if (!isOpen || !ticket) return null

  const guichet = ticket.guichet || "Guichet 3"
  const displayPhone = ticket.phoneNumber || "+223 XX XX XX XX"
  
  const progress = Math.max(15, Math.min(90, 100 - (ticket.queuePos * 10)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      
      {/* CARD PRINCIPALE */}
      <div className="relative w-full max-w-4xl bg-slate-50 dark:bg-slate-900 rounded-[24px] shadow-2xl border border-border overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* EN-TÊTE MODAL */}
        <div className="flex items-center justify-between px-6 py-5 bg-card border-b border-border/60">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-bold text-xl text-foreground tracking-tight">Suivi de mon ticket en direct</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Votre position dans la file en temps réel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground border border-border/50">
            <X className="size-5" />
          </button>
        </div>

        {/* CONTENU EN DEUX COLONNES */}
        <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[calc(100vh-140px)] overflow-y-auto">
          
          {/* COLONNE GAUCHE (7/12) : SERVICE, NUMÉRO & PROGRESSION */}
          <div className="md:col-span-7 space-y-6">
            
            {/* EN-TÊTE DU PASSAGE (Service & Guichet) */}
            <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Service</span>
                <h3 className="text-2xl font-black tracking-tight">{ticket.service}</h3>
                <div className="flex items-center gap-2 text-sm font-bold pt-1">
                  <MapPin className="size-4 shrink-0 text-emerald-100" />
                  <span>{guichet}</span>
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl hidden sm:block">
                <Activity className="size-10 text-white" />
              </div>
            </div>

            {/* BLOCK CENTRAL : LE NUMÉRO */}
            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-sm relative">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Votre Numéro de Passage
              </span>
              <h1 className="text-7xl font-black text-emerald-500 tracking-tighter my-2">
                {ticket.number}
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold">
                <CheckCircle2 className="size-4" />
                Ticket Actif & Validé
              </div>

              {/* JAUGE DE PROGRESSION */}
              <div className="space-y-2 pt-4 border-t border-border text-left">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Avancement de la file</span>
                  <span className="text-emerald-500 text-sm font-black">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE (5/12) : RANG, SMS & ANNULATION */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* COMPTEUR DE RANG */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl border-2 border-emerald-500 flex flex-col items-center justify-center shrink-0 bg-emerald-500/5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{ticket.queuePos}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Rang</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-base text-foreground">
                    {ticket.queuePos} {ticket.queuePos > 1 ? 'personnes attendent' : 'personne attend'} avant vous
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-4 text-amber-500 shrink-0" />
                    <span className="text-foreground font-semibold">~ {ticket.waitTime} min d'attente</span>
                  </div>
                </div>
              </div>

              {/* CONSIGNE DIRECTE */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-foreground rounded-xl text-xs font-medium flex gap-2.5 items-start">
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Dès que votre tour approche, veuillez vous diriger vers le <span className="font-bold text-emerald-600 dark:text-emerald-400">{guichet}</span>.
                </p>
              </div>
            </div>

            {/* NOTIFICATION SMS */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 shadow-sm">
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

            {/* BOUTON D'ANNULATION NET ET PRÉCIS */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if(confirm("Voulez-vous vraiment annuler votre ticket ? Cette action est définitive.")) {
                    onCancelTicket()
                  }
                }}
                className="w-full py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="size-4" />
                Annuler mon ticket
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}