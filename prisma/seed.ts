import "dotenv/config";
import { prisma } from "../lib/db";
import seed from "../seed.json";


async function main() {
  console.log("🚀 Starting seeding process...");

  // Clear existing debt entries and payments to prevent duplicates
  console.log("🧹 Cleaning up existing payments and debt entries...");
  await prisma.payment.deleteMany({});
  await prisma.debtEntry.deleteMany({});


  const debtEntries = seed.debtEntries;
  console.log(`📥 Found ${debtEntries.length} debt entries in seed.json. Seeding now...`);

  let count = 0;
  for (const debt of debtEntries) {
    await prisma.debtEntry.create({
      data: {
        customerName: debt.customerName,
        totalDebt: debt.totalDebt,
        amountPaid: debt.amountPaid,
        balance: debt.balance,
        notes: debt.notes,
        createdBy: "58f10614-a441-4855-b3f7-9eba08938481",
        createdAt: new Date(debt.createdAt),
        updatedAt: new Date(debt.updatedAt),
        payments: {
          create: debt.payments.map((payment) => ({
            amount: payment.amount,
            paidBy: "58f10614-a441-4855-b3f7-9eba08938481",
            note: payment.note,
            paidAt: new Date(payment.paidAt),
          })),
        },
      },
    });
    count++;
  }

  console.log(`✅ Seeding completed! Successfully seeded ${count} debt entries.`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });