"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Stethoscope,
  Ticket,
  User,
  Users,
  Settings,
  Monitor,
  ListOrdered,
  QrCode,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, UserRole } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
 {
    icon: <LayoutDashboard className="size-5" />,
    label: "Tableau de bord Admin",
    href: "/admin/", // Ou la route réelle de ton admin
    roles: ["admin"],
  },
  {
    icon: <LayoutDashboard className="size-5" />,
    label: "Tableau de bord",
    href: "/agent", 
    roles: ["agent"],
  },
  
  {
    icon: <Stethoscope className="size-5" />,
    label: "Services",
    href: "/agent/services",
    roles: ["admin", "patient", "visitor"],
  },
  {
    icon: <Monitor className="size-5" />,
    label: "Guichets",
    href: "/agent/counters",
    roles: ["admin"],
  },
  {
    icon: <Users className="size-5" />,
    label: "Agents",
    href: "/agent/agents",
    roles: ["admin"],
  },
  {
    icon: <QrCode className="size-5" />,
    label: "QR Codes",
    href: "/agent/qrcodes",
    roles: ["admin"],
  },
  {
    icon: <Monitor className="size-5" />,
    label: "Console d'Appel",
    href: "/agent/console",
    roles: ["agent"],
  },
  {
    icon: <ListOrdered className="size-5" />,
    label: "Ma File",
    href: "/agent/file",
    roles: ["agent"],
  },
  {
    icon: <Ticket className="size-5" />,
    label: "Mes Tickets",
    href: "/agent/tickets",
    roles: ["patient"],
  },
  {
    icon: <User className="size-5" />,
    label: "Profil",
    href: "/agent/profil",
    roles: ["admin", "agent", "patient"],
  },
  {
    icon: <Settings className="size-5" />,
    label: "Paramètres",
    href: "/agent/settings",
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useApp();

  const filteredItems = navItems.filter((item) => {
    if (!user) return item.roles.includes("visitor");
    return item.roles.includes(user.role);
  });

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald text-primary-foreground">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Rang+</h1>
          <p className="text-xs text-muted-foreground">Hôpital du Mali</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredItems.map((item) => {
          const estActif = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                estActif
                  ? "bg-emerald text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
              <Avatar className="size-10">
                <AvatarImage src={user.photo} />
                <AvatarFallback className="bg-emerald text-primary-foreground">
                  {user.firstName?.charAt(0)}
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.firstName} {user.name}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Se déconnecter
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Mode visiteur</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
