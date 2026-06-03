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
			BOLDFORM_LITE_VERSION
		);

		wp_register_script(
			'boldform-lite-frontend',
			BOLDFORM_LITE_URL . 'assets/js/frontend.js',
			array( 'jquery' ),
			BOLDFORM_LITE_VERSION,
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

		// Keep the first embed as "boldform-{id}" (back-compat); suffix repeats so the
		// wrapper id stays unique when the same form is placed on a page more than once.
		self::$render_counts[ $form_id ] = ( self::$render_counts[ $form_id ] ?? 0 ) + 1;
		$form_uid = 'boldform-' . $form_id . ( self::$render_counts[ $form_id ] > 1 ? '-' . self::$render_counts[ $form_id ] : '' );

		// Output buffering keeps the template readable while still returning a shortcode string.
		ob_start();
		?>
		<div id="<?php echo esc_attr( $form_uid ); ?>" class="boldform-wrap">
		<form
			class="<?php echo esc_attr( $form_class ); ?>"
			style="<?php echo esc_attr( $this->build_form_style_variables( $form_settings ) ); ?>"
			method="post"
			enctype="multipart/form-data"
			data-form-id="<?php echo esc_attr( $form_id ); ?>"
			data-enable-ajax="<?php echo esc_attr( $form_settings['enable_ajax'] ? '1' : '0' ); ?>"
			data-enable-redirect="<?php echo esc_attr( $form_settings['enable_redirect'] ? '1' : '0' ); ?>"
			data-redirect-url="<?php echo ! empty( $form_settings['enable_redirect'] ) ? esc_attr( $form_settings['redirect_url'] ) : ''; ?>"
		>

			<div class="boldform-lite-form__message<?php echo $status ? ' is-visible is-' . esc_attr( $status['type'] ) : ''; ?>" data-boldform-message aria-live="polite">
				<?php echo $status ? esc_html( $status['message'] ) : ''; ?>
			</div>

			<?php $has_submit_field = $this->structure_contains_field_type( $structure, 'submit' ); ?>
			<div class="boldform-lite-form__fields">
				<?php foreach ( $structure['rows'] as $row_index => $row ) : ?>
					<?php $row_css = ! empty( $row['css_class'] ) ? ' ' . sanitize_html_class( $row['css_class'] ) : ''; ?>
					<div class="boldform-lite-form__row<?php echo esc_attr( $row_css ); ?>">
						<?php foreach ( $row['columns'] as $column_index => $column ) : ?>
							<div class="boldform-lite-form__column" style="width:<?php echo esc_attr( isset( $column['width'] ) ? (string) $column['width'] : '100%' ); ?>;">
								<?php foreach ( $column['fields'] as $field_index => $field ) : ?>
									<?php echo wp_kses( $this->render_field( $field, ( $row_index * 100 ) + ( $column_index * 10 ) + $field_index ), $this->get_field_kses_allowed() ); ?>
								<?php endforeach; ?>
							</div>
						<?php endforeach; ?>
					</div>
				<?php endforeach; ?>
			</div>
			<div style="position:absolute;left:-9999px;" aria-hidden="true">
				<input type="text" name="boldform_hp_<?php echo esc_attr( $form_id ); ?>" value="" tabindex="-1" autocomplete="off">
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
				<button type="submit" class="boldform-lite-form__submit"<?php echo $aria_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					<?php echo wp_kses( $this->build_button_content( $form_settings ), $this->get_field_kses_allowed() ); ?>
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
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();

		$safe_table = esc_sql( $table_name );

		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT * FROM `{$safe_table}` WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$form_id
			)
		);
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
			'thank_you_message' => isset( $decoded['thank_you_message'] ) ? sanitize_textarea_field( (string) $decoded['thank_you_message'] ) : $defaults['thank_you_message'],
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
		);
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
		$provider = in_array( $provider, array( 'recaptcha', 'hcaptcha', 'simple_math' ), true ) ? $provider : 'simple_math';

		return array(
			'provider'           => $provider,
			'recaptcha_site_key' => isset( $saved['recaptcha_site_key'] ) ? sanitize_text_field( (string) $saved['recaptcha_site_key'] ) : '',
			'hcaptcha_site_key'  => isset( $saved['hcaptcha_site_key'] ) ? sanitize_text_field( (string) $saved['hcaptcha_site_key'] ) : '',
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

		if ( 'simple_math' === $captcha['provider'] ) {
			$first_number  = wp_rand( 1, 9 );
			$second_number = wp_rand( 1, 9 );
			$answer        = $first_number + $second_number;
			$challenge     = sprintf( '%d+%d', $first_number, $second_number );
			$answer_hash   = wp_hash( $challenge . '|' . $answer );

			// Scope the input id/label to the form so two captcha forms on one page don't
			// share a DOM id. The name stays fixed — the handler reads it by name.
			$answer_id = 'boldform_math_captcha_answer_' . (int) $this->current_form_id;

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
		return (string) apply_filters( 'boldform_auto_populate_' . $key, '' );
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
			return '<div class="boldform-lite-form__actions"><button type="submit" class="boldform-lite-form__submit"' . $aria_label . '>' . $this->build_button_content( $form_settings ) . '</button></div>';
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
		$cond_attrs = apply_filters( 'boldform_field_conditional_attrs', $cond_attrs, $field );
		// After the filter, strip any HTML tags to prevent injection; attribute values were
		// already individually escaped with esc_attr() before the filter was applied.
		$cond_attrs = wp_strip_all_tags( (string) $cond_attrs );
		?>
		<div class="boldform-lite-form__field boldform-lite-form__field--<?php echo esc_attr( $type ); ?> boldform-lite-label-<?php echo esc_attr( $label_pos ); ?><?php echo esc_attr( $field_css ); ?>" data-bf-field-id="<?php echo esc_attr( $field_name ); ?>"<?php echo $error_msg ? ' data-error="' . esc_attr( $error_msg ) . '"' : ''; ?><?php echo $cond_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- attribute string; values pre-escaped with esc_attr(), tags stripped with wp_strip_all_tags(). ?>>
			<?php if ( '' !== $label && 'hidden' !== $label_pos ) : ?>
				<label class="boldform-lite-form__label" for="<?php echo esc_attr( $field_name ); ?>">
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
		$icon_color = ! empty( $settings['button_icon_color'] ) ? $settings['button_icon_color'] : '';
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
			$img_w       = ( $icon_size && 18 !== $icon_size ) ? $icon_size : 18;
			$svg_url     = $settings['button_icon_svg'];
			$svg_style   = 'width:' . $img_w . 'px;height:' . $img_w . 'px;display:inline-block;vertical-align:middle;flex-shrink:0;';
			if ( $icon_color ) {
				$svg_style .= 'fill:' . esc_attr( $icon_color ) . ';color:' . esc_attr( $icon_color ) . ';';
			}
			// Try to inline the SVG so fill/color CSS applies.
			$inline_svg = $this->get_inline_svg( $svg_url, $img_w, $icon_color );
			if ( $inline_svg ) {
				$icon = '<span class="boldform-btn-icon-svg" style="' . esc_attr( $svg_style ) . '" aria-hidden="true">' . $inline_svg . '</span>';
			} else {
				$icon = '<img src="' . esc_url( $svg_url ) . '" class="boldform-btn-icon-svg" style="' . esc_attr( $svg_style ) . '" alt="">';
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
	private function get_field_kses_allowed() {
		$global_attrs = array(
			'id'            => true,
			'class'         => true,
			'style'         => true,
			'data-*'        => true,
			'aria-*'        => true,
			'role'          => true,
			'tabindex'      => true,
			'hidden'        => true,
			'title'         => true,
			'lang'          => true,
			'dir'           => true,
		);

		return array(
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

		// Structured name field (first / middle / last). Rendered through the shared wrapper
		// so it gets the same required-error and conditional-logic attributes as every other field.
		if ( 'name' === $type ) {
			$show_middle = ! isset( $field['show_middle_name'] ) || ! empty( $field['show_middle_name'] );
			$show_last   = ! isset( $field['show_last_name'] ) || ! empty( $field['show_last_name'] );

			$html  = '<div class="boldform-lite-name"><div class="boldform-lite-name__field">';
			$html .= sprintf(
				'<input type="text" id="%1$s" name="%1$s[first]" placeholder="%2$s"%3$s>',
				esc_attr( $field_name ),
				esc_attr__( 'First Name', 'boldform-lite' ),
				$required_attr
			);
			$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'First Name', 'boldform-lite' ) . '</span></div>';

			if ( $show_middle ) {
				$html .= '<div class="boldform-lite-name__field">';
				$html .= sprintf(
					'<input type="text" id="%1$s_middle" name="%1$s[middle]" placeholder="%2$s">',
					esc_attr( $field_name ),
					esc_attr__( 'Middle Name', 'boldform-lite' )
				);
				$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'Middle Name', 'boldform-lite' ) . '</span></div>';
			}

			if ( $show_last ) {
				$html .= '<div class="boldform-lite-name__field">';
				$html .= sprintf(
					'<input type="text" id="%1$s_last" name="%1$s[last]" placeholder="%2$s"%3$s>',
					esc_attr( $field_name ),
					esc_attr__( 'Last Name', 'boldform-lite' ),
					$required_attr
				);
				$html .= '<span class="boldform-lite-name__sub">' . esc_html__( 'Last Name', 'boldform-lite' ) . '</span></div>';
			}

			return $html . '</div>';
		}

		// Choice-based fields need custom markup, while simple inputs can be rendered from one format string.
		if ( 'textarea' === $type ) {
			return sprintf(
				'<textarea id="%1$s" name="%1$s" placeholder="%2$s"%3$s>%4$s</textarea>',
				esc_attr( $field_name ),
				esc_attr( $placeholder ),
				$required_attr,
				esc_textarea( $default )
			);
		}

		if ( 'select' === $type || 'multiselect' === $type ) {
			$is_multiple    = 'multiselect' === $type;
			$is_searchable  = ! $is_multiple && ! empty( $field['select_searchable'] );
			$select_name    = $is_multiple ? $field_name . '[]' : $field_name;
			$default_values = $is_multiple ? array_map( 'trim', explode( ',', $default ) ) : array( $default );
			$extra_attrs    = ' data-boldform-select="1"';

			if ( $is_multiple ) {
				$extra_attrs .= ' data-multiple="1"';
			}
			if ( $is_searchable ) {
				$extra_attrs .= ' data-searchable="1"';
			}

			// Hidden native <select> for form submission.
			$html = sprintf(
				'<select id="%1$s" name="%2$s"%3$s%4$s style="display:none">',
				esc_attr( $field_name ),
				esc_attr( $select_name ),
				$required_attr,
				$extra_attrs
			);

			if ( '' !== $placeholder && ! $is_multiple ) {
				$html .= sprintf(
					'<option value="">%1$s</option>',
					esc_html( $placeholder )
				);
			}

			$normalized_options = $this->normalize_options( $options );

			foreach ( $normalized_options as $option ) {
				$is_selected = in_array( $option, $default_values, true ) ? ' selected' : '';
				$html       .= sprintf(
					'<option value="%1$s"%2$s>%3$s</option>',
					esc_attr( $option ),
					$is_selected,
					esc_html( $option )
				);
			}

			$html .= '</select>';

			// Custom select UI rendered in PHP so it works in Gutenberg SSR, Elementor editor, and normal frontend.
			$wrap_class = 'bf-select' . ( $is_multiple ? ' bf-select--multi' : '' );
			$data_attrs = ' data-boldform-custom-select="1"';
			if ( $is_multiple ) {
				$data_attrs .= ' data-multiple="1"';
			}
			if ( $is_searchable ) {
				$data_attrs .= ' data-searchable="1"';
			}

			$listbox_id = $field_name . '_listbox';
			$html .= '<div class="' . esc_attr( $wrap_class ) . '"' . $data_attrs . '>';

			// Trigger.
			$arrow = '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';
			$placeholder_text = '' !== $placeholder ? $placeholder : ( $is_multiple ? esc_html__( 'Select options&hellip;', 'boldform-lite' ) : esc_html__( 'Select&hellip;', 'boldform-lite' ) );

			// Prepare accessible label for the trigger
			$field_label = isset( $field['label'] ) ? (string) $field['label'] : '';
			$trigger_aria_label = $field_label && '' !== $field_label ? esc_attr( $field_label ) : ( $is_multiple ? esc_attr__( 'Select options', 'boldform-lite' ) : esc_attr__( 'Select', 'boldform-lite' ) );
			$trigger_aria_attrs = ' aria-label="' . $trigger_aria_label . '" aria-haspopup="listbox" aria-controls="' . esc_attr( $listbox_id ) . '"';

			if ( $is_multiple ) {
				$selected_opts = array_filter( $default_values, function ( $v ) use ( $normalized_options ) {
					return '' !== $v && in_array( $v, $normalized_options, true );
				} );
				if ( empty( $selected_opts ) ) {
					$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
				} else {
					$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__tags">';
					foreach ( $selected_opts as $v ) {
						$html .= '<span class="bf-select__tag">' . esc_html( $v ) . '<button type="button" class="bf-select__tag-x" data-val="' . esc_attr( $v ) . '" aria-label="' . esc_attr__( 'Remove', 'boldform-lite' ) . '">&times;</button></span>';
					}
					$html .= '</span>' . $arrow . '</div>';
				}
			} else {
				$selected_val = ! empty( $default_values[0] ) && in_array( $default_values[0], $normalized_options, true ) ? $default_values[0] : '';
				if ( $selected_val ) {
					$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__value">' . esc_html( $selected_val ) . '</span>' . $arrow . '</div>';
				} else {
					$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"' . $trigger_aria_attrs . '><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
				}
			}

			// Panel.
			$html .= '<div class="bf-select__panel">';

			if ( $is_searchable ) {
				$search_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
				$html .= '<div class="bf-select__search-wrap">' . $search_svg . '<input type="text" class="bf-select__panel-search" placeholder="' . esc_attr__( 'Search&hellip;', 'boldform-lite' ) . '" autocomplete="off" aria-label="' . esc_attr__( 'Search', 'boldform-lite' ) . '"></div>';
			}

			$check_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

			$html .= '<div class="bf-select__list" role="listbox" id="' . esc_attr( $listbox_id ) . '">';
			foreach ( $normalized_options as $option ) {
				$is_active = in_array( $option, $default_values, true );
				$active_class = $is_active ? ' is-active' : '';
				$html .= '<div class="bf-select__option' . $active_class . '" role="option" aria-selected="' . ( $is_active ? 'true' : 'false' ) . '" data-val="' . esc_attr( $option ) . '">';
				if ( $is_multiple ) {
					$html .= '<span class="bf-select__check">' . ( $is_active ? $check_svg : '' ) . '</span>';
				}
				$html .= '<span class="bf-select__option-text">' . esc_html( $option ) . '</span>';
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

		if ( 'checkbox' === $type || 'radio' === $type ) {
			$choices_class  = 'boldform-lite-form__choices' . ( 'inline' === $options_layout ? ' is-inline' : '' );
			$html           = '<div class="' . esc_attr( $choices_class ) . '">';
			$default_values = 'checkbox' === $type ? array_map( 'trim', explode( ',', $default ) ) : array( $default );

			foreach ( $this->normalize_options( $options ) as $option_index => $option ) {
				$choice_id = $field_name . '_' . $option_index;
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
			return sprintf(
				'<input id="%1$s" type="file" name="%1$s"%2$s%3$s>',
				esc_attr( $field_name ),
				$accept_attr,
				$required_attr
			);
		}

		// Date and time fields: render as text with a hidden native picker for cross-browser consistency.
		if ( 'date' === $type || 'time' === $type ) {
			$placeholder = $placeholder ? $placeholder : ( 'date' === $type ? __( 'Select date', 'boldform-lite' ) : __( 'Select time', 'boldform-lite' ) );

			return sprintf(
				'<input id="%1$s" type="text" name="%1$s" placeholder="%2$s" value="%3$s" data-boldform-picker="%4$s" readonly%5$s>',
				esc_attr( $field_name ),
				esc_attr( $placeholder ),
				esc_attr( $default ),
				esc_attr( $type ),
				$required_attr
			);
		}


		if ( 'input_mask' === $type ) {
			$mask = isset( $field['mask_pattern'] ) ? (string) $field['mask_pattern'] : '';
			return sprintf(
				'<input type="text" id="%1$s" name="%1$s" placeholder="%2$s" value="%3$s"%4$s data-mask="%5$s">',
				esc_attr( $field_name ),
				esc_attr( $placeholder ),
				esc_attr( $default ),
				$required_attr,
				esc_attr( $mask )
			);
		}

		if ( 'numeric' === $type ) {
			$min = isset( $field['min_value'] ) && '' !== $field['min_value'] ? ' min="' . esc_attr( $field['min_value'] ) . '"' : '';
			$max = isset( $field['max_value'] ) && '' !== $field['max_value'] ? ' max="' . esc_attr( $field['max_value'] ) . '"' : '';
			$step = isset( $field['step_value'] ) && '' !== $field['step_value'] ? ' step="' . esc_attr( $field['step_value'] ) . '"' : '';
			return sprintf(
				'<input type="number" id="%1$s" name="%1$s" placeholder="%2$s" value="%3$s"%4$s%5$s%6$s%7$s>',
				esc_attr( $field_name ),
				esc_attr( $placeholder ),
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
							$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%1$s[%2$s]" placeholder="%3$s">', esc_attr( $field_name ), esc_attr( $pk ), esc_attr( $addr_labels[ $pk ] ) );
						}
						$html .= '</div>';
						$pair_buffer = array();
					}
					$html .= sprintf(
						'<div class="boldform-lite-address__row"><input type="text" id="%1$s_%2$s" name="%1$s[%2$s]" placeholder="%3$s"%4$s></div>',
						esc_attr( $field_name ),
						esc_attr( $key ),
						esc_attr( $addr_labels[ $key ] ),
						$required_attr
					);
				} else {
					$pair_buffer[] = $key;
					if ( count( $pair_buffer ) === 2 ) {
						$html .= '<div class="boldform-lite-address__row boldform-lite-address__row--half">';
						foreach ( $pair_buffer as $pk ) {
							$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%1$s[%2$s]" placeholder="%3$s">', esc_attr( $field_name ), esc_attr( $pk ), esc_attr( $addr_labels[ $pk ] ) );
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
					$html .= sprintf( '<input type="text" id="%1$s_%2$s" name="%1$s[%2$s]" placeholder="%3$s">', esc_attr( $field_name ), esc_attr( $pk ), esc_attr( $addr_labels[ $pk ] ) );
				}
				$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
		}

		if ( 'country' === $type ) {
			$countries       = $this->get_country_list();
			$placeholder_text = $placeholder ? $placeholder : __( 'Select a country', 'boldform-lite' );

			// Hidden native <select> for form submission.
			$html = sprintf(
				'<select id="%1$s" name="%1$s"%2$s data-boldform-select="1" data-searchable="1" style="display:none">',
				esc_attr( $field_name ),
				$required_attr
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

			$html .= '<div class="bf-select" data-boldform-custom-select="1" data-searchable="1">';
			if ( $selected_name ) {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"><span class="bf-select__value">' . esc_html( $selected_name ) . '</span>' . $arrow . '</div>';
			} else {
				$html .= '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"><span class="bf-select__placeholder">' . esc_html( $placeholder_text ) . '</span>' . $arrow . '</div>';
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
			$star_color = ! empty( $field['star_color'] ) && sanitize_hex_color( (string) $field['star_color'] ) ? sanitize_hex_color( (string) $field['star_color'] ) : '#f59e0b';
			$star_size  = ! empty( $field['star_size'] ) ? (int) $field['star_size'] : 28;
			$star_style = '--bf-star-color:' . esc_attr( $star_color ) . ';--bf-star-size:' . $star_size . 'px';
			$html = sprintf( '<input type="hidden" id="%1$s" name="%1$s" value="%2$s"%3$s>', esc_attr( $field_name ), esc_attr( $def ), $required_attr );
			$html .= '<div class="boldform-lite-star-rating" data-max="' . $max . '" data-field="' . esc_attr( $field_name ) . '" style="' . $star_style . '">';
			for ( $i = 1; $i <= $max; $i++ ) {
				$active = $i <= $def ? ' is-active' : '';
				$html .= '<span class="boldform-lite-star' . $active . '" data-value="' . $i . '">&#9733;</span>';
			}
			$html .= '</div>';
			return $html;
		}

		if ( 'slider_range' === $type ) {
			$min          = isset( $field['min_value'] ) && '' !== $field['min_value'] ? (string) $field['min_value'] : '0';
			$max          = isset( $field['max_value'] ) && '' !== $field['max_value'] ? (string) $field['max_value'] : '100';
			$step         = isset( $field['step_value'] ) && '' !== $field['step_value'] ? (string) $field['step_value'] : '1';
			$def          = '' !== $default ? $default : $min;
			$slider_color = ! empty( $field['slider_color'] ) && sanitize_hex_color( (string) $field['slider_color'] ) ? sanitize_hex_color( (string) $field['slider_color'] ) : '';
			$slider_h     = ! empty( $field['slider_height'] ) ? (int) $field['slider_height'] : '';
			$sl_style     = '';
			if ( $slider_color ) {
				$sl_style .= '--bf-slider-color:' . esc_attr( $slider_color ) . ';';
			}
			if ( $slider_h ) {
				$sl_style .= '--bf-slider-height:' . $slider_h . 'px;';
			}
			$html = '<div class="boldform-lite-slider"' . ( $sl_style ? ' style="' . $sl_style . '"' : '' ) . '>';
			$html .= sprintf(
				'<input type="range" id="%1$s" name="%1$s" min="%2$s" max="%3$s" step="%4$s" value="%5$s"%6$s>',
				esc_attr( $field_name ), esc_attr( $min ), esc_attr( $max ), esc_attr( $step ), esc_attr( $def ), $required_attr
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
			'<input id="%1$s" type="%2$s" name="%1$s" placeholder="%3$s" value="%4$s"%5$s>',
			esc_attr( $field_name ),
			esc_attr( $input_type ),
			esc_attr( $placeholder ),
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only display of redirect query params; no data is modified.
		$status_form_id = isset( $_GET['boldform_form_id'] ) ? absint( wp_unslash( $_GET['boldform_form_id'] ) ) : 0;
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$status         = isset( $_GET['boldform_status'] ) ? sanitize_key( wp_unslash( $_GET['boldform_status'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized via sanitize_text_field().
		$message        = isset( $_GET['boldform_message'] ) ? sanitize_text_field( rawurldecode( wp_unslash( $_GET['boldform_message'] ) ) ) : '';

		// Only show redirect messages on the form instance that initiated the submission.
		if ( $form_id !== $status_form_id || '' === $status || '' === $message ) {
			return null;
		}

		return array(
			'type'    => 'success' === $status ? 'success' : 'error',
			'message' => $message,
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
	 * Returns an associative array of ISO country codes to country names.
	 *
	 * @return array<string, string>
	 */
	private function get_country_list() {
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
