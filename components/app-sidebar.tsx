"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation" // 👈 Pour détecter l'URL active
import Link from "next/link"                 // 👈 Pour la navigation par URL
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
  href: string // 👈 Contiendra maintenant le vrai chemin URL
  roles: UserRole[]
}

// Mises à jour des chemins pour correspondre exactement à vos dossiers sous /admin
const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="size-5" />, label: "Tableau de bord", href: "/admin", roles: ["admin"] },
  { icon: <Stethoscope className="size-5" />, label: "Services", href: "/admin/services", roles: ["admin"] },
  { icon: <Monitor className="size-5" />, label: "Guichets", href: "/admin/counters", roles: ["admin"] },
  { icon: <Users className="size-5" />, label: "Agents", href: "/admin/agents", roles: ["admin"] },
  { icon: <QrCode className="size-5" />, label: "QR Codes", href: "/admin/qrcodes", roles: ["admin"] },
  { icon: <Settings className="size-5" />, label: "Paramètres", href: "/admin/settings", roles: ["admin"] },
  // Garde les autres rôles si nécessaire, adaptés à vos routes futures
  { icon: <Monitor className="size-5" />, label: "Console d'Appel", href: "/agent/console", roles: ["agent"] },
  { icon: <ListOrdered className="size-5" />, label: "Ma File", href: "/agent/queue", roles: ["agent"] },
  { icon: <Ticket className="size-5" />, label: "Mes Tickets", href: "/patient/tickets", roles: ["patient"] },
  { icon: <User className="size-5" />, label: "Profil", href: "/profile", roles: ["admin", "agent", "patient"] },
]

export function AppSidebar() {
  const { user, logout } = useApp()
  const pathname = usePathname() // 👈 Récupère l'URL courante (ex: /admin/services)
  
  const filteredItems = navItems.filter(item => {
    if (!user) return item.roles.includes("visitor")
    return item.roles.includes(user.role)
  })

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

      {/* Navigation par vrais Liens */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
       {filteredItems.map((item) => {
  // 1. On calcule la vraie URL cible. 
  // Si c'est "/profile", on y ajoute dynamiquement le rôle de l'utilisateur (ex: /admin/profile)
  const trueHref = item.href === "/profile" && user 
    ? `/${user.role}/profile` 
    : item.href

  // 2. L'onglet est actif si l'URL du navigateur correspond à notre URL calculée
  const isActive = pathname === trueHref

  return (
    <Link
      key={item.href}
      href={trueHref} // 👈 On passe la vraie URL ici
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
        {user ? (
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
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Mode visiteur</p>
          </div>
        )}
      </div>
    </motion.aside>
  )
}