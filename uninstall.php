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
	delete_option( 'boldform_lite_autoload_migrated' );
	delete_option( 'boldform_connections' ); // Integration connections (may hold API keys).
	delete_option( 'boldform_lite_ai_api_keys' ); // AI provider keys, one per provider.
	delete_option( 'boldform_lite_ai_provider' ); // Which AI provider is selected.
	delete_option( 'boldform_lite_ai_models' );   // Optional per-provider model overrides.

	/*
	 * The AI model catalogue is cached per provider, and generations are rate
	 * limited per user; both are transients keyed by a suffix, so they need a
	 * pattern sweep rather than named deletes. They expire on their own within
	 * twelve hours, but leaving rows behind after an uninstall is exactly the
	 * kind of residue this file exists to prevent.
	 */
	$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		"DELETE FROM `{$wpdb->options}`
		 WHERE option_name LIKE '\\_transient\\_boldform_ai\\_%'
			OR option_name LIKE '\\_transient\\_timeout\\_boldform_ai\\_%'"
	);

	// Clear any pending integration-dispatch cron events for this site.
	wp_clear_scheduled_hook( 'boldform_integration_dispatch' );

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
