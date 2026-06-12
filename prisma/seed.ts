import { PrismaClient } from "@prisma/client";
import { spots9x12 as spots } from "../src/server/helpers/templateSpots";
import { rawCategories, categoryAliases } from "../src/data/advertiserCategories";

const prisma = new PrismaClient();

// ─── Category Definitions ────────────────────────────────────────────────────

interface CategoryDef {
  name: string;
  slug: string;
  allowsMultipleAdvertisers: boolean;
  defaultPrice: number; // cents
}

// Build 150+ categories dynamically from rawCategories
const categories: CategoryDef[] = rawCategories.map((cat) => {
  // Determine if it allows multiple advertisers
  const allowsMultipleAdvertisers =
    cat.parentCategory === "food-beverage-hospitality" || cat.slug === "event-venues";

  // Determine default price in cents based on parent category / overrides
  let defaultPrice = 39900; // default for retail, specialty, etc.

  if (cat.parentCategory === "food-beverage-hospitality") {
    defaultPrice = 29900;
  } else if (cat.parentCategory === "home-services") {
    if (cat.slug === "plumbers") defaultPrice = 89900;
    else if (cat.slug === "hvac" || cat.slug === "roofers") defaultPrice = 79900;
    else if (cat.slug === "electricians") defaultPrice = 69900;
    else if (cat.slug === "pressure-washing") defaultPrice = 49900;
    else if (cat.slug === "carpet-cleaning") defaultPrice = 39900;
    else defaultPrice = 59900; // landscaping, lawn-care, painters, pool service
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

// ─── Spot Definitions ────────────────────────────────────────────────────────

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
      cardSkin: "cream",
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
      cardSkin: "cream",
    },
  });

  console.log(`  ✅ ${campaign.name} (id: ${campaign.id})\n`);

  // ── 3. Create Campaign Spots ───────────────────────────────────────────────

  console.log("📌 Creating campaign spots...");

  // Remove existing spots, submissions, orders, advertisers, businesses, qrCodes for this campaign to allow clean re-seeding
  await prisma.qrCode.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.creativeSubmission.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.advertiser.deleteMany({});
  await prisma.campaignSpot.deleteMany({
    where: { campaignId: campaign.id },
  });

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const targetSlug = categoryAliases[spot.categorySlug] || spot.categorySlug;
    const categoryId = categoryMap.get(targetSlug);

    if (!categoryId) {
      console.error(`  ❌ Category not found for slug: ${spot.categorySlug} (resolved: ${targetSlug})`);
      continue;
    }

    let status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE" = "OPEN";
    let heldUntil: Date | null = null;
    let heldBySessionId: string | null = null;

    if (spot.label === "Plumber" || (spot.label === "HVAC Services" && spot.side === "FRONT")) {
      status = "SOLD";
    }

    const createdSpot = await prisma.campaignSpot.create({
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
        status,
        heldUntil,
        heldBySessionId,
        sortOrder: spot.sortOrder,
      },
    });

    if (spot.label === "Plumber") {
      const advertiser = await prisma.advertiser.create({
        data: {
          contactName: "Alice Smith",
          businessName: "Converse Plumbing Pros",
          email: "alice@converseplumbing.com",
          phone: "(210) 555-0101",
          website: "https://converseplumbing.com",
          businessAddress: "102 N Main St, Converse, TX 78109",
        },
      });

      const order = await prisma.order.create({
        data: {
          campaignId: campaign.id,
          campaignSpotId: createdSpot.id,
          advertiserId: advertiser.id,
          amount: spot.price,
          status: "PAID",
          stripeCheckoutSessionId: "seed-session-plumbing",
          stripePaymentIntentId: "seed-pi-plumbing",
          creativeSubmissionToken: "seed-token-plumbing-1234",
          paidAt: new Date(),
        },
      });

      const business = await prisma.business.create({
        data: {
          advertiserId: advertiser.id,
          name: "Converse Plumbing Pros",
          slug: "converse-plumbing-pros",
          phone: "(210) 555-0101",
          email: "alice@converseplumbing.com",
          website: "https://converseplumbing.com",
          address: "102 N Main St, Converse, TX 78109",
          status: "ACTIVE",
          claimToken: "seed-claim-token-plumbing",
          claimTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      await prisma.qrCode.create({
        data: {
          businessId: business.id,
          campaignId: campaign.id,
          campaignSpotId: createdSpot.id,
          orderId: order.id,
          slug: "converse-plumbing-pros-qr",
          type: "CAMPAIGN_SLOT",
          status: "ACTIVE",
          destinationPath: `/b/converse-plumbing-pros`,
        },
      });

      await prisma.creativeSubmission.create({
        data: {
          orderId: order.id,
          businessName: "Converse Plumbing Pros",
          logoUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=150",
          headline: "Need a plumber fast? We are here 24/7!",
          offerDeal: "$50 OFF any service call! Free estimates.",
          description: "Leaky pipe? Clogged drain? We've got you covered. Certified local technicians. Family-owned and operated for 25 years.",
          cta: "Call today to book!",
          phone: "(210) 555-0101",
          website: "https://converseplumbing.com",
          address: "102 N Main St, Converse, TX 78109",
          approvalStatus: "APPROVED",
          submittedAt: new Date(),
        },
      });
    }

    if (spot.label === "HVAC Services" && spot.side === "FRONT") {
      const advertiser = await prisma.advertiser.create({
        data: {
          contactName: "Bob Jones",
          businessName: "Converse Cooling & Heating",
          email: "bob@conversecooling.com",
          phone: "(210) 555-0202",
          website: "https://conversecooling.com",
          businessAddress: "204 Towne Pl, Converse, TX 78109",
        },
      });

      const order = await prisma.order.create({
        data: {
          campaignId: campaign.id,
          campaignSpotId: createdSpot.id,
          advertiserId: advertiser.id,
          amount: spot.price,
          status: "PAID",
          stripeCheckoutSessionId: "seed-session-hvac",
          stripePaymentIntentId: "seed-pi-hvac",
          creativeSubmissionToken: "seed-token-hvac-1234",
          paidAt: new Date(),
        },
      });

      const business = await prisma.business.create({
        data: {
          advertiserId: advertiser.id,
          name: "Converse Cooling & Heating",
          slug: "converse-cooling-heating",
          phone: "(210) 555-0202",
          email: "bob@conversecooling.com",
          website: "https://conversecooling.com",
          address: "204 Towne Pl, Converse, TX 78109",
          status: "ACTIVE",
          claimToken: "seed-claim-token-hvac",
          claimTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      await prisma.qrCode.create({
        data: {
          businessId: business.id,
          campaignId: campaign.id,
          campaignSpotId: createdSpot.id,
          orderId: order.id,
          slug: "converse-cooling-heating-qr",
          type: "CAMPAIGN_SLOT",
          status: "ACTIVE",
          destinationPath: `/b/converse-cooling-heating`,
        },
      });

      await prisma.creativeSubmission.create({
        data: {
          orderId: order.id,
          businessName: "Converse Cooling & Heating",
          logoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=150",
          headline: "Beat the Texas heat with a new AC unit!",
          offerDeal: "10% OFF any seasonal tune-up. Mention this card.",
          description: "Make sure your AC is ready. Friendly, licensed HVAC experts. Emergency repair available.",
          cta: "Call (210) 555-0202 or book online!",
          phone: "(210) 555-0202",
          website: "https://conversecooling.com",
          address: "204 Towne Pl, Converse, TX 78109",
          approvalStatus: "PENDING",
          submittedAt: new Date(),
        },
      });
    }

    const priceDisplay = `$${(spot.price / 100).toFixed(2)}`;
    console.log(`  ✅ [${spot.side}] ${spot.label} — ${spot.spotType} — ${priceDisplay} (Status: ${status})`);
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
