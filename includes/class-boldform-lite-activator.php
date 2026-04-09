<?php
/**
 * Runs plugin activation tasks.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin activator.
 */
class BoldForm_Lite_Activator {

	/**
	 * Runs on plugin activation.
	 *
	 * @return void
	 */
	public static function activate() {
		self::create_tables();
		update_option( 'boldform_lite_db_version', BOLDFORM_LITE_DB_VERSION );
	}

	/**
	 * Creates the plugin database tables.
	 *
	 * @return void
	 */
	private static function create_tables() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();
		$forms_table     = $wpdb->prefix . 'boldform_forms';
		$entries_table   = $wpdb->prefix . 'boldform_entries';

		$forms_sql = "CREATE TABLE {$forms_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			title varchar(191) NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'draft',
			fields_json longtext NOT NULL,
			settings_json longtext NULL,
			created_by bigint(20) unsigned NOT NULL DEFAULT 0,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY status (status),
			KEY created_by (created_by)
		) {$charset_collate};";

		$entries_sql = "CREATE TABLE {$entries_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			form_id bigint(20) unsigned NOT NULL,
			entry_data_json longtext NOT NULL,
			submission_key varchar(64) NULL,
			user_id bigint(20) unsigned NOT NULL DEFAULT 0,
			user_ip varchar(100) NULL,
			user_agent text NULL,
			status varchar(20) NOT NULL DEFAULT 'unread',
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY form_id (form_id),
			KEY status (status),
			KEY created_at (created_at),
			KEY submission_key (submission_key)
		) {$charset_collate};";

		dbDelta( $forms_sql );
		dbDelta( $entries_sql );
	}
}
