import { supabase } from "@/lib/supabase"

export async function sendConfirmationSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  service?: { name?: string; id?: string }
}): Promise<boolean> {
  try {
    const serviceName = ticket.service?.name || "Service"
    const message = `Bonjour ${ticket.userName}, votre ticket ${ticket.number} pour ${serviceName} a été enregistré. Consultez votre position en temps réel sur l'application Rang+. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS confirmation échoué pour ticket ${ticket.id}:`, result.error)
      await supabase.from("notification").insert([
        {
          id_ticket: ticket.id,
          message: `[SMS_CONFIRMATION_FAILED] ${result.error}`,
          date_envoi: new Date().toISOString(),
        },
      ])
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_CONFIRMATION] Ticket ${ticket.number} - Envoyé à ${ticket.phone}`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS confirmation envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendConfirmationSms:", err)
    return false
  }
}

export async function sendAbsentSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  service?: { name?: string }
}): Promise<boolean> {
  try {
    const serviceName = ticket.service?.name || "Service"
    const message = `${ticket.userName}, vous avez été marqué(e) absent(e) pour le ticket ${ticket.number} - ${serviceName}. Si vous êtes toujours sur place, présentez-vous rapidement au guichet ou reprenez un ticket. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS "absent" échoué pour ticket ${ticket.id}:`, result.error)
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_ABSENT] Ticket ${ticket.number} - Marqué absent`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS "absent" envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendAbsentSms:", err)
    return false
  }
}

export async function sendCompletedSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  service?: { name?: string }
}): Promise<boolean> {
  try {
    const serviceName = ticket.service?.name || "Service"
    const message = `Merci ${ticket.userName}, votre consultation pour le ticket ${ticket.number} (${serviceName}) est terminée. Nous vous souhaitons une bonne santé. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS "terminé" échoué pour ticket ${ticket.id}:`, result.error)
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_COMPLETED] Ticket ${ticket.number} - Consultation terminée`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS "terminé" envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendCompletedSms:", err)
    return false
  }
}

export async function sendCancelledByStaffSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  service?: { name?: string }
}): Promise<boolean> {
  try {
    const serviceName = ticket.service?.name || "Service"
    const message = `${ticket.userName}, votre ticket ${ticket.number} (${serviceName}) a été annulé suite à la fermeture du guichet. Veuillez reprendre un nouveau ticket si besoin. Désolé pour la gêne occasionnée. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS "annulé par le staff" échoué pour ticket ${ticket.id}:`, result.error)
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_CANCELLED_STAFF] Ticket ${ticket.number} - Annulé (fermeture guichet)`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS "annulé par le staff" envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendCancelledByStaffSms:", err)
    return false
  }
}

export async function sendRedirectedSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  newCounterName?: string
  service?: { name?: string }
}): Promise<boolean> {
  try {
    const serviceName = ticket.service?.name || "Service"
    const counterInfo = ticket.newCounterName ? `au guichet ${ticket.newCounterName}` : "vers un autre guichet"
    const message = `${ticket.userName}, votre ticket ${ticket.number} (${serviceName}) a été redirigé ${counterInfo}. Vous gardez votre place dans la file. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS "redirigé" échoué pour ticket ${ticket.id}:`, result.error)
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_REDIRECTED] Ticket ${ticket.number} - Redirigé vers ${ticket.newCounterName || "un autre guichet"}`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS "redirigé" envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendRedirectedSms:", err)
    return false
  }
}

export async function sendCalledSms(ticket: {
  id: string
  number: string
  phone: string
  userName: string
  counterName?: string
  service?: { name?: string }
}): Promise<boolean> {
  try {
    const counterInfo = ticket.counterName ? `Guichet ${ticket.counterName}` : "au guichet"
    const serviceName = ticket.service?.name || "Service"
    const message = `${ticket.userName}, c'est votre tour ! Ticket ${ticket.number} - ${serviceName}. Veuillez vous présenter ${counterInfo}. Hôpital du Mali.`

    const result = await sendSmsViaGateway(ticket.phone, message)

    if (!result.success) {
      console.error(`SMS "c'est le tour" échoué pour ticket ${ticket.id}:`, result.error)
      return false
    }

    await supabase.from("notification").insert([
      {
        id_ticket: ticket.id,
        message: `[SMS_CALLED] Ticket ${ticket.number} - Appelé au ${ticket.counterName || "guichet"}`,
        date_envoi: new Date().toISOString(),
      },
    ])

    console.log(`✅ SMS "c'est le tour" envoyé pour ticket ${ticket.number}`)
    return true
  } catch (err) {
    console.error("Erreur sendCalledSms:", err)
    return false
  }
}

export function normalizePhoneMali(phone: string | undefined): string | null {
  if (!phone || typeof phone !== "string") return null;

  const cleaned = phone.trim().replace(/\D/g, "");
  if (!cleaned) return null;

  if (cleaned.startsWith("223")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  return `+223${cleaned}`;
}

export async function sendSmsViaGateway(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneMali(phoneNumber);
    if (!normalizedPhone) {
      return { success: false, error: "Numéro invalide" };
    }

    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizedPhone,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Erreur lors de l'envoi du SMS",
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (err) {
    console.error("Erreur SMS client:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}