<?php
/**
 * Email notifications for form submissions.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sends admin and user submission emails.
 */
class BoldForm_Lite_Email_Handler {

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
	 * Sends enabled notifications for a saved entry.
	 *
	 * @param object                           $form_record Form record.
	 * @param array<string, mixed>             $settings Form settings.
	 * @param array<string, array<string,mixed>> $entry_data Sanitized entry data.
	 * @return void
	 */
	public function send_notifications( $form_record, $settings, $entry_data ) {
		$attachments = $this->collect_file_attachments( $entry_data );

		/**
		 * Fires before any notification emails are dispatched.
		 *
		 * Pro can add integrations (Slack, webhook, SMS) here before emails go out.
		 *
		 * @param object                              $form_record Form database row.
		 * @param array<string, mixed>                $settings    Form settings.
		 * @param array<string, array<string, mixed>> $entry_data  Saved entry data.
		 */
		do_action( 'boldform_before_notifications', $form_record, $settings, $entry_data );

		if ( ! empty( $settings['enable_admin_email'] ) ) {
			$this->send_admin_email( $form_record, $settings, $entry_data, $attachments );
		}

		if ( ! empty( $settings['enable_user_email'] ) ) {
			$this->send_user_email( $form_record, $entry_data );
		}

		/**
		 * Fires after BoldForm Lite's built-in notification emails are sent.
		 *
		 * Pro can send additional conditional notifications, webhooks, or third-party pushes.
		 *
		 * @param object                              $form_record Form database row.
		 * @param array<string, mixed>                $settings    Form settings.
		 * @param array<string, array<string, mixed>> $entry_data  Saved entry data.
		 */
		do_action( 'boldform_after_notifications', $form_record, $settings, $entry_data );
	}

	/**
	 * Collects file attachment paths from entry data.
	 *
	 * @param array<string, array<string,mixed>> $entry_data Entry data.
	 * @return array<int, string> File paths.
	 */
	private function collect_file_attachments( $entry_data ) {
		$attachments = array();

		foreach ( $entry_data as $field ) {
			if ( ! empty( $field['type'] ) && 'file' === $field['type'] && ! empty( $field['path'] ) && file_exists( $field['path'] ) ) {
				$attachments[] = $field['path'];
			}
		}

		return $attachments;
	}

	/**
	 * Sends admin notification email.
	 *
	 * @param object                           $form_record Form record.
	 * @param array<string, array<string,mixed>> $entry_data Entry data.
	 * @return void
	 */
	private function send_admin_email( $form_record, $settings, $entry_data, $attachments = array() ) {
		$to = sanitize_email( get_option( 'admin_email' ) );

		if ( ! empty( $settings['admin_email_type'] ) && 'custom' === $settings['admin_email_type'] && ! empty( $settings['admin_email'] ) && is_email( $settings['admin_email'] ) ) {
			$to = sanitize_email( (string) $settings['admin_email'] );
		}

		$subject = apply_filters(
			'boldform_lite_admin_email_subject',
			sprintf(
				/* translators: %s: form title */
				__( 'New submission for %s', 'boldform-lite' ),
				! empty( $form_record->title ) ? (string) $form_record->title : __( 'BoldForm', 'boldform-lite' )
			),
			$form_record,
			$entry_data
		);
		$message = apply_filters(
			'boldform_lite_admin_email_content',
			$this->build_email_template(
				! empty( $form_record->title ) ? (string) $form_record->title : __( 'BoldForm', 'boldform-lite' ),
				$entry_data,
				__( 'A new form submission has been received.', 'boldform-lite' )
			),
			$form_record,
			$entry_data
		);

		wp_mail( sanitize_email( $to ), $subject, $message, array( 'Content-Type: text/html; charset=UTF-8' ), $attachments );
	}

	/**
	 * Sends user confirmation email if an email field was submitted.
	 *
	 * @param object                           $form_record Form record.
	 * @param array<string, array<string,mixed>> $entry_data Entry data.
	 * @return void
	 */
	private function send_user_email( $form_record, $entry_data ) {
		$user_email = $this->detect_user_email( $entry_data );

		if ( ! $user_email ) {
			return;
		}

		$subject = apply_filters(
			'boldform_lite_user_email_subject',
			sprintf(
				/* translators: %s: form title */
				__( 'We received your %s submission', 'boldform-lite' ),
				! empty( $form_record->title ) ? (string) $form_record->title : __( 'form', 'boldform-lite' )
			),
			$form_record,
			$entry_data,
			$user_email
		);
		$message = apply_filters(
			'boldform_lite_user_email_content',
			$this->build_email_template(
				! empty( $form_record->title ) ? (string) $form_record->title : __( 'BoldForm', 'boldform-lite' ),
				$entry_data,
				__( 'Thank you. We have received your submission.', 'boldform-lite' )
			),
			$form_record,
			$entry_data,
			$user_email
		);

		wp_mail( $user_email, $subject, $message, array( 'Content-Type: text/html; charset=UTF-8' ) );
	}

	/**
	 * Detects a submitted email field.
	 *
	 * @param array<string, array<string,mixed>> $entry_data Entry data.
	 * @return string
	 */
	private function detect_user_email( $entry_data ) {
		foreach ( $entry_data as $field ) {
			if ( empty( $field['type'] ) || 'email' !== $field['type'] || empty( $field['value'] ) ) {
				continue;
			}

			$email = sanitize_email( (string) $field['value'] );

			if ( is_email( $email ) ) {
				return $email;
			}
		}

		return '';
	}

	/**
	 * Builds a simple HTML email template from entry data.
	 *
	 * @param string                              $title Form title.
	 * @param array<string, array<string,mixed>>  $entry_data Entry data.
	 * @param string                              $intro Intro text.
	 * @return string
	 */
	private function build_email_template( $title, $entry_data, $intro ) {
		$rows = '';

		foreach ( $entry_data as $field ) {
			$label = ! empty( $field['label'] ) ? esc_html( (string) $field['label'] ) : esc_html__( 'Field', 'boldform-lite' );
			$value = isset( $field['value'] ) ? $field['value'] : '';

			$is_file = ! empty( $field['type'] ) && 'file' === $field['type'];

			if ( is_array( $value ) ) {
				$value = implode( ', ', array_map( static function ( $v ) { return sanitize_text_field( (string) ( $v ?? '' ) ); }, $value ) );
			}

			if ( $is_file && ! empty( $value ) ) {
				$file_name  = basename( (string) $value );
				$value_html = '<a href="' . esc_url( (string) $value ) . '" target="_blank">' . esc_html( $file_name ) . '</a>';
			} else {
				$value_html = esc_html( (string) $value );
			}

			$rows .= '<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">' . $label . '</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">' . $value_html . '</td></tr>';
		}

		return '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">'
			. '<h2 style="margin:0 0 12px;">' . esc_html( $title ) . '</h2>'
			. '<p style="margin:0 0 16px;">' . esc_html( $intro ) . '</p>'
			. '<table style="border-collapse:collapse;width:100%;max-width:680px;">' . $rows . '</table>'
			. '</div>';
	}

}
