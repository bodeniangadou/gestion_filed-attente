"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AdminMainPage from "./page"

export default function AdminLayout() {
  const [currentTab, setCurrentTab] = useState("dashboard")

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        activeTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <main className="flex-1 lg:pl-64">
        <AdminMainPage
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </main>
    </div>
  )
}