<?php
/**
 * Plugin Name:       BoldForm Lite – Drag & Drop Form Builder
 * Description:       Lightweight drag and drop form builder for WordPress.
 * Version:           1.0.2
 * Requires at least: 6.0
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

define( 'BOLDFORM_LITE_VERSION', '1.0.2' );
define( 'BOLDFORM_LITE_DB_VERSION', '1.0.0' );
define( 'BOLDFORM_LITE_FILE', __FILE__ );
define( 'BOLDFORM_LITE_PATH', plugin_dir_path( __FILE__ ) );
define( 'BOLDFORM_LITE_URL', plugin_dir_url( __FILE__ ) );

require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-activator.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-loader.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite.php';

register_activation_hook( BOLDFORM_LITE_FILE, array( 'BoldForm_Lite_Activator', 'activate' ) );

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
