"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation" // 👈 Import pour l'URL mobile
import Link from "next/link"                 // 👈 Vrais liens
import { 
  Home, 
  Stethoscope, 
  Ticket, 
  User,
  Monitor,
  LayoutDashboard,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

interface BottomNavProps {
  onTakeTicket?: () => void
}

export function BottomNav({ onTakeTicket }: BottomNavProps) {
  const { user } = useApp()
  const pathname = usePathname() // 👈 Détecteur de chemin mobile

  const getNavItems = () => {
    if (!user || user.role === "visitor" || user.role === "patient") {
      return [
        { icon: Home, label: "Accueil", href: "/home" },
        { icon: Stethoscope, label: "Services", href: "/services" },
        { icon: Plus, label: "Ticket", href: "#", isAction: true },
        { icon: Ticket, label: "Suivi", href: "/tickets" },
        { icon: User, label: "Profil", href: "/profile" },
      ]
    }
    
    if (user.role === "agent") {
      return [
        { icon: LayoutDashboard, label: "Console", href: "/agent/console" },
        { icon: Stethoscope, label: "Ma File", href: "/agent/queue" },
        { icon: User, label: "Profil", href: "/profile" },
      ]
    }
    
    // Admin routes physiques
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: Stethoscope, label: "Services", href: "/admin/services" },
      { icon: Monitor, label: "Guichets", href: "/admin/counters" },
      { icon: User, label: "Profil", href: "/admin/profile" },
    ]
  }

  const navItems = getNavItems()

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
      </div>
    </motion.nav>
  )
}