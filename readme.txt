=== BoldForm – Drag & Drop Form Builder ===
Contributors: themewant, maha25
Tags: forms, contact form, form builder, drag and drop, gutenberg
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight drag-and-drop form builder for WordPress with shortcode, Gutenberg block, Elementor widget, AJAX submissions, and email integrations.

== Description ==

**BoldForm Lite** is a powerful yet lightweight form builder for WordPress. Build any kind of form using a visual drag-and-drop editor, embed it anywhere with a shortcode, Gutenberg block, or Elementor widget, and manage every submission right inside your WordPress dashboard.

Whether you need a simple contact form, a multi-field registration form, or a survey with conditional logic — BoldForm Lite has you covered with zero bloat.

---

= Core Features =

**Drag & Drop Form Builder**
Build forms visually without writing a single line of code. Drag fields from the sidebar, reorder them, and configure each one instantly.

**AJAX Form Submission**
Forms submit without a full page reload, giving visitors a smooth, fast experience.

**Entries Management**
Every submission is stored in your WordPress database. View, filter, read, and delete entries from the BoldForm > Entries page. Mark entries as read, unread, or spam.

**Email Notifications**
Automatically send an admin notification on every submission. Configure a custom "From" name, reply-to address, subject, and message body. Test email delivery directly from the settings panel.

**Reports & Analytics**
A built-in reports dashboard shows total forms, total entries, and per-form performance stats using the browser's native HTML5 Canvas chart — no external library required.

**Export & Import**
Export all forms, a single form with its entries, or global settings as a JSON file. Import everything back with one click — great for moving between environments.

**Multi-Step Forms**
Divide long forms into steps using the Section Break field. Display a progress bar, step indicators, or headings. Fully style the Next/Previous buttons and progress colors.

**Conditional Logic**
Show or hide any field based on the visitor's previous answers. Supports AND/OR logic rules per field.

**Form Templates**
Start from a pre-built template instead of a blank form. Pick a template during form creation and customise from there.

**Translation Ready**
All strings are internationalised using the `boldform-lite` text domain, ready for translation with any standard WordPress translation workflow.

**Multisite Compatible**
Tables are created automatically for each new subsite when the plugin is network-activated.

---

= Form Fields =

**Standard Fields**
* Text
* Email
* Number
* Textarea
* Password
* Hidden

**Choice Fields**
* Select (single or multi-select with custom dropdown)
* Checkbox
* Radio Button

**Date & Time**
* Date picker (powered by Flatpickr)
* Date Range picker
* Time picker

**Layout & Content**
* Section Break (multi-step divider)
* Paragraph / Static Text
* HTML Block
* Terms & Conditions

**File & Media**
* File Upload (configurable max size, stored in WordPress uploads)

**Address & Identity**
* Name (structured first/last name)
* Address (structured address field)

**Survey & Feedback**
* NPS (Net Promoter Score)
* Matrix (grid questions)

---

= Embedding Options =

* **Shortcode** — `[boldform id="123"]`
* **Gutenberg Block** — Insert the BoldForm block in any page or post
* **Elementor Widget** — Full widget with rich styling controls in the Elementor editor

---

= Spam Protection =

* **Honeypot** — Invisible hidden field catches bots automatically, no setup required
* **Google reCAPTCHA v2** — Checkbox challenge; requires a site key and secret key from Google
* **hCaptcha** — Privacy-friendly alternative to reCAPTCHA; requires keys from hCaptcha
* **Math Captcha** — Simple arithmetic challenge, works out of the box with no API keys

---

= Email Marketing Integrations =

Connect forms to email marketing platforms and automatically add subscribers on submission.

* **Mailchimp** — Add contacts to any audience list with email, first name, and last name mapping
* **Brevo (formerly Sendinblue)** — Add contacts to any Brevo list with field mapping

Configure connections under **BoldForm > Settings > Integrations**, then assign a connection to each form.


---

= BoldForm Pro — Coming Soon =

BoldForm Pro extends Lite with advanced features for professionals and agencies:

**Advanced Form Fields**
* Signature field
* Image Choice field
* Repeater field (multi-instance rows)
* Calculation field
* Auto-Populate field
* Geolocation field
* Product, Quantity, Custom Amount, and Order Summary fields

**Multi-Page Forms**
Advanced multi-step forms with save-and-resume, step validation, and conditional page routing.

**Payments**
Accept one-time and recurring payments directly inside your forms:
* Stripe (credit/debit cards)
* PayPal (checkout redirect)
* Payment calculator with custom pricing rules

**Advanced Analytics**
Detailed per-form analytics: submission trends, field abandonment rates, conversion tracking.

**Scheduling**
Open and close forms automatically on a date/time schedule.

**Webhooks**
Send form data to any external URL via HTTP POST on each submission.

**Automation Integrations**
* Zapier
* Make (formerly Integromat)
* Pabbly Connect

**CRM & Email Marketing (Pro)**
* ActiveCampaign
* ConvertKit
* AWeber
* GetResponse
* MailerLite
* HubSpot
* Zoho CRM
* FluentCRM
* Help Scout

**Productivity & Storage**
* Google Sheets — Append a row to any spreadsheet on each submission
* Google Drive — Save uploaded files directly to a Drive folder
* Dropbox — Save uploaded files to a Dropbox folder

**Messaging & Notifications**
* Slack — Post a rich message to any channel via incoming webhook
* Discord — Post to a Discord channel
* Telegram — Send a message to a bot or channel
* Microsoft Teams — Post a card to a Teams channel

**Conditional Logic (Pro)**
Advanced conditional rules with multi-field dependencies, page-level conditions, and email routing logic.

---

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/boldform-lite/`, or install via **Plugins > Add New** in the WordPress admin.
2. Activate the plugin through the **Plugins** screen.
3. Go to **BoldForm** in the admin sidebar and create your first form.
4. Copy the shortcode shown in the form editor and paste it on any page, or use the Gutenberg block / Elementor widget.

---

== Frequently Asked Questions ==

= How do I display a form? =

Three options: paste `[boldform id="123"]` into any page or post, use the **BoldForm** Gutenberg block, or drag the **BoldForm** widget into any Elementor layout.

= Where can I see form submissions? =

Go to **BoldForm > Entries** in the WordPress admin. Click any row to see the full submission detail.

= Does the plugin store submissions in the database? =

Yes. Every submission is stored in a custom table so you always have a permanent record, independent of email delivery.

= Can I send a notification email to the person who submitted the form? =

Admin notifications are included in the Lite version. User (submitter) notifications are part of the email routing system; configure the recipient email to the field that collects the user's address.

= How do I enable spam protection? =

Go to **BoldForm > Settings > Captcha**. Choose your preferred provider (Honeypot is always active). Enter API keys for reCAPTCHA or hCaptcha if you select those.

= Is BoldForm multisite compatible? =

Yes. When the plugin is network-activated, it automatically creates the necessary database tables for each new subsite.

= Does it work with Elementor? =

Yes. BoldForm registers a native Elementor widget with full styling controls for fields, labels, buttons, and more — all editable within the Elementor panel.

= Will there be a Pro version? =

Yes, BoldForm Pro is currently in development. It will add payments (Stripe, PayPal), advanced field types, more integrations, scheduling, webhooks, and more. See the **BoldForm Pro — Coming Soon** section above for the full list.

---

== Screenshots ==

1. Drag-and-drop form builder
2. Frontend form display
3. Entries management page
4. Settings and integrations panel
5. Elementor widget controls

---

== Bundled Libraries ==

All JavaScript and CSS assets are bundled locally within the plugin directory. No scripts or styles are loaded from a CDN or any remote server except for the explicitly documented external services listed below.

**Bundled third-party libraries:**

* **SortableJS** (`assets/js/sortable.js`) — MIT License — https://github.com/SortableJS/Sortable
  Local copy used for drag-and-drop field ordering in the builder. Not fetched from any CDN.

* **Flatpickr** (`assets/js/flatpickr.min.js`, `assets/css/flatpickr.min.css`) — MIT License — https://github.com/flatpickr/flatpickr
  Local copy used for the date and time picker fields. Not fetched from any CDN.

The submissions chart on the Reports page is rendered using the browser's native HTML5 Canvas API. No external charting library is loaded.

---

== External Services ==

This plugin can optionally connect to the following third-party services. No data is transmitted to any external service unless you have explicitly enabled and configured that service in BoldForm settings.

= Google reCAPTCHA =

Protects forms from spam and bot submissions.

When a page containing a reCAPTCHA-enabled form is loaded, Google's reCAPTCHA script is loaded from Google's servers. On submission, the plugin sends the reCAPTCHA token and the visitor's IP address to Google's verification API.

* Data sent: reCAPTCHA response token, visitor IP address
* When: Each form submission with reCAPTCHA enabled
* Condition: Only when "Google reCAPTCHA" is selected in BoldForm > Settings > Captcha and valid keys are entered
* Service provider: Google LLC
* Terms of Service: https://policies.google.com/terms
* Privacy Policy: https://policies.google.com/privacy

= hCaptcha =

Privacy-friendly alternative for spam protection.

When a page with an hCaptcha-enabled form is loaded, the hCaptcha script is loaded from hCaptcha's servers. On submission, the token and visitor IP are sent to hCaptcha's verification API.

* Data sent: hCaptcha response token, visitor IP address
* When: Each form submission with hCaptcha enabled
* Condition: Only when "hCaptcha" is selected in BoldForm > Settings > Captcha and valid keys are entered
* Service provider: Intuition Machines, Inc.
* Terms of Service: https://www.hcaptcha.com/terms
* Privacy Policy: https://www.hcaptcha.com/privacy

= Mailchimp =

Adds subscribers to a Mailchimp audience on form submission.

* Data sent: Email address, and optionally first name and last name (only fields you map)
* When: Each submission of a form with an active Mailchimp integration
* Condition: Only when a Mailchimp connection with a valid API key is configured under BoldForm > Settings > Integrations
* Service provider: The Rocket Science Group LLC (Mailchimp)
* Terms of Use: https://mailchimp.com/legal/terms/
* Privacy Policy: https://mailchimp.com/legal/privacy/

= Brevo (formerly Sendinblue) =

Adds contacts to a Brevo list on form submission.

* Data sent: Email address, and optionally first name and last name (only fields you map)
* When: Each submission of a form with an active Brevo integration
* Condition: Only when a Brevo connection with a valid API key is configured under BoldForm > Settings > Integrations
* Service provider: Brevo SAS
* Terms of Use: https://www.brevo.com/legal/termsofuse/
* Privacy Policy: https://www.brevo.com/legal/privacypolicy/

---

== Changelog ==

= 1.0.1 =
* Fix: Buttons now include an accessible `aria-label` so screen readers announce the button text correctly.
* Fix: Select fields now include `aria-label`, `aria-haspopup`, and `aria-controls` attributes for full WCAG compliance.
* Fix: Native select element is correctly hidden when the custom dropdown is active, eliminating the duplicate-box display bug.
* Fix: Version constant updated to match plugin header, resolving asset versioning and remote file loading issues.
* Add: Separate Button Margin control in Elementor targeting the button element directly.
* Add: Restored missing Elementor widget settings for Section Break and Terms & Conditions sections.

= 1.0.0 =
* Initial release.
