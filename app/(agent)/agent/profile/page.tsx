"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, User, Phone, LogOut, Check, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { useApp } from "@/lib/app-context"
import Link from "next/link"

export default function ProfileView() {
  const { user, setUser, logout } = useApp() // Enlevé loginAsRole qui ne sert plus ici
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    phone: "",
  })
  
  const [showSaved, setShowSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        firstName: user.firstName || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        name: formData.name,
        firstName: formData.firstName,
        phone: formData.phone,
      })
    }
    setIsEditing(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        firstName: user.firstName || "",
        phone: user.phone || "",
      })
    }
    setIsEditing(false)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && user) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUser({
          ...user,
          photo: e.target?.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const roleLabels: Record<string, string> = {
    visitor: "Visiteur",
    patient: "Patient",
    agent: "Agent",
    admin: "Super Admin",
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 pb-24 lg:pb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-4"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <UserCheck className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Session expirée</h2>
            <p className="text-sm text-muted-foreground">
              Veuillez vous connecter pour accéder à votre espace personnel.
            </p>
          </div>
          <Button asChild className="w-full h-11 bg-primary text-primary-foreground">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  // ─── ÉCRAN DU PROFIL CONNECTÉ ───
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Mon Profil</h1>
            <p className="text-sm text-muted-foreground">Gérer vos informations personnelles</p>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-6">
        {/* Success Toast */}
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 flex items-center gap-2 rounded-xl bg-emerald p-4 text-primary-foreground text-sm font-medium shadow-sm"
          >
            <Check className="size-5" />
            <span>Modifications enregistrées avec succès</span>
          </motion.div>
        )}

        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative">
            <Avatar className="size-24 border-4 border-emerald shadow-sm">
              <AvatarImage src={user.photo} />
              <AvatarFallback className="bg-emerald text-2xl font-bold text-primary-foreground">
                {user.firstName?.charAt(0)}{user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-emerald text-primary-foreground shadow-lg transition-transform hover:scale-110"
            >
              <Camera className="size-4.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {user.firstName} {user.name}
          </h2>
          <Badge className="mt-1.5 bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/10 shadow-none font-semibold">
            {roleLabels[user.role] || user.role}
          </Badge>
        </motion.div>

        {/* Form Card */}
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <FieldGroup className="space-y-5">
              <Field>
                <FieldLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="size-3.5" />
                  Prénom
                </FieldLabel>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 bg-background disabled:bg-muted/40 disabled:text-muted-foreground"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="size-3.5" />
                  Nom
                </FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 bg-background disabled:bg-muted/40 disabled:text-muted-foreground"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Phone className="size-3.5" />
                  Téléphone
                </FieldLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+223 XX XX XX XX"
                  className="h-11 bg-background disabled:bg-muted/40 disabled:text-muted-foreground"
                />
              </Field>
            </FieldGroup>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 h-11 bg-emerald text-primary-foreground hover:bg-emerald/90"
                  onClick={handleSave}
                >
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6 border-border/60" />
        
        <Button 
          variant="outline" 
          className="w-full h-11 gap-2 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all font-medium"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}