"use client"

import React from "react"

interface ClaimOfferButtonProps {
  slug: string
}

export default function ClaimOfferButton({ slug }: ClaimOfferButtonProps) {
  return (
    <button 
      onClick={() => alert(`Offer Code: NEARHERE-${slug.toUpperCase()}`)}
      className="px-4 py-2 border border-press bg-press text-paper hover:bg-[#3D3533] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none"
    >
      Claim Offer
    </button>
  )
}
