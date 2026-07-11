/**
 * app-context.tsx COMPLET
 *
 * Version avec :
 * ✅ Import SMS functions
 * ✅ sentSmsKeysRef pour éviter doublons (presque le tour)
 * ✅ callNextPatient() envoie SMS "c'est le tour"
 * ✅ useEffect pour "presque le tour" (position ≤ 2)
 * ✅ NOUVEAU : SMS "annulé" quand un guichet ferme et annule les tickets en attente
 * ✅ NOUVEAU : SMS "redirigé" quand un guichet ferme et redirige les tickets vers un autre guichet
 */

"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sendAlmostTurnSms, sendCalledSms, sendCancelledByStaffSms, sendRedirectedSms } from "@/lib/sms-confirmation"

export type UserRole = "visitor" | "patient" | "agent" | "admin"

export interface User {
  id: string
  name: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  photo?: string
  role: UserRole
}

export interface Service {
  id: string
  name: string
  description: string
  icon: string
  waitTime: number
  currentQueue: number
  isActive: boolean
  openTime: string
  closeTime: string
}

export interface Ticket {
  id: string
  number: string
  service: Service
  counterId?: string
  counterName?: string
  userId: string
  userName: string
  phone?: string
  statut: "waiting" | "called" | "serving" | "completed" | "absent" | "cancelled"
  position: number
  priorite: number
  waitTime?: number
  totalInQueue: number
  createdAt: Date
  calledAt?: Date
  completedAt?: Date
}

export interface Counter {
  id: string
  name: string
  number: string
  serviceId: string
  serviceName: string
  id_agent_actuel?: string | null
  isActive: boolean
  ticketsServed: number
}

export interface Agent extends User {
  counterId?: string
  counterName?: string
  serviceId?: string
  serviceName?: string
  isOnline: boolean
  est_banni: boolean
  ticketsServedToday: number
}

export interface HospitalSettings {
  name: string
  openTime: string
  closeTime: string
  autoCloseServices: boolean
  maxQueuePerService: number
  allowAnonymousTickets: boolean
  voiceAnnouncements: boolean
}

const ACTIVE_TICKET_STATUSES: Ticket["statut"][] = ["waiting", "called", "serving"]

export interface CloseCounterRequestResult {
  needsConfirmation: boolean
  pendingTickets: Ticket[]
  availableCounter: Counter | null
}

interface AppContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  currentTicket: Ticket | null
  setCurrentTicket: (ticket: Ticket | null) => void
  tickets: Ticket[]
  setTickets: (tickets: Ticket[] | ((prev: Ticket[]) => Ticket[])) => void
  fetchTickets: () => Promise<void>
  services: Service[]
  setServices: (services: Service[] | ((prev: Service[]) => Service[])) => void
  fetchServices: () => Promise<void>
  fetchCounters: () => Promise<void>
  counters: Counter[]
  setCounters: (counters: Counter[] | ((prev: Counter[]) => Counter[])) => void
  isBusy: boolean
  setIsBusy: (value: boolean) => void
  agents: Agent[]
  setAgents: (agents: Agent[] | ((prev: Agent[]) => Agent[])) => void
  fetchAgents: () => Promise<void>
  hospitalSettings: HospitalSettings
  setHospitalSettings: (settings: HospitalSettings) => void
  fetchHospitalSettings: () => Promise<void>
  updateHospitalSettings: (updates: Partial<HospitalSettings>) => Promise<void>
  loginAsRole: (role: UserRole, name?: string, firstName?: string, email?: string) => void
  loginAsAgent: (agent: Agent) => void
  logout: () => void
  takeTicket: (service: Service, name: string, firstName: string) => Ticket
  cancelTicket: (ticketId: string) => Promise<void>
  getPatientHistory: () => Ticket[]
  getActiveTickets: () => Ticket[]
  getCurrentAgent: () => Agent | null
  getAgentCounter: () => Counter | null
  getAgentQueue: () => Ticket[]
  callNextPatient: () => Promise<Ticket | null>
  startConsultation: (ticketId: string) => Promise<void>
  markAbsent: (ticketId: string) => Promise<void>
  recallPatient: (ticketId: string) => Promise<void>
  completeService: (ticketId: string) => Promise<void>
  toggleCounter: (open: boolean, options?: { silent?: boolean }) => Promise<void>
  requestCloseCounter: () => Promise<CloseCounterRequestResult>
  redirectPendingTicketsAndClose: (ticketIds: string[], targetCounterId: string) => Promise<boolean>
  cancelPendingTicketsAndClose: (ticketIds: string[]) => Promise<boolean>
  keepPendingTicketsAndClose: () => Promise<boolean>
  createService: (service: Omit<Service, "id">) => Service
  updateService: (id: string, updates: Partial<Service>) => void
  deleteService: (id: string) => void
  createCounter: (counter: Omit<Counter, "id">) => Counter
  updateCounter: (id: string, updates: Partial<Counter>) => void
  deleteCounter: (id: string) => void
  createAgent: (agent: Omit<Agent, "id">) => Agent
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  assignAgentToCounter: (agentId: string, counterId: string) => void
  unassignAgent: (agentId: string) => void
  getStatistics: () => {
    totalPatients: number
    avgWaitTime: number
    activeServices: number
    activeCounters: number
    ticketsToday: number
    ticketsCompleted: number
  }
}

const defaultHospitalSettings: HospitalSettings = {
  name: "Hôpital du Mali",
  openTime: "07:00",
  closeTime: "20:00",
  autoCloseServices: true,
  maxQueuePerService: 50,
  allowAnonymousTickets: true,
  voiceAnnouncements: true,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const ID_HOPITAL = "1789ea4c-f298-4109-803a-b036cda79ed0"

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [counters, setCounters] = useState<Counter[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(defaultHospitalSettings)

  // Ref pour éviter d'envoyer le même SMS "presque le tour" 2x
  const sentSmsKeysRef = useRef<Set<string>>(new Set())

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("app-user")
      return savedUser ? JSON.parse(savedUser) : null
    }
    return null
  })

  const selfToggleRef = useRef(false)
  const prevOwnCounterActiveRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (user && tickets.length > 0) {
      const activeTicket = tickets.find(t =>
        t.userId === user.id &&
        (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
      )
      setCurrentTicket(activeTicket || null)
    } else if (!user) {
      setCurrentTicket(null)
    }
  }, [tickets, user])

  useEffect(() => {
    if (user) {
      localStorage.setItem("app-user", JSON.stringify(user))
    } else {
      localStorage.removeItem("app-user")
    }
  }, [user])

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase.from("service").select("*")
    if (error) {
      console.error("Erreur chargement services:", error)
    } else if (data) {
      setServices(data.map((s: any) => ({
        id: s.id,
        name: s.nom,
        description: s.description || "",
        icon: s.icon || "LayoutGrid",
        waitTime: s.wait_time || 0,
        currentQueue: s.current_queue || 0,
        isActive: s.is_active || false,
        openTime: s.open_time || "08:00",
        closeTime: s.close_time || "17:00",
      })))
    }
    setIsLoading(false)
  }, [])

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from("ticket")
      .select("*, service:id_service(nom), guichet:id_guichet(numero)")

    if (error) { console.error("Erreur chargement tickets:", error); return }

    if (data) {
      const mappedTickets = data.map((t: any) => {
        let appStatus: Ticket["statut"] = "waiting"
        const dbStatus = (t.statut || "En attente").toLowerCase()
        if (dbStatus.includes("attente") || dbStatus === "waiting") appStatus = "waiting"
        else if (dbStatus.includes("appel") || dbStatus === "called") appStatus = "called"
        else if (dbStatus.includes("cours") || dbStatus === "serving") appStatus = "serving"
        else if (dbStatus.includes("termine") || dbStatus === "completed") appStatus = "completed"
        else if (dbStatus.includes("absent")) appStatus = "absent"
        else if (dbStatus.includes("annule") || dbStatus === "cancelled") appStatus = "cancelled"

        return {
          id: t.id,
          number: t.code,
          service: { id: t.id_service, name: t.service?.nom || "Non défini" } as any,
          counterId: t.id_guichet,
          counterName: t.guichet?.numero || "Non assigné",
          userId: t.id_patient_connecte || t.telephone_patient || "Anonyme",
          phone: t.telephone_patient || undefined,
          userName: t.patient_nom || "Anonyme",
          statut: appStatus,
          priorite: t.priorite || 0,
          position: 0,
          totalInQueue: 0,
          createdAt: new Date(t.created_at),
          calledAt: t.date_appel ? new Date(t.date_appel) : undefined,
          completedAt: t.date_fin ? new Date(t.date_fin) : undefined,
        }
      })

      const finalTickets: Ticket[] = mappedTickets.map((ticket, _, all) => {
        if (ticket.statut !== "waiting") return { ...ticket, position: 0, totalInQueue: 0 }
        const queue = all
          .filter(t => t.service.id === ticket.service.id && t.statut === "waiting")
          .sort((a, b) => b.priorite !== a.priorite ? b.priorite - a.priorite : a.createdAt.getTime() - b.createdAt.getTime())
        return { ...ticket, position: queue.findIndex(t => t.id === ticket.id) + 1, totalInQueue: queue.length }
      })

      setTickets(finalTickets)
    }
  }, [])

  const fetchCounters = useCallback(async () => {
    const { data, error } = await supabase.from("guichet").select("*, service(nom)")
    if (error) { console.error("Erreur chargement guichets:", error); return }
    if (data) {
      setCounters(data.map((g: any) => ({
        id: g.id,
        name: g.numero,
        number: g.numero,
        serviceId: g.id_service,
        serviceName: g.service?.nom || "Non assigné",
        id_agent_actuel: g.id_agent_actuel,
        isActive: g.statut === "Actif",
        ticketsServed: 0,
      })))
    }
  }, [])

  const fetchHospitalSettings = useCallback(async () => {
    const { data, error } = await supabase.from("hopital").select("*").eq("id", ID_HOPITAL).single()
    if (error) { console.error("Erreur chargement paramètres hôpital:", error); return }
    if (data) {
      setHospitalSettings({
        name: data.nom || "Hôpital du Mali",
        openTime: data.open_time || "07:00",
        closeTime: data.close_time || "20:00",
        autoCloseServices: data.auto_close_services ?? true,
        maxQueuePerService: data.max_queue_per_service ?? 50,
        allowAnonymousTickets: data.allow_anonymous_tickets ?? true,
        voiceAnnouncements: data.voice_announcements ?? true,
      })
    }
  }, [])

  const updateHospitalSettings = useCallback(async (updates: Partial<HospitalSettings>) => {
    setHospitalSettings(prev => ({ ...prev, ...updates }))
    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.nom = updates.name
    if (updates.openTime !== undefined) dbUpdates.open_time = updates.openTime
    if (updates.closeTime !== undefined) dbUpdates.close_time = updates.closeTime
    if (updates.autoCloseServices !== undefined) dbUpdates.auto_close_services = updates.autoCloseServices
    if (updates.maxQueuePerService !== undefined) dbUpdates.max_queue_per_service = updates.maxQueuePerService
    if (updates.allowAnonymousTickets !== undefined) dbUpdates.allow_anonymous_tickets = updates.allowAnonymousTickets
    if (updates.voiceAnnouncements !== undefined) dbUpdates.voice_announcements = updates.voiceAnnouncements
    const { error } = await supabase.from("hopital").update(dbUpdates).eq("id", ID_HOPITAL)
    if (error) { console.error("Erreur sauvegarde BDD:", error) }
    await fetchHospitalSettings()
  }, [fetchHospitalSettings])

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase.from("utilisateur").select("*").eq("role", "agent")
    if (error) { console.error("Erreur chargement agents:", error); return }
    if (data) {
      setAgents(data.map((u: any) => ({
        id: u.id,
        name: u.nom || "",
        firstName: u.prenom || "",
        email: u.email,
        phone: u.telephone || undefined,
        photo: u.photo_url || undefined,
        role: "agent" as UserRole,
        isOnline: u.disponibilite ?? true,
        est_banni: u.est_banni ?? false,
        ticketsServedToday: 0,
      })))
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchCounters()
    fetchAgents()
    fetchTickets()
    fetchHospitalSettings()

    const channel = supabase.channel("public-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "service" }, fetchServices)
      .on("postgres_changes", { event: "*", schema: "public", table: "guichet" }, fetchCounters)
      .on("postgres_changes", { event: "*", schema: "public", table: "utilisateur" }, fetchAgents)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket" }, fetchTickets)
      .on("postgres_changes", { event: "*", schema: "public", table: "hopital" }, fetchHospitalSettings)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchServices, fetchCounters, fetchAgents, fetchTickets, fetchHospitalSettings])

  const loginAsRole = useCallback((role: UserRole, name?: string, firstName?: string, email?: string) => {
    setUser({
      id: `user-${Date.now()}`,
      name: name || (role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Patient"),
      firstName: firstName || (role === "admin" ? "Super" : role === "agent" ? "Mamadou" : ""),
      email: email || (role === "admin" ? "admin@hopitalmali.ml" : undefined),
      role,
    })
  }, [])

  const loginAsAgent = useCallback((agent: Agent) => {
    setUser(agent)
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, isOnline: true } : a))
  }, [])

  const logout = useCallback(() => {
    if (user?.role === "agent") {
      setAgents(prev => prev.map(a => a.id === user.id ? { ...a, isOnline: false } : a))
    }
    setUser(null)
    setCurrentTicket(null)
  }, [user])

  const takeTicket = useCallback((service: Service, name: string, firstName: string): Ticket => {
    const position = tickets.filter(t => t.service.id === service.id && t.statut === "waiting").length + 1
    const ticketNumber = `${service.name.charAt(0).toUpperCase()}${String(position).padStart(3, "0")}`
    const availableCounter = counters.find(c => c.serviceId === service.id && c.isActive && c.id_agent_actuel)
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      number: ticketNumber,
      service,
      counterId: availableCounter?.id,
      counterName: availableCounter?.name,
      userId: user?.id || `visitor-${Date.now()}`,
      userName: `${firstName} ${name}`,
      statut: "waiting",
      priorite: 0,
      position,
      totalInQueue: position,
      createdAt: new Date(),
    }
    setTickets(prev => [...prev, newTicket])
    setCurrentTicket(newTicket)
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, currentQueue: s.currentQueue + 1 } : s))
    if (!user) setUser({ id: newTicket.userId, name, firstName, role: "patient" })
    return newTicket
  }, [tickets, counters, user])

  const cancelTicket = useCallback(async (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, statut: "cancelled" as const } : t))
    const { error } = await supabase.from("ticket").update({ statut: "cancelled" }).eq("id", ticketId)
    if (error) { console.error("Erreur annulation BDD:", error) }
    await fetchTickets()
  }, [fetchTickets])

  const getPatientHistory = useCallback(() => {
    if (!user) return []
    return tickets.filter(t => t.userId === user.id)
  }, [tickets, user])

  const getActiveTickets = useCallback(() => {
    if (!user) return []
    return tickets.filter(t =>
      t.userId === user.id &&
      (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
    )
  }, [tickets, user])

  const getCurrentAgent = useCallback(() => {
    if (!user || user.role !== "agent") return null
    return agents.find(a => a.id === user.id) || null
  }, [user, agents])

  const getAgentCounter = useCallback(() => {
    if (!user || user.role !== "agent") return null
    return counters.find(c => c.id_agent_actuel === user.id) || null
  }, [user, counters])

  const getAgentQueue = useCallback(() => {
    const counter = getAgentCounter()
    if (!counter) return []
    return tickets
    .filter(t => t.counterId === counter.id && t.statut === "waiting")
      .sort((a, b) => b.priorite !== a.priorite ? b.priorite - a.priorite : a.createdAt.getTime() - b.createdAt.getTime())
  }, [getAgentCounter, tickets])

 const startConsultation = useCallback(async (ticketId: string) => {
    const debut = new Date()
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, statut: "serving" as const, calledAt: debut } : t))
    const { error } = await supabase
      .from("ticket")
      .update({ statut: "serving", date_appel: debut.toISOString() })
      .eq("id", ticketId)
    if (error) { console.error("Erreur consultation BDD:", error) }
    await fetchTickets()
  }, [fetchTickets])

  const callNextPatient = useCallback(async (): Promise<Ticket | null> => {
    const queue = getAgentQueue()
    const counter = getAgentCounter()
    if (queue.length === 0 || !counter) return null
    const nextTicket = queue[0]
    const calledAt = new Date()
    setTickets(prev => prev.map(t =>
      t.id === nextTicket.id
        ? { ...t, statut: "called" as const, calledAt, position: 0, counterId: counter.id, counterName: counter.name }
        : t
    ))
    const { error } = await supabase
      .from("ticket")
      .update({ statut: "called", id_guichet: counter.id, date_appel: calledAt.toISOString() })
      .eq("id", nextTicket.id)
    if (error) { console.error("Erreur appel BDD:", error); await fetchTickets(); return null }
    await fetchTickets()

    // Envoyer SMS "c'est le tour"
    const updatedTicket = tickets.find((t) => t.id === nextTicket.id)
    if (updatedTicket?.phone) {
      await sendCalledSms({
        id: updatedTicket.id,
        number: updatedTicket.number,
        phone: updatedTicket.phone,
        userName: updatedTicket.userName,
        counterName: updatedTicket.counterName,
        service: updatedTicket.service,
      })
    }

    return { ...nextTicket, statut: "called", calledAt, position: 0, counterId: counter.id, counterName: counter.name }
  }, [getAgentQueue, getAgentCounter, fetchTickets, tickets])

  const markAbsent = useCallback(async (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, statut: "absent" as const } : t))
    const { error } = await supabase.from("ticket").update({ statut: "absent" }).eq("id", ticketId)
    if (error) { console.error("Erreur absent BDD:", error) }
    await fetchTickets()
  }, [fetchTickets])

  const recallPatient = useCallback(async (ticketId: string) => {
    const recalledAt = new Date()
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, calledAt: recalledAt } : t))
    const { error } = await supabase.from("ticket").update({ date_appel: recalledAt.toISOString() }).eq("id", ticketId)
    if (error) { console.error("Erreur rappel BDD:", error) }
    await fetchTickets()
  }, [fetchTickets])

  const completeService = useCallback(async (ticketId: string) => {
    const counter = getAgentCounter()
    const completedAt = new Date()
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, statut: "completed" as const, completedAt } : t))
    const { error } = await supabase
      .from("ticket")
      .update({ statut: "completed", date_fin: completedAt.toISOString() })
      .eq("id", ticketId)
    if (error) { console.error("Erreur fin service BDD:", error) }
    if (counter) {
      setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, ticketsServed: c.ticketsServed + 1 } : c))
      setAgents(prev => prev.map(a => a.counterId === counter.id ? { ...a, ticketsServedToday: a.ticketsServedToday + 1 } : a))
    }
    await fetchTickets()
  }, [getAgentCounter, fetchTickets])

  const toggleCounter = useCallback(async (open: boolean, options?: { silent?: boolean }) => {
    const counter = getAgentCounter()
    if (!counter) return
    selfToggleRef.current = true
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, isActive: open } : c))
    try {
      await supabase.from("utilisateur").update({ is_online: open }).eq("id", user?.id ?? "")
      const { error } = await supabase.from("guichet").update({ statut: open ? "Actif" : "Inactif" }).eq("id", counter.id)
      if (error) throw error
      if (!options?.silent) {
        if (open) {
          toast.success("Guichet ouvert", { description: "Vous pouvez maintenant recevoir des patients.", id: "counter-status" })
        } else {
          toast.success("Guichet fermé", { description: "Vous ne recevez plus de nouveaux patients.", id: "counter-status" })
        }
      }
    } catch (err) {
      console.error("Erreur toggle guichet BDD:", err)
      selfToggleRef.current = false
      toast.error("Erreur", { description: open ? "Impossible d'ouvrir le guichet." : "Impossible de fermer le guichet.", id: "counter-status" })
    } finally {
      await fetchCounters()
    }
  }, [getAgentCounter, fetchCounters, user])

  useEffect(() => {
    if (!user || user.role !== "agent") return
    const ownCounter = counters.find(c => c.id_agent_actuel === user.id)
    if (!ownCounter) { prevOwnCounterActiveRef.current = null; return }

    if (prevOwnCounterActiveRef.current === null) {
      prevOwnCounterActiveRef.current = ownCounter.isActive
      return
    }

    if (prevOwnCounterActiveRef.current && !ownCounter.isActive) {
      if (!selfToggleRef.current) {
        toast.warning("Guichet fermé", { description: "Votre guichet a été fermé.", id: "counter-status" })
      }
      selfToggleRef.current = false
    }

    prevOwnCounterActiveRef.current = ownCounter.isActive
  }, [counters, user])

  const requestCloseCounter = useCallback(async (): Promise<CloseCounterRequestResult> => {
    const counter = getAgentCounter()
    if (!counter) return { needsConfirmation: false, pendingTickets: [], availableCounter: null }

    const pending = tickets.filter(t => t.counterId === counter.id && ACTIVE_TICKET_STATUSES.includes(t.statut))

    if (pending.length === 0) {
      await toggleCounter(false)
      return { needsConfirmation: false, pendingTickets: [], availableCounter: null }
    }

    const available = counters.find(c =>
      c.id !== counter.id &&
      c.serviceId === counter.serviceId &&
      c.isActive &&
      agents.some(a => a.id === c.id_agent_actuel && a.isOnline && !a.est_banni)
    ) ?? null

    return { needsConfirmation: true, pendingTickets: pending, availableCounter: available }
  }, [getAgentCounter, tickets, counters, agents, toggleCounter])

  const redirectPendingTicketsAndClose = useCallback(async (ticketIds: string[], targetCounterId: string) => {
    try {
      // On garde une copie des tickets concernés AVANT la mise à jour,
      // pour avoir leur téléphone/nom au moment d'envoyer le SMS.
      const ticketsToNotify = tickets.filter(t => ticketIds.includes(t.id))

      const { error } = await supabase
        .from("ticket")
        .update({ id_guichet: targetCounterId, statut: "waiting" })
        .in("id", ticketIds)
      if (error) throw error
      await fetchTickets()
      await toggleCounter(false, { silent: true })
      const targetCounter = counters.find(c => c.id === targetCounterId)

      // Notifie chaque patient concerné par SMS (si téléphone connu)
      for (const t of ticketsToNotify) {
        if (t.phone) {
          await sendRedirectedSms({
            id: t.id,
            number: t.number,
            phone: t.phone,
            userName: t.userName,
            newCounterName: targetCounter?.number,
            service: t.service,
          })
        }
      }

      toast.success(
        `${ticketIds.length} ticket${ticketIds.length > 1 ? "s" : ""} redirigé${ticketIds.length > 1 ? "s" : ""} vers le guichet ${targetCounter?.number ?? ""}. Guichet fermé.`,
        { id: "counter-status" }
      )
      return true
    } catch (err) {
      console.error("Erreur redirection tickets:", err)
      toast.error("Erreur", { description: "Impossible de rediriger les tickets.", id: "counter-status" })
      return false
    }
  }, [fetchTickets, toggleCounter, counters, tickets])

  const cancelPendingTicketsAndClose = useCallback(async (ticketIds: string[]) => {
    try {
      // Copie des tickets concernés AVANT annulation, pour le SMS
      const ticketsToNotify = tickets.filter(t => ticketIds.includes(t.id))

      if (ticketIds.length > 0) {
        const { error } = await supabase.from("ticket").update({ statut: "cancelled" }).in("id", ticketIds)
        if (error) throw error
        await fetchTickets()
      }
      await toggleCounter(false, { silent: true })

      // Notifie chaque patient concerné par SMS (si téléphone connu)
      for (const t of ticketsToNotify) {
        if (t.phone) {
          await sendCancelledByStaffSms({
            id: t.id,
            number: t.number,
            phone: t.phone,
            userName: t.userName,
            service: t.service,
          })
        }
      }

      toast.success(
        `${ticketIds.length} ticket${ticketIds.length > 1 ? "s" : ""} annulé${ticketIds.length > 1 ? "s" : ""} et guichet fermé.`,
        { id: "counter-status" }
      )
      return true
    } catch (err) {
      console.error("Erreur annulation tickets:", err)
      toast.error("Erreur", { description: "Impossible d'annuler les tickets.", id: "counter-status" })
      return false
    }
  }, [fetchTickets, toggleCounter, tickets])

  const keepPendingTicketsAndClose = useCallback(async () => {
    await toggleCounter(false, { silent: true })
    toast.info("Guichet fermé", { description: "Les tickets restent en attente. Un autre agent pourra les traiter.", id: "counter-status" })
    return true
  }, [toggleCounter])

  const createService = useCallback((service: Omit<Service, "id">): Service => {
    const newService = { ...service, id: `s-${Date.now()}` }
    setServices(prev => [...prev, newService])
    return newService
  }, [])

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteService = useCallback(async (id: string) => {
  const { error } = await supabase
    .from("service")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erreur suppression Supabase:", error);
    return;
  }

  setServices(prev => prev.filter(s => s.id !== id));
  setCounters(prev => prev.filter(c => c.serviceId !== id));
}, []);

  const createCounter = useCallback((counter: Omit<Counter, "id">): Counter => {
    const newCounter = { ...counter, id: `c-${Date.now()}` }
    setCounters(prev => [...prev, newCounter])
    return newCounter
  }, [])

  const updateCounter = useCallback((id: string, updates: Partial<Counter>) => {
    setCounters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

 const deleteCounter = useCallback(async (id: string) => {
  const { error } = await supabase
    .from("guichet")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erreur de suppression du guichet :", error);
    toast.error("Impossible de supprimer le guichet.");
    return;
  }

  setCounters(prev => prev.filter(c => c.id !== id));
  toast.success("Guichet supprimé avec succès.");
}, []);

  const createAgent = useCallback((agent: Omit<Agent, "id">): Agent => {
    const newAgent = { ...agent, id: `a-${Date.now()}` }
    setAgents(prev => [...prev, newAgent])
    return newAgent
  }, [])

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }, [])

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id))
  }, [])

  const assignAgentToCounter = useCallback((agentId: string, counterId: string) => {
    const counter = counters.find(c => c.id === counterId)
    const agent = agents.find(a => a.id === agentId)
    if (!counter || !agent) return
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, id_agent_actuel: agentId } : c))
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, counterId, counterName: counter.name, serviceId: counter.serviceId, serviceName: counter.serviceName } : a
    ))
  }, [counters, agents])

  const unassignAgent = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    if (agent.counterId) {
      setCounters(prev => prev.map(c => c.id === agent.counterId ? { ...c, id_agent_actuel: null, isActive: false } : c))
    }
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, counterId: undefined, counterName: undefined, serviceId: undefined, serviceName: undefined } : a
    ))
  }, [agents])

  const getStatistics = useCallback(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayTickets = tickets.filter(t => new Date(t.createdAt) >= today)
    const completedToday = todayTickets.filter(t => t.statut === "completed")
    const totalWaitTime = completedToday.reduce((acc, t) => {
      if (t.calledAt && t.createdAt) return acc + (new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime())
      return acc
    }, 0)
    return {
      totalPatients: tickets.filter(t => t.statut === "waiting").length,
      avgWaitTime: completedToday.length > 0 ? Math.round(totalWaitTime / completedToday.length / 60000) : 0,
      activeServices: services.filter(s => s.isActive).length,
      activeCounters: counters.filter(c => c.isActive).length,
      ticketsToday: todayTickets.length,
      ticketsCompleted: completedToday.length,
    }
  }, [tickets, services, counters])

  const loadUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("utilisateur").select("*").eq("id", userId).single()
    if (data && !error) {
      setUser({
        id: data.id,
        email: data.email,
        firstName: data.prenom || "",
        name: data.nom || "",
        role: data.role as UserRole,
        photo: data.photo_url || "",
        phone: data.telephone || "",
      })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) loadUserProfile(session.user.id)
      else if (event === "SIGNED_OUT") setUser(null)
    })
    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  // useEffect : détecte "presque le tour" (position ≤ 2)
  // et envoie un SMS une seule fois via sentSmsKeysRef
  useEffect(() => {
    tickets.forEach((ticket) => {
      if (ticket.statut !== "waiting" || !ticket.phone) return

      const smsKey = `almost_turn_${ticket.id}`

      if (
        ticket.position &&
        ticket.position <= 2 &&
        !sentSmsKeysRef.current.has(smsKey)
      ) {
        sendAlmostTurnSms({
          id: ticket.id,
          number: ticket.number,
          phone: ticket.phone,
          userName: ticket.userName,
          position: ticket.position,
          service: ticket.service,
        })
        sentSmsKeysRef.current.add(smsKey)
      }
    })
  }, [tickets])

  return (
    <AppContext.Provider value={{
      user, isLoading, setUser,
      currentTicket, setCurrentTicket,
      tickets, setTickets, fetchTickets,
      services, setServices, fetchServices,
      counters, setCounters, fetchCounters,
      agents, setAgents, fetchAgents,
      isBusy, setIsBusy,
      hospitalSettings, setHospitalSettings, fetchHospitalSettings, updateHospitalSettings,
      loginAsRole, loginAsAgent, logout,
      takeTicket, cancelTicket, getPatientHistory, getActiveTickets,
      getCurrentAgent, getAgentCounter, getAgentQueue,
      callNextPatient, startConsultation, markAbsent, recallPatient, completeService, toggleCounter,
      requestCloseCounter, redirectPendingTicketsAndClose, cancelPendingTicketsAndClose, keepPendingTicketsAndClose,
      createService, updateService, deleteService,
      createCounter, updateCounter, deleteCounter,
      createAgent, updateAgent, deleteAgent,
      assignAgentToCounter, unassignAgent,
      getStatistics,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error("useApp must be used within an AppProvider")
  return context
}