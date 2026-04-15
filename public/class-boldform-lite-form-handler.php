<?php
/**
 * Frontend form submission handler.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles secure frontend form submissions.
 */
class BoldForm_Lite_Form_Handler {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Email notifications handler.
	 *
	 * @var BoldForm_Lite_Email_Handler
	 */
	private $email_handler;

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite $plugin Main plugin instance.
	 */
	public function __construct( $plugin, $email_handler ) {
		$this->plugin        = $plugin;
		$this->email_handler = $email_handler;
	}

	/**
	 * Handles non-AJAX form submissions.
	 *
	 * @return void
	 */
	public function handle_submission() {
		if ( 'POST' !== strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ?? '' ) ) ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce is verified in process_submission().
		$action = isset( $_POST['boldform_action'] ) ? sanitize_key( wp_unslash( $_POST['boldform_action'] ) ) : '';

		if ( 'submit_form' !== $action ) {
			return;
		}

		$result = $this->process_submission( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$form_id      = isset( $_POST['boldform_form_id'] ) ? absint( $_POST['boldform_form_id'] ) : 0;
		$redirect_url = wp_get_referer();

		if ( ! $redirect_url ) {
			$redirect_url = home_url( '/' );
		}

		if ( ! empty( $result['redirect_url'] ) ) {
			wp_safe_redirect( $result['redirect_url'] );
			exit;
		}

		$redirect_url = remove_query_arg(
			array(
				'boldform_status',
				'boldform_message',
				'boldform_form_id',
			),
			$redirect_url
		);

		$redirect_url = add_query_arg(
			array(
				'boldform_status'  => $result['success'] ? 'success' : 'error',
				'boldform_message' => rawurlencode( $result['message'] ),
				'boldform_form_id' => $form_id,
			),
			$redirect_url
		);

		wp_safe_redirect( $redirect_url );
		exit;
	}

	/**
	 * AJAX callback for form submission.
	 *
	 * @return void
	 */
	public function ajax_submit_form() {
		$result = $this->process_submission( $_POST, true ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce is verified in process_submission().

		if ( $result['success'] ) {
			wp_send_json_success(
				array(
					'message'      => $result['message'],
					'redirectUrl'  => $result['redirect_url'],
				)
			);
		}

		wp_send_json_error(
			array(
				'message' => $result['message'],
				'errors'  => $result['errors'],
			),
			400
		);
	}

	/**
	 * Processes submitted form data.
	 *
	 * @param array<string, mixed> $request Request data.
	 * @param bool                 $is_ajax Whether the request is AJAX.
	 * @return array<string, mixed>
	 */
	public function process_submission( $request, $is_ajax = false ) {
		$form_id = isset( $request['boldform_form_id'] ) ? absint( $request['boldform_form_id'] ) : 0;
		$nonce   = isset( $request['boldform_nonce'] ) ? sanitize_text_field( wp_unslash( $request['boldform_nonce'] ) ) : '';

		if ( ! $form_id || ! wp_verify_nonce( $nonce, 'boldform_lite_submit_form_' . $form_id ) ) {
			return $this->build_result(
				false,
				__( 'Security check failed. Please refresh the page and try again.', 'boldform-lite' ),
				array()
			);
		}

		$form_record = $this->get_form( $form_id );

		if ( ! $form_record || 'publish' !== $form_record->status ) {
			return $this->build_result(
				false,
				__( 'The requested form is not available.', 'boldform-lite' ),
				array()
			);
		}

		// Honeypot check — if the hidden field has a value, it's a bot.
		$hp_key = 'boldform_hp_' . $form_id;
		if ( ! empty( $request[ $hp_key ] ) ) {
			return $this->build_result(
				false,
				__( 'Spam detected.', 'boldform-lite' ),
				array()
			);
		}

		$fields   = $this->extract_fields_from_record( $form_record );
		$settings = $this->extract_settings_from_record( $form_record );
		$captcha  = $this->get_captcha_settings();

		if ( empty( $fields ) ) {
			return $this->build_result(
				false,
				__( 'The requested form has no fields configured.', 'boldform-lite' ),
				array()
			);
		}

		/**
		 * Fires before BoldForm validates and processes a submission.
		 *
		 * Pro can use this to run pre-validation logic (e.g. rate limiting, geo blocking).
		 *
		 * @param int                              $form_id     Form ID.
		 * @param array<string, mixed>             $request     Raw request payload.
		 * @param array<int, array<string, mixed>> $fields      Flattened field definitions.
		 * @param array<string, mixed>             $settings    Form settings.
		 */
		do_action( 'boldform_before_submission', $form_id, $request, $fields, $settings );

		$captcha_result = $this->structure_contains_field_type( $fields, 'captcha' ) ? $this->validate_captcha( $captcha, $request ) : array(
			'success' => true,
			'message' => '',
		);

		if ( ! $captcha_result['success'] ) {
			return $this->build_result(
				false,
				$captcha_result['message'],
				array()
			);
		}

		/**
		 * Filter the raw request payload before field validation.
		 *
		 * Pro can use this to inject or remove values (e.g. pre-populate hidden fields,
		 * strip fields on conditional logic evaluation).
		 *
		 * @param array<string, mixed>             $request  Raw request payload.
		 * @param int                              $form_id  Form ID.
		 * @param array<int, array<string, mixed>> $fields   Flattened field definitions.
		 */
		$request = apply_filters( 'boldform_submission_request', $request, $form_id, $fields );

		// Convert the submitted payload into a normalized, trusted entry array before saving or emailing.
		$validation = $this->validate_and_sanitize_fields( $fields, $request );

		if ( ! empty( $validation['errors'] ) ) {
			return $this->build_result(
				false,
				__( 'Please correct the highlighted fields and try again.', 'boldform-lite' ),
				$validation['errors']
			);
		}

		/**
		 * Filter the validated entry data before it is saved.
		 *
		 * Pro can mutate, enrich, or strip fields (e.g. payment metadata, calculated values).
		 *
		 * @param array<string, array<string, mixed>> $entry_data Normalized entry data.
		 * @param int                                 $form_id    Form ID.
		 * @param array<string, mixed>                $settings   Form settings.
		 */
		$validation['entry_data'] = apply_filters( 'boldform_entry_data', $validation['entry_data'], $form_id, $settings );

		/**
		 * Fires before an entry is persisted to the database.
		 *
		 * @param int                                 $form_id    Form ID.
		 * @param array<string, array<string, mixed>> $entry_data Normalized entry data.
		 * @param array<string, mixed>                $settings   Form settings.
		 */
		do_action( 'boldform_before_entry_save', $form_id, $validation['entry_data'], $settings );

		$saved = $this->save_entry( $form_id, $validation['entry_data'] );

		if ( ! $saved ) {
			return $this->build_result(
				false,
				__( 'Unable to save your submission right now.', 'boldform-lite' ),
				array()
			);
		}

		/**
		 * Fires immediately after a new entry is saved to the database.
		 *
		 * Pro can use this to trigger integrations (CRM, webhooks, Zapier, Slack).
		 *
		 * @param int                                 $form_id    Form ID.
		 * @param array<string, array<string, mixed>> $entry_data Saved entry data.
		 * @param object                              $form_record Form database row.
		 * @param array<string, mixed>                $settings   Form settings.
		 */
		do_action( 'boldform_entry_saved', $form_id, $validation['entry_data'], $form_record, $settings );

		$this->email_handler->send_notifications( $form_record, $settings, $validation['entry_data'] );

		$result = $this->build_result(
			true,
			$settings['thank_you_message'],
			array(),
			! empty( $settings['redirect_url'] ) ? $settings['redirect_url'] : ''
		);

		/**
		 * Filter the final submission result before it is returned to the browser.
		 *
		 * Pro can override the redirect URL (e.g. after payment) or success message.
		 *
		 * @param array<string, mixed>                $result     Result array (success, message, redirect_url, errors).
		 * @param int                                 $form_id    Form ID.
		 * @param array<string, array<string, mixed>> $entry_data Saved entry data.
		 * @param array<string, mixed>                $settings   Form settings.
		 */
		return apply_filters( 'boldform_submission_result', $result, $form_id, $validation['entry_data'], $settings );
	}

	/**
	 * Returns a form row.
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
	 * Extracts saved field definitions.
	 *
	 * @param object|null $form_record Form database row.
	 * @return array<int, array<string, mixed>>
	 */
	private function extract_fields_from_record( $form_record ) {
		if ( ! $form_record || empty( $form_record->fields_json ) ) {
			return array();
		}

		$decoded = json_decode( (string) $form_record->fields_json, true );

		if ( isset( $decoded['rows'] ) && is_array( $decoded['rows'] ) ) {
			return $this->flatten_structure_fields( $decoded['rows'] );
		}

		if ( isset( $decoded['fields'] ) && is_array( $decoded['fields'] ) ) {
			return $decoded['fields'];
		}

		return is_array( $decoded ) ? $decoded : array();
	}

	/**
	 * Extracts normalized submission settings from a form record.
	 *
	 * @param object|null $form_record Form database row.
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
			'button_layout'     => 'below',
			'button_color'      => 'teal',
			'field_style'            => '',
			'field_size'             => '',
			'field_focus_color'      => '',
			'field_border_width'     => '',
			'field_border_radius'    => '',
			'field_background_color' => '',
			'field_border_color'     => '',
			'field_text_color'       => '',
			'label_size'             => '',
			'label_color'            => '',
			'label_subtext_color' => '',
			'error_color'          => '',
			'button_size'          => '',
			'button_border_style' => '',
			'button_border_width' => '',
			'button_border_radius' => '',
			'button_background_color' => '',
			'button_border_color' => '',
			'button_text_color' => '',
			'admin_email_type'   => 'site_admin',
			'enable_admin_email' => true,
			'enable_user_email' => true,
			'admin_email'        => '',
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
		$admin_email      = isset( $decoded['admin_email'] ) ? sanitize_email( (string) $decoded['admin_email'] ) : '';
		$admin_email_type = isset( $decoded['admin_email_type'] ) && in_array( $decoded['admin_email_type'], array( 'site_admin', 'custom' ), true )
			? $decoded['admin_email_type']
			: ( $admin_email ? 'custom' : 'site_admin' );

		return array(
			'submission_type'   => $submission_type,
			'enable_ajax'       => 'ajax' === $submission_type,
			'enable_redirect'   => 'redirect' === $submission_type,
			'redirect_url'      => isset( $decoded['redirect_url'] ) ? esc_url_raw( (string) $decoded['redirect_url'] ) : '',
			'thank_you_message' => isset( $decoded['thank_you_message'] ) ? sanitize_textarea_field( (string) $decoded['thank_you_message'] ) : $defaults['thank_you_message'],
			'button_text'       => isset( $decoded['button_text'] ) ? sanitize_text_field( (string) $decoded['button_text'] ) : $defaults['button_text'],
			'button_alignment'  => isset( $decoded['button_alignment'] ) && in_array( $decoded['button_alignment'], array( 'left', 'center', 'right' ), true ) ? $decoded['button_alignment'] : $defaults['button_alignment'],
			'button_layout'     => isset( $decoded['button_layout'] ) && in_array( $decoded['button_layout'], array( 'below', 'inline' ), true ) ? $decoded['button_layout'] : $defaults['button_layout'],
			'button_icon_type'     => isset( $decoded['button_icon_type'] ) && in_array( $decoded['button_icon_type'], array( 'none', 'dashicon', 'svg' ), true ) ? $decoded['button_icon_type'] : 'none',
			'button_icon_dashicon' => isset( $decoded['button_icon_dashicon'] ) ? sanitize_text_field( (string) $decoded['button_icon_dashicon'] ) : '',
			'button_icon_svg'      => isset( $decoded['button_icon_svg'] ) ? (string) $decoded['button_icon_svg'] : '',
			'button_icon_position' => isset( $decoded['button_icon_position'] ) && in_array( $decoded['button_icon_position'], array( 'left', 'right' ), true ) ? $decoded['button_icon_position'] : 'right',
			'button_icon_gap'      => isset( $decoded['button_icon_gap'] ) ? absint( $decoded['button_icon_gap'] ) : 8,
			'button_icon_size'     => isset( $decoded['button_icon_size'] ) ? absint( $decoded['button_icon_size'] ) : 18,
			'button_icon_color'    => isset( $decoded['button_icon_color'] ) && sanitize_hex_color( $decoded['button_icon_color'] ) ? sanitize_hex_color( $decoded['button_icon_color'] ) : '',
			'button_color'      => isset( $decoded['button_color'] ) && in_array( $decoded['button_color'], array( 'teal', 'blue', 'green', 'red', 'dark' ), true ) ? $decoded['button_color'] : $defaults['button_color'],
			'field_style'            => isset( $decoded['field_style'] ) && in_array( $decoded['field_style'], array( 'solid', 'dashed', 'none', 'outline', 'soft', 'minimal' ), true ) ? $decoded['field_style'] : '',
			'field_size'             => isset( $decoded['field_size'] ) && in_array( $decoded['field_size'], array( 'small', 'medium', 'large', 'compact', 'comfortable', 'spacious' ), true ) ? $decoded['field_size'] : '',
			'field_focus_color'      => isset( $decoded['field_focus_color'] ) && in_array( $decoded['field_focus_color'], array( 'teal', 'blue', 'green', 'dark' ), true ) ? $decoded['field_focus_color'] : '',
			'field_border_width'     => isset( $decoded['field_border_width'] ) && '' !== $decoded['field_border_width'] ? max( 0, min( 10, absint( $decoded['field_border_width'] ) ) ) : '',
			'field_border_radius'    => isset( $decoded['field_border_radius'] ) && '' !== $decoded['field_border_radius'] ? max( 0, min( 50, absint( $decoded['field_border_radius'] ) ) ) : '',
			'field_background_color' => isset( $decoded['field_background_color'] ) && sanitize_hex_color( $decoded['field_background_color'] ) ? sanitize_hex_color( $decoded['field_background_color'] ) : '',
			'field_border_color'     => isset( $decoded['field_border_color'] ) && sanitize_hex_color( $decoded['field_border_color'] ) ? sanitize_hex_color( $decoded['field_border_color'] ) : '',
			'field_text_color'       => isset( $decoded['field_text_color'] ) && sanitize_hex_color( $decoded['field_text_color'] ) ? sanitize_hex_color( $decoded['field_text_color'] ) : '',
			'label_size'             => isset( $decoded['label_size'] ) && in_array( $decoded['label_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['label_size'] : '',
			'label_color'            => isset( $decoded['label_color'] ) && sanitize_hex_color( $decoded['label_color'] ) ? sanitize_hex_color( $decoded['label_color'] ) : '',
			'label_subtext_color' => isset( $decoded['label_subtext_color'] ) && sanitize_hex_color( $decoded['label_subtext_color'] ) ? sanitize_hex_color( $decoded['label_subtext_color'] ) : '',
			'error_color'          => isset( $decoded['error_color'] ) && sanitize_hex_color( $decoded['error_color'] ) ? sanitize_hex_color( $decoded['error_color'] ) : '',
			'button_size'          => isset( $decoded['button_size'] ) && in_array( $decoded['button_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['button_size'] : '',
			'button_border_style' => isset( $decoded['button_border_style'] ) && in_array( $decoded['button_border_style'], array( 'solid', 'dashed', 'none' ), true ) ? $decoded['button_border_style'] : '',
			'button_border_width' => isset( $decoded['button_border_width'] ) && '' !== $decoded['button_border_width'] ? max( 0, min( 10, absint( $decoded['button_border_width'] ) ) ) : '',
			'button_border_radius' => isset( $decoded['button_border_radius'] ) && '' !== $decoded['button_border_radius'] ? max( 0, min( 50, absint( $decoded['button_border_radius'] ) ) ) : '',
			'button_background_color' => isset( $decoded['button_background_color'] ) && sanitize_hex_color( $decoded['button_background_color'] ) ? sanitize_hex_color( $decoded['button_background_color'] ) : '',
			'button_border_color' => isset( $decoded['button_border_color'] ) && sanitize_hex_color( $decoded['button_border_color'] ) ? sanitize_hex_color( $decoded['button_border_color'] ) : '',
			'button_text_color' => isset( $decoded['button_text_color'] ) && sanitize_hex_color( $decoded['button_text_color'] ) ? sanitize_hex_color( $decoded['button_text_color'] ) : '',
			'admin_email_type'   => $admin_email_type,
			'enable_admin_email' => isset( $decoded['enable_admin_email'] ) ? (bool) $decoded['enable_admin_email'] : $defaults['enable_admin_email'],
			'enable_user_email' => isset( $decoded['enable_user_email'] ) ? (bool) $decoded['enable_user_email'] : $defaults['enable_user_email'],
			'admin_email'        => $admin_email,
		);
	}

	/**
	 * Returns normalized captcha settings from global plugin options.
	 *
	 * @return array<string, string>
	 */
	private function get_captcha_settings() {
		$saved = get_option( 'boldform_lite_settings', array() );
		$saved = is_array( $saved ) ? $saved : array();

		$provider = isset( $saved['captcha_provider'] ) ? sanitize_key( (string) $saved['captcha_provider'] ) : 'simple_math';
		$provider = in_array( $provider, array( 'recaptcha', 'hcaptcha', 'simple_math' ), true ) ? $provider : 'simple_math';

		return array(
			'provider'             => $provider,
			'recaptcha_secret_key' => isset( $saved['recaptcha_secret_key'] ) ? sanitize_text_field( (string) $saved['recaptcha_secret_key'] ) : '',
			'hcaptcha_secret_key'  => isset( $saved['hcaptcha_secret_key'] ) ? sanitize_text_field( (string) $saved['hcaptcha_secret_key'] ) : '',
		);
	}

	/**
	 * Validates the active captcha provider before processing field data.
	 *
	 * @param array<string, string> $captcha Captcha settings.
	 * @param array<string, mixed>  $request Submission payload.
	 * @return array<string, mixed>
	 */
	private function validate_captcha( $captcha, $request ) {
		if ( 'simple_math' === $captcha['provider'] ) {
			return $this->validate_simple_math_captcha( $request );
		}

		if ( 'recaptcha' !== $captcha['provider'] && 'hcaptcha' !== $captcha['provider'] ) {
			return array(
				'success' => true,
				'message' => '',
			);
		}

		if ( 'recaptcha' === $captcha['provider'] ) {
			$secret = $captcha['recaptcha_secret_key'];
			$token  = isset( $request['g-recaptcha-response'] ) ? sanitize_text_field( wp_unslash( $request['g-recaptcha-response'] ) ) : '';
			$api    = 'https://www.google.com/recaptcha/api/siteverify';
		} else {
			$secret = $captcha['hcaptcha_secret_key'];
			$token  = isset( $request['h-captcha-response'] ) ? sanitize_text_field( wp_unslash( $request['h-captcha-response'] ) ) : '';
			$api    = 'https://hcaptcha.com/siteverify';
		}

		if ( empty( $secret ) ) {
			return array(
				'success' => false,
				'message' => __( 'Captcha is enabled but not configured correctly.', 'boldform-lite' ),
			);
		}

		if ( '' === $token ) {
			return array(
				'success' => false,
				'message' => __( 'Please complete the captcha challenge.', 'boldform-lite' ),
			);
		}

		$response = wp_remote_post(
			$api,
			array(
				'timeout' => 10,
				'body'    => array(
					'secret'   => $secret,
					'response' => $token,
					'remoteip' => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return array(
				'success' => false,
				'message' => __( 'Captcha verification failed. Please try again.', 'boldform-lite' ),
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $body ) || empty( $body['success'] ) ) {
			return array(
				'success' => false,
				'message' => __( 'Captcha verification failed. Please try again.', 'boldform-lite' ),
			);
		}

		return array(
			'success' => true,
			'message' => '',
		);
	}

	/**
	 * Validates the built-in simple math captcha.
	 *
	 * @param array<string, mixed> $request Submission payload.
	 * @return array<string, mixed>
	 */
	private function validate_simple_math_captcha( $request ) {
		$challenge = isset( $request['boldform_math_captcha_challenge'] ) ? sanitize_text_field( wp_unslash( $request['boldform_math_captcha_challenge'] ) ) : '';
		$hash      = isset( $request['boldform_math_captcha_hash'] ) ? sanitize_text_field( wp_unslash( $request['boldform_math_captcha_hash'] ) ) : '';
		$answer    = isset( $request['boldform_math_captcha_answer'] ) ? absint( wp_unslash( $request['boldform_math_captcha_answer'] ) ) : 0;

		if ( '' === $challenge || '' === $hash ) {
			return array(
				'success' => false,
				'message' => __( 'Captcha verification failed. Please refresh the page and try again.', 'boldform-lite' ),
			);
		}

		if ( 1 !== preg_match( '/^\d+\+\d+$/', $challenge ) ) {
			return array(
				'success' => false,
				'message' => __( 'Captcha verification failed. Please refresh the page and try again.', 'boldform-lite' ),
			);
		}

		list( $left_number, $right_number ) = array_map( 'intval', explode( '+', $challenge ) );
		$expected_answer = $left_number + $right_number;
		$expected_hash   = wp_hash( $challenge . '|' . $expected_answer );

		if ( ! hash_equals( $expected_hash, $hash ) || $answer !== $expected_answer ) {
			return array(
				'success' => false,
				'message' => __( 'Please solve the math captcha correctly.', 'boldform-lite' ),
			);
		}

		return array(
			'success' => true,
			'message' => '',
		);
	}

	/**
	 * Flattens row/column structure into a field list for validation.
	 *
	 * @param array<int, array<string, mixed>> $rows Row structure.
	 * @return array<int, array<string, mixed>>
	 */
	private function flatten_structure_fields( $rows ) {
		$fields = array();

		// Validation works against a flat list, so collapse the saved layout into field definitions only.
		foreach ( $rows as $row ) {
			if ( empty( $row['columns'] ) || ! is_array( $row['columns'] ) ) {
				continue;
			}

			foreach ( $row['columns'] as $column ) {
				if ( empty( $column['fields'] ) || ! is_array( $column['fields'] ) ) {
					continue;
				}

				$fields = array_merge( $fields, $column['fields'] );
			}
		}

		return $fields;
	}

	/**
	 * Checks a flattened field list for a specific field type.
	 *
	 * @param array<int, array<string, mixed>> $fields Field definitions.
	 * @param string                           $field_type Field type.
	 * @return bool
	 */
	private function structure_contains_field_type( $fields, $field_type ) {
		foreach ( $fields as $field ) {
			if ( isset( $field['type'] ) && $field_type === $field['type'] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Validates configured fields and sanitizes submitted values.
	 *
	 * @param array<int, array<string, mixed>> $fields  Field definitions.
	 * @param array<string, mixed>             $request Request payload.
	 * @return array<string, mixed>
	 */
	private function validate_and_sanitize_fields( $fields, $request ) {
		$errors     = array();
		$entry_data = array();

		foreach ( $fields as $field ) {
			$type     = isset( $field['type'] ) ? sanitize_key( (string) $field['type'] ) : 'text';
			$label    = isset( $field['label'] ) ? sanitize_text_field( (string) $field['label'] ) : '';
			$required = ! empty( $field['required'] );

			if ( in_array( $type, array( 'captcha', 'section_break', 'submit', 'paragraph', 'html_editor', 'page_break' ), true ) ) {
				continue;
			}

			$field_id = ! empty( $field['id'] ) ? sanitize_key( (string) $field['id'] ) : wp_unique_id( 'field_' );
			$key      = 'boldform_' . $field_id;

			// Handle file uploads separately.
			if ( 'file' === $type ) {
				$file_result = $this->handle_file_upload( $key, $field, $label, $required );

				if ( ! empty( $file_result['error'] ) ) {
					$errors[ $field_id ] = $file_result['error'];
					continue;
				}

				if ( ! empty( $file_result['url'] ) ) {
					$entry_data[ $field_id ] = array(
						'label' => $label,
						'type'  => 'file',
						'value' => $file_result['url'],
						'path'  => $file_result['path'],
					);
				}

				continue;
			}

			$raw      = isset( $request[ $key ] ) ? wp_unslash( $request[ $key ] ) : null;
			$options  = isset( $field['options'] ) && is_array( $field['options'] ) ? $this->normalize_options( $field['options'] ) : array();
			$value    = $this->sanitize_field_value( $type, $raw );

			if ( $required && $this->is_empty_value( $value ) ) {
				$custom_error = isset( $field['custom_error'] ) ? sanitize_text_field( (string) $field['custom_error'] ) : '';
				if ( $custom_error ) {
					$errors[ $field_id ] = $custom_error;
				} else {
					$global   = get_option( 'boldform_lite_settings', array() );
					$type_msg = ! empty( $global[ 'required_msg_' . $type ] ) ? $global[ 'required_msg_' . $type ] : '';
					$errors[ $field_id ] = $type_msg ? $type_msg : sprintf(
						/* translators: %s: field label */
						__( '%s is required.', 'boldform-lite' ),
						$label ? $label : __( 'This field', 'boldform-lite' )
					);
				}
				continue;
			}

			if ( ! $this->validate_field_value( $type, $value, $options ) ) {
				$errors[ $field_id ] = sprintf(
					/* translators: %s: field label */
					__( '%s contains an invalid value.', 'boldform-lite' ),
					$label ? $label : __( 'This field', 'boldform-lite' )
				);
				continue;
			}

			/**
			 * Filter the validation error for a single field.
			 *
			 * Pro can add custom validation rules (e.g. regex patterns, date ranges,
			 * conditional required). Return a non-empty string to mark the field invalid.
			 *
			 * @param string               $error    Empty string means valid; non-empty means the error message.
			 * @param mixed                $value    Sanitized field value.
			 * @param array<string, mixed> $field    Field definition.
			 * @param array<string, mixed> $request  Full submission payload (for cross-field rules).
			 */
			$custom_validation_error = apply_filters( 'boldform_validate_field', '', $value, $field, $request );
			if ( ! empty( $custom_validation_error ) ) {
				$errors[ $field_id ] = sanitize_text_field( (string) $custom_validation_error );
				continue;
			}

			$entry_data[ $field_id ] = array(
				'label' => $label,
				'type'  => $type,
				'value' => $value,
			);
		}

		return array(
			'errors'     => $errors,
			'entry_data' => $entry_data,
		);
	}

	/**
	 * Sanitizes a submitted field value by type.
	 *
	 * @param string            $type Field type.
	 * @param string|array|null $raw  Raw submitted value.
	 * @return string|array<int, string>
	 */
	private function sanitize_field_value( $type, $raw ) {
		if ( 'checkbox' === $type || 'multiselect' === $type ) {
			if ( ! is_array( $raw ) ) {
				return is_scalar( $raw ) && '' !== (string) $raw ? array( sanitize_text_field( (string) $raw ) ) : array();
			}

			return array_values(
				array_filter(
					array_map(
						static function ( $v ) {
							return sanitize_text_field( (string) ( $v ?? '' ) );
						},
						$raw
					),
					static function ( $value ) {
						return '' !== $value;
					}
				)
			);
		}

		if ( 'name' === $type ) {
			if ( ! is_array( $raw ) ) {
				return array();
			}
			$sanitized = array();
			foreach ( array( 'first', 'middle', 'last' ) as $sub_key ) {
				$sanitized[ $sub_key ] = isset( $raw[ $sub_key ] ) ? sanitize_text_field( (string) $raw[ $sub_key ] ) : '';
			}
			return $sanitized;
		}

		if ( 'address' === $type ) {
			if ( ! is_array( $raw ) ) {
				return array();
			}
			$sanitized = array();
			foreach ( array( 'street', 'city', 'state', 'zip', 'country' ) as $sub_key ) {
				$sanitized[ $sub_key ] = isset( $raw[ $sub_key ] ) ? sanitize_text_field( (string) $raw[ $sub_key ] ) : '';
			}
			return $sanitized;
		}

		$raw = is_scalar( $raw ) ? (string) $raw : '';

		if ( 'textarea' === $type ) {
			return sanitize_textarea_field( $raw );
		}

		if ( 'email' === $type ) {
			return sanitize_email( $raw );
		}

		if ( 'number' === $type ) {
			return is_numeric( $raw ) ? (string) $raw : '';
		}

		if ( 'url' === $type ) {
			return esc_url_raw( $raw );
		}

		if ( 'tel' === $type ) {
			return preg_replace( '/[^\d\s\+\-\(\)\.]/i', '', $raw );
		}

		if ( 'star_rating' === $type ) {
			return (string) absint( $raw );
		}

		if ( 'slider_range' === $type || 'numeric' === $type ) {
			return is_numeric( $raw ) ? (string) $raw : '';
		}

		if ( 'html_editor' === $type ) {
			return wp_kses_post( $raw );
		}

		return sanitize_text_field( $raw );
	}

	/**
	 * Validates a sanitized field value.
	 *
	 * @param string                   $type  Field type.
	 * @param string|array<int, string> $value Sanitized value.
	 * @return bool
	 */
	private function validate_field_value( $type, $value, $options = array() ) {
		if ( 'email' === $type && '' !== $value ) {
			return false !== is_email( (string) $value );
		}

		if ( 'number' === $type && '' !== $value ) {
			return is_numeric( $value );
		}

		if ( in_array( $type, array( 'select', 'radio' ), true ) && is_array( $value ) ) {
			return false;
		}

		if ( in_array( $type, array( 'select', 'radio' ), true ) && '' !== $value ) {
			return in_array( (string) $value, $options, true );
		}

		if ( 'checkbox' === $type || 'multiselect' === $type ) {
			if ( ! is_array( $value ) ) {
				return false;
			}

			foreach ( $value as $item ) {
				if ( ! in_array( $item, $options, true ) ) {
					return false;
				}
			}
		}

		if ( 'star_rating' === $type && '' !== $value ) {
			$int_val = (int) $value;
			return $int_val >= 0 && $int_val <= 10;
		}

		if ( ( 'numeric' === $type || 'slider_range' === $type ) && '' !== $value ) {
			return is_numeric( $value );
		}

		if ( 'country' === $type && '' !== $value ) {
			return is_string( $value ) && '' !== $value;
		}

		return true;
	}

	/**
	 * Handles a single file upload field.
	 *
	 * @param string              $key      Form field name.
	 * @param array<string,mixed> $field    Field definition.
	 * @param string              $label    Field label.
	 * @param bool                $required Whether the field is required.
	 * @return array<string, string> Array with 'url', 'path', or 'error' key.
	 */
	private function handle_file_upload( $key, $field, $label, $required ) {
		// Nonce is verified in process_submission() before this private method is called.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$file_error = isset( $_FILES[ $key ]['error'] ) ? absint( $_FILES[ $key ]['error'] ) : UPLOAD_ERR_NO_FILE; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- integer cast via absint().
		if ( empty( $_FILES[ $key ]['name'] ) || UPLOAD_ERR_NO_FILE === $file_error ) {
			if ( $required ) {
				$custom_error = isset( $field['custom_error'] ) ? sanitize_text_field( (string) $field['custom_error'] ) : '';

				return array(
					'error' => $custom_error ? $custom_error : sprintf(
						/* translators: %s: field label */
						__( '%s is required.', 'boldform-lite' ),
						$label ? $label : __( 'This field', 'boldform-lite' )
					),
				);
			}

			return array();
		}

		$file = $_FILES[ $key ]; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- handled by wp_handle_upload.
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		// Validate file size — fixed at 2 MB in Lite; Pro can override via filter.
		/**
		 * Filter the maximum file upload size in megabytes.
		 *
		 * @param int                  $max_mb Max upload size in MB (default 2).
		 * @param array<string, mixed> $field  Field definition.
		 */
		$max_mb   = apply_filters( 'boldform_max_file_size', 2, $field );
		$max_bytes = $max_mb * 1024 * 1024;

		if ( (int) $file['size'] > $max_bytes ) {
			return array(
				'error' => sprintf(
					/* translators: 1: field label, 2: max file size in MB */
					__( '%1$s exceeds the maximum file size of %2$d MB.', 'boldform-lite' ),
					$label ? $label : __( 'File', 'boldform-lite' ),
					$max_mb
				),
			);
		}

		// Validate file type.
		$allowed = isset( $field['allowed_types'] ) && '' !== $field['allowed_types']
			? array_filter( array_map( 'trim', explode( ',', (string) $field['allowed_types'] ) ) )
			: array();

		if ( ! empty( $allowed ) ) {
			$ext = '.' . strtolower( pathinfo( sanitize_file_name( $file['name'] ), PATHINFO_EXTENSION ) );

			$match = false;

			foreach ( $allowed as $allowed_ext ) {
				if ( strtolower( $allowed_ext ) === $ext || '.' . strtolower( $allowed_ext ) === $ext ) {
					$match = true;
					break;
				}
			}

			if ( ! $match ) {
				return array(
					'error' => sprintf(
						/* translators: 1: field label, 2: allowed extensions list */
						__( '%1$s must be one of: %2$s', 'boldform-lite' ),
						$label ? $label : __( 'File', 'boldform-lite' ),
						implode( ', ', $allowed )
					),
				);
			}
		}

		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$upload = wp_handle_upload( $file, array( 'test_form' => false ) );

		if ( ! empty( $upload['error'] ) ) {
			return array( 'error' => sanitize_text_field( $upload['error'] ) );
		}

		return array(
			'url'  => $upload['url'],
			'path' => $upload['file'],
		);
	}

	/**
	 * Determines whether a sanitized value should be treated as empty.
	 *
	 * @param string|array<int, string> $value Sanitized value.
	 * @return bool
	 */
	private function is_empty_value( $value ) {
		if ( is_array( $value ) ) {
			return empty( $value );
		}

		return '' === trim( (string) $value );
	}

	/**
	 * Persists a submission to the entries table.
	 *
	 * @param int                        $form_id    Form ID.
	 * @param array<string, array<string, mixed>> $entry_data Sanitized entry payload.
	 * @return bool
	 */
	private function save_entry( $form_id, $entry_data ) {
		global $wpdb;

		$table_name = $this->plugin->get_entries_table_name();
		$user_ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_textarea_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		// Store request metadata with the submission so admins can review context without trusting raw headers.
		$data       = array(
			'form_id'          => $form_id,
			'entry_data_json'  => wp_json_encode( $entry_data ),
			'submission_key'   => wp_hash( uniqid( 'boldform_', true ) ),
			'user_id'          => get_current_user_id(),
			'user_ip'          => $this->sanitize_ip_address( $user_ip ),
			'user_agent'       => $user_agent,
			'status'           => 'unread',
		);

		return false !== $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$table_name,
			$data,
			array( '%d', '%s', '%s', '%d', '%s', '%s', '%s' )
		);
	}

	/**
	 * Builds a normalized operation result.
	 *
	 * @param bool                       $success Whether the operation succeeded.
	 * @param string                     $message Result message.
	 * @param array<string, string>      $errors  Validation errors.
	 * @return array<string, mixed>
	 */
	private function build_result( $success, $message, $errors, $redirect_url = '' ) {
		return array(
			'success'      => (bool) $success,
			'message'      => (string) $message,
			'errors'       => $errors,
			'redirect_url' => esc_url_raw( (string) $redirect_url ),
		);
	}

	/**
	 * Normalizes field option values.
	 *
	 * @param array<int, mixed> $options Raw option values.
	 * @return array<int, string>
	 */
	private function normalize_options( $options ) {
		$normalized = array();

		foreach ( $options as $option ) {
			$option = sanitize_text_field( (string) $option );

			if ( '' !== $option ) {
				$normalized[] = $option;
			}
		}

		return $normalized;
	}

	/**
	 * Sanitizes and validates a submitted IP address.
	 *
	 * @param string $ip_address Raw IP address.
	 * @return string
	 */
	private function sanitize_ip_address( $ip_address ) {
		$ip_address = trim( (string) $ip_address );

		return filter_var( $ip_address, FILTER_VALIDATE_IP ) ? $ip_address : '';
	}
}
