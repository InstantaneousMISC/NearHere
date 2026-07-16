import { db } from "@/server/db"
import { DirectoryStatus, IndexControl } from "@prisma/client"

// Map of common state abbreviations to full names
const STATE_NAME_MAP: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
}

/**
 * Normalizes state code/name into a structured slug and display name
 */
export function normalizeState(stateInput: string) {
  const clean = stateInput.trim().toUpperCase()
  if (clean.length === 2 && STATE_NAME_MAP[clean]) {
    return {
      slug: clean.toLowerCase(),
      name: STATE_NAME_MAP[clean],
    }
  }
  return {
    slug: clean.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: stateInput.trim(),
  }
}

/**
 * Normalizes city name into a slug and formatted display name
 */
export function normalizeCity(cityInput: string) {
  const clean = cityInput.trim()
  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  const formattedName = clean
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

  return { slug, name: formattedName }
}

/**
 * Checks if a directory profile meets the minimum quality requirements for auto-publishing:
 * - Approved creative submission or paid campaign order
 * - Must have a description (>20 characters)
 * - Must have a logo
 * - Must have either website or phone number
 * - Must have at least one location and category associated
 */
export async function checkProfileQuality(profileId: string): Promise<boolean> {
  const profile = await db.directoryProfile.findUnique({
    where: { id: profileId },
    include: {
      locations: true,
      categories: true,
      business: {
        include: {
          advertiser: {
            include: {
              orders: {
                where: { status: "PAID" },
                include: { creativeSubmission: true },
              },
            },
          },
        },
      },
    },
  })

  if (!profile) return false

  // 1. Must have logo, description, and website or phone
  const hasLogo = !!profile.logoUrl
  const hasDesc = !!profile.description && profile.description.trim().length >= 20
  const hasContact = !!profile.website || !!profile.phone

  // 2. Must have at least one location and category
  const hasLocation = profile.locations.length > 0
  const hasCategory = profile.categories.length > 0

  // 3. Must have an approved creative submission for a paid order
  const orders = profile.business?.advertiser?.orders || []
  const hasApprovedCreative = orders.some(
    (order) => order.creativeSubmission?.approvalStatus === "APPROVED" ||
               order.creativeSubmission?.approvalStatus === "PRINTED" ||
               order.creativeSubmission?.approvalStatus === "MAILED"
  )

  return !!(hasLogo && hasDesc && hasContact && hasLocation && hasCategory && hasApprovedCreative)
}

/**
 * Core synchronization function to map legacy Business record to DirectoryProfile
 */
export async function syncBusinessToDirectory(businessId: string): Promise<void> {
  // 1. Fetch Business details
  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      links: true,
      advertiser: {
        include: {
          orders: {
            where: { status: "PAID" },
            include: {
              campaignSpot: {
                include: { category: true },
              },
              creativeSubmission: true,
            },
          },
        },
      },
      directoryProfile: {
        include: {
          locations: true,
          categories: true,
        },
      },
    },
  })

  if (!business) return

  // 2. Extract profile details (preferring Business values, falling back to creative submission values)
  const latestPaidOrder = business.advertiser?.orders?.[0]
  const creative = latestPaidOrder?.creativeSubmission

  const name = business.name || creative?.businessName || "New Business"
  const slug = business.slug
  const description = business.description || creative?.description || null
  const phone = business.phone || creative?.phone || null
  const email = business.email || business.advertiser?.email || null
  const website = business.website || creative?.website || null
  const logoUrl = business.logoUrl || creative?.logoUrl || null
  const coverImageUrl = business.coverImageUrl || null
  const address = business.address || creative?.address || null
  const serviceArea = business.serviceArea || creative?.serviceArea || null
  const hours = business.hours || creative?.hours || null
  const preferredCta = business.preferredCta || creative?.preferredCta || null
  const services = business.services || null
  const establishedYear = business.establishedYear || null
  const licenseNumber = business.licenseNumber || null
  const photos = business.photos || null
  
  // Format social links JSON
  let socialLinks = business.socialLinks || creative?.socialLinks || null

  // 3. Upsert DirectoryProfile
  let profile = business.directoryProfile

  if (!profile) {
    profile = await db.directoryProfile.create({
      data: {
        businessId: business.id,
        name,
        slug,
        description,
        phone,
        email,
        website,
        logoUrl,
        coverImageUrl,
        address,
        serviceArea,
        hours,
        preferredCta,
        socialLinks: socialLinks || undefined,
        services: services || undefined,
        establishedYear,
        licenseNumber,
        photos: photos || undefined,
        status: DirectoryStatus.DRAFT,
        isIndexed: IndexControl.NOINDEX,
      },
      include: {
        locations: true,
        categories: true,
      },
    })
  } else {
    profile = await db.directoryProfile.update({
      where: { id: profile.id },
      data: {
        name,
        slug,
        description,
        phone,
        email,
        website,
        logoUrl,
        coverImageUrl,
        address,
        serviceArea,
        hours,
        preferredCta,
        socialLinks: socialLinks || undefined,
        services: services || undefined,
        establishedYear,
        licenseNumber,
        photos: photos || undefined,
      },
      include: {
        locations: true,
        categories: true,
      },
    })
  }

  // 4. Sync links
  if (business.links.length > 0) {
    await Promise.all(
      business.links.map((link) =>
        db.businessLink.update({
          where: { id: link.id },
          data: { directoryProfileId: profile!.id },
        })
      )
    )
  }

  // 5. Sync locations (State & City)
  const rawCity = business.city || creative?.address?.split(",")?.[1] || null
  const rawState = business.state || creative?.address?.split(",")?.[2]?.trim()?.split(" ")?.[0] || null

  if (rawCity && rawState) {
    const stateNorm = normalizeState(rawState)
    const cityNorm = normalizeCity(rawCity)

    if (stateNorm.slug && cityNorm.slug) {
      // Find or create State
      const stateObj = await db.state.upsert({
        where: { slug: stateNorm.slug },
        update: {},
        create: {
          name: stateNorm.name,
          slug: stateNorm.slug,
          status: DirectoryStatus.PUBLISHED,
          isIndexed: IndexControl.INDEX,
        },
      })

      // Find or create City
      const cityObj = await db.city.upsert({
        where: {
          stateId_slug: {
            stateId: stateObj.id,
            slug: cityNorm.slug,
          },
        },
        update: {},
        create: {
          name: cityNorm.name,
          slug: cityNorm.slug,
          stateId: stateObj.id,
          status: DirectoryStatus.PUBLISHED,
          isIndexed: IndexControl.INDEX,
        },
      })

      // Link to profile
      const hasLocation = profile.locations.some((loc) => loc.cityId === cityObj.id)
      if (!hasLocation) {
        await db.businessLocation.create({
          data: {
            directoryProfileId: profile.id,
            cityId: cityObj.id,
            address,
            phone,
            hours,
            status: DirectoryStatus.PUBLISHED,
            isIndexed: IndexControl.INDEX,
          },
        })
      }
    }
  }

  // 6. Sync category from campaign spots
  const activeSpotCategories = business.advertiser?.orders
    .map((o) => o.campaignSpot?.category)
    .filter(Boolean)

  if (activeSpotCategories && activeSpotCategories.length > 0) {
    await Promise.all(
      activeSpotCategories.map(async (cat) => {
        if (!cat) return
        
        // Find or create DirectoryCategory
        const dirCat = await db.directoryCategory.upsert({
          where: { slug: cat.slug },
          update: {},
          create: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            status: DirectoryStatus.PUBLISHED,
            isIndexed: IndexControl.INDEX,
          },
        })

        // Link category to profile
        const hasCategoryLink = profile!.categories.some(
          (c) => c.directoryCategoryId === dirCat.id
        )
        if (!hasCategoryLink) {
          await db.businessDirectoryCategory.create({
            data: {
              directoryProfileId: profile!.id,
              directoryCategoryId: dirCat.id,
            },
          })
        }
      })
    )
  }

  // 7. Quality and Visibility Checks to determine if we publish
  const meetsQuality = await checkProfileQuality(profile.id)
  
  // Enforce visibility rules: must be marked visible, in good standing, and not soft-deleted
  const isPubliclyVisible = business.isDirectoryVisible && 
                            business.goodStanding && 
                            !business.deletedAt

  if (meetsQuality && isPubliclyVisible) {
    await db.directoryProfile.update({
      where: { id: profile.id },
      data: {
        status: DirectoryStatus.PUBLISHED,
        isIndexed: IndexControl.INDEX,
      },
    })
  } else {
    // Hide from the public directory (sets status to DRAFT and NOINDEX)
    await db.directoryProfile.update({
      where: { id: profile.id },
      data: {
        status: DirectoryStatus.DRAFT,
        isIndexed: IndexControl.NOINDEX,
      },
    })
  }
}
