# NearHere (LocalSpot Mailers) - Manual QA Checklist

This document contains step-by-step procedures for manual QA testing of the NearHere self-service advertising marketplace. Use these test cases to verify client-side interactions, integrations, and mobile responsiveness.

---

## 1. Visitor / Business User Scenarios

### 1.1 Homepage ZIP Search
1. **Active Campaign Search**:
   * Action: Navigate to the homepage, enter `78109` (Converse, TX campaign), and click "Find a Campaign".
   * Expected: Redirection to `/campaigns/tx/converse/local-business-postcard` occurs, and campaign details load.
2. **No Active Campaign Search**:
   * Action: Enter `90210` (or any ZIP without campaigns).
   * Expected: Shows "We're not live in ZIP 90210 yet!" banner and displays the "Launch Waitlist" interest form.
3. **Waitlist Lead Submission**:
   * Action: Submit the waitlist interest form with an email (e.g. `waitlist@test.com`) and optional business name.
   * Expected: Form submits successfully, displaying: *"Thank you! We'll notify you as soon as we drop in 90210."*
4. **Invalid ZIP Input Validation**:
   * Action: Submit invalid formats: letters (`ABCDE`), special characters (`781%^`), empty, or fewer than 5 digits.
   * Expected: Browser-native HTML5 validation blocks the submission (or standard warning displays) and no redirection occurs.
5. **Trim Spaces**:
   * Action: Enter `  78109  ` (with leading/trailing spaces).
   * Expected: The input is trimmed automatically, and the campaign page loads correctly.
6. **Mobile Layout**:
   * Action: Switch to mobile viewport (e.g. iPhone SE / iPhone 12 width).
   * Expected: The ZIP input form scales correctly without horizontal scrollbars, and the submit button remains easily clickable.

### 1.2 Campaign Page Load
1. **Review Layout Elements**:
   * Action: Scroll through `/campaigns/tx/converse/local-business-postcard`.
   * Expected: The page renders the Announcement Bar, Nav, Hero, Snapshot, Included Assets list, Placements Grid (Postcard Preview), FAQ, and Final CTA.
2. **Draft/Unpublished Campaign Access**:
   * Action: Attempt to load a DRAFT campaign route while logged out (e.g. if a draft campaign slug exists).
   * Expected: Returns a 404 Page Not Found or a graceful "This campaign is not yet active" message.
3. **Sold Out Campaign Display**:
   * Action: View a campaign where all spots are sold.
   * Expected: The pricing cards display as "SOLD" or "RESERVED", and the main CTA turns into a "Join Waitlist" or "Request Placement" button.
4. **Missing Optional Fields Graceful Render**:
   * Action: In admin, edit the Converse campaign to remove the estimated mail date, description, or exact household count. Load the campaign page.
   * Expected: The layout renders fallback placeholders (e.g., "Late 2026", "TBD") without collapsing or showing console errors.

### 1.3 Spot Selection
1. **Pricing Card & Postcard Preview Sync**:
   * Action: Click the "Standard Front" or "Double Front" pricing cards.
   * Expected: The corresponding placement area highlights in the interactive postcard preview.
2. **Postcard Preview Click**:
   * Action: Click an available spot directly on the interactive postcard mockup.
   * Expected: Selects the corresponding pricing card and opens the checkout selection details.
3. **Double / Premium Spot Selection**:
   * Action: Select a Double Spot and a Premium Center Back Spot.
   * Expected: Verify the correct price ($890/$990 for doubles, $1490 for premium back center) and spot type is displayed.
4. **Reserving Held/Sold Spot**:
   * Action: Try to navigate to `/checkout/[soldSpotId]` by typing the URL manually.
   * Expected: Page displays a message that the spot is no longer available and blocks proceeding to Stripe.

### 1.4 Business Category Selection
1. **Category Mapping**:
   * Action: On the checkout page, choose a business category from the dropdown (e.g. "Plumbing").
   * Expected: The selected category is stored and locked in for checkout.
2. **Category Exclusivity Warning**:
   * Action: Attempt to reserve a spot under a category that is already reserved (SOLD or HELD) in this campaign (e.g. "Real Estate" if already taken).
   * Expected: The category is disabled in the dropdown, or an error banner appears stating the category is already taken.
3. **"Other" Category Entry**:
   * Action: Choose "Other" from the category dropdown.
   * Expected: An input field appears allowing a custom category description (e.g. "Pet Massage").

### 1.5 Checkout & Payment Flow
1. **Checkout Redirection**:
   * Action: Fill out checkout details (John Doe, `buyer@test.com`, 555-0100) and click "Proceed to Payment".
   * Expected: Redirection to Stripe Checkout occurs, listing the correct campaign name, category ad space, and price.
2. **Stripe Checkout Cancel**:
   * Action: Click "Cancel and go back" on the Stripe payment page.
   * Expected: Redirection back to the app checkout cancel landing page occurs, displaying a retry CTA.
3. **Checkout Success Landing**:
   * Action: Complete Stripe sandbox payment using the test card `4242...`.
   * Expected: Redirection to `/checkout/success?session_id=...` occurs.
   * Expected: The success page shows the order status is paid, displays the reserved spot label, and presents a direct link to "Submit Creative Details".

---

## 2. Advertiser / Business Portal Scenarios

### 2.1 Creative Submission Flow
1. **Token Access**:
   * Action: Load the creative upload link `/submit-creative/[token]` received on the success page or email stub.
   * Expected: The submission form loads, showing order ID, business name, and category.
2. **Validation Errors**:
   * Action: Submit the form leaving required fields empty or entering malformed phone numbers/websites.
   * Expected: Inline error messages appear (e.g. "Display name is required", "Please enter a valid website URL").
3. **Logo Image Upload**:
   * Action: Upload a logo file (PNG/JPG/SVG).
   * Expected: Upload succeeds, shows a thumbnail preview of the logo, and saves to the database.
   * Expected: Attempting to upload an invalid file type (e.g., `.txt` or `.zip`) or a file > 4MB returns an error.
4. **Description Limits**:
   * Action: Enter a business description of more than 300 characters.
   * Expected: Characters are truncated, or form validation displays a warning.
5. **AI Copy Assistant Checkbox**:
   * Action: Toggle the "Request Copy Help" checkbox.
   * Expected: Renders the "AI Creative Directives" textarea.

### 2.2 Advertiser Dashboard
1. **First-Time Login (Self-healing)**:
   * Action: Invite or create a merchant account matching the order email on Supabase auth. Log in and navigate to `/business/dashboard`.
   * Expected: The dashboard loads, self-healing links the account to the business profile, and displays the onboarding checklist.
2. **Dashboard Checklist States**:
   * Expected: Verify the checklist items update dynamically:
     * Payment: Checkmark ✅ (since order is paid)
     * Profile Complete: Checkmark ✅ (once name, logo, phone, address are filled)
     * Creative Uploaded: Checkmark ✅ (once creative is submitted)
     * Design Status: Shows "Pending Review" -> "Approved" based on admin actions.
3. **Analytics Tracking**:
   * Action: Access dashboard scan logs.
   * Expected: Displays the total scans, page views, and click-through counts (Call, Website, Directions) for the business.

---

## 3. Admin Scenarios

### 3.1 Authentication & Authorization
1. **Public User Restriction**:
   * Action: Access `/admin`, `/admin/campaigns`, `/admin/orders` while logged out or as a non-admin merchant.
   * Expected: Denied access, redirecting to `/auth/login` or returning a `FORBIDDEN` error.
2. **Admin Login**:
   * Action: Log in with an admin-mapped UUID account.
   * Expected: Successfully loads the admin dashboard with overview metrics.

### 3.2 Campaign & Spot Operations
1. **New Campaign Setup**:
   * Action: Go to `/admin/campaigns/new`, fill out required fields, and save.
   * Expected: Saved successfully, and template spots are auto-created according to card format (9x12 has 21 spots).
2. **Campaign Details Spot Editor**:
   * Action: Open a campaign detail page and update spot price or status (e.g. set standard spot price to $495).
   * Expected: Changes save successfully, and the public campaign page reflects updated pricing.

### 3.3 Creative Review Panel
1. **Admin Creative Review Queue**:
   * Action: Navigate to `/admin/orders/[orderId]`.
   * Expected: Displays all creative details submitted by the advertiser, along with logo thumbnail and design notes.
2. **Rejection/Revisions Lifecycle**:
   * Action: Change status to `NEEDS_REVIEW` and enter feedback: *"Please upload a higher-res logo."*. Save changes.
   * Expected: Creative status changes to needs changes.
   * Action: Log in as advertiser, verify status shows feedback, upload replacement logo, and resubmit.
   * Expected: Status returns to pending review in the admin panel.
3. **Approval for Print**:
   * Action: Admin updates status to `APPROVED`.
   * Expected: Status changes to approved for print.
   * Expected: Print safeguards lock print-sensitive fields (Advertiser cannot edit Business Name, Logo, Phone, Website).

### 3.4 Print & Mailer Production Checklist
1. **Production Checklist**:
   * Action: In admin dashboard, view campaign checklists for print status.
   * Expected: Shows total approved vs pending submissions.
2. **Print Ready**:
   * Action: Update campaign status to `READY_FOR_PRINT`.
   * Expected: Campaign page closes checkout. Spot editing is disabled for print-sensitive parameters.
3. **Mailed Notification**:
   * Action: Update campaign status to `MAILED`.
   * Expected: Status updates. Advertiser dashboard shows campaign mailed, and tracking stats activate.

---

## 4. Public Directory & QR Code Redirections

### 4.1 Business Directory
1. **Active Profiles Display**:
   * Action: Load `/businesses` (or directory path if implemented).
   * Expected: Only business profiles with approved campaigns and active status are shown.
2. **Filters**:
   * Action: Use the search filters (city, category).
   * Expected: Results update instantly.

### 4.2 QR Code Scans & Outbound Tracking
1. **QR Destination Scan**:
   * Action: Navigate to the generated QR URL `/q/[qr-slug]`.
   * Expected: Logged scan is created in the database.
   * Expected: Temporary redirect (307) routes the visitor to `/b/[business-slug]?qr=[qr-slug]`.
2. **Outbound Click Tracking**:
   * Action: On the business profile page `/b/[business-slug]`, click the "Call Us" tel button or website link.
   * Expected: Redirects to `/api/business-click?businessId=...&type=PHONE&target=tel:...`.
   * Expected: Logged click event is recorded, and the native dialer/website opens.
