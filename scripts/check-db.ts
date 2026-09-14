/**
 * Script de diagnostic : Connexion PostgreSQL Supabase
 * Usage : npx tsx scripts/check-db.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import net from "net";

// Charger le .env depuis la racine du projet
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";

function ok(msg: string)   { console.log(`${GREEN}${BOLD}✅ ${msg}${RESET}`); }
function err(msg: string)  { console.error(`${RED}${BOLD}❌ ${msg}${RESET}`); }
function warn(msg: string) { console.warn(`${YELLOW}${BOLD}⚠️  ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ️  ${msg}${RESET}`); }
function sep()             { console.log("─".repeat(62)); }

async function checkTcp(host: string, port: number, label: string, timeout = 8000) {
  return new Promise<boolean>((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on("connect", () => { sock.destroy(); ok(`TCP ${label} → ${host}:${port} OUVERT`); resolve(true); });
    sock.on("timeout", () => { sock.destroy(); err(`TCP ${label} → ${host}:${port} TIMEOUT (${timeout}ms)`); resolve(false); });
    sock.on("error",   (e) => { sock.destroy(); err(`TCP ${label} → ${host}:${port} ERREUR: ${e.message}`); resolve(false); });
    sock.connect(port, host);
  });
}

async function main() {
  console.log(`\n${BOLD}${CYAN}═══════════ Diagnostic Connexion Supabase PostgreSQL ═══════════${RESET}\n`);

  // ── 1. Vérification des variables d'environnement ──────────────
  sep();
  info("Étape 1 : Variables d'environnement");
  sep();

  const dbUrl    = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!dbUrl) {
    err("DATABASE_URL manquante dans .env !");
    process.exit(1);
  }
  ok(`DATABASE_URL chargée : ${dbUrl.slice(0, 60)}...`);

  if (!directUrl) {
    warn("DIRECT_URL non définie (optionnelle pour les migrations)");
  } else {
    ok(`DIRECT_URL chargée  : ${directUrl.slice(0, 60)}...`);
  }

  // ── 2. Extraction de l'hôte depuis l'URL ──────────────────────
  let host = "aws-0-eu-central-1.pooler.supabase.com";
  let port6543 = 6543;
  let port5432 = 5432;
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
  } catch {
    warn("Impossible de parser l'URL, utilisation du host par défaut.");
  }

  // ── 3. Test TCP ────────────────────────────────────────────────
  sep();
  info("Étape 2 : Test de connectivité TCP réseau");
  sep();

  const tcp6543 = await checkTcp(host, port6543, "Transaction Pooler pgbouncer");
  const tcp5432 = await checkTcp(host, port5432, "Session Pooler / Direct");

  if (!tcp6543 && !tcp5432) {
    err("Aucun port Supabase accessible ! Vérifiez votre connexion Internet ou VPN.");
    process.exit(1);
  }

  // ── 4. Test Prisma ─────────────────────────────────────────────
  sep();
  info("Étape 3 : Test requête Prisma ($queryRaw)");
  sep();

  const prisma = new PrismaClient({
    log: ["error"],
    datasources: { db: { url: dbUrl } },
  });

  try {
    const startPing = Date.now();
    const result = await prisma.$queryRaw<[{ test: number }]>`SELECT 1 AS test`;
    const latency = Date.now() - startPing;

    if (result[0]?.test === 1) {
      ok(`Connexion PostgreSQL Supabase réussie à 100% (latence: ${latency}ms)`);
    } else {
      warn("Requête retournée mais résultat inattendu : " + JSON.stringify(result));
    }
  } catch (e: any) {
    err("Échec $queryRaw — Erreur exacte :");
    console.error(`  ${RED}${e.message}${RESET}`);

    if (e.message.includes("Timed out")) {
      warn("→ Le pool de connexions est saturé. Redémarrez le serveur de dev.");
    } else if (e.message.includes("password")) {
      warn("→ Authentification rejetée. Vérifiez le mot de passe dans DATABASE_URL.");
    } else if (e.message.includes("ENOTFOUND") || e.message.includes("getaddrinfo")) {
      warn("→ Hôte introuvable. Pas de résolution DNS. Vérifiez Internet.");
    } else if (e.message.includes("ETIMEDOUT") || e.message.includes("connect ETIMEDOUT")) {
      warn("→ Connexion TCP timeout. Possible firewall ou VPN bloquant.");
    }

    await prisma.$disconnect();
    process.exit(1);
  }

  // ── 5. Comptage des partenaires ────────────────────────────────
  sep();
  info("Étape 4 : Comptage des partenaires en base");
  sep();

  try {
    const count = await prisma.partner.count();
    ok(`Partenaires enregistrés en base : ${BOLD}${count}${RESET}${GREEN}`);
  } catch (e: any) {
    err("Impossible de compter les partenaires :");
    console.error(`  ${RED}${e.message}${RESET}`);
  }

  // ── 6. Test création/suppression rapide ───────────────────────
  sep();
  info("Étape 5 : Test CREATE + DELETE (round-trip complet)");
  sep();

  try {
    const start = Date.now();
    const testPartner = await prisma.partner.create({
      data: {
        type: "LEISURE_ACTIVITY",
        companyName: "__DIAG_TEST__",
        contactName: "Diagnostic",
        phone: "0000000000",
        city: "Test",
        email: null,
        notes: null,
      },
    });
    await prisma.partner.delete({ where: { id: testPartner.id } });
    const duration = Date.now() - start;
    ok(`CREATE + DELETE réussi en ${duration}ms → Enregistrement partenaire 100% fonctionnel !`);
  } catch (e: any) {
    err("Échec du test CREATE/DELETE :");
    console.error(`  ${RED}${e.message}${RESET}`);
  }

  await prisma.$disconnect();

  sep();
  ok("Diagnostic terminé.");
  console.log();
}

main().catch((e) => {
  err("Erreur fatale dans le script de diagnostic :");
  console.error(e);
  process.exit(1);
});
