# BoldForm — Product Roadmap (Lite + Pro)

_Last updated: 2026-07-05 · Lite (free): 1.1.x · Pro (paid): 1.0.0_

> **In one line:** BoldForm Lite is our free WordPress form builder; BoldForm Pro is the paid add-on. This roadmap says **what we build next, in what order, and why** — for both.

---

## How to read this

| Symbol | Meaning |
|---|---|
| **Effort: S** | Small — a few days |
| **Effort: M** | Medium — about 1–2 weeks |
| **Effort: L** | Large — 3+ weeks / a mini-project |
| **Priority: High** | Do first — biggest impact on sales or user satisfaction |
| **Priority: Med** | Valuable, but can wait for the ones above |
| ⭐ | **Upgrade driver** — a feature people commonly pay to unlock |

**Release order:** Pro **1.1 → 1.2 → 2.0**. Each release is a themed batch, listed easiest-and-highest-impact first.

---

## Roadmap board — Progress · UpComing · Done

_At-a-glance board view (matches our public roadmap columns). Numbering is per-column. Details for each live in §5 below._

### 🟢 Progress — building now
1. **Save & Resume** — Let visitors save their progress and return later through a secure private link, significantly reducing drop-off on longer forms.
2. **Draft Auto-Save** — Automatically save a visitor's progress as they fill out a form to prevent lost work.
3. **Excel & PDF Export** — Export form entries as Excel or PDF files for reporting, sharing, and record-keeping.

### 🔵 UpComing — planned next (in release order)

**Flagship (planning)**
1. **AI Form Builder** — Create complete forms from a plain-language description. Simply describe the form you need, and AI instantly generates the fields, layout, and settings — ready to refine in the drag-and-drop builder.

**Pro 1.1 — managing submissions**
2. **Entry Approval Workflow** — Review submissions before they take effect. Entries arrive as pending and only trigger notifications and follow-up actions once an administrator approves them.
3. **Entry Editing** — Edit saved submissions directly from the dashboard to correct or update information after it has been received.
4. **Import Entries** — Restore or migrate form submissions by importing them from a JSON export file, so entries can move between sites alongside their forms (Lite exports entries; importing them is a Pro capability).
5. **Entry Notes** — Add private, admin-only notes to any submission to track follow-ups and internal context.
6. **Custom Entry Statuses** — Define your own submission statuses to match your team's workflow, beyond the built-in read, starred, and spam labels.
7. **Entry Limit & Cooldown** — Automatically close a form after a set number of submissions, and rate-limit repeat submissions per user to prevent abuse.
8. **Form Locking** — Protect any form with a password so it is only accessible to authorized visitors.
9. **Akismet Spam Filtering** — Add Akismet, the industry-standard spam service, for an extra layer of protection against unwanted submissions.
10. **Color Picker Field** — Allow users to select a color value directly within the form.

**Pro 1.2 — smarter notifications & payments**
11. **Custom Email Editor** — Fully customize notification email subjects and content, including dynamic values from submitted fields.
12. **Conditional Email Routing** — Automatically send notifications to different recipients based on the answers a visitor provides.
13. **PDF Attachment** — Generate a PDF of each submission and attach it automatically to notification emails.
14. **Email Confirmation** — Verify a submitter's email address through a confirmation link before the entry is finalized.
15. **Conditional Logic on Pages** — Show or hide entire pages within multi-step forms based on a user's responses.
16. **Custom Thank-You Page** — Display a personalized confirmation message using submitted field values after a form is completed.
17. **Coupons, Tax & Multi-Currency** — Extend payments with discount codes, automatic tax calculation, and support for multiple currencies.
18. **Abandonment Tracking** — Record forms that were started but not submitted to reveal where users drop off.
19. **Marketing Tracking** — Capture UTM parameters and trigger Google Analytics and Meta Pixel events on submission.
20. **Scheduled Export** — Automatically generate and email entry exports on a recurring schedule.

**Pro 2.0 — marquee features**
21. **Conversational Mode** — Present forms one question at a time for a guided, engaging experience that improves completion rates.
22. **A/B Testing** — Split traffic between two versions of a form to compare performance and identify the higher-converting design.
23. **User Submission Portal** — Give logged-in users a dedicated area to view and manage their own past submissions.
24. **Subscriptions & Recurring Payments** — Collect recurring payments through Stripe and PayPal for memberships, donations, and retainers.
25. **Embed Modes** — Display forms as popups, slide-ins, or floating buttons to capture leads anywhere on the site.
26. **Premium Template Packs** — Expand the built-in free template library with additional industry-specific, ready-to-use form packs available to Pro users.
27. **Country & IP Blocking** — Restrict submissions from specific countries or IP addresses to reduce fraud and abuse.
28. **REST API & WP-CLI** — Read and create entries programmatically through a REST API and manage the plugin via the command line.
29. **Advanced Actions** — Automatically create posts, register users, or restrict form access by role upon submission.
30. **WooCommerce Integration** — Create WooCommerce orders directly from form submissions.
31. **AI Response Tools** — Use AI to summarize submissions or draft automated responses (separate from the flagship AI Form Builder).
32. **Google Places Autocomplete** — Offer address autocomplete in address fields using Google Places.
33. **Mailchimp Tags & Groups** — Apply granular Mailchimp tags and groups when syncing subscribers.
34. **ActiveCampaign Deals** — Create deals in ActiveCampaign, not just contacts, from submissions.

### ⚫ Done — already shipped

_Tier is marked on each item: **🆓 Free** ships in Lite (WordPress.org); **⭐ Pro** requires the paid add-on._

**Free (Lite) — shipped**
1. **Drag & Drop Builder** — 🆓 Free — Build forms visually with an intuitive drag-and-drop interface.
2. **Gutenberg Block** — 🆓 Free — Add any form to a page or post using a dedicated block in the WordPress editor.
3. **Elementor Widget** — 🆓 Free — Insert and manage forms natively within Elementor.
4. **Advanced Styling System** — 🆓 Free — Control every visual detail with per-field, per-state, and per-device design options.
5. **Conditional Logic** — 🆓 Free — Show or hide fields dynamically based on a user's responses.
6. **Entry Management** — 🆓 Free — Store, filter, and organize submissions, including spam handling and bulk actions.
7. **CSV Export** — 🆓 Free — Export form entries to CSV.
8. **Email & SMTP** — 🆓 Free — Send reliable email notifications with built-in SMTP configuration.
9. **Spam Protection** — 🆓 Free — Guard forms with reCAPTCHA, hCaptcha, and honeypot protection.
10. **GDPR Tools** — 🆓 Free — Export and erase personal data to support privacy compliance.
11. **Template Library** — 🆓 Free — Start from 11 ready-made forms organized by category (General, Business, Events & Booking, HR & Surveys) and import any of them into the builder with a single click.
12. **Cloudflare Turnstile** — 🆓 Free — Protect forms from spam and bots with Cloudflare's privacy-friendly, no-puzzle CAPTCHA — a seamless alternative to traditional challenges.

**Pro (paid) — shipped**
13. **Multi-Step Forms** — ⭐ Pro — Break long forms into multiple steps with a progress indicator.
14. **Payments** — ⭐ Pro — Accept one-time payments through Stripe and PayPal.
15. **Rich Text Field** — ⭐ Pro — Provide a full WYSIWYG editor for long-form input.
16. **Signature Field** — ⭐ Pro — Capture handwritten signatures directly on the form.
17. **Repeater Field** — ⭐ Pro — Let users add repeatable groups of fields as needed.
18. **Date Range Field** — ⭐ Pro — Select a start and end date together in a single field.
19. **Calculation Field** — ⭐ Pro — Automatically calculate values based on other field inputs.
20. **Geolocation Field** — ⭐ Pro — Detect or select a location on a map.
21. **NPS Field** — ⭐ Pro — Measure customer sentiment with a 0–10 Net Promoter Score scale.
22. **Matrix Field** — ⭐ Pro — Collect grid-based responses across rows and columns.
23. **Image Choice Field** — ⭐ Pro — Let users choose from visual, image-based options.
24. **Lookup Field** — ⭐ Pro — Search and select values from a data source as the user types.
25. **Password Field** — ⭐ Pro — Collect masked password input securely, with optional confirm-and-match validation.
26. **30+ Integrations** — ⭐ Pro — Connect forms to popular CRM, email, storage, and messaging services.
27. **Webhooks** — ⭐ Pro — Send submission data to any external URL in real time.
28. **Form Scheduling** — ⭐ Pro — Automatically open and close forms on set dates.
29. **Auto-Populate & Merge Tags** — ⭐ Pro — Pre-fill fields and reuse submitted values dynamically.
30. **Hidden Field** — ⭐ Pro — Pass hidden, pre-filled values through a form without showing them to the visitor.
31. **Analytics** — ⭐ Pro — Track form views and conversion performance.

---

## 1. The product in one picture

- **BoldForm Lite (free, on WordPress.org)** = the drag-and-drop form builder + core essentials (build forms, collect entries, email notifications, spam protection, styling). This is how we get installs.
- **BoldForm Pro (paid)** = the advanced add-on that unlocks power features (advanced fields, payments, multi-step, integrations, automations). This is how we make money.

**Golden rule (decided by the team):** _Anything already in Pro stays in Pro. No Pro feature — and no field type — ever moves to the free version._ We compete on quality, not by giving paid features away.

---

## 2. What already works today (so we don't re-plan it)

**Already in Lite (free):**
Drag-and-drop builder · ~26 field types · **template library** (11 ready-made forms across 4 categories, one-click import) · shows on any page via shortcode, Gutenberg block, **or Elementor** · deep design/styling controls · conditional logic (show/hide fields) · entries list (read/unread/starred/spam, bulk actions) · **CSV export** · email + SMTP (admin + submitter confirmation) · spam protection (reCAPTCHA, hCaptcha, math captcha, honeypot) · 2 integrations (Mailchimp, Brevo) · redirect / custom success message on submit · GDPR export/erase · translations.

**Already in Pro (paid):**
Advanced fields (Rich Text, Signature, Repeater, Date Range, Calculation, Geolocation, NPS, Matrix, Image Choice, Password w/ confirm-match, Lookup, Hidden) · **Multi-step forms** · **Payments** (Stripe + PayPal, one-time, single currency) · **~31 integrations** (HubSpot, Salesforce, Slack, Google Sheets, Zapier, etc.) · webhooks · scheduling (open/close dates) · analytics (views + conversions/conversion rate).

---

## 3. Why we're doing this (the market in 30 seconds)

Newer rivals — especially **FormGent** — give away a lot for free (multi-step, payments, conversational forms, AI builder) to grab installs fast. We are **not** matching that giveaway. Instead:

- **Where we're already ahead:** works natively in Elementor (rivals don't), far deeper design/styling controls, stronger security, lighter/faster on the page, more mature.
- **Where we're behind:** we lack some "conversion" features buyers expect — Save & Resume, entry editing/approval, conditional emails, PDF, conversational mode, A/B testing.
- **Our headline bet:** the **AI Form Builder** (see §5) is the main "AI Powered" hype for launch — a paid flagship meant to make BoldForm stand out. (FormGent offers basic AI free, so this is a bet on quality over give-away.)

**Strategy:** keep the free/paid split, close the paid-feature gaps in Pro, and market our real strengths.

---

## 4. Free version (Lite) plan — small and deliberate

We are **not** adding paid features to free. Lite's one planned new extra — which takes nothing from Pro — has now **shipped**.

| Item | What it is | Why | Priority | Effort | Status |
|---|---|---|---|---|---|
| **Cloudflare Turnstile** | One more free spam-protection option (we already offer reCAPTCHA + hCaptcha free) | Modern, no-puzzle captcha users increasingly expect | High | S | ✅ Shipped (Lite) |

> **Note:** CSV export stays free. **Excel and PDF export are Pro** (see below). No other free-tier features are planned right now.

---

## 5. Pro plan — the paid roadmap

### ⭐ Flagship — AI Form Builder _(shipping soon)_
**This is our main marketing hype: "AI Powered."** The user describes the form they want in plain language ("a job application with name, email, CV upload, and 3 screening questions") and AI generates the fields and layout instantly, ready to tweak in the builder.

- **Tier:** Pro (paid). _Note: FormGent gives basic AI form creation away free — we're betting our AI is good enough to sell. Watch conversion; a limited free taste is a fallback if installs stall._
- **Why it matters:** the single biggest attention-grabber in forms right now; headline feature for launch/marketing.
- **Effort:** L. **Priority:** High. **Status:** planning (scoping — next up in UpComing).
- **Build note:** sends the prompt to an AI provider (e.g. OpenAI) and maps the response into BoldForm's form JSON; needs an API-key setting + guardrails on output.

---

### 🚀 Pro 1.1 — "Managing submissions" _(quick wins, low risk)_
**Goal:** turn entries from a simple list into a real workflow. These reuse systems we already have, so they ship fast.

| Feature | What it does | Why it matters | ⭐ | Priority | Effort |
|---|---|---|---|---|---|
| **Save & Resume** | Visitor saves a half-finished form and finishes later via a private link | Big drop-off reducer on long forms; a classic paid feature | ⭐ | High | M |
| **Entry approval workflow** | Submissions arrive as "pending"; admin approves/rejects (with notification), and follow-up actions wait for approval | Moderation gate for testimonials, listings, applications; competitors charge for it | ⭐ | High | M |
| **Entry editing** | Admin can edit a saved submission (fix a typo, correct a phone number) | Frequently requested; today entries are read-only | | High | M |
| **Import entries** | Import submissions from a BoldForm JSON export (Lite exports entries; Pro adds the import side) | Migrate/restore entries between sites; completes the export↔import round-trip | | Med | S |
| **Excel + PDF export** | Download entries as Excel or PDF (Lite stays CSV-only) | Formats buyers expect; clear reason to upgrade | | High | S |
| **Entry notes** | Private internal notes on a submission | Turns entries into a lightweight CRM/ticket record | | Med | S |
| **Custom entry statuses** | Define your own labels beyond read/unread/starred/spam (e.g. "In progress", "Refunded") | Fits entries to a team's real workflow | | Med | S |
| **Entry limit + cooldown** | Auto-close a form after N submissions; rate-limit repeat submitters | Capacity control + abuse/duplicate protection | | Med | S |
| **Form locking** | Password-protect a form before it's shown | Gate sensitive/private forms; common paid access-control feature | | Med | S |
| **Akismet spam filtering** | Adds the WordPress-standard spam service | Catches spam that captchas miss | | Med | S |
| **Color picker field** | A field where users pick a color | Rounds out the field set (stays a Pro field) | | Med | S |

**Done when:** submissions can be approved/rejected, edited, labelled, limited, exported (Excel/PDF), imported (JSON), and better protected from spam.

---

### 🧩 Pro 1.2 — "Smarter notifications & payments"
**Goal:** make emails flexible and payments commerce-grade. One groundwork item unlocks the rest.

> **Do first (groundwork):** today emails use fixed templates with no custom subject/body. Build a **custom email editor** before the two ⭐ email features below.

| Feature | What it does | Why it matters | ⭐ | Priority | Effort |
|---|---|---|---|---|---|
| **Conditional email routing** | Send to different people based on answers (e.g. "Sales" vs "Support") | Core business-form need; competitors all have it | ⭐ | High | M |
| **PDF of the submission** | Auto-generate a PDF of each entry and attach it to the email | High perceived value; common paid feature | ⭐ | High | M |
| **Email confirmation (double opt-in)** | Verify the submitter's email via a token link before the entry counts | Cleaner lists; blocks fake emails | | Med | M |
| **Conditional logic on pages** | Show/hide whole pages in a multi-step form based on answers | Extends multi-step (per-field logic already exists) — smarter long forms | | Med | M |
| **Custom thank-you page** | Personalized confirmation using answers ("Thanks, {first name}") — Lite already does basic redirect + custom success message; this adds merge-tag personalization | Better post-submit experience | | Med | M |
| **Payments: coupons, tax, multi-currency** | Discount codes, tax lines, and more than one currency (today = one currency per form) | Turns basic payments into real checkout | | High | M |
| **Auto-save draft** | Periodically saves progress in the browser | Prevents lost work on long forms | | Med | S |
| **Abandonment tracking** | Records forms started but not finished | Shows where people give up | | Med | M |
| **Marketing tracking** | Capture UTM source + fire Google/Meta events on submit | Lets marketers measure form performance | | Med | S |
| **Scheduled export** | Auto-email a CSV/Excel export on a schedule | Hands-off reporting for teams | | Med | S |

**Done when:** emails route by answer + carry PDFs, and payments support coupons/tax/currencies.

---

### 🏆 Pro 2.0 — "Marquee features" _(the big upgrades)_
**Goal:** the standout features that make Pro clearly worth buying. Bigger builds, highest ceiling.

| Feature | What it does | Why it matters | ⭐ | Priority | Effort |
|---|---|---|---|---|---|
| **Conversational mode** | One-question-at-a-time forms (Typeform-style) | Premium UX buyers love; a rival's headline free feature | ⭐ | High | L |
| **A/B testing** | Split traffic between two form versions, pick the winner | Almost no WP form plugin does this well — a differentiator | ⭐ | High | L |
| **User submission portal** | Logged-in users see/manage their own past submissions | Adds a whole self-service layer | ⭐ | Med | L |
| **Subscriptions / recurring payments** | Stripe/PayPal recurring billing | Unlocks memberships, donations, retainers | ⭐ | High | L |
| **Embed modes** | Popup, slide-in, floating-button forms | More ways to capture leads | | Med | M |
| **Premium template packs** | Extra industry-specific form packs on top of the free template library that already ships in Lite (11 templates, one-click import) | More onboarding value + a clear Pro upsell | | Med | M |
| **Country / IP blocking** | Reject submissions from chosen countries or IP addresses | Abuse/fraud control for high-traffic forms | | Med | M |
| **Developer tools** | REST API + WP-CLI (read/create entries, export, cleanup) | Appeals to agencies/developers | | Med | M |
| **Advanced actions** | Create a post/CPT, register a user, or restrict a form by role on submit | Powerful automation use-cases | | Med | M |
| **AI response tools** | Summarize entries or auto-draft replies (separate from the flagship AI Form Builder) | Extends the AI story after launch | | Med | M |
| **More integrations** | WooCommerce, Google Places address autocomplete, richer Mailchimp tags/ActiveCampaign deals | Broaden the ecosystem | | Med | M |

**Done when:** BoldForm competes head-to-head with the top plugins and offers things they don't (conversational + A/B testing).

---

## 6. What we're deliberately NOT doing (for now)

| Item | Why not |
|---|---|
| **SMS / WhatsApp notifications** | Ongoing per-message cost — poor fit for a one-time-license product |
| **Full heatmaps** | Heavy to build; abandonment tracking (1.2) gives most of the value for far less |
| **RTL support** | Mostly handled already via translations; treat as polish, not a headline feature |
| **Standalone one-time respondent links** ("unique URL per respondent") | The private-link mechanism is already covered by **Save & Resume** (Pro 1.1); not planned as a separate feature |

---

## 7. Build plan — organized by risk

We verified every planned item against the actual code. The architecture is safe to extend (Pro adds features through stable Lite hooks; data is stored as field-keyed JSON; database changes are additive with safe defaults). So the plan below is ordered by **risk to existing installs**, not just by marketing tier — build the safe things first, isolate the two dangerous ones for last.

**Golden rule for every item:** all database changes must be **additive with safe defaults** (nullable columns, `DEFAULT 'USD'`, or brand-new tables), applied with the same existence-check migration pattern we already use for the `payment_status` column. Do that and existing forms, existing entries, and free Lite users are never affected.

### Wave 1 — Safe (build first, ship fast) · risk: LOW
Reuse hooks/systems that already exist; live entirely in Pro or use proven patterns. No risk to existing behavior.

- **From Pro 1.1:** Entry Editing · Import Entries · Entry Notes · Entry Limit & Cooldown · Form Locking · Akismet · Color Picker Field · Excel & PDF Export
- **From Pro 1.2:** Custom Email Editor _(the override filters already exist — only the UI is new)_ · Conditional Email Routing · PDF Attachment · Conditional Logic on Pages · Custom Thank-You Page · Draft Auto-Save · Abandonment Tracking · Marketing Tracking · Scheduled Export
- **From Pro 2.0:** User Submission Portal · Embed Modes · Country & IP Blocking · REST API & WP-CLI · Advanced Actions · WooCommerce · AI Response Tools · Google Places · Mailchimp Tags & Groups · ActiveCampaign Deals · Premium Template Packs
- **Free (Lite):** Cloudflare Turnstile ✅ _shipped_

### Wave 2 — Needs a deliberate migration or careful design (plan before coding) · risk: MEDIUM
Achievable and backward-safe, but each has one specific thing to get right first.

| Item | Prerequisite / the thing to get right |
|---|---|
| **Entry Approval Workflow** | Reuse the existing `boldform_defer_post_save_actions` deferral (same mechanism payments already uses to hold notifications, then re-fire on completion). Add an `approval_status` column + approve/reject UI. **No instant-notification leak** if built this way. |
| **Email Confirmation (double opt-in)** | Hold the entry as unconfirmed via the same deferral pattern + a Pro-owned confirmations table; finalize on link click. |
| **A/B Testing** | Add a variant marker to entries + variant config to forms (additive columns). |
| **Custom Entry Statuses** | ⚠️ The one item that can touch *existing* behavior — statuses are hard-coded in the admin tabs, counts, and the import whitelist. **Store custom labels in a separate `custom_status` column** and leave Lite's base enum untouched, so nothing existing breaks. |
| **Multi-Currency Payments** (part of Coupons/Tax/Multi-Currency) | Add a per-entry `currency` column defaulting old rows to `USD`, so switching currency never silently reinterprets historical orders. |

### Wave 3 — High risk to critical paths (build last, test hard) · risk: HIGH
These touch the two most fragile paths — form rendering and the payment flow. Do them only once Waves 1–2 are stable.

- **Conversational Mode** — the frontend assumes all fields are in the DOM; one-at-a-time rendering can break conditional logic. Requires reworking the conditional-logic evaluator per-page (or disabling it in this mode). Touches the most-used code path.
- **Subscriptions & Recurring Payments** — a billing state machine (renewals, cancellations, webhook idempotency) on top of the already-deferred payment flow. Existing one-time payment forms must keep working untouched. Get it wrong → double-charge or orphaned entries.

### The flagship sits across waves
**AI Form Builder** only *creates new* forms — it never mutates existing ones, so it carries no backward-compat risk. The one guardrail: validate the AI's output against the form-JSON schema before saving (add a `boldform_validate_form_json()` check) so malformed output can't reach the builder/renderer.

### Why this order
1. **Wave 1 ships the most value for the least risk** — most of Pro 1.1/1.2 and half of 2.0 fall here, so early releases stay safe and fast.
2. **Wave 2 is gated on one migration each** — cheap, but must be designed before coding so historical data stays valid.
3. **Wave 3 is quarantined** — the only two features that can destabilize rendering or billing are built last, in isolation, with the rest of the platform already proven.

> Marketing tiers (1.1 / 1.2 / 2.0) still hold for messaging; this wave view is the *engineering* order within and across them.

---

## 8. Feature-wishlist reconciliation (source: feature brainstorm)

Every item from the original brainstorm, mapped to reality. **Key takeaway: most of the "features to add" already ship** — the brainstorm predated the current build. Legend: ✅ already shipped · 📅 planned (release) · 🆕 newly added to plan · ⏸ parked/deferred.

| Brainstormed feature | Status | Where |
|---|---|---|
| Password field | ✅ Shipped (Pro) | Includes confirm-and-match validation (already shipped) |
| Color picker field | 🆕 → 📅 | Pro 1.1 |
| Rich text field | ✅ Shipped (Pro) | — |
| Date range picker | ✅ Shipped (Pro) | — |
| Rating / NPS field | ✅ Shipped (Pro) | — |
| Matrix / grid field | ✅ Shipped (Pro) | — |
| Lookup / autocomplete field | ✅ Shipped (Pro) | — |
| Geolocation field | ✅ Shipped (Pro, map-pick) | — |
| Multi-step forms | ✅ Shipped (Pro) | — |
| Conditional logic on pages | 🆕 → 📅 | Pro 1.2 (per-field logic already shipped) |
| Save & resume | 📅 | Pro 1.1 |
| Form locking (password) | 🆕 → 📅 | Pro 1.1 |
| Entry limit | 📅 | Pro 1.1 |
| Submission cooldown | 📅 | Pro 1.1 |
| Draft auto-save | 📅 | Pro 1.2 |
| Partial / abandonment tracking | 📅 | Pro 1.2 |
| Conditional email routing | 📅 | Pro 1.2 |
| PDF attachment | 📅 | Pro 1.2 |
| Email confirmation (token) | 🆕 → 📅 | Pro 1.2 |
| WhatsApp / SMS | ⏸ Parked | cost/fit |
| Coupon / discount codes | 📅 | Pro 1.2 |
| Subscription / recurring payments | 📅 | Pro 2.0 |
| Tax calculation | 📅 | Pro 1.2 |
| Multi-currency | 📅 | Pro 1.2 (one currency/form ships today) |
| Entry editing | 📅 | Pro 1.1 |
| Import entries | 🆕 → 📅 | Pro 1.1 (Lite exports entries ✅; Pro adds import) |
| User submission portal | 📅 | Pro 2.0 |
| Entry notes | 📅 | Pro 1.1 |
| Custom entry statuses | 🆕 → 📅 | Pro 1.1 |
| CSV / Excel scheduled export | 📅 | Pro 1.2 (manual Excel/PDF 📅 Pro 1.1; CSV ✅ free) |
| Entry approval workflow | 📅 | Pro 1.1 |
| Turnstile captcha | ✅ Shipped (Free/Lite) | **Lite (free)** — no-puzzle Cloudflare CAPTCHA |
| Akismet | 📅 | Pro 1.1 |
| Country / IP blocking | 📅 | Pro 2.0 |
| Form token / one-time links | ⏸ | covered by Save & Resume |
| WooCommerce | 📅 | Pro 2.0 |
| Stripe subscriptions | 📅 | Pro 2.0 (= recurring payments) |
| AI Form Builder (generate a form from a prompt) | 🆕 → 📅 | **Flagship — shipping soon (Pro)** |
| OpenAI / AI — auto-respond / summarize submissions | 📅 | Pro 2.0 (AI response tools) |
| Google Maps / Places autocomplete | 📅 | Pro 2.0 |
| Mailchimp groups/tags | 📅 | Pro 2.0 (Mailchimp ✅ shipped) |
| ActiveCampaign deals | 📅 | Pro 2.0 (CRM contacts ✅ shipped) |
| Conversational mode | 📅 | Pro 2.0 |
| Inline embed (popup/slide-in/float) | 📅 | Pro 2.0 |
| Form templates library | ✅ shipped (Free/Lite) | Full categorized library + one-click import already in Lite; only **premium packs** remain 📅 Pro 2.0 |
| RTL support | ⏸ Parked | polish only |
| Custom thank-you page | 📅 | Pro 1.2 (basic redirect + custom message ✅ free in Lite; adds merge-tag personalization) |
| Heatmap / drop-off | ⏸ (heatmap parked) | drop-off = abandonment 📅 Pro 1.2 |
| A/B testing | 📅 | Pro 2.0 |
| UTM / source tracking | 📅 | Pro 1.2 (marketing tracking) |
| Google Analytics / Meta Pixel events | 📅 | Pro 1.2 (marketing tracking) |
| Custom post type creation | 📅 | Pro 2.0 (advanced actions) |
| User registration | 📅 | Pro 2.0 (advanced actions) |
| Post submission (front-end) | 📅 | Pro 2.0 (advanced actions) |
| Role-based form access | 📅 | Pro 2.0 (advanced actions) |
| REST API endpoints | 📅 | Pro 2.0 (developer tools) |
| CLI commands | 📅 | Pro 2.0 (developer tools) |

**Score:** of ~58 brainstormed items, **~9 already ship**, **6 are newly added** to the plan, **~5 are parked/deferred**, and the rest were already on the roadmap.

---

## Appendix — engineering notes (for developers, not PMs)

_Architecture rule:_ every Pro feature ships as a **Pro module that hooks Lite's seams** — Pro never lives inside Lite. Where a needed hook doesn't exist yet, add the Lite seam first.

| Feature | Key hooks / modules |
|---|---|
| AI Form Builder (flagship) | AI provider API (e.g. OpenAI) → map response to BoldForm form JSON; API-key setting + output guardrails/validation |
| Save & Resume | entries store + `boldform_gate_submission`, `boldform_form_output` |
| Entry approval | extends the entry status system; gate side-effects on `boldform_entry_created` |
| Entry editing | reuse builder renderer against the stored entry schema |
| Excel/PDF export | entries export; PDF lib shared with Pro 1.2 |
| Entry limit / cooldown | `boldform_gate_submission` |
| Conditional email / PDF email | **needs a new Lite email-builder seam first** (custom subject/body + merge tags) |
| Thank-you tokens | reuse the existing auto-populate/merge-tag system |
| Abandonment / UTM / A/B | extend the analytics module |
| Conversational mode / embed modes | new front-end render layer |
| Developer tools | new REST + WP-CLI layer |

_Version note:_ Lite **1.2.0** is the jQuery→React rewrite. Land new free items on the React line once it ships, or on a 1.1.x point release — do not back-port React-only UI to the jQuery line.
