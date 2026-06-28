"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  Settings, Building2, Clock, Users, Volume2, Power,
  Save, RotateCcw, Ticket, Stethoscope, Monitor, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useApp, HospitalSettings } from "@/lib/app-context"

function isOpenNow(openTime: string, closeTime: string) {
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = openTime.split(":").map(Number)
  const [ch, cm] = closeTime.split(":").map(Number)
  const start = oh * 60 + om
  const end = ch * 60 + cm
  if (end >= start) return cur >= start && cur <= end
  return cur >= start || cur <= end
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
      <div className="flex gap-3 min-w-0">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const {
    hospitalSettings,
    updateHospitalSettings,
    services,
    counters,
    agents,
    getStatistics,
    setServices,
  } = useApp()

  const [draft, setDraft] = useState<HospitalSettings>(hospitalSettings)
  const [saved, setSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(hospitalSettings)
    setSaved(true)
  }, [hospitalSettings])

  const stats = getStatistics()
  const openNow = useMemo(() => isOpenNow(draft.openTime, draft.closeTime), [draft.openTime, draft.closeTime])

  const activeServices = services.filter(s => s.isActive).length
  const activeCounters = counters.filter(c => c.isActive).length
  const onlineAgents = agents.filter(a => a.isOnline).length

  const patch = (updates: Partial<HospitalSettings>) => {
    setDraft(prev => ({ ...prev, ...updates }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error("Le nom de l'établissement est requis")
      return
    }
    if (draft.openTime >= draft.closeTime && draft.closeTime !== "00:00") {
      toast.error("L'heure de fermeture doit être après l'ouverture")
      return
    }

    setIsSaving(true)
    try {
      // Persistance réelle en BDD (table "hopital") au lieu d'un simple state local
      await updateHospitalSettings(draft)

      if (draft.autoCloseServices) {
        const shouldBeOpen = isOpenNow(draft.openTime, draft.closeTime)
        setServices(prev =>
          prev.map(s => ({ ...s, isActive: shouldBeOpen ? s.isActive : false }))
        )
      }

      setSaved(true)
      toast.success("Paramètres enregistrés")
    } catch (err) {
      console.error(err)
      toast.error("Erreur", { description: "Impossible d'enregistrer les paramètres." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setDraft(hospitalSettings)
    setSaved(true)
    toast.info("Modifications annulées")
  }

  const handleResetDefaults = () => {
    const defaults: HospitalSettings = {
      name: "Hôpital du Mali",
      openTime: "07:00",
      closeTime: "20:00",
      autoCloseServices: true,
      maxQueuePerService: 50,
      allowAnonymousTickets: true,
      voiceAnnouncements: true,
    }
    setDraft(defaults)
    setSaved(false)
    toast.info("Valeurs par défaut chargées — cliquez sur Enregistrer pour appliquer")
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              Paramètres
            </h1>
            <p className="text-sm text-muted-foreground">Configuration centrale de l&apos;application</p>
          </div>
          <div className="flex items-center gap-2">
            {!saved && (
              <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 hidden sm:flex">
                Non enregistré
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saved || isSaving}>
              <RotateCcw className="size-4" />
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saved || isSaving}>
              <Save className="size-4" />
              <span className="hidden sm:inline">{isSaving ? "Enregistrement..." : "Enregistrer"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-5">
        {/* Aperçu live */}
        <Card className={cn("border-0 shadow-sm overflow-hidden", openNow ? "ring-1 ring-emerald-500/20" : "ring-1 ring-red-500/20")}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">État actuel</p>
                <p className="text-lg font-bold mt-1">{draft.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Clock className="size-3.5" />
                  {draft.openTime} — {draft.closeTime}
                </p>
              </div>
              <Badge
                className={cn(
                  "w-fit text-sm px-3 py-1",
                  openNow ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"
                )}
                variant="outline"
              >
                <span className={cn("size-2 rounded-full mr-2", openNow ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                {openNow ? "Ouvert maintenant" : "Fermé maintenant"}
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { icon: Stethoscope, label: "Services actifs", value: activeServices },
                { icon: Monitor, label: "Guichets actifs", value: activeCounters },
                { icon: Users, label: "Agents en ligne", value: onlineAgents },
                { icon: Ticket, label: "Tickets aujourd'hui", value: stats.ticketsToday },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3">
                  <item.icon className="size-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Établissement */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Établissement
            </CardTitle>
            <CardDescription>Identité et horaires d&apos;ouverture</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <SettingRow
              icon={Building2}
              title="Nom de l'établissement"
              description="Affiché aux patients et agents"
            >
              <Input
                value={draft.name}
                onChange={e => patch({ name: e.target.value })}
                className="w-full sm:w-56 h-9"
                placeholder="Hôpital du Mali"
              />
            </SettingRow>
            <Separator />
            <SettingRow
              icon={Clock}
              title="Heures d'ouverture"
              description="Plage horaire de prise de tickets"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={draft.openTime}
                  onChange={e => patch({ openTime: e.target.value })}
                  className="w-28 h-9"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <Input
                  type="time"
                  value={draft.closeTime}
                  onChange={e => patch({ closeTime: e.target.value })}
                  className="w-28 h-9"
                />
              </div>
            </SettingRow>
          </CardContent>
        </Card>

        {/* File d'attente */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="size-4 text-primary" />
              File d&apos;attente
            </CardTitle>
            <CardDescription>Limites et accès patients</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <SettingRow
              icon={Users}
              title="Taille max. par service"
              description={`Maximum ${draft.maxQueuePerService} patients en file par service`}
            >
              <div className="w-full sm:w-48 space-y-2">
                <Slider
                  value={[draft.maxQueuePerService]}
                  onValueChange={([v]) => patch({ maxQueuePerService: v })}
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-center font-mono font-bold text-primary">{draft.maxQueuePerService}</p>
              </div>
            </SettingRow>
            <Separator />
            <SettingRow
              icon={Ticket}
              title="Tickets anonymes"
              description="Permettre la prise de ticket sans compte"
            >
              <Switch
                checked={draft.allowAnonymousTickets}
                onCheckedChange={v => patch({ allowAnonymousTickets: v })}
              />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Automatisation & annonces */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="size-4 text-primary" />
              Automatisation
            </CardTitle>
            <CardDescription>Comportement automatique du système</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <SettingRow
              icon={Power}
              title="Fermeture auto des services"
              description="Désactive les services hors horaires d'ouverture"
            >
              <Switch
                checked={draft.autoCloseServices}
                onCheckedChange={v => patch({ autoCloseServices: v })}
              />
            </SettingRow>
            <Separator />
            <SettingRow
              icon={Volume2}
              title="Annonces vocales"
              description="Appel vocal des tickets aux guichets"
            >
              <Switch
                checked={draft.voiceAnnouncements}
                onCheckedChange={v => patch({ voiceAnnouncements: v })}
              />
            </SettingRow>
          </CardContent>
        </Card>

        {/* Résumé des réglages actifs */}
        <Card className="border-0 shadow-sm bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
             
              <li className="flex justify-between gap-4">
                <span>Fermeture automatique</span>
                <span className="font-medium text-foreground">{draft.autoCloseServices ? "Activée" : "Désactivée"}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Capacité file / service</span>
                <span className="font-medium text-foreground">{draft.maxQueuePerService} patients</span>
              </li>
            </ul>
            <Button variant="ghost" size="sm" className="mt-4 text-muted-foreground" onClick={handleResetDefaults}>
              Restaurer les valeurs par défaut
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}