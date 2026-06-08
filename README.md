# 📬 LocalSpot Mailers — MVP Marketplace

LocalSpot Mailers is a self-service local postcard advertising marketplace where admins create postcard mailing campaigns, and local businesses purchase industry-exclusive ad spaces via guest checkout with Stripe, submitting creative assets post-purchase.

---

## 🛠️ Getting Started & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`) and fill in:
*   `DATABASE_URL` / `DIRECT_URL` (Supabase PostgreSQL credentials)
*   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
*   `UPLOADTHING_TOKEN`

### 3. Push Schema & Seed Database
Sync the database schema using Prisma and seed the system with default business categories and the initial Converse, TX campaign:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Run the Development Server
Because SWC binaries are restricted on Windows under Application Control policies, Turbopack is disabled for dev. Use the custom webpack dev runner:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Start Local Stripe Webhook Forwarding
To process transactions, toggle spots to `SOLD`, and trigger confirmation email deliveries locally, forward mock payment webhooks using the Stripe CLI:
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) on your development system.
2. Link the CLI to your Stripe dashboard account:
   ```bash
   stripe login
   ```
3. Start forwarding checkout session events to your local API webhook route:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret printed by the CLI (starts with `whsec_`) and save it in your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

---

## 🚦 Application Routes Map

> [!IMPORTANT]
> **Keep this directory updated** when adding new page files or restructuring routes.

### 👤 Buyer (Public) Flow
*   **Campaign Landing Page**: `/campaigns/[state]/[city]/[slug]`
    *   *Seeded example*: [http://localhost:3000/campaigns/tx/converse/local-business-postcard](http://localhost:3000/campaigns/tx/converse/local-business-postcard)
*   **Checkout & Contact Form**: `/campaigns/[state]/[city]/[slug]/checkout/[spotId]`
*   **Stripe Checkout Success Page**: `/checkout/success?session_id=...`
*   **Stripe Checkout Cancel Page**: `/checkout/cancel?session_id=...`
*   **Creative Asset Upload**: `/submit-creative/[token]`

### 🔑 Admin Portal Flow (Protected)
To access these routes, you must be logged in via Supabase Auth and have your UUID mapped in the database.
*   **Admin Login**: `/auth/login`
*   **Admin Dashboard (Overview & Inventory Stats)**: `/admin`
*   **Campaigns List**: `/admin/campaigns`
*   **New Campaign Creator**: `/admin/campaigns/new`
*   **Campaign Details & Spot Coordinates Form**: `/admin/campaigns/[id]`
*   **Edit Campaign Settings**: `/admin/campaigns/[id]/edit`
*   **Categories Management Page**: `/admin/categories`
*   **Orders List**: `/admin/orders`
*   **Order Details & Ad Review Panel**: `/admin/orders/[id]`

---

## 👤 local Admin Auth Mapping Helper

Supabase handles logins on the frontend, but the API endpoints require a matching `AdminUser` record in your local PostgreSQL database linked by the Supabase user UUID.

To map your auth profile:
1. Go to your Supabase project console -> **Authentication** -> **Users**.
2. Create or invite a user with your admin email (e.g. `admin@localspotmailers.com`).
3. Run the mapping helper (it will automatically fetch your UUID from the database's auth tables):
   ```bash
   npx tsx src/bin/set-admin.ts
   ```
4. You can now login at `/auth/login` and fully use all admin panel controls.
