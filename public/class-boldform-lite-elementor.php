<?php
/**
 * Elementor integration bootstrap.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers BoldForm Elementor widgets.
 */
class BoldForm_Lite_Elementor {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite $plugin Main plugin instance.
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Registers the BoldForm Elementor widget.
	 *
	 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager.
	 * @return void
	 */
	public function register_widget( $widgets_manager ) {
		if ( ! did_action( 'elementor/loaded' ) ) {
			return;
		}

		require_once BOLDFORM_LITE_PATH . 'public/class-boldform-lite-elementor-widget.php';

		$widgets_manager->register( new BoldForm_Lite_Elementor_Widget( array(), null, $this->plugin ) );
	}

	/**
	 * Enqueues JS for the Elementor editor panel (not the preview iframe).
	 *
	 * @return void
	 */
	public function enqueue_editor_scripts() {
		wp_enqueue_script(
			'boldform-elementor-editor',
			BOLDFORM_LITE_URL . 'assets/js/elementor-editor.js',
			array( 'jquery' ),
			BOLDFORM_LITE_VERSION,
			true
		);

		wp_localize_script(
			'boldform-elementor-editor',
			'boldformElementorEditor',
			array(
				'builderBase' => admin_url( 'admin.php?page=boldform-lite-builder&form_id=' ),
			)
		);
	}
}
