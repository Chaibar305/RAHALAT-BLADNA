import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Service officiel d'envoi d'emails transactionnels via l'API Resend.
 * Expéditeur par défaut : "Rahalat Bladna" <contact@rahalatbladna.ma>
 */
export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  attachments,
}: SendEmailPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!resend) {
    console.warn("⚠️ [Resend] Clé API RESEND_API_KEY non configurée.");
    return {
      success: false,
      error: "Service d'envoi d'emails (Resend) non initialisé.",
    };
  }

  const sender = from || process.env.RESEND_FROM_EMAIL || "Rahalat Bladna <contact@rahalatbladna.ma>";
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const payload: any = {
      from: sender,
      to: recipients,
      subject,
      html,
    };

    if (text) {
      payload.text = text;
    }

    if (replyTo) {
      payload.reply_to = replyTo;
    } else {
      payload.reply_to = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@rahalatbladna.ma";
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
      }));
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("❌ [Resend Error]:", error);

      // Si le domaine rahalatbladna.ma n'est pas encore vérifié dans le dashboard Resend
      if (
        error.message?.includes("domain is not verified") ||
        error.name === "validation_error" ||
        (error as any).statusCode === 403
      ) {
        console.warn(
          "⚠️ [Resend Note] Le domaine d'envoi doit être validé sur https://resend.com/domains pour contact@rahalatbladna.ma"
        );
      }

      return {
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email via Resend.",
      };
    }

    console.log(`✅ [Resend] Email envoyé avec succès à ${recipients.join(", ")} (ID: ${data?.id})`);
    return { success: true, data };
  } catch (err: any) {
    console.error("❌ [Resend Exception]:", err);
    return {
      success: false,
      error: err.message || "Exception survenue lors de l'envoi de l'email.",
    };
  }
}
