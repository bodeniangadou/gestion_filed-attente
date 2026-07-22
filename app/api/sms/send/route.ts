/**
 * app/api/sms/send/route.ts
 * 
 * Endpoint sécurisé côté serveur pour envoyer les SMS via SMS Gateway Cloud
 * - Récupère les credentials du .env.local
 * - Appelle api.sms-gate.app (pas l'IP locale)
 * - Retourne messageId ou erreur
 * - NE JAMAIS exposer les credentials au client
 * - Rate-limit par IP pour éviter le spam (pas d'authentification requise,
 *   car les patients anonymes doivent pouvoir recevoir des SMS)
 */

import { NextRequest, NextResponse } from "next/server";

interface SmsRequest {
  phone: string;
  message: string;
}

interface SmsGatewayResponse {
  messageId?: string;
  status?: string;
  error?: string;
  [key: string]: any;
}


const lastSmsSentByIp = new Map<string, number>();
const MIN_DELAY_MS = 5_000; 

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();
    const lastSent = lastSmsSentByIp.get(ip) ?? 0;

    if (now - lastSent < MIN_DELAY_MS) {
      return NextResponse.json(
        { error: "Trop de requêtes, veuillez patienter quelques secondes." },
        { status: 429 }
      );
    }

    const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
    const SMS_GATEWAY_USERNAME = process.env.SMS_GATEWAY_USERNAME;
    const SMS_GATEWAY_PASSWORD = process.env.SMS_GATEWAY_PASSWORD;

    if (!SMS_GATEWAY_URL || !SMS_GATEWAY_USERNAME || !SMS_GATEWAY_PASSWORD) {
      console.error("SMS Gateway: credentials manquants dans .env.local");
      return NextResponse.json(
        { error: "Configuration SMS incomplète" },
        { status: 500 }
      );
    }

    const body: SmsRequest = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Téléphone ou message manquant" },
        { status: 400 }
      );
    }

 
    lastSmsSentByIp.set(ip, now);

    const credentials = Buffer.from(
      `${SMS_GATEWAY_USERNAME}:${SMS_GATEWAY_PASSWORD}`
    ).toString("base64");

    const gatewayResponse = await fetch(SMS_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        textMessage: { text: message },
        phoneNumbers: [phone],
      }),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      console.error(
        `SMS Gateway error (${gatewayResponse.status}):`,
        errorText
      );
      return NextResponse.json(
        { error: `SMS Gateway: ${gatewayResponse.statusText}` },
        { status: gatewayResponse.status }
      );
    }

    const gatewayData: SmsGatewayResponse = await gatewayResponse.json();
    const messageId = gatewayData.messageId || gatewayData.id || gatewayData.status;

    if (!messageId) {
      console.warn("SMS Gateway: pas de messageId dans la réponse", gatewayData);
    }

    return NextResponse.json({
      success: true,
      messageId: messageId || "unknown",
      gatewayResponse: gatewayData,
    });
  } catch (error) {
    console.error("SMS Route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur serveur SMS",
      },
      { status: 500 }
    );
  }
}