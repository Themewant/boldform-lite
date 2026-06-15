<?php
/**
 * Plugin Name:       BoldForm Lite
 * Description:       Lightweight drag and drop form builder for WordPress.
 * Version:           1.1.0
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

define( 'BOLDFORM_LITE_VERSION', '1.1.0' );
define( 'BOLDFORM_LITE_DB_VERSION', '1.0.0' );
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
 * topbars, builder, stat cards, empty states, etc.). The mark depicts a form with
 * an edit corner, so it doubles as the "forms" glyph. The fill defaults to
 * currentColor so the icon adapts to whatever colour its surrounding context sets
 * (a topbar accent, a white badge, the muted admin-menu icon colour, and so on).
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

	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"' . $size_attr . $class_attr . ' fill="' . esc_attr( $args['fill'] ) . '" aria-hidden="true" focusable="false">'
		. '<path d="M29.3883 19.3725C30.2053 20.1895 30.2053 21.5135 29.3883 22.3305L22.3253 29.3935C22.2153 29.5035 22.0753 29.5755 21.9223 29.6015L19.6323 29.9885C19.1263 30.0735 18.6873 29.6345 18.7723 29.1285L19.1593 26.8385C19.1853 26.6855 19.2583 26.5445 19.3673 26.4355L26.4303 19.3725C27.2473 18.5555 28.5713 18.5555 29.3883 19.3725Z"/>'
		. '<path d="M7.12 8.529C7.897 8.529 8.529 7.901 8.529 7.13V2H8.47C7.52 2 6.61 2.38 5.94 3.05L3.05 5.94C2.38 6.61 2 7.52 2 8.47V8.529H7.12Z"/>'
		. '<path d="M23.33 2H10.33V7.13C10.33 8.895 8.89 10.33 7.12 10.33H2V26.29C2 28.34 3.66 30 5.71 30H17.08C16.965 29.625 16.93 29.226 16.997 28.828L17.384 26.54C17.47 26.019 17.716 25.542 18.094 25.164L25.157 18.101C25.682 17.576 26.334 17.228 27.041 17.067V5.71C27.04 3.66 25.38 2 23.33 2ZM16.74 23.311H8.01C7.513 23.311 7.11 22.908 7.11 22.411C7.11 21.914 7.513 21.511 8.01 21.511H16.74C17.237 21.511 17.64 21.914 17.64 22.411C17.64 22.908 17.237 23.311 16.74 23.311ZM20.038 16.9H8.002C7.505 16.9 7.102 16.497 7.102 16C7.102 15.503 7.505 15.1 8.002 15.1H20.038C20.535 15.1 20.938 15.503 20.938 16C20.938 16.497 20.535 16.9 20.038 16.9Z"/>'
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
		$sdk = BOLDFORM_LITE_PATH . 'appsero/src/Client.php';

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