/**
 * app/api/sms/send/route.ts
 * 
 * Endpoint sécurisé côté serveur pour envoyer les SMS via SMS Gateway Cloud
 * - Récupère les credentials du .env.local
 * - Appelle api.sms-gate.app (pas l'IP locale)
 * - Retourne messageId ou erreur
 * - NE JAMAIS exposer les credentials au client
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

export async function POST(request: NextRequest) {
  try {
    // 1. Vérification des credentials
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

    // 2. Parsing de la requête
    const body: SmsRequest = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Téléphone ou message manquant" },
        { status: 400 }
      );
    }

    // 3. Préparation de l'authentification (Basic Auth)
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

    // 5. Extraction du messageId (adapter selon la réponse de ton Gateway)
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