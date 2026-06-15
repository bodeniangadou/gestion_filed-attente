"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Stethoscope,
  Ticket,
  User,
  Monitor,
  LayoutDashboard,
  Plus,
  ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";

interface BottomNavProps {
  onTakeTicket?: () => void;
}

export function BottomNav({ onTakeTicket }: BottomNavProps) {
  const { user } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const getNavItems = () => {
    // Visiteur ou Patient
    if (!user || user.role === "visitor" || user.role === "patient") {
      return [
        { icon: Home, label: "Accueil", href: "/home" },
        { icon: Stethoscope, label: "Services", href: "/services" },
        { icon: Plus, label: "Ticket", href: "/take-ticket", isAction: true },
        { icon: Ticket, label: "Suivi", href: "/tickets" },
        { icon: User, label: "Profil", href: "/profile" },
      ];
    }

    // Agent
    if (user.role === "agent") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/agent" },
        { icon: Monitor, label: "Console", href: "/agent/console" },
        { icon: ListOrdered, label: "Ma File", href: "/agent/file" },
        { icon: User, label: "Profil", href: "/agent/profil" },
      ];
    }

    // Admin
    return [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Stethoscope, label: "Services", href: "/admin/services" },
      { icon: Monitor, label: "Guichets", href: "/admin/counters" },
      { icon: User, label: "Profil", href: "/admin/profile" },
    ];
  };

  const navItems = getNavItems();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex h-20 max-w-lg items-center justify-around px-4 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // L'icône est active si l'URL actuelle correspond exactement au href
          // ou s'il s'agit d'une sous-page (ex: /agent/console/123)
          const isActive = pathname === item.href || (item.href !== "/agent" && pathname.startsWith(item.href));
          const isActionButton = "isAction" in item && item.isAction;

          return (
            <button
              key={item.href}
              onClick={() => {
                if (isActionButton && onTakeTicket) {
                  onTakeTicket();
                } else {
                  router.push(item.href);
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
                    ? "bg-primary/10 text-primary" 
                    : !isActionButton && "text-muted-foreground"
                )}
              >
                <Icon className={cn("size-5", isActionButton && "size-6")} />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActionButton
                    ? "text-primary"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}