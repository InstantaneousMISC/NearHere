import { PrismaClient, SpotType, PostcardSide } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Category Definitions ────────────────────────────────────────────────────

interface CategoryDef {
  name: string;
  slug: string;
  allowsMultipleAdvertisers: boolean;
  defaultPrice: number; // cents
}

const categories: CategoryDef[] = [
  { name: "Plumbing", slug: "plumbing", allowsMultipleAdvertisers: false, defaultPrice: 89900 },
  { name: "HVAC", slug: "hvac", allowsMultipleAdvertisers: false, defaultPrice: 79900 },
  { name: "Roofing", slug: "roofing", allowsMultipleAdvertisers: false, defaultPrice: 79900 },
  { name: "Electrical", slug: "electrical", allowsMultipleAdvertisers: false, defaultPrice: 69900 },
  { name: "Dentistry", slug: "dentistry", allowsMultipleAdvertisers: false, defaultPrice: 69900 },
  { name: "Landscaping", slug: "landscaping", allowsMultipleAdvertisers: false, defaultPrice: 59900 },
  { name: "Pressure Washing", slug: "pressure-washing", allowsMultipleAdvertisers: false, defaultPrice: 49900 },
  { name: "Real Estate", slug: "real-estate", allowsMultipleAdvertisers: false, defaultPrice: 59900 },
  { name: "Pest Control", slug: "pest-control", allowsMultipleAdvertisers: false, defaultPrice: 59900 },
  { name: "Auto Repair", slug: "auto-repair", allowsMultipleAdvertisers: false, defaultPrice: 49900 },
  { name: "Home Cleaning", slug: "home-cleaning", allowsMultipleAdvertisers: false, defaultPrice: 49900 },
  { name: "Junk Removal", slug: "junk-removal", allowsMultipleAdvertisers: false, defaultPrice: 49900 },
  { name: "Carpet Cleaning", slug: "carpet-cleaning", allowsMultipleAdvertisers: false, defaultPrice: 39900 },
  { name: "Restaurant", slug: "restaurant", allowsMultipleAdvertisers: true, defaultPrice: 29900 },
  { name: "Bakery / Coffee Shop", slug: "bakery-coffee", allowsMultipleAdvertisers: true, defaultPrice: 29900 },
];

// ─── Spot Definitions ────────────────────────────────────────────────────────

interface SpotDef {
  label: string;
  categorySlug: string;
  side: PostcardSide;
  spotType: SpotType;
  price: number; // cents
  x: number;
  y: number;
  width: number;
  height: number;
}

const spots: SpotDef[] = [
  // ── FRONT — Row 1 ──
  { label: "Plumber", categorySlug: "plumbing", side: "FRONT", spotType: "PREMIUM", price: 89900, x: 2, y: 13, width: 23, height: 40 },
  { label: "HVAC", categorySlug: "hvac", side: "FRONT", spotType: "LARGE", price: 79900, x: 26, y: 13, width: 23, height: 40 },
  { label: "Roofer", categorySlug: "roofing", side: "FRONT", spotType: "LARGE", price: 79900, x: 50, y: 13, width: 23, height: 40 },
  { label: "Electrician", categorySlug: "electrical", side: "FRONT", spotType: "STANDARD", price: 69900, x: 74, y: 13, width: 23, height: 40 },
  // ── FRONT — Row 2 ──
  { label: "Dentist", categorySlug: "dentistry", side: "FRONT", spotType: "STANDARD", price: 69900, x: 2, y: 56, width: 23, height: 40 },
  { label: "Landscaper", categorySlug: "landscaping", side: "FRONT", spotType: "STANDARD", price: 59900, x: 26, y: 56, width: 23, height: 40 },
  { label: "Pressure Washing", categorySlug: "pressure-washing", side: "FRONT", spotType: "STANDARD", price: 49900, x: 50, y: 56, width: 23, height: 40 },
  { label: "Realtor", categorySlug: "real-estate", side: "FRONT", spotType: "STANDARD", price: 59900, x: 74, y: 56, width: 23, height: 40 },
  // ── BACK — Row 1 ──
  { label: "Pest Control", categorySlug: "pest-control", side: "BACK", spotType: "STANDARD", price: 59900, x: 2, y: 13, width: 23, height: 40 },
  { label: "Auto Repair", categorySlug: "auto-repair", side: "BACK", spotType: "STANDARD", price: 49900, x: 26, y: 13, width: 23, height: 40 },
  { label: "Home Cleaning", categorySlug: "home-cleaning", side: "BACK", spotType: "STANDARD", price: 49900, x: 50, y: 13, width: 23, height: 40 },
  { label: "Junk Removal", categorySlug: "junk-removal", side: "BACK", spotType: "STANDARD", price: 49900, x: 74, y: 13, width: 23, height: 40 },
  // ── BACK — Row 2 ──
  { label: "Carpet Cleaning", categorySlug: "carpet-cleaning", side: "BACK", spotType: "STANDARD", price: 39900, x: 2, y: 56, width: 23, height: 40 },
  { label: "Restaurant Spot 1", categorySlug: "restaurant", side: "BACK", spotType: "SMALL", price: 29900, x: 26, y: 56, width: 23, height: 40 },
  { label: "Restaurant Spot 2", categorySlug: "restaurant", side: "BACK", spotType: "SMALL", price: 29900, x: 50, y: 56, width: 23, height: 40 },
  { label: "Bakery/Coffee Shop", categorySlug: "bakery-coffee", side: "BACK", spotType: "SMALL", price: 29900, x: 74, y: 56, width: 23, height: 40 },
];

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Upsert Business Categories ──────────────────────────────────────────

  console.log("📁 Upserting business categories...");

  const categoryMap = new Map<string, string>(); // slug → id

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
    console.log(`  ✅ ${cat.name} (${cat.slug})`);
  }

  console.log(`\n  Total categories: ${categoryMap.size}\n`);

  // ── 2. Create the First Campaign ───────────────────────────────────────────

  console.log("📬 Creating campaign...");

  const campaign = await prisma.campaign.upsert({
    where: {
      state_city_slug: {
        state: "texas",
        city: "converse",
        slug: "local-business-postcard",
      },
    },
    update: {
      name: "Converse 10K Local Business Postcard",
      county: "Bexar",
      zipCode: "78109",
      mailingQuantity: 10000,
      status: "ACTIVE",
    },
    create: {
      name: "Converse 10K Local Business Postcard",
      slug: "local-business-postcard",
      city: "converse",
      state: "texas",
      county: "Bexar",
      zipCode: "78109",
      mailingQuantity: 10000,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ ${campaign.name} (id: ${campaign.id})\n`);

  // ── 3. Create Campaign Spots ───────────────────────────────────────────────

  console.log("📌 Creating campaign spots...");

  // Remove existing spots for this campaign to allow re-seeding
  await prisma.campaignSpot.deleteMany({
    where: { campaignId: campaign.id },
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const categoryId = categoryMap.get(spot.categorySlug);

    if (!categoryId) {
      console.error(`  ❌ Category not found for slug: ${spot.categorySlug}`);
      continue;
    }

    await prisma.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId,
        label: spot.label,
        side: spot.side,
        spotType: spot.spotType,
        price: spot.price,
        x: spot.x,
        y: spot.y,
        width: spot.width,
        height: spot.height,
        status: "OPEN",
        sortOrder: i + 1,
      },
    });

    const priceDisplay = `$${(spot.price / 100).toFixed(2)}`;
    console.log(`  ✅ [${spot.side}] ${spot.label} — ${spot.spotType} — ${priceDisplay}`);
  }

  console.log(`\n  Total spots: ${spots.length}\n`);

  // ── 4. Seed Admin User (optional) ──────────────────────────────────────────

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@localspotmailers.com";

  console.log("👤 Upserting admin user...");

  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      supabaseUserId: "seed-placeholder-supabase-id",
      role: "SUPER_ADMIN",
    },
  });

  console.log(`  ✅ ${adminUser.email} (role: ${adminUser.role})\n`);

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log("🎉 Seeding complete!");
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
