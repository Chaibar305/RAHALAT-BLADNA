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
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    // Ignorer les statuts de lecture ou les messages sans texte
    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const customerPhone = message.from; // Numéro au format international (ex: 2126XXXXXXXX)
    const incomingText = message.text.body;

    // Déclencher le traitement par l'agent IA de manière asynchrone
    handleIncomingWhatsAppMessage(customerPhone, incomingText).catch(console.error);

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Erreur Webhook:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
