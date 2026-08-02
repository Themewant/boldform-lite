<?php
/**
 * Frontend shortcode renderer.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles frontend form shortcode output.
 */
class BoldForm_Lite_Shortcode {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Frontend form submission handler.
	 *
	 * @var BoldForm_Lite_Form_Handler
	 */
	private $form_handler;

	/**
	 * Current form settings for the form being rendered.
	 *
	 * @var array<string, mixed>
	 */
	private $current_form_settings = array();

	/**
	 * Status message for this request, resolved once because reading it spends its token.
	 *
	 * Null until looked up; false once looked up and there was none.
	 *
	 * @var array<string, mixed>|false|null
	 */
	private $status_message = null;

	/**
	 * ID of the form currently being rendered (used to scope element ids).
	 *
	 * @var int
	 */
	private $current_form_id = 0;

	/**
	 * Per-request render count keyed by form ID, so repeated embeds of the same
	 * form get a unique wrapper id instead of colliding.
	 *
	 * @var array<int, int>
	 */
	private static $render_counts = array();

	/**
	 * Per-request cache of fetched form rows keyed by form ID, so the same form
	 * embedded multiple times on one page is queried only once.
	 *
	 * @var array<int, object|null>
	 */
	private $form_cache = array();

	/**
	 * Suffix appended to element IDs (not name attributes) for the form instance
	 * currently being rendered. Empty for the first embed of a form on the page;
	 * '-2', '-3', … for repeats, so a form embedded multiple times does not emit
	 * duplicate element IDs / `for` targets while submission name attributes stay
	 * stable.
	 *
	 * @var string
	 */
	private $current_instance = '';

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite              $plugin       Main plugin instance.
	 * @param BoldForm_Lite_Form_Handler $form_handler Frontend submission handler.
	 */
	public function __construct( $plugin, $form_handler ) {
		$this->plugin       = $plugin;
		$this->form_handler = $form_handler;
	}

	/**
	 * Allows CSS mask properties used for inline SVG icon tinting.
	 *
	 * @param array<int, string> $styles CSS property allowlist.
	 * @return array<int, string>
	 */
	public function allow_mask_safe_style_css( $styles ) {
		$styles[] = '-webkit-mask';
		$styles[] = 'mask';

		return array_unique( $styles );
	}

	/**
	 * Allows safe URL-based mask values after wp_kses validates the property name.
	 *
	 * WordPress does not treat mask as a URL-capable CSS property internally, so it
	 * leaves the url() token in the safety test string and strips the declaration.
	 *
	 * @param bool   $allow_css       Whether the CSS is currently considered safe.
	 * @param string $css_test_string CSS declaration being tested.
	 * @return bool
	 */
	public function allow_mask_safe_style_value( $allow_css, $css_test_string ) {
		if ( $allow_css ) {
			return true;
		}

		if ( ! preg_match( '/^(-webkit-mask|mask)\s*:\s*url\(\s*([\'"]?)([^\'")]+)\2\s*\)\s+center\s*\/\s*contain\s+no-repeat$/i', trim( $css_test_string ), $matches ) ) {
			return false;
		}

		$url = trim( $matches[3] );

		return '' !== $url && wp_kses_bad_protocol( $url, wp_allowed_protocols() ) === $url;
	}

	/**
	 * Sanitizes field markup with the SVG icon mask CSS allowances scoped to this call.
	 *
	 * @param string $html Field HTML.
	 * @return string
	 */
	private function kses_field_html( $html ) {
		add_filter( 'safe_style_css', array( $this, 'allow_mask_safe_style_css' ) );
		add_filter( 'safecss_filter_attr_allow_css', array( $this, 'allow_mask_safe_style_value' ), 10, 2 );

		$sanitized = wp_kses( $html, $this->get_field_kses_allowed() );

		remove_filter( 'safecss_filter_attr_allow_css', array( $this, 'allow_mask_safe_style_value' ), 10 );
		remove_filter( 'safe_style_css', array( $this, 'allow_mask_safe_style_css' ) );

		return $sanitized;
	}

	/**
	 * Returns a cache-busting version string for a bundled asset.
	 *
	 * Uses the file's modification time so the browser re-fetches the asset whenever
	 * its contents change, falling back to the plugin version if the file is missing.
	 * This prevents stale cached scripts/styles after an edit without a version bump.
	 *
	 * @param string $relative_path Path relative to the plugin root (e.g. 'assets/js/frontend.js').
	 * @return string
	 */
	private function asset_version( $relative_path ) {
		$absolute = BOLDFORM_LITE_PATH . ltrim( $relative_path, '/' );
		$mtime    = file_exists( $absolute ) ? filemtime( $absolute ) : false;
		return ( false !== $mtime ) ? (string) $mtime : BOLDFORM_LITE_VERSION;
	}

	/**
	 * Registers frontend assets.
	 *
	 * @return void
	 */
	public function register_assets() {
		wp_register_style(
			'boldform-lite-flatpickr',
			BOLDFORM_LITE_URL . 'assets/css/flatpickr.min.css',
			array(),
			'4.6.13'
		);

		wp_register_script(
			'boldform-lite-flatpickr',
			BOLDFORM_LITE_URL . 'assets/js/flatpickr.min.js',
			array(),
			'4.6.13',
			true
		);

		wp_register_style(
			'boldform-lite-frontend',
			BOLDFORM_LITE_URL . 'assets/css/frontend.css',
			array(),
			$this->asset_version( 'assets/css/frontend.css' )
		);

		wp_register_script(
			'boldform-lite-frontend',
			BOLDFORM_LITE_URL . 'assets/js/frontend.js',
			array( 'jquery' ),
			$this->asset_version( 'assets/js/frontend.js' ),
			true
		);

		if ( $this->has_script_translation_files() ) {
			wp_set_script_translations( 'boldform-lite-frontend', 'boldform-lite', BOLDFORM_LITE_PATH . 'languages' );
		}

		// Attach the localized data at registration time so the `boldformLiteFrontend` object
		// is always printed alongside the script — independent of when render() enqueues it.
		// (Block/FSE themes can render the_content in a context where a render-time localize
		// is dropped, leaving boldformLiteFrontend undefined and breaking AJAX submit.)
		$this->localize_frontend_script();

		/**
		 * Fires after BoldForm Lite registers its frontend assets.
		 *
		 * Pro can register additional scripts/styles (e.g. signature pad, payment SDK).
		 *
		 * @param BoldForm_Lite_Shortcode $shortcode The shortcode renderer instance.
		 */
		do_action( 'boldform_register_assets', $this );
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

	/**
	 * Registers the [boldform] shortcode.
	 *
	 * @return void
	 */
	public function register_shortcode() {
		add_shortcode( 'boldform', array( $this, 'render_shortcode' ) );
	}

	/**
	 * Renders the shortcode output.
	 *
	 * @param array<string, mixed> $atts Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'id' => 0,
			),
			(array) $atts,
			'boldform'
		);

		$form_id = absint( $atts['id'] );

		if ( ! $form_id ) {
			return '';
		}

		$form_record = $this->get_form( $form_id );

		if ( ! $form_record ) {
			return '';
		}

		// Only published forms render on the frontend (matches the submission handler's gate;
		// drafts and trashed forms must not appear).
		if ( ! isset( $form_record->status ) || 'publish' !== $form_record->status ) {
			return '';
		}

		$structure     = $this->extract_structure_from_record( $form_record );
		$form_settings = $this->extract_settings_from_record( $form_record );
		$this->current_form_settings = $form_settings;
		$this->current_form_id       = $form_id;
		if ( ! $this->structure_has_fields( $structure ) ) {
			return '';
		}

		wp_enqueue_style( 'boldform-lite-frontend' );
		wp_enqueue_script( 'boldform-lite-frontend' );
		$this->maybe_enqueue_captcha_assets( $structure );

		// Enqueue flatpickr only when form has date or time fields.
		if ( $this->structure_contains_field_type( $structure, 'date' ) || $this->structure_contains_field_type( $structure, 'time' ) ) {
			wp_enqueue_style( 'boldform-lite-flatpickr' );
			wp_enqueue_script( 'boldform-lite-flatpickr' );
		}

		$status     = $this->get_form_status_message( $form_id );
		$style_mode = $this->get_form_style_mode();
		$form_class = 'boldform-lite-form' . ( 'theme' === $style_mode ? ' boldform-lite-form--theme' : '' );
		if ( ! empty( $form_settings['hide_labels'] ) ) {
			$form_class .= ' boldform-hide-labels';
		}
		if ( ! empty( $form_settings['hide_placeholders'] ) ) {
			$form_class .= ' boldform-hide-ph-yes';
		}

		// In a builder editor preview the form is shown live for styling but must
		// not submit (that would create real entries); flag it for the frontend JS.
		$is_preview = $this->is_editor_preview();

		// Keep the first embed as "boldform-{id}" (back-compat); suffix repeats so the
		// wrapper id stays unique when the same form is placed on a page more than once.
		self::$render_counts[ $form_id ] = ( self::$render_counts[ $form_id ] ?? 0 ) + 1;
		$instance_n = self::$render_counts[ $form_id ];
		$form_uid = 'boldform-' . $form_id . ( $instance_n > 1 ? '-' . $instance_n : '' );

		// Mirror the wrapper's instance suffix onto element IDs so a form embedded
		// more than once on a page does not emit duplicate IDs / `for` targets.
		$this->current_instance = $instance_n > 1 ? '-' . $instance_n : '';

		// Output buffering keeps the template readable while still returning a shortcode string.
		ob_start();
		?>
		<div id="<?php echo esc_attr( $form_uid ); ?>" class="boldform-wrap">
		<?php echo $this->build_form_style_block( $form_settings, $form_uid ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS is reconstructed from sanitized primitives and charset-filtered in build_form_style_block(); the scope id is sanitized there too. ?>
		<form
			class="<?php echo esc_attr( $form_class ); ?>"
			method="post"
			enctype="multipart/form-data"
			data-form-id="<?php echo esc_attr( $form_id ); ?>"<?php echo $is_preview ? ' data-boldform-preview="1"' : ''; ?>
			data-enable-ajax="<?php echo esc_attr( $form_settings['enable_ajax'] ? '1' : '0' ); ?>"
			data-enable-redirect="<?php echo esc_attr( $form_settings['enable_redirect'] ? '1' : '0' ); ?>"
			data-redirect-url="<?php echo ! empty( $form_settings['enable_redirect'] ) ? esc_attr( $form_settings['redirect_url'] ) : ''; ?>"
		>

			<div class="boldform-lite-form__message<?php echo $status ? ' is-visible is-' . esc_attr( $status['type'] ) : ''; ?>" data-boldform-message aria-live="polite">
				<?php
				// Rich markup: the message is server-authored (looked up by a single-use
				// token, never read from the URL) and is filtered with the post allowlist
				// on the way out, so a template cannot introduce script or event handlers.
				echo $status ? wp_kses_post( $status['message'] ) : '';
				?>
			</div>

			<?php $has_submit_field = $this->structure_contains_field_type( $structure, 'submit' ); ?>
			<div class="boldform-lite-form__fields">
				<?php foreach ( $structure['rows'] as $row_index => $row ) : ?>
					<?php if ( ! is_array( $row ) || empty( $row['columns'] ) || ! is_array( $row['columns'] ) ) { continue; } ?>
					<?php $row_css = ! empty( $row['css_class'] ) ? ' ' . sanitize_html_class( $row['css_class'] ) : ''; ?>
					<div class="boldform-lite-form__row<?php echo esc_attr( $row_css ); ?>">
						<?php foreach ( $row['columns'] as $column_index => $column ) : ?>
							<?php if ( ! is_array( $column ) ) { continue; } ?>
							<div class="boldform-lite-form__column" style="width:<?php echo esc_attr( isset( $column['width'] ) ? (string) $column['width'] : '100%' ); ?>;">
								<?php foreach ( ( ! empty( $column['fields'] ) && is_array( $column['fields'] ) ? $column['fields'] : array() ) as $field_index => $field ) : ?>
									<?php
									$field_type = isset( $field['type'] ) ? (string) $field['type'] : '';
									$field_html = $this->render_field( $field, ( $row_index * 100 ) + ( $column_index * 10 ) + $field_index );
									// Rich-content fields are authored in wp-admin (manage_options) and saved with
									// wp_kses_post(); filter them the same way on output. Re-running them through the
									// narrower form-field allowlist would strip legitimate block markup (tables,
									// blockquotes, code, etc.). Every other field uses the strict field allowlist.
									if ( in_array( $field_type, array( 'paragraph', 'html_editor' ), true ) ) {
										echo wp_kses_post( $field_html );
									} else {
										echo $this->kses_field_html( $field_html ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped via kses_field_html() (wp_kses).
									}
									?>
								<?php endforeach; ?>
							</div>
						<?php endforeach; ?>
					</div>
				<?php endforeach; ?>
			</div>
			<div style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
				<label aria-hidden="true">Leave this field empty<input type="text" name="boldform_hp_<?php echo esc_attr( $form_id ); ?>" value="" tabindex="-1" autocomplete="off" readonly aria-hidden="true" data-lpignore="true" data-1p-ignore data-bwignore data-form-type="other"></label>
			</div>
			<input type="hidden" name="action" value="boldform_lite_submit_form">
			<input type="hidden" name="boldform_action" value="submit_form">
			<input type="hidden" name="boldform_form_id" value="<?php echo esc_attr( $form_id ); ?>">
			<input type="hidden" name="boldform_nonce" value="<?php echo esc_attr( wp_create_nonce( 'boldform_lite_submit_form_' . $form_id ) ); ?>">
			<?php if ( ! $has_submit_field ) : ?>
			<div class="boldform-lite-form__actions is-align-<?php echo esc_attr( $form_settings['button_alignment'] ); ?>">
				<?php
				$button_label = $this->get_button_accessible_label( $form_settings );
				$aria_label   = $button_label ? ' aria-label="' . esc_attr( $button_label ) . '"' : '';
				?>
				<button type="<?php echo $is_preview ? 'button' : 'submit'; ?>" class="boldform-lite-form__submit"<?php echo $aria_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					<?php echo $this->kses_field_html( $this->build_button_content( $form_settings ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped via kses_field_html() (wp_kses). ?>
				</button>
			</div>
			<?php endif; ?>
		</form>
		</div><?php // .boldform-wrap ?>
		<?php

		$form_html = (string) ob_get_clean();

		/**
		 * Filter the complete rendered form HTML.
		 *
		 * Pro can wrap the form (e.g. multi-step page wrapper, payment summary).
		 *
		 * @param string  $form_html   Full form HTML output.
		 * @param int     $form_id     Form ID.
		 * @param object  $form_record Form database row.
		 * @param array<string, mixed> $form_settings Resolved form settings.
		 */
		$form_html = (string) apply_filters( 'boldform_form_output', apply_filters( 'boldform_lite_form_output', $form_html, $form_id, $form_record ), $form_id, $form_record, $form_settings );

		/**
		 * Fires after a form is rendered on the frontend.
		 * Used by Pro modules (e.g. analytics) to track form views.
		 *
		 * @param int $form_id Form ID.
		 */
		do_action( 'boldform_form_rendered', $form_id );

		// $form_html is structured HTML built entirely from escaped values (esc_attr, esc_html,
		// wp_kses_post) inside ob_start(). Escaping the whole string here would corrupt the HTML.
		return $form_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Returns a single form row by ID.
	 *
	 * @param int $form_id Form ID.
	 * @return object|null
	 */
	private function get_form( $form_id ) {
		$form_id = (int) $form_id;

		// Per-request memo: the same form embedded multiple times on one page (or
		// fetched by both the shortcode and a block) then issues a single query, not
		// one per embed. Scoped to this request, so it never serves stale data.
		if ( isset( $this->form_cache[ $form_id ] ) ) {
			return $this->form_cache[ $form_id ];
		}

		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();

		$safe_table = esc_sql( $table_name );

		$form = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT * FROM `{$safe_table}` WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$form_id
			)
		);

		$this->form_cache[ $form_id ] = $form;

		return $form;
	}

	/**
	 * Extracts form structure from the saved JSON payload.
	 *
	 * @param object|null $form_record Form database record.
	 * @return array<string, array<int, array<string, mixed>>>
	 */
	private function extract_structure_from_record( $form_record ) {
		if ( ! $form_record || empty( $form_record->fields_json ) ) {
			return array( 'rows' => array() );
		}

		$decoded = json_decode( (string) $form_record->fields_json, true );

		if ( isset( $decoded['rows'] ) && is_array( $decoded['rows'] ) ) {
			return array( 'rows' => $decoded['rows'] );
		}

		if ( isset( $decoded['fields'] ) && is_array( $decoded['fields'] ) ) {
			return array(
				'rows' => array(
					array(
						'columns' => array(
							array(
								'width'  => '100%',
								'fields' => $decoded['fields'],
							),
						),
					),
				),
			);
		}

		if ( is_array( $decoded ) ) {
			return array(
				'rows' => array(
					array(
						'columns' => array(
							array(
								'width'  => '100%',
								'fields' => $decoded,
							),
						),
					),
				),
			);
		}

		return array( 'rows' => array() );
	}

	/**
	 * Extracts normalized form submission settings.
	 *
	 * @param object|null $form_record Form database record.
	 * @return array<string, mixed>
	 */
	private function extract_settings_from_record( $form_record ) {
		$defaults = array(
			'submission_type'   => 'ajax',
			'enable_ajax'       => true,
			'enable_redirect'   => false,
			'redirect_url'      => '',
			'thank_you_message' => __( 'Thanks! Your form was submitted successfully.', 'boldform-lite' ),
			'button_text'       => __( 'Submit', 'boldform-lite' ),
			'button_alignment'  => 'left',
			'button_color'      => 'teal',
			'field_style'       => '',
			'field_size'        => '',
			'field_focus_color' => '',
			'field_border_width'=> '',
			'field_border_radius'=> '',
			'field_background_color' => '',
			'field_border_color' => '',
			'field_text_color'  => '',
			'label_size'        => '',
			'label_color'       => '',
			'label_subtext_color' => '',
			'error_color'       => '',
			'button_size'       => '',
			'button_border_style' => '',
			'button_border_width' => '',
			'button_border_radius' => '',
			'button_background_color' => '',
			'button_border_color' => '',
			'button_text_color' => '',
			'admin_email_type'  => 'site_admin',
			'enable_admin_email'=> true,
			'enable_user_email' => true,
			'admin_email'       => '',
		);

		if ( ! $form_record || empty( $form_record->settings_json ) ) {
			return $defaults;
		}

		$decoded = json_decode( (string) $form_record->settings_json, true );

		if ( ! is_array( $decoded ) ) {
			return $defaults;
		}

		$submission_type  = isset( $decoded['submission_type'] ) && in_array( $decoded['submission_type'], array( 'ajax', 'redirect' ), true )
			? $decoded['submission_type']
			: ( ! empty( $decoded['enable_redirect'] ) ? 'redirect' : 'ajax' );
		$admin_email      = isset( $decoded['admin_email'] ) ? sanitize_email( (string) $decoded['admin_email'] ) : $defaults['admin_email'];
		$admin_email_type = isset( $decoded['admin_email_type'] ) && in_array( $decoded['admin_email_type'], array( 'site_admin', 'custom' ), true )
			? $decoded['admin_email_type']
			: ( $admin_email ? 'custom' : 'site_admin' );

		return array(
			'submission_type'   => $submission_type,
			'enable_ajax'       => 'ajax' === $submission_type,
			'enable_redirect'   => 'redirect' === $submission_type,
			'redirect_url'      => isset( $decoded['redirect_url'] ) ? esc_url_raw( (string) $decoded['redirect_url'] ) : $defaults['redirect_url'],
			// Rich markup: filtered with the post allowlist, matching the save path.
			'thank_you_message' => isset( $decoded['thank_you_message'] ) ? wp_kses_post( (string) $decoded['thank_you_message'] ) : $defaults['thank_you_message'],
			'button_text'       => isset( $decoded['button_text'] ) ? sanitize_text_field( (string) $decoded['button_text'] ) : $defaults['button_text'],
			'button_alignment'  => isset( $decoded['button_alignment'] ) && in_array( $decoded['button_alignment'], array( 'left', 'center', 'right' ), true ) ? $decoded['button_alignment'] : $defaults['button_alignment'],
			'button_color'      => isset( $decoded['button_color'] ) && in_array( $decoded['button_color'], array( 'teal', 'blue', 'green', 'red', 'dark' ), true ) ? $decoded['button_color'] : $defaults['button_color'],
			'field_style'       => isset( $decoded['field_style'] ) && in_array( $decoded['field_style'], array( 'solid', 'dashed', 'none', 'outline', 'soft', 'minimal' ), true ) ? $decoded['field_style'] : '',
			'field_size'        => isset( $decoded['field_size'] ) && in_array( $decoded['field_size'], array( 'small', 'medium', 'large', 'compact', 'comfortable', 'spacious' ), true ) ? $decoded['field_size'] : '',
			'field_focus_color' => isset( $decoded['field_focus_color'] ) && in_array( $decoded['field_focus_color'], array( 'teal', 'blue', 'green', 'dark' ), true ) ? $decoded['field_focus_color'] : '',
			'field_border_width'=> isset( $decoded['field_border_width'] ) && '' !== $decoded['field_border_width'] ? max( 0, min( 10, absint( $decoded['field_border_width'] ) ) ) : '',
			'field_border_radius'=> isset( $decoded['field_border_radius'] ) && '' !== $decoded['field_border_radius'] ? max( 0, min( 50, absint( $decoded['field_border_radius'] ) ) ) : '',
			'field_background_color' => isset( $decoded['field_background_color'] ) && sanitize_hex_color( $decoded['field_background_color'] ) ? sanitize_hex_color( $decoded['field_background_color'] ) : '',
			'field_border_color' => isset( $decoded['field_border_color'] ) && sanitize_hex_color( $decoded['field_border_color'] ) ? sanitize_hex_color( $decoded['field_border_color'] ) : '',
			'field_text_color'  => isset( $decoded['field_text_color'] ) && sanitize_hex_color( $decoded['field_text_color'] ) ? sanitize_hex_color( $decoded['field_text_color'] ) : '',
			'label_size'        => isset( $decoded['label_size'] ) && in_array( $decoded['label_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['label_size'] : '',
			'label_color'       => isset( $decoded['label_color'] ) && sanitize_hex_color( $decoded['label_color'] ) ? sanitize_hex_color( $decoded['label_color'] ) : '',
			'label_subtext_color' => isset( $decoded['label_subtext_color'] ) && sanitize_hex_color( $decoded['label_subtext_color'] ) ? sanitize_hex_color( $decoded['label_subtext_color'] ) : '',
			'error_color'       => isset( $decoded['error_color'] ) && sanitize_hex_color( $decoded['error_color'] ) ? sanitize_hex_color( $decoded['error_color'] ) : '',
			'button_size'       => isset( $decoded['button_size'] ) && in_array( $decoded['button_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['button_size'] : '',
			'button_border_style' => isset( $decoded['button_border_style'] ) && in_array( $decoded['button_border_style'], array( 'solid', 'dashed', 'none' ), true ) ? $decoded['button_border_style'] : '',
			'button_border_width' => isset( $decoded['button_border_width'] ) && '' !== $decoded['button_border_width'] ? max( 0, min( 10, absint( $decoded['button_border_width'] ) ) ) : '',
			'button_border_radius' => isset( $decoded['button_border_radius'] ) && '' !== $decoded['button_border_radius'] ? max( 0, min( 50, absint( $decoded['button_border_radius'] ) ) ) : '',
			'button_background_color' => isset( $decoded['button_background_color'] ) && sanitize_hex_color( $decoded['button_background_color'] ) ? sanitize_hex_color( $decoded['button_background_color'] ) : '',
			'button_border_color' => isset( $decoded['button_border_color'] ) && sanitize_hex_color( $decoded['button_border_color'] ) ? sanitize_hex_color( $decoded['button_border_color'] ) : '',
			'button_text_color' => isset( $decoded['button_text_color'] ) && sanitize_hex_color( $decoded['button_text_color'] ) ? sanitize_hex_color( $decoded['button_text_color'] ) : '',
			'button_icon_type'     => isset( $decoded['button_icon_type'] ) && in_array( $decoded['button_icon_type'], array( 'none', 'dashicon', 'svg' ), true ) ? $decoded['button_icon_type'] : 'none',
			'button_icon_dashicon' => isset( $decoded['button_icon_dashicon'] ) ? sanitize_text_field( (string) $decoded['button_icon_dashicon'] ) : '',
			'button_icon_svg'      => isset( $decoded['button_icon_svg'] ) ? esc_url_raw( (string) $decoded['button_icon_svg'] ) : '',
			'button_icon_position' => isset( $decoded['button_icon_position'] ) && in_array( $decoded['button_icon_position'], array( 'left', 'right' ), true ) ? $decoded['button_icon_position'] : 'right',
			'button_icon_gap'      => isset( $decoded['button_icon_gap'] ) ? absint( $decoded['button_icon_gap'] ) : 8,
			'button_icon_size'     => isset( $decoded['button_icon_size'] ) ? absint( $decoded['button_icon_size'] ) : 18,
			'button_icon_color'    => isset( $decoded['button_icon_color'] ) && sanitize_hex_color( $decoded['button_icon_color'] ) ? sanitize_hex_color( $decoded['button_icon_color'] ) : '',
			'admin_email_type'  => $admin_email_type,
			'enable_admin_email'=> isset( $decoded['enable_admin_email'] ) ? (bool) $decoded['enable_admin_email'] : $defaults['enable_admin_email'],
			'enable_user_email' => isset( $decoded['enable_user_email'] ) ? (bool) $decoded['enable_user_email'] : $defaults['enable_user_email'],
			'admin_email'       => $admin_email,
			'design_theme'        => isset( $decoded['design_theme'] ) ? sanitize_key( (string) $decoded['design_theme'] ) : '',
			'hide_labels'         => ! empty( $decoded['hide_labels'] ),
			'hide_placeholders'   => ! empty( $decoded['hide_placeholders'] ),
			// ── Pro: Multi-step (data passthrough for Pro's multi-page module) ───
			'step_progress_style' => isset( $decoded['step_progress_style'] ) && in_array( $decoded['step_progress_style'], array( 'bar', 'steps', 'headings' ), true ) ? $decoded['step_progress_style'] : 'bar',
			'step_progress_color' => isset( $decoded['step_progress_color'] ) && sanitize_hex_color( $decoded['step_progress_color'] ) ? sanitize_hex_color( $decoded['step_progress_color'] ) : '',
			'step_btn_color'      => isset( $decoded['step_btn_color'] ) && sanitize_hex_color( $decoded['step_btn_color'] ) ? sanitize_hex_color( $decoded['step_btn_color'] ) : '',
			'step_btn_text_color' => isset( $decoded['step_btn_text_color'] ) && sanitize_hex_color( $decoded['step_btn_text_color'] ) ? sanitize_hex_color( $decoded['step_btn_text_color'] ) : '',
			'step_btn_size'       => isset( $decoded['step_btn_size'] ) && in_array( $decoded['step_btn_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['step_btn_size'] : 'medium',
			'step_btn_radius'     => isset( $decoded['step_btn_radius'] ) && '' !== $decoded['step_btn_radius'] ? max( 0, min( 50, absint( $decoded['step_btn_radius'] ) ) ) : '',
			'step_next_text'      => isset( $decoded['step_next_text'] ) ? sanitize_text_field( (string) $decoded['step_next_text'] ) : 'Next',
			'step_prev_text'      => isset( $decoded['step_prev_text'] ) ? sanitize_text_field( (string) $decoded['step_prev_text'] ) : 'Previous',
			// ── Pro: Scheduling ──────────────────────────────────────────────────
			'schedule_open_date'      => isset( $decoded['schedule_open_date'] )      ? sanitize_text_field( (string) $decoded['schedule_open_date'] )      : '',
			'schedule_close_date'     => isset( $decoded['schedule_close_date'] )     ? sanitize_text_field( (string) $decoded['schedule_close_date'] )     : '',
			'schedule_tz'             => isset( $decoded['schedule_tz'] )             ? sanitize_text_field( (string) $decoded['schedule_tz'] )             : '',
			'schedule_closed_msg'     => isset( $decoded['schedule_closed_msg'] )     ? wp_kses_post( (string) $decoded['schedule_closed_msg'] )            : '',
			'schedule_before_msg'     => isset( $decoded['schedule_before_msg'] )     ? wp_kses_post( (string) $decoded['schedule_before_msg'] )            : '',
			'schedule_show_countdown' => ! empty( $decoded['schedule_show_countdown'] ),
			// ── Advanced (responsive) per-control style overrides → --bf-* CSS vars ──
			'style'                   => isset( $decoded['style'] ) ? $this->sanitize_render_style_settings( $decoded['style'] ) : array(),
		);
	}

	/**
	 * Sanitize the advanced per-device style overrides for front-end output.
	 *
	 * Defense-in-depth mirror of the admin save-side validation: only the
	 * desktop|tablet|mobile legs, only `--bf-…` custom-property names, and scalar
	 * values constrained to a strict CSS charset with url()/expression()/@import
	 * and comment vectors rejected outright.
	 *
	 * @param mixed $style Decoded style settings from the stored JSON.
	 * @return array<string, array<string, string>> Sanitized {device: {var: value}}.
	 */
	private function sanitize_render_style_settings( $style ) {
		$out = array();

		if ( ! is_array( $style ) ) {
			return $out;
		}

		foreach ( array( 'desktop', 'tablet', 'mobile' ) as $device ) {
			if ( empty( $style[ $device ] ) || ! is_array( $style[ $device ] ) ) {
				continue;
			}

			$layer = array();

			foreach ( $style[ $device ] as $css_var => $value ) {
				if ( ! is_string( $css_var ) || ! preg_match( '/^--bf-[a-z0-9-]+$/', $css_var ) ) {
					continue;
				}
				if ( ! is_scalar( $value ) ) {
					continue;
				}

				$value = trim( (string) $value );

				if ( '' === $value || strlen( $value ) > 200 ) {
					continue;
				}
				// Strict charset: letters, digits and the punctuation our composite values
				// need (#, %, parens/commas/dots for gradients & calc, spaces for dimensions).
				if ( preg_match( '/[^a-zA-Z0-9#%().,\s_-]/', $value ) ) {
					continue;
				}

				$lower = strtolower( $value );
				if ( false !== strpos( $lower, 'url(' )
					|| false !== strpos( $lower, 'expression' )
					|| false !== strpos( $lower, 'import' )
					|| false !== strpos( $lower, '/*' ) ) {
					continue;
				}

				$layer[ $css_var ] = $value;
			}

			if ( ! empty( $layer ) ) {
				$out[ $device ] = $layer;
			}
		}

		return $out;
	}

	/**
	 * Returns normalized captcha settings from global plugin options.
	 *
	 * @return array<string, string|bool>
	 */
	private function get_captcha_settings() {
		$saved = get_option( 'boldform_lite_settings', array() );
		$saved = is_array( $saved ) ? $saved : array();

		$provider = isset( $saved['captcha_provider'] ) ? sanitize_key( (string) $saved['captcha_provider'] ) : 'simple_math';
		$provider = in_array( $provider, array( 'recaptcha', 'hcaptcha', 'turnstile', 'simple_math' ), true ) ? $provider : 'simple_math';

		return array(
			'provider'           => $provider,
			'recaptcha_site_key' => isset( $saved['recaptcha_site_key'] ) ? sanitize_text_field( (string) $saved['recaptcha_site_key'] ) : '',
			'hcaptcha_site_key'  => isset( $saved['hcaptcha_site_key'] ) ? sanitize_text_field( (string) $saved['hcaptcha_site_key'] ) : '',
			'turnstile_site_key' => isset( $saved['turnstile_site_key'] ) ? sanitize_text_field( (string) $saved['turnstile_site_key'] ) : '',
		);
	}

	/**
	 * Enqueues the selected captcha provider script when a captcha field is present.
	 *
	 * @param array<string, array<int, array<string, mixed>>> $structure Form structure.
	 * @return void
	 */
	private function maybe_enqueue_captcha_assets( $structure ) {
		if ( ! $this->structure_contains_field_type( $structure, 'captcha' ) ) {
			return;
		}

		$captcha = $this->get_captcha_settings();

		if ( 'recaptcha' === $captcha['provider'] && ! empty( $captcha['recaptcha_site_key'] ) ) {
			wp_enqueue_script(
				'boldform-lite-recaptcha',
				'https://www.google.com/recaptcha/api.js',
				array(),
				null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- external resource, version controlled by provider.
				true
			);
		}

		if ( 'hcaptcha' === $captcha['provider'] && ! empty( $captcha['hcaptcha_site_key'] ) ) {
			wp_enqueue_script(
				'boldform-lite-hcaptcha',
				'https://js.hcaptcha.com/1/api.js',
				array(),
				null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- external resource, version controlled by provider.
				true
			);
		}

		if ( 'turnstile' === $captcha['provider'] && ! empty( $captcha['turnstile_site_key'] ) ) {
			wp_enqueue_script(
				'boldform-lite-turnstile',
				// phpcs:ignore PluginCheck.CodeAnalysis.EnqueuedResourceOffloading.OffloadedContent -- Cloudflare Turnstile captcha API must load from the provider (same as reCAPTCHA/hCaptcha).
				'https://challenges.cloudflare.com/turnstile/v0/api.js',
				array(),
				null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- external resource, version controlled by provider.
				true
			);
		}
	}

	/**
	 * Determines whether the structure contains a given field type.
	 *
	 * @param array<string, array<int, array<string, mixed>>> $structure Form structure.
	 * @param string                                          $field_type Field type.
	 * @return bool
	 */
	private function structure_contains_field_type( $structure, $field_type ) {
		if ( empty( $structure['rows'] ) || ! is_array( $structure['rows'] ) ) {
			return false;
		}

		foreach ( $structure['rows'] as $row ) {
			if ( empty( $row['columns'] ) || ! is_array( $row['columns'] ) ) {
				continue;
			}

			foreach ( $row['columns'] as $column ) {
				if ( empty( $column['fields'] ) || ! is_array( $column['fields'] ) ) {
					continue;
				}

				foreach ( $column['fields'] as $field ) {
					if ( isset( $field['type'] ) && $field_type === $field['type'] ) {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Renders the captcha widget for the selected provider.
	 *
	 * @param array<string, string|bool> $captcha Captcha settings.
	 * @return string
	 */
	private function render_captcha_field( $captcha ) {
		if ( 'recaptcha' === $captcha['provider'] && ! empty( $captcha['recaptcha_site_key'] ) ) {
			return sprintf(
				'<div class="boldform-lite-form__captcha"><div class="g-recaptcha" data-sitekey="%s"></div></div>',
				esc_attr( (string) $captcha['recaptcha_site_key'] )
			);
		}

		if ( 'hcaptcha' === $captcha['provider'] && ! empty( $captcha['hcaptcha_site_key'] ) ) {
			return sprintf(
				'<div class="boldform-lite-form__captcha"><div class="h-captcha" data-sitekey="%s"></div></div>',
				esc_attr( (string) $captcha['hcaptcha_site_key'] )
			);
		}

		if ( 'turnstile' === $captcha['provider'] && ! empty( $captcha['turnstile_site_key'] ) ) {
			return sprintf(
				'<div class="boldform-lite-form__captcha"><div class="cf-turnstile" data-sitekey="%s"></div></div>',
				esc_attr( (string) $captcha['turnstile_site_key'] )
			);
		}

		if ( 'simple_math' === $captcha['provider'] ) {
			$first_number  = wp_rand( 1, 9 );
			$second_number = wp_rand( 1, 9 );
			$answer        = $first_number + $second_number;
			$challenge     = sprintf( '%d+%d', $first_number, $second_number );
			$answer_hash   = wp_hash( $challenge . '|' . $answer );

			// Scope the input id/label to the form so two captcha forms on one page don't
			// share a DOM id. The name stays fixed — the handler reads it by name.
			$answer_id = 'boldform_math_captcha_answer_' . (int) $this->current_form_id . $this->current_instance;

			return sprintf(
				'<div class="boldform-lite-form__captcha"><label class="boldform-lite-form__label" for="%4$s">%1$s</label><input id="%4$s" type="number" name="boldform_math_captcha_answer" inputmode="numeric" autocomplete="off" required><input type="hidden" name="boldform_math_captcha_challenge" value="%2$s"><input type="hidden" name="boldform_math_captcha_hash" value="%3$s"></div>',
				esc_html( sprintf(
					/* translators: %s: simple math question */
					__( 'Solve this math question: %s', 'boldform-lite' ),
					$challenge
				) ),
				esc_attr( $challenge ),
				esc_attr( $answer_hash ),
				esc_attr( $answer_id )
			);
		}

		return '';
	}

	/**
	 * Determines whether the structure contains fields.
	 *
	 * @param array<string, array<int, array<string, mixed>>> $structure Form structure.
	 * @return bool
	 */
	private function structure_has_fields( $structure ) {
		if ( empty( $structure['rows'] ) || ! is_array( $structure['rows'] ) ) {
			return false;
		}

		foreach ( $structure['rows'] as $row ) {
			if ( empty( $row['columns'] ) || ! is_array( $row['columns'] ) ) {
				continue;
			}

			foreach ( $row['columns'] as $column ) {
				if ( ! empty( $column['fields'] ) && is_array( $column['fields'] ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Resolves an auto-populate value for a given key.
	 *
	 * Priority:
	 *  1. URL parameter (?key=value) — sanitized text.
	 *  2. Logged-in user built-in data (user_email, user_login, display_name,
	 *     first_name, last_name, user_url, user_registered).
	 *  3. Pro extension via `boldform_auto_populate_{key}` filter.
	 *
	 * @param string $key The auto-populate key set on the field.
	 * @return string Resolved value, or empty string if nothing matched.
	 */
	private function resolve_auto_populate( string $key ): string {
		// 1. URL parameter.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only pre-fill, no data mutation.
		if ( isset( $_GET[ $key ] ) ) {
			return sanitize_text_field( wp_unslash( (string) $_GET[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		// 2. Logged-in user built-in properties.
		if ( is_user_logged_in() ) {
			$user = wp_get_current_user();

			$user_map = array(
				'user_email'      => $user->user_email,
				'email'           => $user->user_email,
				'user_login'      => $user->user_login,
				'display_name'    => $user->display_name,
				'first_name'      => $user->first_name,
				'last_name'       => $user->last_name,
				'user_url'        => $user->user_url,
				'user_registered' => $user->user_registered,
			);

			if ( isset( $user_map[ $key ] ) ) {
				return (string) $user_map[ $key ];
			}
		}

		/**
		 * Filter to allow Pro or third-party plugins to provide a value
		 * for auto-populate keys not handled by Lite (e.g. user meta, post meta).
		 *
		 * @param string $value Empty string by default.
		 * @param string $key   The auto-populate key.
		 */
		$value = (string) apply_filters( 'boldform_auto_populate_' . $key, '' );

		/**
		 * Generic auto-populate filter that passes the key as a second argument.
		 *
		 * Lets an extension resolve any key with a single registered filter instead
		 * of hooking the dynamic per-key tag above (avoids the `all`-hook anti-pattern).
		 *
		 * @param string $value Resolved value so far ('' if nothing matched yet).
		 * @param string $key   The auto-populate key.
		 */
		return (string) apply_filters( 'boldform_auto_populate_value', $value, $key );
	}

	/**
	 * Renders one field wrapper.
	 *
	 * @param array<string, mixed> $field Field configuration.
	 * @param int                  $index Field index.
	 * @return string
	 */
	private function render_field( $field, $index ) {
		$type           = isset( $field['type'] ) ? sanitize_key( (string) $field['type'] ) : 'text';
		$label          = isset( $field['label'] ) ? (string) $field['label'] : '';
		$placeholder    = isset( $field['placeholder'] ) ? (string) $field['placeholder'] : '';
		$default        = isset( $field['default_value'] ) ? (string) $field['default_value'] : '';

		// Auto-population: resolve a value from URL param or logged-in user data.
		$auto_key = isset( $field['auto_populate_key'] ) ? sanitize_key( (string) $field['auto_populate_key'] ) : '';
		if ( '' !== $auto_key ) {
			$auto_value = $this->resolve_auto_populate( $auto_key );
			if ( '' !== $auto_value ) {
				$default = $auto_value;
			}
		}
		$required       = ! empty( $field['required'] );
		$custom_error   = isset( $field['custom_error'] ) ? (string) $field['custom_error'] : '';
		$options        = isset( $field['options'] ) && is_array( $field['options'] ) ? $field['options'] : array();
		$options_layout = isset( $field['options_layout'] ) && 'inline' === $field['options_layout'] ? 'inline' : 'block';
		$content        = isset( $field['content'] ) ? (string) $field['content'] : '';
		$description    = isset( $field['description'] ) ? (string) $field['description'] : '';
		$field_id       = ! empty( $field['id'] ) ? sanitize_html_class( (string) $field['id'] ) : 'field_' . (int) $index;
		$field_name     = 'boldform_' . $field_id;

		if ( 'submit' === $type ) {
			$form_settings = $this->current_form_settings ?? array();
			$button_label  = $this->get_button_accessible_label( $form_settings );
			$aria_label    = $button_label ? ' aria-label="' . esc_attr( $button_label ) . '"' : '';
			$button_type   = $this->is_editor_preview() ? 'button' : 'submit';
			$button_align  = isset( $form_settings['button_alignment'] ) && in_array( $form_settings['button_alignment'], array( 'left', 'center', 'right' ), true ) ? $form_settings['button_alignment'] : 'left';
			return '<div class="boldform-lite-form__actions is-align-' . esc_attr( $button_align ) . '"><button type="' . $button_type . '" class="boldform-lite-form__submit"' . $aria_label . '>' . $this->build_button_content( $form_settings ) . '</button></div>';
		}

		/**
		 * Allow Pro or third-party plugins to render HTML for field types not
		 * natively handled by Lite. Return a non-empty string to short-circuit
		 * Lite's own rendering pipeline for that field.
		 *
		 * @param string               $html  Empty string by default.
		 * @param string               $type  Field type key.
		 * @param array<string, mixed> $field Full field definition.
		 * @param int                  $index Field index in the form structure.
		 */
		$custom_html = (string) apply_filters( 'boldform_render_field', '', $type, $field, $index );
		if ( '' !== $custom_html ) {
			return $custom_html;
		}

		if ( 'section_break' === $type ) {
			return $this->render_section_break( $label, $description );
		}

		if ( 'paragraph' === $type ) {
			return '<div class="boldform-lite-form__paragraph">' . wp_kses_post( $content ) . '</div>';
		}

		if ( 'html_editor' === $type ) {
			return '<div class="boldform-lite-form__html-content">' . wp_kses_post( $content ) . '</div>';
		}

		if ( 'terms_conditions' === $type ) {
			return $this->render_terms_field( $field_name, $content, $required );
		}

		if ( 'captcha' === $type ) {
			return $this->render_captcha_field( $this->get_captcha_settings() );
		}

		ob_start();
		?>
		<?php
		$error_msg = '';
		if ( $required ) {
			if ( $custom_error ) {
				$error_msg = $custom_error;
			} else {
				$global_settings = isset( $this->current_form_settings ) ? get_option( 'boldform_lite_settings', array() ) : array();
				$type_msg        = ! empty( $global_settings[ 'required_msg_' . $type ] ) ? $global_settings[ 'required_msg_' . $type ] : '';
				/* translators: %s: field label */
				$error_msg       = $type_msg ? $type_msg : sprintf( __( '%s is required.', 'boldform-lite' ), $label ? $label : __( 'This field', 'boldform-lite' ) );
			}
		}
		?>
		<?php $field_css = isset( $field['css_class'] ) && '' !== $field['css_class'] ? ' ' . sanitize_html_class( $field['css_class'] ) : ''; ?>
		<?php $label_pos = isset( $field['label_placement'] ) && in_array( $field['label_placement'], array( 'top', 'left', 'right', 'bottom', 'hidden' ), true ) ? $field['label_placement'] : 'top'; ?>
		<?php
		$cond_attrs = '';
		if ( ! empty( $field['conditional']['enabled'] ) ) {
			$cond_data = $field['conditional'];
			if ( isset( $cond_data['conditions'] ) && is_array( $cond_data['conditions'] ) ) {
				// Multi-condition structure — prefix field_ids with boldform_ for the JS engine.
				$conditions_out = array();
				foreach ( $cond_data['conditions'] as $c ) {
					$conditions_out[] = array(
						'field_id' => 'boldform_' . ( isset( $c['field_id'] ) ? $c['field_id'] : '' ),
						'operator' => isset( $c['operator'] ) ? $c['operator'] : 'is',
						'value'    => isset( $c['value'] ) ? $c['value'] : '',
					);
				}
				$cond_payload = array(
					'action'     => isset( $cond_data['action'] ) && 'hide' === $cond_data['action'] ? 'hide' : 'show',
					'logic'      => isset( $cond_data['logic'] ) && 'OR' === $cond_data['logic'] ? 'OR' : 'AND',
					'conditions' => $conditions_out,
				);
				$cond_attrs .= ' data-bf-conditions="' . esc_attr( wp_json_encode( $cond_payload ) ) . '"';
			} elseif ( ! empty( $cond_data['field_id'] ) ) {
				// Legacy single-rule fallback.
				$cond_attrs .= ' data-cond-action="' . esc_attr( $cond_data['action'] ?? 'show' ) . '"';
				$cond_attrs .= ' data-cond-field="boldform_' . esc_attr( $cond_data['field_id'] ) . '"';
				$cond_attrs .= ' data-cond-operator="' . esc_attr( $cond_data['operator'] ?? 'is' ) . '"';
				$cond_attrs .= ' data-cond-value="' . esc_attr( $cond_data['value'] ?? '' ) . '"';
			}
		}

		/**
		 * Filter the conditional logic HTML attributes for a field wrapper.
		 *
		 * Pro can replace these with richer multi-rule conditional data attributes.
		 *
		 * @param string               $cond_attrs Pre-built attribute string (already escaped).
		 * @param array<string, mixed> $field       Field definition.
		 */
		$cond_attrs_base = $cond_attrs; // Lite's own attributes — built entirely from esc_attr() values.
		$cond_attrs      = apply_filters( 'boldform_field_conditional_attrs', $cond_attrs, $field );
		// After the filter, strip any HTML tags to prevent injection; attribute values were
		// already individually escaped with esc_attr() before the filter was applied.
		$cond_attrs = wp_strip_all_tags( (string) $cond_attrs );
		// Defense-in-depth against a careless filter (e.g. from Pro) that returns an
		// UNescaped value: wp_strip_all_tags() removes <tags> but not a stray quote that
		// could break out of the wrapper element and inject new attributes. Require the
		// result to be a well-formed run of quoted attribute pairs with no on*= event
		// handler; otherwise discard the filtered value and fall back to Lite's own
		// known-safe attributes. Lite's own output always passes this check, so the
		// default (no-filter) behaviour is unchanged.
		if ( '' !== $cond_attrs ) {
			$is_safe_attrs = (bool) preg_match( '/^(?:\s+[a-zA-Z0-9_:-]+=(?:"[^"<>]*"|\'[^\'<>]*\'))*\s*$/', $cond_attrs )
				&& ! preg_match( '/\son\w+\s*=/i', $cond_attrs );
			if ( ! $is_safe_attrs ) {
				$cond_attrs = $cond_attrs_base;
			}
		}
		?>
		<div class="boldform-lite-form__field boldform-lite-form__field--<?php echo esc_attr( $type ); ?> boldform-lite-label-<?php echo esc_attr( $label_pos ); ?><?php echo esc_attr( $field_css ); ?>" data-bf-field-id="<?php echo esc_attr( $field_name ); ?>"<?php echo $error_msg ? ' data-error="' . esc_attr( $error_msg ) . '"' : ''; ?><?php echo $cond_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- attribute string; values pre-escaped with esc_attr(), tags stripped with wp_strip_all_tags(). ?>>
			<?php if ( '' !== $label && 'hidden' !== $label_pos ) : ?>
				<label id="<?php echo esc_attr( $field_name . $this->current_instance . '-label' ); ?>" class="boldform-lite-form__label" for="<?php echo esc_attr( $field_name . $this->current_instance ); ?>">
					<?php echo esc_html( $label ); ?>
					<?php if ( $required ) : ?>
						<span class="boldform-lite-form__required">*</span>
					<?php endif; ?>
				</label>
			<?php endif; ?>

			<div class="boldform-lite-form__control">
				<?php
				$field_control_html = $this->render_field_control( $type, $field_name, $placeholder, $default, $required, $options, $options_layout, $field );
				/**
				 * Filter the rendered HTML for a field control.
				 *
				 * Pro modules (e.g. calculation) can intercept this to render their own control HTML
				 * for custom field types before the output is printed.
				 *
				 * @param string               $html       Rendered control HTML.
				 * @param string               $type       Field type.
				 * @param string               $field_name Input name attribute.
				 * @param array<string, mixed> $field      Full field definition.
				 */
				echo wp_kses( apply_filters( 'boldform_field_control_html', $field_control_html, $type, $field_name, $field ), $this->get_field_kses_allowed() );
				?>
			</div>
		</div>
		<?php

		return (string) ob_get_clean();
	}

	/**
	 * Renders a section break field.
	 *
	 * @param string $label Section label.
	 * @param string $description Section description.
	 * @return string
	 */
	private function render_section_break( $label, $description ) {
		ob_start();
		?>
		<div class="boldform-lite-form__section-break">
			<?php if ( '' !== $label ) : ?>
				<h4 class="boldform-lite-form__section-title"><?php echo esc_html( $label ); ?></h4>
			<?php endif; ?>
			<?php if ( '' !== $description ) : ?>
				<p class="boldform-lite-form__section-description"><?php echo esc_html( $description ); ?></p>
			<?php endif; ?>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Returns the accessible label for the submit button.
	 * Used for aria-label when button has no visible text.
	 *
	 * @param array<string, mixed> $settings Form settings.
	 * @return string
	 */
	private function get_button_accessible_label( $settings ) {
		// Return the raw (unescaped) label — call sites place it in an attribute and
		// escape once with esc_attr(). Escaping here too would double-encode entities.
		$text = isset( $settings['button_text'] ) ? (string) $settings['button_text'] : '';
		return '' !== $text ? $text : __( 'Submit', 'boldform-lite' );
	}

	/**
	 * Builds the submit button inner HTML including optional icon.
	 *
	 * @param array<string, mixed> $settings Form settings.
	 * @return string
	 */
	private function build_button_content( $settings ) {
		$raw_text  = $settings['button_text'] ?? '';
		$text      = esc_html( $raw_text );
		$icon_type = $settings['button_icon_type'] ?? 'none';

		// No icon — return text (or default if empty).
		if ( 'none' === $icon_type ) {
			return '' !== $text ? $text : esc_html__( 'Submit', 'boldform-lite' );
		}

		$icon     = '';
		$position = $settings['button_icon_position'] ?? 'right';
		$gap      = absint( $settings['button_icon_gap'] ?? 8 );

		$icon_size  = absint( $settings['button_icon_size'] ?? 18 );
		$icon_color = ! empty( $settings['button_icon_color'] ) ? sanitize_hex_color( (string) $settings['button_icon_color'] ) : '';
		$icon_style = '';
		if ( $icon_size && 18 !== $icon_size ) {
			$icon_style .= 'font-size:' . $icon_size . 'px;width:' . $icon_size . 'px;height:' . $icon_size . 'px;';
		}
		if ( $icon_color ) {
			$icon_style .= 'color:' . esc_attr( $icon_color ) . ';';
		}
		$icon_style_attr = $icon_style ? ' style="' . esc_attr( $icon_style ) . '"' : '';

		if ( 'dashicon' === $icon_type && ! empty( $settings['button_icon_dashicon'] ) ) {
			if ( ! is_admin() ) {
				wp_enqueue_style( 'dashicons' );
			}
			$icon = '<span class="dashicons ' . esc_attr( $settings['button_icon_dashicon'] ) . '"' . $icon_style_attr . '></span>';
		} elseif ( 'svg' === $icon_type && ! empty( $settings['button_icon_svg'] ) ) {
			$img_w   = ( $icon_size && 18 !== $icon_size ) ? $icon_size : 18;
			$svg_url = $settings['button_icon_svg'];

			if ( $icon_color ) {
				// Tint a monochrome SVG to the chosen colour via a CSS mask: the SVG
				// shape masks a solid background-color, so it recolours reliably no
				// matter how the file declares its own fills (a root fill override only
				// works when every shape inherits fill). Matches the builder preview.
				$mask_ref  = 'url(' . esc_url( $svg_url ) . ') center / contain no-repeat';
				$svg_style = 'display:inline-block;vertical-align:middle;flex-shrink:0;'
					. 'width:' . $img_w . 'px;height:' . $img_w . 'px;'
					. 'background-color:' . $icon_color . ';'
					. '-webkit-mask:' . $mask_ref . ';mask:' . $mask_ref . ';';
				$icon = '<span class="boldform-btn-icon-svg" style="' . esc_attr( $svg_style ) . '" aria-hidden="true"></span>';
			} else {
				// No colour override — show the SVG's own colours via <img>.
				$svg_style = 'width:' . $img_w . 'px;height:' . $img_w . 'px;display:inline-block;vertical-align:middle;flex-shrink:0;';
				$icon      = '<img src="' . esc_url( $svg_url ) . '" class="boldform-btn-icon-svg" style="' . esc_attr( $svg_style ) . '" alt="">';
			}
		}

		// No valid icon resolved — return text only.
		if ( ! $icon ) {
			return '' !== $text ? $text : esc_html__( 'Submit', 'boldform-lite' );
		}

		// Icon-only button (no text).
		if ( '' === $text ) {
			return '<span class="boldform-btn-inner boldform-btn-inner--icon-only" style="display:inline-flex;align-items:center;">' . $icon . '</span>';
		}

		// Icon + text.
		$inner = 'left' === $position ? $icon . $text : $text . $icon;

		return '<span class="boldform-btn-inner" style="display:inline-flex;align-items:center;gap:' . esc_attr( $gap ) . 'px;">' . $inner . '</span>';
	}

	/**
	 * Reads an uploaded SVG file by URL and returns sanitized inline SVG markup
	 * with size and fill applied, so CSS color controls work.
	 *
	 * Returns empty string on failure so caller falls back to <img>.
	 *
	 * @param string $url        Attachment URL.
	 * @param int    $size       Width/height in px.
	 * @param string $fill_color Hex color or empty.
	 * @return string
	 */
	private function get_inline_svg( $url, $size, $fill_color = '' ) {
		// Only allow files from the uploads directory.
		$upload_dir = wp_upload_dir();
		$base_url   = $upload_dir['baseurl'];
		$base_dir   = $upload_dir['basedir'];

		if ( strpos( $url, $base_url ) !== 0 ) {
			return '';
		}

		$relative = substr( $url, strlen( $base_url ) );
		$path     = $base_dir . $relative;

		if ( ! is_file( $path ) || ! is_readable( $path ) ) {
			return '';
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$svg = file_get_contents( $path );
		if ( empty( $svg ) ) {
			return '';
		}

		// Parse with DOMDocument for reliable sanitization.
		$dom = new \DOMDocument();
		libxml_use_internal_errors( true );
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$dom->loadXML( $svg );
		libxml_clear_errors();

		$svg_el = $dom->getElementsByTagName( 'svg' )->item( 0 );
		if ( ! $svg_el ) {
			return '';
		}

		// Set size.
		$svg_el->setAttribute( 'width', (string) $size );
		$svg_el->setAttribute( 'height', (string) $size );
		$svg_el->removeAttribute( 'x' );
		$svg_el->removeAttribute( 'y' );
		$svg_el->removeAttribute( 'xml:space' );
		$svg_el->removeAttribute( 'version' );
		$svg_el->removeAttribute( 'id' );

		// Apply color — set fill on root SVG so currentColor cascade works.
		if ( $fill_color ) {
			$existing_style = $svg_el->getAttribute( 'style' );
			// Strip enable-background junk from Illustrator exports.
			$existing_style = preg_replace( '/enable-background\s*:[^;]+;?/i', '', $existing_style );
			$svg_el->setAttribute( 'style', trim( $existing_style . ';fill:' . esc_attr( $fill_color ) . ';', ';' ) );
		} else {
			// Remove Illustrator style bloat even when no color override.
			$existing_style = $svg_el->getAttribute( 'style' );
			$clean = preg_replace( '/enable-background\s*:[^;]+;?/i', '', $existing_style );
			if ( trim( $clean ) !== '' ) {
				$svg_el->setAttribute( 'style', trim( $clean, ';' ) );
			} else {
				$svg_el->removeAttribute( 'style' );
			}
		}

		// Remove script/event-handler nodes recursively for safety.
		$this->remove_unsafe_svg_nodes( $dom );

		// Serialize just the <svg> element.
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$output = $dom->saveXML( $svg_el );

		return $output ? $output : '';
	}

	/**
	 * Removes unsafe nodes (script, foreignObject, on* attributes) from SVG DOM.
	 *
	 * @param \DOMDocument $dom The SVG document.
	 * @return void
	 */
	private function remove_unsafe_svg_nodes( \DOMDocument $dom ) {
		// Tags that can execute script, load remote content, navigate, or animate
		// an attribute into a dangerous value (SMIL) — none are needed for icon SVGs.
		$unsafe_tags = array( 'script', 'foreignObject', 'iframe', 'object', 'embed', 'use', 'a', 'style', 'animate', 'animateTransform', 'animateMotion', 'set' );
		foreach ( $unsafe_tags as $tag ) {
			foreach ( iterator_to_array( $dom->getElementsByTagName( $tag ) ) as $node ) {
				$node->parentNode->removeChild( $node ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			}
		}
		// Strip on* event attributes and any href (plain or namespaced) from all elements.
		$xpath = new \DOMXPath( $dom );
		foreach ( iterator_to_array( $xpath->query( '//*[@*]' ) ) as $el ) {
			if ( ! $el instanceof \DOMElement ) {
				continue;
			}
			$attrs_to_remove = array();
			foreach ( $el->attributes as $attr ) {
				$attr_name = strtolower( $attr->name );
				if ( 0 === stripos( $attr_name, 'on' ) || 'href' === $attr_name || 'xlink:href' === $attr_name ) {
					$attrs_to_remove[] = $attr->name;
				}
			}
			foreach ( $attrs_to_remove as $name ) {
				$el->removeAttribute( $name );
			}
		}
	}

	/**
	 * Renders a terms and conditions field.
	 *
	 * @param string $field_name Field input name.
	 * @param string $content    Terms copy.
	 * @param bool   $required   Required flag.
	 * @return string
	 */
	private function render_terms_field( $field_name, $content, $required ) {
		$required_attr = $required ? ' required' : '';
		ob_start();
		?>
		<div class="boldform-lite-form__field boldform-lite-form__field--terms_conditions">
			<label class="boldform-lite-form__choice boldform-lite-form__terms">
				<input type="checkbox" name="<?php echo esc_attr( $field_name ); ?>" value="1"<?php echo esc_attr( $required_attr ); ?>>
				<span class="boldform-lite-form__choice-control" aria-hidden="true"></span>
				<span class="boldform-lite-form__choice-label">
					<?php if ( '' !== $content ) : ?>
						<span class="boldform-lite-form__terms-copy"><?php echo wp_kses_post( $content ); ?></span>
					<?php endif; ?>
				</span>
			</label>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Returns the allowed HTML tags and attributes for form field output.
	 *
	 * Used with wp_kses() when echoing render_field() or filtered field HTML
	 * to satisfy WordPress.org escaping requirements while preserving all
	 * necessary form elements (input, select, textarea, svg, etc.).
	 *
	 * @return array<string, array<string, bool>>
	 */
	/**
	 * Renders a BoldForm custom dropdown: the hidden native <select> (for submit)
	 * plus the `.bf-select` widget markup that Lite's frontend JS upgrades.
	 *
	 * This is the single source of truth for the custom select so add-ons (BoldForm
	 * Pro — payment "product" selects, repeater sub-selects) render an identical,
	 * theme-consistent control instead of a bare native <select>. Static so callers
	 * need no shortcode instance. Output is the same markup Lite's own select fields
	 * emit, so it must be echoed through the same `get_field_kses_allowed()` allowlist.
	 *
	 * @param array<string, mixed> $args {
	 *     @type string       $id          Element id for the native <select>.
	 *     @type string       $name        Submit name (without trailing []; added when multiple).
	 *     @type array|string $options     Option values (trimmed; empties dropped).
	 *     @type string|array $selected    Selected value(s); CSV string or array.
	 *     @type string       $placeholder Placeholder text.
	 *     @type bool         $multiple    Multi-select.
	 *     @type bool         $searchable  Show the in-panel search box (single only).
	 *     @type bool         $required    Convey required-ness via aria-required on the trigger.
	 *     @type string       $labelledby  Visible-label id for aria-labelledby (preferred).
	 *     @type string       $aria_label  Fallback accessible name when no visible label.
	 * }
	 * @return string
	 */
	public static function render_custom_select( array $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'id'          => '',
				'name'        => '',
				'options'     => array(),
				'selected'    => '',
				'placeholder' => '',
				'multiple'    => false,
				'searchable'  => false,
				'required'    => false,
				'labelledby'  => '',
				'aria_label'  => '',
			)
		);

		$id            = (string) $args['id'];
		$name          = (string) $args['name'];
		$placeholder   = (string) $args['placeholder'];
		$is_multiple   = (bool) $args['multiple'];
		$is_searchable = (bool) $args['searchable'];
		$required      = (bool) $args['required'];

		if ( is_array( $args['selected'] ) ) {
			$default_values = array_map( 'trim', array_map( 'strval', $args['selected'] ) );
		} else {
			$default_values = $is_multiple
				? array_map( 'trim', explode( ',', (string) $args['selected'] ) )
				: array( (string) $args['selected'] );
		}

		// Normalize options to { value, label } pairs. Accepts flat strings
		// (value === label, as Lite's own fields pass) OR
		// array( 'value' => …, 'label' => … ) entries (e.g. Pro payment products
		// that submit a plain value but display "Plan — $29.00").
		$opts       = array();
		$opt_values = array();
		$opt_labels = array();
		foreach ( (array) $args['options'] as $option ) {
			if ( is_array( $option ) ) {
				$ov = trim( (string) ( $option['value'] ?? '' ) );
				$ol = (string) ( $option['label'] ?? $ov );
			} else {
				$ov = trim( (string) $option );
				$ol = $ov;
			}
			if ( '' === $ov ) {
				continue;
			}
			$opts[]            = array( 'value' => $ov, 'label' => $ol );
			$opt_values[]      = $ov;
			$opt_labels[ $ov ] = $ol;
		}

		$select_name = $is_multiple ? $name . '[]' : $name;
		$extra_attrs = ' data-boldform-select="1"';
		if ( $is_multiple ) {
			$extra_attrs .= ' multiple data-multiple="1"';
		}
		if ( $is_searchable ) {
			$extra_attrs .= ' data-searchable="1"';
		}

		// Hidden native <select> for form submission. `required` is intentionally
		// omitted (a display:none required control aborts submit with no message);
		// required-ness is on the trigger via aria-required + enforced server-side.
		$html = sprintf(
			'<select id="%1$s" name="%2$s"%3$s style="display:none">',
			esc_attr( $id ),
			esc_attr( $select_name ),
			$extra_attrs
		);

		if ( ! $is_multiple ) {
			$html .= sprintf( '<option value="">%1$s</option>', esc_html( $placeholder ) );
		}

		foreach ( $opts as $o ) {
			$is_selected = in_array( $o['value'], $default_values, true ) ? ' selected' : '';
			$html       .= sprintf(
				'<option value="%1$s"%2$s>%3$s</option>',
				esc_attr( $o['value'] ),
				$is_selected,
				esc_html( $o['label'] )
			);
		}

		$html .= '</select>';

		// Custom select UI (PHP-rendered so it works in Gutenberg SSR / Elementor editor / frontend).
		$wrap_class = 'bf-select' . ( $is_multiple ? ' bf-select--multi' : '' );
		$data_attrs = ' data-boldform-custom-select="1"';
		if ( $is_multiple ) {
			$data_attrs .= ' data-multiple="1"';
		}
		if ( $is_searchable ) {
			$data_attrs .= ' data-searchable="1"';
		}

		$listbox_id = $id . '_listbox';
		$html      .= '<div class="' . esc_attr( $wrap_class ) . '"' . $data_attrs . '>';

		$arrow            = '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';
		$placeholder_text = '' !== $placeholder ? $placeholder : ( $is_multiple ? esc_html__( 'Select options&hellip;', 'boldform-lite' ) : esc_html__( 'Select&hellip;', 'boldform-lite' ) );

		if ( '' !== (string) $args['labelledby'] ) {
			$trigger_name_attr = ' aria-labelledby="' . esc_attr( (string) $args['labelledby'] ) . '"';
		} else {
			$al                = '' !== (string) $args['aria_label'] ? (string) $args['aria_label'] : ( $is_multiple ? __( 'Select options', 'boldform-lite' ) : __( 'Select', 'boldform-lite' ) );
			$trigger_name_attr = ' aria-label="' . esc_attr( $al ) . '"';
		}
		$trigger_aria_attrs = $trigger_name_attr . ' aria-haspopup="listbox" aria-controls="' . esc_attr( $listbox_id ) . '"';
		if ( $required ) {
			$trigger_aria_attrs .= ' aria-required="true"';
		}

		if ( $is_multiple ) {
			$selected_opts = array_filter(
				$default_values,
				function ( $v ) use ( $opt_values ) {
					return '' !== $v && in_array( $v, $opt_values, true );
				}
			);
			if ( empty( $selected_opts ) ) {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
			} else {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__tags">';
				foreach ( $selected_opts as $v ) {
					$tag_label = isset( $opt_labels[ $v ] ) ? $opt_labels[ $v ] : $v;
					$html     .= '<span class="bf-select__tag">' . esc_html( $tag_label ) . '<button type="button" class="bf-select__tag-x" data-val="' . esc_attr( $v ) . '" aria-label="' . esc_attr__( 'Remove', 'boldform-lite' ) . '">&times;</button></span>';
				}
				$html .= '</span>' . $arrow . '</div>';
			}
		} else {
			$selected_val = ! empty( $default_values[0] ) && in_array( $default_values[0], $opt_values, true ) ? $default_values[0] : '';
			if ( $selected_val ) {
				$selected_label = isset( $opt_labels[ $selected_val ] ) ? $opt_labels[ $selected_val ] : $selected_val;
				$html          .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__value">' . esc_html( $selected_label ) . '</span>' . $arrow . '</div>';
			} else {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
			}
		}

		$html .= '<div class="bf-select__panel">';

		if ( $is_searchable ) {
			$search_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
			$html      .= '<div class="bf-select__search-wrap">' . $search_svg . '<input type="text" class="bf-select__panel-search" placeholder="' . esc_attr__( 'Search&hellip;', 'boldform-lite' ) . '" autocomplete="off" aria-label="' . esc_attr__( 'Search', 'boldform-lite' ) . '"></div>';
		}

		$check_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

		$html .= '<div class="bf-select__list" role="listbox" id="' . esc_attr( $listbox_id ) . '">';
		foreach ( $opts as $o ) {
			$is_active    = in_array( $o['value'], $default_values, true );
			$active_class = $is_active ? ' is-active' : '';
			$html        .= '<div class="bf-select__option' . $active_class . '" role="option" aria-selected="' . ( $is_active ? 'true' : 'false' ) . '" data-val="' . esc_attr( $o['value'] ) . '">';
			if ( $is_multiple ) {
				$html .= '<span class="bf-select__check">' . ( $is_active ? $check_svg : '' ) . '</span>';
			}
			$html .= '<span class="bf-select__option-text">' . esc_html( $o['label'] ) . '</span>';
			if ( ! $is_multiple && $is_active ) {
				$html .= '<span class="bf-select__active-mark">' . $check_svg . '</span>';
			}
			$html .= '</div>';
		}
		$html .= '</div>'; // .bf-select__list
		$html .= '</div>'; // .bf-select__panel
		$html .= '</div>'; // .bf-select

		return $html;
	}

	private function get_field_kses_allowed() {
		$global_attrs = array(
			'id'               => true,
			'class'            => true,
			'style'            => true,
			'data-*'           => true,
			// wp_kses() supports a `data-*` wildcard but NOT `aria-*`; each ARIA
			// attribute must be listed explicitly or it is silently stripped on render.
			'aria-label'       => true,
			'aria-hidden'      => true,
			'aria-expanded'    => true,
			'aria-haspopup'    => true,
			'aria-controls'    => true,
			'aria-selected'    => true,
			'aria-describedby' => true,
			'aria-labelledby'  => true,
			'aria-invalid'     => true,
			'aria-required'    => true,
			'aria-live'        => true,
			'aria-multiline'   => true,
			'role'             => true,
			'tabindex'         => true,
			'hidden'           => true,
			'title'            => true,
			'lang'             => true,
			'dir'              => true,
		);

		$allowed = array(
			'div'      => $global_attrs,
			'span'     => $global_attrs,
			'p'        => $global_attrs,
			'label'    => array_merge( $global_attrs, array( 'for' => true ) ),
			'input'    => array_merge(
				$global_attrs,
				array(
					'type'         => true,
					'name'         => true,
					'value'        => true,
					'placeholder'  => true,
					'required'     => true,
					'checked'      => true,
					'disabled'     => true,
					'readonly'     => true,
					'autocomplete' => true,
					'min'          => true,
					'max'          => true,
					'step'         => true,
					'maxlength'    => true,
					'accept'       => true,
					'multiple'     => true,
				)
			),
			'textarea' => array_merge(
				$global_attrs,
				array(
					'name'        => true,
					'placeholder' => true,
					'required'    => true,
					'rows'        => true,
					'cols'        => true,
					'readonly'    => true,
					'disabled'    => true,
					'maxlength'   => true,
				)
			),
			'select'   => array_merge(
				$global_attrs,
				array(
					'name'     => true,
					'required' => true,
					'multiple' => true,
					'disabled' => true,
					'size'     => true,
				)
			),
			'option'   => array(
				'value'    => true,
				'selected' => true,
				'disabled' => true,
			),
			'optgroup' => array( 'label' => true, 'disabled' => true ),
			'button'   => array_merge(
				$global_attrs,
				array(
					'type'     => true,
					'name'     => true,
					'value'    => true,
					'disabled' => true,
				)
			),
			'a'        => array_merge( $global_attrs, array( 'href' => true, 'target' => true, 'rel' => true ) ),
			'strong'   => $global_attrs,
			'em'       => $global_attrs,
			'br'       => array(),
			'ul'       => $global_attrs,
			'ol'       => $global_attrs,
			'li'       => $global_attrs,
			'h1'       => $global_attrs,
			'h2'       => $global_attrs,
			'h3'       => $global_attrs,
			'h4'       => $global_attrs,
			'h5'       => $global_attrs,
			'h6'       => $global_attrs,
			'img'      => array_merge( $global_attrs, array( 'src' => true, 'alt' => true, 'width' => true, 'height' => true ) ),
			'svg'      => array_merge(
				$global_attrs,
				array(
					'xmlns'           => true,
					'viewbox'         => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
					'width'           => true,
					'height'          => true,
					'aria-hidden'     => true,
				)
			),
			'path'     => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true ),
			'polyline' => array( 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true ),
			'line'     => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true ),
			'circle'   => array( 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
			'rect'     => array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true, 'fill' => true, 'stroke' => true ),
			'g'        => array( 'fill' => true, 'stroke' => true, 'transform' => true ),
		);

		/**
		 * Filters the tags/attributes allowed in rendered field-control HTML.
		 *
		 * Lets add-ons (e.g. BoldForm Pro) permit markup their custom field
		 * types need — such as <canvas> (signature pad), table tags (matrix
		 * grids), or a `contenteditable` attribute (rich-text editor) — which
		 * would otherwise be stripped by wp_kses() when the control HTML is
		 * echoed. The array uses the standard wp_kses() allowed-HTML format.
		 *
		 * @since 1.1.0
		 *
		 * @param array<string, array<string, bool>> $allowed Allowed tags => attributes map.
		 */
		return apply_filters( 'boldform_field_kses_allowed', $allowed );
	}

	/**
	 * Renders the form control based on field type.
	 *
	 * @param string                   $type           Field type.
	 * @param string                   $field_name     Field name and ID.
	 * @param string                   $placeholder    Placeholder text.
	 * @param string                   $default        Default value.
	 * @param bool                     $required       Required state.
	 * @param array<int, string|mixed> $options        Choice options.
	 * @param string                   $options_layout 'block' or 'inline'.
	 * @param array<string, mixed>     $field          Full field definition (for type-specific attributes).
	 * @return string
	 */
	private function render_field_control( $type, $field_name, $placeholder, $default, $required, $options, $options_layout = 'block', $field = array() ) {
		$required_attr = $required ? ' required' : '';
		$default       = trim( (string) $default );

		// Element ID base: the submission name plus the per-instance suffix, so a
		// form embedded more than once per page stays collision-free. The `name`
		// attribute keeps using $field_name (no suffix) so the server still reads
		// the same POST key regardless of which embed was submitted.
		$field_id_attr = $field_name . $this->current_instance;

		// Id of the field's visible <label> (minted in render_field() with the same
		// base) so multi-control groups (radio/checkbox, name, custom select) can be
		// associated to it via aria-labelledby. Only valid when a visible label is
		// actually rendered: a non-empty label whose placement is not 'hidden'. The
		// `hide_labels` form setting only hides the label with CSS — the element (and
		// its id) stays in the DOM — so it does NOT suppress the association.
		$control_label      = isset( $field['label'] ) ? (string) $field['label'] : '';
		$control_label_pos  = isset( $field['label_placement'] ) && in_array( $field['label_placement'], array( 'top', 'left', 'right', 'bottom', 'hidden' ), true ) ? $field['label_placement'] : 'top';
		$has_visible_label  = ( '' !== $control_label && 'hidden' !== $control_label_pos );
		$label_id           = $field_id_attr . '-label';
		$group_labelledby   = $has_visible_label ? ' aria-labelledby="' . esc_attr( $label_id ) . '"' : '';

		// When no custom placeholder is set, fall back to the field label so simple
		// inputs (text/email/tel/url/number/textarea) show guidance text instead of a
		// bare box — mirroring the built-in placeholders on name/address/select fields.
		// Only the free-text branches below use $label_ph; select/country/date keep
		// their own contextual defaults from the raw $placeholder.
		$label_ph = ( '' !== $placeholder )
			? $placeholder
			: ( isset( $field['label'] ) ? (string) $field['label'] : '' );

		// Structured name field (first / middle / last). Rendered through the shared wrapper
		// so it gets the same required-error and conditional-logic attributes as every other field.
		if ( 'name' === $type ) {
			$show_middle = ! isset( $field['show_middle_name'] ) || ! empty( $field['show_middle_name'] );
			$show_last   = ! isset( $field['show_last_name'] ) || ! empty( $field['show_last_name'] );

			// Group the composite parts under the field's visible <label> so SRs
			// announce them as one labelled group (no <fieldset>/<legend>). Each
			// part input also carries its own aria-label (its visible sub-label text)
			// since the sub-label <span> is not programmatically associated.
			$html  = '<div class="boldform-lite-name" role="group"' . $group_labelledby . '><div class="boldform-lite-name__field">';
			$html .= sprintf(
				'<input type="text" id="%1$s" name="%2$s[first]" placeholder="%3$s" aria-label="%5$s"%4$s>',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				esc_attr__( 'First Name', 'boldform-lite' ),
				$required_attr,
				esc_attr__( 'First Name', 'boldform-lite' )
			);
			$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'First Name', 'boldform-lite' ) . '</span></div>';

			if ( $show_middle ) {
				$html .= '<div class="boldform-lite-name__field">';
				$html .= sprintf(
					'<input type="text" id="%1$s_middle" name="%2$s[middle]" placeholder="%3$s" aria-label="%4$s">',
					esc_attr( $field_id_attr ),
					esc_attr( $field_name ),
					esc_attr__( 'Middle Name', 'boldform-lite' ),
					esc_attr__( 'Middle Name', 'boldform-lite' )
				);
				$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'Middle Name', 'boldform-lite' ) . '</span></div>';
			}

			if ( $show_last ) {
				$html .= '<div class="boldform-lite-name__field">';
				$html .= sprintf(
					'<input type="text" id="%1$s_last" name="%2$s[last]" placeholder="%3$s" aria-label="%5$s"%4$s>',
					esc_attr( $field_id_attr ),
					esc_attr( $field_name ),
					esc_attr__( 'Last Name', 'boldform-lite' ),
					$required_attr,
					esc_attr__( 'Last Name', 'boldform-lite' )
				);
				$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'Last Name', 'boldform-lite' ) . '</span></div>';
			}

			return $html . '</div>';
		}

		// Choice-based fields need custom markup, while simple inputs can be rendered from one format string.
		if ( 'textarea' === $type ) {
			return sprintf(
				'<textarea id="%1$s" name="%2$s" placeholder="%3$s"%4$s>%5$s</textarea>',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				esc_attr( $label_ph ),
				$required_attr,
				esc_textarea( $default )
			);
		}

		if ( 'select' === $type || 'multiselect' === $type ) {
			return self::render_custom_select(
				array(
					'id'          => $field_id_attr,
					'name'        => $field_name,
					'options'     => $options,
					'selected'    => $default,
					'placeholder' => $placeholder,
					'multiple'    => 'multiselect' === $type,
					'searchable'  => 'multiselect' !== $type && ! empty( $field['select_searchable'] ),
					'required'    => (bool) $required,
					'labelledby'  => $has_visible_label ? $label_id : '',
					'aria_label'  => isset( $field['label'] ) ? (string) $field['label'] : '',
				)
			);
		}

		if ( 'checkbox' === $type || 'radio' === $type ) {
			$checkbox_style = isset( $field['checkbox_style'] ) ? (string) $field['checkbox_style'] : 'default';
			$choices_class  = 'boldform-lite-form__choices' . ( 'inline' === $options_layout ? ' is-inline' : '' ) . ( 'checkbox' === $type && 'switch' === $checkbox_style ? ' is-switch' : '' );
			// Group semantics so SRs announce the option set as one labelled group
			// (no <fieldset>/<legend>, which would restyle the form). Points at the
			// field's visible <label> via aria-labelledby when one is rendered.
			$html           = '<div class="' . esc_attr( $choices_class ) . '" role="group"' . $group_labelledby . '>';
			$default_values = 'checkbox' === $type ? array_map( 'trim', explode( ',', $default ) ) : array( $default );

			foreach ( $this->normalize_options( $options ) as $option_index => $option ) {
				$choice_id = $field_id_attr . '_' . $option_index;
				$name_attr = 'checkbox' === $type ? $field_name . '[]' : $field_name;
				$checked   = in_array( $option, $default_values, true ) ? ' checked' : '';

				$html .= sprintf(
					'<label class="boldform-lite-form__choice" for="%1$s"><input id="%1$s" type="%2$s" name="%3$s" value="%4$s"%5$s%6$s><span class="boldform-lite-form__choice-control" aria-hidden="true"></span><span class="boldform-lite-form__choice-label">%7$s</span></label>',
					esc_attr( $choice_id ),
					esc_attr( $type ),
					esc_attr( $name_attr ),
					esc_attr( $option ),
					$checked,
					$required_attr,
					esc_html( $option )
				);
			}

			$html .= '</div>';

			return $html;
		}

		if ( 'file' === $type ) {
			$accept      = isset( $field['allowed_types'] ) && '' !== $field['allowed_types'] ? (string) $field['allowed_types'] : '';
			$accept_attr = '' !== $accept ? ' accept="' . esc_attr( $accept ) . '"' : '';
			$file_hint   = __( 'Choose file or drag & drop', 'boldform-lite' );
			// Static inline SVG (no dashicons dependency on the front-end).
			$file_icon   = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';
			return sprintf(
				'<div class="boldform-lite-form__file"><input id="%1$s" type="file" name="%2$s" class="boldform-lite-form__file-input"%3$s%4$s><span class="boldform-lite-form__file-icon">%5$s</span><span class="boldform-lite-form__file-text" data-placeholder="%6$s">%7$s</span></div>',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				$accept_attr,
				$required_attr,
				$file_icon,
				esc_attr( $file_hint ),
				esc_html( $file_hint )
			);
		}

		// Date and time fields: render as text with a hidden native picker for cross-browser consistency.
		if ( 'date' === $type || 'time' === $type ) {
			$placeholder = $placeholder ? $placeholder : ( 'date' === $type ? __( 'Select date', 'boldform-lite' ) : __( 'Select time', 'boldform-lite' ) );

			return sprintf(
				'<input id="%1$s" type="text" name="%2$s" placeholder="%3$s" value="%4$s" data-boldform-picker="%5$s" readonly%6$s>',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				esc_attr( $placeholder ),
				esc_attr( $default ),
				esc_attr( $type ),
				$required_attr
			);
		}


		if ( 'input_mask' === $type ) {
			$mask = isset( $field['mask_pattern'] ) ? (string) $field['mask_pattern'] : '';
			// Placeholder > mask pattern > field label, so the field is never bare.
			$mask_ph = ( '' !== $placeholder ) ? $placeholder : ( '' !== $mask ? $mask : $label_ph );
			return sprintf(
				'<input type="text" id="%1$s" name="%2$s" placeholder="%3$s" value="%4$s"%5$s data-mask="%6$s">',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				esc_attr( $mask_ph ),
				esc_attr( $default ),
				$required_attr,
				esc_attr( $mask )
			);
		}

		if ( 'numeric' === $type ) {
			$minv = isset( $field['min_value'] ) ? (string) $field['min_value'] : '';
			$maxv = isset( $field['max_value'] ) ? (string) $field['max_value'] : '';
			$min  = '' !== $minv ? ' min="' . esc_attr( $minv ) . '"' : '';
			$max  = '' !== $maxv ? ' max="' . esc_attr( $maxv ) . '"' : '';
			$step = isset( $field['step_value'] ) && '' !== $field['step_value'] ? ' step="' . esc_attr( $field['step_value'] ) . '"' : '';

			// Placeholder > "min - max" range hint (when bounded) > field label.
			$num_ph = $placeholder;
			if ( '' === $num_ph && ( '' !== $minv || '' !== $maxv ) ) {
				$num_ph = ( '' !== $minv ? $minv : '0' ) . ' - ' . ( '' !== $maxv ? $maxv : '...' );
			}
			if ( '' === $num_ph ) {
				$num_ph = $label_ph;
			}

			return sprintf(
				'<input type="number" id="%1$s" name="%2$s" placeholder="%3$s" value="%4$s"%5$s%6$s%7$s%8$s>',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name ),
				esc_attr( $num_ph ),
				esc_attr( $default ),
				$required_attr,
				$min,
				$max,
				$step
			);
		}

		if ( 'address' === $type ) {
			$af          = isset( $field['address_fields'] ) && is_array( $field['address_fields'] ) ? $field['address_fields'] : array();
			$addr_order  = isset( $field['address_order'] ) && is_array( $field['address_order'] ) ? $field['address_order'] : array( 'street', 'city', 'state', 'zip', 'country' );
			$addr_labels = array(
				'street'  => __( 'Street Address', 'boldform-lite' ),
				'city'    => __( 'City', 'boldform-lite' ),
				'state'   => __( 'State / Province', 'boldform-lite' ),
				'zip'     => __( 'ZIP / Postal Code', 'boldform-lite' ),
				'country' => __( 'Country', 'boldform-lite' ),
			);

			// Get enabled fields in order.
			$enabled = array();
			foreach ( $addr_order as $key ) {
				if ( ! isset( $af[ $key ] ) || ! empty( $af[ $key ] ) ) {
					$enabled[] = $key;
				}
			}

			$html = '<div class="boldform-lite-address">';

			// Render in exact order. Street = full width row, others pair up in sequence.
			$pair_buffer = array();
			foreach ( $enabled as $key ) {
				if ( 'street' === $key ) {
					// Flush pending pair first.
					if ( ! empty( $pair_buffer ) ) {
						$row_class = count( $pair_buffer ) === 2 ? ' boldform-lite-address__row--half' : '';
						$html .= '<div class="boldform-lite-address__row' . $row_class . '">';
						foreach ( $pair_buffer as $pk ) {
							$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%3$s[%2$s]" placeholder="%4$s">', esc_attr( $field_id_attr ), esc_attr( $pk ), esc_attr( $field_name ), esc_attr( $addr_labels[ $pk ] ) );
						}
						$html .= '</div>';
						$pair_buffer = array();
					}
					$html .= sprintf(
						'<div class="boldform-lite-address__row"><input type="text" id="%1$s_%2$s" name="%3$s[%2$s]" placeholder="%4$s"%5$s></div>',
						esc_attr( $field_id_attr ),
						esc_attr( $key ),
						esc_attr( $field_name ),
						esc_attr( $addr_labels[ $key ] ),
						$required_attr
					);
				} else {
					$pair_buffer[] = $key;
					if ( count( $pair_buffer ) === 2 ) {
						$html .= '<div class="boldform-lite-address__row boldform-lite-address__row--half">';
						foreach ( $pair_buffer as $pk ) {
							$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%3$s[%2$s]" placeholder="%4$s">', esc_attr( $field_id_attr ), esc_attr( $pk ), esc_attr( $field_name ), esc_attr( $addr_labels[ $pk ] ) );
						}
						$html .= '</div>';
						$pair_buffer = array();
					}
				}
			}
			// Flush remaining single field.
			if ( ! empty( $pair_buffer ) ) {
				$html .= '<div class="boldform-lite-address__row">';
				foreach ( $pair_buffer as $pk ) {
					$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%3$s[%2$s]" placeholder="%4$s">', esc_attr( $field_id_attr ), esc_attr( $pk ), esc_attr( $field_name ), esc_attr( $addr_labels[ $pk ] ) );
				}
				$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
		}

		if ( 'country' === $type ) {
			$countries       = $this->get_country_list();
			$placeholder_text = $placeholder ? $placeholder : __( 'Select a country', 'boldform-lite' );

			// Hidden native <select> for form submission. `required` is intentionally
			// omitted (see the select branch above): a display:none required control
			// makes browsers abort submit silently. Required-ness is conveyed via
			// aria-required on the visible trigger and enforced server-side.
			$html = sprintf(
				'<select id="%1$s" name="%2$s" data-boldform-select="1" data-searchable="1" style="display:none">',
				esc_attr( $field_id_attr ),
				esc_attr( $field_name )
			);
			$html .= sprintf( '<option value="">%s</option>', esc_html( $placeholder_text ) );
			foreach ( $countries as $code => $name ) {
				$sel = $default === $code ? ' selected' : '';
				$html .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $code ), $sel, esc_html( $name ) );
			}
			$html .= '</select>';

			// Custom select UI rendered in PHP.
			$arrow     = '<span class="bf-select__arrow"></span>';
			$check_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
			$search_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

			$selected_name = '';
			if ( $default && isset( $countries[ $default ] ) ) {
				$selected_name = $countries[ $default ];
			}

			$country_required_attr = $required ? ' aria-required="true"' : '';
			// Associate the operable trigger with the field's visible <label> (which
			// `for=`-targets the hidden native <select>) so the name is announced on the
			// real control. Falls back to an aria-label when no visible label exists.
			if ( $has_visible_label ) {
				$country_required_attr .= ' aria-labelledby="' . esc_attr( $label_id ) . '"';
			} else {
				$country_label = isset( $field['label'] ) ? (string) $field['label'] : '';
				$country_required_attr .= ' aria-label="' . ( '' !== $country_label ? esc_attr( $country_label ) : esc_attr__( 'Select a country', 'boldform-lite' ) ) . '"';
			}
			$html .= '<div class="bf-select" data-boldform-custom-select="1" data-searchable="1">';
			if ( $selected_name ) {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $country_required_attr . '><span class="bf-select__value">' . esc_html( $selected_name ) . '</span>' . $arrow . '</div>';
			} else {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $country_required_attr . '><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
			}

			$html .= '<div class="bf-select__panel">';
			$html .= '<div class="bf-select__search-wrap">' . $search_svg . '<input type="text" class="bf-select__panel-search" placeholder="' . esc_attr__( 'Search&hellip;', 'boldform-lite' ) . '" autocomplete="off"></div>';
			$html .= '<div class="bf-select__list" role="listbox">';
			foreach ( $countries as $code => $name ) {
				$is_active    = $default === $code;
				$active_class = $is_active ? ' is-active' : '';
				$html .= '<div class="bf-select__option' . $active_class . '" role="option" aria-selected="' . ( $is_active ? 'true' : 'false' ) . '" data-val="' . esc_attr( $code ) . '">';
				$html .= '<span class="bf-select__option-text">' . esc_html( $name ) . '</span>';
				if ( $is_active ) {
					$html .= '<span class="bf-select__active-mark">' . $check_svg . '</span>';
				}
				$html .= '</div>';
			}
			$html .= '</div>'; // .bf-select__list
			$html .= '</div>'; // .bf-select__panel
			$html .= '</div>'; // .bf-select

			return $html;
		}

		if ( 'star_rating' === $type ) {
			$max        = isset( $field['max_stars'] ) && $field['max_stars'] > 0 ? (int) $field['max_stars'] : 5;
			$def        = (int) $default;
			$star_color    = ! empty( $field['star_color'] ) && sanitize_hex_color( (string) $field['star_color'] ) ? sanitize_hex_color( (string) $field['star_color'] ) : '';
			$star_inactive = ! empty( $field['star_inactive_color'] ) && sanitize_hex_color( (string) $field['star_inactive_color'] ) ? sanitize_hex_color( (string) $field['star_inactive_color'] ) : '';
			$star_size     = ! empty( $field['star_size'] ) ? (int) $field['star_size'] : 20;
			// Emit each --bf-star-* only for a custom value; otherwise the CSS falls back
			// (active → theme accent --bf-button-bg, inactive → a tint of the active, and
			// hover → the active colour since no separate hover var is emitted).
			$star_style = '--bf-star-size:' . $star_size . 'px';
			if ( '' !== $star_color ) {
				$star_style = '--bf-star-color:' . esc_attr( $star_color ) . ';' . $star_style;
			}
			if ( '' !== $star_inactive ) {
				$star_style = '--bf-star-inactive:' . esc_attr( $star_inactive ) . ';' . $star_style;
			}
			// `required` is intentionally omitted from this hidden input: a hidden
			// control with `required` is invalid HTML and makes browsers abort submit
			// with a non-focusable-control error. Required-ness is conveyed via
			// aria-required on the visible widget and enforced server-side. data-field
			// targets the hidden input by its (instance-unique) ID, which the rating
			// JS uses to write the selected value back.
			$html = sprintf( '<input type="hidden" id="%1$s" name="%2$s" value="%3$s">', esc_attr( $field_id_attr ), esc_attr( $field_name ), esc_attr( $def ) );
			// Expose the widget as an ARIA radiogroup so it is keyboard- and
			// screen-reader-operable (Arrow/Home/End/Space handled in frontend.js).
			$star_field_label = isset( $field['label'] ) && '' !== (string) $field['label'] ? (string) $field['label'] : __( 'Rating', 'boldform-lite' );
			$html .= '<div class="boldform-lite-star-rating" role="radiogroup" aria-label="' . esc_attr( $star_field_label ) . '"' . ( $required ? ' aria-required="true"' : '' ) . ' data-max="' . $max . '" data-field="' . esc_attr( $field_id_attr ) . '" style="' . $star_style . '">';
			for ( $i = 1; $i <= $max; $i++ ) {
				$active     = $i <= $def ? ' is-active' : '';
				$is_checked = ( $i === $def );
				// Roving tabindex: only one star is in the tab order — the selected one,
				// or the first star when nothing is selected yet.
				$tabindex = ( $is_checked || ( 0 === $def && 1 === $i ) ) ? '0' : '-1';
				$html    .= '<span class="boldform-lite-star' . $active . '" role="radio" aria-checked="' . ( $is_checked ? 'true' : 'false' ) . '" tabindex="' . $tabindex . '"'
					. ' aria-label="' . esc_attr( sprintf( /* translators: %d: star rating value */ _n( '%d star', '%d stars', $i, 'boldform-lite' ), $i ) ) . '"'
					. ' data-value="' . $i . '">&#9733;</span>';
			}
			$html .= '</div>';
			return $html;
		}

		if ( 'slider_range' === $type ) {
			$min          = isset( $field['min_value'] ) && '' !== $field['min_value'] ? (string) $field['min_value'] : '0';
			$max          = isset( $field['max_value'] ) && '' !== $field['max_value'] ? (string) $field['max_value'] : '100';
			$step         = isset( $field['step_value'] ) && '' !== $field['step_value'] ? (string) $field['step_value'] : '1';
			$slider_color = ! empty( $field['slider_color'] ) && sanitize_hex_color( (string) $field['slider_color'] ) ? sanitize_hex_color( (string) $field['slider_color'] ) : '';
			$slider_h     = ! empty( $field['slider_height'] ) ? (int) $field['slider_height'] : '';
			$sl_style     = '';
			if ( $slider_color ) {
				$sl_style .= '--bf-slider-color:' . esc_attr( $slider_color ) . ';';
			}
			if ( $slider_h ) {
				$sl_style .= '--bf-slider-height:' . $slider_h . 'px;';
			}

			// Dual-handle: two thumbs (min + max). The submitted value lives in a
			// hidden input as "lo - hi"; the range inputs are UI only and combined
			// by the frontend JS. Single-handle keeps the original markup below.
			if ( ! empty( $field['dual_handle'] ) ) {
				$span = (float) $max - (float) $min;
				// With no explicit default, start the handles at a representative
				// sub-range (25%–75%) so the slider reads as a range instead of a
				// fully-filled "everything selected" track. This also makes the
				// static preview in the block/Elementor editors look correct
				// without the frontend JS running. A "lo - hi" default overrides it.
				$lo = $span > 0 ? (string) round( (float) $min + ( $span * 0.25 ) ) : $min;
				$hi = $span > 0 ? (string) round( (float) $min + ( $span * 0.75 ) ) : $max;
				if ( '' !== $default && false !== strpos( $default, ' - ' ) ) {
					$pair = array_map( 'trim', explode( ' - ', $default, 2 ) );
					if ( is_numeric( $pair[0] ) && isset( $pair[1] ) && is_numeric( $pair[1] ) ) {
						$lo = $pair[0];
						$hi = $pair[1];
					}
				}
				$fill_left = $span > 0 ? ( ( (float) $lo - (float) $min ) / $span * 100 ) : 0;
				$fill_w    = $span > 0 ? ( ( (float) $hi - (float) $lo ) / $span * 100 ) : 0;

				$html  = '<div class="boldform-lite-slider boldform-lite-slider--dual"' . ( $sl_style ? ' style="' . $sl_style . '"' : '' ) . '>';
				$html .= '<div class="boldform-lite-slider__track">';
				$html .= '<div class="boldform-lite-slider__fill" style="left:' . esc_attr( (string) $fill_left ) . '%;width:' . esc_attr( (string) $fill_w ) . '%"></div>';
				$html .= sprintf(
					'<input type="range" class="boldform-lite-slider__input boldform-lite-slider__input--min" min="%1$s" max="%2$s" step="%3$s" value="%4$s" aria-label="%5$s">',
					esc_attr( $min ), esc_attr( $max ), esc_attr( $step ), esc_attr( $lo ), esc_attr__( 'Minimum', 'boldform-lite' )
				);
				$html .= sprintf(
					'<input type="range" class="boldform-lite-slider__input boldform-lite-slider__input--max" min="%1$s" max="%2$s" step="%3$s" value="%4$s" aria-label="%5$s">',
					esc_attr( $min ), esc_attr( $max ), esc_attr( $step ), esc_attr( $hi ), esc_attr__( 'Maximum', 'boldform-lite' )
				);
				$html .= '</div>';
				$html .= sprintf(
					'<input type="hidden" id="%1$s" name="%2$s" value="%3$s">',
					esc_attr( $field_id_attr ), esc_attr( $field_name ), esc_attr( $lo . ' - ' . $hi )
				);
				$html .= '<div class="boldform-lite-slider__labels"><span>' . esc_html( $min ) . '</span><span class="boldform-lite-slider__value">' . esc_html( $lo . ' – ' . $hi ) . '</span><span>' . esc_html( $max ) . '</span></div>';
				$html .= '</div>';
				return $html;
			}

			$def   = '' !== $default ? $default : $min;
			$html  = '<div class="boldform-lite-slider"' . ( $sl_style ? ' style="' . $sl_style . '"' : '' ) . '>';
			$html .= sprintf(
				'<input type="range" id="%1$s" name="%2$s" min="%3$s" max="%4$s" step="%5$s" value="%6$s"%7$s>',
				esc_attr( $field_id_attr ), esc_attr( $field_name ), esc_attr( $min ), esc_attr( $max ), esc_attr( $step ), esc_attr( $def ), $required_attr
			);
			$html .= '<div class="boldform-lite-slider__labels"><span>' . esc_html( $min ) . '</span><span class="boldform-lite-slider__value">' . esc_html( $def ) . '</span><span>' . esc_html( $max ) . '</span></div>';
			$html .= '</div>';
			return $html;
		}

		// Unknown/pro field types — return empty so the boldform_field_control_html
		// filter can provide the markup.  Without Pro the field renders empty.
		$allowed_input_types = array( 'text', 'email', 'number', 'tel', 'url' );
		if ( ! in_array( $type, $allowed_input_types, true ) ) {
			return '';
		}

		$input_type = $type;

		return sprintf(
			'<input id="%1$s" type="%2$s" name="%3$s" placeholder="%4$s" value="%5$s"%6$s>',
			esc_attr( $field_id_attr ),
			esc_attr( $input_type ),
			esc_attr( $field_name ),
			esc_attr( $label_ph ),
			esc_attr( $default ),
			$required_attr
		);
	}

	/**
	 * Normalizes select, checkbox, and radio options.
	 *
	 * @param array<int, string|mixed> $options Raw option values.
	 * @return array<int, string>
	 */
	private function normalize_options( $options ) {
		$normalized = array();

		foreach ( $options as $option ) {
			$option = trim( (string) $option );

			if ( '' !== $option ) {
				$normalized[] = $option;
			}
		}

		return $normalized;
	}

	/**
	 * Returns a redirect-based status message for the current form.
	 *
	 * @param int $form_id Form ID.
	 * @return array<string, string>|null
	 */
	private function get_form_status_message( $form_id ) {
		if ( null === $this->status_message ) {
			$this->status_message = $this->consume_status_message();
		}

		// Only show redirect messages on the form instance that initiated the submission.
		if ( ! is_array( $this->status_message ) || $form_id !== $this->status_message['form_id'] ) {
			return null;
		}

		return $this->status_message;
	}

	/**
	 * Reads and clears the stored status message for this request.
	 *
	 * The message is looked up by a single-use token rather than read out of the URL:
	 * the query string is visitor-controlled, so a message taken from it could only ever
	 * be printed as escaped text -- which would strip the rich thank-you markup -- and
	 * would let anyone put arbitrary wording on the page with a crafted link. The token
	 * is consumed on read so a shared or revisited URL cannot replay the message.
	 *
	 * The result is cached on the instance because the token is spent on first read and
	 * the same form may be rendered more than once per page.
	 *
	 * @return array<string, mixed>|false Status message, or false when there is none.
	 */
	private function consume_status_message() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only display of a redirect result; no data is modified.
		$token = isset( $_GET['boldform_msg'] ) ? sanitize_key( wp_unslash( $_GET['boldform_msg'] ) ) : '';

		if ( '' === $token ) {
			return false;
		}

		$stored = get_transient( 'boldform_lite_msg_' . $token );

		if ( ! is_array( $stored ) || empty( $stored['message'] ) ) {
			return false;
		}

		delete_transient( 'boldform_lite_msg_' . $token );

		return array(
			'type'    => isset( $stored['type'] ) && 'success' === $stored['type'] ? 'success' : 'error',
			'message' => (string) $stored['message'],
			'form_id' => isset( $stored['form_id'] ) ? (int) $stored['form_id'] : 0,
		);
	}

	/**
	 * Localizes shared frontend script data onto the registered handle.
	 *
	 * Called from register_assets() (on wp_enqueue_scripts) so the data is bound to the
	 * script at registration and always prints with it — no dependency on render() timing,
	 * which is unreliable in block/FSE themes that can render content more than once.
	 *
	 * @return void
	 */
	private function localize_frontend_script() {
		wp_localize_script(
			'boldform-lite-frontend',
			'boldformLiteFrontend',
			array(
				'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
				'ajaxAction'     => 'boldform_lite_submit_form',
				'submittingText' => __( 'Submitting...', 'boldform-lite' ),
				'successText'    => __( 'Form submitted successfully.', 'boldform-lite' ),
				'errorText'      => __( 'Unable to submit the form.', 'boldform-lite' ),
				'invalidEmail'   => __( 'Please enter a valid email address.', 'boldform-lite' ),
			)
		);
	}

	/**
	 * Returns the configured form style mode.
	 *
	 * @return string 'plugin' or 'theme'.
	 */
	private function get_form_style_mode() {
		$saved = get_option( 'boldform_lite_settings', array() );

		if ( is_array( $saved ) && isset( $saved['form_style_mode'] ) && 'theme' === $saved['form_style_mode'] ) {
			return 'theme';
		}

		return 'plugin';
	}

	/**
	 * Determines whether the form is being rendered inside a page-builder editor
	 * preview (Gutenberg block ServerSideRender or the Elementor editor/preview),
	 * as opposed to a real frontend request.
	 *
	 * The preview renders the live markup so the user can see styling, but it must
	 * not actually accept submissions — those would create real entries and fire
	 * notifications/integrations from inside the editor.
	 *
	 * @return bool
	 */
	private function is_editor_preview() {
		// Gutenberg blocks render their preview through the REST block-renderer;
		// genuine frontend submissions go through admin-ajax, never REST.
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return true;
		}

		// Elementor editor canvas / preview iframe.
		if ( class_exists( '\Elementor\Plugin' ) ) {
			$elementor = \Elementor\Plugin::instance();

			if ( ! empty( $elementor->preview ) && method_exists( $elementor->preview, 'is_preview_mode' ) && $elementor->preview->is_preview_mode() ) {
				return true;
			}

			if ( ! empty( $elementor->editor ) && method_exists( $elementor->editor, 'is_edit_mode' ) && $elementor->editor->is_edit_mode() ) {
				return true;
			}
		}

		// BoldForm's own "Preview Form" admin screen (admin.php?page=boldform-lite-preview).
		if ( is_admin() ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- reading the current admin page slug for context detection only; nothing is processed or changed.
			$admin_page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
			if ( 'boldform-lite-preview' === $admin_page ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Builds inline CSS variables for frontend form styling.
	 *
	 * @param array<string, mixed> $settings Form settings.
	 * @return string
	 */
	private function build_form_style_variables( $settings ) {
		$field_size = isset( $settings['field_size'] ) ? (string) $settings['field_size'] : '';
		$label_size = isset( $settings['label_size'] ) ? (string) $settings['label_size'] : '';
		$button_size = isset( $settings['button_size'] ) ? (string) $settings['button_size'] : '';
		$field_style = isset( $settings['field_style'] ) ? (string) $settings['field_style'] : '';
		$size_map = array(
			'small'       => array( 'field_y' => '10px', 'field_x' => '12px', 'field_font' => '14px', 'label_font' => '14px', 'button_y' => '10px', 'button_x' => '16px', 'button_font' => '14px' ),
			'medium'      => array( 'field_y' => '12px', 'field_x' => '14px', 'field_font' => '15px', 'label_font' => '16px', 'button_y' => '12px', 'button_x' => '18px', 'button_font' => '15px' ),
			'large'       => array( 'field_y' => '15px', 'field_x' => '16px', 'field_font' => '16px', 'label_font' => '18px', 'button_y' => '14px', 'button_x' => '20px', 'button_font' => '16px' ),
			'compact'     => array( 'field_y' => '10px', 'field_x' => '12px', 'field_font' => '14px', 'label_font' => '14px', 'button_y' => '10px', 'button_x' => '16px', 'button_font' => '14px' ),
			'comfortable' => array( 'field_y' => '12px', 'field_x' => '14px', 'field_font' => '15px', 'label_font' => '16px', 'button_y' => '12px', 'button_x' => '18px', 'button_font' => '15px' ),
			'spacious'    => array( 'field_y' => '15px', 'field_x' => '16px', 'field_font' => '16px', 'label_font' => '18px', 'button_y' => '14px', 'button_x' => '20px', 'button_font' => '16px' ),
		);
		$field_scale = isset( $size_map[ $field_size ] ) ? $size_map[ $field_size ] : null;
		$label_scale = isset( $size_map[ $label_size ] ) ? $size_map[ $label_size ] : null;
		$button_scale = isset( $size_map[ $button_size ] ) ? $size_map[ $button_size ] : null;
		$variables = array();

		if ( in_array( $field_style, array( 'outline', 'soft', 'minimal' ), true ) ) {
			$field_style = 'solid';
		}

		if ( '' !== $field_style ) {
			$variables[] = '--bf-field-border-style:' . ( 'none' === $field_style ? 'none' : $field_style );
		}
		if ( isset( $settings['field_border_width'] ) && '' !== $settings['field_border_width'] ) {
			$variables[] = '--bf-field-border-width:' . (int) $settings['field_border_width'] . 'px';
		}
		if ( isset( $settings['field_border_radius'] ) && '' !== $settings['field_border_radius'] ) {
			$variables[] = '--bf-field-radius:' . (int) $settings['field_border_radius'] . 'px';
		}
		if ( ! empty( $settings['field_background_color'] ) ) {
			$variables[] = '--bf-field-bg:' . (string) $settings['field_background_color'];
		}
		if ( ! empty( $settings['field_border_color'] ) ) {
			$variables[] = '--bf-field-border:' . (string) $settings['field_border_color'];
		}
		if ( ! empty( $settings['field_text_color'] ) ) {
			$variables[] = '--bf-field-text:' . (string) $settings['field_text_color'];
		}
		if ( ! empty( $settings['field_focus_color'] ) ) {
			$variables[] = '--bf-focus-color:' . ( 'blue' === ( $settings['field_focus_color'] ?? '' ) ? '#2563eb' : ( 'green' === ( $settings['field_focus_color'] ?? '' ) ? '#16a34a' : ( 'dark' === ( $settings['field_focus_color'] ?? '' ) ? '#334155' : '#0f766e' ) ) );
		}
		if ( ! empty( $settings['label_color'] ) ) {
			$variables[] = '--bf-label-color:' . (string) $settings['label_color'];
		}
		if ( ! empty( $settings['label_subtext_color'] ) ) {
			$variables[] = '--bf-subtext-color:' . (string) $settings['label_subtext_color'];
		}
		if ( ! empty( $settings['error_color'] ) ) {
			$variables[] = '--bf-error-color:' . (string) $settings['error_color'];
		}
		if ( $label_scale ) {
			$variables[] = '--bf-label-font-size:' . $label_scale['label_font'];
		}
		if ( $field_scale ) {
			$variables[] = '--bf-field-padding-y:' . $field_scale['field_y'];
			$variables[] = '--bf-field-padding-x:' . $field_scale['field_x'];
			$variables[] = '--bf-field-font-size:' . $field_scale['field_font'];
		}
		if ( ! empty( $settings['button_border_style'] ) ) {
			$variables[] = '--bf-button-border-style:' . (string) $settings['button_border_style'];
		}
		if ( isset( $settings['button_border_width'] ) && '' !== $settings['button_border_width'] ) {
			$variables[] = '--bf-button-border-width:' . (int) $settings['button_border_width'] . 'px';
		}
		if ( isset( $settings['button_border_radius'] ) && '' !== $settings['button_border_radius'] ) {
			$variables[] = '--bf-button-radius:' . (int) $settings['button_border_radius'] . 'px';
		}
		if ( ! empty( $settings['button_background_color'] ) ) {
			$variables[] = '--bf-button-bg:' . (string) $settings['button_background_color'];
		}
		if ( ! empty( $settings['button_border_color'] ) ) {
			$variables[] = '--bf-button-border:' . (string) $settings['button_border_color'];
		}
		if ( ! empty( $settings['button_text_color'] ) ) {
			$variables[] = '--bf-button-text:' . (string) $settings['button_text_color'];
		}
		if ( $button_scale ) {
			$variables[] = '--bf-button-padding-y:' . $button_scale['button_y'];
			$variables[] = '--bf-button-padding-x:' . $button_scale['button_x'];
			$variables[] = '--bf-button-font-size:' . $button_scale['button_font'];
		}

		return empty( $variables ) ? '' : implode( ';', $variables ) . ';';
	}

	/**
	 * Builds a per-form scoped <style> block carrying the CSS custom properties.
	 *
	 * Replaces the legacy inline style="" attribute so that responsive
	 * (tablet/mobile) overrides can be expressed with media queries — inline
	 * styles cannot. Anchored on the unique wrapper id so repeat embeds of the
	 * same form on one page never bleed into each other.
	 *
	 * @param array<string, mixed> $settings Resolved form settings.
	 * @param string               $scope_id Unique wrapper id (e.g. "boldform-3").
	 * @return string A <style>…</style> string, or '' when there is nothing to emit.
	 */
	private function build_form_style_block( $settings, $scope_id ) {
		$scope = '#' . sanitize_html_class( (string) $scope_id );

		// Desktop layer: legacy flat-key vars (back-compat) + advanced desktop vars.
		$desktop = $this->build_form_style_variables( $settings ) . $this->build_responsive_style_vars( $settings, 'desktop' );
		$tablet  = $this->build_responsive_style_vars( $settings, 'tablet' );
		$mobile  = $this->build_responsive_style_vars( $settings, 'mobile' );

		$css = '';

		if ( '' !== $desktop ) {
			$css .= $scope . '{' . $desktop . '}';
		}
		if ( '' !== $tablet ) {
			$css .= '@media (max-width:1024px){' . $scope . '{' . $tablet . '}}';
		}
		if ( '' !== $mobile ) {
			$css .= '@media (max-width:767px){' . $scope . '{' . $mobile . '}}';
		}

		if ( '' === $css ) {
			return '';
		}

		return '<style>' . $this->sanitize_style_css( $css ) . '</style>';
	}

	/**
	 * Compiles the advanced per-device style vars (and scoped state rules).
	 *
	 * Reads the nested `style` settings array written by the builder's Style tab.
	 * Phase 1 is infrastructure only — the advanced control set is added in later
	 * phases, so this currently returns an empty string until those keys exist.
	 *
	 * @param array<string, mixed> $settings Resolved form settings.
	 * @param string               $device   One of 'desktop', 'tablet', 'mobile'.
	 * @return string A ';'-terminated var string, or '' when nothing is set.
	 */
	private function build_responsive_style_vars( $settings, $device ) {
		if ( empty( $settings['style'] ) || ! is_array( $settings['style'] ) ) {
			return '';
		}
		if ( empty( $settings['style'][ $device ] ) || ! is_array( $settings['style'][ $device ] ) ) {
			return '';
		}

		$vars = array();
		foreach ( $settings['style'][ $device ] as $css_var => $value ) {
			// Keys are stored as the literal custom-property name (e.g. "--bf-form-bg").
			if ( ! is_string( $css_var ) || 0 !== strpos( $css_var, '--bf-' ) ) {
				continue;
			}
			if ( '' === $value || ! is_scalar( $value ) ) {
				continue;
			}
			$vars[] = $css_var . ':' . (string) $value;
		}

		return empty( $vars ) ? '' : implode( ';', $vars ) . ';';
	}

	/**
	 * Defense-in-depth charset filter for the generated style block.
	 *
	 * Every value emitted is already reconstructed from sanitized primitives, but
	 * this strips any character that has no business in our generated CSS — most
	 * importantly `<`/`>` so a malformed value can never break out of the <style>
	 * element (e.g. "</style><script>" collapses to harmless text).
	 *
	 * @param string $css Assembled CSS.
	 * @return string Filtered CSS.
	 */
	private function sanitize_style_css( $css ) {
		return (string) preg_replace( '/[^a-zA-Z0-9#%().,:;{}@\/\s_\-\'"]/', '', (string) $css );
	}

	/**
	 * Returns an associative array of ISO country codes to country names.
	 *
	 * Public static so the admin (e.g. entry detail) can map a stored ISO code
	 * back to its country name without duplicating the list.
	 *
	 * @return array<string, string>
	 */
	public static function get_country_list() {
		return array(
			'AF' => __( 'Afghanistan', 'boldform-lite' ),
			'AL' => __( 'Albania', 'boldform-lite' ),
			'DZ' => __( 'Algeria', 'boldform-lite' ),
			'AD' => __( 'Andorra', 'boldform-lite' ),
			'AO' => __( 'Angola', 'boldform-lite' ),
			'AG' => __( 'Antigua and Barbuda', 'boldform-lite' ),
			'AR' => __( 'Argentina', 'boldform-lite' ),
			'AM' => __( 'Armenia', 'boldform-lite' ),
			'AU' => __( 'Australia', 'boldform-lite' ),
			'AT' => __( 'Austria', 'boldform-lite' ),
			'AZ' => __( 'Azerbaijan', 'boldform-lite' ),
			'BS' => __( 'Bahamas', 'boldform-lite' ),
			'BH' => __( 'Bahrain', 'boldform-lite' ),
			'BD' => __( 'Bangladesh', 'boldform-lite' ),
			'BB' => __( 'Barbados', 'boldform-lite' ),
			'BY' => __( 'Belarus', 'boldform-lite' ),
			'BE' => __( 'Belgium', 'boldform-lite' ),
			'BZ' => __( 'Belize', 'boldform-lite' ),
			'BJ' => __( 'Benin', 'boldform-lite' ),
			'BT' => __( 'Bhutan', 'boldform-lite' ),
			'BO' => __( 'Bolivia', 'boldform-lite' ),
			'BA' => __( 'Bosnia and Herzegovina', 'boldform-lite' ),
			'BW' => __( 'Botswana', 'boldform-lite' ),
			'BR' => __( 'Brazil', 'boldform-lite' ),
			'BN' => __( 'Brunei', 'boldform-lite' ),
			'BG' => __( 'Bulgaria', 'boldform-lite' ),
			'BF' => __( 'Burkina Faso', 'boldform-lite' ),
			'BI' => __( 'Burundi', 'boldform-lite' ),
			'CV' => __( 'Cabo Verde', 'boldform-lite' ),
			'KH' => __( 'Cambodia', 'boldform-lite' ),
			'CM' => __( 'Cameroon', 'boldform-lite' ),
			'CA' => __( 'Canada', 'boldform-lite' ),
			'CF' => __( 'Central African Republic', 'boldform-lite' ),
			'TD' => __( 'Chad', 'boldform-lite' ),
			'CL' => __( 'Chile', 'boldform-lite' ),
			'CN' => __( 'China', 'boldform-lite' ),
			'CO' => __( 'Colombia', 'boldform-lite' ),
			'KM' => __( 'Comoros', 'boldform-lite' ),
			'CG' => __( 'Congo', 'boldform-lite' ),
			'CD' => __( 'Congo (Democratic Republic)', 'boldform-lite' ),
			'CR' => __( 'Costa Rica', 'boldform-lite' ),
			'CI' => __( "Cote d'Ivoire", 'boldform-lite' ),
			'HR' => __( 'Croatia', 'boldform-lite' ),
			'CU' => __( 'Cuba', 'boldform-lite' ),
			'CY' => __( 'Cyprus', 'boldform-lite' ),
			'CZ' => __( 'Czech Republic', 'boldform-lite' ),
			'DK' => __( 'Denmark', 'boldform-lite' ),
			'DJ' => __( 'Djibouti', 'boldform-lite' ),
			'DM' => __( 'Dominica', 'boldform-lite' ),
			'DO' => __( 'Dominican Republic', 'boldform-lite' ),
			'EC' => __( 'Ecuador', 'boldform-lite' ),
			'EG' => __( 'Egypt', 'boldform-lite' ),
			'SV' => __( 'El Salvador', 'boldform-lite' ),
			'GQ' => __( 'Equatorial Guinea', 'boldform-lite' ),
			'ER' => __( 'Eritrea', 'boldform-lite' ),
			'EE' => __( 'Estonia', 'boldform-lite' ),
			'SZ' => __( 'Eswatini', 'boldform-lite' ),
			'ET' => __( 'Ethiopia', 'boldform-lite' ),
			'FJ' => __( 'Fiji', 'boldform-lite' ),
			'FI' => __( 'Finland', 'boldform-lite' ),
			'FR' => __( 'France', 'boldform-lite' ),
			'GA' => __( 'Gabon', 'boldform-lite' ),
			'GM' => __( 'Gambia', 'boldform-lite' ),
			'GE' => __( 'Georgia', 'boldform-lite' ),
			'DE' => __( 'Germany', 'boldform-lite' ),
			'GH' => __( 'Ghana', 'boldform-lite' ),
			'GR' => __( 'Greece', 'boldform-lite' ),
			'GD' => __( 'Grenada', 'boldform-lite' ),
			'GT' => __( 'Guatemala', 'boldform-lite' ),
			'GN' => __( 'Guinea', 'boldform-lite' ),
			'GW' => __( 'Guinea-Bissau', 'boldform-lite' ),
			'GY' => __( 'Guyana', 'boldform-lite' ),
			'HT' => __( 'Haiti', 'boldform-lite' ),
			'HN' => __( 'Honduras', 'boldform-lite' ),
			'HU' => __( 'Hungary', 'boldform-lite' ),
			'IS' => __( 'Iceland', 'boldform-lite' ),
			'IN' => __( 'India', 'boldform-lite' ),
			'ID' => __( 'Indonesia', 'boldform-lite' ),
			'IR' => __( 'Iran', 'boldform-lite' ),
			'IQ' => __( 'Iraq', 'boldform-lite' ),
			'IE' => __( 'Ireland', 'boldform-lite' ),
			'IL' => __( 'Israel', 'boldform-lite' ),
			'IT' => __( 'Italy', 'boldform-lite' ),
			'JM' => __( 'Jamaica', 'boldform-lite' ),
			'JP' => __( 'Japan', 'boldform-lite' ),
			'JO' => __( 'Jordan', 'boldform-lite' ),
			'KZ' => __( 'Kazakhstan', 'boldform-lite' ),
			'KE' => __( 'Kenya', 'boldform-lite' ),
			'KI' => __( 'Kiribati', 'boldform-lite' ),
			'KP' => __( 'Korea (North)', 'boldform-lite' ),
			'KR' => __( 'Korea (South)', 'boldform-lite' ),
			'KW' => __( 'Kuwait', 'boldform-lite' ),
			'KG' => __( 'Kyrgyzstan', 'boldform-lite' ),
			'LA' => __( 'Laos', 'boldform-lite' ),
			'LV' => __( 'Latvia', 'boldform-lite' ),
			'LB' => __( 'Lebanon', 'boldform-lite' ),
			'LS' => __( 'Lesotho', 'boldform-lite' ),
			'LR' => __( 'Liberia', 'boldform-lite' ),
			'LY' => __( 'Libya', 'boldform-lite' ),
			'LI' => __( 'Liechtenstein', 'boldform-lite' ),
			'LT' => __( 'Lithuania', 'boldform-lite' ),
			'LU' => __( 'Luxembourg', 'boldform-lite' ),
			'MG' => __( 'Madagascar', 'boldform-lite' ),
			'MW' => __( 'Malawi', 'boldform-lite' ),
			'MY' => __( 'Malaysia', 'boldform-lite' ),
			'MV' => __( 'Maldives', 'boldform-lite' ),
			'ML' => __( 'Mali', 'boldform-lite' ),
			'MT' => __( 'Malta', 'boldform-lite' ),
			'MH' => __( 'Marshall Islands', 'boldform-lite' ),
			'MR' => __( 'Mauritania', 'boldform-lite' ),
			'MU' => __( 'Mauritius', 'boldform-lite' ),
			'MX' => __( 'Mexico', 'boldform-lite' ),
			'FM' => __( 'Micronesia', 'boldform-lite' ),
			'MD' => __( 'Moldova', 'boldform-lite' ),
			'MC' => __( 'Monaco', 'boldform-lite' ),
			'MN' => __( 'Mongolia', 'boldform-lite' ),
			'ME' => __( 'Montenegro', 'boldform-lite' ),
			'MA' => __( 'Morocco', 'boldform-lite' ),
			'MZ' => __( 'Mozambique', 'boldform-lite' ),
			'MM' => __( 'Myanmar', 'boldform-lite' ),
			'NA' => __( 'Namibia', 'boldform-lite' ),
			'NR' => __( 'Nauru', 'boldform-lite' ),
			'NP' => __( 'Nepal', 'boldform-lite' ),
			'NL' => __( 'Netherlands', 'boldform-lite' ),
			'NZ' => __( 'New Zealand', 'boldform-lite' ),
			'NI' => __( 'Nicaragua', 'boldform-lite' ),
			'NE' => __( 'Niger', 'boldform-lite' ),
			'NG' => __( 'Nigeria', 'boldform-lite' ),
			'MK' => __( 'North Macedonia', 'boldform-lite' ),
			'NO' => __( 'Norway', 'boldform-lite' ),
			'OM' => __( 'Oman', 'boldform-lite' ),
			'PK' => __( 'Pakistan', 'boldform-lite' ),
			'PW' => __( 'Palau', 'boldform-lite' ),
			'PS' => __( 'Palestine', 'boldform-lite' ),
			'PA' => __( 'Panama', 'boldform-lite' ),
			'PG' => __( 'Papua New Guinea', 'boldform-lite' ),
			'PY' => __( 'Paraguay', 'boldform-lite' ),
			'PE' => __( 'Peru', 'boldform-lite' ),
			'PH' => __( 'Philippines', 'boldform-lite' ),
			'PL' => __( 'Poland', 'boldform-lite' ),
			'PT' => __( 'Portugal', 'boldform-lite' ),
			'QA' => __( 'Qatar', 'boldform-lite' ),
			'RO' => __( 'Romania', 'boldform-lite' ),
			'RU' => __( 'Russia', 'boldform-lite' ),
			'RW' => __( 'Rwanda', 'boldform-lite' ),
			'KN' => __( 'Saint Kitts and Nevis', 'boldform-lite' ),
			'LC' => __( 'Saint Lucia', 'boldform-lite' ),
			'VC' => __( 'Saint Vincent and the Grenadines', 'boldform-lite' ),
			'WS' => __( 'Samoa', 'boldform-lite' ),
			'SM' => __( 'San Marino', 'boldform-lite' ),
			'ST' => __( 'Sao Tome and Principe', 'boldform-lite' ),
			'SA' => __( 'Saudi Arabia', 'boldform-lite' ),
			'SN' => __( 'Senegal', 'boldform-lite' ),
			'RS' => __( 'Serbia', 'boldform-lite' ),
			'SC' => __( 'Seychelles', 'boldform-lite' ),
			'SL' => __( 'Sierra Leone', 'boldform-lite' ),
			'SG' => __( 'Singapore', 'boldform-lite' ),
			'SK' => __( 'Slovakia', 'boldform-lite' ),
			'SI' => __( 'Slovenia', 'boldform-lite' ),
			'SB' => __( 'Solomon Islands', 'boldform-lite' ),
			'SO' => __( 'Somalia', 'boldform-lite' ),
			'ZA' => __( 'South Africa', 'boldform-lite' ),
			'SS' => __( 'South Sudan', 'boldform-lite' ),
			'ES' => __( 'Spain', 'boldform-lite' ),
			'LK' => __( 'Sri Lanka', 'boldform-lite' ),
			'SD' => __( 'Sudan', 'boldform-lite' ),
			'SR' => __( 'Suriname', 'boldform-lite' ),
			'SE' => __( 'Sweden', 'boldform-lite' ),
			'CH' => __( 'Switzerland', 'boldform-lite' ),
			'SY' => __( 'Syria', 'boldform-lite' ),
			'TW' => __( 'Taiwan', 'boldform-lite' ),
			'TJ' => __( 'Tajikistan', 'boldform-lite' ),
			'TZ' => __( 'Tanzania', 'boldform-lite' ),
			'TH' => __( 'Thailand', 'boldform-lite' ),
			'TL' => __( 'Timor-Leste', 'boldform-lite' ),
			'TG' => __( 'Togo', 'boldform-lite' ),
			'TO' => __( 'Tonga', 'boldform-lite' ),
			'TT' => __( 'Trinidad and Tobago', 'boldform-lite' ),
			'TN' => __( 'Tunisia', 'boldform-lite' ),
			'TR' => __( 'Turkey', 'boldform-lite' ),
			'TM' => __( 'Turkmenistan', 'boldform-lite' ),
			'TV' => __( 'Tuvalu', 'boldform-lite' ),
			'UG' => __( 'Uganda', 'boldform-lite' ),
			'UA' => __( 'Ukraine', 'boldform-lite' ),
			'AE' => __( 'United Arab Emirates', 'boldform-lite' ),
			'GB' => __( 'United Kingdom', 'boldform-lite' ),
			'US' => __( 'United States', 'boldform-lite' ),
			'UY' => __( 'Uruguay', 'boldform-lite' ),
			'UZ' => __( 'Uzbekistan', 'boldform-lite' ),
			'VU' => __( 'Vanuatu', 'boldform-lite' ),
			'VA' => __( 'Vatican City', 'boldform-lite' ),
			'VE' => __( 'Venezuela', 'boldform-lite' ),
			'VN' => __( 'Vietnam', 'boldform-lite' ),
			'YE' => __( 'Yemen', 'boldform-lite' ),
			'ZM' => __( 'Zambia', 'boldform-lite' ),
			'ZW' => __( 'Zimbabwe', 'boldform-lite' ),
		);
	}
}
