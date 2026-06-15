"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Bell,
  User
} from "lucide-react"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()

  const menus = [
    {
      nom: "Dashboard",
      lien: "/agent/dashboard",
      icone: LayoutDashboard,
    },
    {
      nom: "File",
      lien: "/agent/file",
      icone: Users,
    },
    {
      nom: "Console d'appel",
      lien: "/agent/console",
      icone: Bell,
    },
    {
      nom: "Profil",
      lien: "/agent/profil",
      icone: User,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="w-64 bg-white border-r">

        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-green-600">
            Rang+
          </h1>
        </div>

        <nav className="p-4 space-y-2">

          {menus.map((menu) => {

            const Icone = menu.icone

            const actif = pathname === menu.lien

            return (
              <Link
                key={menu.nom}
                href={menu.lien}
                className={`
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  transition-all
                  ${
                    actif
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icone size={20} />
                <span>{menu.nom}</span>
              </Link>
            )
          })}

        </nav>

      </aside>

      {/* Contenu principal */}

      <main className="flex-1 p-6">
        {children}
      </main>

    </div>
  )
}