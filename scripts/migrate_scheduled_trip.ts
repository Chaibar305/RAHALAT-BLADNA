import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Applying migration for isScheduledThisWeek and featuredWeekMessage...");
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Trip" 
    ADD COLUMN IF NOT EXISTS "isScheduledThisWeek" BOOLEAN NOT NULL DEFAULT false;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Trip" 
    ADD COLUMN IF NOT EXISTS "featuredWeekMessage" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Trip_isScheduledThisWeek_idx" 
    ON "Trip"("isScheduledThisWeek");
  `);

  console.log("✅ Columns and index added to Postgres Trip table.");

  // Test query
  const testTrip = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, "titleFr", "isScheduledThisWeek", "featuredWeekMessage" 
    FROM "Trip" 
    LIMIT 1;
  `);

  console.log("Sample query result:", testTrip);
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
