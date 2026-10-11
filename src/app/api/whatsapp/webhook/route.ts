import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingWhatsAppMessage } from '@/lib/whatsapp-agent';

// 1. Vérification initiale requise par Meta (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Accès refusé', { status: 403 });
}

// 2. Réception des messages clients en temps réel (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const senderNumber = message.from;
        const messageText = message.text?.body;

        console.log(`Received message from ${senderNumber}: ${messageText}`);

        // Transmission vers le webhook n8n
        if (process.env.N8N_WEBHOOK_URL && senderNumber && messageText) {
          try {
            const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sender: senderNumber,
                message: messageText,
              }),
            });

            if (n8nResponse.ok) {
              console.log('Message forwarded to n8n successfully.');
            }
          } catch (n8nErr) {
            console.error('Erreur transmission vers n8n:', n8nErr);
          }
        }

        if (senderNumber && messageText) {
          handleIncomingWhatsAppMessage(senderNumber, messageText).catch(console.error);
        }
      }

      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    return new NextResponse('Not found', { status: 404 });
  } catch (error) {
    console.error('Erreur Webhook:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
