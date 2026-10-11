import { prisma } from '@/lib/prisma';
import { sendWhatsAppAction, sendWhatsAppTextMessage } from '@/lib/whatsapp-sender';

export interface ExecuteModelPromptParams {
  customerPhone: string;
  userMessage: string;
  currentLead: any;
  catalog: Array<{ id: string; titleFr: string; basePrice: any; slug: string }>;
}

export interface ModelPromptResult {
  textReply: string;
  toolCalls?: Array<{
    name: string;
    args: {
      customerName?: string;
      totalPrice?: number;
      callStatus?: string;
      callNotes?: string;
      tripId?: string;
    };
  }>;
}

/**
 * Exécute l'analyse IA via LLM (OpenAI / Claude ou moteur de réponse contextuel)
 */
export async function executeModelPrompt({
  customerPhone,
  userMessage,
  currentLead,
  catalog,
}: ExecuteModelPromptParams): Promise<ModelPromptResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  const catalogContext = catalog
    .map((t) => `• ${t.titleFr} : à partir de ${Number(t.basePrice)} MAD (id: ${t.id}, lien: https://rahalatbladna.ma/fr/circuits/${t.slug})`)
    .join('\n');

  const systemPrompt = `Tu es l'assistant de voyage officiel de l'agence marocaine "Rahalat Bladna" (رحلات بلادنا).
Ton rôle est d'accueillir chaleureusement les voyageurs sur WhatsApp, de répondre à leurs questions sur nos circuits organisés au Maroc, de leur donner les tarifs et programmes, et de les aider à réserver.

CATALOGUE DES CIRCUITS ACTUELS :
${catalogContext}

PROSPECT ACTUEL :
Téléphone : ${customerPhone}
Dossier existant : ${currentLead ? `Réf: ${currentLead.reference}, Circuit: ${currentLead.trip?.titleFr}` : 'Nouveau prospect'}

CONSIGNES :
1. Réponds de façon concise, courtoise et professionnelle (en français convivial, ou en arabe/darija si le client s'exprime en arabe).
2. Utilise des emojis adaptés (🐪, 🇲🇦, ✨).
3. Si le client souhaite réserver ou manifeste un intérêt confirmé pour un circuit, invite-le à confirmer son nom complet et déclenche l'outil "saveOrUpdateBookingLead".`;

  // Appel externe si une clé API OpenAI est configurée
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'saveOrUpdateBookingLead',
                description: 'Enregistre ou met à jour les coordonnées du prospect et son intérêt pour un circuit',
                parameters: {
                  type: 'object',
                  properties: {
                    customerName: { type: 'string', description: 'Nom et prénom du client' },
                    tripId: { type: 'string', description: 'ID du circuit choisi dans le catalogue' },
                    totalPrice: { type: 'number', description: 'Tarif indicatif en MAD' },
                    callStatus: { type: 'string', enum: ['CONFIRMED_PHONE', 'CALLBACK_SCHEDULED', 'PENDING_CALL'] },
                    callNotes: { type: 'string', description: 'Résumé de la demande du voyageur' },
                  },
                },
              },
            },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0]?.message;
        const toolCalls = choice?.tool_calls?.map((tc: any) => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || '{}'),
        }));

        return {
          textReply: choice?.content || "Salam ! Comment puis-je vous aider pour vos prochaines vacances avec Rahalat Bladna ? 🐪✨",
          toolCalls,
        };
      }
    } catch (err) {
      console.warn('[WhatsApp Agent] Erreur appel API LLM externe, repli sur le moteur interne:', err);
    }
  }

  // Moteur contextuel de secours (Fallback automatique sans clé LLM)
  const lowerMsg = userMessage.toLowerCase();
  const matchedTrip = catalog.find((t) => lowerMsg.includes(t.titleFr.toLowerCase())) || catalog[0];

  let replyText = `Salam 👋 Bienvenue chez *Rahalat Bladna* ! 🐪🇲🇦\n\nNous organisons des circuits inoubliables au Maroc (Désert de Merzouga, Dakhla, Akchour, Ouzoud, etc.).`;

  if (matchedTrip) {
    replyText += `\n\n📌 Découvrez par exemple notre programme : *${matchedTrip.titleFr}* à partir de *${Number(matchedTrip.basePrice)} MAD*.\nConsultez tous les détails ici : https://rahalatbladna.ma/fr/circuits/${matchedTrip.slug}`;
  }

  replyText += `\n\nQuel circuit ou quelle date de départ vous intéresse ? Notre équipe reste à votre écoute pour organiser votre voyage ! ✨`;

  return {
    textReply: replyText,
    toolCalls: matchedTrip ? [
      {
        name: 'saveOrUpdateBookingLead',
        args: {
          callStatus: 'PENDING_CALL',
          callNotes: `Message WhatsApp reçu : "${userMessage.slice(0, 150)}"`,
          tripId: matchedTrip.id,
          totalPrice: Number(matchedTrip.basePrice) || 0,
        },
      },
    ] : undefined,
  };
}

/**
 * Orchestrateur de traitement des messages entrants WhatsApp
 */
export async function handleIncomingWhatsAppMessage(phone: string, text: string): Promise<void> {
  // 1. Activer le statut "en train d'écrire..." sur WhatsApp pour un comportement humain
  await sendWhatsAppAction(phone, 'typing');

  // 2. Pause artificielle anti-blocage (3 secondes)
  await new Promise((r) => setTimeout(r, 3000));

  // 3. Récupérer ou initialiser la session prospect dans Prisma
  const cleanPhone = phone.slice(-9);
  let lead = await prisma.booking.findFirst({
    where: {
      OR: [
        { user: { phone: { contains: cleanPhone } } },
        { travelers: { some: { phone: { contains: cleanPhone } } } },
      ],
    },
    include: {
      user: true,
      trip: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Charger le catalogue des circuits actifs pour alimenter le contexte
  const activeTrips = await prisma.trip.findMany({
    where: { isActive: true },
    select: { id: true, titleFr: true, basePrice: true, slug: true },
  });

  // 5. Exécuter l'appel au modèle (Claude / OpenAI) avec le System Prompt
  const aiResponse = await executeModelPrompt({
    customerPhone: phone,
    userMessage: text,
    currentLead: lead,
    catalog: activeTrips,
  });

  // 6. Exécuter les outils demandés par l'IA (Tool Calling)
  if (aiResponse.toolCalls) {
    for (const tool of aiResponse.toolCalls) {
      if (tool.name === 'saveOrUpdateBookingLead') {
        try {
          // Rechercher ou créer le compte User associé au numéro de téléphone
          let user = await prisma.user.findFirst({
            where: { phone: { contains: cleanPhone } },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: tool.args.customerName || `Prospect WhatsApp ${phone.slice(-4)}`,
                fullName: tool.args.customerName || `Prospect WhatsApp ${phone.slice(-4)}`,
                email: `whatsapp_${phone.replace(/\D/g, '')}@rahalatbladna.ma`,
                phone: phone,
                role: 'CLIENT',
              },
            });
          } else if (tool.args.customerName && user.name?.startsWith('Prospect WhatsApp')) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                name: tool.args.customerName,
                fullName: tool.args.customerName,
              },
            });
          }

          if (lead) {
            await prisma.booking.update({
              where: { id: lead.id },
              data: {
                callStatus: (tool.args.callStatus as any) || 'CONFIRMED_PHONE',
                callNotes: tool.args.callNotes || undefined,
                totalAmount: tool.args.totalPrice ? Number(tool.args.totalPrice) : undefined,
              },
            });
          } else {
            const selectedTrip = activeTrips.find((t) => t.id === tool.args.tripId) || activeTrips[0];
            if (selectedTrip) {
              const randomRef = `RB-WA-${Date.now().toString().slice(-6)}`;
              lead = await prisma.booking.create({
                data: {
                  reference: randomRef,
                  userId: user.id,
                  tripId: selectedTrip.id,
                  totalAmount: tool.args.totalPrice ? Number(tool.args.totalPrice) : Number(selectedTrip.basePrice || 0),
                  depositAmount: 500,
                  source: 'whatsapp_ai',
                  callStatus: (tool.args.callStatus as any) || 'CONFIRMED_PHONE',
                  callNotes: tool.args.callNotes,
                },
                include: { user: true, trip: true },
              });
            }
          }
        } catch (dbErr) {
          console.error('[WhatsApp Agent] Erreur enregistrement prospect lead:', dbErr);
        }
      }
    }
  }

  // 7. Expédier la réponse textuelle au voyageur
  if (aiResponse.textReply) {
    await sendWhatsAppTextMessage(phone, aiResponse.textReply);
  }
}
