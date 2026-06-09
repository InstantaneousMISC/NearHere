# 📬 Production Readiness & Deployment Guide

This document outlines the security, configuration, and manual setup steps required to deploy the LocalSpot Mailers platform to production safely.

---

## 🚨 CRITICAL PRODUCTION BLOCKER: Stripe Webhooks

Production webhook events **must not be trusted** without signature verification. The Stripe webhook handler `/api/stripe/webhook` implements signature checking via `stripe.webhooks.constructEvent` using raw request buffers.

> [!CAUTION]
> ### Signature Verification Blockers:
> 1. **`STRIPE_WEBHOOK_SECRET` environment variable must be set.**
>    - In production, if this variable is missing, the API route will log a critical error and return a **`500 Internal Server Error`** (`Webhook Secret Missing`). It will not fallback to unverified parsing.
>    - Forged webhook events or unsigned requests will return a **`400 Bad Request`** (`Webhook Error: ...`).
> 2. **Local Bypass:**
>    - Local development fallback (JSON parsing without signature validation) is ONLY permitted in non-production environments when `STRIPE_WEBHOOK_SECRET` is left undefined.

---

## 🔒 Printed / Mailed Campaign Edit Safeguards

To prevent discrepancies between printed materials (physical postcards) and user-updated profiles, the system enforces a strict field locking mechanism.

### 1. Lock Conditions
A profile or creative submission is considered **locked** if:
- Any campaign associated with the business/spot has a status of `PRINTING`, `MAILED`, or `READY_FOR_PRINT`.
- The creative submission has an `approvalStatus` of `APPROVED` (Approved for Print), `PRINTED`, or `MAILED`.

### 2. Lock Behavior
- **Frontend Protection:**
  - Banners are displayed at the top of `/business/profile`, `/business/setup`, and `/submit-creative/[token]` indicating the lock.
  - Print-sensitive input elements and file uploaders are disabled.
- **Backend Enforcement:**
  - Mutation endpoints check statuses and throw a `403 Forbidden` (`FORBIDDEN`) error if any locked print-sensitive field is modified.
  - Digital-only fields remain editable.

### 3. Field Classifications
| Model | Print-Sensitive (Locked) | Digital-Only (Editable) |
| :--- | :--- | :--- |
| **Business Profile** (`/business/profile` and `/business/setup`) | Business Name (`name`), Phone (`phone`), Website (`website`), Logo URL (`logoUrl`) | Description (`description`), Cover Image (`coverImageUrl`), Address details, Outbound custom links |
| **Creative Submission** (`/submit-creative/[token]`) | Business Name (`businessName`), Logo (`logoUrl`), Headline (`headline`), Offer (`offerDeal`), Description (`description`), CTA (`cta`), Phone (`phone`), Website (`website`), Address (`address`) | Showcase Images (`additionalImages`), Wants AI Help (`wantsAiHelp`), AI Directives (`aiPrompt`), Designer Notes (`notes`) |

> [!NOTE]
> When updating digital-only fields on an approved creative, the backend will **preserve** the approval status (e.g. `APPROVED`), avoiding resetting it to `PENDING`.

---

## 📋 Environment Variables Checklist

Ensure these variables are configured in your production hosting platform (e.g. Vercel, Railway, Render):

```env
# Database Credentials
DATABASE_URL="postgresql://..."       # Transaction pooling URL (Prisma Client connection)
DIRECT_URL="postgresql://..."         # Session direct connection URL (Migrations & seed)

# Supabase Auth Settings
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Payment Settings
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."     # CRITICAL PRODUCTION BLOCKER

# Asset Uploads
UPLOADTHING_TOKEN="..."

# Email Transports
RESEND_API_KEY="re_..."
ADMIN_EMAIL="admin@yourdomain.com"

# App Settings
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

---

## 🛠️ Manual Production Setup Steps

Follow this checklist when setting up a fresh production environment:

### Step 1: Execute Database Migrations
Deploy the database schema to your production PostgreSQL database:
```bash
npx prisma db push
```
*(Or use `npx prisma migrate deploy` if you are using migration files).*

### Step 2: Seed Business Categories
Seed the initial category list and database templates:
```bash
npx prisma db seed
```

### Step 3: Register Admin Users
Admin users are verified against local database entries. To map your production admin profile:
1. Log in to the application frontend to create a user profile in Supabase Auth.
2. Retrieve the user's UUID from the Supabase dashboard.
3. Run the mapping helper or manually insert an `AdminUser` row:
   ```bash
   # Run the set-admin script (interactive prompt)
   npx tsx src/bin/set-admin.ts
   ```

### Step 4: Configure Stripe Webhook Endpoint
1. Go to the **Stripe Dashboard** -> **Developers** -> **Webhooks**.
2. Click **Add endpoint**.
3. Set the endpoint URL to `https://yourdomain.com/api/stripe/webhook`.
4. Select the event: `checkout.session.completed`.
5. Reveal the signing secret (`whsec_...`) and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`.
