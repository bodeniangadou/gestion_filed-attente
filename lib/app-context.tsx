"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"

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
  status: "waiting" | "called" | "serving" | "completed" | "absent" | "cancelled"
  position: number
  waitTime?: number
  totalInQueue: number
  createdAt: Date
  calledAt?: Date
  completedAt?: Date
}

export interface Counter {
  id: string
  name: string      // "Guichet A1"
  number: string    // Garde le numéro comme string (ex: "A1")
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
  est_banni: boolean;
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
  services: Service[]
  setServices: (services: Service[] | ((prev: Service[]) => Service[])) => void
  fetchServices: () => Promise<void>
  fetchCounters: () => Promise<void>
  counters: Counter[]
  setCounters: (counters: Counter[] | ((prev: Counter[]) => Counter[])) => void
  isBusy: boolean;
  setIsBusy: (value: boolean) => void;
  agents: Agent[]
  setAgents: (agents: Agent[] | ((prev: Agent[]) => Agent[])) => void
  fetchAgents: () => Promise<void>
  hospitalSettings: HospitalSettings
  setHospitalSettings: (settings: HospitalSettings) => void

  // Auth
  loginAsRole: (role: UserRole, name?: string, firstName?: string, email?: string) => void
  loginAsAgent: (agent: Agent) => void
  logout: () => void

  // Patient actions
  takeTicket: (service: Service, name: string, firstName: string, telephone: string) => Promise<Ticket>
  cancelTicket: (ticketId: string) => void
  getPatientHistory: () => Ticket[]
  getActiveTickets: () => Ticket[]

  // Agent actions
  getCurrentAgent: () => Agent | null
  getAgentCounter: () => Counter | null
  getAgentQueue: () => Ticket[]
  callNextPatient: () => Ticket | null
  markAbsent: (ticketId: string) => void
  recallPatient: (ticketId: string) => void
  completeService: (ticketId: string) => void
  toggleCounter: (open: boolean) => void
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

const defaultServices: Service[] = [
  { id: "s1", name: "Consultation Generale", description: "Medecine generale et premiers soins", icon: "stethoscope", waitTime: 15, currentQueue: 12, isActive: true, openTime: "08:00", closeTime: "17:00" },
  { id: "s2", name: "Urgences", description: "Services d'urgence 24h/24", icon: "siren", waitTime: 5, currentQueue: 3, isActive: true, openTime: "00:00", closeTime: "23:59" },
  { id: "s3", name: "Radiologie", description: "Imagerie medicale et radiographie", icon: "scan", waitTime: 25, currentQueue: 8, isActive: true, openTime: "08:00", closeTime: "17:00" },
  { id: "s4", name: "Laboratoire", description: "Analyses et prelevements", icon: "flask", waitTime: 20, currentQueue: 15, isActive: true, openTime: "07:00", closeTime: "18:00" },
  { id: "s5", name: "Pharmacie", description: "Retrait de medicaments", icon: "pill", waitTime: 10, currentQueue: 6, isActive: true, openTime: "08:00", closeTime: "20:00" },
  { id: "s6", name: "Cardiologie", description: "Consultations cardiaques", icon: "heart-pulse", waitTime: 30, currentQueue: 4, isActive: false, openTime: "09:00", closeTime: "16:00" },
]

const defaultCounters: Counter[] = [
  { id: "c1", name: "Guichet A1", number: 1, serviceId: "s1", serviceName: "Consultation Generale", agentId: "a1", agentName: "Mamadou Diallo", isActive: true, ticketsServed: 23 },
  { id: "c2", name: "Guichet A2", number: 2, serviceId: "s1", serviceName: "Consultation Generale", isActive: false, ticketsServed: 0 },
  { id: "c3", name: "Guichet B1", number: 1, serviceId: "s2", serviceName: "Urgences", agentId: "a2", agentName: "Fatou Traore", isActive: true, ticketsServed: 15 },
  { id: "c4", name: "Guichet C1", number: 1, serviceId: "s3", serviceName: "Radiologie", agentId: "a3", agentName: "Ibrahim Konate", isActive: true, ticketsServed: 18 },
  { id: "c5", name: "Guichet D1", number: 1, serviceId: "s4", serviceName: "Laboratoire", isActive: false, ticketsServed: 0 },
  { id: "c6", name: "Guichet E1", number: 1, serviceId: "s5", serviceName: "Pharmacie", isActive: true, ticketsServed: 32 },
]

const defaultAgents: Agent[] = [
  { id: "a1", name: "Diallo", firstName: "Mamadou", email: "m.diallo@hopitalmali.ml", role: "agent", counterId: "c1", counterName: "Guichet A1", serviceId: "s1", serviceName: "Consultation Generale", isOnline: true, ticketsServedToday: 23, est_banni: true },
  { id: "a2", name: "Traore", firstName: "Fatou", email: "f.traore@hopitalmali.ml", role: "agent", counterId: "c3", counterName: "Guichet B1", serviceId: "s2", serviceName: "Urgences", isOnline: true, ticketsServedToday: 15, est_banni: true },
  { id: "a3", name: "Konate", firstName: "Ibrahim", email: "i.konate@hopitalmali.ml", role: "agent", counterId: "c4", counterName: "Guichet C1", serviceId: "s3", serviceName: "Radiologie", isOnline: true, ticketsServedToday: 18, est_banni: true },
  { id: "a4", name: "Coulibaly", firstName: "Aminata", email: "a.coulibaly@hopitalmali.ml", role: "agent", isOnline: false, ticketsServedToday: 0, est_banni: true },
]

const defaultTickets: Ticket[] = [
  { id: "t1", number: "C001", service: defaultServices[0], counterId: "c1", counterName: "Guichet A1", userId: "p1", userName: "Aminata Keita", status: "waiting", position: 1, totalInQueue: 12, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
  { id: "t2", number: "C002", service: defaultServices[0], counterId: "c1", counterName: "Guichet A1", userId: "p2", userName: "Boubacar Sidibe", status: "waiting", position: 2, totalInQueue: 12, createdAt: new Date(Date.now() - 1000 * 60 * 25) },
  { id: "t3", number: "C003", service: defaultServices[0], counterId: "c1", counterName: "Guichet A1", userId: "p3", userName: "Fatoumata Diarra", status: "waiting", position: 3, totalInQueue: 12, createdAt: new Date(Date.now() - 1000 * 60 * 20) },
  { id: "t4", number: "U001", service: defaultServices[1], counterId: "c3", counterName: "Guichet B1", userId: "p4", userName: "Moussa Sangare", status: "waiting", position: 1, totalInQueue: 3, createdAt: new Date(Date.now() - 1000 * 60 * 10) },
  { id: "t5", number: "R001", service: defaultServices[2], counterId: "c4", counterName: "Guichet C1", userId: "p5", userName: "Kadiatou Toure", status: "called", position: 0, totalInQueue: 8, createdAt: new Date(Date.now() - 1000 * 60 * 45), calledAt: new Date(Date.now() - 1000 * 60 * 5) },
]

const defaultHospitalSettings: HospitalSettings = {
  name: "Hopital du Mali",
  openTime: "07:00",
  closeTime: "20:00",
  autoCloseServices: true,
  maxQueuePerService: 50,
  allowAnonymousTickets: true,
  voiceAnnouncements: true,
}

const AppContext = createContext<AppContextType | undefined>(undefined)
import { useEffect } from "react"
import { supabase } from "@/lib/supabase";
export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("app-user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [isBusy, setIsBusy] = useState(false);
  useEffect(() => {
    if (user) {
      localStorage.setItem("app-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("app-user");
    }
  }, [user]);
  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase.from("service").select("*");
    if (error) {
      console.error("Erreur chargement services:", error);
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
      }));
      setServices(mappedServices);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service' },
        () => {
          fetchServices();
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices]);
  const fetchCounters = useCallback(async () => {
    const { data, error } = await supabase
      .from("guichet")
      .select("*, service(nom)");

    if (error) {
      console.error("Erreur chargement guichets:", error);
    } else if (data) {
      const formattedCounters: Counter[] = data.map((g: any) => ({
        id: g.id,
        name: g.numero,        // "A1"
        number: g.numero,      // Garde la chaîne de caractères telle quelle
        serviceId: g.id_service,
        serviceName: g.service?.nom || "Non assigné",
        id_agent_actuel: g.id_agent_actuel,
        isActive: g.statut === 'Actif',
        ticketsServed: 0
      }));
      setCounters(formattedCounters);
    }
  }, []);
  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from("utilisateur")
      .select("*")
      .eq("role", "agent");

    if (error) {
      console.error("Erreur chargement agents:", error);
      return;
    }

    if (data) {
      const mappedAgents: Agent[] = data.map((u: any) => ({
        id: u.id,
        name: u.nom?.split(' ')[1] || "",
        firstName: u.nom?.split(' ')[0] || "",
        email: u.email,
        telephone: u.telephone,
        role: "agent",
        isOnline: u.disponibilite ?? true,
        est_banni: u.est_banni ?? false, // Garantir une valeur par défaut
        ticketsServedToday: 0
      }));
      setAgents(mappedAgents);
    }
  }, []);
  useEffect(() => {
    fetchServices();
    fetchCounters();
    fetchAgents();


    const channelAgents = supabase.channel('schema-agents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'utilisateur' }, () => {
        fetchAgents();
      })
      .subscribe();

    const channelServices = supabase.channel('schema-services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service' }, () => {
        fetchServices();
      })
      .subscribe();

    const channelCounters = supabase.channel('schema-guichets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guichet' }, () => {
        fetchCounters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelServices);
      supabase.removeChannel(channelCounters);
      supabase.removeChannel(channelAgents);
    };
  }, [fetchServices, fetchCounters, fetchAgents]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(defaultTickets)
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(defaultHospitalSettings)
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

  // Patient functions
  const takeTicket = useCallback(async (service: Service, name: string, firstName: string, telephone: string) => {
    // 1. Filtrer les tickets en attente pour ce service spécifique
    const serviceTickets = tickets.filter(t => t.service.id === service.id && t.status === "waiting")
    const position = serviceTickets.length + 1

    // Génération du numéro (Ex: R-005)
    const ticketPrefix = service.name.charAt(0).toUpperCase()
    const ticketNumber = `${ticketPrefix}${String(position).padStart(3, "0")}`

    // 2. LOGIQUE DU GUICHET : Trouver tous les guichets actifs pour ce service
    // On ajoute (c as any) pour court-circuiter la vérification stricte de TypeScript
    const activeCounters = counters.filter(c => c.serviceId === service.id && c.isActive && (c as any).agentId)
    let assignedCounter = undefined

    if (activeCounters.length > 0) {
      // Trouver le guichet qui a le MOINS de tickets assignés en attente
      assignedCounter = activeCounters.reduce((prev, current) => {
        const prevCount = tickets.filter(t => t.counterId === prev.id && t.status === "waiting").length
        const currentCount = tickets.filter(t => t.counterId === current.id && t.status === "waiting").length
        return prevCount <= currentCount ? prev : current
      })
    }

    const userId = user?.id || `visitor-${Date.now()}`

    // 3. Création de l'objet Ticket complet
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      number: ticketNumber,
      service,
      counterId: assignedCounter?.id,
      counterName: assignedCounter?.name,
      userId: userId,
      userName: `${firstName} ${name}`,
      status: "waiting",
      position,
      totalInQueue: position,
      createdAt: new Date(),
    }

    // 4. SAUVEGARDE EN BASE DE DONNÉES (SUPABASE) 🚀
    try {
      const { error } = await supabase
        .from('ticket') 
        .insert([
          {
            id: crypto.randomUUID(), 
            code: newTicket.number, 
            patient_nom: newTicket.userName, 
            statut: "En attente", 
            id_guichet: newTicket.counterId || null, 
            id_service: service.id 
          }
        ])

      if (error) console.error("Erreur d'insertion Supabase :", error.message)
    } catch (err) {
      console.error("Erreur réseau Supabase :", err)
    }

    if (!user) {
      const anonymousUser = {
        id: userId,
        name,
        firstName,
        role: "patient" as const, // 👈 Le "as const" règle l'erreur de UserRole !
        telephone
      }

      localStorage.setItem("rang_plus_user", JSON.stringify(anonymousUser))
      localStorage.setItem("rang_plus_anonymous_ticket", JSON.stringify({
        number: newTicket.number,
        service: service.name,
        waitTime: service.waitTime,
        queuePos: position
      }))

      if (typeof setUser === "function") {
        // Si ça râle encore à cause d'une propriété manquante dans l'objet User, on le passe "as any" temporairement pour la soutenance
        setUser(anonymousUser as any)
      }
    }

    // 6. Mise à jour des états locaux du Context
    setTickets(prev => [...prev, newTicket])
    setCurrentTicket(newTicket)

    setServices(prev => prev.map(s =>
      s.id === service.id ? { ...s, currentQueue: s.currentQueue + 1 } : s
    ))

    return newTicket
  }, [tickets, counters, user])

  const cancelTicket = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: "cancelled" as const } : t
    ))
    if (currentTicket?.id === ticketId) {
      setCurrentTicket(null)
    }
  }, [currentTicket])

  const getPatientHistory = useCallback(() => {
    if (!user) return []
    return tickets.filter(t => t.userId === user.id)
  }, [tickets, user])

  const getActiveTickets = useCallback(() => {
    if (!user) return []
    return tickets.filter(t =>
      t.userId === user.id &&
      (t.status === "waiting" || t.status === "called" || t.status === "serving")
    )
  }, [tickets, user])


  const getCurrentAgent = useCallback(() => {
    if (!user || user.role !== "agent") return null
    return agents.find(a => a.id === user.id) || null
  }, [user, agents])

  const getAgentCounter = useCallback(() => {
    const agent = getCurrentAgent()
    if (!agent?.counterId) return null
    return counters.find(c => c.id === agent.counterId) || null
  }, [getCurrentAgent, counters])

  const getAgentQueue = useCallback(() => {
    const counter = getAgentCounter()
    if (!counter) return []
    return tickets.filter(t =>
      t.service.id === counter.serviceId &&
      t.status === "waiting"
    ).sort((a, b) => a.position - b.position)
  }, [getAgentCounter, tickets])

  const callNextPatient = useCallback(() => {
    const queue = getAgentQueue()
    const counter = getAgentCounter()
    if (queue.length === 0 || !counter) return null

    const nextTicket = queue[0]
    const updatedTicket: Ticket = {
      ...nextTicket,
      status: "called",
      calledAt: new Date(),
      position: 0,
      counterId: counter.id,
      counterName: counter.name,
    }

    setTickets(prev => prev.map(t =>
      t.id === nextTicket.id ? updatedTicket : t
    ))

    setCounters(prev => prev.map(c =>
      c.id === counter.id ? { ...c, currentTicket: updatedTicket } : c
    ))


    setTickets(prev => prev.map(t => {
      if (t.service.id === counter.serviceId && t.status === "waiting" && t.position > nextTicket.position) {
        return { ...t, position: t.position - 1 }
      }
      return t
    }))

    return updatedTicket
  }, [getAgentQueue, getAgentCounter])

  const markAbsent = useCallback((ticketId: string) => {
    const counter = getAgentCounter()
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: "absent" as const } : t
    ))
    if (counter) {
      setCounters(prev => prev.map(c =>
        c.id === counter.id ? { ...c, currentTicket: undefined } : c
      ))
    }
  }, [getAgentCounter])

  const recallPatient = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, calledAt: new Date() } : t
    ))
  }, [])

  const completeService = useCallback((ticketId: string) => {
    const counter = getAgentCounter()
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: "completed" as const, completedAt: new Date() } : t
    ))
    if (counter) {
      setCounters(prev => prev.map(c =>
        c.id === counter.id ? { ...c, currentTicket: undefined, ticketsServed: c.ticketsServed + 1 } : c
      ))
      setAgents(prev => prev.map(a =>
        a.counterId === counter.id ? { ...a, ticketsServedToday: a.ticketsServedToday + 1 } : a
      ))
    }
  }, [getAgentCounter])

  const toggleCounter = useCallback((open: boolean) => {
    const counter = getAgentCounter()
    if (!counter) return
    setCounters(prev => prev.map(c =>
      c.id === counter.id ? { ...c, isActive: open } : c
    ))
  }, [getAgentCounter])

  const createService = useCallback((service: Omit<Service, "id">): Service => {
    const newService: Service = {
      ...service,
      id: `s-${Date.now()}`,
    }
    setServices(prev => [...prev, newService])
    return newService
  }, [])

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ))
  }, [])

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id))
    setCounters(prev => prev.filter(c => c.serviceId !== id))
  }, [])

  const createCounter = useCallback((counter: Omit<Counter, "id">): Counter => {
    const newCounter: Counter = {
      ...counter,
      id: `c-${Date.now()}`,
    }
    setCounters(prev => [...prev, newCounter])
    return newCounter
  }, [])

  const updateCounter = useCallback((id: string, updates: Partial<Counter>) => {
    setCounters(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }, [])

  const deleteCounter = useCallback((id: string) => {
    const counter = counters.find(c => c.id === id)
    if (counter?.agentId) {
      setAgents(prev => prev.map(a =>
        a.id === counter.agentId ? { ...a, counterId: undefined, counterName: undefined } : a
      ))
    }
    setCounters(prev => prev.filter(c => c.id !== id))
  }, [counters])

  const createAgent = useCallback((agent: Omit<Agent, "id">): Agent => {
    const newAgent: Agent = {
      ...agent,
      id: `a-${Date.now()}`,
    }
    setAgents(prev => [...prev, newAgent])
    return newAgent
  }, [])

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, ...updates } : a
    ))
  }, [])

  const deleteAgent = useCallback((id: string) => {
    const agent = agents.find(a => a.id === id)
    if (agent?.counterId) {
      setCounters(prev => prev.map(c =>
        c.id === agent.counterId ? { ...c, agentId: undefined, agentName: undefined } : c
      ))
    }
    setAgents(prev => prev.filter(a => a.id !== id))
  }, [agents])

  const assignAgentToCounter = useCallback((agentId: string, counterId: string) => {
    const counter = counters.find(c => c.id === counterId)
    const agent = agents.find(a => a.id === agentId)
    if (!counter || !agent) return

    // Remove agent from previous counter
    if (agent.counterId) {
      setCounters(prev => prev.map(c =>
        c.id === agent.counterId ? { ...c, agentId: undefined, agentName: undefined } : c
      ))
    }

    // Assign to new counter
    setCounters(prev => prev.map(c =>
      c.id === counterId ? { ...c, agentId, agentName: `${agent.firstName} ${agent.name}` } : c
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
        c.id === agent.counterId ? { ...c, agentId: undefined, agentName: undefined, isActive: false } : c
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
    const completedToday = todayTickets.filter(t => t.status === "completed")

    const totalWaitTime = completedToday.reduce((acc, t) => {
      if (t.calledAt && t.createdAt) {
        return acc + (new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime())
      }
      return acc
    }, 0)

    return {
      totalPatients: tickets.filter(t => t.status === "waiting").length,
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
      .single();

    if (data && !error) {
      setUser({
        id: data.id,
        email: data.email,
        firstName: data.nom.split(' ')[0] || "",
        name: data.nom.split(' ')[1] || "",
        role: data.role as UserRole,
        photo: data.photo_url || "",
        phone: data.telephone || "",
      });
    }
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);
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
