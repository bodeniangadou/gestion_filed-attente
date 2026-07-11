import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  // 1. Récupération du token envoyé par le client
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // 2. Vérification que le token correspond à un utilisateur réel
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  // 3. Vérification que cet utilisateur est bien admin en base
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("utilisateur")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // 4. Création de l'agent (logique inchangée)
  const { email, password, nom, telephone } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { error: insertError } = await supabaseAdmin
    .from("utilisateur")
    .insert([{
      id: data.user.id,
      nom,
      email,
      telephone,
      role: "agent",
      disponibilite: true,
      est_banni: false,
    }])

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  return NextResponse.json({ id: data.user.id, success: true })
}