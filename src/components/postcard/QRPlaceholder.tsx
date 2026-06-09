import React from "react"

interface QRPlaceholderProps {
  size?: "sm" | "md" | "lg"
  label?: string
  accentColor?: string
}

export default function QRPlaceholder({
  size = "md",
  label = "Scan for offer",
  accentColor = "#211D1C"
}: QRPlaceholderProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20"
  }

  // Draw simulated QR patterns
  return (
    <div className="flex flex-col items-center justify-center space-y-1 select-none font-mono">
      <svg
        className={`${sizeClasses[size]} bg-white p-1 border border-rule`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Three corner registration marks */}
        {/* Top-Left */}
        <rect x="5" y="5" width="25" height="25" fill={accentColor} />
        <rect x="9" y="9" width="17" height="17" fill="white" />
        <rect x="13" y="13" width="9" height="9" fill={accentColor} />

        {/* Top-Right */}
        <rect x="70" y="5" width="25" height="25" fill={accentColor} />
        <rect x="74" y="9" width="17" height="17" fill="white" />
        <rect x="78" y="13" width="9" height="9" fill={accentColor} />

        {/* Bottom-Left */}
        <rect x="5" y="70" width="25" height="25" fill={accentColor} />
        <rect x="9" y="74" width="17" height="17" fill="white" />
        <rect x="13" y="78" width="9" height="9" fill={accentColor} />

        {/* Small alignment block in bottom-right area */}
        <rect x="75" y="75" width="10" height="10" fill={accentColor} />
        <rect x="77" y="77" width="6" height="6" fill="white" />
        <rect x="79" y="79" width="2" height="2" fill={accentColor} />

        {/* Simulated random pixel data blocks */}
        <rect x="35" y="5" width="5" height="10" fill={accentColor} />
        <rect x="45" y="10" width="10" height="5" fill={accentColor} />
        <rect x="60" y="5" width="5" height="5" fill={accentColor} />
        
        <rect x="35" y="20" width="10" height="5" fill={accentColor} />
        <rect x="50" y="25" width="5" height="10" fill={accentColor} />
        <rect x="60" y="20" width="5" height="5" fill={accentColor} />

        <rect x="5" y="35" width="10" height="5" fill={accentColor} />
        <rect x="20" y="40" width="5" height="10" fill={accentColor} />
        <rect x="35" y="35" width="5" height="5" fill={accentColor} />
        <rect x="45" y="40" width="10" height="10" fill={accentColor} />
        <rect x="60" y="35" width="15" height="5" fill={accentColor} />
        <rect x="80" y="35" width="5" height="15" fill={accentColor} />

        <rect x="10" y="50" width="15" height="5" fill={accentColor} />
        <rect x="5" y="60" width="5" height="5" fill={accentColor} />
        <rect x="20" y="60" width="10" height="5" fill={accentColor} />
        <rect x="35" y="55" width="5" height="15" fill={accentColor} />
        <rect x="50" y="60" width="5" height="10" fill={accentColor} />
        <rect x="60" y="50" width="10" height="5" fill={accentColor} />
        <rect x="75" y="55" width="15" height="5" fill={accentColor} />

        <rect x="35" y="75" width="5" height="10" fill={accentColor} />
        <rect x="45" y="80" width="15" height="5" fill={accentColor} />
        <rect x="65" y="75" width="5" height="15" fill={accentColor} />
        <rect x="55" y="85" width="10" height="5" fill={accentColor} />

        {/* Brand red dot in the exact center */}
        <circle cx="50" cy="50" r="7" fill="#D13F1F" />
        <circle cx="50" cy="50" r="3" fill="white" />
      </svg>
      {label && (
        <span className="text-[6px] md:text-[8px] uppercase tracking-wider text-warm text-center max-w-[80px] font-bold">
          {label}
        </span>
      )}
    </div>
  )
}
