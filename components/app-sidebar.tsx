"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation" 
import Link from "next/link"                 
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
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp, UserRole } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string 
  roles: UserRole[]
}

const navItems = [
  // --- Admin ---
  { icon: <LayoutDashboard />, label: "Dashboard", href: "/admin", roles: ["admin"] },
  { icon: <Ticket />, label: "Tickets", href: "/admin/ticket", roles: ["admin"] },
  { icon: <Users />, label: "Agents", href: "/admin/agents", roles: ["admin"] },
  { icon: <Stethoscope />, label: "Services", href: "/admin/services", roles: ["admin"] },
  { icon: <Monitor />, label: "Guichets", href: "/admin/counters", roles: ["admin"] },
  { icon: <User />, label: "Profil", href: "/admin/profile", roles: ["admin"] },

  // --- Agent ---
  { icon: <LayoutDashboard />, label: "Tableau de bord", href: "/agent", roles: ["agent"] },
  { icon: <Monitor />, label: "Console", href: "/agent/console", roles: ["agent"] },
  { icon: <ListOrdered />, label: "Ma File", href: "/agent/file", roles: ["agent"] },
  { icon: <User />, label: "Profil", href: "/agent/profil", roles: ["agent"] },

  // --- Patient ---

  
  { icon: <LayoutDashboard />, label: "Tableau de bord ", href: "/patient", roles: ["patient"] },
    {icon: <Stethoscope />, label: "Services", href: "/patient/services", roles: ["patient"] },
  { icon: <ListOrdered />, label: "Mes Tickets", href: "/patient/tickets", roles: ["patient"] },
  { icon: <User />, label: "Profil", href: "/patient/profile", roles: ["patient"] },
];

export function AppSidebar() {
  const { user, logout } = useApp()
  const pathname = usePathname()
 const filteredItems = navItems.filter((item) => {
  const hasRole = user && item.roles.includes(user.role);
  
  const isCorrectSpace = item.href.startsWith(`/${user?.role}`);

  return hasRole && isCorrectSpace;
});
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex"
    >
      {/* Logo */}
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

  const trueHref = item.href === "/profile" && user 
    ? `/${user.role}/profile` 
    : item.href

  const isActive = pathname === trueHref

  return (
    <Link
      key={item.href}
      href={trueHref} 
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground font-semibold"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  )
})}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
              <Avatar className="size-10">
                <AvatarImage src={user.photo} />
                <AvatarFallback className="bg-emerald text-primary-foreground">
                  {user.firstName?.charAt(0)}{user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.firstName} {user.name}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
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
        ) }
      </div>
    </motion.aside>
  )
}