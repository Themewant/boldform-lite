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

$boldform_lite_settings = get_option( 'boldform_lite_settings', array() );

if ( empty( $boldform_lite_settings['uninstall_data'] ) ) {
	return;
}

$boldform_lite_forms_table   = esc_sql( $wpdb->prefix . 'boldform_forms' );
$boldform_lite_entries_table = esc_sql( $wpdb->prefix . 'boldform_entries' );

delete_option( 'boldform_lite_db_version' );
delete_option( 'boldform_lite_settings' );

$wpdb->query( "DROP TABLE IF EXISTS `{$boldform_lite_forms_table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
$wpdb->query( "DROP TABLE IF EXISTS `{$boldform_lite_entries_table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
