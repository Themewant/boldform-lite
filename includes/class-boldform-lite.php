<?php
/**
 * Core plugin class.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin bootstrap.
 */
final class BoldForm_Lite {

	/**
	 * Single class instance.
	 *
	 * @var BoldForm_Lite|null
	 */
	private static $instance = null;

	/**
	 * Loader instance.
	 *
	 * @var BoldForm_Lite_Loader
	 */
	private $loader;

	/**
	 * Admin instance.
	 *
	 * @var BoldForm_Lite_Admin
	 */
	private $admin;

	/**
	 * Frontend shortcode instance.
	 *
	 * @var BoldForm_Lite_Shortcode
	 */
	private $shortcode;

	/**
	 * Frontend submission handler.
	 *
	 * @var BoldForm_Lite_Form_Handler
	 */
	private $form_handler;

	/**
	 * Gutenberg block integration.
	 *
	 * @var BoldForm_Lite_Block
	 */
	private $block;

	/**
	 * Elementor integration.
	 *
	 * @var BoldForm_Lite_Elementor
	 */
	private $elementor;

	/**
	 * Email notification handler.
	 *
	 * @var BoldForm_Lite_Email_Handler
	 */
	private $email_handler;

	/**
	 * Export/Import handler.
	 *
	 * @var BoldForm_Lite_Export_Import
	 */
	private $export_import;

	/**
	 * Integrations page handler.
	 *
	 * @var BoldForm_Lite_Integrations_Page
	 */
	private $integrations_page;

	/**
	 * Integrations dispatcher.
	 *
	 * @var BoldForm_Lite_Integrations
	 */
	private $integrations;

	/**
	 * Privacy (GDPR) export/erase handler.
	 *
	 * @var BoldForm_Lite_Privacy
	 */
	private $privacy;

	/**
	 * Cache-compatibility (third-party cache purge) handler.
	 *
	 * @var BoldForm_Lite_Cache
	 */
	private $cache;

	/**
	 * Returns the single instance of the plugin.
	 *
	 * @return BoldForm_Lite
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Private constructor.
	 */
	private function __construct() {
		// Boot order matters here because several runtime services depend on the loader.
		$this->load_dependencies();
		$this->set_locale();
		$this->define_hooks();
	}

	/**
	 * Prevent clone.
	 */
	private function __clone() {}

	/**
	 * Prevent unserialize.
	 *
	 * @throws Exception Always throws because the plugin uses a singleton.
	 */
	public function __wakeup() {
		throw new \Exception( 'Cannot unserialize singleton.' );
	}

	/**
	 * Loads core dependencies.
	 *
	 * @return void
	 */
	private function load_dependencies() {
		require_once BOLDFORM_LITE_PATH . 'admin/class-boldform-lite-admin.php';
		require_once BOLDFORM_LITE_PATH . 'public/class-boldform-lite-shortcode.php';
		require_once BOLDFORM_LITE_PATH . 'public/class-boldform-lite-form-handler.php';
		require_once BOLDFORM_LITE_PATH . 'public/class-boldform-lite-block.php';
		require_once BOLDFORM_LITE_PATH . 'public/class-boldform-lite-elementor.php';
		require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-email-handler.php';
		require_once BOLDFORM_LITE_PATH . 'admin/class-boldform-lite-export-import.php';
		require_once BOLDFORM_LITE_PATH . 'admin/class-boldform-lite-integrations-page.php';
		require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-integrations.php';
		require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-privacy.php';
		require_once BOLDFORM_LITE_PATH . 'includes/class-boldform-lite-cache.php';

		$this->loader            = new BoldForm_Lite_Loader();
		$this->admin             = new BoldForm_Lite_Admin( $this );
		$this->email_handler     = new BoldForm_Lite_Email_Handler( $this );
		$this->form_handler      = new BoldForm_Lite_Form_Handler( $this, $this->email_handler );
		$this->shortcode         = new BoldForm_Lite_Shortcode( $this, $this->form_handler );
		$this->block             = new BoldForm_Lite_Block( $this );
		$this->elementor         = new BoldForm_Lite_Elementor( $this );
		$this->export_import     = new BoldForm_Lite_Export_Import( $this );
		$this->integrations_page = new BoldForm_Lite_Integrations_Page( $this );
		$this->integrations      = new BoldForm_Lite_Integrations( $this, $this->integrations_page );
		$this->privacy           = new BoldForm_Lite_Privacy( $this );
		$this->cache             = new BoldForm_Lite_Cache( $this );
	}

	/**
	 * Loads plugin text domain.
	 *
	 * @return void
	 */
	private function set_locale() {
		$this->loader->add_action( 'init', $this, 'load_textdomain' );
		// Run schema upgrades on admin_init, not plugins_loaded: the plugin boots ON
		// plugins_loaded, so a callback it registers for that same hook is not reliably
		// executed (the hook is already mid-flight). admin_init fires later — after this
		// registration — and is early enough that the schema is ready before the Entries
		// screen or its actions run. The entries tables are only read/written in admin.
		$this->loader->add_action( 'admin_init', $this, 'maybe_upgrade_database', 1 );
	}

	/**
	 * Defines the core hooks.
	 *
	 * @return void
	 */
	private function define_hooks() {
		$this->loader->add_action( 'admin_menu', $this->admin, 'register_menu' );
		$this->loader->add_filter( 'plugin_action_links_' . plugin_basename( BOLDFORM_LITE_FILE ), $this->admin, 'add_plugin_action_links' );
		// Hide every "Upgrade to Pro" CTA once Pro is active (menu item, plugin-row link,
		// topbar nav, header button) — they all honour this filter. Priority 5 so a
		// reseller's own callback can still override at the default priority if desired.
		$this->loader->add_filter( 'boldform_show_upgrade_cta', $this->admin, 'hide_upgrade_cta_when_pro_active', 5 );
		// Preview the premium Excel/PDF export beside the free Export CSV button.
		// The callback bails when the paid add-on is active (is_pro_active), so the
		// add-on's real buttons replace it and no teaser is shown to a paid user.
		$this->loader->add_action( 'boldform_entries_export_actions', $this->admin, 'render_entries_export_teaser' );
		// Same idea on the Tools → Entries export panel: a locked format selector
		// (Excel/PDF) that opens the upgrade modal. Bails when the paid add-on is
		// active, which injects its own real format field on this action.
		$this->loader->add_action( 'boldform_tools_entries_export_fields', $this->admin, 'render_tools_export_teaser' );
		$this->loader->add_action( 'boldform_entry_created', $this->admin, 'clear_unread_count_cache' );
		$this->loader->add_action( 'admin_head', $this->admin, 'print_menu_icon_styles' );
		$this->loader->add_filter( 'admin_body_class', $this->admin, 'add_admin_body_class' );
		$this->loader->add_action( 'admin_bar_menu', $this->admin, 'register_admin_bar', 100 );
		$this->loader->add_action( 'admin_enqueue_scripts', $this->admin, 'enqueue_assets' );
		$this->loader->add_action( 'admin_init', $this->admin, 'handle_form_actions' );
		$this->loader->add_action( 'admin_enqueue_scripts', $this->admin, 'enqueue_admin_notice_assets' );
		$this->loader->add_action( 'admin_notices', $this->admin, 'maybe_render_pro_notice' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_dismiss_notice', $this->admin, 'ajax_dismiss_notice' );
		$this->loader->add_filter( 'upload_mimes', $this->admin, 'allow_svg_upload' );
		$this->loader->add_filter( 'wp_check_filetype_and_ext', $this->admin, 'fix_svg_filetype', 10, 4 );
		$this->loader->add_filter( 'wp_handle_upload_prefilter', $this->admin, 'sanitize_svg_upload' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_save_form', $this->admin, 'ajax_save_form' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_send_test_mail', $this->admin, 'ajax_send_test_mail' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_update_entry_status', $this->admin, 'ajax_update_entry_status' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_bulk_entry_action', $this->admin, 'ajax_bulk_entry_action' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_toggle_form_status', $this->admin, 'ajax_toggle_form_status' );
		$this->loader->add_action( 'phpmailer_init', $this->admin, 'configure_smtp' );
		$this->loader->add_filter( 'wp_mail_from',      $this->admin, 'filter_mail_from' );
		$this->loader->add_filter( 'wp_mail_from_name', $this->admin, 'filter_mail_from_name' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this->shortcode, 'register_assets' );
		$this->loader->add_action( 'init', $this->shortcode, 'register_shortcode' );
		$this->loader->add_action( 'init', $this->form_handler, 'handle_submission' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_submit_form', $this->form_handler, 'ajax_submit_form' );
		$this->loader->add_action( 'wp_ajax_nopriv_boldform_lite_submit_form', $this->form_handler, 'ajax_submit_form' );
		$this->loader->add_action( 'init', $this->block, 'register_block' );
		$this->loader->add_action( 'enqueue_block_editor_assets', $this->block, 'enqueue_editor_assets' );
		$this->loader->add_action( 'elementor/widgets/register', $this->elementor, 'register_widget' );
		$this->loader->add_action( 'elementor/editor/after_enqueue_scripts', $this->elementor, 'enqueue_editor_scripts' );
		$this->loader->add_filter( 'wp_privacy_personal_data_exporters', $this->privacy, 'register_exporter' );
		$this->loader->add_filter( 'wp_privacy_personal_data_erasers', $this->privacy, 'register_eraser' );
		$this->loader->add_action( 'boldform_form_saved', $this->cache, 'purge_on_form_saved', 10, 3 );

		$this->export_import->init();
		$this->integrations_page->init();
		$this->integrations->init();

		$this->loader->run();

		/**
		 * Fires after BoldForm Lite has fully booted and all hooks are registered.
		 *
		 * Pro or third-party plugins should hook here to extend BoldForm.
		 *
		 * @param BoldForm_Lite $plugin The main plugin instance.
		 */
		do_action( 'boldform_loaded', $this );
	}

	/**
	 * Returns the forms table name.
	 *
	 * @return string
	 */
	public function get_forms_table_name() {
		global $wpdb;

		return $wpdb->prefix . 'boldform_forms';
	}

	/**
	 * Returns the entries table name.
	 *
	 * @return string
	 */
	public function get_entries_table_name() {
		global $wpdb;

		return $wpdb->prefix . 'boldform_entries';
	}

	/**
	 * Flattens a stored entry field value into a human-readable display string.
	 *
	 * Multi-part values are stored as arrays: composite fields as associative
	 * arrays (name => {first,middle,last}; address => {street,city,…}) and
	 * checkbox/multiselect as indexed arrays of selected options. Empty parts
	 * (e.g. a blank middle name) are dropped so a name reads "First Last" rather
	 * than "First, , Last". Names join with a space; every other multi-part value
	 * joins with ", ". Scalars pass through unchanged.
	 *
	 * This is the single source of truth for value flattening shared by the admin
	 * entry view, CSV export, email notifications, the privacy exporter, and the
	 * entries-list preview, so their formatting can never drift apart.
	 *
	 * @param mixed  $value Stored field value (string, indexed array, or assoc array).
	 * @param string $type  Field type (only 'name' changes the separator).
	 * @return string
	 */
	public static function format_field_value( $value, $type = '' ) {
		if ( ! is_array( $value ) ) {
			$formatted = is_scalar( $value ) ? (string) $value : '';
		} else {
			$parts = array_filter(
				array_map(
					static function ( $part ) {
						return is_scalar( $part ) ? sanitize_text_field( (string) $part ) : '';
					},
					$value
				),
				static function ( $part ) {
					return '' !== trim( (string) $part );
				}
			);

			$formatted = implode( 'name' === $type ? ' ' : ', ', $parts );
		}

		/**
		 * Filters the human-readable display string for a stored entry value.
		 *
		 * Add-ons (e.g. BoldForm Pro) use this to render complex value shapes the
		 * default flattener cannot express — signature data URIs, repeater row
		 * sets, geolocation coordinate arrays, image-choice selections. Filtered
		 * values should be PLAIN TEXT: this helper feeds the admin entry view, CSV
		 * export, email notifications and the privacy exporter, each of which
		 * escapes on output, so returning markup here would break CSV/plain-text
		 * surfaces.
		 *
		 * @since 1.1.0
		 *
		 * @param string $formatted Default flattened display string.
		 * @param mixed  $value     Raw stored field value (string or array).
		 * @param string $type      Field type slug.
		 */
		return apply_filters( 'boldform_format_field_value', $formatted, $value, $type );
	}

	/**
	 * Placeholder for the translations hook.
	 *
	 * WordPress automatically loads plugin translations since 4.6
	 * for plugins hosted on WordPress.org. No manual call needed.
	 *
	 * @return void
	 */
	public function load_textdomain() {
	}

	/**
	 * Runs database upgrades when the stored schema version is outdated.
	 *
	 * @return void
	 */
	public function maybe_upgrade_database() {
		$installed_version = (string) get_option( 'boldform_lite_db_version', '' );

		if ( BOLDFORM_LITE_DB_VERSION === $installed_version ) {
			return;
		}

		BoldForm_Lite_Activator::activate();
	}

	/**
	 * Returns the loader instance.
	 *
	 * @return BoldForm_Lite_Loader
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Returns the export/import handler.
	 *
	 * @return BoldForm_Lite_Export_Import
	 */
	public function get_export_import() {
		return $this->export_import;
	}

	/**
	 * Returns the admin handler.
	 *
	 * @return BoldForm_Lite_Admin
	 */
	public function get_admin() {
		return $this->admin;
	}

	/**
	 * Returns the form-submission handler.
	 *
	 * Exposed so an extension can persist an entry itself when it defers the
	 * default save via the `boldform_should_save_entry` filter.
	 *
	 * @return BoldForm_Lite_Form_Handler
	 */
	public function get_form_handler() {
		return $this->form_handler;
	}

	/**
	 * Returns the email notifications handler.
	 *
	 * Exposed so an extension can dispatch the standard notification emails itself
	 * after it has deferred them via the `boldform_defer_post_save_actions` filter.
	 *
	 * @return BoldForm_Lite_Email_Handler
	 */
	public function get_email_handler() {
		return $this->email_handler;
	}
}
