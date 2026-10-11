import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedDiscountCodes } from "./seed-discount-codes";

const prisma = new PrismaClient();
seedDiscountCodes(prisma)
  .then(({ count }) => console.log(`Added ${count} single-use discount codes. WELCOME100 is disabled.`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
