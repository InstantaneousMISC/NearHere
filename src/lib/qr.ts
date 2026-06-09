import QRCode from "qrcode"

/**
 * Generates a PNG Base64 Data URL for a given tracking URL.
 * Uses High (H) error correction level for maximum print reliability.
 */
export async function generateQrDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 512,
      color: {
        dark: "#211D1C", // Matches brand color --nh-press-gray
        light: "#FFFFFF",
      },
    })
  } catch (err) {
    console.error("Failed to generate QR Data URL:", err)
    throw err
  }
}

/**
 * Generates an SVG string representation of a QR code for a given tracking URL.
 * Uses High (H) error correction level for maximum print reliability.
 */
export async function generateQrSvg(url: string): Promise<string> {
  try {
    return await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#211D1C",
        light: "#FFFFFF",
      },
    })
  } catch (err) {
    console.error("Failed to generate QR SVG:", err)
    throw err
  }
}
