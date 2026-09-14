import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log("🧹 Début du nettoyage des données simulées dans PostgreSQL Supabase...");

  // 1. Supprimer les paiements
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✅ ${deletedPayments.count} paiements supprimés.`);

  // 2. Supprimer les factures
  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`✅ ${deletedInvoices.count} factures supprimées.`);

  // 3. Supprimer les devis
  const deletedQuotes = await prisma.quote.deleteMany({});
  console.log(`✅ ${deletedQuotes.count} devis supprimés.`);

  // 4. Supprimer les voyageurs (travelers)
  const deletedTravelers = await prisma.traveler.deleteMany({});
  console.log(`✅ ${deletedTravelers.count} voyageurs supprimés.`);

  // 5. Supprimer les réservations
  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`✅ ${deletedBookings.count} réservations supprimées.`);

  // 6. Supprimer les notifications simulées
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`✅ ${deletedNotifications.count} notifications supprimées.`);

  // 7. Supprimer les affectations staff et partenaires
  const deletedStaffAssignments = await prisma.tripStaff.deleteMany({});
  console.log(`✅ ${deletedStaffAssignments.count} affectations de staff supprimées.`);

  const deletedPartnerAssignments = await prisma.tripPartner.deleteMany({});
  console.log(`✅ ${deletedPartnerAssignments.count} affectations de partenaires supprimées.`);

  // 8. Supprimer les membres de l'équipe simulés (conserver super admin)
  const deletedStaff = await prisma.teamMember.deleteMany({
    where: { role: { not: "SUPER_ADMIN" } },
  });
  console.log(`✅ ${deletedStaff.count} membres d'équipe simulés supprimés.`);

  // 9. Supprimer les partenaires simulés
  const deletedPartners = await prisma.partner.deleteMany({});
  console.log(`✅ ${deletedPartners.count} partenaires simulés supprimés.`);

  // 10. Supprimer les utilisateurs clients de test (conserver les comptes SUPER_ADMIN / ADMIN)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: "CLIENT",
      email: {
        in: ["youssef.bennani@gmail.com", "salma.idrissi@yahoo.fr"],
      },
    },
  });
  console.log(`✅ ${deletedUsers.count} comptes clients de test supprimés.`);

  console.log("\n✨ Base de données entièrement nettoyée et prête pour les données réelles !");
}

cleanMockData()
  .catch((e) => {
    console.error("❌ Erreur pendant le nettoyage:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
