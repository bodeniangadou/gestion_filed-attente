"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, User, Phone, Check, UserCheck, Lock, Edit, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FieldLabel } from "@/components/ui/field"
import { useApp } from "@/lib/app-context"
import Link from "next/link"

// CORRIGÉ : logique de split nom/prénom unifiée
// "Aminata Diallo" → firstName: "Aminata", name: "Diallo"
// "Aminata Bah Diallo" → firstName: "Aminata Bah", name: "Diallo"
// "Aminata" → firstName: "Aminata", name: ""
function splitFullName(nom: string): { firstName: string; name: string } {
  const parts = (nom || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: "", name: "" }
  if (parts.length === 1) return { firstName: parts[0], name: "" }
  const name = parts[parts.length - 1]
  const firstName = parts.slice(0, -1).join(" ")
  return { firstName, name }
}

export default function ProfileView() {
  const { user, setUser } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [passwords, setPasswords] = useState({ new: "", confirm: "" })
  const [isUpdatingPass, setIsUpdatingPass] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", firstName: "", phone: "" })
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

  const handleSave = async () => {
    if (!user) return

    if (formData.phone.length !== 8 || !/^\d+$/.test(formData.phone)) {
      toast.error("Format invalide", { description: "Le numéro doit contenir exactement 8 chiffres." })
      return
    }

    const { data: existingUser } = await supabase
      .from("utilisateur")
      .select("id")
      .eq("telephone", formData.phone)
      .neq("id", user.id)
      .single()

    if (existingUser) {
      toast.error("Numéro déjà utilisé", { description: "Ce numéro est déjà attribué à un autre utilisateur." })
      return
    }

    const fullName = [formData.firstName, formData.name].filter(Boolean).join(" ")

    const { error } = await supabase
      .from("utilisateur")
      .update({ nom: fullName, telephone: formData.phone })
      .eq("id", user.id)

    if (error) {
      toast.error("Erreur", { description: "Impossible de mettre à jour le profil." })
      return
    }

    setUser({ ...user, name: formData.name, firstName: formData.firstName, phone: formData.phone })
    setIsEditing(false)
    toast.success("Profil mis à jour", { description: "Vos informations ont été enregistrées." })
  }

  const handleCancel = () => {
    if (user) {
      setFormData({ name: user.name || "", firstName: user.firstName || "", phone: user.phone || "" })
    }
    setIsEditing(false)
  }

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Erreur", { description: "Les mots de passe ne correspondent pas." })
      return
    }
    if (passwords.new.length < 6) {
      toast.error("Trop court", { description: "Le mot de passe doit faire au moins 6 caractères." })
      return
    }
    setIsUpdatingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    setIsUpdatingPass(false)
    if (error) {
      toast.error("Erreur", { description: error.message })
    } else {
      toast.success("Succès", { description: "Votre mot de passe a été mis à jour." })
      setIsPasswordModalOpen(false)
      setPasswords({ new: "", confirm: "" })
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    try {
      const fileName = `${user.id}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
      const newPublicUrl = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from("utilisateur").update({ photo_url: data.publicUrl }).eq("id", user.id)
      setUser({ ...user, photo: newPublicUrl })
      toast.success("Photo mise à jour")
    } catch {
      toast.error("Erreur", { description: "Impossible de modifier la photo." })
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6 bg-card rounded-3xl p-8 shadow-xl border border-border"
        >
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <UserCheck className="size-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Session expirée</h2>
            <p className="text-muted-foreground">Veuillez vous connecter pour accéder à votre espace personnel.</p>
          </div>
          <Button asChild className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    // CORRIGÉ : plus de double centrage — s'étale dans l'espace dispo après la sidebar
    <div className="min-h-screen bg-background px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

          <CardContent className="p-6">

            {/* Titre + bouton modifier */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
                  <User className="size-4" />
                </div>
                <h1 className="text-lg font-bold text-foreground">Mon profil</h1>
              </div>
              {!isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="size-3" /> Modifier
                </motion.button>
              )}
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full border-2 border-emerald-200 overflow-hidden">
                  {user.photo ? (
                    <img src={user.photo} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl text-white font-bold">
                      {user.firstName?.charAt(0).toUpperCase() || ""}
                      {user.name?.charAt(0).toUpperCase() || ""}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-card text-emerald-600 rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform border border-border"
                >
                  <Camera className="size-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              <div className="text-center mt-3">
                <h2 className="text-lg font-bold text-foreground">{user.firstName} {user.name}</h2>
                <Badge className="px-3 py-0.5 bg-emerald-500 text-white border-0 rounded-full text-xs mt-1">
                  <span className="flex items-center gap-1.5 text-[10px]">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                    </span>
                    {roleLabels[user.role] || user.role}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-200" />
              <span className="text-emerald-300 text-[10px]">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-200" />
            </div>

            {/* Formulaire */}
            <div className="space-y-2.5">

              {/* Prénom + Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <User className="size-3 text-emerald-500" />
                    </div>
                    Prénom
                  </FieldLabel>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <User className="size-3 text-emerald-500" />
                    </div>
                    Nom
                  </FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Téléphone + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <Phone className="size-3 text-emerald-500" />
                    </div>
                    Téléphone
                  </FieldLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="76XXXXXX"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <Mail className="size-3 text-emerald-500" />
                    </div>
                    Email
                  </FieldLabel>
                  <Input
                    value={user.email || ""}
                    disabled
                    className="h-8 text-sm bg-muted"
                  />
                </div>
              </div>

              {/* Actions */}
              {!isEditing ? (
                <div className="pt-1">
                  <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-7 px-5 text-xs border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 font-medium rounded-lg"
                      >
                        Changer le mot de passe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                          <span className="bg-emerald-100 p-1.5 rounded-lg">
                            <Lock className="size-4 text-emerald-500" />
                          </span>
                          Changer le mot de passe
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          Minimum 6 caractères.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-3">
                        <Input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          className="h-10 text-sm"
                        />
                        <Input
                          type="password"
                          placeholder="Confirmer le nouveau mot de passe"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          className="h-10 text-sm"
                        />
                        <Button
                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm"
                          onClick={handlePasswordUpdate}
                          disabled={isUpdatingPass}
                        >
                          {isUpdatingPass ? "Mise à jour..." : "Confirmer"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-7 text-xs rounded-lg"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs flex items-center justify-center gap-1"
                    onClick={handleSave}
                  >
                    <Check className="size-3" /> Enregistrer
                  </Button>
                </div>
              )}
            </div>

            {/* Séparateur bas */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-200" />
              <span className="text-emerald-300 text-[10px]">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-200" />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}