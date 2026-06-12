import React from "react"

interface MailingPanelProps {
  recipientLabel?: string
  cityStateZip?: string
  postageText?: string
  barcodePlaceholder?: boolean
}

export default function MailingPanel({
  recipientLabel = "LOCAL POSTAL CUSTOMER",
  cityStateZip = "CONVERSE, TX 78109",
  postageText = "PRSRT STD\nECRWSS\nU.S. POSTAGE\nPAID\nNEARHERE DROP",
  barcodePlaceholder = true
}: MailingPanelProps) {
  return (
    <div className="border border-rule bg-paper p-4 relative flex flex-col justify-between h-full font-mono text-[9px] md:text-[10px] text-press select-none select-none">
      {/* Return Address & Postage permit row */}
      <div className="flex justify-between items-start gap-4">
        {/* Return Address */}
        <div className="text-[7px] md:text-[8px] uppercase tracking-wider text-warm leading-tight font-bold">
          <div>NearHere Campaigns</div>
          <div>100 Brand Way</div>
          <div>Austin, TX 78701</div>
        </div>

        {/* Postage Permit Box */}
        <div className="border border-press p-2 text-center leading-none text-[7px] md:text-[8px] font-bold max-w-[80px] uppercase font-mono bg-paper">
          {postageText.split("\n").map((line, idx) => (
            <div key={idx} className={idx === 2 || idx === 3 ? "mt-0.5" : ""}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Recipient Address Block */}
      <div className="my-4 pl-4 border-l-2 border-nh-red/20 space-y-0.5 text-left">
        <div className="text-[7px] uppercase tracking-wider text-warm font-semibold">Deliver to:</div>
        <div className="font-bold text-press text-[9px] md:text-sm tracking-wide uppercase">
          {recipientLabel}
        </div>
        <div className="font-headline font-bold text-press text-[10px] md:text-xs tracking-wider uppercase">
          {cityStateZip}
        </div>
      </div>

      {/* Intelligent Mail Barcode Mock */}
      {barcodePlaceholder && (
        <div className="flex flex-col items-start space-y-0.5">
          <div className="flex items-end space-x-[1px] h-3 md:h-4 w-full opacity-85">
            {Array.from({ length: 65 }).map((_, idx) => {
              // Generate mock Intelligent Mail Barcode height variations (tracker, ascender, descender, full)
              const heightClass =
                idx % 4 === 0
                  ? "h-full" // full bar
                  : idx % 3 === 0
                  ? "h-1/2" // tracker bar
                  : idx % 2 === 0
                  ? "h-3/4 align-bottom" // ascender or descender
                  : "h-2/3"
              return (
                <div
                  key={idx}
                  className={`w-[1px] md:w-[1.5px] bg-press ${heightClass}`}
                />
              )
            })}
          </div>
          <span className="text-[6px] tracking-widest text-warm scale-90 origin-left">
            *NH001*CONVERSE*TX78109*
          </span>
        </div>
      )}
    </div>
  )
}
