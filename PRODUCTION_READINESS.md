# NearHere Mailers: Production Readiness Checklist & Guide

This document outlines the critical steps, configuration settings, and verification procedures required to transition the NearHere Neighborhood Mailers application from development to a secure, stable, and production-ready environment.

---

## 📋 Checklist Overview

- [ ] [1. UploadThing (File Uploads)](#1-uploadthing-file-uploads)
- [ ] [2. Stripe (Payments & Refunds)](#2-stripe-payments--refunds)
- [ ] [3. Supabase (Authentication & Database)](#3-supabase-authentication--database)
- [ ] [4. Environment Configuration](#4-environment-configuration)
- [ ] [5. Database Migrations & Pooling](#5-database-migrations--pooling)
- [ ] [6. Email Services & Deliverability](#6-email-services--deliverability)
- [ ] [7. Build & Deployment Checks](#7-build--deployment-checks)

---

## 1. UploadThing (File Uploads)

NearHere uses UploadThing for business logos and cover photos. To secure file uploads in production:

### 🔒 CORS & Origin Access
1. Open the [UploadThing Dashboard](https://uploadthing.com/).
2. Select your production App.
3. Under **Settings / API Keys**, restrict allowed origins to your production domain(s) (e.g., `https://nearhere.com`, `https://*.nearhere.com`).
4. Ensure files are only accepted from your verified frontends to prevent bandwidth abuse.

### 💾 Storage Limits & Asset Expiry
- Verify that your subscription plan accommodates the expected volume of business assets (images average ~1MB each).
- Clean up unused files using UploadThing's dashboard helpers if merchants abandon their onboarding draft setups.

---

## 2. Stripe (Payments & Refunds)

The platform supports direct customer checkouts, manual admin bookings, and automated cancellation/refund spot releases.

### 🔑 Live API Keys
Swap your Stripe credentials in the production environment variables:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_SECRET_KEY=sk_live_...`

### 🔗 Webhook Configuration
In the [Stripe Dashboard](https://dashboard.stripe.com/):
1. Navigate to **Developers > Webhooks**.
2. Click **Add endpoint** and enter your production endpoint:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
3. Select the following events to listen to:
   - `checkout.session.completed` (handles customer ad spot purchases)
   - `charge.refunded` (triggers automatic ad spot release in NearHere)
4. Copy the webhook signing secret (starts with `whsec_...`) and add it to your environment config:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 3. Supabase (Authentication & Database)

### 👥 Authentication Redirects
1. Go to the [Supabase Dashboard](https://supabase.com/).
2. Select your project and navigate to **Authentication > URL Configuration**.
3. Set your **Site URL** to your main production domain: `https://yourdomain.com`.
4. Add redirection patterns in the **Redirect URLs** list:
   - `https://yourdomain.com/**`
   - `https://yourdomain.com/auth/callback`

### ✉️ Custom SMTP & Email Templates
By default, Supabase auth has strict rate limits (e.g., 3 signup/login emails per hour) and uses default branding.
1. Under **Authentication > Providers > Email**, enable **External SMTP provider**.
2. Enter SMTP settings for your email service provider (e.g., Resend, Postmark, SendGrid).
3. Customize your confirmation, invitation, and magic link templates under **Authentication > Email Templates** to match the NearHere branding.

---

## 4. Environment Configuration

Ensure the following variables are set on your hosting platform (Vercel, AWS, etc.):

| Key | Description | Production Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database connection string | `postgres://...` (via transaction pooler) |
| `DIRECT_URL` | Non-pooler connection string | `postgres://...` (session/port 5432 - for migrations) |
| `NEXTAUTH_SECRET` | Next Auth signing secret | A long random string (e.g. generated via `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Public site domain | `https://yourdomain.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe signing key | `whsec_...` |
| `UPLOADTHING_SECRET` | UploadThing token | `sk_live_...` |
| `UPLOADTHING_APP_ID` | UploadThing app identifier | `...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin secret | `...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key | `...` |

> [!WARNING]
> Ensure `NODE_ENV=production` is set. This locks development backdoors (e.g., dev admin mock session cookie bypasses) and enforces secure transport layer policies.

---

## 5. Database Migrations & Pooling

### 🔌 Connection Pooling
Because serverless environments (Next.js Edge/Serverless functions) scale rapidly, they can exhaust PostgreSQL connection limits.
1. Connect via a pooler (e.g., Supabase Connection Pooler on port `6543` with `pgbouncer` mode set to `transaction`).
2. Use this pooled string for `DATABASE_URL`.
3. Use the direct connection string (port `5432`) for `DIRECT_URL` in your Prisma configuration so schema migrations run correctly.

### 🚀 Running Migrations
During deployments, run migrations using the direct database connection before restarting or promoting the code build:
```bash
npx prisma migrate deploy
```

---

## 6. Email Services & Deliverability

NearHere triggers automated notification and onboarding emails.

### 🔑 Real SMTP Setup
In development, emails are stubbed out to the console. For production:
1. Locate your mail transporter module in `src/server/helpers/email.ts` (or equivalent email dispatcher helper).
2. Configure a live Nodemailer or API integration using credentials from your verified domain SMTP/resend client.
3. Verify your domain using SPF, DKIM, and DMARC DNS settings on your domain registrar to guarantee high email inbox delivery rates and prevent emails from going to spam.

---

## 7. Build & Deployment Checks

Before promoting any branch to production, execute the following commands in a clean environment to ensure zero compilation or runtime errors:

```bash
# 1. Clear caches and install dependencies
npm ci

# 2. Verify TypeScript type safety
npx tsc --noEmit

# 3. Run the full integration & unit test suites
npm run test

# 4. Run the production bundler compilation
npm run build
```
