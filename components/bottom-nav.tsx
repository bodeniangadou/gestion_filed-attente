"use client"

import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Stethoscope,
  Ticket,
  User,
  Monitor,
  LayoutDashboard,
  Plus, ListOrdered, Users, Settings,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

interface BottomNavProps {
  onTakeTicket?: () => void
}

export function BottomNav({ onTakeTicket }: BottomNavProps) {
  const { user, logout } = useApp()
  const pathname = usePathname()
  const router = useRouter()

  const getNavItems = () => {
    // --- Patient ---
    if (!user || user.role === "patient") {
      return [
        { icon: Home, label: "Accueil", href: "/patient" },
        { icon: Stethoscope, label: "Services", href: "/patient/services" },
        { icon: Ticket, label: "Mes Tickets", href: "/patient/tickets" },
        { icon: User, label: "Profil", href: "/patient/profile" },
      ];
    }

    // --- Agent ---
    if (user.role === "agent") {
      return [
        { icon: LayoutDashboard, label: "Tableau", href: "/agent" },
        { icon: Monitor, label: "Console", href: "/agent/console" },
        { icon: ListOrdered, label: "Ma File", href: "/agent/file" },
        { icon: User, label: "Profil", href: "/agent/profil" },
      ];
    }

    // --- Admin ---
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: Ticket, label: "Tickets", href: "/admin/ticket" },
      { icon: Users, label: "Agents", href: "/admin/agents" },
      { icon: Stethoscope, label: "Services", href: "/admin/services" },
      { icon: Monitor, label: "Guichets", href: "/admin/counters" },
      { icon: Settings, label: "Réglages", href: "/admin/settings" },
      { icon: User, label: "Profil", href: "/admin/profile" },
    ];
  };

  const navItems = getNavItems()
  if (!navItems || navItems.length === 0) return null;

  // La déconnexion n'a de sens que si quelqu'un est réellement connecté
  // (patient, agent ou admin) — pas pour un simple visiteur anonyme.
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex h-20 max-w-lg items-center justify-around px-4 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isActionButton = 'isAction' in item && item.isAction

          if (isActionButton) {
            return (
              <button
                key={item.label}
                onClick={onTakeTicket}
                className="relative flex flex-1 flex-col items-center gap-1 py-2"
              >
                <div className="flex size-14 -mt-4 bg-primary text-primary-foreground shadow-lg shadow-primary/40 items-center justify-center rounded-2xl">
                  <Icon className="size-6" />
                </div>
                <span className="text-[10px] font-medium text-primary">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2 text-center"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {user && (
          <button
            onClick={handleLogout}
            className="relative flex flex-1 flex-col items-center gap-1 py-2 text-center"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex size-12 items-center justify-center rounded-2xl text-destructive"
            >
              <LogOut className="size-5" />
            </motion.div>
            <span className="text-[10px] font-medium text-destructive">
              Déconnexion
            </span>
          </button>
        )}
      </div>
    </motion.nav>
  )
}