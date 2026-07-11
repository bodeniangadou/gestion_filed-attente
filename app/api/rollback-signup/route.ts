import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Supprime un compte Auth qui vient d'être créé mais dont l'insertion
// du profil dans "utilisateur" a échoué juste après (évite les comptes
// fantômes bloqués : email pris, mais aucun profil utilisable).
export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 })
    }

    // On vérifie que ce compte n'a justement PAS de profil dans "utilisateur"
    // avant de le supprimer — pour éviter qu'un appel malveillant supprime
    // un compte légitime qui a bel et bien un profil.
    const { data: existingProfile } = await supabaseAdmin
      .from("utilisateur")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Ce compte a déjà un profil, suppression refusée." },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Rollback signup error:", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}