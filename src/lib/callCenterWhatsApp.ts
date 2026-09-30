/**
 * Helper de génération de messages WhatsApp optimisés pour les agences de voyage au Maroc.
 * Formats bilingues Français / Darija avec emojis professionnels.
 */

export interface WhatsAppTemplateParams {
  clientName: string;
  clientPhone: string;
  reference: string;
  tripTitle: string;
  departureDate?: string;
  depositAmount?: number;
  totalAmount?: number;
  passengersCount?: number;
  pickupCity?: string;
  pickupPoint?: string;
  agencyName?: string;
}

export function cleanMoroccanPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    return "212" + digits.slice(1);
  }
  if (digits.startsWith("212")) {
    return digits;
  }
  if (digits.length === 9) {
    return "212" + digits;
  }
  return digits;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanMoroccanPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const CALL_CENTER_TEMPLATES = {
  /**
   * Template 1 : Relance suite à un appel manqué (Tentative 1 ou 2)
   */
  NO_ANSWER_RELANCE: (p: WhatsAppTemplateParams) => {
    return `Salam ${p.clientName} 👋,

J'ai tenté de vous joindre par téléphone concernant votre demande pour le voyage *${p.tripTitle}* 🐪🇲🇦 (Réf : ${p.reference}).

Êtes-vous toujours disponible pour échanger ou préférez-vous que je vous rappelle à une heure précise ? 

Je reste à votre entière disposition sur ce numéro WhatsApp pour répondre à vos questions et vous envoyer le programme détaillé. ✨

*Rahalat Bladna* | Agence de Voyages Organisés au Maroc`;
  },

  /**
   * Template 2 : Coordonnées Bancaires RIB (CIH / Attijariwafa) pour validation d'acompte
   */
  DEPOSIT_RIB_DETAILS: (p: WhatsAppTemplateParams) => {
    const deposit = p.depositAmount ? `${p.depositAmount} MAD` : "500 MAD par personne";
    return `Salam ${p.clientName} 🇲🇦,

Suite à notre échange téléphonique pour le voyage *${p.tripTitle}* (Réf: *${p.reference}*), voici nos coordonnées bancaires pour bloquer définitivement vos places :

💰 *Acompte à verser :* *${deposit}*

🏦 *Comptes Bancaires Officiels :*
• *CIH Bank (RIB) :* \`230 780 45678901230000 92\`
• *Attijariwafa bank (RIB) :* \`007 780 00012345678900 15\`
• *Bénéficiaire :* RAHALAT BLADNA SARL

📌 *Marche à suivre :*
1. Effectuez le virement ou versement d'acompte.
2. Envoyez-nous la capture d'écran / reçu de virement directement ici sur WhatsApp.
3. Nous vous délivrons immédiatement votre *Billet Numérique Officiel avec QR Code*.

Les places étant limitées, merci d'effectuer le règlement sous 24h pour garantir vos sièges. 🐪✨

*Rahalat Bladna*`;
  },

  /**
   * Template 3 : Confirmation de réservation & Détails du départ
   */
  BOOKING_CONFIRMED_SUMMARY: (p: WhatsAppTemplateParams) => {
    const pickup = p.pickupPoint ? `${p.pickupCity || ""} (${p.pickupPoint})` : p.pickupCity || "À convenir";
    return `🎉 *RÉSERVATION CONFIRMÉE !* 🇲🇦

Salam ${p.clientName}, votre réservation pour le voyage *${p.tripTitle}* est officiellement validée !

📌 *Rappel de vos informations :*
• Réf Dossier : *${p.reference}*
• Date de départ : *${p.departureDate || "Voir programme"}*
• Point de ramassage : *${pickup}*
• Nombre de personnes : *${p.passengersCount || 1} voyageur(s)*

🪪 *Important :* Pensez à vous munir obligatoirement de votre Carte d'Identité Nationale (CIN) originale pour l'embarquement.

Toute l'équipe vous souhaite un excellent voyage avec *Rahalat Bladna* ! 🐪✨`;
  },

  /**
   * Template 4 : Relance amicale avant expiration de l'option
   */
  EXPIRING_OPTION_REMINDER: (p: WhatsAppTemplateParams) => {
    return `Salam ${p.clientName} ⏳,

Petit rappel concernant votre option pour le voyage *${p.tripTitle}* (Réf: ${p.reference}). 

Le départ approche et le circuit est presque complet 🚐💨. 

Afin de ne pas libérer vos places pour d'autres voyageurs, merci de nous confirmer votre acompte ou de nous faire signe si vous avez besoin d'un délai supplémentaire.

À très bientôt ! 
*Rahalat Bladna*`;
  },
};
