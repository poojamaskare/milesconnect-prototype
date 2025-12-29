require("dotenv/config");

const { PrismaClient } = require("../src/generated/prisma");

function redactDatabaseUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

async function main() {
  const prisma = new PrismaClient();

  console.log({ DATABASE_URL: redactDatabaseUrl(process.env.DATABASE_URL) });
  try {
    const info = await prisma.$queryRawUnsafe(
      "select current_database() as db, inet_server_addr() as addr, inet_server_port() as port"
    );
    console.log({ connectedTo: info });
  } catch (e) {
    console.log({ connectedTo: "<raw query unavailable>", error: String(e) });
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.driver.count(),
    prisma.vehicle.count(),
    prisma.shipment.count(),
    prisma.tripSheet.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.document.count(),
  ]);

  console.log({
    users: counts[0],
    drivers: counts[1],
    vehicles: counts[2],
    shipments: counts[3],
    tripSheets: counts[4],
    invoices: counts[5],
    payments: counts[6],
    documents: counts[7],
  });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
