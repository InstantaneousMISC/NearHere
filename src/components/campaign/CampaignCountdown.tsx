"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CampaignCountdownProps {
  estimatedMailDate: Date | null
}

export function CampaignCountdown({ estimatedMailDate }: CampaignCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  } | null>(null)

  useEffect(() => {
    let target = estimatedMailDate ? new Date(estimatedMailDate) : null
    const now = new Date()

    // If target date is in the past, null, or invalid, default to 14 days out
    if (!target || target.getTime() <= now.getTime()) {
      target = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    }

    const calculateTimeLeft = () => {
      const difference = target!.getTime() - new Date().getTime()
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [estimatedMailDate])

  if (!timeLeft) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 border border-stone-850 bg-[#12100F]/90 text-stone-400 font-mono text-xs uppercase tracking-wider rounded-md animate-pulse">
        <Clock className="h-4 w-4" />
        <span>Loading Campaign Timer...</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#FF4A1C]/35 bg-[#12100F]/95 text-white font-sans text-xs uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
      <Clock className="h-4 w-4 text-[#FF4A1C] animate-pulse" />
      <span className="font-bold text-stone-300">Campaign Closes In:</span>
      <div className="flex items-center gap-1.5 font-mono font-black text-sm text-[#FF4A1C]">
        <span>{String(timeLeft.days).padStart(2, "0")}d</span>
        <span className="text-stone-600">:</span>
        <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
        <span className="text-stone-600">:</span>
        <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
        <span className="text-stone-600">:</span>
        <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
      </div>
    </div>
  )
}
