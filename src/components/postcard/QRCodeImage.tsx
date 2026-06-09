"use client"

import React, { useEffect, useState } from "react"
import QRCode from "qrcode"

interface QRCodeImageProps {
  value: string
  size?: number
  className?: string
  accentColor?: string
}

export default function QRCodeImage({
  value,
  size = 128,
  className = "",
  accentColor = "#211D1C"
}: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (!value) return

    QRCode.toDataURL(value, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: size,
      color: {
        dark: accentColor,
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        setDataUrl(url)
        setError(false)
      })
      .catch((err) => {
        console.error("Failed to generate QR Code on client:", err)
        setError(true)
      })
  }, [value, size, accentColor])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 text-red-500 font-mono text-[9px] p-2 text-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        QR Error
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse bg-slate-100 border border-slate-200 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[8px] font-mono text-slate-400">Loading...</span>
      </div>
    )
  }

  return (
    <img
      src={dataUrl}
      alt="Scan QR Code"
      width={size}
      height={size}
      className={`border border-[#E7E0D8] bg-white p-0.5 select-none ${className}`}
    />
  )
}
