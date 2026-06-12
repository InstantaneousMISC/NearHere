export function validateZip(zip: string): boolean {
  const trimmed = zip.trim()
  return /^\d{5}$/.test(trimmed)
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 15
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone.trim()
}

export function validateAndNormalizeUrl(url: string): string | null {
  let trimmed = url.trim()
  if (!trimmed) return null

  // Prevent XSS or unsafe schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null
  }

  // Prepend https:// if no protocol present
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`
  }

  try {
    const parsed = new URL(trimmed)
    // Basic sanity checks: hostname must have a dot and not be empty
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return null
    }
    return parsed.href
  } catch {
    return null
  }
}

export function calculateCostPerHousehold(priceCents: number, householdCount: number): number {
  if (!householdCount || householdCount <= 0) return 0
  // Cost in cents per household, rounded to two decimal places
  // e.g. price $490 (49000 cents) / 5000 households = 9.8 cents per household
  return Math.round((priceCents / householdCount) * 100) / 100
}

export function isDeadlinePassed(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

export function generateSeoMetadata(
  businessName: string,
  category: string,
  city: string,
  state: string
): { title: string; description: string } {
  const cleanName = businessName.trim()
  const cleanCat = category.trim()
  const cleanCity = city.trim().replace(/^\w/, (c) => c.toUpperCase())
  const cleanState = state.trim().toUpperCase()

  const title = `${cleanName} - ${cleanCat} in ${cleanCity}, ${cleanState} | NearHere`
  const description = `Find local offers, services, and contact info for ${cleanName} (${cleanCat}) in ${cleanCity}, ${cleanState}. Part of the NearHere local advertising directory.`

  return { title, description }
}

export function calculateCampaignAvailability(
  spots: { status: string }[]
): {
  total: number
  available: number
  sold: number
  held: number
  isSoldOut: boolean
} {
  const total = spots.length
  let available = 0
  let sold = 0
  let held = 0

  for (const spot of spots) {
    const status = spot.status.toUpperCase()
    if (status === "OPEN" || status === "AVAILABLE") {
      available++
    } else if (status === "SOLD") {
      sold++
    } else if (status === "HELD") {
      held++
    }
  }

  const isSoldOut = total > 0 && sold === total

  return {
    total,
    available,
    sold,
    held,
    isSoldOut,
  }
}
