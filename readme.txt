=== BoldForm - Drag & Drop Form Builder ===
Contributors: themewant, maha25
Tags: contact form, form builder, forms, drag and drop, gutenberg
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.1.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight drag-and-drop WordPress form builder — contact forms and more with a shortcode, Gutenberg block, Elementor widget, and email integrations.

== Description ==

**BoldForm** is a fast, lightweight drag-and-drop form builder for WordPress. Build any form you need in a visual editor — no code — then embed it anywhere with a shortcode, a Gutenberg block, or an Elementor widget. Every submission is stored safely in your WordPress database and managed right from your dashboard.

From a simple contact form to a form with conditional logic, spam protection, and email-marketing sync, BoldForm gives you the tools professional forms need — without the bloat that slows your site down.

* [Live Demo](https://themewant.com/plugins/boldform) | [Documentation](https://documentation.themewant.com/docs/boldform-user-guide/) | [Roadmap](https://themewant.com/plugins/boldform/roadmap/) | [Support](https://themewant.com/support/) | [Community](https://www.facebook.com/groups/themewant) | [Upgrade to Pro](https://themewant.com/plugins/boldform/)

https://www.youtube.com/watch?v=EWum_aGDAMc

= Why BoldForm? =

* **Drag & drop** — build and reorder fields visually, configure each one instantly, and watch your styling update live as you work.
* **Lightweight by design** — assets load only where a form appears, the analytics chart uses the browser's native canvas (no charting library), and each form is queried once per request.
* **No lock-in** — export and import your forms, entries, and settings as JSON at any time.
* **Yours to control** — submissions live in your own database, with built-in tools to export or erase personal data on request.
* **Extend anywhere** — a clean, documented action/filter API lets add-ons and developers hook into every stage of the form lifecycle.

Perfect for contact forms, quote requests, registrations, feedback forms, surveys, job applications, event sign-ups, and newsletter opt-ins.

= Drag & Drop Form Builder =

Build forms visually without writing a single line of code. Drag fields from the sidebar, drop them into multi-column rows, reorder with a handle, and configure every field in its own settings panel.

* **Multi-column layouts** — arrange fields in flexible rows and columns with adjustable widths.
* **Live Style tab** — field, label, and button styling updates instantly beside the controls, with Normal / Hover / Focus / Checked states, selectable design themes, gradient backgrounds, and per-device (desktop / tablet / mobile) responsive values.
* **Custom submit button** — set your own text, a Dashicon or custom SVG icon, and the icon colour.
* **Form templates** — start from a ready-made template (Contact, Lead Capture, Feedback, Newsletter) instead of a blank canvas, then customise from there.

= All the Fields You Need =

**Standard**
* Text, Email, URL, Phone, Number, Numeric, Textarea

**Choice**
* Select (single or multi-select custom dropdown), Multi Select, Checkbox, Radio, Country

**Date & Time**
* Date picker and Time picker (powered by the bundled Flatpickr)

**Rating & Range**
* Star Rating (per-field colours and size), Slider / Range (with an optional dual-handle min–max mode)

**Advanced input**
* Input Mask for formatted text entry
* File Upload with a configurable size cap, stored in your WordPress uploads

**Identity & address**
* Name (structured first / middle / last)
* Address (structured multi-line address)

**Layout & content**
* Section Break (heading + description divider), Paragraph / Static Text, HTML Editor, Terms & Conditions

= Smart Form Features =

* **Conditional Logic** — show or hide any field based on the visitor's previous answers, with AND / OR rules per field.
* **AJAX Submission** — forms submit without a full page reload for a smooth, fast experience.
* **Duplicate Prevention** — optionally block repeat submissions based on a chosen field, such as email address.

= Entries Management =

Every submission is saved to a custom database table — a permanent record, independent of email delivery.

* View, filter, and read submissions from **BoldForm → Entries**.
* Mark entries **Read, Unread, Starred, or Spam**, with a dedicated Spam tab.
* **Trash & restore** — move entries to a Trash tab instead of deleting them outright, then restore them (with their original status intact) or delete them permanently, so an accidental delete is recoverable.
* **Bulk actions** — mark many entries at once, move them to Trash, or — from the Trash tab — restore or permanently delete them.
* **CSV export** — export all entries, or just the ones you select.
* **Reports & Analytics** — a dashboard of total forms, total entries, and per-form stats, charted with the browser's native HTML5 Canvas (no external library loaded).

= Spam Protection =

* **Honeypot** — Invisible hidden field catches bots automatically, no setup required
* **Google reCAPTCHA v2** — Checkbox challenge; requires a site key and secret key from Google
* **hCaptcha** — Privacy-friendly alternative to reCAPTCHA; requires keys from hCaptcha
* **Cloudflare Turnstile** — Modern, no-puzzle captcha from Cloudflare; requires keys from the Cloudflare dashboard
* **Math Captcha** — Simple arithmetic challenge, works out of the box with no API keys

---

= Email Marketing Integrations =

* **Email Notifications** — send an admin notification on every submission, with a custom "From" name, reply-to, subject, and message body. Test delivery straight from the settings panel.
* **SMTP** — route outgoing mail through your own SMTP server for reliable delivery.
* **Mailchimp** — add contacts to any audience list with email, first-name, and last-name mapping.
* **Brevo (formerly Sendinblue)** — add contacts to any Brevo list with field mapping.

Configure connections under **BoldForm → Settings → Integrations**, then assign one to each form.

= Embed Anywhere =

* **Shortcode** — `[boldform id="123"]`
* **Gutenberg Block** — insert the BoldForm block in any page or post (Block API v3, with a styled in-editor preview).
* **Elementor Widget** — a native widget with full styling controls for fields, labels, buttons, and more, editable right in the Elementor panel.

= Import, Export & Tools =

Move your work between sites with one click. From **BoldForm → Tools**, export all forms, a single form together with its entries, or your global settings as a JSON file, and import them back on any other site.

= Developer Friendly =

BoldForm ships a documented action/filter API so add-ons and custom code can hook into validation, submission, entry storage, integrations, and rendering — without touching core. Register custom field types, resolve auto-populate keys, defer post-save actions, and render rich entry values in the admin.

= Privacy & GDPR Ready =

* Submissions stay in **your** database; nothing is sent anywhere unless you configure one of the external services listed below.
* A personal-data **exporter and eraser** are registered with WordPress's privacy tools, keyed on the submitter's email address.
* Optional "remove all data on uninstall" cleanup.

= Translation & Multisite =

* Every string uses the `boldform-lite` text domain and is ready for translation.
* Network-activate on multisite and tables are created automatically for each new subsite.

= Meet BoldForm Pro =

Ready for more? **[BoldForm Pro](https://themewant.com/plugins/boldform/)** unlocks advanced tools for professionals and agencies — all inside the same drag-and-drop builder you already know.

**Advanced form building**

* **Multi-page (step) forms** with progress indicators
* **Advanced fields** — Rich Text, Signature, Repeater, Calculation, Geolocation, NPS and more
* **Auto-populate & hidden data** fields
* **Form scheduling** with open / close dates
* **Advanced analytics** — form views and conversion tracking
* **Webhooks** to send form data to any external URL

**Payments**

* **Stripe** and **PayPal** — accept one-time and recurring payments right inside your forms.

**30+ integrations** — connect a form to the apps you already use:

* **Email marketing** — ActiveCampaign, Kit (formerly ConvertKit), AWeber, GetResponse, MailerLite, Constant Contact, Drip, and Moosend (in addition to Mailchimp and Brevo from Lite).
* **CRM** — HubSpot, Salesforce, Zoho CRM, Pipedrive, Freshsales, FluentCRM, Help Scout, and monday.com.
* **Automation** — Zapier, Make, and Pabbly Connect.
* **Productivity** — Notion, Airtable, Trello, and Asana.
* **Storage** — Google Sheets, Google Drive, and Dropbox.
* **Messaging & notifications** — Slack, Discord, Telegram, and Microsoft Teams.

Plus **priority support and automatic updates**.

[See everything in BoldForm Pro →](https://themewant.com/plugins/boldform/)

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/boldform-lite/`, or install it directly through **Plugins → Add New** in the WordPress admin.
2. Activate the plugin through the **Plugins** screen.
3. Go to **BoldForm** in the admin sidebar and create your first form.
4. Copy the shortcode shown in the form editor and paste it on any page, or add the form with the Gutenberg block or Elementor widget.

== Frequently Asked Questions ==

= How do I display a form? =

You have three options: paste `[boldform id="123"]` into any page or post, insert the **BoldForm** Gutenberg block, or drag the **BoldForm** widget into any Elementor layout.

= Where do I see form submissions? =

Go to **BoldForm → Entries** in the WordPress admin. Click any row to open the full submission detail. You can mark entries as read, unread, starred, or spam, run bulk actions, and export to CSV.

= Does BoldForm store submissions in the database? =

Yes. Every submission is saved to a custom table, so you always have a permanent record — independent of whether the notification email is delivered.

= How do I protect my forms from spam? =

Go to **BoldForm → Settings → Captcha** and choose a provider. Honeypot protection is always active with no setup. You can also enable Math Captcha (no keys needed), Google reCAPTCHA v2, or hCaptcha (both require your own API keys).

= Can I connect forms to Mailchimp or Brevo? =

Yes. Add a connection under **BoldForm → Settings → Integrations**, then assign it to a form and map the email, first-name, and last-name fields. Subscribers are added automatically on submission.

= How do I enable spam protection? =

Go to **BoldForm > Settings > Captcha**. Choose your preferred provider (Honeypot is always active). Enter API keys for reCAPTCHA, hCaptcha, or Cloudflare Turnstile if you select those.

= Is BoldForm multisite compatible? =

Yes. When the plugin is network-activated, it automatically creates the necessary database tables for each new subsite.

= Is BoldForm GDPR friendly? =

Yes. Submissions stay in your own database, and BoldForm registers a personal-data exporter and eraser with WordPress's privacy tools so you can fulfil data-subject requests by email address. See the Privacy section below for details.

= Is there a Pro version? =

Yes — **BoldForm Pro** adds payments (Stripe, PayPal), multi-page forms, advanced field types, webhooks, and 30+ integrations. See the **Meet BoldForm Pro** section above, or visit [themewant.com/plugins/boldform](https://themewant.com/plugins/boldform/).

== Screenshots ==

1. Add New Form
2. Drag & Drop Builder
3. Form Preview
4. Form Confirmation Settings
5. Form Global Settings
6. Form Analytics
7. Form Integration
8. Form View On Page

== Bundled Libraries ==

All JavaScript and CSS assets are bundled locally within the plugin directory. No scripts or styles are loaded from a CDN or any remote server except for the explicitly documented external services listed below.

**Bundled third-party libraries:**

* **Flatpickr** (`assets/js/flatpickr.min.js`, `assets/css/flatpickr.min.css`) — MIT License — https://github.com/flatpickr/flatpickr
  Local copy used for the date and time picker fields. Not fetched from any CDN.

**First-party scripts:**

* `assets/js/sortable.js` — a small first-party drag-and-drop helper written for this plugin (used for field ordering in the builder). It is original BoldForm code, not the third-party SortableJS library, and is GPL-licensed with the rest of the plugin.

The submissions chart on the Reports page is rendered using the browser's native HTML5 Canvas API. No external charting library is loaded.

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

= Cloudflare Turnstile =

Modern, privacy-friendly spam protection with no visual puzzles.

When a page with a Turnstile-enabled form is loaded, the Turnstile script is loaded from Cloudflare's servers. On submission, the token and visitor IP are sent to Cloudflare's verification API.

* Data sent: Turnstile response token, visitor IP address
* When: Each form submission with Turnstile enabled
* Condition: Only when "Cloudflare Turnstile" is selected in BoldForm > Settings > Captcha and valid keys are entered
* Service provider: Cloudflare, Inc.
* Terms of Service: https://www.cloudflare.com/website-terms/
* Privacy Policy: https://www.cloudflare.com/privacypolicy/

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

== Privacy ==

When a visitor submits a form, BoldForm Lite stores the submission in your site's own database (no data is sent anywhere unless you have configured one of the external services listed above). Each stored entry includes:

* The values the visitor entered in the form fields (which may include personal data such as name, email address, phone number, address, and any uploaded files).
* The submitter's IP address and browser user-agent string, recorded for spam-prevention and auditing.
* The logged-in user ID, when the form is submitted by a logged-in user.

Entries are retained until you delete them. You can remove individual entries (or all of them) from **BoldForm > Entries** at any time. If you enable "Remove all data on uninstall" in the settings, all stored forms and entries are deleted when the plugin is uninstalled.

BoldForm Lite integrates with WordPress's built-in privacy tools: under **Tools > Export Personal Data** and **Tools > Erase Personal Data**, an administrator can export or erase the form entries associated with a given email address to help fulfil data-subject requests.

BoldForm – Drag &amp; Drop Form Builder uses [Appsero](https://appsero.com) SDK to collect some telemetry data upon user's confirmation. This helps us to troubleshoot problems faster & make product improvements.

Appsero SDK **does not gather any data by default.** The SDK only starts gathering basic telemetry data **when a user allows it via the admin notice**. We collect the data to ensure a great user experience for all our users.

Integrating Appsero SDK **DOES NOT IMMEDIATELY** start gathering data, **without confirmation from users in any case.**

Learn more about how [Appsero collects and uses this data](https://appsero.com/privacy-policy/).

== Changelog ==

= 1.1.4 =
Improvements:
* Improve: The Entries screen and the Tools → Entries export panel now preview Excel and PDF export — locked "Export Excel" / "Export PDF" options that open a quick upgrade dialog when clicked. Shown only in the free version.

= 1.1.3 =
New features:
* New: Cloudflare Turnstile captcha — a modern, privacy-friendly, no-puzzle alternative to reCAPTCHA and hCaptcha. Choose it under Settings > Captcha, add your Turnstile keys, and the widget is verified server-side on every submission.

Improvements:
* Improve: The BoldForm Pro promotion notice now announces that Pro has launched, with a shorter, cleaner layout and a single clear call to action. It no longer appears on the Upgrade to Pro page, where it would be redundant.
* Improve: Refreshed the Upgrade to Pro page header — it now leads with the current offer, clearer benefit copy, a stronger call to action, and at-a-glance reassurances (instant access, automatic updates, priority support).
* Improve: When BoldForm Pro is active, every "Upgrade to Pro" prompt is now hidden — the promo notice, the menu item, the toolbar button, and the page-header link — and the Upgrade page shows a short "You're on Pro" confirmation instead of the comparison, so paying users are never shown upgrade nags.
* Improve: The Entries "Export Selected" actions are now a single dropdown (CSV, and Excel/PDF with Pro) instead of a row of separate buttons, for a cleaner bulk-action bar.
* Improve: Tidied the SMTP settings screen — the "Send Test Mail" result message now aligns neatly beside the button, and the Save Changes button has clearer spacing.
* Improve: Entries now use a Trash instead of deleting immediately — the "Delete permanently" bulk action is replaced by "Move to Trash", trashed entries collect under a new Trash tab (excluded from the other views and from exports), and from there they can be Restored or Deleted Permanently. This matches how WordPress and other form plugins handle deletion, so an accidental bulk delete is recoverable.

Fixes:
* Fix: The Forms list row-actions ("...") menu is no longer clipped by the table card — it now opens fully and stays visible.

Developer:
* Developer: New entry-detail extension points — the `boldform_entry_detail_sidebar` action and `boldform_entry_detail_enqueue_assets` action let add-ons render cards (and load their assets) on the single-entry screen.

= 1.1.2 =
Improvements:
* Improve: Added an "Upgrade to Pro" page and CTAs comparing Free vs Pro features, so it's easy to see what BoldForm Pro adds.
* Improve: The Entries list now supports bulk actions — select multiple submissions and mark them Read, Unread, Starred, or Spam, or delete them in one step.
* Improve: Added an "Export Selected" button on the Entries list to export just the checked submissions to CSV.
* Improve: Reorganised the Tools screen into separate Forms and Entries tabs, and added a standalone Entries export so you can download submissions on their own.
* Improve: Added a Documentation menu to the admin toolbar with quick links to the User and Developer guides.
* Improve: Expanded the Elementor widget with a Range Slider styling section and typography controls for input text.
* Improve: Exporting a form now bundles the submit button's custom SVG icon inside the export file, so the icon is recreated on the destination site and keeps working after the form is imported on another website.
* Improve: Importing an export that includes entries now reports how many entries were imported (not just forms), and the Tools export/import descriptions make clear that entries can travel with a full export.

Fixes:
* Fix: Several form and settings values no longer reset to their defaults after saving and reopening — page-redirect type, duplicate-submission prevention, and field style are all preserved.
* Fix: Saving one Settings tab (General, Captcha, or SMTP) no longer clears the settings on the other tabs.
* Fix: Custom column widths in the form builder are now kept when a form is saved.
* Fix: Resolved a form scheduling issue so scheduled open/close windows behave correctly.
* Fix: The submit button's Icon Color now applies reliably to both Dashicon and custom SVG icons — in the builder preview and on the front end — and the colour swatch updates live as you pick.
* Fix: An icon-only submit button (an icon with no button text) is no longer reset to "Submit" after saving and reopening the form.
* Fix: Tidied spacing and sizing across the form builder's field settings panel, so controls align consistently — the Quantity field's Min/Max/Default inputs, the "Enable search" toggle, the option and repeater "Add" buttons, and the payment product option rows.
* Fix: The Documentation menu now also appears in the toolbar on the Integrations page, so the admin navigation is consistent across every screen.
* Fix: Importing an export that includes entries no longer loses or alters submission data — values with structured or nested content are preserved intact and numbers keep their full precision.

Maintenance:
* Update: Removed unused files and empty folders from the plugin package for a cleaner, lighter install.

= 1.1.1 =
Improvements:
* Improve: Redesigned the Integrations settings dialog, and a connection now switches on immediately after you save it — no second click needed.
* Improve: The Forms and Entries list tables stay usable on small screens — wide tables scroll within their card instead of stretching or breaking the page layout.
* Improve: The Entries admin menu now shows an unread-submissions count badge (like the Comments menu) so new entries are visible at a glance.
* Improve: Expanded the User Guide and Developer Guide with step-by-step setup instructions and screenshots for every integration, plus smooth in-page navigation.

Fixes:
* Fix: Conditional Logic rules now save reliably — multi-condition rules and the ALL/ANY match mode are preserved when a form is reopened in the builder.

Developer:
* Developer: New extension hooks for add-ons — boldform_defer_post_save_actions (hold the entry-created action and notification emails until an entry is finalised), boldform_auto_populate_value (resolve any auto-populate key through a single filter), and boldform_entry_value_admin_html (return rich HTML for an entry value on the admin detail screen only). A boldform_form_reset event now fires on the document after a successful AJAX submit so custom field widgets can re-sync.
* Developer: The bundled Appsero SDK now lives under includes/appsero/, and tag source archives strip development-only files via .gitattributes.

= 1.1.0 =
New features:
* New: Dual-handle range slider — an opt-in "Dual range (min–max)" mode renders two handles with a filled track and validates the selected range on submit.
* New: Greatly expanded Style tab with live preview — field, label, and submit-button styling update instantly beside the controls, with Normal/Hover/Focus/Checked state tabs across every section, selectable Design Themes, gradient backgrounds, a styled file-upload drop-zone, sub-field label styling, container alignment and max-width, and per-device (desktop/tablet/mobile) responsive values.
* New: Help & Support page with links to the User Guide, Developer Guide, Support, Community, Leave a Review, and Request a Feature.
* New: "Mark as Spam" entry action and a Spam filter tab on the Entries screen.
* New: The BoldForm logo now appears throughout the admin — the sidebar menu icon adapts to your admin colour scheme, and the mark replaces the generic placeholder icon in the topbar, form builder, Reports, and the empty Forms state.
* New: A dismissible "BoldForm Pro is launching soon!" early-access notice links administrators to the launch waitlist; once dismissed it stays hidden per user.

Privacy:
* Privacy: A personal-data exporter and eraser are registered with WordPress's privacy tools, keyed on the submitter's email address, so site owners can fulfil data export and erasure requests for form entries.
* Privacy: readme now documents what data is stored, how long it is kept, and how to export or erase it.
* Privacy: Optional, opt-in usage telemetry via the Appsero SDK — nothing is collected unless an administrator explicitly agrees through the admin notice (see the Privacy section above).

Security:
* Security: Integration API keys (Mailchimp, Brevo) are never written into page HTML; the builder receives only the connection id, name, type, and status, and the stored key is preserved when the field is left blank.
* Security: File uploads are re-validated on the server — SVG/SVGZ files are rejected, the size cap is enforced against the real on-disk bytes, and an explicit MIME allowlist is verified instead of trusting the filename.
* Security: Stronger SVG sanitization now strips `<a>`, `<style>`, SMIL animation tags, and namespaced `href` attributes, failing closed on files that cannot be parsed.
* Security: Settings import drops uninstall flags, all SMTP fields, and any key, secret, or password values before merging an uploaded file.
* Security: Form save sanitizes every field and option by type, de-duplicates field IDs, and caps the number of rows, columns, fields, and options.
* Security: Integrations dispatch only to explicitly active connections, and a connection with no API key can no longer be enabled.
* Security: The Mailchimp list ID is constrained to its expected grammar before use (SSRF hardening), and the settings option no longer autoloads SMTP passwords and captcha secret keys on every page.
* Security: Database errors are only surfaced when WP_DEBUG is enabled, so production never leaks raw SQL details.

Accessibility:
* Accessibility: Star-rating fields are fully keyboard and screen-reader operable (radiogroup, roving tabindex, arrow/Home/End/Space/Enter, per-star labels, visible focus ring).
* Accessibility: The custom dropdown supports in-listbox keyboard navigation (Arrow/Home/End/Enter/Escape) with an active-option highlight.
* Accessibility: On submit, validation errors are announced and associated with their fields (aria-invalid, aria-describedby, role="alert"), and focus moves to the first invalid field; choice and name groups gain role="group" with proper labelling.
* Accessibility: The builder announces row and field add/delete/duplicate actions to screen readers.

Performance:
* Performance: CSV export now streams in bounded batches instead of loading every entry into memory, so large exports no longer risk a memory spike (the output is identical).
* Performance: Each form is loaded once per request, so embedding the same form multiple times on a page no longer repeats the query.

Improvements:
* Improve: The forms list now matches WordPress-native list tables, with sortable column headers, a synced select-all checkbox, and native-styled bulk and filter controls.
* Improve: Builder canvas polish — clearer field hover and selected states, an accordion Style tab, a full-width Settings tab, a topbar that reflows before overlapping on narrow screens, and an improved shortcode copy button.
* Improve: An editing overlay now covers the canvas while the builder loads an existing form, so it no longer flashes the empty "Start building" placeholder.
* Improve: Conditional Logic condition rows wrap cleanly on narrow builder panels and small screens.
* Improve: The field library is drag-only — fields clone onto the canvas and the palette is never a drop target.
* Improve: Slider, star-rating, and field styling now follow the form's design theme; star rating defaults to a consistent size.
* Improve: Refreshed the Forms admin screen — the action notice ("Form moved to trash", etc.) is now a modern alert in the page header, the empty state has a styled "Add New Form" button, the top spacing is tightened, and the form builder sits flush with no left gap.
* Improve: Builder drag-and-drop now auto-scrolls the canvas while you drag a row or field toward the top or bottom edge, so drop targets below the fold are reachable on small screens; the row and field move handles also show a grab cursor.
* Improve: The form Preview screen header is now a single toolbar with an Exit button, a "Form Preview" title, and a click-to-copy shortcode pill, and the Choose Column Layout dialog was redesigned with guided layout cards and clearer hover/focus states.
* Improve: Style-tab numeric controls no longer overlap the unit suffix with the spinner arrows; Padding, Margin, and Border-Radius gained a visible stepper, and size and spacing fields show a meaningful placeholder ("Default" or "—") instead of a misleading "0".
* Improve: The colour reset button now stays disabled until a colour is changed, so it is clear when a value differs from the default.
* Improve: BoldForm admin screens now show only BoldForm's own notices — promotional banners from other plugins or the active theme are suppressed on our screens.
* Improve: Star Rating is now styled per field — Number of Stars, Icon Size, Star Color (resting), and Active Color (hover/selected) live in the field's own settings; the global Star Rating section was removed from the Style tab. Placeholder and Default Value remain hidden as they do not apply.
* Improve: Each field type now starts with a sensible default placeholder (e.g. "you@example.com" for email, "https://example.com" for URL) shown consistently on the canvas, preview, and front end; it can be edited or cleared per field.
* Improve: Renamed every admin-visible "Bold Form" to "BoldForm" for consistent product branding.
* Improve: Moved the Integrations submenu directly above Help & Support in the BoldForm admin menu.
* Improve: Balanced the Entries list-table column widths so the Submission column no longer crowds the Form, Date, and Status columns.

Fixes:
* Fix: Forms are no longer submitted for real when rendered in an editor or preview — the Gutenberg block preview, the Elementor editor, and the admin Preview Form screen.
* Fix: Numeric min/max/step bounds and dual-slider ranges are now enforced on the server, not just shown as input hints.
* Fix: A required dropdown no longer silently submits its first option; an empty placeholder option is emitted and empty required selects are rejected server-side.
* Fix: Forms embedded more than once on a page now get unique element IDs, so labels and widgets target the correct instance.
* Fix: Checkbox, radio, and dropdown selected states now follow the form's design-theme colour instead of always showing the default teal.
* Fix: Each field's configured maximum file size is honoured instead of a fixed 2 MB cap, and rich-content fields render their formatting correctly.
* Fix: Mailchimp contacts are upserted (PUT) instead of POSTed, resolving the "Member Exists" error on repeat submissions.
* Fix: Removed the non-functional Brevo "Tags" field and pre-select the form's email field when a connection is assigned.
* Fix: Restored the `boldform_field_library` filter so add-ons can register custom field types again.
* Fix: Email fields are validated with `is_email()`, duplicate-entry detection honours each field's own ID, and client-side conditional-logic operators match the server evaluator exactly.
* Fix: The BoldForm block inspector now shows only Form Settings; the duplicate Container, Layout, Labels, Input, Button, and Error style panels (already covered by the builder's Style tab) were removed.
* Fix: The BoldForm block form preview keeps its styling when Hide Labels or Hide Placeholders is enabled.
* Fix: Admin topbar CSS now loads correctly on the Help & Support page, and the topbar wraps correctly when many nav items are present.
* Fix: Elementor widget cleanup — removed duplicate/dead controls, fixed focus-state label colours not applying, made the Checkbox/Radio Size control work against the visible field, and converted the Terms checkbox radius to a per-corner control.
* Fix: A row can no longer be dropped below the Submit or Add Row buttons in the builder canvas.
* Fix: Removed a leading gap before left- and right-aligned field labels in both the builder and the front-end form.
* Fix: Removed a duplicate "Add Row" panel-header button and a stray file-input sample from the Style-tab live preview.
* Fix: The Star Rating "Number of Stars" control no longer loses keyboard focus after each spinner/arrow-key increment.

Compatibility:
* Update: Tested up to WordPress 7.0; minimum supported version is now WordPress 6.3.
* Update: The Gutenberg block was upgraded to Block API version 3 for the WordPress 6.3+ iframed editor, and its in-editor preview is now styled.

Developer:
* Dev: New `boldform_integration_dispatched` action fires after each integration dispatch with the integration type, connection ID, the API response (array or WP_Error), and the entry ID.
* Dev: Lifecycle cleanup — the integration-dispatch cron is cleared on deactivation, and stored connections plus migration flags are removed on opted-in uninstall.

= 1.0.2 =
* Improve: Rewrote the readme with the full feature list, integration documentation, and a "Pro coming soon" section.
* Improve: Minor admin and Elementor widget polish. Documentation and packaging maintenance release — no changes to form rendering or submission behaviour.

= 1.0.1 =
* Fix: Buttons now include an accessible `aria-label` so screen readers announce the button text correctly.
* Fix: Select fields now include `aria-label`, `aria-haspopup`, and `aria-controls` attributes for full WCAG compliance.
* Fix: Native select element is correctly hidden when the custom dropdown is active, eliminating the duplicate-box display bug.
* Fix: Version constant updated to match plugin header, resolving asset versioning and remote file loading issues.
* Add: Separate Button Margin control in Elementor targeting the button element directly.
* Add: Restored missing Elementor widget settings for Section Break and Terms & Conditions sections.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.1.3 =
Adds a Trash for entries (recoverable deletion with restore), Cloudflare Turnstile captcha (server-side verified), a tidier "Export Selected" dropdown, and new entry-detail extension hooks for add-ons. Recommended for all users.

= 1.1.2 =
Adds Entries bulk actions and selective CSV export, a reorganised Tools screen with standalone entry export, an Upgrade to Pro comparison page, Elementor styling additions, and fixes for settings and column widths resetting after save. Recommended for all users.

= 1.1.1 =
Fixes Conditional Logic rule saving, improves the Integrations connect-and-enable flow, makes the Forms and Entries tables mobile-friendly, and adds an unread-entries menu badge. Recommended for all users.

= 1.1.0 =
Security hardening, accessibility improvements, and GDPR export/erase support, plus the live style preview and Elementor refinements. Recommended for all users.
</content>
