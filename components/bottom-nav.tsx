"use client"

import { motion } from "framer-motion"
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
  activeTab: string
  onTabChange: (tab: string) => void
  onTakeTicket?: () => void
}

export function BottomNav({ activeTab, onTabChange, onTakeTicket }: BottomNavProps) {
  const { user } = useApp()

  const getNavItems = () => {
    if (!user || user.role === "visitor" || user.role === "patient") {
      return [
        { icon: Home, label: "Accueil", href: "home" },
        { icon: Stethoscope, label: "Services", href: "services" },
        { icon: Plus, label: "Ticket", href: "take-ticket", isAction: true },
        { icon: Ticket, label: "Suivi", href: "tickets" },
        { icon: User, label: "Profil", href: "profile" },
      ]
    }
    
    if (user.role === "agent") {
      return [
        { icon: LayoutDashboard, label: "Console", href: "console" },
        { icon: Stethoscope, label: "Ma File", href: "queue" },
        { icon: User, label: "Profil", href: "profile" },
      ]
    }
    
    // Admin
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: "dashboard" },
      { icon: Stethoscope, label: "Services", href: "services" },
      { icon: Monitor, label: "Guichets", href: "counters" },
      { icon: User, label: "Profil", href: "profile" },
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
          const isActive = activeTab === item.href
          const isActionButton = 'isAction' in item && item.isAction
          
          return (
            <button
              key={item.href}
              onClick={() => {
                if (isActionButton && onTakeTicket) {
                  onTakeTicket()
                } else {
                  onTabChange(item.href)
                }
              }}
              className="relative flex flex-1 flex-col items-center gap-1 py-2"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-all duration-300",
                  isActionButton 
                    ? "size-14 -mt-4 bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                    : "size-12",
                  !isActionButton && isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : !isActionButton && "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", isActionButton && "size-6")} />
              </motion.div>
              <span 
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActionButton ? "text-primary" : isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}
