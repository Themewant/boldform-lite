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
	 * @param int                              $entry_id ID of the saved entry (0 if unknown).
	 * @return void
	 */
	public function send_notifications( $form_record, $settings, $entry_data, $entry_id = 0 ) {
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
			$this->send_admin_email( $form_record, $settings, $entry_data, $attachments, (int) $entry_id );
		}

		if ( ! empty( $settings['enable_user_email'] ) ) {
			$this->send_user_email( $form_record, $entry_data, (int) $entry_id );
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
	 * @param object                             $form_record Form record.
	 * @param array<string, mixed>               $settings    Form settings.
	 * @param array<string, array<string,mixed>> $entry_data  Entry data.
	 * @param array<int, string>                 $attachments File paths to attach.
	 * @param int                                $entry_id    Saved entry ID (0 if unknown).
	 * @return void
	 */
	private function send_admin_email( $form_record, $settings, $entry_data, $attachments = array(), $entry_id = 0 ) {
		// Resolve the recipient, most specific first:
		// 1. the form's own custom admin address,
		// 2. the global "Default email" notification setting,
		// 3. the WordPress site admin email as the final fallback.
		$to = sanitize_email( get_option( 'admin_email' ) );

		$global_settings = get_option( 'boldform_lite_settings', array() );
		if ( is_array( $global_settings ) && ! empty( $global_settings['default_email'] ) && is_email( $global_settings['default_email'] ) ) {
			$to = sanitize_email( (string) $global_settings['default_email'] );
		}

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
			$entry_data,
			(int) $entry_id
		);
		$message = apply_filters(
			'boldform_lite_admin_email_content',
			$this->build_email_template(
				! empty( $form_record->title ) ? (string) $form_record->title : __( 'BoldForm', 'boldform-lite' ),
				$entry_data,
				__( 'A new form submission has been received.', 'boldform-lite' )
			),
			$form_record,
			$entry_data,
			(int) $entry_id
		);

		/**
		 * Filter the admin-notification email headers (e.g. to add a Reply-To,
		 * Cc or Bcc). The first entry keeps the HTML content type.
		 *
		 * @since 1.1.4
		 *
		 * @param string[]             $headers     wp_mail headers.
		 * @param object               $form_record Form record.
		 * @param array<string, mixed> $entry_data  Saved entry data.
		 * @param int                  $entry_id    Saved entry ID (0 if unknown).
		 */
		$headers = (array) apply_filters(
			'boldform_lite_admin_email_headers',
			array( 'Content-Type: text/html; charset=UTF-8' ),
			$form_record,
			$entry_data,
			(int) $entry_id
		);

		/**
		 * Filter the files attached to the admin notification.
		 *
		 * Receives the visitor's uploaded files, and can add generated documents —
		 * a PDF of the submission, say. Return absolute paths to files that already
		 * exist on disk; wp_mail() reads them while sending, so a path that is not
		 * readable at that moment is simply not attached.
		 *
		 * Paths are re-validated before use and anything outside the uploads
		 * directory is dropped. That is deliberate: this filter's return value ends
		 * up as an outbound email attachment, so an add-on that builds a path from
		 * submitted data — or is simply buggy — could otherwise mail out wp-config.php
		 * or a file from outside the site. Generated attachments belong in uploads
		 * anyway, which is where Lite's own uploaded files already live.
		 *
		 * @since 1.1.5
		 *
		 * @param array<int, string>   $attachments Absolute file paths.
		 * @param object               $form_record Form record.
		 * @param array<string, mixed> $entry_data  Saved entry data.
		 * @param int                  $entry_id    Saved entry ID (0 if unknown).
		 */
		$attachments = apply_filters(
			'boldform_lite_admin_email_attachments',
			$attachments,
			$form_record,
			$entry_data,
			(int) $entry_id
		);

		wp_mail( sanitize_email( $to ), $subject, $message, $headers, self::valid_attachments( $attachments ) );
	}

	/**
	 * Keeps only the attachment paths that are safe to mail out.
	 *
	 * A path has to be a real, readable file that resolves inside the uploads
	 * directory. Symlinks and `../` are handled by comparing realpath() output on
	 * both sides, so a path is judged by where it actually lands rather than by
	 * how it is spelled — `wp-content/uploads/../../wp-config.php` does not pass
	 * a string check but does resolve outside uploads.
	 *
	 * Silently dropping a bad path is the right failure here: the alternative is
	 * refusing to send a notification because one attachment was wrong, and the
	 * notification itself matters more than the file riding along with it.
	 *
	 * @since 1.1.5
	 *
	 * @param mixed $attachments Filtered attachment list.
	 * @return array<int, string> Paths that are safe to attach, possibly empty.
	 */
	private static function valid_attachments( $attachments ) {
		$uploads = wp_get_upload_dir();

		// No usable uploads directory means nothing can be proven safe.
		if ( ! empty( $uploads['error'] ) || empty( $uploads['basedir'] ) ) {
			return array();
		}

		$basedir = realpath( $uploads['basedir'] );

		if ( false === $basedir ) {
			return array();
		}

		$basedir .= DIRECTORY_SEPARATOR;
		$valid    = array();

		foreach ( (array) $attachments as $path ) {
			if ( ! is_string( $path ) || '' === $path ) {
				continue;
			}

			$real = realpath( $path );

			if ( false === $real || ! is_file( $real ) || ! is_readable( $real ) ) {
				continue;
			}

			if ( 0 !== strpos( $real, $basedir ) ) {
				continue;
			}

			$valid[] = $real;
		}

		return array_values( array_unique( $valid ) );
	}

	/**
	 * Sends user confirmation email if an email field was submitted.
	 *
	 * @param object                           $form_record Form record.
	 * @param array<string, array<string,mixed>> $entry_data Entry data.
	 * @param int                              $entry_id Saved entry ID (0 if unknown).
	 * @return void
	 */
	private function send_user_email( $form_record, $entry_data, $entry_id = 0 ) {
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
			$user_email,
			(int) $entry_id
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
			$user_email,
			(int) $entry_id
		);

		/**
		 * Filter the user-confirmation email headers (e.g. to add a Reply-To).
		 *
		 * @since 1.1.4
		 *
		 * @param string[]             $headers     wp_mail headers.
		 * @param object               $form_record Form record.
		 * @param array<string, mixed> $entry_data  Saved entry data.
		 * @param string               $user_email  Detected recipient.
		 * @param int                  $entry_id    Saved entry ID (0 if unknown).
		 */
		$headers = (array) apply_filters(
			'boldform_lite_user_email_headers',
			array( 'Content-Type: text/html; charset=UTF-8' ),
			$form_record,
			$entry_data,
			$user_email,
			(int) $entry_id
		);

		wp_mail( $user_email, $subject, $message, $headers );
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

			// Flatten multi-part values ("John Doe", not "John, , Doe") via the shared helper.
			$value = BoldForm_Lite::format_field_value( $value, ! empty( $field['type'] ) ? (string) $field['type'] : '' );

			if ( $is_file && ! empty( $value ) ) {
				$file_name  = basename( (string) $value );
				$value_html = '<a href="' . esc_url( (string) $value ) . '" target="_blank">' . esc_html( $file_name ) . '</a>';
			} else {
				// Preserve line breaks from textarea/multi-line values in the HTML email.
				$value_html = nl2br( esc_html( (string) $value ) );
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
