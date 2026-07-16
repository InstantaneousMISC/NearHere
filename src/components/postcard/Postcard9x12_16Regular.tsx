import React from "react"
import QRCodeImage from "./QRCodeImage"
import { SharedCard9x12Available } from "./SharedCard9x12Ad"
import { SpineDivider, SpineMailingPanel, ScannerBarcode } from "./SpineDivider"
import type { AdvertiserSlot } from "@/lib/nearHereSharedCard9x12"

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

interface Postcard9x12_16RegularProps {
  view?: "front" | "back"
  locationLabel?: string
  homesCount?: number
  spots?: DatabaseSpot[]
  onSpotClick?: (spot: DatabaseSpot) => void
  hoveredDoubleKeys?: string[]
  cardSkin?: string
}

const buildAdvertiserFromSpot = (
  spot: DatabaseSpot
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
    positionId: spot.label,
    slotType: spot.spotType === "LARGE" ? "frontDouble" : "frontStandard",
    category: spot.category.name.toUpperCase(),
    businessName: creative.businessName || spot.label,
    description: creative.description || "",
    offer: creative.offerDeal || "Exclusive Local Offer",
    phone: creative.phone || "",
    websiteUrl,
    displayWebsite: creative.website ? creative.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "") : "localspot.app",
    qrCodeUrl: `${appUrl}${listingPath}`,
    qrLabel: "SCAN & VIEW OFFER",
    redemptionNote: "Show card at checkout",
    iconType: spot.category.name.slice(0, 2).toUpperCase(),
    accentColor: "#0B2F4A",
    price: spot.price / 100,
  }
}

function BackSpine({
  locationLabel,
  homesCount,
}: {
  locationLabel: string
  homesCount: number
}) {
  const city = locationLabel.split(",")[0]?.trim() || "CONVERSE"
  const quantity = `${new Intl.NumberFormat().format(homesCount)} HOMES`

  return (
    <aside
      className="flex h-[840px] w-[160px] flex-col items-center border border-[#E7E0D8] bg-[#211D1C] px-[12px] py-[20px] text-center text-[#FAF8F4]"
      style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        gridColumnStart: 3,
        gridRowStart: 1,
        gridRowEnd: 3,
      }}
    >
      {/* Top Section: Branding */}
      <div className="space-y-1.5 select-none">
        <div
          className="text-[24px] font-black tracking-[-0.06em] leading-none"
          style={{
            fontFamily: '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
          }}
        >
          <span>Near</span><span className="text-[#D13F1F]">Here</span>
        </div>
        <div
          className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#FAF8F4]/80 leading-none"
          style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
        >
          {locationLabel}
        </div>
        <div
          className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#C9993E] leading-none"
          style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
        >
          {quantity}
        </div>
      </div>

      <SpineDivider className="mt-[23px] py-[20px] px-[12px]">
        <SpineMailingPanel city={city} />
      </SpineDivider>

      {/* Bottom Section: Scanner Barcode Stub */}
      <ScannerBarcode code={`NH-16R-${city}`} className="mt-auto" />
    </aside>
  )
}

export default function Postcard9x12_16Regular({
  view = "front",
  locationLabel = "CONVERSE, TX",
  homesCount = 10000,
  spots = [],
  onSpotClick,
  hoveredDoubleKeys = [],
  cardSkin = "cream",
}: Postcard9x12_16RegularProps) {
  const sideKey = view === "back" ? "BACK" : "FRONT"

  // Filter spots on this side
  const sideSpots = spots.filter((s) => s.side === sideKey)

  // Map spots by label
  const spotsMap = new Map<string, DatabaseSpot>()
  sideSpots.forEach((s) => {
    spotsMap.set(s.label, s)
  })

  // Pairs to render
  const pairs: Array<[number, number]> = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
  ]

  const getSkinStyles = () => {
    switch (cardSkin) {
      case "dark":
        return {
          bgColor: "#1E2229",
          textColor: "#FAF8F4",
          borderColor: "#2E333F",
          accentColor: "#D13F1F",
          availableBg: "#252B35",
        }
      case "minimalist":
        return {
          bgColor: "#FFFFFF",
          textColor: "#211D1C",
          borderColor: "#E2E8F0",
          accentColor: "#D13F1F",
          availableBg: "#FAFAFA",
        }
      case "cream":
      default:
        return {
          bgColor: "#FAF8F4",
          textColor: "#211D1C",
          borderColor: "#E7E0D8",
          accentColor: "#D13F1F",
          availableBg: "#FAF8F4",
        }
    }
  }

  const skin = getSkinStyles()

  const isPairHovered = (a: number, b: number) => {
    const keyA = `${sideKey}_${a}`
    const keyB = `${sideKey}_${b}`
    return hoveredDoubleKeys.includes(keyA) && hoveredDoubleKeys.includes(keyB)
  }

  // Get grid coordinates style
  const getPositionStyle = (label: string): React.CSSProperties => {
    const match = label.match(/^(FRONT|BACK)_(?:DOUBLE_)?(\d+)(?:_(\d+))?$/)
    if (!match) return {}
    const side = match[1]
    const num1 = parseInt(match[2], 10)
    const isDouble = !!match[3]

    // Row: 1-4 is row 1, 5-8 is row 2
    const row = num1 <= 4 ? 1 : 2

    // Col start
    let colStart = 1
    if (side === "BACK") {
      if (isDouble) {
        colStart = num1 === 1 || num1 === 5 ? 1 : 4
      } else {
        const baseCol = ((num1 - 1) % 4) + 1
        colStart = baseCol <= 2 ? baseCol : baseCol + 1
      }
    } else {
      if (isDouble) {
        colStart = num1 === 1 || num1 === 5 ? 1 : 3
      } else {
        colStart = ((num1 - 1) % 4) + 1
      }
    }

    return {
      gridRowStart: row,
      gridColumnStart: colStart,
      gridColumnEnd: isDouble ? colStart + 2 : colStart + 1,
    }
  }

  const renderAdContent = (advertiser: AdvertiserSlot, isDouble: boolean) => {
    const accent = advertiser.accentColor || "#0B2F4A"

    if (isDouble) {
      // Premium Double layout (horizontal 2-column)
      return (
        <article
          className="relative flex h-full w-full flex-col overflow-hidden border bg-[#FAF8F4] text-[#211D1C] border-[#E7E0D8]"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          {/* Category Banner */}
          <div
            className="h-[24px] shrink-0 px-[12px] pt-[6px] text-left font-bold uppercase tracking-[0.1em] text-white"
            style={{
              backgroundColor: accent,
              fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
              fontSize: "11px",
              lineHeight: 1,
            }}
          >
            {advertiser.category} — Double Feature
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-[16px] px-[16px] py-[14px]">
            {/* Left Column: Branding & Description */}
            <div className="flex flex-col text-left justify-between min-h-0">
              <div className="space-y-3">
                <div className="flex items-start gap-[10px]">
                  <div
                    className="flex h-[36px] w-[36px] shrink-0 items-center justify-center border-2 text-[11px] font-black uppercase"
                    style={{ borderColor: accent, color: accent }}
                  >
                    {advertiser.iconType || advertiser.category.slice(0, 2)}
                  </div>
                  <h3
                    className="line-clamp-2 overflow-hidden font-black uppercase tracking-[-0.025em]"
                    style={{
                      fontFamily: '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                      fontSize: "22px",
                      lineHeight: 0.95,
                    }}
                  >
                    {advertiser.businessName}
                  </h3>
                </div>

                <p
                  className="line-clamp-6 text-sm font-medium text-[#77706A]"
                  style={{ lineHeight: 1.25 }}
                >
                  {advertiser.description}
                </p>
              </div>

              {/* Display Web */}
              <div
                className="truncate font-semibold text-[#211D1C] text-xs pt-2"
                title={advertiser.websiteUrl}
              >
                {advertiser.displayWebsite}
              </div>
            </div>

            {/* Right Column: Offer, QR Code, Phone */}
            <div 
              className="flex flex-col justify-between border-l border-dashed pl-[16px] text-left min-h-0"
              style={{ borderColor: skin.borderColor }}
            >
              <div className="space-y-2">
                <div
                  className="line-clamp-2 max-h-[60px] overflow-hidden font-black uppercase tracking-[-0.02em] text-[#D13F1F]"
                  style={{
                    fontFamily: '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                    fontSize: "28px",
                    lineHeight: 0.92,
                  }}
                >
                  {advertiser.offer}
                </div>
                <div className="font-bold uppercase tracking-[0.04em] text-[#211D1C] text-[10px]">
                  {advertiser.offerSubtext || "Exclusive local offer"}
                </div>
                <div className="font-bold uppercase tracking-[0.035em] text-[#D13F1F] text-[9px]">
                  {advertiser.redemptionNote}
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-1">
                <div className="bg-white p-[6px] shrink-0 border border-border">
                  <QRCodeImage
                    value={advertiser.qrCodeUrl}
                    size={64}
                    accentColor="#211D1C"
                    className="!border-0 !p-0"
                  />
                </div>
                <div
                  className="font-bold uppercase tracking-[0.04em] text-[#77706A]"
                  style={{
                    fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
                    fontSize: "7.5px",
                    lineHeight: 1.1,
                  }}
                >
                  {advertiser.qrLabel}
                  <br />
                  FOR SMARTPHONE
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Phone Bar */}
          <div
            className="flex h-[34px] shrink-0 items-center justify-center bg-[#0B2F4A] px-[8px] font-bold tracking-[0.035em] text-white"
            style={{
              fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
              fontSize: "17px",
              lineHeight: 1,
            }}
          >
            {advertiser.phone}
          </div>
        </article>
      )
    }

    // Regular Layout (Vertical)
    return (
      <article
        className="relative flex h-full w-full flex-col overflow-hidden border bg-[#FAF8F4] text-[#211D1C] border-[#E7E0D8]"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <div
          className="h-[24px] shrink-0 px-[10px] pt-[6px] text-left font-bold uppercase tracking-[0.1em] text-white"
          style={{
            backgroundColor: accent,
            fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
            fontSize: "10px",
            lineHeight: 1,
          }}
        >
          {advertiser.category}
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-[12px] pb-[8px] pt-[10px] text-left justify-between">
          <div>
            <div className="flex h-[40px] min-h-[40px] items-start gap-[8px] overflow-hidden">
              <div
                className="flex h-[32px] w-[32px] shrink-0 items-center justify-center border-2 text-[10px] font-black uppercase"
                style={{ borderColor: accent, color: accent }}
              >
                {advertiser.iconType || advertiser.category.slice(0, 2)}
              </div>
              <h3
                className="line-clamp-2 max-h-[38px] overflow-hidden font-black uppercase tracking-[-0.025em]"
                style={{
                  fontFamily: '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                  fontSize: "18.5px",
                  lineHeight: 0.96,
                }}
              >
                {advertiser.businessName}
              </h3>
            </div>

            <p
              className="mt-[6px] line-clamp-4 h-[72px] min-h-[72px] overflow-hidden text-sm font-medium text-[#77706A]"
              style={{ lineHeight: 1.22 }}
            >
              {advertiser.description}
            </p>
          </div>

          <div className="grid min-h-0 grid-cols-[1fr_64px] items-end gap-[8px] pt-1">
            <div className="min-w-0">
              <div
                className="line-clamp-2 font-black uppercase tracking-[-0.02em] text-[#D13F1F]"
                style={{
                  fontFamily: '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                  fontSize: "22px",
                  lineHeight: 0.94,
                }}
              >
                {advertiser.offer}
              </div>
              <div className="truncate font-bold uppercase tracking-[0.04em] text-[#211D1C] text-[8.5px] mt-[2px]">
                {advertiser.offerSubtext || "Exclusive local offer"}
              </div>
              <div className="truncate font-semibold text-[#211D1C] text-[10px] mt-[4px]">
                {advertiser.displayWebsite}
              </div>
            </div>

            <div className="shrink-0 text-center">
              <div className="bg-white p-[4px] border border-border">
                <QRCodeImage
                  value={advertiser.qrCodeUrl}
                  size={46}
                  accentColor="#211D1C"
                  className="!border-0 !p-0"
                />
              </div>
              <div
                className="mt-[2px] font-bold uppercase tracking-[0.04em] text-[#77706A] text-[6.5px]"
                style={{
                  fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
                  lineHeight: 1,
                }}
              >
                {advertiser.qrLabel.split(" ")[0]}
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex h-[32px] shrink-0 items-center justify-center bg-[#0B2F4A] px-[8px] font-bold tracking-[0.035em] text-white"
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
            fontSize: "15px",
            lineHeight: 1,
          }}
        >
          {advertiser.phone}
        </div>
      </article>
    )
  }

  // Renders a grid position (regular or double)
  const renderPosition = (label: string, isDouble: boolean) => {
    const spot = spotsMap.get(label)

    if (spot) {
      if (spot.status === "SOLD") {
        const advertiser = buildAdvertiserFromSpot(spot)
        return advertiser ? (
          renderAdContent(advertiser, isDouble)
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-dashed border-[#E7E0D8] bg-[#FAF8F4] font-bold text-[#77706A]">
            Creative pending
          </div>
        )
      } else {
        // OPEN or HELD
        const priceValue = isDouble 
          ? (view === "back" ? 990 : 1090)
          : (view === "back" ? 490 : 590)
        const placementLabel = isDouble ? "Double Space" : "Regular Space"
        return (
          <SharedCard9x12Available
            label={spot.label.replace("_", " ")}
            price={priceValue}
            placement={placementLabel}
            held={spot.status === "HELD"}
            onClick={onSpotClick ? () => onSpotClick(spot) : undefined}
          />
        )
      }
    }

    // Default return fallback
    return null
  }

  return (
    <div
      className={`nearhere-template-9x12-16-regular nh-16-regular-card ${view} relative h-[900px] w-[1200px] shrink-0 overflow-hidden border p-[30px]`}
      style={{
        aspectRatio: "12 / 9",
        boxSizing: "border-box",
        backgroundColor: skin.bgColor,
        borderColor: skin.borderColor,
        color: skin.textColor,
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <div
        className={view === "back" 
          ? "grid h-full w-full grid-cols-[225px_225px_160px_225px_225px] grid-rows-[410px_410px] gap-x-[20px] gap-y-[20px]"
          : "grid h-full w-full grid-cols-[270px_270px_270px_270px] grid-rows-[410px_410px] gap-x-[20px] gap-y-[20px]"}
        style={{ boxSizing: "border-box" }}
      >
        {view === "back" && (
          <BackSpine
            locationLabel={locationLabel}
            homesCount={homesCount}
          />
        )}
        {pairs.map(([a, b]) => {
          const keyA = `${sideKey}_${a}`
          const keyB = `${sideKey}_${b}`
          const doubleKey = `${sideKey}_DOUBLE_${a}_${b}`

          const doubleSpot = spotsMap.get(doubleKey)
          const isDoubleSoldOrHeld = doubleSpot && (doubleSpot.status === "SOLD" || doubleSpot.status === "HELD")
          const isCurrentlyHovered = isPairHovered(a, b)

          if (isDoubleSoldOrHeld) {
            // Render active double spot
            return (
              <div key={doubleKey} style={getPositionStyle(doubleKey)}>
                {renderPosition(doubleKey, true)}
              </div>
            )
          }

          if (isCurrentlyHovered) {
            // Render virtual double hover preview card
            // Use spot A as the trigger click spot
            const spotA = spotsMap.get(keyA)
            return (
              <div
                key={`hover-${doubleKey}`}
                style={getPositionStyle(doubleKey)}
                className="ring-2 ring-nh-red ring-offset-2 ring-offset-background animate-pulse"
              >
                <SharedCard9x12Available
                  label={`${sideKey} DOUBLE ${a}&${b}`}
                  price={view === "back" ? 990 : 1090}
                  placement="Double Space"
                  onClick={onSpotClick && spotA ? () => onSpotClick(spotA) : undefined}
                />
              </div>
            )
          }

          // Otherwise, render regular spots A and B
          return (
            <React.Fragment key={`group-${a}-${b}`}>
              {spotsMap.has(keyA) && (
                <div key={keyA} style={getPositionStyle(keyA)}>
                  {renderPosition(keyA, false)}
                </div>
              )}
              {spotsMap.has(keyB) && (
                <div key={keyB} style={getPositionStyle(keyB)}>
                  {renderPosition(keyB, false)}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
