"use client"

import { motion } from "framer-motion"
import { 
  Search, QrCode, Building2, Clock, Users, CheckCircle2,
  Smartphone, Bell, Shield, ChevronRight, MapPin, Phone,
  Mail, Stethoscope, Siren, ScanLine, FlaskConical, Pill,
  HeartPulse, ArrowRight, Star, LogIn, Menu, X, UserPlus, ExternalLink
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 1. HEADER ÉLARGI */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex flex-col items-start group cursor-pointer" onClick={() => onNavigate("home")}>
             <span className="text-2xl font-black text-[#1e293b] leading-none tracking-tighter">
                Rang<span className="text-[#10B981]">+</span>
             </span>
             <span className="text-[10px] font-extrabold text-[#1e293b]/40 uppercase tracking-[0.2em] mt-1">
                Hôpital du Mali
             </span>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            <button onClick={() => onNavigate("services")} className="text-sm font-bold text-slate-500 hover:text-[#10B981] transition-colors">Services</button>
            <button onClick={onTakeTicket} className="text-sm font-bold text-slate-500 hover:text-[#10B981] transition-colors">Prendre un ticket</button>
            <button onClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })} className="text-sm font-bold text-slate-500 hover:text-[#10B981] transition-colors">Contact</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={onLogin} className="font-bold">Connexion</Button>
            <Button onClick={onLogin} className="rounded-xl bg-[#10B981] hover:bg-[#0da371] px-6">S&apos;inscrire</Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION ÉLARGIE */}
      <section className="relative overflow-hidden pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge className="mb-6 bg-emerald-50 text-[#10B981] border-emerald-100 px-4 py-1">Système Temps Réel Activé</Badge>
            <h1 className="text-5xl font-black text-[#1e293b] lg:text-7xl tracking-tight mb-6">
              Ne faites plus la queue, <br/>
              <span className="text-[#10B981]">gagnez du temps.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
              Prenez votre ticket à distance pour l&apos;Hôpital du Mali et recevez une notification quand c&apos;est votre tour.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={onTakeTicket} className="h-14 px-10 rounded-2xl bg-[#10B981] text-lg font-bold shadow-xl shadow-emerald-200">Prendre un Ticket</Button>
              <Button size="lg" variant="outline" onClick={onScanQR} className="h-14 px-10 rounded-2xl border-2 font-bold">Scanner QR Code</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. LIVE STATS ÉLARGIES AVEC POINT CLIGNOTANT */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Patients en attente", value: totalWaiting, icon: <Users/>, live: true },
              { label: "Temps moyen", value: `${avgWaitTime} min`, icon: <Clock/>, live: true },
              { label: "Services actifs", value: services.length, icon: <Building2/>, live: false },
              { label: "Disponibilité", value: "24/7", icon: <CheckCircle2/>, live: false }
            ].map((stat, i) => (
              <Card key={i} className="border-slate-100 shadow-sm rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-slate-600">{stat.icon}</div>
                    {stat.live && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </span>
                        <span className="text-[10px] font-black text-[#10B981] uppercase">Live</span>
                      </div>
                    )}
                  </div>
                  <p className="text-4xl font-black text-[#1e293b]">{stat.value}</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SERVICES GRID ÉLARGIE */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black text-[#1e293b]">Nos Services</h2>
              <p className="text-slate-500 mt-2">Sélectionnez votre département pour prendre rang.</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -