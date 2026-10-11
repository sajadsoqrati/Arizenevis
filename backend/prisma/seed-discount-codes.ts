import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { join } from "node:path";

function loadWelcomeCodes(): unknown {
  const inventoryPath = join(__dirname, "welcome-codes.ts");
  if (!existsSync(inventoryPath)) {
    throw new Error(
      "Private discount inventory is missing. Restore backend/prisma/welcome-codes.ts " +
      "from your secure backup before seeding. No discount codes were changed.",
    );
  }
  // Runtime-only import: builds and tests must not require the private inventory.
  return (require(inventoryPath) as { WELCOME_CODES: unknown }).WELCOME_CODES;
}

export async function seedDiscountCodes(prisma: PrismaClient, codes?: readonly string[]) {
  const inventory = codes ?? loadWelcomeCodes();
  if (
    !Array.isArray(inventory) || inventory.length !== 1000 ||
    new Set(inventory).size !== 1000 ||
    !inventory.every((code) => typeof code === "string" && /^WELCOME-[A-F0-9]{16}$/.test(code))
  ) {
    throw new Error("Discount inventory must contain exactly 1,000 unique valid codes.");
  }
  return prisma.$transaction(async (tx) => {
    // Preserve historical payments while retiring the shared code.
    await tx.discountCode.updateMany({
      where: { code: "WELCOME100" },
      data: { isActive: false },
    });
    // Existing codes retain their usage counts and active/inactive state.
    return tx.discountCode.createMany({
      data: inventory.map((code: string) => ({
        code,
        percentOff: 100,
        firstTimeOnly: true,
        maxUses: 1,
      })),
      skipDuplicates: true,
    });
  });
}
