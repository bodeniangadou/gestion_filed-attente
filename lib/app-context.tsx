"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"

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
  name: string      // "Guichet A1"
  number: string    // Numéro comme string (ex: "A1")
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
  // Auth
  loginAsRole: (role: UserRole, name?: string, firstName?: string, email?: string) => void
  loginAsAgent: (agent: Agent) => void
  logout: () => void
  
  // Patient actions
  takeTicket: (service: Service, name: string, firstName: string) => Ticket
  cancelTicket: (ticketId: string) => Promise<void>
  getPatientHistory: () => Ticket[]
  getActiveTickets: () => Ticket[]
  
  // Agent actions
  getCurrentAgent: () => Agent | null
  getAgentCounter: () => Counter | null
  getAgentQueue: () => Ticket[]
  callNextPatient: () => Promise<Ticket | null>
  startConsultation: (ticketId: string) => Promise<void>
  markAbsent: (ticketId: string) => Promise<void>
  recallPatient: (ticketId: string) => Promise<void>
  completeService: (ticketId: string) => Promise<void>
  toggleCounter: (open: boolean) => Promise<void>
  
  // Admin actions
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [services, setServices] = useState<Service[]>([]) 
  const [counters, setCounters] = useState<Counter[]>([]) 
  const [agents, setAgents] = useState<Agent[]>([]) 
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(defaultHospitalSettings)

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("app-user")
      return savedUser ? JSON.parse(savedUser) : null
    }
    return null
  })

  // Synchronisation automatique du TICKET ACTIF de l'utilisateur
  useEffect(() => {
    if (user && tickets.length > 0) {
      const activeTicket = tickets.find(t => 
        t.userId === user.id && 
        (t.statut === "waiting" || t.statut === "called" || t.statut === "serving")
      )
      if (activeTicket) {
        setCurrentTicket(activeTicket)
      } else {
        setCurrentTicket(null)
      }
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
      const mappedServices: Service[] = data.map((s: any) => ({
        id: s.id,
        name: s.nom,
        description: s.description || "",
        icon: s.icon || "LayoutGrid",
        waitTime: s.wait_time || 0,
        currentQueue: s.current_queue || 0,
        isActive: s.is_active || false,
        openTime: s.open_time || "08:00",
        closeTime: s.close_time || "17:00"
      }))
      setServices(mappedServices)
    }
    setIsLoading(false)
  }, []) 

  // Charge les tickets, mappe le statut texte BDD -> statut applicatif unifié,
  // calcule la position réelle dans chaque file de service, et persiste priorite.
  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from("ticket")
      .select("*, service:id_service(nom), guichet:id_guichet(numero)") 

    if (error) {
      console.error("Erreur chargement tickets:", error)
      return
    }

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
          service: { 
            id: t.id_service, 
            name: t.service?.nom || "Non défini" 
          } as any, 
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

      // Calcul de la position réelle dans la file, en priorisant priorite décroissante puis ancienneté
      const finalTickets: Ticket[] = mappedTickets.map((ticket, _, allTickets) => {
        if (ticket.statut !== "waiting") {
          return { ...ticket, position: 0, totalInQueue: 0 }
        }

        const activeQueueForService = allTickets
          .filter(t => t.service.id === ticket.service.id && t.statut === "waiting")
          .sort((a, b) => {
            if (b.priorite !== a.priorite) return b.priorite - a.priorite
            return a.createdAt.getTime() - b.createdAt.getTime()
          })

        const realPosition = activeQueueForService.findIndex(t => t.id === ticket.id) + 1

        return {
          ...ticket,
          position: realPosition,
          totalInQueue: activeQueueForService.length
        }
      })

      setTickets(finalTickets)
    }
  }, [])

  const fetchCounters = useCallback(async () => {
    const { data, error } = await supabase
      .from("guichet")
      .select("*, service(nom)") 
      
    if (error) {
      console.error("Erreur chargement guichets:", error)
    } else if (data) {
      const formattedCounters: Counter[] = data.map((g: any) => ({
        id: g.id,
        name: g.numero,        // "A1"
        number: g.numero,      
        serviceId: g.id_service,
        serviceName: g.service?.nom || "Non assigné",
        id_agent_actuel: g.id_agent_actuel,
        isActive: g.statut === 'Actif',
        ticketsServed: 0 
      }))
      setCounters(formattedCounters)
    }
  }, [])
  const ID_HOPITAL = "1789ea4c-f298-4109-803a-b036cda79ed0"

  const fetchHospitalSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("hopital")
      .select("*")
      .eq("id", ID_HOPITAL)
      .single()

    if (error) {
      console.error("Erreur chargement paramètres hôpital:", error)
      return
    }

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

  // Persiste réellement les réglages en BDD — mise à jour optimiste + resynchronisation,
  // exactement comme pour les autres entités (services, tickets, etc.)
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

    const { error } = await supabase
      .from("hopital")
      .update(dbUpdates)
      .eq("id", ID_HOPITAL)

    if (error) {
      console.error("Erreur sauvegarde paramètres hôpital BDD:", error)
      await fetchHospitalSettings()
      return
    }

    await fetchHospitalSettings()
  }, [fetchHospitalSettings])

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from("utilisateur")
      .select("*")
      .eq("role", "agent")

    if (error) {
      console.error("Erreur chargement agents:", error)
      return
    }
    
    if (data) {
      const mappedAgents: Agent[] = data.map((u: any) => ({
        id: u.id,
        name: u.nom || "",
        firstName: u.prenom || "",
        email: u.email,
        phone: u.telephone || undefined,
        photo: u.photo_url || undefined,
        role: "agent",
        isOnline: u.disponibilite ?? true,
        est_banni: u.est_banni ?? false, 
        ticketsServedToday: 0
      }))
      setAgents(mappedAgents)
    }
  }, [])

 // Inscription aux flux en temps réel
  useEffect(() => {
    fetchServices()
    fetchCounters()
    fetchAgents()
    fetchTickets()
    fetchHospitalSettings()

    const channel = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service' }, fetchServices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guichet' }, fetchCounters)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'utilisateur' }, fetchAgents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket' }, fetchTickets)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hopital' }, fetchHospitalSettings)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchServices, fetchCounters, fetchAgents, fetchTickets, fetchHospitalSettings])

  const loginAsRole = useCallback((role: UserRole, name?: string, firstName?: string, email?: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name || (role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Patient"),
      firstName: firstName || (role === "admin" ? "Super" : role === "agent" ? "Mamadou" : ""),
      email: email || (role === "admin" ? "admin@hopitalmali.ml" : undefined),
      role,
    }
    setUser(newUser)
  }, [])

  const loginAsAgent = useCallback((agent: Agent) => {
    setUser(agent)
    setAgents(prev => prev.map(a => 
      a.id === agent.id ? { ...a, isOnline: true } : a
    ))
  }, [])

  const logout = useCallback(() => {
    if (user?.role === "agent") {
      setAgents(prev => prev.map(a => 
        a.id === user.id ? { ...a, isOnline: false } : a
      ))
    }
    setUser(null)
    setCurrentTicket(null)
  }, [user])

  // Action locale historique — conservée pour compatibilité, mais ServicesView fait son propre insert Supabase direct
  const takeTicket = useCallback((service: Service, name: string, firstName: string): Ticket => {
    const serviceTickets = tickets.filter(t => t.service.id === service.id && t.statut === "waiting")
    const position = serviceTickets.length + 1
    const ticketPrefix = service.name.charAt(0).toUpperCase()
const ticketNumber = `${ticketPrefix}${String(position).padStart(3, "0")}`;    
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
    
    setServices(prev => prev.map(s => 
      s.id === service.id ? { ...s, currentQueue: s.currentQueue + 1 } : s
    ))
    
    if (!user) {
      setUser({
        id: newTicket.userId,
        name,
        firstName,
        role: "patient",
      })
    }
    
    return newTicket
  }, [tickets, counters, user])

  // Annulation — mise à jour optimiste + persistance BDD + resynchronisation
  const cancelTicket = useCallback(async (ticketId: string) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, statut: "cancelled" as const } : t
    ))

    const { error } = await supabase
      .from("ticket")
      .update({ statut: "cancelled" })
      .eq("id", ticketId)

    if (error) {
      console.error("Erreur annulation BDD:", error)
      await fetchTickets()
      return
    }

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

  // Le lien réel agent ↔ guichet est porté par guichet.id_agent_actuel
  const getAgentCounter = useCallback(() => {
    if (!user || user.role !== "agent") return null
    return counters.find(c => c.id_agent_actuel === user.id) || null
  }, [user, counters])

  const getAgentQueue = useCallback(() => {
    const counter = getAgentCounter()
    if (!counter) return []
    return tickets
      .filter(t => t.service.id === counter.serviceId && t.statut === "waiting")
      .sort((a, b) => {
        if (b.priorite !== a.priorite) return b.priorite - a.priorite
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
  }, [getAgentCounter, tickets])

  // Démarrer la consultation — passe le ticket en "serving", persisté en BDD
  const startConsultation = useCallback(async (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, statut: "serving" as const } : t
    ))

    const { error } = await supabase
      .from("ticket")
      .update({ statut: "serving" })
      .eq("id", ticketId)

    if (error) {
      console.error("Erreur démarrage consultation BDD:", error)
      await fetchTickets()
      return
    }

    await fetchTickets()
  }, [fetchTickets])

  // Appeler le prochain patient — persiste statut "called", le guichet, et date_appel en BDD
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
      .update({ 
        statut: "called",
        id_guichet: counter.id,
        date_appel: calledAt.toISOString(),
      })
      .eq("id", nextTicket.id)

    if (error) {
      console.error("Erreur appel patient BDD:", error)
      await fetchTickets()
      return null
    }

    await fetchTickets()

    return {
      ...nextTicket,
      statut: "called",
      calledAt,
      position: 0,
      counterId: counter.id,
      counterName: counter.name,
    }
  }, [getAgentQueue, getAgentCounter, fetchTickets])

  // Marquer absent — persiste en BDD
  const markAbsent = useCallback(async (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, statut: "absent" as const } : t
    ))

    const { error } = await supabase
      .from("ticket")
      .update({ statut: "absent" })
      .eq("id", ticketId)

    if (error) {
      console.error("Erreur marquage absent BDD:", error)
      await fetchTickets()
      return
    }

    await fetchTickets()
  }, [fetchTickets])

  // Rappeler le patient — met à jour date_appel en BDD (nouveau timestamp d'appel)
  const recallPatient = useCallback(async (ticketId: string) => {
    const recalledAt = new Date()

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, calledAt: recalledAt } : t
    ))

    const { error } = await supabase
      .from("ticket")
      .update({ date_appel: recalledAt.toISOString() })
      .eq("id", ticketId)

    if (error) {
      console.error("Erreur rappel BDD:", error)
      await fetchTickets()
      return
    }

    await fetchTickets()
  }, [fetchTickets])

  // Terminer le service — persiste statut "completed" + date_fin en BDD
  const completeService = useCallback(async (ticketId: string) => {
    const counter = getAgentCounter()
    const completedAt = new Date()

    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, statut: "completed" as const, completedAt } : t
    ))

    const { error } = await supabase
      .from("ticket")
      .update({ 
        statut: "completed",
        date_fin: completedAt.toISOString(),
      })
      .eq("id", ticketId)

    if (error) {
      console.error("Erreur fin de service BDD:", error)
      await fetchTickets()
      return
    }

    if (counter) {
      setCounters(prev => prev.map(c => 
        c.id === counter.id ? { ...c, ticketsServed: c.ticketsServed + 1 } : c
      ))
      setAgents(prev => prev.map(a => 
        a.counterId === counter.id ? { ...a, ticketsServedToday: a.ticketsServedToday + 1 } : a
      ))
    }

    await fetchTickets()
  }, [getAgentCounter, fetchTickets])

  // Ouvrir/fermer le guichet — persiste en BDD
  const toggleCounter = useCallback(async (open: boolean) => {
    const counter = getAgentCounter()
    if (!counter) return

    setCounters(prev => prev.map(c => 
      c.id === counter.id ? { ...c, isActive: open } : c
    ))

    const { error } = await supabase
      .from("guichet")
      .update({ statut: open ? "Actif" : "Inactif" })
      .eq("id", counter.id)

    if (error) {
      console.error("Erreur changement statut guichet BDD:", error)
      await fetchCounters()
      return
    }

    await fetchCounters()
  }, [getAgentCounter, fetchCounters])

  // Actions Admin
  const createService = useCallback((service: Omit<Service, "id">): Service => {
    const newService: Service = { ...service, id: `s-${Date.now()}` }
    setServices(prev => [...prev, newService])
    return newService
  }, [])

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id))
    setCounters(prev => prev.filter(c => c.serviceId !== id))
  }, [])

  const createCounter = useCallback((counter: Omit<Counter, "id">): Counter => {
    const newCounter: Counter = { ...counter, id: `c-${Date.now()}` }
    setCounters(prev => [...prev, newCounter])
    return newCounter
  }, [])

  const updateCounter = useCallback((id: string, updates: Partial<Counter>) => {
    setCounters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const deleteCounter = useCallback((id: string) => {
    setCounters(prev => prev.filter(c => c.id !== id))
  }, [])

  const createAgent = useCallback((agent: Omit<Agent, "id">): Agent => {
    const newAgent: Agent = { ...agent, id: `a-${Date.now()}` }
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

    setCounters(prev => prev.map(c => 
      c.id === counterId ? { ...c, id_agent_actuel: agentId } : c
    ))
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { 
        ...a, 
        counterId, 
        counterName: counter.name,
        serviceId: counter.serviceId,
        serviceName: counter.serviceName 
      } : a
    ))
  }, [counters, agents])

  const unassignAgent = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    if (agent.counterId) {
      setCounters(prev => prev.map(c => 
        c.id === agent.counterId ? { ...c, id_agent_actuel: null, isActive: false } : c
      ))
    }
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { 
        ...a, 
        counterId: undefined, 
        counterName: undefined,
        serviceId: undefined,
        serviceName: undefined 
      } : a
    ))
  }, [agents])

  const getStatistics = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTickets = tickets.filter(t => new Date(t.createdAt) >= today)
    const completedToday = todayTickets.filter(t => t.statut === "completed")
    
    const totalWaitTime = completedToday.reduce((acc, t) => {
      if (t.calledAt && t.createdAt) {
        return acc + (new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime())
      }
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
    const { data, error } = await supabase
      .from("utilisateur")
      .select("*")
      .eq("id", userId)
      .single()

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
      if (event === 'SIGNED_IN' && session) {
        loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        currentTicket,
        setCurrentTicket,
        tickets,
        setTickets,
        fetchTickets,
        services,
        setServices,
        fetchServices,
        counters,
        fetchCounters,
        setCounters,
        agents,
        fetchAgents,
        setAgents,
        hospitalSettings,
        setHospitalSettings,
        loginAsRole,
        loginAsAgent,
        logout,
        takeTicket,
        cancelTicket,
        getPatientHistory,
        getActiveTickets,
        getCurrentAgent,
        getAgentCounter,
        getAgentQueue,
        callNextPatient,
        startConsultation,
        markAbsent,
        recallPatient,
        completeService,
        toggleCounter,
        createService,
        updateService,
        deleteService,
        createCounter,
        updateCounter,
        deleteCounter,
        isBusy,
        setIsBusy,
        createAgent,
        updateAgent,
        deleteAgent,
        assignAgentToCounter,
        unassignAgent,
        getStatistics,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}