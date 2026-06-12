import { escapeHtml } from "../escapeHtml"

export function getNearHereEmailWrapper(params: {
  title: string
  preheader?: string
  contentHtml: string
}) {
  const year = new Date().getFullYear()
  const preheaderHtml = params.preheader
    ? `<span style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #fff; line-height: 1px;">${escapeHtml(params.preheader)}</span>`
    : ""

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(params.title)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #FAF8F4;
          color: #211D1C;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 2px solid #211D1C;
          box-shadow: 0 10px 25px rgba(33, 29, 28, 0.05);
        }
        .header {
          border-bottom: 2px solid #211D1C;
          padding: 32px 24px;
          text-align: center;
          background-color: #ffffff;
        }
        .logo {
          font-family: "Impact", "Arial Black", -apple-system, sans-serif;
          font-size: 28px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.03em;
        }
        .logo-near {
          color: #211D1C;
        }
        .logo-here {
          color: #D13F1F;
        }
        .content {
          padding: 40px 32px;
          line-height: 1.6;
          font-size: 14px;
        }
        h2 {
          font-family: -apple-system, sans-serif;
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          color: #211D1C;
          margin-top: 0;
          margin-bottom: 20px;
        }
        p {
          margin-top: 0;
          margin-bottom: 16px;
          color: #4A4542;
        }
        .details-card {
          border: 1px solid #E7E0D8;
          background-color: #FAF8F4;
          padding: 20px;
          margin: 28px 0;
        }
        .details-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #77706A;
          margin-bottom: 12px;
          border-bottom: 1px solid #E7E0D8;
          padding-bottom: 6px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .details-row:last-child {
          margin-bottom: 0;
        }
        .details-label {
          color: #77706A;
          font-weight: 500;
        }
        .details-value {
          color: #211D1C;
          font-weight: bold;
          text-align: right;
        }
        .cta-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background-color: #D13F1F;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border: 2px solid #211D1C;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
          box-shadow: 4px 4px 0px #211D1C;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .notes-box {
          background-color: #FAF2F0;
          border-left: 4px solid #D13F1F;
          padding: 16px;
          margin: 28px 0;
          font-size: 13px;
        }
        .notes-title {
          font-weight: bold;
          color: #D13F1F;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .notes-content {
          color: #5C433F;
          white-space: pre-line;
        }
        .link-alt {
          font-size: 11px;
          color: #77706A;
          text-align: center;
          margin-top: 16px;
          word-break: break-all;
        }
        .link-alt a {
          color: #D13F1F;
        }
        .footer {
          background-color: #211D1C;
          color: #FAF8F4;
          padding: 32px 24px;
          text-align: center;
          font-size: 11px;
        }
        .footer p {
          color: #A39D98;
          margin: 0 0 8px 0;
        }
        .footer p:last-child {
          margin-bottom: 0;
        }
        .footer-brand {
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffffff;
        }
      </style>
    </head>
    <body>
      ${preheaderHtml}
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <span class="logo-near">Near</span><span class="logo-here">Here</span>
          </div>
        </div>
        <div class="content">
          ${params.contentHtml}
        </div>
        <div class="footer">
          <p class="footer-brand">NearHere Local Advertising</p>
          <p>Shared postcard campaigns with QR activity reporting.</p>
          <p>&copy; ${year} NearHere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
