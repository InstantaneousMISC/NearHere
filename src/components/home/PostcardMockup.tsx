"use client"

const slots = [
  { n: "03", cat: "Dentist" },
  { n: "04", cat: "Real Estate" },
  { n: "05", cat: "HVAC" },
  { n: "06", cat: "Roofer" },
]

export function PostcardMockup() {
  return (
    <div className="relative aspect-[5/3] w-full rounded-sm bg-card p-6 shadow-2xl ring-1 ring-black/5 font-sans">
      <div className="grid h-full grid-cols-3 grid-rows-2 gap-4">
        {/* Slot 01: Plumber */}
        <div className="flex flex-col border border-dashed border-border p-3">
          <span className="mb-2 font-mono text-[10px] uppercase text-primary">Slot 01: Plumber</span>
          <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-100">
            <img
              src="/plumber.jpg"
              alt="Plumber"
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </div>

        {/* Slot 02: Landscaper (Available) */}
        <div className="relative flex flex-col items-center justify-center border-2 border-primary bg-primary/5 p-3 text-center">
          <span className="font-mono text-[10px] uppercase text-primary">Available</span>
          <span className="mt-1 text-xs font-bold uppercase text-foreground">Landscaper</span>
          <div className="mt-2 bg-primary px-2 py-1 text-[8px] font-bold text-primary-foreground select-none">
            RESERVE NOW
          </div>
        </div>

        {/* Other slots */}
        {slots.map((s) => (
          <div key={s.n} className="flex flex-col border border-dashed border-border p-3 opacity-30">
            <span className="mb-2 font-mono text-[10px] uppercase text-foreground">
              Slot {s.n}: {s.cat}
            </span>
            <div className="flex-1 bg-stone-bg" />
          </div>
        ))}
      </div>
      <div className="absolute -bottom-4 -right-4 bg-foreground p-3 text-background">
        <p className="font-mono text-[10px] leading-tight select-none">
          Oversized 9x12"
          <br />
          Heavy 16pt Cardstock
        </p>
      </div>
    </div>
  )
}
