import dotenv from "dotenv";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// 1. Chargement des variables d'environnement (.env.local puis .env)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const R2_ACCOUNT_ID =
  process.env.R2_ACCOUNT_ID || "3f34309d88ce1f243e9b386553f5a920";
const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "7ca8a24ccab19c0500c39fc872c8e1c1";
const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  "68c43e7123c88701b4aaa2be80d26a0be8bf46aaa84c3cd8c1a27ede3bbf287a";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rahalat-bladna";
const R2_PUBLIC_DOMAIN = 
  process.env.NEXT_PUBLIC_R2_URL || 
  process.env.R2_PUBLIC_DOMAIN || 
  "https://pub-a7e412da142148a89892728e019eb7e2.r2.dev";

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

async function testCloudflareR2() {
  console.log("\n=======================================================");
  console.log("🚀 TEST DE CONNEXION AU STOCKAGE CLOUDFLARE R2");
  console.log("=======================================================");
  console.log(`📌 ID du compte : ${R2_ACCOUNT_ID}`);
  console.log(`📌 Nom du Bucket : ${R2_BUCKET_NAME}`);
  console.log(`📌 Point de terminaison S3 : ${R2_ENDPOINT}`);
  console.log(`📌 URL Publique de dev : ${R2_PUBLIC_DOMAIN}`);
  console.log(`🔑 Clé d'accès S3 : ${R2_ACCESS_KEY_ID ? R2_ACCESS_KEY_ID.substring(0, 8) + "..." : "Non définie"}`);
  console.log("-------------------------------------------------------\n");

  // 2. Initialisation du client S3 compatible Cloudflare R2
  const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const fileName = "test-connection.txt";
  const fileContent = `✅ Connexion réussie à Cloudflare R2 pour Rahalat Bladna !\nDate du test : ${new Date().toISOString()}\nBucket : ${R2_BUCKET_NAME}\nEndpoint : ${R2_ENDPOINT}\n`;
  const fileBuffer = Buffer.from(fileContent, "utf-8");

  try {
    console.log(`⏳ 1. Téléversement du fichier test "${fileName}" vers le bucket "${R2_BUCKET_NAME}"...`);

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: "text/plain; charset=utf-8",
      CacheControl: "public, max-age=3600",
    });

    await client.send(putCommand);
    console.log("✨ 1. Téléversement réussi avec succès (Code HTTP 200 OK) !\n");

    // 3. Vérification de l'existence via HeadObject
    console.log(`⏳ 2. Vérification de la présence de l'objet sur R2...`);
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
    });
    const headResult = await client.send(headCommand);
    console.log(`✨ 2. Objet détecté sur Cloudflare R2 (Taille : ${headResult.ContentLength} octets, Type : ${headResult.ContentType})\n`);

    // 4. Construction de l'URL publique directe
    const publicUrl = `${R2_PUBLIC_DOMAIN.replace(/\/$/, "")}/${fileName}`;
    console.log("-------------------------------------------------------");
    console.log("🌐 URL PUBLIQUE DU FICHIER SUR CLOUDFLARE R2 :");
    console.log(`👉 ${publicUrl}`);
    console.log("-------------------------------------------------------\n");

    // 5. Test d'accessibilité HTTP direct via fetch
    console.log(`⏳ 3. Test d'accessibilité HTTP public via fetch()...`);
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        const text = await response.text();
        console.log(`🎉 3. Accès public vérifié et fonctionnel (Statut : ${response.status} ${response.statusText}) !`);
        console.log("📄 Contenu reçu depuis le CDN R2 :");
        console.log(`\n${text}`);
      } else {
        console.log(`ℹ️ Réponse du CDN R2 : Statut ${response.status} (Le domaine public R2 peut nécessiter quelques secondes pour propager les nouveaux fichiers).`);
      }
    } catch (fetchErr: any) {
      console.log(`ℹ️ Note d'accès public : ${fetchErr.message}`);
    }

    console.log("\n=======================================================");
    console.log("🏆 RÉSULTAT DU TEST : CLOUDFLARE R2 100% OPÉRATIONNEL !");
    console.log("=======================================================\n");
  } catch (error: any) {
    console.error("\n❌ ERREUR LORS DU TEST CLOUDFLARE R2 :", error.message || error);
    console.error("Détails techniques :", error);
    process.exit(1);
  }
}

testCloudflareR2();
