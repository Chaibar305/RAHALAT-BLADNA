import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { 
  sendMetaCapiEvent, 
  normalizeMoroccanPhone, 
  hashSha256, 
  normalizeFirstName, 
  normalizeCity 
} from "../src/lib/meta-capi";

async function main() {
  console.log("=================================================");
  console.log("🧪 TEST VALIDATION META PIXEL + CONVERSIONS API");
  console.log("=================================================");

  // 1. Test des fonctions de normalisation
  console.log("\n1️⃣ Tests de normalisation & Hachage SHA-256 :");
  
  const testPhone1 = "06 12 34 56 78";
  const normPhone1 = normalizeMoroccanPhone(testPhone1);
  console.log(`- Téléphone "${testPhone1}" -> "${normPhone1}" (Attendu: 212612345678)`);

  const testPhone2 = "+212 681-024758";
  const normPhone2 = normalizeMoroccanPhone(testPhone2);
  console.log(`- Téléphone "${testPhone2}" -> "${normPhone2}" (Attendu: 212681024758)`);

  const testName = "Mohammed Chaibare";
  const normName = normalizeFirstName(testName);
  console.log(`- Nom "${testName}" -> Prénom: "${normName}" (Attendu: mohammed)`);

  const testCity = "Kénitra";
  const normCity = normalizeCity(testCity);
  console.log(`- Ville "${testCity}" -> "${normCity}" (Attendu: kenitra)`);

  const testEmail = "Test.User@RahalatBladna.ma";
  const hashedEmail = hashSha256(testEmail);
  console.log(`- Email "${testEmail}" -> SHA-256: ${hashedEmail?.substring(0, 16)}...`);

  // 2. Test d'envoi réel à Meta Graph API v19.0 avec le Test Event Code
  console.log("\n2️⃣ Envoi réel d'un événement CAPI de test à Meta Graph API :");
  const testEventId = `test_capi_${Date.now()}`;

  const res = await sendMetaCapiEvent({
    eventName: "InitiateCheckout",
    eventId: testEventId,
    eventSourceUrl: "https://rahalatbladna.ma/fr/trips/taghia-passage-berbere-zaouiat-ahansal",
    userData: {
      email: "voyageur.test@rahalatbladna.ma",
      phone: "+212 681-024758",
      fullName: "Amine Benjelloun",
      city: "Casablanca",
      clientIpAddress: "196.12.34.56",
      clientUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    customData: {
      currency: "MAD",
      value: 1250,
      content_name: "Taghia, Passage berbère & Zaouiat Ahansal",
      content_category: "Circuit Aventure",
      content_ids: ["cmu7oq3u10001n1heilw3lclf"],
      contents: [
        {
          id: "cmu7oq3u10001n1heilw3lclf",
          quantity: 1,
          item_price: 1250,
        },
      ],
      num_items: 1,
    },
  });

  console.log("\n3️⃣ Résultat de la réponse Meta Graph API :");
  console.log(res);

  if (res.success && res.eventsReceived && res.eventsReceived > 0) {
    console.log("\n🎉 TEST CAPI RÉUSSI AVEC SUCCÈS ! Meta a bien reçu et validé l'événement.");
  } else {
    console.error("\n❌ ÉCHEC DU TEST CAPI.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Exception durant le test:", err);
  process.exit(1);
});
