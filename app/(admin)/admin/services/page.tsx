"use client"
import { AdminServicesView } from "@/components/views/admin-services-view"

export default function ServicesPage() {
  return <AdminServicesView onBack={() => window.history.back()} />
}