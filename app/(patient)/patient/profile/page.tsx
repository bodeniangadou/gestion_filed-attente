"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, User, Phone, LogOut, Check, UserCheck, Sparkles, Lock, Edit, Mail } from "lucide-react"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { useApp } from "@/lib/app-context"
import Link from "next/link"

export default function ProfileView() {
  const { user, setUser, logout } = useApp() 
  const [isEditing, setIsEditing] = useState(false)
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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

  const handleSave = async () => {
    if (!user) return;

    if (formData.phone.length !== 8 || !/^\d+$/.test(formData.phone)) {
      toast.error("Format invalide", { description: "Le numéro doit contenir exactement 8 chiffres." });
      return;
    }

    const { data: existingUser, error: checkError } = await supabase
      .from("utilisateur")
      .select("id")
      .eq("telephone", formData.phone)
      .neq("id", user.id) 
      .single();

    if (existingUser) {
      toast.error("Numéro déjà utilisé", { description: "Ce numéro est déjà attribué à un autre utilisateur." });
      return;
    }

    const { error } = await supabase
      .from("utilisateur")
      .update({
        nom: `${formData.firstName} ${formData.name}`,
        telephone: formData.phone,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur", { description: "Impossible de mettre à jour le profil." });
      return;
    }

    setUser({
      ...user,
      name: formData.name,
      firstName: formData.firstName,
      phone: formData.phone,
    });

    setIsEditing(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
    toast.success("Profil mis à jour", { description: "Vos informations ont été enregistrées." });
  };

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

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Erreur", { description: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Trop court", { description: "Le mot de passe doit faire au moins 6 caractères." });
      return;
    }

    setIsUpdatingPass(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    setIsUpdatingPass(false);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success("Succès", { description: "Votre mot de passe a été mis à jour." });
      setIsPasswordModalOpen(false); 
      setPasswords({ new: "", confirm: "" }); 
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileName = `${user.id}_${Date.now()}.jpg`; 

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const newPublicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from("utilisateur")
        .update({ photo_url: data.publicUrl }) 
        .eq("id", user.id);

      if (updateError) throw updateError;

      setUser({ ...user, photo: newPublicUrl });
      
      toast.success("Succès", { description: "Votre photo a été mise à jour." });

    } catch (error) {
      console.error("Erreur complète :", error);
      toast.error("Erreur", { description: "Impossible de modifier la photo." });
    }
  };

  const roleLabels: Record<string, string> = {
    visitor: "Visiteur",
    patient: "Patient",
    agent: "Agent",
    admin: "Super Admin",
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6 bg-white rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 border border-emerald-100"
        >
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <UserCheck className="size-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Session expirée</h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour accéder à votre espace personnel.
            </p>
          </div>
          <Button asChild className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-2xl">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Toast de succès */}
        {/* {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 p-2.5 mb-3 text-white shadow-lg shadow-emerald-500/30"
          >
            <div className="rounded-full bg-white/20 p-1">
              <Check className="size-3.5" />
            </div>
            <span className="font-medium text-xs">✅ Modifications enregistrées avec succès !</span>
          </motion.div>
        )} */}

        <Card className="border-0 shadow-2xl shadow-emerald-500/10 rounded-2xl overflow-hidden">
          {/* Barre décorative */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"></div>
          
          <CardContent className="p-6">
            
            {/* ===== TITRE "MON PROFIL" + BOUTON MODIFIER ===== */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg shadow-emerald-500/30">
                  <User className="size-4" />
                </div>
                <h1 className="text-lg font-bold text-gray-800">Mon Profil</h1>
              </div>
              
              {!isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-medium shadow-lg shadow-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
                >
                  <Edit className="size-3" />
                  Modifier
                </motion.button>
              )}
            </div>

            {/* ===== AVATAR CENTRÉ ===== */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full border-3 border-emerald-200 shadow-lg overflow-hidden">
                  {user.photo ? (
                    <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl text-white font-bold">
                      {user.firstName?.charAt(0).toUpperCase() || ""}{user.name?.charAt(0).toUpperCase() || ""}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-lg shadow-emerald-500/30 transition-all hover:scale-110"
                >
                  <Camera className="size-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="text-center mt-3">
                <h2 className="text-lg font-bold text-gray-800">
                  {user.firstName} {user.name}
                </h2>
                <Badge className="px-3 py-0.5 bg-emerald-500 text-white border-0 rounded-full text-xs shadow-sm shadow-emerald-500/30 mt-1">
                  <span className="relative flex items-center gap-1.5 text-[10px]">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex size-1.5 rounded-full bg-white"></span>
                    </span>
                    {roleLabels[user.role] || user.role}
                  </span>
                </Badge>
              </div>
            </div>

            {/* ===== TRAIT SÉPARATEUR ===== */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-200"></div>
              <span className="text-emerald-300 text-[10px]">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-200"></div>
            </div>

            {/* ===== FORMULAIRE ===== */}
            <div className="space-y-2.5">
              {/* Prénom + Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <User className="size-3 text-emerald-500" />
                    </div>
                    Prénom
                  </FieldLabel>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-sm border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all rounded-lg disabled:bg-gray-50 disabled:opacity-70"
                  />
                </div>
                
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <User className="size-3 text-emerald-500" />
                    </div>
                    Nom
                  </FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-sm border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all rounded-lg disabled:bg-gray-50 disabled:opacity-70"
                  />
                </div>
              </div>

                           {/* Téléphone + Email sur la même ligne */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <Phone className="size-3 text-emerald-500" />
                    </div>
                    Téléphone
                  </FieldLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+223 XX XX XX XX"
                    className="h-8 text-sm border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all rounded-lg disabled:bg-gray-50 disabled:opacity-70"
                  />
                </div>
                
                <div>
                  <FieldLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-0.5">
                    <div className="bg-emerald-100 p-0.5 rounded">
                      <Mail className="size-3 text-emerald-500" />
                    </div>
                    Email
                  </FieldLabel>
                  <Input
                    value={user.email || "email@exemple.com"}
                    disabled
                    className="h-8 text-sm border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                  />
                </div>
              </div>

              {/* Bouton "Changer mot de passe" - taille moyenne */}
              {!isEditing ? (
                <div className="pt-1 flex justify-start">
                  <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-7 px-5 text-xs border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 font-medium rounded-lg transition-all"
                      >
                         Changer le mot de passe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl border-emerald-100 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <span className="bg-emerald-100 p-1.5 rounded-lg">
                            <Lock className="size-4 text-emerald-500" />
                          </span>
                          Changer le mot de passe
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 text-sm">
                          Entrez votre nouveau mot de passe (minimum 6 caractères)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-3">
                        <Input 
                          type="password" 
                          placeholder="Nouveau mot de passe" 
                          value={passwords.new} 
                          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                          className="h-10 text-sm rounded-lg border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20"
                        />
                        <Input 
                          type="password" 
                          placeholder="Confirmer le nouveau mot de passe" 
                          value={passwords.confirm} 
                          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                          className="h-10 text-sm rounded-lg border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20"
                        />
                        <Button 
                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-lg font-medium text-sm" 
                          onClick={handlePasswordUpdate} 
                          disabled={isUpdatingPass}
                        >
                          {isUpdatingPass ? "Mise à jour..." : "✅ Confirmer"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-7 text-xs border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 h-7 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-lg font-medium transition-all text-xs flex items-center justify-center gap-1"
                    onClick={handleSave}
                  >
                    <Check className="size-3" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>

            {/* ===== SÉPARATEUR ===== */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-200"></div>
              <span className="text-emerald-300 text-[10px]">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-200"></div>
            </div>

          

          
          </CardContent>
        </Card>
      </div>
    </div>
  )
}