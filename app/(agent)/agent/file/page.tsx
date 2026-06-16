"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

import { FileTabs } from "@/components/ui/file/FileTabs"
import { FileFilters } from "@/components/ui/file/FileFilters"
import { QueueTable } from "@/components/ui/file/QueueTable"
import { HistoryTable } from "@/components/ui/file/HistoryTable"
import { AbsentTable } from "@/components/ui/file/AbsentTable"
import { NextPatient } from "@/components/ui/file/NextPatient"
import { QuickHistory } from "@/components/ui/file/QuickHistory"

export default function FilePage() {
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState("queue")
  const [search, setSearch] = useState("")

  const statusByTab: Record<string, string> = {
    queue: "waiting",
    history: "completed",
    absent: "absent",
  }

  const tabByStatus: Record<string, string> = {
    waiting: "queue",
    completed: "history",
    absent: "absent",
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleStatusChange = (status: string) => {
    setActiveTab(tabByStatus[status])
  }

  useEffect(() => {
    const tab = searchParams.get("tab")

    if (
      tab === "queue" ||
      tab === "history" ||
      tab === "absent"
    ) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="space-y-6 p-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion de la file
        </h1>

        <p className="text-gray-500 mt-1">
          Gestion des patients et suivi de la file d'attente
        </p>
      </div>

      <FileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <FileFilters
        search={search}
        status={statusByTab[activeTab]}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
      />

      {activeTab === "queue" && (
        <>
          <QueueTable search={search} />
          <NextPatient />
          <QuickHistory />
        </>
      )}

      {activeTab === "history" && (
        <HistoryTable search={search} />
      )}

      {activeTab === "absent" && (
        <AbsentTable search={search} />
      )}

    </div>
  )
}
