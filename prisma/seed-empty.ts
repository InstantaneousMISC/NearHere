import { PrismaClient } from "@prisma/client";
import { rawCategories } from "../src/data/advertiserCategories";

const prisma = new PrismaClient();

interface CategoryDef {
  name: string;
  slug: string;
  allowsMultipleAdvertisers: boolean;
  defaultPrice: number; // cents
}

// Build 150+ categories dynamically from rawCategories
const categories: CategoryDef[] = rawCategories.map((cat) => {
  const allowsMultipleAdvertisers =
    cat.parentCategory === "food-beverage-hospitality" || cat.slug === "event-venues";

  let defaultPrice = 39900; // default for retail, specialty, etc.

  if (cat.parentCategory === "food-beverage-hospitality") {
    defaultPrice = 29900;
  } else if (cat.parentCategory === "home-services") {
    if (cat.slug === "plumbers") defaultPrice = 89900;
    else if (cat.slug === "hvac" || cat.slug === "roofers") defaultPrice = 79900;
    else if (cat.slug === "electricians") defaultPrice = 69900;
    else if (cat.slug === "pressure-washing") defaultPrice = 49900;
    else if (cat.slug === "carpet-cleaning") defaultPrice = 39900;
    else defaultPrice = 59900;
  } else if (cat.parentCategory === "real-estate-financial") {
    defaultPrice = 59900;
  } else if (cat.parentCategory === "health-wellness-beauty") {
    if (cat.slug === "dentists") defaultPrice = 69900;
    else defaultPrice = 49900;
  } else if (cat.parentCategory === "professional-local-services") {
    defaultPrice = 49900;
  } else if (cat.parentCategory === "automotive") {
    defaultPrice = 49900;
  }

  return {
    name: cat.label,
    slug: cat.slug,
    allowsMultipleAdvertisers,
    defaultPrice,
  };
});

async function main() {
  console.log("🌱 Seeding database with categories and admin user only (no campaigns)...\n");

  // 1. Upsert Business Categories
  console.log("📁 Upserting business categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const record = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        allowsMultipleAdvertisers: cat.allowsMultipleAdvertisers,
        defaultPrice: cat.defaultPrice,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        allowsMultipleAdvertisers: cat.allowsMultipleAdvertisers,
        defaultSpotType: "STANDARD",
        defaultPrice: cat.defaultPrice,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`  ✅ Total categories upserted: ${categoryMap.size}\n`);

  // 2. Upsert Admin User
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@localspotmailers.com";
  console.log("👤 Upserting admin user...");

  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      supabaseUserId: "6a43af92-16fe-4873-9f64-1dd278d794c2",
    },
    create: {
      email: adminEmail,
      supabaseUserId: "6a43af92-16fe-4873-9f64-1dd278d794c2",
      role: "SUPER_ADMIN",
    },
  });

  console.log(`  ✅ ${adminUser.email} (role: ${adminUser.role})\n`);
  console.log("🎉 Empty campaign seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
