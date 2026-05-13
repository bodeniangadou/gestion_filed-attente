"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Ticket,
  Stethoscope,
  Siren,
  ScanLine,
  FlaskConical,
  Pill,
  HeartPulse,
} from "lucide-react"
import { useApp, Service } from "@/lib/app-context"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"

interface TicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const serviceIcons: Record<string, React.ReactNode> = {
  "stethoscope": <Stethoscope className="size-5" />,
  "siren": <Siren className="size-5" />,
  "scan": <ScanLine className="size-5" />,
  "flask": <FlaskConical className="size-5" />,
  "pill": <Pill className="size-5" />,
  "heart-pulse": <HeartPulse className="size-5" />,
}

type Step = "service" | "info" | "success"

export function TicketModal({ open, onOpenChange, onSuccess }: TicketModalProps) {
  const { services, user, takeTicket, currentTicket } = useApp()
  const [step, setStep] = useState<Step>("service")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    if (user) {
      // If user is already logged in, skip to confirmation
      handleTakeTicket(service, user.firstName, user.name)
    } else {
      setStep("info")
    }
  }

  const handleTakeTicket = (service: Service, fName: string, lName: string) => {
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      takeTicket(service, lName, fName)
      setStep("success")
      setIsSubmitting(false)
    }, 1000)
  }

  const handleSubmitInfo = () => {
    if (!selectedService || !firstName.trim() || !lastName.trim()) return
    handleTakeTicket(selectedService, firstName, lastName)
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => {
      setStep("service")
      setSelectedService(null)
      setFirstName(user?.firstName || "")
      setLastName(user?.name || "")
    }, 300)
  }

  const handleViewTicket = () => {
    handleClose()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="size-5 text-primary" />
                  Prendre un Ticket
                </DialogTitle>
                <DialogDescription>
                  Sélectionnez le service pour lequel vous souhaitez prendre un ticket
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-md"
                    onClick={() => handleSelectService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {serviceIcons[service.icon] || <Building2 className="size-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="size-3" />
                              <span>{service.currentQueue} en attente</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="size-3" />
                              <span>~{service.waitTime} min</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {step === "info" && selectedService && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="size-5 text-primary" />
                  Vos Informations
                </DialogTitle>
                <DialogDescription>
                  Entrez vos informations pour recevoir votre ticket
                </DialogDescription>
              </DialogHeader>

              {/* Selected Service Summary */}
              <Card className="mt-4 border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      {serviceIcons[selectedService.icon] || <Building2 className="size-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedService.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService.currentQueue} personnes en attente
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form */}
              <FieldGroup className="mt-6">
                <Field>
                  <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="Entrez votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Nom</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="Entrez votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </Field>
              </FieldGroup>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("service")}
                  className="flex-1 h-12 rounded-xl"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmitInfo}
                  disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-primary"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                      Création...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && currentTicket && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10"
              >
                <CheckCircle2 className="size-10 text-primary" />
              </motion.div>

              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl">Ticket Créé !</DialogTitle>
                <DialogDescription>
                  Votre ticket a été créé avec succès
                </DialogDescription>
              </DialogHeader>

              {/* Ticket Card */}
              <Card className="mt-6 overflow-hidden border-2 border-primary/30">
                <div className="bg-primary px-4 py-3 text-primary-foreground">
                  <p className="text-sm font-medium">Hôpital du Mali</p>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Badge variant="outline" className="mb-2">
                      {currentTicket.service.name}
                    </Badge>
                    <p className="text-5xl font-bold text-primary">{currentTicket.number}</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{currentTicket.position}</p>
                      <p>Position</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">~{currentTicket.service.waitTime}</p>
                      <p>Minutes</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    {currentTicket.userName}
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={handleViewTicket}
                className="mt-6 h-12 w-full rounded-xl bg-primary"
              >
                Suivre mon Ticket
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
