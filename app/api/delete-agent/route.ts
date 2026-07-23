import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("utilisateur")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { agentId } = await req.json()
  if (!agentId) {
    return NextResponse.json({ error: "ID de l'agent manquant" }, { status: 400 })
  }

  // 1. Delete from utilisateur table
  const { error: dbError } = await supabaseAdmin
    .from("utilisateur")
    .delete()
    .eq("id", agentId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  // 2. Delete from Supabase Auth
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(agentId)
  if (authDeleteError) {
    console.warn("Attention: impossible de supprimer l'utilisateur Supabase Auth:", authDeleteError.message)
    // Non-blocking if auth user doesn't exist or was already removed
  }

  return NextResponse.json({ success: true })
}
