"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

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

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type AuthMode = "login" | "register" | "role-select" 

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const { setUser } = useApp()
  const [mode, setMode] = useState<AuthMode>("login")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter() 
  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setPhone("")
    setMode("login")
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Demo: Check for special emails
    let role: UserRole = "patient"
    if (email.includes("admin")) {
      role = "admin"
    } else if (email.includes("agent")) {
      role = "agent"
    }
    
 
    setUser({
      id: "user-" + Date.now(),
      firstName: email.split("@")[0],
      lastName: "",
      email,
      role,
      name: ""
    })
    
    setIsLoading(false)
    handleClose()
    onSuccess()
    if (role === "admin") {
      router.push("/admin")
    } else if (role === "agent") {
      router.push("/agent")
    } else {
      router.push("/patient") // Les patients restent à la racine
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUser({
      id: "user-" + Date.now(),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, 
      email,
      phone,
      role: "patient"
    })
    
    setIsLoading(false)
    handleClose()
    onSuccess()
  }

  const handleRoleSelect = (role: UserRole) => {
    setUser({
      id: "demo-" + Date.now(),
      firstName: role === "admin" ? "Admin" : role === "agent" ? "Agent" : "Patient",
      lastName: "Demo", 
      name: `${firstName} ${lastName}`, 
      email: `${role}@demo.ml`,
      role
    })
    handleClose()
    onSuccess()
    if (role === "admin") {
      router.push("/admin")
    } else if (role === "agent") {
      router.push("/agent")
    } else {
      router.push("/patient")
    }
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

                <button
                  type="button"
                  onClick={() => setMode("role-select")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Acces demo (sans compte)
                </button>
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
                <button 
                  onClick={() => setMode("login")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="size-4" />
                  Retour
                </button>
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
                      placeholder="+223 XX XX XX XX"
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

          {mode === "role-select" && (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <button 
                  onClick={() => setMode("login")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="size-4" />
                  Retour
                </button>
                <DialogTitle className="text-xl">
                  Acces Demo
                </DialogTitle>
                <DialogDescription>
                  Choisissez un profil pour tester l&apos;application
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect("patient")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Patient</p>
                    <p className="text-sm text-muted-foreground">Prendre un ticket et suivre sa position</p>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("agent")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Stethoscope className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Agent</p>
                    <p className="text-sm text-muted-foreground">Gerer un guichet et appeler les patients</p>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("admin")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Super Admin</p>
                    <p className="text-sm text-muted-foreground">Gerer les services, guichets et agents</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
