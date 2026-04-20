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
	}

	/**
	 * Loads plugin text domain.
	 *
	 * @return void
	 */
	private function set_locale() {
		$this->loader->add_action( 'init', $this, 'load_textdomain' );
		$this->loader->add_action( 'plugins_loaded', $this, 'maybe_upgrade_database' );
	}

	/**
	 * Defines the core hooks.
	 *
	 * @return void
	 */
	private function define_hooks() {
		$this->loader->add_action( 'admin_menu', $this->admin, 'register_menu' );
		$this->loader->add_action( 'admin_bar_menu', $this->admin, 'register_admin_bar', 100 );
		$this->loader->add_action( 'admin_enqueue_scripts', $this->admin, 'enqueue_assets' );
		$this->loader->add_action( 'admin_init', $this->admin, 'handle_form_actions' );
		$this->loader->add_filter( 'upload_mimes', $this->admin, 'allow_svg_upload' );
		$this->loader->add_filter( 'wp_check_filetype_and_ext', $this->admin, 'fix_svg_filetype', 10, 4 );
		$this->loader->add_action( 'wp_ajax_boldform_lite_save_form', $this->admin, 'ajax_save_form' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_send_test_mail', $this->admin, 'ajax_send_test_mail' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_update_entry_status', $this->admin, 'ajax_update_entry_status' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_toggle_form_status', $this->admin, 'ajax_toggle_form_status' );
		$this->loader->add_action( 'phpmailer_init', $this->admin, 'configure_smtp' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this->shortcode, 'register_assets' );
		$this->loader->add_action( 'init', $this->shortcode, 'register_shortcode' );
		$this->loader->add_action( 'init', $this->form_handler, 'handle_submission' );
		$this->loader->add_action( 'wp_ajax_boldform_lite_submit_form', $this->form_handler, 'ajax_submit_form' );
		$this->loader->add_action( 'wp_ajax_nopriv_boldform_lite_submit_form', $this->form_handler, 'ajax_submit_form' );
		$this->loader->add_action( 'init', $this->block, 'register_block' );
		$this->loader->add_action( 'enqueue_block_editor_assets', $this->block, 'enqueue_editor_assets' );
		$this->loader->add_action( 'elementor/widgets/register', $this->elementor, 'register_widget' );
		$this->loader->add_action( 'elementor/editor/after_enqueue_scripts', $this->elementor, 'enqueue_editor_scripts' );

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
}
