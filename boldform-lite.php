<?php
/**
 * Plugin Name:       BoldForm Lite
 * Plugin URI:        https://themewant.com/
 * Description:       Lightweight drag and drop form builder for WordPress.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Tested up to:      6.9
 * Requires PHP:      7.4
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

require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-activator.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-loader.php';
require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite.php';

register_activation_hook( BOLDFORM_LITE_FILE, array( 'BoldForm_Lite_Activator', 'activate' ) );

/**
 * Starts the plugin.
 *
 * @return BoldForm_Lite
 */
function boldform_lite() {
	return BoldForm_Lite::get_instance();
}

boldform_lite();
