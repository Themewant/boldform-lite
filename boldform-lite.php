<?php
/**
 * Plugin Name:       BoldForm Lite
 * Description:       Lightweight drag and drop form builder for WordPress.
 * Version:           1.1.3
 * Requires at least: 6.3
 * Tested up to:      7.0
 * Requires PHP:      7.4
 * Author:      Themewant
 * Author URI:  http://themewant.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       boldform-lite
 * Domain Path:       /languages
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BOLDFORM_LITE_VERSION', '1.1.3' );
define( 'BOLDFORM_LITE_DB_VERSION', '1.1.3' );
define( 'BOLDFORM_LITE_FILE', __FILE__ );
define( 'BOLDFORM_LITE_PATH', plugin_dir_path( __FILE__ ) );
define( 'BOLDFORM_LITE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Appsero project hash for opt-in usage telemetry.
 *
 * This is the public application identifier for the plugin's Appsero project — it
 * is not a secret. Telemetry is still strictly opt-in: Appsero's Insights module
 * collects nothing until the site administrator consents via the admin notice it
 * displays, and a site can disable it entirely by defining this constant as an
 * empty string in wp-config.php (or via the 'boldform_lite_appsero_hash' filter).
 */
if ( ! defined( 'BOLDFORM_LITE_APPSERO_HASH' ) ) {
	define( 'BOLDFORM_LITE_APPSERO_HASH', '34841725-f5f2-4b3a-ade1-864bcbd22b07' );
}

require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-activator.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-loader.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite.php';

register_activation_hook( BOLDFORM_LITE_FILE, array( 'BoldForm_Lite_Activator', 'activate' ) );

/**
 * Clears plugin-scheduled cron events on deactivation so no orphaned events
 * linger. User data (tables/options) is preserved — only removed on uninstall
 * when the user has opted in.
 *
 * @return void
 */
function boldform_lite_deactivate() {
	wp_clear_scheduled_hook( 'boldform_integration_dispatch' );
}
register_deactivation_hook( BOLDFORM_LITE_FILE, 'boldform_lite_deactivate' );

/**
 * One-time migration: stop autoloading the settings option on existing installs.
 *
 * The option holds secrets (SMTP password, captcha secret keys); new saves already
 * pass autoload=false, this flips it for installs created before that change. Runs
 * once in the admin, then a flag short-circuits it.
 *
 * @return void
 */
function boldform_lite_migrate_settings_autoload() {
	if ( ! is_admin() || get_option( 'boldform_lite_autoload_migrated' ) ) {
		return;
	}

	// Re-add the option with autoload disabled. delete + add keeps this compatible
	// with the plugin's minimum WordPress 6.3 (wp_set_option_autoload() only exists
	// on 6.4+) while producing an identical end state.
	$settings = get_option( 'boldform_lite_settings', null );
	if ( null !== $settings ) {
		delete_option( 'boldform_lite_settings' );
		add_option( 'boldform_lite_settings', $settings, '', 'no' );
	}

	update_option( 'boldform_lite_autoload_migrated', 1 );
}
add_action( 'admin_init', 'boldform_lite_migrate_settings_autoload' );

// Multisite: create tables for each new subsite when the plugin is network-active.
add_action( 'wp_initialize_site', array( 'BoldForm_Lite_Activator', 'on_new_site' ) ); // WP 5.1+
add_action( 'wpmu_new_blog',      array( 'BoldForm_Lite_Activator', 'on_new_site' ) ); // legacy fallback

/**
 * Starts the plugin.
 *
 * @return BoldForm_Lite
 */
function boldform_lite() {
	return BoldForm_Lite::get_instance();
}

add_action( 'plugins_loaded', 'boldform_lite' );

/**
 * Safety net for multisite: if the current site's tables don't exist yet
 * (e.g. plugin was network-activated after the subsite was created), create
 * them now rather than waiting for a manual re-activation.
 */
function boldform_lite_maybe_create_tables() {
	if ( ! is_multisite() ) {
		return;
	}

	// Only act as a first-run safety net for a subsite that was never initialized
	// (db-version option absent). Schema upgrades on an already-initialized site are
	// handled by BoldForm_Lite::maybe_upgrade_database(), so this never runs dbDelta
	// on every page load just because the stored version differs from the constant.
	if ( false !== get_option( 'boldform_lite_db_version', false ) ) {
		return;
	}

	BoldForm_Lite_Activator::create_tables();
	update_option( 'boldform_lite_db_version', BOLDFORM_LITE_DB_VERSION );
}
add_action( 'plugins_loaded', 'boldform_lite_maybe_create_tables' );

/**
 * Returns the BoldForm brand mark as inline SVG markup.
 *
 * Single source of truth for the logo across the whole admin UI (menu icon,
 * topbars, builder, stat cards, empty states, etc.). The mark is the BoldForm "B"
 * monogram with three form lines knocked out of it (a single evenodd path, so the
 * lines read as holes in any single colour). The fill defaults to currentColor so
 * the icon adapts to whatever colour its surrounding context sets (a topbar accent,
 * a white badge, the muted admin-menu icon colour, and so on).
 *
 * The artwork is portrait (a 59×74 viewBox). Callers that pass a `size` get a square
 * box, within which the mark is centred (never distorted); pass size 0 to let CSS
 * size it to the natural aspect ratio.
 *
 * @param array<string, mixed> $args {
 *     Optional. Display arguments.
 *
 *     @type string $class Class attribute for the <svg>. Empty string omits it. Default 'boldform-brand-icon'.
 *     @type int    $size  Width/height in px. 0 omits both attributes so CSS sizes it. Default 0.
 *     @type string $fill  Fill colour. Default 'currentColor'.
 * }
 * @return string SVG markup.
 */
function boldform_lite_get_brand_icon( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'class' => 'boldform-brand-icon',
			'size'  => 0,
			'fill'  => 'currentColor',
		)
	);

	$size_attr  = $args['size'] ? sprintf( ' width="%1$d" height="%1$d"', absint( $args['size'] ) ) : '';
	$class_attr = '' !== $args['class'] ? sprintf( ' class="%s"', esc_attr( $args['class'] ) ) : '';

	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 74"' . $size_attr . $class_attr . ' fill="' . esc_attr( $args['fill'] ) . '" aria-hidden="true" focusable="false">'
		. '<path fill-rule="evenodd" clip-rule="evenodd" d="M48.5399 38.6667L5.39262 73.3386C5.39262 73.3386 34.3209 73.3386 41.6055 73.3386C48.8901 73.3386 57.9958 66.1241 57.9958 54.6368C57.9958 43.1496 48.5399 38.6667 48.5399 38.6667Z M57.8215 12.853C54.3543 1.19072 43.1472 0 43.1472 0H0V72.846L45.844 36.4229C45.844 36.4229 61.2888 24.5155 57.8215 12.853Z M10.7656 16.1492C10.7656 14.6627 11.9706 13.4576 13.4571 13.4576H43.0639C43.0639 14.9441 41.8589 16.1492 40.3724 16.1492H10.7656Z M10.7656 24.2237C10.7656 22.7372 11.9706 21.5322 13.4571 21.5322H43.0639C43.0639 23.0187 41.8589 24.2237 40.3724 24.2237H10.7656Z M16.1486 32.2983C16.1486 30.8118 17.3537 29.6068 18.8402 29.6068H37.6809C37.6809 31.0933 36.4758 32.2983 34.9893 32.2983H16.1486Z"/>'
		. '</svg>';
}

/**
 * Echoes the BoldForm brand mark.
 *
 * @see boldform_lite_get_brand_icon()
 *
 * @param array<string, mixed> $args Optional. See boldform_lite_get_brand_icon().
 * @return void
 */
function boldform_lite_brand_icon( $args = array() ) {
	echo boldform_lite_get_brand_icon( $args ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG markup; all dynamic attributes escaped in the getter.
}

/**
 * Boots the Appsero client for opt-in usage telemetry.
 *
 * Appsero's Insights module is strictly opt-in: it gathers nothing until the site
 * administrator agrees via the admin notice it displays. The client is only created
 * when a project hash is configured (constant or filter), so telemetry stays
 * completely dormant otherwise. Runs at plugin-file load so Appsero can register its
 * own activation/deactivation tracking hooks.
 *
 * @return void
 */
function boldform_lite_appsero() {
	/**
	 * Filters the Appsero project hash used for opt-in telemetry.
	 *
	 * @param string $hash The Appsero application hash. Empty disables the client.
	 */
	$hash = apply_filters( 'boldform_lite_appsero_hash', BOLDFORM_LITE_APPSERO_HASH );

	if ( empty( $hash ) ) {
		return;
	}

	if ( ! class_exists( 'Appsero\Client' ) ) {
		$sdk = BOLDFORM_LITE_PATH . 'includes/appsero/Client.php';

		if ( ! is_readable( $sdk ) ) {
			return;
		}

		require_once $sdk;
	}

	$client = new Appsero\Client( $hash, 'BoldForm – Drag &amp; Drop Form Builder', BOLDFORM_LITE_FILE );

	// Opt-in usage telemetry only — Appsero shows the consent notice and collects
	// nothing until the administrator allows it.
	$client->insights()->init();
}

boldform_lite_appsero();