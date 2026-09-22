import nodemailer from "nodemailer";
import { sendEmailViaResend } from "./resend";

interface SendPasswordResetEmailParams {
  to: string;
  name?: string | null;
  resetUrl: string;
  locale?: string;
}

/**
 * Configure le transporteur Nodemailer avec les variables d'environnement SMTP.
 * Utilisé comme fallback si Resend n'est pas configuré ou en environnement local.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "";
  const pass = rawPass.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  if (host === "smtp.gmail.com" || user.endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Moteur universel d'expédition d'emails :
 * 1. Tente Resend en priorité si RESEND_API_KEY est défini.
 * 2. Si échec ou non configuré, bascule vers Nodemailer (SMTP).
 * 3. En mode dev sans SMTP, journalise dans la console.
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}): Promise<{ success: boolean; error?: string; provider?: string }> {
  const sender = from || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "Rahalat Bladna <contact@rahalatbladna.ma>";

  // 1. Priorité API Resend
  if (process.env.RESEND_API_KEY) {
    const resendRes = await sendEmailViaResend({
      to,
      subject,
      html,
      text,
      from: sender,
      replyTo,
      attachments,
    });

    if (resendRes.success) {
      return { success: true, provider: "resend" };
    }

    console.warn("⚠️ [dispatchEmail] Échec de l'envoi Resend, tentative via SMTP de secours :", resendRes.error);
  }

  // 2. Fallback Nodemailer SMTP
  const transporter = getEmailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: sender,
        to,
        subject,
        text,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType || "application/pdf",
        })),
      });
      return { success: true, provider: "nodemailer" };
    } catch (err: any) {
      console.error("❌ [dispatchEmail] Échec du transporteur SMTP de secours :", err);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback Dev Console
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ 📧 [EMAIL DEV / AUCUN SERVEUR CONFIGURÉ]                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Destinataire : ${(Array.isArray(to) ? to.join(", ") : to).padEnd(57)} ║
║ Sujet        : ${subject.slice(0, 57).padEnd(57)} ║
║ Pièces jointes : ${(attachments?.map((a) => a.filename).join(", ") || "Aucune").padEnd(55)} ║
╚══════════════════════════════════════════════════════════════════════════╝
  `);

  return { success: true, provider: "console" };
}

/**
 * Modèle HTML réinitialisation mot de passe
 */
function generateResetPasswordHtml({
  name,
  resetUrl,
  locale = "fr",
}: {
  name?: string | null;
  resetUrl: string;
  locale?: string;
}): { subject: string; html: string; text: string } {
  const isAr = locale === "ar";
  const recipientName = name?.trim() || (isAr ? "عزيزي المسافر" : "Cher Voyageur");

  const subject = isAr
    ? "رحلات بلادنا | إعادة تعيين كلمة المرور الخاصة بك"
    : "Rahalat Bladna | Réinitialisation de votre mot de passe";

  const text = isAr
    ? `مرحباً ${recipientName}،\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على رحلات بلادنا.\n\nانقر على الرابط التالي لإنشاء كلمة مرور جديدة :\n${resetUrl}\n\nهذا الرابط صالح لمدة 60 دقيقة فقط.\nإذا لم تكن قد طلبت هذا، يمكنك تجاهل هذا البريد بأمان.\n\nفريق رحلات بلادنا\ncontact@rahalatbladna.ma`
    : `Bonjour ${recipientName},\n\nVous avez demandé la réinitialisation de votre mot de passe sur Rahalat Bladna.\n\nCliquez sur le lien ci-dessous pour définir un nouveau mot de passe :\n${resetUrl}\n\nCe lien est valide pendant 60 minutes.\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.\n\nL'équipe Rahalat Bladna\ncontact@rahalatbladna.ma`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.6; }
    .container { max-width: 600px; margin: 30px auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
    .header { background-color: #0B2239; padding: 35px 30px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; margin-top: 10px; padding: 5px 14px; border-radius: 20px; background-color: rgba(27, 186, 202, 0.15); color: #1BBACA; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .content { padding: 40px 35px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0B2239; margin-bottom: 16px; }
    .paragraph { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .cta-container { text-align: center; margin: 35px 0; }
    .cta-button { display: inline-block; background-color: #1BBACA; color: #FFFFFF !important; padding: 15px 36px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(27, 186, 202, 0.35); }
    .security-notice { background-color: #F1F5F9; border-left: 4px solid #1BBACA; padding: 16px 20px; border-radius: 8px; margin-top: 30px; font-size: 12px; color: #64748B; }
    .link-fallback { margin-top: 25px; font-size: 12px; color: #94A3B8; word-break: break-all; }
    .link-fallback a { color: #1BBACA; text-decoration: underline; }
    .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 35px; text-align: center; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rahalat Bladna | رحلات بلادنا</h1>
      <div class="badge">${isAr ? "أمان الحساب" : "Sécurité du Compte"}</div>
    </div>
    
    <div class="content">
      <div class="greeting">${isAr ? `مرحباً ${recipientName}،` : `Bonjour ${recipientName},`}</div>
      <p class="paragraph">
        ${
          isAr
            ? "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة <strong>رحلات بلادنا</strong>. يمكنك تعيين كلمة مرور جديدة بالنقر على الزر أدناه :"
            : "Vous avez demandé la réinitialisation du mot de passe de votre compte sur la plateforme <strong>Rahalat Bladna</strong>. Pour définir un nouveau mot de passe, cliquez sur le bouton ci-dessous :"
        }
      </p>

      <div class="cta-container">
        <a href="${resetUrl}" target="_blank" class="cta-button">
          ${isAr ? "إعادة تعيين كلمة المرور" : "Réinitialiser mon mot de passe"}
        </a>
      </div>

      <div class="security-notice">
        <strong>${isAr ? "ملاحظة أمنية هامة :" : "Information de sécurité :"}</strong><br>
        ${
          isAr
            ? "هذا الرابط فريد وصالح لمدة <strong>60 دقيقة</strong> فقط. إذا لم تكن أنت صاحب هذا الطلب، يمكنك تجاهل هذه الرسالة ولن يتم تغيير أي شيء في حسابك."
            : "Ce lien est à usage unique et expire dans <strong>60 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité."
        }
      </div>

      <div class="link-fallback">
        <p>${
          isAr
            ? "إذا لم يعمل الزر أعلاه، انسخ والصق الرابط التالي مباشرة في متصفحك :"
            : "Si le bouton ne fonctionne pas, copiez-collez l'adresse suivante dans votre navigateur :"
        }</p>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Rahalat Bladna. Tous droits réservés.</p>
      <p style="margin: 0;">Service Client : contact@rahalatbladna.ma | Tél : +212 603-660658</p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html, text };
}

/**
 * Envoie l'email de réinitialisation de mot de passe via Resend ou transporteur de secours.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  locale = "fr",
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html, text } = generateResetPasswordHtml({
      name,
      resetUrl,
      locale,
    });

    const res = await dispatchEmail({
      to,
      subject,
      html,
      text,
    });

    return res;
  } catch (error: any) {
    console.error("[sendPasswordResetEmail] Erreur d'envoi d'email:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de l'envoi de l'email.",
    };
  }
}

// ====================================================
// NOUVEAU : EMAILS RÉSERVATIONS, REÇUS & FACTURES PDF
// ====================================================

export interface SendBookingConfirmationParams {
  to: string;
  clientName: string;
  bookingReference: string;
  tripTitle: string;
  travelDates: string;
  passengerCount: number;
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
  pickupCity?: string;
  pdfBuffer: Buffer;
  pdfFileName?: string;
  locale?: string;
}

/**
 * Envoie l'email de confirmation immédiate de réservation avec le Devis / Reçu PDF joint.
 */
export async function sendBookingConfirmationWithPdfEmail({
  to,
  clientName,
  bookingReference,
  tripTitle,
  travelDates,
  passengerCount,
  totalAmount,
  depositAmount,
  remainingBalance,
  pickupCity,
  pdfBuffer,
  pdfFileName,
  locale = "fr",
}: SendBookingConfirmationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const isAr = locale === "ar";
    const fileName = pdfFileName || `Recu_Reservation_${bookingReference}.pdf`;

    const subject = isAr
      ? `رحلات بلادنا | تأكيد تسجيل حجزكم رقم ${bookingReference} (${tripTitle})`
      : `Rahalat Bladna | Confirmation de réservation ${bookingReference} - ${tripTitle}`;

    const text = isAr
      ? `مرحباً ${clientName}،\n\nنشكركم على ثقتكم في رحلات بلادنا. تم تسجيل طلب حجزكم بنجاح تحت رقم المرجع : ${bookingReference}.\n\nتفاصيل الرحلة :\n- البرنامج : ${tripTitle}\n- تاريخ السفر : ${travelDates}\n- عدد المقاعد : ${passengerCount}\n- المبلغ الإجمالي : ${totalAmount.toLocaleString("fr-MA")} درهم\n- مبلغ التسبيق المطلوب لتثبيت المقعد : ${depositAmount.toLocaleString("fr-MA")} درهم\n- الباقي عند الانطلاق : ${remainingBalance.toLocaleString("fr-MA")} درهم\n\nبيانات التحويل البنكي (CIH Bank) :\nRIB : 230 810 6784594211008100 80\nالمستفيد : MOHAMMED AMINE CHAIBAR (Rahalat Bladna)\n\nتجدون وثيقة الحجز والتسعيرة الرسمية (PDF) مرفقة مع هذا البريد الإلكتروني.\nلأي استفسار تواصلوا معنا على : contact@rahalatbladna.ma أو عبر الهاتف/واتساب : 0603660658`
      : `Bonjour ${clientName},\n\nNous vous remercions de votre réservation auprès de Rahalat Bladna. Votre dossier a bien été enregistré sous la référence : ${bookingReference}.\n\nDétails du voyage :\n- Circuit : ${tripTitle}\n- Dates : ${travelDates}\n- Voyageurs : ${passengerCount} personne(s)\n- Ville de départ : ${pickupCity || "Casablanca / Rabat"}\n\nRèglement de l'acompte :\n- Montant Total : ${totalAmount.toLocaleString("fr-MA")} MAD\n- Acompte à régler : ${depositAmount.toLocaleString("fr-MA")} MAD\n- Solde restant dû au départ : ${remainingBalance.toLocaleString("fr-MA")} MAD\n\nCoordonnées bancaires pour le virement (CIH Bank) :\nRIB : 230 810 6784594211008100 80\nBénéficiaire : MOHAMMED AMINE CHAIBAR (Rahalat Bladna)\n\nVotre reçu / devis officiel (Format PDF) est joint à cet email.\nAssistance client : contact@rahalatbladna.ma | Tél / WhatsApp : +212 603-660658`;

    const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.6;">
  <div style="max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
    
    <!-- En-tête Marque Triplan V5 -->
    <div style="background-color: #0B2239; padding: 32px 28px; text-align: center; border-bottom: 3px solid #1BBACA;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        Rahalat Bladna • رحلات بلادنا
      </h1>
      <div style="display: inline-block; margin-top: 10px; padding: 5px 16px; border-radius: 20px; background-color: rgba(27, 186, 202, 0.15); color: #1BBACA; font-size: 11px; font-weight: 700; text-transform: uppercase;">
        ${isAr ? "تم تسجيل الحجز • في انتظار التسبيق" : "Dossier de Réservation Enregistré"}
      </div>
    </div>

    <!-- Contenu Principal -->
    <div style="padding: 35px 30px;">
      <p style="font-size: 16px; font-weight: 700; color: #0B2239; margin-top: 0;">
        ${isAr ? `مرحباً <strong>${clientName}</strong>،` : `Bonjour <strong>${clientName}</strong>,`}
      </p>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        ${
          isAr
            ? `نشكركم على اختيار <strong>رحلات بلادنا</strong> لاكتشاف أجمل وجهات المغرب. تم فتح ملف حجزكم بنجاح برقم المرجع : <strong style="color: #0B2239; font-size: 15px;">${bookingReference}</strong>.`
            : `Nous vous confirmons l'enregistrement de votre réservation pour le circuit <strong>${tripTitle}</strong>. Votre dossier porte la référence : <strong style="color: #0B2239; font-size: 15px;">${bookingReference}</strong>.`
        }
      </p>

      <!-- Carte Détails du Circuit -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #0B2239;">
          ${isAr ? "تفاصيل الرحلة والمسافرين :" : "Détails de votre voyage :"}
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "البرنامج :" : "Circuit :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${tripTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "تاريخ السفر :" : "Dates :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${travelDates}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "عدد الأفراد :" : "Voyageurs :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${passengerCount} personne(s)</td>
          </tr>
          ${
            pickupCity
              ? `<tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "نقطة الركوب :" : "Lieu de ramassage :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${pickupCity}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Récapitulatif Financier -->
      <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #166534;">
          ${isAr ? "البيان المالي والتسبيق المطلوب :" : "Récapitulatif des montants :"}
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;">${isAr ? "المبلغ الإجمالي للرحلة :" : "Montant total de la prestation :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #111827; text-align: ${isAr ? "left" : "right"};">${totalAmount.toLocaleString("fr-MA")} MAD</td>
          </tr>
          <tr style="border-top: 1px dashed #86EFAC; border-bottom: 1px dashed #86EFAC;">
            <td style="padding: 10px 0; font-weight: 800; color: #15803D; font-size: 14px;">${isAr ? "التسبيق المطلوب لتأكيد المقعد :" : "Acompte à régler pour validation :"}</td>
            <td style="padding: 10px 0; font-weight: 900; color: #15803D; font-size: 16px; text-align: ${isAr ? "left" : "right"};">${depositAmount.toLocaleString("fr-MA")} MAD</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4B5563;">${isAr ? "الرصيد المتبقي عند انطلاق الحافلة :" : "Solde restant dû au départ :"}</td>
            <td style="padding: 8px 0; font-weight: bold; color: #4B5563; text-align: ${isAr ? "left" : "right"};">${remainingBalance.toLocaleString("fr-MA")} MAD</td>
          </tr>
        </table>
      </div>

      <!-- Coordonnées Bancaires Officielles -->
      <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #92400E;">
          ${isAr ? "طرق دفع التسبيق (الحساب البنكي الرسمي) :" : "Coordonnées bancaires pour le virement :"}
        </h3>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #78350F;">
          ${isAr ? "يرجى تحويل مبلغ التسبيق إلى الحساب البنكي التالي، وإرسال صورة الوصل :" : "Effectuez votre virement vers le compte bancaire CIH de l'agence :"}
        </p>
        <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; font-weight: bold; color: #0B2239;">
          Banque : CIH Bank<br/>
          RIB : 230 810 6784594211008100 80<br/>
          Bénéficiaire : MOHAMMED AMINE CHAIBAR (Rahalat Bladna)
        </div>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #92400E;">
          ${isAr ? "أرسلوا الوصل عبر واتساب على الرقم 0603660658 مع ذكر رقم الحجز لتأكيد مقعدكم فوراً." : "Envoyez votre preuve de virement par WhatsApp au +212 603-660658 avec votre référence."}
        </p>
      </div>

      <!-- Notification Pièce Jointe PDF -->
      <div style="background-color: #F1F5F9; border-left: 4px solid #1BBACA; border-radius: 8px; padding: 14px 18px; margin: 24px 0; font-size: 13px; color: #334155;">
        📎 <strong>${isAr ? "وثيقة PDF مرفقة :" : "Document joint :"}</strong> 
        ${
          isAr
            ? `تجدون مرفقاً بهذا البريد الإلكتروني ملف PDF الرسمي الخاص بالطلب والتسعيرة : <strong>${fileName}</strong>.`
            : `Votre devis et reçu de réservation officiel est joint au format PDF : <strong>${fileName}</strong>.`
        }
      </div>

      <!-- Bouton CTA vers l'espace client -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://www.rahalatbladna.ma/fr/mon-compte/reservations" target="_blank" style="display: inline-block; background-color: #0B2239; color: #FFFFFF !important; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(11, 34, 57, 0.25);">
          ${isAr ? "متابعة الحجز في حسابي الشخصي" : "Accéder à mon espace voyageur"}
        </a>
      </div>

    </div>

    <!-- Pied de page officiel -->
    <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #94A3B8;">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #64748B;">Rahalat Bladna (رحلات بلادنا) — Voyages Organisés au Maroc</p>
      <p style="margin: 0 0 4px 0;">Email : <a href="mailto:contact@rahalatbladna.ma" style="color: #1BBACA; text-decoration: none;">contact@rahalatbladna.ma</a> | Tél / WhatsApp : +212 603-660658</p>
      <p style="margin: 0;">Régime de l'Auto-Entrepreneur (Loi 114-13) • Rabat & Casablanca, Maroc</p>
    </div>

  </div>
</body>
</html>
    `;

    const res = await dispatchEmail({
      to,
      subject,
      html,
      text,
      replyTo: "contact@rahalatbladna.ma",
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res;
  } catch (err: any) {
    console.error("[sendBookingConfirmationWithPdfEmail] Erreur :", err);
    return { success: false, error: err.message };
  }
}

export interface SendPaymentValidatedParams {
  to: string;
  clientName: string;
  bookingReference: string;
  invoiceNumber: string;
  tripTitle: string;
  travelDates: string;
  amountPaid: number;
  remainingBalance: number;
  totalAmount: number;
  passengerCount?: number;
  pdfBuffer: Buffer;
  pdfFileName?: string;
  locale?: string;
}

/**
 * Envoie l'email officiel de validation de paiement avec la Facture acquittée PDF jointe.
 */
export async function sendPaymentValidatedWithInvoiceEmail({
  to,
  clientName,
  bookingReference,
  invoiceNumber,
  tripTitle,
  travelDates,
  amountPaid,
  remainingBalance,
  totalAmount,
  passengerCount = 1,
  pdfBuffer,
  pdfFileName,
  locale = "fr",
}: SendPaymentValidatedParams): Promise<{ success: boolean; error?: string }> {
  try {
    const isAr = locale === "ar";
    const fileName = pdfFileName || `Facture_${invoiceNumber}.pdf`;

    const isFullyPaid = remainingBalance <= 0;

    const subject = isAr
      ? `رحلات بلادنا | تأكيد استلام الأداء والفاكورة الرسمية ${invoiceNumber} (${tripTitle})`
      : `Rahalat Bladna | Paiement validé & Facture officielle ${invoiceNumber} - ${tripTitle}`;

    const text = isAr
      ? `مرحباً ${clientName}،\n\nنؤكد لكم استلام وتأكيد الأداء الخاص بحجزكم رقم ${bookingReference}.\n\n- الفاتورة الرسمية : ${invoiceNumber}\n- البرنامج : ${tripTitle}\n- تاريخ السفر : ${travelDates}\n- المبلغ المؤدى : ${amountPaid.toLocaleString("fr-MA")} درهم\n- المبلغ الإجمالي : ${totalAmount.toLocaleString("fr-MA")} درهم\n- الرصيد المتبقي : ${remainingBalance.toLocaleString("fr-MA")} درهم\n\nمقعدكم الآن مؤكد ومضمون في الرحلة. تجدون الفاتورة الرسمية (PDF) مرفقة مع هذا البريد الإلكتروني.\n\nفريق رحلات بلادنا\ncontact@rahalatbladna.ma | 0603660658`
      : `Bonjour ${clientName},\n\nNous vous confirmons la bonne réception et validation de votre paiement pour la réservation ${bookingReference}.\n\n- Facture officielle : ${invoiceNumber}\n- Circuit : ${tripTitle}\n- Dates : ${travelDates}\n- Montant encaissé : ${amountPaid.toLocaleString("fr-MA")} MAD\n- Solde restant : ${remainingBalance.toLocaleString("fr-MA")} MAD\n\nVotre place est officiellement garantie à bord ! Votre facture acquittée au format PDF est jointe à cet email.\n\nL'équipe Rahalat Bladna\ncontact@rahalatbladna.ma | +212 603-660658`;

    const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.6;">
  <div style="max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
    
    <!-- En-tête Marque Triplan V5 -->
    <div style="background-color: #0B2239; padding: 32px 28px; text-align: center; border-bottom: 3px solid #10B981;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        Rahalat Bladna • رحلات بلادنا
      </h1>
      <div style="display: inline-block; margin-top: 10px; padding: 5px 16px; border-radius: 20px; background-color: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 11px; font-weight: 700; text-transform: uppercase;">
        ✓ ${isAr ? "تم تأكيد الأداء · المقعد مضمون" : "Paiement Validé · Place Garantie"}
      </div>
    </div>

    <!-- Contenu Principal -->
    <div style="padding: 35px 30px;">
      <p style="font-size: 16px; font-weight: 700; color: #0B2239; margin-top: 0;">
        ${isAr ? `مرحباً <strong>${clientName}</strong>،` : `Bonjour <strong>${clientName}</strong>,`}
      </p>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        ${
          isAr
            ? `يسرنا تأكيد استلام وتحقق قسم المحاسبة من الأداء الخاص بحجزكم <strong>${bookingReference}</strong>. تم تأكيد مقعدكم رسمياً لخوض تجربة : <strong>${tripTitle}</strong>.`
            : `Nous avons le plaisir de vous confirmer la bonne validation de votre paiement pour votre voyage <strong>${tripTitle}</strong> (Réf: <strong style="color: #0B2239;">${bookingReference}</strong>). Vos places sont désormais officiellement réservées et garanties.`
        }
      </p>

      <!-- Récapitulatif Facture -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: bold; color: #64748B;">
            ${isAr ? "رقم الفاتورة الرسمية :" : "Numéro de Facture :"}
          </span>
          <span style="font-family: monospace; font-size: 14px; font-weight: 900; color: #0B2239;">
            ${invoiceNumber}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "البرنامج :" : "Circuit :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${tripTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "تاريخ السفر :" : "Dates :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${travelDates}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "عدد الأفراد :" : "Voyageurs :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0B2239; text-align: ${isAr ? "left" : "right"};">${passengerCount} personne(s)</td>
          </tr>
          <tr style="border-top: 1px dashed #CBD5E1;">
            <td style="padding: 8px 0; color: #166534; font-weight: bold;">${isAr ? "المبلغ المؤدى (مسجل) :" : "Montant réglé & validé :"}</td>
            <td style="padding: 8px 0; font-weight: 900; color: #166534; text-align: ${isAr ? "left" : "right"}; font-size: 15px;">${amountPaid.toLocaleString("fr-MA")} MAD</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">${isAr ? "الرصيد المتبقي عند الانطلاق :" : "Solde restant au départ :"}</td>
            <td style="padding: 6px 0; font-weight: bold; color: ${isFullyPaid ? "#166534" : "#D9784B"}; text-align: ${isAr ? "left" : "right"};">
              ${isFullyPaid ? (isAr ? "0 درهم (مدفوع بالكامل)" : "0 MAD (Réglé à 100%)") : `${remainingBalance.toLocaleString("fr-MA")} MAD`}
            </td>
          </tr>
        </table>
      </div>

      <!-- Notification Pièce Jointe Facture PDF -->
      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; padding: 14px 18px; margin: 24px 0; font-size: 13px; color: #065F46;">
        📎 <strong>${isAr ? "الفاتورة الرسمية مرفقة :" : "Facture officielle jointe :"}</strong> 
        ${
          isAr
            ? `تجدون ملف الفاتورة الرسمية المؤداة بصيغة PDF مرفقاً مع هذه الرسالة : <strong>${fileName}</strong>.`
            : `Votre facture officielle acquittée est attachée au format PDF : <strong>${fileName}</strong>.`
        }
      </div>

      <!-- Bouton CTA Télécharger Billet -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://www.rahalatbladna.ma/fr/mon-compte/reservations" target="_blank" style="display: inline-block; background-color: #10B981; color: #FFFFFF !important; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
          ${isAr ? "تحميل بطاقة الركوب والتذكرة" : "Télécharger mon billet d'embarquement"}
        </a>
      </div>

      <p style="font-size: 13px; color: #64748B; text-align: center;">
        ${isAr ? "نتمنى لكم رحلة ساحرة وممتعة رفقة فريق رحلات بلادنا !" : "Nous vous souhaitons une merveilleuse aventure aux côtés de l'équipe Rahalat Bladna !"}
      </p>

    </div>

    <!-- Pied de page officiel -->
    <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #94A3B8;">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #64748B;">Rahalat Bladna (رحلات بلادنا) — Voyages Organisés & Aventures au Maroc</p>
      <p style="margin: 0 0 4px 0;">Email : <a href="mailto:contact@rahalatbladna.ma" style="color: #1BBACA; text-decoration: none;">contact@rahalatbladna.ma</a> | Tél / WhatsApp : +212 603-660658</p>
      <p style="margin: 0;">Régime de l'Auto-Entrepreneur (Loi 114-13) • Rabat & Casablanca, Maroc</p>
    </div>

  </div>
</body>
</html>
    `;

    const res = await dispatchEmail({
      to,
      subject,
      html,
      text,
      replyTo: "contact@rahalatbladna.ma",
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return res;
  } catch (err: any) {
    console.error("[sendPaymentValidatedWithInvoiceEmail] Erreur :", err);
    return { success: false, error: err.message };
  }
}

// ====================================================
// EMAILS MODULE RECRUTEMENT
// ====================================================

/**
 * Envoie l'accusé de réception automatique au candidat
 */
export async function sendApplicationConfirmationEmail({
  to,
  fullName,
  jobTitle,
  locale = "fr",
}: {
  to: string;
  fullName: string;
  jobTitle: string;
  locale?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const isAr = locale === "ar";
    const subject = isAr
      ? `رحلات بلادنا | تم استلام طلب ترشحكم لمنصب: ${jobTitle}`
      : `Rahalat Bladna | Confirmation de réception de votre candidature : ${jobTitle}`;

    const text = isAr
      ? `مرحباً ${fullName}،\n\nنشكركم على اهتمامكم بالانضمام إلى فريق رحلات بلادنا. لقد تم استلام طلب ترشحكم لمنصب "${jobTitle}" بنجاح.\n\nسيقوم فريق الموارد البشرية بدراسة ملفكم وسنتواصل معكم في حال تطابق مؤهلاتكم مع المنصب المطلوب.\n\nمع خالص التحيات،\nفريق رحلات بلادنا\ncontact@rahalatbladna.ma`
      : `Bonjour ${fullName},\n\nNous vous remercions de votre intérêt pour rejoindre l'aventure Rahalat Bladna. Votre candidature pour le poste "${jobTitle}" a bien été enregistrée.\n\nNotre équipe RH examine attentivement votre profil et nous reviendrons vers vous si vos compétences correspondent à nos attentes.\n\nCordialement,\nL'équipe Rahalat Bladna\ncontact@rahalatbladna.ma`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: #0B2239; padding: 28px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">
            ${isAr ? "رحلات بلادنا • Rahalat Bladna" : "Rahalat Bladna"}
          </h1>
          <p style="color: #1BBACA; margin: 6px 0 0 0; font-size: 13px; font-weight: 700;">
            ${isAr ? "تأكيد استلام طلب الترشح" : "Accusé de réception de candidature"}
          </p>
        </div>
        <div style="padding: 32px; color: #1e293b; line-height: 1.6;" dir="${isAr ? "rtl" : "ltr"}">
          <p style="font-size: 15px; margin-top: 0;">
            ${isAr ? `مرحباً <strong>${fullName}</strong>،` : `Bonjour <strong>${fullName}</strong>,`}
          </p>
          <p style="font-size: 14px; color: #475569;">
            ${
              isAr
                ? `نشكركم على اهتمامكم بالانضمام إلى عائلة <strong>رحلات بلادنا</strong>. نؤكد لكم استلام طلبكم الخاص بمنصب: <br/><strong style="color: #0B2239; font-size: 16px;">${jobTitle}</strong>.`
                : `Nous vous remercions de votre intérêt pour rejoindre l'équipe de <strong>Rahalat Bladna</strong>. Nous vous confirmons la bonne réception de votre candidature pour le poste :<br/><strong style="color: #0B2239; font-size: 16px;">${jobTitle}</strong>.`
            }
          </p>
          <div style="background: #f8fafc; border-left: 4px solid #1BBACA; padding: 14px 18px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #334155;">
              ${
                isAr
                  ? "سيقوم فريق الموارد البشرية والعمليات بدراسة سيرتكم الذاتية بعناية. سنتواصل معكم عبر الهاتف أو البريد الإلكتروني في حال تطابق ملفكم مع متطلبات المنصب."
                  : "Notre équipe recrutement examine votre profil avec attention. Si votre expérience correspond à nos besoins actuels, nous prendrons contact avec vous pour un premier échange."
              }
            </p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            ${isAr ? "نتمنى لكم كامل التوفيق،" : "Nous vous souhaitons pleine réussite dans vos démarches,"}<br/>
            <strong>${isAr ? "فريق رحلات بلادنا" : "L'équipe Rahalat Bladna"}</strong>
          </p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to,
      subject,
      text,
      html,
    });
  } catch (error: any) {
    console.error("[sendApplicationConfirmationEmail] Erreur :", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une alerte interne à l'équipe RH lors d'une nouvelle candidature
 */
export async function sendAdminNewApplicationNotification({
  jobTitle,
  candidateName,
  candidateEmail,
  candidatePhone,
  applicationId,
}: {
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  applicationId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail =
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.CONTACT_EMAIL ||
      "contact@rahalatbladna.ma";

    const subject = `[Nouveau Candidat] ${candidateName} a postulé pour : ${jobTitle}`;
    const text = `Nouvelle candidature reçue !\n\nPoste : ${jobTitle}\nCandidat : ${candidateName}\nEmail : ${candidateEmail}\nTéléphone : ${candidatePhone}\nID Candidature : ${applicationId}\n\nConsultez l'espace admin : https://www.rahalatbladna.ma/fr/admin/recrutement/candidatures`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #0B2239; margin-top: 0;">🚀 Nouvelle candidature reçue</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Poste :</td><td style="font-weight: bold; color: #0B2239;">${jobTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Candidat :</td><td style="font-weight: bold;">${candidateName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email :</td><td><a href="mailto:${candidateEmail}">${candidateEmail}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Téléphone :</td><td><a href="tel:${candidatePhone}">${candidatePhone}</a></td></tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="https://www.rahalatbladna.ma/fr/admin/recrutement/candidatures" style="background: #0B2239; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Ouvrir la candidature dans l'Admin
          </a>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });
  } catch (error: any) {
    console.error("[sendAdminNewApplicationNotification] Erreur :", error);
    return { success: false, error: error.message };
  }
}
