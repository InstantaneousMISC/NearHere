import { db } from "../server/db";
import { DirectoryStatus, IndexControl } from "@prisma/client";

async function main() {
  console.log("Seeding directory data for browser testing...");

  // 1. Create States
  const tx = await db.state.upsert({
    where: { slug: "tx" },
    update: {},
    create: {
      name: "Texas",
      slug: "tx",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
      metaTitle: "NearHere Texas Local Business Directory",
      metaDescription: "Find top verified local businesses, home services, and professional providers in Texas cities."
    }
  });

  const ca = await db.state.upsert({
    where: { slug: "ca" },
    update: {},
    create: {
      name: "California",
      slug: "ca",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
    }
  });

  console.log("States seeded.");

  // 2. Create Cities
  const converse = await db.city.upsert({
    where: { stateId_slug: { stateId: tx.id, slug: "converse" } },
    update: {},
    create: {
      name: "Converse",
      slug: "converse",
      stateId: tx.id,
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
      introCopy: "Converse is a vibrant community located in Bexar County, Texas. Explore the best local services and neighborhood contractors serving the area.",
      metaTitle: "Converse, TX Local Business Directory | NearHere",
      metaDescription: "Explore verified local service providers, contractors, and deals in Converse, Texas."
    }
  });

  const austin = await db.city.upsert({
    where: { stateId_slug: { stateId: tx.id, slug: "austin" } },
    update: {},
    create: {
      name: "Austin",
      slug: "austin",
      stateId: tx.id,
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
      introCopy: "Austin, the capital of Texas, is known for its live music scene, outdoor parks, and booming local tech and home service industries.",
    }
  });

  console.log("Cities seeded.");

  // 3. Create Categories
  const plumbing = await db.directoryCategory.upsert({
    where: { slug: "plumbing" },
    update: {
      description: "Find trusted local plumbing contractors in your city. From leak repairs and pipe installation to water heater maintenance, compare verified plumbers.",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    },
    create: {
      name: "Plumbing",
      slug: "plumbing",
      description: "Find trusted local plumbing contractors in your city. From leak repairs and pipe installation to water heater maintenance, compare verified plumbers.",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
      metaTitle: "Verified Local Plumbing Contractors | NearHere",
      metaDescription: "Compare certified local plumbing companies, emergency plumbers, and commercial piping specialists."
    }
  });

  const restaurants = await db.directoryCategory.upsert({
    where: { slug: "restaurants" },
    update: {
      description: "Discover the best local dining spots, cafes, and family restaurants in your neighborhood.",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    },
    create: {
      name: "Restaurants",
      slug: "restaurants",
      description: "Discover the best local dining spots, cafes, and family restaurants in your neighborhood.",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    }
  });

  console.log("Categories seeded.");

  // 4. Create Profiles
  // Profile 1: Converse Plumbing Pros (1 business in converse + plumbing, description has >= 100 chars, so indexable)
  const plumbingProfile1 = await db.directoryProfile.upsert({
    where: { slug: "converse-plumbing-pros" },
    update: {
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    },
    create: {
      name: "Converse Plumbing Pros",
      slug: "converse-plumbing-pros",
      description: "Converse Plumbing Pros is a family-owned plumbing company serving Converse, TX. We specialize in residential plumbing repairs, drain cleaning, water heaters, and emergency services. 24/7 service available.",
      phone: "210-555-0199",
      email: "contact@converseplumbingpros.com",
      website: "https://converseplumbingpros.com",
      logoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=150&h=150",
      coverImageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
      address: "8400 Converse Business Ln, Converse, TX 78109",
      serviceArea: "Converse, Live Oak, Universal City, Windcrest",
      hours: "Mon-Sun: 24 Hours",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
      metaTitle: "Converse Plumbing Pros | Emergency Plumbers in Converse TX",
      metaDescription: "Contact Converse Plumbing Pros for reliable residential and commercial plumbing repairs. Call 210-555-0199 today."
    }
  });

  // Link location for profile 1
  const loc1 = await db.businessLocation.findFirst({
    where: { directoryProfileId: plumbingProfile1.id, cityId: converse.id }
  });
  if (!loc1) {
    await db.businessLocation.create({
      data: {
        directoryProfileId: plumbingProfile1.id,
        cityId: converse.id,
        address: plumbingProfile1.address,
        phone: plumbingProfile1.phone,
        hours: plumbingProfile1.hours,
        status: DirectoryStatus.PUBLISHED,
        isIndexed: IndexControl.INDEX
      }
    });
  }

  // Link category for profile 1
  await db.businessDirectoryCategory.upsert({
    where: { directoryProfileId_directoryCategoryId: { directoryProfileId: plumbingProfile1.id, directoryCategoryId: plumbing.id } },
    update: {},
    create: {
      directoryProfileId: plumbingProfile1.id,
      directoryCategoryId: plumbing.id
    }
  });

  // Profile 2: Converse Fast Plumbing (second plumber in converse to verify list pages with multiple items)
  const plumbingProfile2 = await db.directoryProfile.upsert({
    where: { slug: "converse-fast-plumbing" },
    update: {
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    },
    create: {
      name: "Converse Fast Plumbing",
      slug: "converse-fast-plumbing",
      description: "Quick response plumbing specialists in Converse. Dedicated to fixing clogged drains, pipe leaks, and toilet replacements on short notice.",
      phone: "210-555-0211",
      website: "https://conversefastplumbing.com",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
    }
  });

  const loc2 = await db.businessLocation.findFirst({
    where: { directoryProfileId: plumbingProfile2.id, cityId: converse.id }
  });
  if (!loc2) {
    await db.businessLocation.create({
      data: {
        directoryProfileId: plumbingProfile2.id,
        cityId: converse.id,
        phone: plumbingProfile2.phone,
        status: DirectoryStatus.PUBLISHED,
        isIndexed: IndexControl.INDEX
      }
    });
  }

  await db.businessDirectoryCategory.upsert({
    where: { directoryProfileId_directoryCategoryId: { directoryProfileId: plumbingProfile2.id, directoryCategoryId: plumbing.id } },
    update: {},
    create: {
      directoryProfileId: plumbingProfile2.id,
      directoryCategoryId: plumbing.id
    }
  });

  // Profile 3: Austin Taco Palace (austin + restaurants)
  const restaurantProfile = await db.directoryProfile.upsert({
    where: { slug: "austin-taco-palace" },
    update: {
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX
    },
    create: {
      name: "Austin Taco Palace",
      slug: "austin-taco-palace",
      description: "The absolute best street tacos, fajitas, and homemade chips & salsa in Austin, TX. Outdoor patio seating and local drafts on tap.",
      phone: "512-555-1234",
      website: "https://austintacopalace.com",
      status: DirectoryStatus.PUBLISHED,
      isIndexed: IndexControl.INDEX,
    }
  });

  const loc3 = await db.businessLocation.findFirst({
    where: { directoryProfileId: restaurantProfile.id, cityId: austin.id }
  });
  if (!loc3) {
    await db.businessLocation.create({
      data: {
        directoryProfileId: restaurantProfile.id,
        cityId: austin.id,
        phone: restaurantProfile.phone,
        status: DirectoryStatus.PUBLISHED,
        isIndexed: IndexControl.INDEX
      }
    });
  }

  await db.businessDirectoryCategory.upsert({
    where: { directoryProfileId_directoryCategoryId: { directoryProfileId: restaurantProfile.id, directoryCategoryId: restaurants.id } },
    update: {},
    create: {
      directoryProfileId: restaurantProfile.id,
      directoryCategoryId: restaurants.id
    }
  });

  console.log("Profiles seeded successfully.");
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
