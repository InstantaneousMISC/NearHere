import React from "react"
import QRCodeImage from "./QRCodeImage"
import {
  SharedCard9x12Ad,
  SharedCard9x12Available,
} from "./SharedCard9x12Ad"
import {
  TEMPLATE_1_PRICING,
  template1BackSlots,
  template1FrontSlots,
  type AdvertiserSlot,
} from "@/lib/nearHereSharedCard9x12"

type DatabaseSpot = {
  id: string
  label: string
  side: "FRONT" | "BACK"
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  price: number
  x: number
  y: number
  width: number
  height: number
  sortOrder: number
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
  categoryId: string
  category: {
    id: string
    name: string
    slug?: string
  }
  orders?: Array<{
    status: string
    creativeSubmission?: {
      businessName?: string | null
      description?: string | null
      offerDeal?: string | null
      phone?: string | null
      website?: string | null
      logoUrl?: string | null
    } | null
    qrCodes?: Array<{
      slug: string
      destinationPath?: string | null
    }>
  }>
}

interface SharedCard9x12Props {
  view?: "front" | "back"
  campaignName?: string
  locationLabel?: string
  homesCount?: string
  headline?: string
  generalQrCodeUrl?: string
  brandMessage?: string
  spots?: DatabaseSpot[]
  onSpotClick?: (spot: DatabaseSpot) => void
  premiumAdvertiser?: AdvertiserSlot | null
  cardSkin?: string
}

const normalizeWebsite = (value: string) =>
  value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "")

const buildAdvertiserFromSpot = (
  spot: DatabaseSpot,
  positionId: string
): AdvertiserSlot | null => {
  const paidOrder = spot.orders?.find((order) => order.status === "PAID")
  const creative = paidOrder?.creativeSubmission
  if (spot.status !== "SOLD" || !creative) return null

  const qrCode = paidOrder?.qrCodes?.[0]
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const listingPath =
    qrCode?.destinationPath ||
    `/b/${spot.category.slug || spot.category.name.toLowerCase().replace(/\s+/g, "-")}`
  const websiteUrl = creative.website || `${appUrl}${listingPath}`

  return {
    id: `sold-${spot.id}`,
    templateId: "nearhere-shared-card-9x12",
    side: spot.side === "FRONT" ? "front" : "back",
    positionId,
    slotType:
      spot.spotType === "PREMIUM"
        ? "premiumCenterBack"
        : spot.spotType === "LARGE"
          ? spot.side === "FRONT"
            ? "frontDouble"
            : "backDouble"
          : spot.side === "FRONT"
            ? "frontStandard"
            : "backStandard",
    category: spot.category.name.toUpperCase(),
    businessName: creative.businessName || spot.label,
    description:
      creative.description ||
      "Trusted local service and straightforward help for homeowners nearby.",
    offer: creative.offerDeal || "LOCAL OFFER",
    offerSubtext: "Ask for current details",
    phone: creative.phone || "(210) 555-0100",
    websiteUrl,
    displayWebsite: normalizeWebsite(websiteUrl),
    qrCodeUrl: qrCode ? `${appUrl}/q/${qrCode.slug}` : `${appUrl}${listingPath}`,
    qrLabel: "Scan details",
    redemptionNote: "Mention this card.",
    accentColor: spot.spotType === "PREMIUM" ? "#D13F1F" : "#0B2F4A",
    iconType: spot.category.name.slice(0, 2).toUpperCase(),
    logoUrl: creative.logoUrl || undefined,
    price: spot.price / 100,
  }
}

const getFrontPosition = (spot: DatabaseSpot) => {
  const side = spot.x < 43 ? "L" : "R"
  const column = side === "L" ? (spot.x < 15 ? 1 : 2) : spot.x < 70 ? 1 : 2
  const row = spot.y < 20 ? 1 : spot.y < 52 ? 2 : 3
  const ordinal = column === 1 ? row : row + 3
  return `F-${side}${ordinal}`
}

const getBackPosition = (spot: DatabaseSpot) => {
  if (spot.spotType === "PREMIUM") return "B-PC"
  const row = spot.y < 50 ? "T" : "B"
  const column = Math.max(1, Math.min(4, Math.round((spot.x - 2.66) / 23.92) + 1))
  return `B-${row}${column}`
}

const frontGridStyle = (
  positionId: string,
  isDouble: boolean
): React.CSSProperties => {
  const index = Number(positionId.slice(-1))
  const column = index > 3 ? 2 : 1
  const row = index > 3 ? index - 3 : index
  return {
    gridColumn: isDouble ? "1 / span 2" : column,
    gridRow: row,
  }
}

const backGridStyle = (
  positionId: string,
  isDouble: boolean
): React.CSSProperties => ({
  gridColumn: isDouble
    ? `${Number(positionId.slice(-1))} / span 2`
    : Number(positionId.slice(-1)),
})

function MailingPanel9x12({ locationLabel }: { locationLabel: string }) {
  const city = locationLabel.split(",")[0]?.trim() || "CONVERSE"
  return (
    <section
      className="flex h-[326px] w-[338px] flex-col justify-between border border-[#211D1C] bg-[#FAF8F4] p-[18px] text-[#211D1C]"
      style={{ fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace' }}
    >
      <div className="flex justify-between gap-[18px]">
        <div className="text-[8px] font-bold uppercase leading-[1.35] tracking-[0.08em] text-[#77706A]">
          <div>NearHere</div>
          <div>Local Community Mail</div>
          <div>Converse, Texas</div>
        </div>
        <div className="w-[92px] border-2 border-[#211D1C] p-[7px] text-center text-[8px] font-black uppercase leading-[1.2]">
          <div>PRSRT STD</div>
          <div>ECRWSS</div>
          <div className="mt-[3px]">U.S. POSTAGE</div>
          <div>PAID</div>
          <div>NEARHERE</div>
        </div>
      </div>

      <div className="border-l-4 border-[#D13F1F] py-[6px] pl-[15px] text-left">
        <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#77706A]">
          Deliver to
        </div>
        <div className="mt-[5px] text-[14px] font-black uppercase tracking-[0.04em]">
          Local Postal Customer
        </div>
        <div className="mt-[3px] text-[12px] font-bold uppercase tracking-[0.05em]">
          {city}, TX 78109
        </div>
      </div>

      <div>
        <div className="flex h-[28px] items-end gap-[2px]">
          {Array.from({ length: 73 }).map((_, index) => (
            <span
              key={index}
              className="w-[1px] bg-[#211D1C]"
              style={{ height: `${8 + ((index * 7) % 20)}px` }}
            />
          ))}
        </div>
        <div className="mt-[3px] text-[7px] tracking-[0.15em] text-[#77706A]">
          *NH001*{city.replace(/\s/g, "")}*TX78109*
        </div>
      </div>
    </section>
  )
}

function CenterSpine({
  locationLabel,
  homesCount,
  headline,
  brandMessage,
  generalQrCodeUrl,
}: {
  locationLabel: string
  homesCount: string
  headline: string
  brandMessage: string
  generalQrCodeUrl: string
}) {
  return (
    <aside
      className="flex h-[835px] w-[160px] flex-col items-center overflow-hidden bg-[#211D1C] px-[13px] py-[16px] text-center text-[#FAF8F4]"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div
        className="text-[25px] font-black tracking-[-0.06em]"
        style={{
          fontFamily:
            '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
        }}
      >
        <span>Near</span><span className="text-[#D13F1F]">Here</span>
      </div>
      <div
        className="mt-[8px] text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#FAF8F4]"
        style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
      >
        {locationLabel}
      </div>
      <div
        className="mt-[4px] text-[9px] font-bold uppercase tracking-[0.1em] text-[#C9993E]"
        style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
      >
        {homesCount}
      </div>

      <div className="mt-[23px] border-y border-[#FAF8F4]/25 py-[16px]">
        <h2
          className="whitespace-pre-line text-[25px] font-black uppercase leading-[0.88] tracking-[-0.035em]"
          style={{
            fontFamily:
              '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
          }}
        >
          {headline.replaceAll(" ", "\n")}
        </h2>
        <p className="mt-[12px] text-[10px] font-bold uppercase leading-[1.15] tracking-[0.06em] text-[#D13F1F]">
          {brandMessage}
        </p>
      </div>

      <div className="mt-[20px] w-full border border-[#C9993E] bg-[#FAF8F4] px-[10px] py-[13px] text-[#211D1C]">
        <div
          className="text-[9px] font-black uppercase tracking-[0.1em] text-[#D13F1F]"
          style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
        >
          Community Spotlight
        </div>
        <div
          className="mt-[8px] text-[16px] font-black uppercase leading-[0.92]"
          style={{
            fontFamily:
              '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
          }}
        >
          Converse<br />Farmers<br />Market
        </div>
        <p className="mt-[9px] text-[9.2px] font-medium leading-[1.2] text-[#77706A]">
          Saturday mornings at City Park. Local produce, makers, food vendors &amp; family fun.
        </p>
        <div
          className="mt-[9px] text-[8.6px] font-black uppercase tracking-[0.08em] text-[#C9993E]"
          style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
        >
          Free Local Feature
        </div>
      </div>

      <div
        className="mt-[18px] text-[14px] font-black uppercase leading-[0.95] tracking-[0.04em]"
        style={{
          fontFamily:
            '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
        }}
      >
        One Business<br />Per Category
      </div>

      <div className="mt-auto bg-white p-[6px]">
        <QRCodeImage
          value={generalQrCodeUrl}
          size={66}
          accentColor="#211D1C"
          className="!border-0 !p-0"
        />
      </div>
      <div
        className="mt-[6px] text-[7.4px] font-bold uppercase leading-[1.15] tracking-[0.04em] text-[#FAF8F4]"
        style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
      >
        Scan to explore more<br />local offers &amp; services
      </div>
    </aside>
  )
}

function PremiumHouseMessage({
  onClick,
}: {
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex h-[326px] w-[480px] flex-col justify-between border-2 border-[#C9993E] bg-[#FAF8F4] p-[28px] text-left text-[#211D1C] ${
        onClick ? "cursor-pointer hover:bg-[#C9993E]/5" : "cursor-default"
      }`}
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div>
        <div
          className="text-[10px] font-black uppercase tracking-[0.12em] text-[#C9993E]"
          style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
        >
          Premium Center Back Spot · ${TEMPLATE_1_PRICING.premiumCenterBack.toLocaleString()}
        </div>
        <h3
          className="mt-[20px] max-w-[390px] text-[32px] font-black uppercase leading-[0.92] tracking-[-0.035em]"
          style={{
            fontFamily:
              '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
          }}
        >
          Thank You for Supporting Local Businesses.
        </h3>
        <p className="mt-[16px] max-w-[405px] text-[14px] font-medium leading-[1.35] text-[#77706A]">
          NearHere helps neighbors discover trusted services, local offers, and community favorites near home.
        </p>
      </div>
      <div className="border-t border-[#E7E0D8] pt-[14px]">
        <p className="text-[11px] font-bold uppercase leading-[1.3] tracking-[0.045em] text-[#D13F1F]">
          Scan any business QR code, call, or mention this card to redeem an offer.
        </p>
        {onClick && (
          <p
            className="mt-[8px] text-[8px] font-bold uppercase tracking-[0.1em] text-[#211D1C]"
            style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
          >
            Select premium placement
          </p>
        )}
      </div>
    </button>
  )
}

export default function SharedCard9x12({
  view = "front",
  locationLabel = "CONVERSE, TEXAS",
  homesCount = "10,000 HOMES",
  headline = "TRUSTED LOCAL SERVICES NEAR YOU",
  generalQrCodeUrl = "/q/nearhere-converse",
  brandMessage = "SUPPORT LOCAL. DISCOVER NEARBY.",
  spots,
  onSpotClick,
  premiumAdvertiser = null,
}: SharedCard9x12Props) {
  const hasDatabaseSpots = Boolean(spots?.length)
  const frontDatabaseSpots = (spots || []).filter(
    (spot) => spot.side === "FRONT" && (spot.x < 43 || spot.x >= 56)
  )
  const backDatabaseSpots = (spots || []).filter(
    (spot) => spot.side === "BACK"
  )
  const premiumSpot = backDatabaseSpots.find(
    (spot) => spot.spotType === "PREMIUM"
  )

  const renderDatabaseSpot = (
    spot: DatabaseSpot,
    positionId: string,
    placement: string
  ) => {
    const advertiser = buildAdvertiserFromSpot(spot, positionId)
    if (advertiser) {
      return (
        <SharedCard9x12Ad
          advertiser={advertiser}
          premium={spot.spotType === "PREMIUM"}
        />
      )
    }

    return (
      <SharedCard9x12Available
        label={spot.category.name}
        price={spot.price / 100}
        placement={placement}
        held={spot.status === "HELD"}
        onClick={onSpotClick ? () => onSpotClick(spot) : undefined}
      />
    )
  }

  return (
    <div
      className={`nearhere-template-9x12 nh-shared-card-9x12 ${
        view === "back" ? "back" : "front"
      } relative h-[900px] w-[1200px] shrink-0 overflow-hidden rounded-[8px] border border-[#E7E0D8] bg-[#FAF8F4] p-[32px] text-[#211D1C]`}
      style={{
        aspectRatio: "12 / 9",
        boxSizing: "border-box",
        fontFamily: '"Inter", system-ui, sans-serif',
        ["--nh-font-headline" as string]:
          '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
        ["--nh-font-body" as string]: '"Inter", system-ui, sans-serif',
        ["--nh-font-mono" as string]:
          '"JetBrains Mono", "SF Mono", Consolas, monospace',
      }}
    >
      {view === "front" ? (
        <div
          className="front-layout grid h-full w-full grid-cols-[472px_160px_472px] gap-[16px]"
        >
          {(["L", "R"] as const).map((group) => {
            const databaseGroup = frontDatabaseSpots.filter((spot) =>
              group === "L" ? spot.x < 43 : spot.x >= 56
            )
            const staticGroup = template1FrontSlots.filter((slot) =>
              slot.positionId.startsWith(`F-${group}`)
            )

            return (
              <div
                key={group}
                className={`ad-group grid h-[835px] w-[472px] grid-cols-[230px_230px] grid-rows-[265px_265px_265px] gap-x-[12px] gap-y-[20px] ${
                  group === "R" ? "col-start-3" : ""
                }`}
              >
                {hasDatabaseSpots
                  ? databaseGroup.map((spot) => {
                      const positionId = getFrontPosition(spot)
                      const isDouble =
                        spot.spotType === "LARGE" || spot.width > 25
                      return (
                        <div
                          key={spot.id}
                          style={frontGridStyle(positionId, isDouble)}
                        >
                          {renderDatabaseSpot(
                            spot,
                            positionId,
                            isDouble ? "Front Double Slot" : "Front Standard Slot"
                          )}
                        </div>
                      )
                    })
                  : staticGroup.map((advertiser) => (
                      <div
                        key={advertiser.id}
                        style={frontGridStyle(
                          advertiser.positionId,
                          advertiser.slotType === "frontDouble"
                        )}
                      >
                        <SharedCard9x12Ad advertiser={advertiser} />
                      </div>
                    ))}
              </div>
            )
          })}

          <div className="col-start-2 row-start-1">
            <CenterSpine
              locationLabel={locationLabel}
              homesCount={homesCount}
              headline={headline}
              brandMessage={brandMessage}
              generalQrCodeUrl={generalQrCodeUrl}
            />
          </div>
        </div>
      ) : (
        <div className="back-layout grid h-full w-full grid-rows-[230px_326px_240px] gap-[20px]">
          <div className="back-top grid grid-cols-[275px_275px_275px_275px] gap-[12px]">
            {hasDatabaseSpots
              ? backDatabaseSpots
                  .filter(
                    (spot) => spot.spotType !== "PREMIUM" && spot.y < 50
                  )
                  .map((spot) => {
                    const positionId = getBackPosition(spot)
                    const isDouble =
                      spot.spotType === "LARGE" || spot.width > 30
                    return (
                      <div
                        key={spot.id}
                        style={backGridStyle(positionId, isDouble)}
                      >
                        {renderDatabaseSpot(
                          spot,
                          positionId,
                          isDouble ? "Back Double Slot" : "Back Standard Slot"
                        )}
                      </div>
                    )
                  })
              : template1BackSlots
                  .filter((slot) => slot.positionId.startsWith("B-T"))
                  .map((advertiser) => (
                    <div
                      key={advertiser.id}
                      style={backGridStyle(
                        advertiser.positionId,
                        advertiser.slotType === "backDouble"
                      )}
                    >
                      <SharedCard9x12Ad advertiser={advertiser} />
                    </div>
                  ))}
          </div>

          <div className="back-middle grid grid-cols-[280px_480px_338px] gap-[18px]">
            <section className="flex h-[326px] w-[280px] flex-col justify-between border border-[#E7E0D8] bg-[#211D1C] p-[24px] text-[#FAF8F4]">
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9993E]"
                  style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
                >
                  NearHere Community Mail
                </div>
                <h3
                  className="mt-[18px] text-[30px] font-black uppercase leading-[0.92] tracking-[-0.035em]"
                  style={{
                    fontFamily:
                      '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                  }}
                >
                  Trusted Local Help, Delivered.
                </h3>
                <p className="mt-[16px] text-[13px] font-medium leading-[1.35] text-[#FAF8F4]/75">
                  One trusted business per category, selected for homeowners across {locationLabel.split(",")[0]}.
                </p>
              </div>
              <div className="border-t border-white/20 pt-[14px] text-[10px] font-bold uppercase tracking-[0.06em] text-[#D13F1F]">
                Call · Scan · Visit · Mention this card
              </div>
            </section>

            {hasDatabaseSpots && premiumSpot ? (
              premiumSpot.status === "SOLD" ? (
                renderDatabaseSpot(premiumSpot, "B-PC", "Premium Center Back")
              ) : (
                <PremiumHouseMessage
                  onClick={
                    onSpotClick ? () => onSpotClick(premiumSpot) : undefined
                  }
                />
              )
            ) : premiumAdvertiser ? (
              <SharedCard9x12Ad advertiser={premiumAdvertiser} premium />
            ) : (
              <PremiumHouseMessage />
            )}

            <MailingPanel9x12 locationLabel={locationLabel} />
          </div>

          <div className="back-bottom grid grid-cols-[275px_275px_275px_275px] gap-[12px]">
            {hasDatabaseSpots
              ? backDatabaseSpots
                  .filter(
                    (spot) => spot.spotType !== "PREMIUM" && spot.y >= 50
                  )
                  .map((spot) => {
                    const positionId = getBackPosition(spot)
                    const isDouble =
                      spot.spotType === "LARGE" || spot.width > 30
                    return (
                      <div
                        key={spot.id}
                        style={backGridStyle(positionId, isDouble)}
                      >
                        {renderDatabaseSpot(
                          spot,
                          positionId,
                          isDouble ? "Back Double Slot" : "Back Standard Slot"
                        )}
                      </div>
                    )
                  })
              : template1BackSlots
                  .filter((slot) => slot.positionId.startsWith("B-B"))
                  .map((advertiser) => (
                    <div
                      key={advertiser.id}
                      style={backGridStyle(
                        advertiser.positionId,
                        advertiser.slotType === "backDouble"
                      )}
                    >
                      <SharedCard9x12Ad advertiser={advertiser} />
                    </div>
                  ))}
          </div>
        </div>
      )}
    </div>
  )
}
