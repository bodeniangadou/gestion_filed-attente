"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { supabase } from "@/lib/supabase";

// ---- Types ----
export type UserRole = "visitor" | "patient" | "agent" | "admin";

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photo?: string;
  role: UserRole;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  waitTime: number;
  currentQueue: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
}

export interface Ticket {
  id: string;
  number: string;
  service: Service;
  counterId?: string;
  counterName?: string;
  userId: string;
  userName: string;
  status:
    | "waiting"
    | "called"
    | "serving"
    | "completed"
    | "absent"
    | "cancelled";
  position: number;
  waitTime?: number;
  totalInQueue: number;
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
}

export interface Counter {
  id: string;
  name: string;
  number: string;
  serviceId: string;
  serviceName: string;
  id_agent_actuel?: string | null;
  isActive: boolean;
  ticketsServed: number;
}

export interface Agent extends User {
  counterId?: string;
  counterName?: string;
  serviceId?: string;
  serviceName?: string;
  isOnline: boolean;
  est_banni: boolean;
  ticketsServedToday: number;
}

export interface HospitalSettings {
  name: string;
  openTime: string;
  closeTime: string;
  autoCloseServices: boolean;
  maxQueuePerService: number;
  allowAnonymousTickets: boolean;
  voiceAnnouncements: boolean;
}

// ---- Interface du contexte ----
interface AppContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  currentTicket: Ticket | null;
  setCurrentTicket: (ticket: Ticket | null) => void;
  tickets: Ticket[];
  setTickets: (tickets: Ticket[] | ((prev: Ticket[]) => Ticket[])) => void;
  services: Service[];
  setServices: (services: Service[] | ((prev: Service[]) => Service[])) => void;
  fetchServices: () => Promise<void>;
  fetchCounters: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  counters: Counter[];
  setCounters: (counters: Counter[] | ((prev: Counter[]) => Counter[])) => void;
  isBusy: boolean;
  setIsBusy: (value: boolean) => void;
  agents: Agent[];
  setAgents: (agents: Agent[] | ((prev: Agent[]) => Agent[])) => void;
  fetchAgents: () => Promise<void>;
  hospitalSettings: HospitalSettings;
  setHospitalSettings: (settings: HospitalSettings) => void;

  // Auth
  loginAsRole: (
    role: UserRole,
    name?: string,
    firstName?: string,
    email?: string,
  ) => void;
  loginAsAgent: (agent: Agent) => void;
  logout: () => void;

  // Patient
  takeTicket: (
    service: Service,
    name: string,
    firstName: string,
  ) => Promise<Ticket>;
  cancelTicket: (ticketId: string) => void;
  getPatientHistory: () => Ticket[];
  getActiveTickets: () => Ticket[];

  // Agent
  getCurrentAgent: () => Agent | null;
  getAgentCounter: () => Counter | null;
  getAgentQueue: () => Ticket[];
  callNextPatient: () => Promise<Ticket | null>;
  startServing: (ticketId: string) => Promise<void>;
  markAbsent: (ticketId: string) => Promise<void>;
  recallPatient: (ticketId: string) => Promise<void>;
  completeService: (ticketId: string) => Promise<void>;
  toggleCounter: (open: boolean) => Promise<void>;

  // Admin
  createService: (service: Omit<Service, "id">) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  createCounter: (counter: Omit<Counter, "id">) => Counter;
  updateCounter: (id: string, updates: Partial<Counter>) => void;
  deleteCounter: (id: string) => void;
  createAgent: (agent: Omit<Agent, "id">) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  assignAgentToCounter: (agentId: string, counterId: string) => void;
  unassignAgent: (agentId: string) => void;
  getStatistics: () => {
    totalPatients: number;
    avgWaitTime: number;
    activeServices: number;
    activeCounters: number;
    ticketsToday: number;
    ticketsCompleted: number;
  };
}

// ---- Données par défaut ----
const defaultServices: Service[] = [
  {
    id: "s1",
    name: "Consultation Generale",
    description: "Medecine generale et premiers soins",
    icon: "stethoscope",
    waitTime: 15,
    currentQueue: 12,
    isActive: true,
    openTime: "08:00",
    closeTime: "17:00",
  },
  {
    id: "s2",
    name: "Urgences",
    description: "Services d'urgence 24h/24",
    icon: "siren",
    waitTime: 5,
    currentQueue: 3,
    isActive: true,
    openTime: "00:00",
    closeTime: "23:59",
  },
  {
    id: "s3",
    name: "Radiologie",
    description: "Imagerie medicale et radiographie",
    icon: "scan",
    waitTime: 25,
    currentQueue: 8,
    isActive: true,
    openTime: "08:00",
    closeTime: "17:00",
  },
  {
    id: "s4",
    name: "Laboratoire",
    description: "Analyses et prelevements",
    icon: "flask",
    waitTime: 20,
    currentQueue: 15,
    isActive: true,
    openTime: "07:00",
    closeTime: "18:00",
  },
  {
    id: "s5",
    name: "Pharmacie",
    description: "Retrait de medicaments",
    icon: "pill",
    waitTime: 10,
    currentQueue: 6,
    isActive: true,
    openTime: "08:00",
    closeTime: "20:00",
  },
  {
    id: "s6",
    name: "Cardiologie",
    description: "Consultations cardiaques",
    icon: "heart-pulse",
    waitTime: 30,
    currentQueue: 4,
    isActive: false,
    openTime: "09:00",
    closeTime: "16:00",
  },
];

const defaultCounters: Counter[] = [
  {
    id: "c1",
    name: "Guichet A1",
    number: "A1",
    serviceId: "s1",
    serviceName: "Consultation Generale",
    id_agent_actuel: "a1",
    isActive: true,
    ticketsServed: 23,
  },
  {
    id: "c2",
    name: "Guichet A2",
    number: "A2",
    serviceId: "s1",
    serviceName: "Consultation Generale",
    isActive: false,
    ticketsServed: 0,
  },
  {
    id: "c3",
    name: "Guichet B1",
    number: "B1",
    serviceId: "s2",
    serviceName: "Urgences",
    id_agent_actuel: "a2",
    isActive: true,
    ticketsServed: 15,
  },
  {
    id: "c4",
    name: "Guichet C1",
    number: "C1",
    serviceId: "s3",
    serviceName: "Radiologie",
    id_agent_actuel: "a3",
    isActive: true,
    ticketsServed: 18,
  },
  {
    id: "c5",
    name: "Guichet D1",
    number: "D1",
    serviceId: "s4",
    serviceName: "Laboratoire",
    isActive: false,
    ticketsServed: 0,
  },
  {
    id: "c6",
    name: "Guichet E1",
    number: "E1",
    serviceId: "s5",
    serviceName: "Pharmacie",
    isActive: true,
    ticketsServed: 32,
  },
];

const defaultAgents: Agent[] = [
  {
    id: "a1",
    name: "Diallo",
    firstName: "Mamadou",
    email: "m.diallo@hopitalmali.ml",
    role: "agent",
    counterId: "c1",
    counterName: "Guichet A1",
    serviceId: "s1",
    serviceName: "Consultation Generale",
    isOnline: true,
    ticketsServedToday: 23,
    est_banni: false,
  },
  {
    id: "a2",
    name: "Traore",
    firstName: "Fatou",
    email: "f.traore@hopitalmali.ml",
    role: "agent",
    counterId: "c3",
    counterName: "Guichet B1",
    serviceId: "s2",
    serviceName: "Urgences",
    isOnline: true,
    ticketsServedToday: 15,
    est_banni: false,
  },
  {
    id: "a3",
    name: "Konate",
    firstName: "Ibrahim",
    email: "i.konate@hopitalmali.ml",
    role: "agent",
    counterId: "c4",
    counterName: "Guichet C1",
    serviceId: "s3",
    serviceName: "Radiologie",
    isOnline: true,
    ticketsServedToday: 18,
    est_banni: false,
  },
  {
    id: "a4",
    name: "Coulibaly",
    firstName: "Aminata",
    email: "a.coulibaly@hopitalmali.ml",
    role: "agent",
    isOnline: false,
    ticketsServedToday: 0,
    est_banni: false,
  },
];

const defaultTickets: Ticket[] = [
  {
    id: "t1",
    number: "C001",
    service: defaultServices[0],
    counterId: "c1",
    counterName: "Guichet A1",
    userId: "p1",
    userName: "Aminata Keita",
    status: "waiting",
    position: 1,
    totalInQueue: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "t2",
    number: "C002",
    service: defaultServices[0],
    counterId: "c1",
    counterName: "Guichet A1",
    userId: "p2",
    userName: "Boubacar Sidibe",
    status: "waiting",
    position: 2,
    totalInQueue: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: "t3",
    number: "C003",
    service: defaultServices[0],
    counterId: "c1",
    counterName: "Guichet A1",
    userId: "p3",
    userName: "Fatoumata Diarra",
    status: "waiting",
    position: 3,
    totalInQueue: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: "t4",
    number: "U001",
    service: defaultServices[1],
    counterId: "c3",
    counterName: "Guichet B1",
    userId: "p4",
    userName: "Moussa Sangare",
    status: "waiting",
    position: 1,
    totalInQueue: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "t5",
    number: "R001",
    service: defaultServices[2],
    counterId: "c4",
    counterName: "Guichet C1",
    userId: "p5",
    userName: "Kadiatou Toure",
    status: "called",
    position: 0,
    totalInQueue: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    calledAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

const defaultHospitalSettings: HospitalSettings = {
  name: "Hopital du Mali",
  openTime: "07:00",
  closeTime: "20:00",
  autoCloseServices: true,
  maxQueuePerService: 50,
  allowAnonymousTickets: true,
  voiceAnnouncements: true,
};

// ---- Contexte ----
const AppContext = createContext<AppContextType | undefined>(undefined);

// ---- Provider ----
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
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(defaultTickets);
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [counters, setCounters] = useState<Counter[]>(defaultCounters);
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(
    defaultHospitalSettings,
  );

  // Persistance user
  useEffect(() => {
    if (user) {
      localStorage.setItem("app-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("app-user");
    }
  }, [user]);

  // ---- Fonctions de chargement ----
  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("service").select("*");
      if (error) {
        console.warn(
          "Erreur Supabase, utilisation des services par défaut:",
          error,
        );
        setServices(defaultServices);
      } else if (data && data.length > 0) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          name: s.nom,
          description: s.description || "",
          icon: s.icon || "LayoutGrid",
          waitTime: s.wait_time || 0,
          currentQueue: s.current_queue || 0,
          isActive: s.is_active || false,
          openTime: s.open_time || "08:00",
          closeTime: s.close_time || "17:00",
        }));
        setServices(mapped);
      } else {
        setServices(defaultServices);
      }
    } catch (err) {
      console.warn("Erreur réseau, utilisation des services par défaut:", err);
      setServices(defaultServices);
    }
    setIsLoading(false);
  }, []);

  const fetchCounters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("guichet")
        .select("*, service(nom)");
      if (error) {
        console.warn(
          "Erreur Supabase, utilisation des guichets par défaut:",
          error,
        );
        setCounters(defaultCounters);
      } else if (data && data.length > 0) {
        const mapped = data.map((g: any) => ({
          id: g.id,
          name: g.numero,
          number: g.numero,
          serviceId: g.id_service,
          serviceName: g.service?.nom || "Non assigné",
          id_agent_actuel: g.id_agent_actuel,
          isActive: g.statut === "Actif",
          ticketsServed: g.tickets_served || 0,
        }));
        setCounters(mapped);
      } else {
        setCounters(defaultCounters);
      }
    } catch (err) {
      console.warn("Erreur réseau, utilisation des guichets par défaut:", err);
      setCounters(defaultCounters);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("utilisateur")
        .select(
          `
          *,
          guichet_assigné:guichet!id_agent_actuel (
            id,
            numero,
            id_service,
            service:service (nom)
          )
        `,
        )
        .eq("role", "agent");
      if (error) {
        console.warn(
          "Erreur Supabase, utilisation des agents par défaut:",
          error,
        );
        setAgents(defaultAgents);
      } else if (data && data.length > 0) {
        const mapped = data.map((u: any) => {
          const guichet = u.guichet_assigné?.[0];
          return {
            id: u.id,
            name: u.nom?.split(" ")[1] || "",
            firstName: u.nom?.split(" ")[0] || "",
            email: u.email,
            telephone: u.telephone,
            role: "agent" as UserRole,
            isOnline: u.disponibilite ?? true,
            est_banni: u.est_banni ?? false,
            ticketsServedToday: 0,
            counterId: guichet?.id || undefined,
            counterName: guichet ? `Guichet ${guichet.numero}` : undefined,
            serviceId: guichet?.id_service || undefined,
            serviceName: guichet?.service?.nom || undefined,
          };
        });
        setAgents(mapped);
      } else {
        setAgents(defaultAgents);
      }
    } catch (err) {
      console.warn("Erreur réseau, utilisation des agents par défaut:", err);
      setAgents(defaultAgents);
    }
  }, []);

  // ---- fetchTickets simplifiée ----
  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ticket")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement tickets:", error);
        return;
      }

      if (data && data.length > 0) {
        const mappedTickets: Ticket[] = data.map((t: any) => {
          const service = services.find((s) => s.id === t.id_service);
          const guichet = counters.find((c) => c.id === t.id_guichet);

          return {
            id: t.id,
            number: t.code || "",
            service: service || defaultServices[0],
            counterId: guichet?.id || undefined,
            counterName: guichet?.name || undefined,
            userId: t.id_patient_connecte || "",
            userName: t.patient_nom || "",
            status: t.statut || "waiting",
            position: t.position || 0,
            waitTime: t.wait_time || 0,
            totalInQueue: t.total_in_queue || 0,
            createdAt: new Date(t.created_at),
            calledAt: t.date_appel ? new Date(t.date_appel) : undefined,
            completedAt: t.date_fin ? new Date(t.date_fin) : undefined,
          };
        });
        setTickets(mappedTickets);
      }
    } catch (err) {
      console.error("Erreur réseau lors du chargement des tickets:", err);
    }
  }, [services, counters]);

  // ---- Chargement initial ----
  useEffect(() => {
    if (user) {
      Promise.all([fetchServices(), fetchCounters(), fetchAgents()])
        .then(() => fetchTickets())
        .catch((err) =>
          console.error("Erreur lors du chargement initial:", err),
        );
    } else {
      setIsLoading(false);
    }
  }, [user, fetchServices, fetchCounters, fetchAgents, fetchTickets]);

  // ---- Rechargement sur changement d'auth ----
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        loadUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setServices(defaultServices);
        setCounters(defaultCounters);
        setAgents(defaultAgents);
        setTickets(defaultTickets);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("utilisateur")
        .select("*")
        .eq("id", userId)
        .single();
      if (data && !error) {
        setUser({
          id: data.id,
          email: data.email,
          firstName: data.nom?.split(" ")[0] || "",
          name: data.nom?.split(" ")[1] || "",
          role: data.role as UserRole,
          photo: data.photo_url || "",
          phone: data.telephone || "",
        });
      }
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    }
  }, []);

  // ---- Auth ----
  const loginAsRole = useCallback(
    (role: UserRole, name?: string, firstName?: string, email?: string) => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name:
          name ||
          (role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Patient"),
        firstName:
          firstName ||
          (role === "admin" ? "Super" : role === "agent" ? "Mamadou" : ""),
        email: email || (role === "admin" ? "admin@hopitalmali.ml" : undefined),
        role,
      };
      setUser(newUser);
    },
    [],
  );

  const loginAsAgent = useCallback((agent: Agent) => {
    setUser(agent);
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, isOnline: true } : a)),
    );
  }, []);

  const logout = useCallback(() => {
    if (user?.role === "agent") {
      setAgents((prev) =>
        prev.map((a) => (a.id === user.id ? { ...a, isOnline: false } : a)),
      );
    }
    setUser(null);
    setCurrentTicket(null);
    setServices(defaultServices);
    setCounters(defaultCounters);
    setAgents(defaultAgents);
    setTickets(defaultTickets);
  }, [user]);

  // ---- Patient ----
  const takeTicket = useCallback(
    async (
      service: Service,
      name: string,
      firstName: string,
    ): Promise<Ticket> => {
      const serviceTickets = tickets.filter(
        (t) => t.service.id === service.id && t.status === "waiting",
      );
      const position = serviceTickets.length + 1;
      const ticketPrefix = service.name.charAt(0).toUpperCase();
      const ticketNumber = `${ticketPrefix}${String(position).padStart(3, "0")}`;

      const availableCounter = counters.find(
        (c) => c.serviceId === service.id && c.isActive && c.id_agent_actuel,
      );

      const tempId = `temp-${Date.now()}`;
      const newTicket: Ticket = {
        id: tempId,
        number: ticketNumber,
        service,
        counterId: availableCounter?.id,
        counterName: availableCounter?.name,
        userId: user?.id || `visitor-${Date.now()}`,
        userName: `${firstName} ${name}`.trim() || "Patient inconnu",
        status: "waiting",
        position,
        totalInQueue: position,
        createdAt: new Date(),
      };

      setTickets((prev) => [...prev, newTicket]);
      setCurrentTicket(newTicket);

      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, currentQueue: s.currentQueue + 1 } : s,
        ),
      );

      if (!user) {
        setUser({ id: newTicket.userId, name, firstName, role: "patient" });
      }

      const insertData = {
        code: ticketNumber,
        patient_nom: newTicket.userName, // ✅ utilisation de newTicket.userName (avec fallback)
        statut: "waiting",
        position: position,
        created_at: newTicket.createdAt.toISOString(),
        id_service: service.id,
        id_guichet: availableCounter?.id || null,
        id_patient_connecte: user?.id || null,
        telephone_patient: user?.phone || null,
      };

      console.log("🟢 Données à insérer :", insertData);

      const { data, error } = await supabase
        .from("ticket")
        .insert(insertData)
        .select();

      if (error) {
        console.error("❌ Erreur complète :", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          raw: error,
        });
        setTickets((prev) => prev.filter((t) => t.id !== tempId));
        throw new Error(`Erreur base de données : ${error.message}`);
      }

      const insertedTicket = data?.[0];
      if (!insertedTicket)
        throw new Error("Aucune donnée retournée après insertion");

      const realId = insertedTicket.id;
      console.log("✅ Ticket inséré avec ID :", realId);

      setTickets((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t)),
      );
      if (currentTicket?.id === tempId) {
        setCurrentTicket((prev) => (prev ? { ...prev, id: realId } : null));
      }

      await supabase
        .from("service")
        .update({ current_queue: service.currentQueue + 1 })
        .eq("id", service.id);

      return { ...newTicket, id: realId };
    },
    [tickets, counters, user, currentTicket],
  );

  const cancelTicket = useCallback(
    (ticketId: string) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: "cancelled" as const } : t,
        ),
      );
      if (currentTicket?.id === ticketId) setCurrentTicket(null);
      supabase
        .from("ticket")
        .update({ statut: "cancelled" })
        .eq("id", ticketId);
    },
    [currentTicket],
  );

  const getPatientHistory = useCallback(() => {
    if (!user) return [];
    return tickets.filter((t) => t.userId === user.id);
  }, [tickets, user]);

  const getActiveTickets = useCallback(() => {
    if (!user) return [];
    return tickets.filter(
      (t) =>
        t.userId === user.id &&
        (t.status === "waiting" ||
          t.status === "called" ||
          t.status === "serving"),
    );
  }, [tickets, user]);

  // ---- Agent ----
  const getCurrentAgent = useCallback(() => {
    if (!user || user.role !== "agent") return null;
    return agents.find((a) => a.id === user.id) || null;
  }, [user, agents]);

  const getAgentCounter = useCallback(() => {
    const agent = getCurrentAgent();
    if (!agent?.counterId) return null;
    return counters.find((c) => c.id === agent.counterId) || null;
  }, [getCurrentAgent, counters]);

  const getAgentQueue = useCallback(() => {
    const counter = getAgentCounter();
    if (!counter) return [];
    return tickets
      .filter(
        (t) => t.service.id === counter.serviceId && t.status === "waiting",
      )
      .sort((a, b) => a.position - b.position);
  }, [getAgentCounter, tickets]);

  const callNextPatient = useCallback(async () => {
    const queue = getAgentQueue();
    const counter = getAgentCounter();
    if (queue.length === 0 || !counter) return null;

    const nextTicket = queue[0];
    const updatedTicket: Ticket = {
      ...nextTicket,
      status: "called",
      calledAt: new Date(),
      position: 0,
      counterId: counter.id,
      counterName: counter.name,
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === nextTicket.id ? updatedTicket : t)),
    );

    const { error } = await supabase
      .from("ticket")
      .update({
        statut: "called",
        date_appel: new Date().toISOString(),
        position: 0,
        id_guichet: counter.id,
      })
      .eq("id", nextTicket.id);

    if (error) {
      console.error("Erreur lors de l'appel du patient:", error);
      setTickets((prev) =>
        prev.map((t) => (t.id === nextTicket.id ? nextTicket : t)),
      );
      return null;
    }

    const autresTickets = queue.slice(1);
    for (const ticket of autresTickets) {
      await supabase
        .from("ticket")
        .update({ position: ticket.position - 1 })
        .eq("id", ticket.id);
    }

    return updatedTicket;
  }, [getAgentQueue, getAgentCounter]);

  // ---- startServing ----
  const startServing = useCallback(async (ticketId: string) => {
    // Mise à jour locale
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: "serving" as const } : t,
      ),
    );

    // Mise à jour en base
    const { error } = await supabase
      .from("ticket")
      .update({ statut: "serving" })
      .eq("id", ticketId);

    if (error) {
      console.error("Erreur lors du démarrage de la consultation:", error);
      // Revenir en arrière
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: "called" as const } : t,
        ),
      );
    }
  }, []);

  // ---- Autres fonctions agent ----
  const markAbsent = useCallback(
    async (ticketId: string) => {
      const counter = getAgentCounter();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: "absent" as const } : t,
        ),
      );
      if (counter) {
        setCounters((prev) =>
          prev.map((c) =>
            c.id === counter.id ? { ...c, currentTicket: undefined } : c,
          ),
        );
      }
      const { error } = await supabase
        .from("ticket")
        .update({ statut: "absent" })
        .eq("id", ticketId);
      if (error) console.error("Erreur lors du marquage absent:", error);
    },
    [getAgentCounter],
  );

  const recallPatient = useCallback(async (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, calledAt: new Date() } : t)),
    );
    await supabase
      .from("ticket")
      .update({ date_appel: new Date().toISOString() })
      .eq("id", ticketId);
  }, []);

  const completeService = useCallback(
    async (ticketId: string) => {
      const counter = getAgentCounter();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "completed" as const, completedAt: new Date() }
            : t,
        ),
      );
      if (counter) {
        setCounters((prev) =>
          prev.map((c) =>
            c.id === counter.id
              ? {
                  ...c,
                  currentTicket: undefined,
                  ticketsServed: c.ticketsServed + 1,
                }
              : c,
          ),
        );
        setAgents((prev) =>
          prev.map((a) =>
            a.counterId === counter.id
              ? { ...a, ticketsServedToday: a.ticketsServedToday + 1 }
              : a,
          ),
        );
      }
      const { error } = await supabase
        .from("ticket")
        .update({ statut: "completed", date_fin: new Date().toISOString() })
        .eq("id", ticketId);
      if (error) console.error("Erreur lors de la complétion:", error);
      if (counter) {
        await supabase
          .from("guichet")
          .update({ tickets_served: counter.ticketsServed + 1 })
          .eq("id", counter.id);
      }
    },
    [getAgentCounter],
  );

  const toggleCounter = useCallback(
    async (open: boolean) => {
      const counter = getAgentCounter();
      if (!counter) return;
      setCounters((prev) =>
        prev.map((c) => (c.id === counter.id ? { ...c, isActive: open } : c)),
      );
      const { error } = await supabase
        .from("guichet")
        .update({ statut: open ? "Actif" : "Inactif" })
        .eq("id", counter.id);
      if (error) {
        console.error("Erreur lors du changement de statut du guichet:", error);
        setCounters((prev) =>
          prev.map((c) =>
            c.id === counter.id ? { ...c, isActive: !open } : c,
          ),
        );
      }
    },
    [getAgentCounter],
  );

  // ---- Admin ----
  const createService = useCallback((service: Omit<Service, "id">): Service => {
    const newService: Service = { ...service, id: `s-${Date.now()}` };
    setServices((prev) => [...prev, newService]);
    return newService;
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setCounters((prev) => prev.filter((c) => c.serviceId !== id));
  }, []);

  const createCounter = useCallback((counter: Omit<Counter, "id">): Counter => {
    const newCounter: Counter = { ...counter, id: `c-${Date.now()}` };
    setCounters((prev) => [...prev, newCounter]);
    return newCounter;
  }, []);

  const updateCounter = useCallback((id: string, updates: Partial<Counter>) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const deleteCounter = useCallback(
    (id: string) => {
      const counter = counters.find((c) => c.id === id);
      if (counter?.id_agent_actuel) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === counter.id_agent_actuel
              ? { ...a, counterId: undefined, counterName: undefined }
              : a,
          ),
        );
      }
      setCounters((prev) => prev.filter((c) => c.id !== id));
    },
    [counters],
  );

  const createAgent = useCallback((agent: Omit<Agent, "id">): Agent => {
    const newAgent: Agent = { ...agent, id: `a-${Date.now()}` };
    setAgents((prev) => [...prev, newAgent]);
    return newAgent;
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }, []);

  const deleteAgent = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (agent?.counterId) {
        setCounters((prev) =>
          prev.map((c) =>
            c.id === agent.counterId ? { ...c, id_agent_actuel: null } : c,
          ),
        );
      }
      setAgents((prev) => prev.filter((a) => a.id !== id));
    },
    [agents],
  );

  const assignAgentToCounter = useCallback(
    (agentId: string, counterId: string) => {
      const counter = counters.find((c) => c.id === counterId);
      const agent = agents.find((a) => a.id === agentId);
      if (!counter || !agent) return;
      if (agent.counterId) {
        setCounters((prev) =>
          prev.map((c) =>
            c.id === agent.counterId ? { ...c, id_agent_actuel: null } : c,
          ),
        );
      }
      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId ? { ...c, id_agent_actuel: agentId } : c,
        ),
      );
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                counterId,
                counterName: counter.name,
                serviceId: counter.serviceId,
                serviceName: counter.serviceName,
              }
            : a,
        ),
      );
    },
    [counters, agents],
  );

  const unassignAgent = useCallback(
    (agentId: string) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;
      if (agent.counterId) {
        setCounters((prev) =>
          prev.map((c) =>
            c.id === agent.counterId
              ? { ...c, id_agent_actuel: null, isActive: false }
              : c,
          ),
        );
      }
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                counterId: undefined,
                counterName: undefined,
                serviceId: undefined,
                serviceName: undefined,
              }
            : a,
        ),
      );
    },
    [agents],
  );

  const getStatistics = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTickets = tickets.filter((t) => new Date(t.createdAt) >= today);
    const completedToday = todayTickets.filter((t) => t.status === "completed");
    const totalWaitTime = completedToday.reduce((acc, t) => {
      if (t.calledAt && t.createdAt) {
        return (
          acc +
          (new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime())
        );
      }
      return acc;
    }, 0);
    return {
      totalPatients: tickets.filter((t) => t.status === "waiting").length,
      avgWaitTime:
        completedToday.length > 0
          ? Math.round(totalWaitTime / completedToday.length / 60000)
          : 0,
      activeServices: services.filter((s) => s.isActive).length,
      activeCounters: counters.filter((c) => c.isActive).length,
      ticketsToday: todayTickets.length,
      ticketsCompleted: completedToday.length,
    };
  }, [tickets, services, counters]);

  // ---- Synchronisation temps réel ----
  useEffect(() => {
    const channel = supabase
      .channel("ticket-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket" },
        () => {
          fetchTickets();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  // ---- Valeur du contexte ----
  const value: AppContextType = {
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
    fetchCounters,
    fetchTickets,
    counters,
    setCounters,
    isBusy,
    setIsBusy,
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
    startServing,
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
    createAgent,
    updateAgent,
    deleteAgent,
    assignAgentToCounter,
    unassignAgent,
    getStatistics,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
