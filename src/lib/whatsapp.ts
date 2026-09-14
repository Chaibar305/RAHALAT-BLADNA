export interface WhatsAppMessagePayload {
  toPhone: string; // Ex: "+212661000000"
  bookingNumber: string;
  clientName: string;
  tripTitle: string;
  departureDate: string;
  pickupLocation: string;
  departureTime: string;
  paidAmount: number;
  remainingBalance: number;
  qrCodeUrl: string;
}

export async function sendBookingConfirmationWhatsApp(payload: WhatsAppMessagePayload): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  const formattedMessage = `
🇲🇦 *RAHALAT BLADNA - Confirmation de Réservation* 🇲🇦

Bonjour *${payload.clientName}*,

Votre réservation pour le voyage *${payload.tripTitle}* est bien confirmée !

📌 *Détails de votre départ :*
• Réf Réservation : *${payload.bookingNumber}*
• Date de départ : *${payload.departureDate}*
• Point de ramassage : *${payload.pickupLocation}*
• Heure de rassemblement : *${payload.departureTime}*

💰 *Situation Financière :*
• Acompte versé : *${payload.paidAmount} MAD*
• Solde à régler au départ : *${payload.remainingBalance} MAD*

📱 *Votre Billet Numérique & QR Code d'embarquement :*
${payload.qrCodeUrl}

_Pensez à vous munir impérativement de votre Carte d'Identité Nationale (CIN) originale pour l'embarquement._

Bon voyage avec Rahalat Bladna ! 🐪✨
  `.trim();

  // Si l'API est configurée, appel HTTP sortant
  if (apiUrl && apiToken) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: apiToken,
          to: payload.toPhone,
          body: formattedMessage,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de l'envoi WhatsApp :", error);
      return false;
    }
  }

  console.log("Mock WhatsApp envoyé à :", payload.toPhone);
  return true;
}
