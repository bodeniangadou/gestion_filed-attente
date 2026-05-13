"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, PhoneOff, RotateCcw, UserX, Volume2, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/app-context"

interface QueueTicket {
  id: string
  number: string
  name: string
  waitTime: number
  status: "waiting" | "called" | "serving"
}

const mockQueue: QueueTicket[] = [
  { id: "1", number: "C045", name: "Aminata Keita", waitTime: 12, status: "waiting" },
  { id: "2", number: "C046", name: "Ibrahim Traoré", waitTime: 8, status: "waiting" },
  { id: "3", number: "C047", name: "Fatou Diallo", waitTime: 5, status: "waiting" },
  { id: "4", number: "C048", name: "Moussa Konaté", waitTime: 3, status: "waiting" },
  { id: "5", number: "C049", name: "Mariam Coulibaly", waitTime: 1, status: "waiting" },
]

export function AgentConsoleView() {
  const { user } = useApp()
  const [currentPatient, setCurrentPatient] = useState<QueueTicket | null>(null)
  const [queue, setQueue] = useState<QueueTicket[]>(mockQueue)
  const [isCounterOpen, setIsCounterOpen] = useState(true)

  const handleCallNext = () => {
    if (queue.length > 0) {
      const next = queue[0]
      setCurrentPatient({ ...next, status: "called" })
      setQueue(queue.slice(1))
    }
  }

  const handleRecall = () => {
    if (currentPatient) {
      // Simulate recall animation
      setCurrentPatient({ ...currentPatient, status: "called" })
    }
  }

  const handleMarkAbsent = () => {
    setCurrentPatient(null)
  }

  const handleComplete = () => {
    setCurrentPatient(null)
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Console d&apos;Appel</h1>
            <p className="text-sm text-muted-foreground">Guichet A1 - Consultation Générale</p>
          </div>
          <Badge 
            className={isCounterOpen 
              ? "bg-emerald text-primary-foreground" 
              : "bg-red-500 text-white"
            }
          >
            {isCounterOpen ? "Ouvert" : "Fermé"}
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Current Patient Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6 overflow-hidden border-0 shadow-xl">
            <div className="bg-emerald p-6 text-primary-foreground">
              <p className="text-sm text-white/80">Patient actuel</p>
              <AnimatePresence mode="wait">
                {currentPatient ? (
                  <motion.div
                    key={currentPatient.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <p className="text-5xl font-bold">{currentPatient.number}</p>
                    <p className="mt-2 text-lg">{currentPatient.name}</p>
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl font-medium text-white/60"
                  >
                    Aucun patient
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <CardContent className="p-6">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button
                  onClick={handleCallNext}
                  disabled={!isCounterOpen || queue.length === 0}
                  className="h-16 flex-col gap-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
                >
                  <Phone className="size-6" />
                  <span className="text-xs">Suivant</span>
                </Button>

                <Button
                  onClick={handleRecall}
                  disabled={!currentPatient}
                  variant="outline"
                  className="h-16 flex-col gap-1 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                >
                  <RotateCcw className="size-6" />
                  <span className="text-xs">Rappeler</span>
                </Button>

                <Button
                  onClick={handleMarkAbsent}
                  disabled={!currentPatient}
                  variant="outline"
                  className="h-16 flex-col gap-1 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <UserX className="size-6" />
                  <span className="text-xs">Absent</span>
                </Button>

                <Button
                  onClick={handleComplete}
                  disabled={!currentPatient}
                  variant="outline"
                  className="h-16 flex-col gap-1 border-2 border-emerald text-emerald hover:bg-emerald hover:text-primary-foreground"
                >
                  <CheckCircle className="size-6" />
                  <span className="text-xs">Terminer</span>
                </Button>
              </div>

              {/* Voice Announcement */}
              {currentPatient && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-light p-4"
                >
                  <Volume2 className="size-5 text-emerald" />
                  <p className="text-sm text-emerald">
                    Annonce vocale : &quot;Ticket {currentPatient.number}, veuillez vous présenter au Guichet A1&quot;
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Queue Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">File d&apos;attente</h3>
                <Badge variant="secondary">{queue.length} patients</Badge>
              </div>

              {queue.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="mx-auto mb-2 size-12 text-emerald" />
                  <p>Aucun patient en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.slice(0, 5).map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between rounded-xl p-3 ${
                        index === 0 ? "bg-emerald-light" : "bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 items-center justify-center rounded-full font-bold ${
                          index === 0 ? "bg-emerald text-primary-foreground" : "bg-accent text-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{ticket.number}</p>
                          <p className="text-sm text-muted-foreground">{ticket.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{ticket.waitTime} min</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Counter Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Button
            onClick={() => setIsCounterOpen(!isCounterOpen)}
            variant="outline"
            className={`w-full h-14 gap-3 text-lg ${
              isCounterOpen 
                ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white" 
                : "border-emerald text-emerald hover:bg-emerald hover:text-primary-foreground"
            }`}
          >
            {isCounterOpen ? (
              <>
                <PhoneOff className="size-5" />
                Fermer le guichet
              </>
            ) : (
              <>
                <Phone className="size-5" />
                Ouvrir le guichet
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
