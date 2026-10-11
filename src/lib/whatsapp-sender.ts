/**
 * Fonctions d'Envoi WhatsApp via l'API Graph de Meta
 */

export async function sendWhatsAppTextMessage(to: string, message: string): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) {
    console.warn('[WhatsApp Sender] WHATSAPP_PHONE_ID ou WHATSAPP_ACCESS_TOKEN manquant.');
    return false;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      console.error('[WhatsApp Sender] Erreur Meta Graph API:', errorJson);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp Sender] Erreur requête:', error);
    return false;
  }
}

export async function sendWhatsAppAction(to: string, action: 'typing'): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) return;

  // Optionnel : Envoi d'un statut read / présence
  try {
    await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
      }),
    });
  } catch {
    // Non-bloquant
  }
}
