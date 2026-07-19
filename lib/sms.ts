
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