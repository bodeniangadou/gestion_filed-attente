"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Users, Stethoscope, Siren, ScanLine, FlaskConical, Pill, HeartPulse, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { useApp, Service } from "@/lib/app-context"

const iconMap: Record<string, React.ReactNode> = {
  "stethoscope": <Stethoscope className="size-6" />,
  "siren": <Siren className="size-6" />,
  "scan": <ScanLine className="size-6" />,
  "flask": <FlaskConical className="size-6" />,
  "pill": <Pill className="size-6" />,
  "heart-pulse": <HeartPulse className="size-6" />,
}

interface ServicesViewProps {
  isAdmin?: boolean
}

export function ServicesView({ isAdmin = false }: ServicesViewProps) {
  const { services, user, takeTicket } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({ nom: "", prenom: "" })
  const [newTicket, setNewTicket] = useState<{ number: string; service: string } | null>(null)

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTakeTicket = (service: Service) => {
    setSelectedService(service)
    if (user && user.role === "patient") {
      // User is logged in, take ticket directly
      const ticket = takeTicket(service, user.name, user.firstName)
      setNewTicket({ number: ticket.number, service: service.name })
      setShowSuccessModal(true)
    } else {
      // Show form modal
      setShowTicketModal(true)
    }
  }

  const handleSubmitForm = () => {
    if (!selectedService || !formData.nom || !formData.prenom) return
    
    const ticket = takeTicket(selectedService, formData.nom, formData.prenom)
    setNewTicket({ number: ticket.number, service: selectedService.name })
    setShowTicketModal(false)
    setShowSuccessModal(true)
    setFormData({ nom: "", prenom: "" })
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Services</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Gérer les services hospitaliers" : "Choisissez un service pour prendre un ticket"}
              </p>
            </div>
            {isAdmin && (
              <Button className="gap-2 bg-emerald text-primary-foreground hover:bg-emerald/90">
                <Plus className="size-4" />
                Nouveau
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl bg-accent/50 pl-10"
            />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-4xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className="group cursor-pointer border border-border/50 transition-all hover:border-emerald hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-light text-emerald transition-colors group-hover:bg-emerald group-hover:text-primary-foreground">
                        {iconMap[service.icon] || <Stethoscope className="size-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                        
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3.5" />
                            <span>~{service.waitTime} min</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" />
                            <span>{service.currentQueue} en attente</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <Button 
                            onClick={() => handleTakeTicket(service)}
                            className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
                          />
                            Prendre un ticket
                          </Button>
                          {isAdmin && (
                            <Button variant="outline" size="icon">
                              <ScanLine className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredServices.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Aucun service trouvé</p>
            <p className="text-sm text-muted-foreground">Essayez avec d&apos;autres termes de recherche</p>
          </div>
        )}
      </div>

      {/* Ticket Form Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre un ticket</DialogTitle>
            <DialogDescription>
              Veuillez renseigner vos informations pour {selectedService?.name}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Prénom</FieldLabel>
              <Input
                placeholder="Votre prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Nom</FieldLabel>
              <Input
                placeholder="Votre nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </Field>
          </FieldGroup>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowTicketModal(false)}>
              Annuler
            </Button>
            <Button 
              className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
              onClick={handleSubmitForm}
              disabled={!formData.nom || !formData.prenom}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-emerald"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl text-primary-foreground"
            >
              ✓
            </motion.div>
          </motion.div>
          
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Ticket créé !</DialogTitle>
            <DialogDescription className="text-center">
              Votre ticket pour {newTicket?.service}
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 rounded-2xl bg-emerald-light p-6">
            <p className="text-sm text-emerald">Votre numéro</p>
            <p className="text-4xl font-bold text-emerald">{newTicket?.number}</p>
          </div>

          <Badge variant="secondary" className="mx-auto">
            Vous recevrez une notification quand ce sera votre tour
          </Badge>

          <Button 
            className="mt-6 w-full bg-emerald text-primary-foreground hover:bg-emerald/90"
            onClick={() => setShowSuccessModal(false)}
          >
            Suivre mon ticket
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
