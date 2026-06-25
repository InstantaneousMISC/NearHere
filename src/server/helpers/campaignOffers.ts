import { CampaignOffer } from "@prisma/client"

/**
 * Checks if a campaign offer is active, not expired, and has redemptions available.
 */
export function isCampaignOfferRedeemable(offer: CampaignOffer): boolean {
  if (offer.status !== "ACTIVE") return false
  if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return false
  if (
    offer.maxRedemptions !== null &&
    offer.maxRedemptions !== undefined &&
    offer.redeemedCount + offer.reservedCount >= offer.maxRedemptions
  ) {
    return false
  }
  return true
}

/**
 * Calculates the discount in cents for a given base price and offer.
 */
export function calculateOfferDiscount(price: number, offer: CampaignOffer): number {
  if (offer.discountType === "AMOUNT_OFF") {
    return Math.min(price, offer.discountAmount || 0)
  }
  if (offer.discountType === "PERCENT_OFF") {
    const percent = offer.discountPercent || 0
    return Math.min(price, Math.floor((price * percent) / 100))
  }
  return 0
}

/**
 * Calculates the final price in cents for a given base price and offer, ensuring it is never less than 0.
 */
export function calculateOfferPrice(price: number, offer: CampaignOffer): number {
  const discount = calculateOfferDiscount(price, offer)
  return Math.max(0, price - discount)
}
