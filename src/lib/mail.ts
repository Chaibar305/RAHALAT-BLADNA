import nodemailer from "nodemailer";

interface SendPasswordResetEmailParams {
  to: string;
  name?: string | null;
  resetUrl: string;
  locale?: string;
}

/**
 * Configure le transporteur Nodemailer avec les variables d'environnement SMTP.
 * Si non configuré, le service fonctionne en mode développement sécurisé (log console).
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "";
  // Les mots de passe d'application Google sont souvent au format "xxxx xxxx xxxx xxxx"
  // On supprime les espaces pour garantir une compatibilité SMTP absolue
  const pass = rawPass.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  // Configuration optimisée pour Gmail
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
 * Génère le modèle HTML premium responsive aux couleurs de Rahalat Bladna.
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
    ? `مرحباً ${recipientName}،\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على رحلات بلادنا.\n\nانقر على الرابط التالي لإنشاء كلمة مرور جديدة :\n${resetUrl}\n\nهذا الرابط صالح لمدة 60 دقيقة فقط.\nإذا لم تكن قد طلبت هذا، يمكنك تجاهل هذا البريد بأمان.\n\nفريق رحلات بلادنا`
    : `Bonjour ${recipientName},\n\nVous avez demandé la réinitialisation de votre mot de passe sur Rahalat Bladna.\n\nCliquez sur le lien ci-dessous pour définir un nouveau mot de passe :\n${resetUrl}\n\nCe lien est valide pendant 60 minutes.\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.\n\nL'équipe Rahalat Bladna`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border: 1px solid #E2E8F0;
    }
    .header {
      background-color: #06121E;
      padding: 35px 30px;
      text-align: center;
      position: relative;
    }
    .header h1 {
      color: #FFFFFF;
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 5px 14px;
      border-radius: 20px;
      background-color: rgba(6, 182, 212, 0.15);
      color: #38BDF8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 35px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #06121E;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 14px;
      color: #475569;
      margin-bottom: 24px;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #0891B2;
      color: #FFFFFF !important;
      padding: 15px 36px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(8, 145, 178, 0.35);
    }
    .security-notice {
      background-color: #F1F5F9;
      border-left: 4px solid #0891B2;
      padding: 16px 20px;
      border-radius: 8px;
      margin-top: 30px;
      font-size: 12px;
      color: #64748B;
    }
    .link-fallback {
      margin-top: 25px;
      font-size: 12px;
      color: #94A3B8;
      word-break: break-all;
    }
    .link-fallback a {
      color: #0891B2;
      text-decoration: underline;
    }
    .footer {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 35px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
    }
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
      <p style="margin: 0;">Plateforme marocaine de voyages et d'aventures authentiques.</p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html, text };
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * Gère le fallback console transparent en environnement de développement local.
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

    const transporter = getEmailTransporter();

    // Si pas de SMTP configuré : journalisation claire pour dev
    if (!transporter) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ 🔑 [EMAIL SERVICE - MODE DEV / CONSOLE]                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Destinataire : ${to.padEnd(57)} ║
║ Nom          : ${(name || "Voyageur").padEnd(57)} ║
║ Sujet        : ${subject.slice(0, 57).padEnd(57)} ║
╠══════════════════════════════════════════════════════════════════════════╣
║ LIEN DE RÉINITIALISATION GÉNÉRÉ :                                        ║
║ ${resetUrl.padEnd(72)} ║
╚══════════════════════════════════════════════════════════════════════════╝
      `);

      return { success: true };
    }

    const senderEmail =
      process.env.EMAIL_FROM ||
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
      process.env.SMTP_USER ||
      "no-reply@rahalatbladna.ma";

    await transporter.sendMail({
      from: `"Rahalat Bladna" <${senderEmail}>`,
      to,
      subject,
      text,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[sendPasswordResetEmail] Erreur d'envoi d'email:", error);
    // En dev, on ne bloque pas le flux si l'envoi SMTP échoue
    return {
      success: false,
      error: error.message || "Erreur lors de l'envoi de l'email.",
    };
  }
}
