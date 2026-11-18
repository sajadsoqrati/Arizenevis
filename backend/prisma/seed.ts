import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/bcrypt";
import { seedDiscountCodes } from "./seed-discount-codes";

const prisma = new PrismaClient();

const marketers = [
  {
    fullName: "marketer1",
    nationalId: "1010101010",
    referralCode: "MK-MARKETER1",
    password: "!09kNhTl",
    phone: "09121111111",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer2",
    nationalId: "2020202020",
    referralCode: "MK-MARKETER2",
    password: "AeAM!FL5",
    phone: "09122222222",
    city: "اصفهان",
    province: "اصفهان",
    jobTitle: "بازاریاب",
  },
  {
    fullName:"marketer3",
    nationalId: "3030303030",
    referralCode: "MK-MARKETER3",
    password: "ou5n2U!P",
    phone: "09123333333",
    city: "شیراز",
    province: "فارس",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer4",
    nationalId: "4040404040",
    referralCode: "MK-MARKETER4",
    password: "3VkguP1!",
    phone: "09124444444",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer5",
    nationalId: "5050505050",
    referralCode: "MK-MARKETER5",
    password: "GFApb9!h",
    phone: "09125555555",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer6",
    nationalId: "6060606060",
    referralCode: "MK-MARKETER6",
    password: "8lFT8!oI",
    phone: "09126666666",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer7",
    nationalId: "7070707070",
    referralCode: "MK-MARKETER7",
    password: "1B!cf24x",
    phone: "09127777777",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer8",
    nationalId: "8080808080",
    referralCode: "MK-MARKETER8",
    password: "ME7K!Zbj",
    phone: "09128888888",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer9",
    nationalId: "9090909090",
    referralCode: "MK-MARKETER9",
    password: "zl!NlD72",
    phone: "09129999999",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "marketer10",
    nationalId: "1010101011",
    referralCode: "MK-MARKETER10",
    password: "s3HEG!If",
    phone: "09121010101",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
] as const;

async function main() {
  const adminNationalId = process.env.ADMIN_NATIONAL_ID || "0000000000";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const adminHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { nationalId: adminNationalId },
    update: {},
    create: {
      fullName: "مدیر سیستم",
      nationalId: adminNationalId,
      jobTitle: "مدیر",
      role: Role.ADMIN,
      passwordHash: adminHash,
      phone: "09120000000",
      city: "تهران",
      province: "تهران",
    },
  });

  for (const marketer of marketers) {
    const marketerHash = await hashPassword(marketer.password);
    const user = await prisma.user.upsert({
      where: { nationalId: marketer.nationalId },
      update: {
        passwordHash: marketerHash,
        fullName: marketer.fullName,
        jobTitle: marketer.jobTitle,
        phone: marketer.phone,
        city: marketer.city,
        province: marketer.province,
      },
      create: {
        fullName: marketer.fullName,
        nationalId: marketer.nationalId,
        jobTitle: marketer.jobTitle,
        role: Role.MARKETER,
        passwordHash: marketerHash,
        phone: marketer.phone,
        city: marketer.city,
        province: marketer.province,
      },
    });

    await prisma.marketerProfile.upsert({
      where: { userId: user.id },
      update: { referralCode: marketer.referralCode },
      create: {
        userId: user.id,
        referralCode: marketer.referralCode,
      },
    });
  }

  const categories = [
    { slug: "ezharnameh", title: "اظهارنامه" },
    { slug: "gharardad", title: "قراردادنویسی" },
    { slug: "moshavareh", title: "مشاوره" },
    { slug: "layeheh", title: "لایحه" },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { title: cat.title },
      create: cat,
    });
  }

  await seedDiscountCodes(prisma);

  console.log("Seed completed:");
 
  console.log("  Marketers:");
  for (const marketer of marketers) {
    console.log(
      `    ${marketer.fullName} (${marketer.nationalId}) — ${marketer.referralCode}`
    );
  }
  console.log("  Categories: 4 service types");
  console.log("  Discount codes: 1,000 predefined single-use codes (100% off, first purchase only)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
