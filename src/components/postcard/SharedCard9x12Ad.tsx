import QRCodeImage from "./QRCodeImage"
import type { AdvertiserSlot } from "@/lib/nearHereSharedCard9x12"

interface SharedCard9x12AdProps {
  advertiser: AdvertiserSlot
  premium?: boolean
}

export function SharedCard9x12Ad({
  advertiser,
  premium = false,
}: SharedCard9x12AdProps) {
  const accent = advertiser.accentColor || "#0B2F4A"

  return (
    <article
      className={`nh-template1-ad relative flex h-full w-full flex-col overflow-hidden border bg-[#FAF8F4] text-[#211D1C] ${
        premium ? "border-2" : "border"
      }`}
      style={{
        borderColor: premium ? "#C9993E" : "#E7E0D8",
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <div
        className="h-[23px] shrink-0 px-[10px] pt-[5px] text-left font-bold uppercase tracking-[0.1em] text-[#FAF8F4]"
        style={{
          backgroundColor: premium ? "#C9993E" : accent,
          fontFamily:
            '"JetBrains Mono", "SF Mono", Consolas, monospace',
          fontSize: "10.5px",
          lineHeight: 1,
        }}
      >
        {advertiser.category}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-[11px] pb-[7px] pt-[9px]">
        <div className="flex h-[39px] min-h-[39px] items-start gap-[8px] overflow-hidden">
          <div
            className="flex h-[31px] w-[31px] shrink-0 items-center justify-center border-2 text-[10px] font-black uppercase"
            style={{
              borderColor: accent,
              color: accent,
              fontFamily:
                '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
            }}
          >
            {advertiser.iconType || advertiser.category.slice(0, 2)}
          </div>
          <h3
            className="line-clamp-2 max-h-[38px] overflow-hidden text-left font-black uppercase tracking-[-0.025em]"
            style={{
              fontFamily:
                '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
              fontSize: premium ? "21px" : "18.5px",
              lineHeight: 0.96,
            }}
          >
            {advertiser.businessName}
          </h3>
        </div>

        <p
          className="nh-template1-description mt-[5px] line-clamp-4 h-[56px] min-h-[56px] max-h-[56px] overflow-hidden text-left font-medium text-[#77706A]"
          style={{ fontSize: "12.8px", lineHeight: 1.18 }}
        >
          {advertiser.description}
        </p>

        <div className="mt-[4px] grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_74px] items-end gap-[8px] overflow-hidden">
          <div className="min-w-0 overflow-hidden text-left">
            <div
              className="line-clamp-2 max-h-[43px] overflow-hidden font-black uppercase tracking-[-0.02em] text-[#D13F1F]"
              style={{
                fontFamily:
                  '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
                fontSize: premium ? "26px" : "22.5px",
                lineHeight: 0.94,
              }}
            >
              {advertiser.offer}
            </div>
            <div
              className="mt-[2px] truncate font-bold uppercase tracking-[0.04em] text-[#211D1C]"
              style={{ fontSize: "9.4px", lineHeight: 1.05 }}
            >
              {advertiser.offerSubtext || "Exclusive local offer"}
            </div>
            <div
              className="mt-[4px] truncate font-bold uppercase tracking-[0.035em] text-[#D13F1F]"
              style={{ fontSize: "8.6px", lineHeight: 1 }}
            >
              {advertiser.redemptionNote}
            </div>
            <div
              className="mt-[5px] truncate font-semibold text-[#211D1C]"
              style={{ fontSize: "9.6px", lineHeight: 1 }}
              title={advertiser.websiteUrl}
            >
              {advertiser.displayWebsite}
            </div>
          </div>

          <div className="shrink-0 text-center">
            <div className="bg-white p-[6px]">
              <QRCodeImage
                value={advertiser.qrCodeUrl}
                size={50}
                accentColor="#211D1C"
                className="!border-0 !p-0"
              />
            </div>
            <div
              className="mt-[2px] max-w-[62px] font-bold uppercase tracking-[0.04em] text-[#77706A]"
              style={{
                fontFamily:
                  '"JetBrains Mono", "SF Mono", Consolas, monospace',
                fontSize: "7.2px",
                lineHeight: 1,
              }}
            >
              {advertiser.qrLabel}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex h-[32px] shrink-0 items-center justify-center bg-[#0B2F4A] px-[8px] font-bold tracking-[0.035em] text-white"
        style={{
          fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
          fontSize: "15.8px",
          lineHeight: 1,
        }}
      >
        {advertiser.phone}
      </div>
    </article>
  )
}

interface SharedCard9x12AvailableProps {
  label: string
  price: number
  placement: string
  held?: boolean
  onClick?: () => void
}

export function SharedCard9x12Available({
  label,
  price,
  placement,
  held,
  onClick,
}: SharedCard9x12AvailableProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex h-full w-full flex-col overflow-hidden border-2 border-dashed border-[#D13F1F] bg-[#FAF8F4] text-left text-[#211D1C] ${
        onClick
          ? "cursor-pointer transition-colors hover:bg-[#D13F1F]/5"
          : "cursor-default"
      }`}
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <span
        className="bg-[#D13F1F] px-[10px] py-[5px] font-bold uppercase tracking-[0.1em] text-white"
        style={{
          fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
          fontSize: "10.5px",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span className="flex flex-1 flex-col items-center justify-center px-[14px] text-center">
        <span
          className="font-black uppercase tracking-[-0.025em]"
          style={{
            fontFamily:
              '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
            fontSize: "22px",
            lineHeight: 0.95,
          }}
        >
          {held ? "Placement Held" : "Your Business Here"}
        </span>
        <span
          className="mt-[8px] font-black text-[#D13F1F]"
          style={{
            fontFamily:
              '"Archivo Narrow", "Oswald", "Arial Narrow", Impact, sans-serif',
            fontSize: "24px",
          }}
        >
          ${price.toLocaleString()}
        </span>
        <span
          className="mt-[5px] font-bold uppercase tracking-[0.08em] text-[#77706A]"
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
            fontSize: "8.6px",
          }}
        >
          {placement}
        </span>
      </span>
      <span
        className="flex h-[32px] items-center justify-center bg-[#211D1C] text-center font-bold uppercase tracking-[0.08em] text-white"
        style={{
          fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
          fontSize: "10px",
        }}
      >
        {held ? "Reserved" : onClick ? "Select placement" : "Available"}
      </span>
    </button>
  )
}
