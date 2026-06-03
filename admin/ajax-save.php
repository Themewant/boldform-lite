<?php
/**
 * AJAX save handler for builder forms.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Saves form definitions via AJAX.
 */
class BoldForm_Lite_Ajax_Save {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite $plugin Plugin instance.
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * AJAX callback for saving a form.
	 *
	 * @return void
	 */
	public function save_form() {
		check_ajax_referer( 'boldform_lite_save_form', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'You are not allowed to perform this action.', 'boldform-lite' ),
				),
				403
			);
		}

		$form_id           = isset( $_POST['form_id'] ) ? absint( wp_unslash( $_POST['form_id'] ) ) : 0;
		$title             = isset( $_POST['title'] ) ? sanitize_text_field( wp_unslash( $_POST['title'] ) ) : '';
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- raw JSON string; sanitize_text_field() would strip HTML used in terms/content fields. Every decoded value is individually sanitized below via sanitize_text_field(), sanitize_key(), wp_kses_post(), absint(), etc.
		$structure_raw     = isset( $_POST['structure'] ) ? wp_unslash( $_POST['structure'] ) : '';
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- same as above; decoded values sanitized in normalize_form_settings().
		$settings_raw      = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '';
		$payload           = json_decode( $structure_raw, true );
		$settings_payload  = json_decode( $settings_raw, true );

		if ( ! is_array( $payload ) ) {
			$payload = array();
		}
		if ( ! is_array( $settings_payload ) ) {
			$settings_payload = array();
		}

		$prepared_settings = self::normalize_form_settings( $settings_payload );

		if ( empty( $payload['rows'] ) || ! is_array( $payload['rows'] ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Add at least one row with fields before saving.', 'boldform-lite' ),
				),
				400
			);
		}

		$prepared_rows = self::prepare_rows( $payload );

		if ( ! self::structure_has_fields( $prepared_rows ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Add at least one field before saving.', 'boldform-lite' ),
				),
				400
			);
		}

		if ( empty( $prepared_rows ) ) {
			wp_send_json_error(
				array(
					'message' => __( 'Invalid form structure supplied.', 'boldform-lite' ),
				),
				400
			);
		}

		global $wpdb;

		$table_name = esc_sql( $this->plugin->get_forms_table_name() );
		$data       = array(
			'title'         => $title ? $title : __( 'Untitled Form', 'boldform-lite' ),
			'status'        => 'publish',
			'fields_json'   => wp_json_encode(
				array(
					'rows' => $prepared_rows,
				)
			),
			'settings_json' => wp_json_encode( $prepared_settings ),
		);
		$formats    = array( '%s', '%s', '%s', '%s' );

		if ( $form_id > 0 ) {
			// Guard against a phantom "saved" success for a non-existent form id
			// ($wpdb->update returns 0 — not false — when no row matches).
			$exists = (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->prepare( "SELECT COUNT(*) FROM `{$table_name}` WHERE id = %d", $form_id )
			);

			if ( ! $exists ) {
				wp_send_json_error(
					array(
						'message' => __( 'The form you are trying to update no longer exists.', 'boldform-lite' ),
					),
					404
				);
			}

			$updated = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$table_name,
				$data,
				array( 'id' => $form_id ),
				$formats,
				array( '%d' )
			);

			if ( false === $updated ) {
				$message = __( 'Unable to update the form.', 'boldform-lite' );

				if ( ! empty( $wpdb->last_error ) ) {
					$message = sprintf(
						/* translators: %s: database error message */
						__( 'Unable to update the form. Database error: %s', 'boldform-lite' ),
						sanitize_text_field( $wpdb->last_error )
					);
				}

				wp_send_json_error(
					array(
						'message' => $message,
					),
					500
				);
			}
		} else {
			$data['created_by'] = get_current_user_id();
			$formats[]          = '%d';

			$inserted = $wpdb->insert( $table_name, $data, $formats ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

			if ( false === $inserted ) {
				$message = __( 'Unable to save the form.', 'boldform-lite' );

				if ( ! empty( $wpdb->last_error ) ) {
					$message = sprintf(
						/* translators: %s: database error message */
						__( 'Unable to save the form. Database error: %s', 'boldform-lite' ),
						sanitize_text_field( $wpdb->last_error )
					);
				}

				wp_send_json_error(
					array(
						'message' => $message,
					),
					500
				);
			}

			$form_id = (int) $wpdb->insert_id;
		}

		/**
		 * Fires after a form is successfully saved via the builder.
		 *
		 * Pro can use this to sync to external CRM, invalidate caches, etc.
		 *
		 * @param int    $form_id Form ID (newly inserted or updated).
		 * @param array<string, mixed> $data    Saved data array (title, fields_json, settings_json).
		 * @param bool   $is_new  True when a new form was created, false on update.
		 */
		do_action( 'boldform_form_saved', $form_id, $data, ! isset( $_POST['form_id'] ) || 0 === absint( $_POST['form_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce already checked above.

		wp_send_json_success(
			array(
				'formId'  => $form_id,
				'message' => __( 'Form saved successfully.', 'boldform-lite' ),
			)
		);
	}

	/**
	 * Sanitizes a decoded builder structure (rows -> columns -> fields) into the
	 * trusted, allowlisted shape that gets stored in `fields_json`.
	 *
	 * Shared by the AJAX save path and the JSON importer so both apply identical
	 * field-type allowlisting and per-value sanitization (never trust a raw blob).
	 *
	 * @param array<string, mixed>|mixed $payload Decoded structure (expects a 'rows' array).
	 * @return array<int, array<string, mixed>> Prepared rows (empty array when none valid).
	 */
	public static function prepare_rows( $payload ) {
		$allowed_types = array( 'text', 'name', 'email', 'number', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'time', 'tel', 'url', 'captcha', 'section_break', 'terms_conditions', 'file', 'submit', 'input_mask', 'html_editor', 'paragraph', 'numeric', 'address', 'country', 'star_rating', 'slider_range' );

		/**
		 * Filter the list of allowed field types that can be saved.
		 *
		 * Pro can add new field types (payment, signature, repeater, etc.).
		 *
		 * @param array<int, string> $allowed_types Allowed field type keys.
		 */
		$allowed_types = apply_filters( 'boldform_allowed_field_types', $allowed_types );

		$prepared_rows = array();
		$seen_ids      = array();

		if ( ! is_array( $payload ) || empty( $payload['rows'] ) || ! is_array( $payload['rows'] ) ) {
			return $prepared_rows;
		}

		// Builder data is stored as rows -> columns -> fields so the renderer can rebuild the layout exactly.
		// Defensive caps keep a hostile/runaway payload from exhausting memory.
		foreach ( array_slice( $payload['rows'], 0, 200 ) as $row ) {
			if ( empty( $row['columns'] ) || ! is_array( $row['columns'] ) ) {
				continue;
			}

			$prepared_columns = array();

			foreach ( array_slice( $row['columns'], 0, 12 ) as $column ) {
				$width  = isset( $column['width'] ) ? sanitize_text_field( (string) $column['width'] ) : '100%';
				$fields = array();

				// Restrict column widths to the layout presets the builder offers.
				if ( ! in_array( $width, array( '100%', '75%', '66.66%', '50%', '33.33%', '25%' ), true ) ) {
					$width = '100%';
				}

				if ( isset( $column['fields'] ) && is_array( $column['fields'] ) ) {
					foreach ( array_slice( $column['fields'], 0, 200 ) as $field ) {
						$field_type = isset( $field['type'] ) ? sanitize_key( (string) $field['type'] ) : '';

						if ( ! in_array( $field_type, $allowed_types, true ) ) {
							continue;
						}

						// Guarantee a unique field id within the form — duplicates break labels,
						// conditional logic and entry keying (last-writer-wins on submit).
						$field_id = ! empty( $field['id'] ) ? sanitize_key( (string) $field['id'] ) : wp_unique_id( 'field_' );
						if ( '' === $field_id || isset( $seen_ids[ $field_id ] ) ) {
							$field_id = wp_unique_id( 'field_' );
						}
						$seen_ids[ $field_id ] = true;

						$options = array();

						if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
							$options = array_values(
								array_filter(
									array_map(
										static function ( $option ) {
											return sanitize_text_field( (string) ( $option ?? '' ) );
										},
										array_slice( $field['options'], 0, 200 )
									)
								)
							);
						}

						$options_layout = isset( $field['options_layout'] ) && 'inline' === $field['options_layout'] ? 'inline' : 'block';

						// Normalize each field before saving so the frontend only has to render trusted values.
						$core_field = array(
							'id'             => $field_id,
							'type'           => $field_type,
							'label'          => isset( $field['label'] ) ? sanitize_text_field( (string) $field['label'] ) : '',
							'placeholder'    => isset( $field['placeholder'] ) ? sanitize_text_field( (string) $field['placeholder'] ) : '',
							'default_value'  => isset( $field['default_value'] ) ? sanitize_text_field( (string) $field['default_value'] ) : '',
							'required'       => ! empty( $field['required'] ),
							'options'        => $options,
							'options_layout' => $options_layout,
							'content'        => isset( $field['content'] ) ? wp_kses_post( (string) $field['content'] ) : '',
							'description'    => isset( $field['description'] ) ? sanitize_textarea_field( (string) $field['description'] ) : '',
							'custom_error'   => isset( $field['custom_error'] ) ? sanitize_text_field( (string) $field['custom_error'] ) : '',
							'allowed_types'  => isset( $field['allowed_types'] ) ? sanitize_text_field( (string) $field['allowed_types'] ) : '',
							'max_file_size'  => isset( $field['max_file_size'] ) ? absint( $field['max_file_size'] ) : '',
							'css_class'      => isset( $field['css_class'] ) ? sanitize_html_class( (string) $field['css_class'] ) : '',
							'show_middle_name'  => ! isset( $field['show_middle_name'] ) || ! empty( $field['show_middle_name'] ),
							'show_last_name'    => ! isset( $field['show_last_name'] ) || ! empty( $field['show_last_name'] ),
							'address_order'     => isset( $field['address_order'] ) && is_array( $field['address_order'] ) ? array_values( array_intersect( array_map( 'sanitize_key', $field['address_order'] ), array( 'street', 'city', 'state', 'zip', 'country' ) ) ) : array( 'street', 'city', 'state', 'zip', 'country' ),
							'address_fields'    => isset( $field['address_fields'] ) && is_array( $field['address_fields'] ) ? array(
								'street'  => ! isset( $field['address_fields']['street'] ) || ! empty( $field['address_fields']['street'] ),
								'city'    => ! isset( $field['address_fields']['city'] ) || ! empty( $field['address_fields']['city'] ),
								'state'   => ! isset( $field['address_fields']['state'] ) || ! empty( $field['address_fields']['state'] ),
								'zip'     => ! isset( $field['address_fields']['zip'] ) || ! empty( $field['address_fields']['zip'] ),
								'country' => ! isset( $field['address_fields']['country'] ) || ! empty( $field['address_fields']['country'] ),
							) : array( 'street' => true, 'city' => true, 'state' => true, 'zip' => true, 'country' => true ),
							'label_placement'   => isset( $field['label_placement'] ) && in_array( $field['label_placement'], array( 'top', 'left', 'right', 'bottom', 'hidden' ), true ) ? $field['label_placement'] : 'top',
							'conditional'       => ( function () use ( $field ) {
								$raw     = isset( $field['conditional'] ) && is_array( $field['conditional'] ) ? $field['conditional'] : array();
								$enabled = ! empty( $raw['enabled'] );
								$action  = isset( $raw['action'] ) && 'hide' === $raw['action'] ? 'hide' : 'show';
								$logic   = isset( $raw['logic'] ) && 'OR' === strtoupper( (string) $raw['logic'] ) ? 'OR' : 'AND';

								$allowed_ops = array( 'is', 'is_not', 'contains', 'not_contains', 'not_empty', 'empty', 'starts_with', 'ends_with', 'greater_than', 'less_than' );
								$conditions  = array();
								if ( isset( $raw['conditions'] ) && is_array( $raw['conditions'] ) ) {
									foreach ( $raw['conditions'] as $cond ) {
										if ( ! is_array( $cond ) ) continue;
										$conditions[] = array(
											'field_id' => isset( $cond['field_id'] ) ? sanitize_key( (string) $cond['field_id'] ) : '',
											'operator' => isset( $cond['operator'] ) && in_array( $cond['operator'], $allowed_ops, true ) ? $cond['operator'] : 'is',
											'value'    => isset( $cond['value'] ) ? sanitize_text_field( (string) $cond['value'] ) : '',
										);
									}
								}
								if ( empty( $conditions ) ) {
									$conditions[] = array( 'field_id' => '', 'operator' => 'is', 'value' => '' );
								}

								return array(
									'enabled'    => $enabled,
									'action'     => $action,
									'logic'      => $logic,
									'conditions' => $conditions,
								);
							} )(),
							'select_searchable' => ! empty( $field['select_searchable'] ),
							'select_multiple'   => ! empty( $field['select_multiple'] ),
							'mask_pattern'    => isset( $field['mask_pattern'] ) ? sanitize_text_field( (string) $field['mask_pattern'] ) : '',
							'min_value'       => isset( $field['min_value'] ) ? sanitize_text_field( (string) $field['min_value'] ) : '',
							'max_value'       => isset( $field['max_value'] ) ? sanitize_text_field( (string) $field['max_value'] ) : '',
							'step_value'      => isset( $field['step_value'] ) ? sanitize_text_field( (string) $field['step_value'] ) : '',
							'max_stars'       => isset( $field['max_stars'] ) ? absint( $field['max_stars'] ) : 5,
							'star_color'      => isset( $field['star_color'] ) && sanitize_hex_color( $field['star_color'] ) ? sanitize_hex_color( $field['star_color'] ) : '#f59e0b',
							'star_size'       => isset( $field['star_size'] ) ? max( 16, min( 60, absint( $field['star_size'] ) ) ) : 28,
							'slider_color'    => isset( $field['slider_color'] ) && sanitize_hex_color( $field['slider_color'] ) ? sanitize_hex_color( $field['slider_color'] ) : '',
							'slider_height'   => isset( $field['slider_height'] ) ? max( 2, min( 20, absint( $field['slider_height'] ) ) ) : '',
							'step_title'      => isset( $field['step_title'] ) ? sanitize_text_field( (string) $field['step_title'] ) : '',
							'next_text'       => isset( $field['next_text'] ) ? sanitize_text_field( (string) $field['next_text'] ) : 'Next',
							'prev_text'       => isset( $field['prev_text'] ) ? sanitize_text_field( (string) $field['prev_text'] ) : 'Previous',
							'btn_color'       => isset( $field['btn_color'] ) && sanitize_hex_color( $field['btn_color'] ) ? sanitize_hex_color( $field['btn_color'] ) : '',
							'btn_text_color'  => isset( $field['btn_text_color'] ) && sanitize_hex_color( $field['btn_text_color'] ) ? sanitize_hex_color( $field['btn_text_color'] ) : '',
							'btn_size'        => isset( $field['btn_size'] ) && in_array( $field['btn_size'], array( 'small', 'medium', 'large' ), true ) ? $field['btn_size'] : 'medium',
							'btn_radius'      => isset( $field['btn_radius'] ) && '' !== $field['btn_radius'] ? max( 0, min( 50, absint( $field['btn_radius'] ) ) ) : '',
							'progress_color'  => isset( $field['progress_color'] ) && sanitize_hex_color( $field['progress_color'] ) ? sanitize_hex_color( $field['progress_color'] ) : '',
							'progress_style'  => isset( $field['progress_style'] ) && in_array( $field['progress_style'], array( 'bar', 'steps', 'headings' ), true ) ? $field['progress_style'] : 'bar',
							'auto_populate_key' => isset( $field['auto_populate_key'] ) ? sanitize_key( (string) $field['auto_populate_key'] ) : '',
						);

						/**
						 * Filter extra field keys to persist for non-core field types.
						 *
						 * Pro can hook this to save additional field attributes (e.g. payment
						 * amount, currency) that are not part of the core field schema.
						 *
						 * @param array<string, mixed> $extra      Extra key => sanitized-value pairs (start empty).
						 * @param array<string, mixed> $field      Raw field from the request.
						 * @param string               $field_type Field type slug.
						 */
						$extra_keys = apply_filters( 'boldform_field_extra_keys', array(), $field, $field_type );

						$fields[] = array_merge( $core_field, $extra_keys );
					}
				}

				$prepared_columns[] = array(
					'width'  => $width,
					'fields' => $fields,
				);
			}

			if ( empty( $prepared_columns ) ) {
				continue;
			}

			$prepared_rows[] = array(
				'css_class' => isset( $row['css_class'] ) ? sanitize_html_class( (string) $row['css_class'] ) : '',
				'columns'   => $prepared_columns,
			);
		}

		return $prepared_rows;
	}

	/**
	 * Determines whether the structure contains at least one field.
	 *
	 * @param array<int, array<string, mixed>> $rows Prepared rows.
	 * @return bool
	 */
	public static function structure_has_fields( $rows ) {
		foreach ( $rows as $row ) {
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
	 * Normalizes submission settings payload.
	 *
	 * @param array<string, mixed>|mixed $settings_payload Raw settings payload.
	 * @return array<string, mixed>
	 */
	public static function normalize_form_settings( $settings_payload ) {
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

		if ( ! is_array( $settings_payload ) ) {
			return $defaults;
		}

		$submission_type = isset( $settings_payload['submission_type'] ) && in_array( $settings_payload['submission_type'], array( 'ajax', 'redirect' ), true )
			? $settings_payload['submission_type']
			: ( ! empty( $settings_payload['enable_redirect'] ) ? 'redirect' : 'ajax' );
		$admin_email_type = isset( $settings_payload['admin_email_type'] ) && in_array( $settings_payload['admin_email_type'], array( 'site_admin', 'custom' ), true )
			? $settings_payload['admin_email_type']
			: ( ! empty( $settings_payload['admin_email'] ) ? 'custom' : 'site_admin' );
		$admin_email = isset( $settings_payload['admin_email'] ) ? sanitize_email( (string) $settings_payload['admin_email'] ) : '';

		$redirect_type = isset( $settings_payload['redirect_type'] ) && in_array( $settings_payload['redirect_type'], array( 'page', 'custom' ), true )
			? $settings_payload['redirect_type']
			: ( ! empty( $settings_payload['redirect_url'] ) ? 'custom' : 'page' );

		$normalized = array(
			'submission_type'   => $submission_type,
			'enable_ajax'       => 'ajax' === $submission_type,
			'enable_redirect'   => 'redirect' === $submission_type,
			'redirect_type'     => $redirect_type,
			'redirect_url'      => isset( $settings_payload['redirect_url'] ) && '' !== $settings_payload['redirect_url'] ? esc_url_raw( (string) $settings_payload['redirect_url'] ) : '',
			'thank_you_message' => isset( $settings_payload['thank_you_message'] ) ? sanitize_textarea_field( (string) $settings_payload['thank_you_message'] ) : $defaults['thank_you_message'],
			'button_text'       => isset( $settings_payload['button_text'] ) ? sanitize_text_field( (string) $settings_payload['button_text'] ) : $defaults['button_text'],
			'button_alignment'  => isset( $settings_payload['button_alignment'] ) && in_array( $settings_payload['button_alignment'], array( 'left', 'center', 'right' ), true ) ? $settings_payload['button_alignment'] : $defaults['button_alignment'],
			'button_layout'     => isset( $settings_payload['button_layout'] ) && in_array( $settings_payload['button_layout'], array( 'below', 'inline' ), true ) ? $settings_payload['button_layout'] : $defaults['button_layout'],
			'button_icon_type'     => isset( $settings_payload['button_icon_type'] ) && in_array( $settings_payload['button_icon_type'], array( 'none', 'dashicon', 'svg' ), true ) ? $settings_payload['button_icon_type'] : 'none',
			'button_icon_dashicon' => isset( $settings_payload['button_icon_dashicon'] ) ? sanitize_text_field( (string) $settings_payload['button_icon_dashicon'] ) : '',
			'button_icon_svg'      => isset( $settings_payload['button_icon_svg'] ) ? esc_url_raw( (string) $settings_payload['button_icon_svg'] ) : '',
			'button_icon_position' => isset( $settings_payload['button_icon_position'] ) && in_array( $settings_payload['button_icon_position'], array( 'left', 'right' ), true ) ? $settings_payload['button_icon_position'] : 'right',
			'button_icon_gap'      => isset( $settings_payload['button_icon_gap'] ) ? max( 0, min( 30, absint( $settings_payload['button_icon_gap'] ) ) ) : 8,
			'button_icon_size'     => isset( $settings_payload['button_icon_size'] ) ? max( 10, min( 60, absint( $settings_payload['button_icon_size'] ) ) ) : 18,
			'button_icon_color'    => isset( $settings_payload['button_icon_color'] ) && sanitize_hex_color( $settings_payload['button_icon_color'] ) ? sanitize_hex_color( $settings_payload['button_icon_color'] ) : '',
			'button_color'      => isset( $settings_payload['button_color'] ) && in_array( $settings_payload['button_color'], array( 'teal', 'blue', 'green', 'red', 'dark' ), true ) ? $settings_payload['button_color'] : $defaults['button_color'],
			'field_style'       => isset( $settings_payload['field_style'] ) && in_array( $settings_payload['field_style'], array( 'solid', 'dashed', 'none' ), true ) ? $settings_payload['field_style'] : '',
			'field_size'        => isset( $settings_payload['field_size'] ) && in_array( $settings_payload['field_size'], array( 'small', 'medium', 'large', 'compact', 'comfortable', 'spacious' ), true ) ? $settings_payload['field_size'] : '',
			'field_focus_color' => isset( $settings_payload['field_focus_color'] ) && in_array( $settings_payload['field_focus_color'], array( 'teal', 'blue', 'green', 'dark' ), true ) ? $settings_payload['field_focus_color'] : '',
			'field_border_width'=> isset( $settings_payload['field_border_width'] ) && '' !== $settings_payload['field_border_width'] ? max( 0, min( 10, absint( $settings_payload['field_border_width'] ) ) ) : '',
			'field_border_radius'=> isset( $settings_payload['field_border_radius'] ) && '' !== $settings_payload['field_border_radius'] ? max( 0, min( 50, absint( $settings_payload['field_border_radius'] ) ) ) : '',
			'field_background_color' => isset( $settings_payload['field_background_color'] ) && sanitize_hex_color( $settings_payload['field_background_color'] ) ? sanitize_hex_color( $settings_payload['field_background_color'] ) : '',
			'field_border_color' => isset( $settings_payload['field_border_color'] ) && sanitize_hex_color( $settings_payload['field_border_color'] ) ? sanitize_hex_color( $settings_payload['field_border_color'] ) : '',
			'field_text_color'  => isset( $settings_payload['field_text_color'] ) && sanitize_hex_color( $settings_payload['field_text_color'] ) ? sanitize_hex_color( $settings_payload['field_text_color'] ) : '',
			'label_size'        => isset( $settings_payload['label_size'] ) && in_array( $settings_payload['label_size'], array( 'small', 'medium', 'large' ), true ) ? $settings_payload['label_size'] : '',
			'label_color'       => isset( $settings_payload['label_color'] ) && sanitize_hex_color( $settings_payload['label_color'] ) ? sanitize_hex_color( $settings_payload['label_color'] ) : '',
			'label_subtext_color' => isset( $settings_payload['label_subtext_color'] ) && sanitize_hex_color( $settings_payload['label_subtext_color'] ) ? sanitize_hex_color( $settings_payload['label_subtext_color'] ) : '',
			'error_color'       => isset( $settings_payload['error_color'] ) && sanitize_hex_color( $settings_payload['error_color'] ) ? sanitize_hex_color( $settings_payload['error_color'] ) : '',
			'button_size'       => isset( $settings_payload['button_size'] ) && in_array( $settings_payload['button_size'], array( 'small', 'medium', 'large' ), true ) ? $settings_payload['button_size'] : '',
			'button_border_style' => isset( $settings_payload['button_border_style'] ) && in_array( $settings_payload['button_border_style'], array( 'solid', 'dashed', 'none' ), true ) ? $settings_payload['button_border_style'] : '',
			'button_border_width' => isset( $settings_payload['button_border_width'] ) && '' !== $settings_payload['button_border_width'] ? max( 0, min( 10, absint( $settings_payload['button_border_width'] ) ) ) : '',
			'button_border_radius' => isset( $settings_payload['button_border_radius'] ) && '' !== $settings_payload['button_border_radius'] ? max( 0, min( 50, absint( $settings_payload['button_border_radius'] ) ) ) : '',
			'button_background_color' => isset( $settings_payload['button_background_color'] ) && sanitize_hex_color( $settings_payload['button_background_color'] ) ? sanitize_hex_color( $settings_payload['button_background_color'] ) : '',
			'button_border_color' => isset( $settings_payload['button_border_color'] ) && sanitize_hex_color( $settings_payload['button_border_color'] ) ? sanitize_hex_color( $settings_payload['button_border_color'] ) : '',
			'button_text_color' => isset( $settings_payload['button_text_color'] ) && sanitize_hex_color( $settings_payload['button_text_color'] ) ? sanitize_hex_color( $settings_payload['button_text_color'] ) : '',
			'admin_email_type'  => $admin_email_type,
			'enable_admin_email'=> isset( $settings_payload['enable_admin_email'] ) ? (bool) $settings_payload['enable_admin_email'] : $defaults['enable_admin_email'],
			'enable_user_email' => isset( $settings_payload['enable_user_email'] ) ? (bool) $settings_payload['enable_user_email'] : $defaults['enable_user_email'],
			'admin_email'       => 'custom' === $admin_email_type ? $admin_email : '',
			// Multi-step settings (saved by Pro's builder UI, passed through for Pro's rendering).
			'step_progress_style' => isset( $settings_payload['step_progress_style'] ) && in_array( $settings_payload['step_progress_style'], array( 'bar', 'steps', 'headings' ), true ) ? $settings_payload['step_progress_style'] : 'bar',
			'step_progress_color' => isset( $settings_payload['step_progress_color'] ) && sanitize_hex_color( $settings_payload['step_progress_color'] ) ? sanitize_hex_color( $settings_payload['step_progress_color'] ) : '',
			'step_btn_color'      => isset( $settings_payload['step_btn_color'] ) && sanitize_hex_color( $settings_payload['step_btn_color'] ) ? sanitize_hex_color( $settings_payload['step_btn_color'] ) : '',
			'step_btn_text_color' => isset( $settings_payload['step_btn_text_color'] ) && sanitize_hex_color( $settings_payload['step_btn_text_color'] ) ? sanitize_hex_color( $settings_payload['step_btn_text_color'] ) : '',
			'step_btn_size'       => isset( $settings_payload['step_btn_size'] ) && in_array( $settings_payload['step_btn_size'], array( 'small', 'medium', 'large' ), true ) ? $settings_payload['step_btn_size'] : 'medium',
			'step_btn_radius'     => isset( $settings_payload['step_btn_radius'] ) && '' !== $settings_payload['step_btn_radius'] ? max( 0, min( 50, absint( $settings_payload['step_btn_radius'] ) ) ) : '',
			'step_next_text'      => isset( $settings_payload['step_next_text'] ) ? sanitize_text_field( (string) $settings_payload['step_next_text'] ) : 'Next',
			'step_prev_text'      => isset( $settings_payload['step_prev_text'] ) ? sanitize_text_field( (string) $settings_payload['step_prev_text'] ) : 'Previous',
			'design_theme'        => isset( $settings_payload['design_theme'] ) ? sanitize_key( (string) $settings_payload['design_theme'] ) : '',
			'hide_labels'         => ! empty( $settings_payload['hide_labels'] ),
			'hide_placeholders'   => ! empty( $settings_payload['hide_placeholders'] ),
			'dup_enabled'         => ! empty( $settings_payload['dup_enabled'] ),
			'dup_method'          => isset( $settings_payload['dup_method'] ) && in_array( $settings_payload['dup_method'], array( 'email', 'ip', 'field' ), true ) ? $settings_payload['dup_method'] : 'email',
			'dup_field_id'        => isset( $settings_payload['dup_field_id'] ) ? sanitize_key( (string) $settings_payload['dup_field_id'] ) : '',
			'dup_message'         => isset( $settings_payload['dup_message'] ) && '' !== trim( (string) $settings_payload['dup_message'] ) ? sanitize_textarea_field( (string) $settings_payload['dup_message'] ) : '',
		);

		/**
		 * Filter extra form-level settings to persist alongside core settings.
		 *
		 * Pro modules can hook here to save their own form-level config keys
		 * (e.g. webhooks, integrations). Each returned key/value is merged into
		 * the final settings array that gets stored as JSON in the DB.
		 *
		 * @param array<string, mixed> $extra           Extra settings to merge (start empty).
		 * @param array<string, mixed> $settings_payload Raw settings payload from the request.
		 */
		$extra = (array) apply_filters( 'boldform_form_settings_extra', array(), $settings_payload );

		return array_merge( $normalized, $extra );
	}
}
