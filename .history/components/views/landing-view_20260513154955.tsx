"use client"

import { motion } from "framer-motion"
import { 
  Search, 
  QrCode, 
  Building2, 
  Clock, 
  Users, 
  CheckCircle2,
  Smartphone,
  Bell,
  Shield,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Siren,
  ScanLine,
  FlaskConical,
  Pill,
  HeartPulse,
  ArrowRight,
  Star,
  LogIn,
  Menu,
  X,
  UserPlus
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/app-context"
import { useState } from "react"

interface LandingViewProps {
  onNavigate: (tab: string) => void
  onScanQR: () => void
  onTakeTicket: () => void
  onLogin: () => void
}

const serviceIcons: Record<string, React.ReactNode> = {
  "stethoscope": <Stethoscope className="size-5" />,
  "siren": <Siren className="size-5" />,
  "scan": <ScanLine className="size-5" />,
  "flask": <FlaskConical className="size-5" />,
  "pill": <Pill className="size-5" />,
  "heart-pulse": <HeartPulse className="size-5" />,
}

const features = [
  {
    icon: <Smartphone className="size-6" />,
    title: "Prise de ticket en ligne",
    description: "Plus besoin de faire la queue physiquement. Prenez votre ticket depuis votre téléphone."
  },
  {
    icon: <Bell className="size-6" />,
    title: "Notifications en temps réel",
    description: "Recevez une alerte quand votre tour approche. Ne manquez plus jamais votre appel."
  },
  {
    icon: <Clock className="size-6" />,
    title: "Estimation du temps d'attente",
    description: "Consultez le temps d'attente estimé et planifiez votre visite en conséquence."
  },
  {
    icon: <Shield className="size-6" />,
    title: "Sécurité et confidentialité",
    description: "Vos données sont protégées et traitées avec la plus grande confidentialité."
  }
]

const testimonials = [
  {
    name: "Aminata D.",
    text: "Grâce à Rang+, je n'ai plus besoin d'arriver à 6h du matin. Je prends mon ticket depuis chez moi !",
    rating: 5
  },
  {
    name: "Oumar T.",
    text: "Application très pratique. Je suis notifié quand mon tour approche, c'est révolutionnaire.",
    rating: 5
  },
  {
    name: "Fatoumata K.",
    text: "Le suivi en temps réel me permet de mieux gérer mon temps. Merci Rang+ !",
    rating: 5
  }
]

export function LandingView({ onNavigate, onScanQR, onTakeTicket, onLogin }: LandingViewProps) {
  const { services } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const totalWaiting = services.reduce((acc, s) => acc + s.currentQueue, 0)
  const avgWaitTime = Math.round(services.reduce((acc, s) => acc + s.waitTime, 0) / services.length)

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          {/* Logo */}
         

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => onNavigate("services")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </button>
            <button 
              onClick={onTakeTicket}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Prendre un ticket
            </button>
            <button 
              onClick={onScanQR}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Scanner QR
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById("contact-section")
                element?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onLogin}
              className="gap-2 text-sm font-medium"
            >
              <LogIn className="size-4" />
              Connexion
            </Button>
            <Button 
              onClick={onLogin}
              className="gap-2 rounded-xl"
            >
              <UserPlus className="size-4" />
              Inscription
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center size-10 rounded-xl hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col p-4 gap-2">
              <button 
                onClick={() => { onNavigate("services"); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
              >
                <Stethoscope className="size-5 text-primary" />
                Services
              </button>
              <button 
                onClick={() => { onTakeTicket(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
              >
                <CheckCircle2 className="size-5 text-primary" />
                Prendre un ticket
              </button>
              <button 
                onClick={() => { onScanQR(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left font-medium hover:bg-muted transition-colors"
              >
                <QrCode className="size-5 text-primary" />
                Scanner QR Code
              </button>
              <div className="border-t border-border my-2" />
              <Button 
                variant="outline" 
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="w-full gap-2 justify-center h-12 rounded-xl"
              >
                <LogIn className="size-4" />
                Connexion
              </Button>
              <Button 
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="w-full gap-2 justify-center h-12 rounded-xl"
              >
                <UserPlus className="size-4" />
                Inscription
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-6 py-16 lg:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 flex flex-col items-center"
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
                Plateforme officielle de gestion des files d&apos;attente
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-6xl text-balance"
            >
              Bienvenue à l&apos;
              <span className="text-primary">Hôpital du Mali</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 text-lg text-muted-foreground lg:text-xl text-pretty max-w-2xl mx-auto"
            >
              Avec <span className="font-semibold text-primary">Rang+</span>, prenez votre ticket en ligne 
              et suivez votre position dans la file d&apos;attente en temps réel. 
              Fini les longues heures d&apos;attente inutiles !
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button 
                size="lg"
                onClick={onTakeTicket}
                className="h-14 px-8 gap-3 rounded-2xl bg-primary text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all w-full sm:w-auto"
              >
                <CheckCircle2 className="size-5" />
                Prendre un Ticket
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={onScanQR}
                className="h-14 px-8 gap-3 rounded-2xl border-2 text-lg font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all w-full sm:w-auto"
              >
                <QrCode className="size-5" />
                Scanner QR Code
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="px-6 -mt-4 lg:mt-0">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalWaiting}</p>
                  <p className="text-sm text-muted-foreground">Patients en attente</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{avgWaitTime} min</p>
                  <p className="text-sm text-muted-foreground">Temps moyen</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{services.length}</p>
                  <p className="text-sm text-muted-foreground">Services actifs</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">24/7</p>
                  <p className="text-sm text-muted-foreground">Disponibilité</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Search & Services Section */}
      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Nos Services Médicaux
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Recherchez et sélectionnez le service dont vous avez besoin pour prendre votre ticket
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un service (ex: Radiologie, Urgences...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-2xl border-2 bg-card pl-12 pr-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
            />
          </motion.div>

          {/* Services Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredServices.map((service) => (
              <motion.div key={service.id} variants={itemVariants}>
                <Card 
                  className="group cursor-pointer border-2 border-transparent bg-card transition-all hover:border-primary hover:shadow-lg"
                  onClick={onTakeTicket}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {serviceIcons[service.icon] || <Building2 className="size-5" />}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {service.currentQueue} en attente
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        <span>~{service.waitTime} min</span>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onNavigate("services")}
              className="gap-2 rounded-xl"
            >
              Voir tous les services
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Pourquoi Rang+ ?</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Une expérience patient repensée
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Découvrez les avantages de notre plateforme de gestion de file d&apos;attente intelligente
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-0 shadow-md bg-card">
                  <CardContent className="p-6">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Comment ça marche ?</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              3 étapes simples
            </h2>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 lg:grid-cols-3"
          >
            {[
              { step: "1", title: "Choisissez votre service", desc: "Sélectionnez le service médical dont vous avez besoin dans la liste" },
              { step: "2", title: "Prenez votre ticket", desc: "Entrez vos informations et recevez votre numéro de ticket instantanément" },
              { step: "3", title: "Suivez votre position", desc: "Consultez votre rang en temps réel et soyez alerté quand c'est votre tour" }
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants} className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Témoignages</Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Ce que disent nos patients
            </h2>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border-0 shadow-md bg-card">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="size-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.text}&quot;</p>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 lg:py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <Card className="overflow-hidden border-0 bg-primary text-primary-foreground">
            <CardContent className="p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Prêt à gagner du temps ?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Rejoignez les milliers de patients qui utilisent déjà Rang+ pour éviter les files d&apos;attente
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg"
                  variant="secondary"
                  onClick={onTakeTicket}
                  className="h-14 px-8 gap-3 rounded-2xl text-lg font-semibold w-full sm:w-auto"
                >
                  <CheckCircle2 className="size-5" />
                  Prendre mon Ticket
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={onScanQR}
                  className="h-14 px-8 gap-3 rounded-2xl text-lg font-semibold bg-transparent border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 w-full sm:w-auto"
                >
                  <QrCode className="size-5" />
                  Scanner QR
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="contact-section" className="px-6 py-12 bg-foreground text-background">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
                  <Building2 className="size-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold">Hôpital du Mali</p>
                  <p className="text-sm text-background/60">Rang+</p>
                </div>
              </div>
              <p className="text-sm text-background/60">
                Votre santé, notre priorité. Gestion intelligente des files d&apos;attente hospitalières.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-background/60">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <span>Bamako, Mali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>+223 20 22 50 02</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>contact@hopitaldumali.ml</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Horaires</h4>
              <div className="space-y-2 text-sm text-background/60">
                <p>Lundi - Vendredi: 7h00 - 18h00</p>
                <p>Samedi: 8h00 - 14h00</p>
                <p>Urgences: 24h/24, 7j/7</p>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 text-center text-sm text-background/60">
            <p>&copy; 2026 Hôpital du Mali - Rang+. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
