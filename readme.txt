=== BoldForm Lite ===
Contributors: boldform
Tags: forms, contact form, form builder, drag and drop, gutenberg
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight drag and drop form builder for WordPress with shortcode, Gutenberg, Elementor, and AJAX submissions.

== Description ==

BoldForm Lite is a lightweight WordPress form builder plugin. Create forms in the admin builder, render them with a shortcode, Gutenberg block, or Elementor widget, and collect submissions in the WordPress admin.

Features include:

* Drag and drop form builder
* Frontend shortcode rendering
* AJAX form submission
* Entries management page
* Gutenberg block
* Elementor widget
* Translation-ready strings

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/boldform-lite/` directory, or install the plugin through the WordPress plugins screen.
2. Activate the plugin through the `Plugins` screen in WordPress.
3. Open `BoldForm` in the WordPress admin to create your first form.

== Frequently Asked Questions ==

= How do I display a form? =

Use the shortcode `[boldform id="123"]`, the Gutenberg BoldForm block, or the Elementor BoldForm widget.

= Where can I see submissions? =

Open `BoldForm > Entries` in the WordPress admin.

== Screenshots ==

1. Form builder interface
2. Frontend form display
3. Entries management page

== External Services ==

This plugin can optionally connect to the following third-party services. No data is transmitted to any external service unless you have explicitly enabled and configured that service in the BoldForm settings.

= Google reCAPTCHA =

This plugin integrates with Google reCAPTCHA to protect forms from spam and bot submissions.

When a visitor loads a page containing a form with reCAPTCHA enabled, the reCAPTCHA JavaScript library is loaded directly from Google's servers. When the visitor submits the form, the plugin sends the reCAPTCHA response token and the visitor's IP address to Google's verification API to confirm the submission is not automated.

Data sent: reCAPTCHA response token, visitor IP address.
When: Each time a form with reCAPTCHA enabled is submitted.
Condition: Only when you have selected "Google reCAPTCHA" as the spam protection provider in BoldForm settings and entered a valid site key and secret key.

* Service provider: Google LLC
* Terms of Service: https://policies.google.com/terms
* Privacy Policy: https://policies.google.com/privacy

= hCaptcha =

This plugin integrates with hCaptcha to protect forms from spam and bot submissions.

When a visitor loads a page containing a form with hCaptcha enabled, the hCaptcha JavaScript library is loaded directly from hCaptcha's servers. When the visitor submits the form, the plugin sends the hCaptcha response token and the visitor's IP address to hCaptcha's verification API to confirm the submission is not automated.

Data sent: hCaptcha response token, visitor IP address.
When: Each time a form with hCaptcha enabled is submitted.
Condition: Only when you have selected "hCaptcha" as the spam protection provider in BoldForm settings and entered a valid site key and secret key.

* Service provider: Intuition Machines, Inc.
* Terms of Service: https://www.hcaptcha.com/terms
* Privacy Policy: https://www.hcaptcha.com/privacy

= Mailchimp =

This plugin can send subscriber data to Mailchimp when a form with a Mailchimp integration is submitted.

When a visitor submits a form that has a Mailchimp integration assigned, the plugin sends the subscriber's email address and any mapped name fields to the Mailchimp API to add or update the contact in the selected audience list.

Data sent: Email address, and optionally first name and last name (only fields you have mapped in the integration settings).
When: Each time a form with an active Mailchimp integration is submitted.
Condition: Only when you have configured a Mailchimp integration with a valid API key in BoldForm > Integrations.

* Service provider: The Rocket Science Group LLC (Mailchimp)
* Terms of Use: https://mailchimp.com/legal/terms/
* Privacy Policy: https://mailchimp.com/legal/privacy/

= Brevo (formerly Sendinblue) =

This plugin can send subscriber data to Brevo when a form with a Brevo integration is submitted.

When a visitor submits a form that has a Brevo integration assigned, the plugin sends the subscriber's email address and any mapped name fields to the Brevo API to add or update the contact in the selected list.

Data sent: Email address, and optionally first name and last name (only fields you have mapped in the integration settings).
When: Each time a form with an active Brevo integration is submitted.
Condition: Only when you have configured a Brevo integration with a valid API key in BoldForm > Integrations.

* Service provider: Brevo SAS
* Terms of Use: https://www.brevo.com/legal/termsofuse/
* Privacy Policy: https://www.brevo.com/legal/privacypolicy/

== Changelog ==

= 1.0.0 =

* Initial release.
