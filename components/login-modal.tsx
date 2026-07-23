"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp, type UserRole } from "@/lib/app-context"
import { 
  LogIn, 
  UserPlus, 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Phone,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Stethoscope
} from "lucide-react"

type AuthMode = "login" | "register" | "role-select" 

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultMode?: AuthMode
}

export function LoginModal({ open, onOpenChange, onSuccess, defaultMode = "login" }: LoginModalProps) {
  const { setUser } = useApp()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  // entryMode garde en mémoire COMMENT la modal a été ouverte (depuis le bouton
  // "Connexion" ou depuis le bouton "Inscription" de la navbar). Contrairement à
  // `mode`, il n'est jamais modifié par la navigation interne (ex: clic sur
  // "Créer un compte" depuis l'écran login). Il sert uniquement à savoir si on
  // doit afficher le bouton "Retour" sur l'écran register.
  const [entryMode, setEntryMode] = useState<AuthMode>(defaultMode)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter() 
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  // À chaque ouverture de la modal, on resynchronise mode ET entryMode sur le
  // defaultMode reçu, pour que le bon écran s'affiche selon le bouton cliqué.
  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setEntryMode(defaultMode)
    }
  }, [open, defaultMode])

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setPhone("")
    setMode(defaultMode)
    setEntryMode(defaultMode)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error("Erreur de connexion", {
        description: error.message === "Invalid login credentials" 
          ? "Email ou mot de passe incorrect" 
          : error.message
      })
      setIsLoading(false)
      return
    }

    
    const { data: profile, error: profileError } = await supabase
      .from("utilisateur")
      .select("id, nom, role, est_banni, telephone, email, photo_url")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      toast.error("Erreur profil", {
        description: "Impossible de récupérer votre profil. Veuillez réessayer."
      })
      await supabase.auth.signOut()
      setIsLoading(false)
      return
    }

    const role = profile.role || "patient"

    if (role === "agent") {
      if (profile.est_banni === true) {
        toast.error("Compte suspendu", {
          description: "Votre compte agent a été banni. Contactez l'administrateur."
        })
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      const { data: assignedCounter, error: counterError } = await supabase
        .from("guichet")
        .select("id, id_service")
        .eq("id_agent_actuel", data.user.id)
        .maybeSingle()

      if (counterError) {
        toast.error("Erreur", {
          description: "Impossible de vérifier votre guichet assigné."
        })
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      if (!assignedCounter) {
        toast.error("Aucun guichet assigné", {
          description: "Vous n'êtes assigné à aucun guichet pour le moment. Contactez l'administrateur."
        })
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      if (!assignedCounter.id_service) {
        toast.error("Aucun service assigné", {
          description: "Votre guichet n'est associé à aucun service. Contactez l'administrateur."
        })
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }
    }

    const fullNom = profile.nom || data.user.user_metadata?.nom || ""
    const parts = fullNom.trim().split(/\s+/).filter(Boolean)
    const derivedFirstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || ""
    const derivedLastName = parts.length > 1 ? parts[parts.length - 1] : ""

    setUser({
      id: data.user.id,
      name: derivedLastName || fullNom,
      firstName: derivedFirstName || fullNom,
      email: profile.email || data.user.email || undefined,
      phone: profile.telephone || undefined,
      photo: profile.photo_url || undefined,
      role: role as UserRole,
    })

    setIsLoading(false)
    handleClose()
    onSuccess()
    router.push(role === "admin" ? "/admin" : role === "agent" ? "/agent" : "/patient")
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^\d{8}$/.test(phone)) {
      toast.warning("Format invalide", {
        description: "Le numéro doit contenir exactement 8 chiffres."
      })
      return
    }

    setIsLoading(true)

    const { data: existingPhone } = await supabase
      .from("utilisateur")
      .select("id")
      .eq("telephone", phone)
      .single()

    if (existingPhone) {
      toast.warning("Numéro déjà enregistré", {
        description: "Ce numéro de téléphone est déjà associé à un autre compte.",
      })
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom: `${firstName} ${lastName}` } }
    })

    if (error) {
      let errorMessage = error.message
      if (error.message.includes("already registered")) {
        errorMessage = "Un compte existe déjà avec cette adresse email."
      }
      
      toast.error("Erreur d'inscription", {
        description: errorMessage
      })
      setIsLoading(false)
      return
    }

    if (data.user) {
      const { error: dbError } = await supabase.from("utilisateur").insert([{
        id: data.user.id,
        nom: `${firstName} ${lastName}`,
        email: email,
        role: "patient",
        telephone: phone,
        photo_url: null
      }])

      if (dbError) {
   
        try {
          await fetch("/api/rollback-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id }),
          })
        } catch (rollbackErr) {
          console.error("Erreur lors du rollback du compte:", rollbackErr)
        }

        toast.error("Erreur profil", {
          description: "Un problème est survenu lors de la création de votre profil. Veuillez réessayer."
        })
        setIsLoading(false)
        return
      }
    }

    toast.success("Compte créé avec succès !", {
      description: "Votre compte est actif. Veuillez vous connecter maintenant.",
      duration: 5000,
    })

    setMode("login")
    setEntryMode("login")
    setIsLoading(false)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary">
                    <Building2 className="size-6 text-primary-foreground" />
                  </div>
                </div>
                <DialogTitle className="text-center text-xl">
                  Connexion
                </DialogTitle>
                <DialogDescription className="text-center">
                  Accedez a votre espace Rang+
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  ) : (
                    <>
                      <LogIn className="size-4" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 rounded-xl gap-2"
                  onClick={() => setMode("register")}
                >
                  <UserPlus className="size-4" />
                  Creer un compte
                </Button>

                
              </div>
            </motion.div>
          )}

          {mode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                {/* Le bouton "Retour" n'a de sens que si on a navigué en interne
                    depuis l'écran login (entryMode === "login"). Si la modal a
                    été ouverte directement en mode register (clic sur
                    "Inscription" dans la navbar), il n'y a pas d'écran précédent
                    dans cette session de la modal, donc on ne l'affiche pas. */}
                {entryMode === "login" && (
                  <button 
                    onClick={() => setMode("login")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="size-4" />
                    Retour
                  </button>
                )}
                <DialogTitle className="text-xl">
                  Creer un compte
                </DialogTitle>
                <DialogDescription>
                  Inscrivez-vous pour utiliser Rang+
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prenom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Prenom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Nom"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telephone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="76 32 10 20"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regPassword">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Choisissez un mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Creer mon compte
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

        
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}