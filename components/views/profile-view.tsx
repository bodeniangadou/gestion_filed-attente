"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Camera, User, Phone, Mail, Shield, LogOut, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { useApp } from "@/lib/app-context"

export function ProfileView() {
  const { user, setUser, logout, loginAsRole } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    firstName: user?.firstName || "",
    phone: user?.phone || "",
  })
  const [showSaved, setShowSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const roleLabels = {
    visitor: "Visiteur",
    patient: "Patient",
    agent: "Agent",
    admin: "Super Admin",
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 lg:pb-8">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-xl font-bold text-foreground">Profil</h1>
            <p className="text-sm text-muted-foreground">Connectez-vous ou créez un compte</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Mode Démo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez un rôle pour explorer l&apos;application :
              </p>
              <Button 
                className="w-full justify-start gap-3"
                variant="outline"
                onClick={() => loginAsRole("patient", "Keita", "Aminata")}
              >
                <User className="size-5" />
                Connexion en tant que Patient
              </Button>
              <Button 
                className="w-full justify-start gap-3"
                variant="outline"
                onClick={() => loginAsRole("agent", "Diallo", "Mamadou")}
              >
                <Shield className="size-5" />
                Connexion en tant qu&apos;Agent
              </Button>
              <Button 
                className="w-full justify-start gap-3 bg-emerald text-primary-foreground hover:bg-emerald/90"
                onClick={() => loginAsRole("admin", "Admin", "Super")}
              >
                <Shield className="size-5" />
                Connexion en tant que Super Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
            <Button variant="outline" onClick={() => setIsEditing(true)}>
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
            className="mb-6 flex items-center gap-2 rounded-xl bg-emerald p-4 text-primary-foreground"
          >
            <Check className="size-5" />
            <span>Modifications enregistrées</span>
          </motion.div>
        )}

        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative">
            <Avatar className="size-28 border-4 border-emerald">
              <AvatarImage src={user.photo} />
              <AvatarFallback className="bg-emerald text-3xl text-primary-foreground">
                {user.firstName?.charAt(0)}{user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-10 items-center justify-center rounded-full bg-emerald text-primary-foreground shadow-lg transition-transform hover:scale-110"
            >
              <Camera className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            {user.firstName} {user.name}
          </h2>
          <Badge className="mt-2 bg-emerald-light text-emerald">
            {roleLabels[user.role]}
          </Badge>
        </motion.div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <FieldGroup className="space-y-5">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Prénom
                </FieldLabel>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="h-12"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Nom
                </FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-12"
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  Téléphone
                </FieldLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+223 XX XX XX XX"
                  className="h-12"
                />
              </Field>
            </FieldGroup>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-emerald text-primary-foreground hover:bg-emerald/90"
                  onClick={handleSave}
                >
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
