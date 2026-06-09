import React from "react"

interface BadgeProps {
  text: string
  variant?: "red" | "gold" | "press" | "warm" | "outline"
}

export default function Badge({ text, variant = "outline" }: BadgeProps) {
  const variantClasses = {
    red: "bg-nh-red text-paper border border-nh-red",
    gold: "bg-gold text-paper border border-gold",
    press: "bg-press text-paper border border-press",
    warm: "bg-warm text-paper border border-warm",
    outline: "bg-transparent text-press border border-rule"
  }

  return (
    <span
      className={`inline-flex items-center font-mono text-[8px] md:text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-none font-bold scale-95 md:scale-100 ${variantClasses[variant]}`}
    >
      {text}
    </span>
  )
}
