<?php
/**
 * Uninstall routine for BoldForm Lite.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

/**
 * Removes BoldForm data for the current site, honoring that site's own opt-in flag.
 *
 * @return void
 */
$boldform_lite_uninstall_site = static function () use ( $wpdb ) {
	$settings = get_option( 'boldform_lite_settings', array() );

	if ( empty( $settings['uninstall_data'] ) ) {
		return;
	}

	// Resolve the table names against the *current* site prefix (it changes per blog).
	$forms_table   = esc_sql( $wpdb->prefix . 'boldform_forms' );
	$entries_table = esc_sql( $wpdb->prefix . 'boldform_entries' );

	delete_option( 'boldform_lite_db_version' );
	delete_option( 'boldform_lite_settings' );

	$wpdb->query( "DROP TABLE IF EXISTS `{$forms_table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
	$wpdb->query( "DROP TABLE IF EXISTS `{$entries_table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
};

if ( is_multisite() ) {
	// Network uninstall: clean every subsite (tables are created per-site on activation).
	$boldform_lite_site_ids = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);

	foreach ( $boldform_lite_site_ids as $boldform_lite_site_id ) {
		switch_to_blog( (int) $boldform_lite_site_id );
		$boldform_lite_uninstall_site();
		restore_current_blog();
	}
} else {
	$boldform_lite_uninstall_site();
}
