<?php
/**
 * Gutenberg block integration.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and renders the BoldForm block.
 */
class BoldForm_Lite_Block {

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
	 * Registers the block and editor script.
	 *
	 * @return void
	 */
	public function register_block() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		wp_register_script(
			'boldform-lite-block-editor',
			BOLDFORM_LITE_URL . 'assets/js/block-form.js',
			array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n', 'wp-server-side-render' ),
			BOLDFORM_LITE_VERSION,
			true
		);

		if ( $this->has_script_translation_files() ) {
			wp_set_script_translations( 'boldform-lite-block-editor', 'boldform-lite', BOLDFORM_LITE_PATH . 'languages' );
		}

		// Register the block explicitly to avoid metadata path resolution passing
		// unexpected null values into WordPress core on some environments.
		$block_attributes = array(
			'formId'              => array( 'type' => 'number', 'default' => 0 ),
			'hideLabels'          => array( 'type' => 'boolean', 'default' => false ),
			'hidePlaceholders'    => array( 'type' => 'boolean', 'default' => false ),
			'formMaxWidth'        => array( 'type' => 'string', 'default' => '' ),
			'formPadding'         => array( 'type' => 'string', 'default' => '' ),
			'formBgColor'         => array( 'type' => 'string', 'default' => '' ),
			'formBorderRadius'    => array( 'type' => 'string', 'default' => '' ),
			'formBorderWidth'     => array( 'type' => 'string', 'default' => '' ),
			'formBorderColor'     => array( 'type' => 'string', 'default' => '' ),
			'rowGap'              => array( 'type' => 'string', 'default' => '' ),
			'columnGap'           => array( 'type' => 'string', 'default' => '' ),
			'fieldGap'            => array( 'type' => 'string', 'default' => '' ),
			'labelColor'          => array( 'type' => 'string', 'default' => '' ),
			'labelFontSize'       => array( 'type' => 'string', 'default' => '' ),
			'fieldHeight'         => array( 'type' => 'string', 'default' => '' ),
			'textareaHeight'      => array( 'type' => 'string', 'default' => '' ),
			'fieldPadding'        => array( 'type' => 'string', 'default' => '' ),
			'fieldBgColor'        => array( 'type' => 'string', 'default' => '' ),
			'fieldTextColor'      => array( 'type' => 'string', 'default' => '' ),
			'fieldBorderWidth'    => array( 'type' => 'string', 'default' => '' ),
			'fieldBorderColor'    => array( 'type' => 'string', 'default' => '' ),
			'fieldBorderRadius'   => array( 'type' => 'string', 'default' => '' ),
			'fieldFocusColor'     => array( 'type' => 'string', 'default' => '' ),
			'fieldFocusBgColor'   => array( 'type' => 'string', 'default' => '' ),
			'buttonPadding'       => array( 'type' => 'string', 'default' => '' ),
			'buttonBgColor'       => array( 'type' => 'string', 'default' => '' ),
			'buttonTextColor'     => array( 'type' => 'string', 'default' => '' ),
			'buttonHoverBgColor'  => array( 'type' => 'string', 'default' => '' ),
			'buttonBorderRadius'  => array( 'type' => 'string', 'default' => '' ),
			'buttonFontSize'      => array( 'type' => 'string', 'default' => '' ),
			'buttonFullWidth'     => array( 'type' => 'boolean', 'default' => false ),
			'errorColor'               => array( 'type' => 'string', 'default' => '' ),
			'requiredIndicatorColor'   => array( 'type' => 'string', 'default' => '' ),
		);

		/**
		 * Filter the Gutenberg block attributes for the BoldForm block.
		 *
		 * Pro can add attributes for multi-step styling, payment fields, etc.
		 *
		 * @param array<string, array<string, mixed>> $block_attributes Block attribute definitions.
		 */
		$block_attributes = apply_filters( 'boldform_block_attributes', $block_attributes );

		register_block_type(
			'boldform/form',
			array(
				'api_version'     => 2,
				'editor_script'   => 'boldform-lite-block-editor',
				'render_callback' => array( $this, 'render_block' ),
				'attributes'      => $block_attributes,
				'supports'        => array(
					'html' => false,
				),
			)
		);
	}

	/**
	 * Enqueues editor data for the block dropdown.
	 *
	 * @return void
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_style(
			'boldform-lite-frontend',
			BOLDFORM_LITE_URL . 'assets/css/frontend.css',
			array(),
			BOLDFORM_LITE_VERSION
		);

		$block_data = array(
			'forms'        => $this->get_form_options(),
			'placeholder'  => __( 'Select a form', 'boldform-lite' ),
			'emptyMessage' => __( 'No published forms found.', 'boldform-lite' ),
			'previewText'  => __( 'Selected form will render on the frontend.', 'boldform-lite' ),
			'builderUrl'   => admin_url( 'admin.php?page=boldform-lite-builder&form_id=' ),
		);

		/**
		 * Filter the data passed to the Gutenberg block editor JS.
		 *
		 * Pro can add panel configs, multi-step options, etc.
		 *
		 * @param array<string, mixed> $block_data Editor data for boldformLiteBlock.
		 */
		$block_data = apply_filters( 'boldform_block_editor_data', $block_data );

		wp_localize_script( 'boldform-lite-block-editor', 'boldformLiteBlock', $block_data );

		/**
		 * Fires after BoldForm block editor assets are enqueued.
		 *
		 * Pro can enqueue additional editor scripts for multi-step controls.
		 */
		do_action( 'boldform_block_editor_enqueue' );
	}

	/**
	 * Renders the dynamic block on the frontend.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string
	 */
	public function render_block( $attributes ) {
		$form_id = isset( $attributes['formId'] ) ? absint( $attributes['formId'] ) : 0;

		if ( ! $form_id ) {
			return '';
		}

		$html  = do_shortcode( sprintf( '[boldform id="%d"]', $form_id ) );
		$style = $this->build_block_inline_style( $attributes );

		// Build CSS classes for display overrides.
		$classes = array( 'boldform-block-wrap' );
		if ( ! empty( $attributes['hideLabels'] ) ) {
			$classes[] = 'boldform-hide-labels';
		}
		if ( ! empty( $attributes['hidePlaceholders'] ) ) {
			$classes[] = 'boldform-hide-ph-yes';
		}

		$needs_wrap = $style || count( $classes ) > 1;

		if ( $needs_wrap ) {
			// $html is the fully pre-escaped output of render_shortcode() via do_shortcode().
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			return '<div class="' . esc_attr( implode( ' ', $classes ) ) . '"' . ( $style ? ' style="' . esc_attr( $style ) . '"' : '' ) . '>' . $html . '</div>';
		}

		// $html is the fully pre-escaped output of render_shortcode() via do_shortcode().
		return $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Builds inline CSS custom properties from block attributes.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string
	 */
	private function build_block_inline_style( $attributes ) {
		$map = array(
			'formMaxWidth'      => '--bfb-form-max-width',
			'formPadding'       => '--bfb-form-padding',
			'formBgColor'       => '--bfb-form-bg',
			'formBorderRadius'  => '--bfb-form-radius',
			'formBorderWidth'   => '--bfb-form-border-width',
			'formBorderColor'   => '--bfb-form-border-color',
			'rowGap'            => '--bfb-row-gap',
			'columnGap'         => '--bfb-col-gap',
			'fieldGap'          => '--bfb-field-gap',
			'labelColor'        => '--bfb-label-color',
			'labelFontSize'     => '--bfb-label-font-size',
			'fieldHeight'       => '--bfb-field-height',
			'textareaHeight'    => '--bfb-textarea-height',
			'fieldPadding'      => '--bfb-field-padding',
			'fieldBgColor'      => '--bfb-field-bg',
			'fieldTextColor'    => '--bfb-field-text',
			'fieldBorderWidth'  => '--bfb-field-border-width',
			'fieldBorderColor'  => '--bfb-field-border-color',
			'fieldBorderRadius' => '--bfb-field-radius',
			'fieldFocusColor'   => '--bfb-focus-color',
			'fieldFocusBgColor' => '--bfb-focus-bg',
			'buttonPadding'     => '--bfb-btn-padding',
			'buttonBgColor'     => '--bfb-btn-bg',
			'buttonTextColor'   => '--bfb-btn-text',
			'buttonHoverBgColor'=> '--bfb-btn-hover-bg',
			'buttonBorderRadius'=> '--bfb-btn-radius',
			'buttonFontSize'    => '--bfb-btn-font-size',
			'errorColor'             => '--bfb-error-color',
			'requiredIndicatorColor' => '--bfb-required-color',
		);

		$vars = array();

		foreach ( $map as $attr => $var ) {
			if ( ! empty( $attributes[ $attr ] ) ) {
				$vars[] = $var . ':' . sanitize_text_field( (string) $attributes[ $attr ] );
			}
		}

		if ( ! empty( $attributes['buttonFullWidth'] ) ) {
			$vars[] = '--bfb-btn-width:100%';
		}

		return implode( ';', $vars );
	}

	/**
	 * Returns published forms for the block dropdown.
	 *
	 * @return array<int, array<string, string|int>>
	 */
	private function get_form_options() {
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();
		$cache_key  = 'boldform_lite_block_form_options';
		$forms      = wp_cache_get( $cache_key, 'boldform_lite' );
		$options    = array();
		$safe_table = esc_sql( $table_name );

		if ( false === $forms ) {
			$forms = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$wpdb->prepare(
					"SELECT id, title FROM `{$safe_table}` WHERE status = %s ORDER BY title ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					'publish'
				)
			);
			wp_cache_set( $cache_key, $forms, 'boldform_lite', MINUTE_IN_SECONDS );
		}

		foreach ( $forms as $form ) {
			$options[] = array(
				'value' => (int) $form->id,
				/* translators: %d: form ID number */
				'label' => $form->title ? (string) $form->title : sprintf( __( 'Form #%d', 'boldform-lite' ), (int) $form->id ),
			);
		}

		return $options;
	}

	/**
	 * Determines whether script translation JSON files exist.
	 *
	 * @return bool
	 */
	private function has_script_translation_files() {
		$translation_files = glob( BOLDFORM_LITE_PATH . 'languages/*.json' );

		return ! empty( $translation_files );
	}
}
