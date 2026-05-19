<?php
/**
 * Export / Import handler for forms, entries, and settings.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles JSON export/import from the Settings > Tools tab.
 */
class BoldForm_Lite_Export_Import {

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
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init() {
		add_action( 'admin_init', array( $this, 'handle_export' ) );
		add_action( 'admin_init', array( $this, 'handle_import' ) );
	}

	/**
	 * Renders the Tools tab content inside the settings page.
	 *
	 * @param array<string, mixed> $settings Global plugin settings.
	 * @return void
	 */
	public function render_tools_tab( $settings ) {
		global $wpdb;

		$tools_sub = isset( $_GET['tools_tab'] ) ? sanitize_key( wp_unslash( $_GET['tools_tab'] ) ) : 'export'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$tools_sub = in_array( $tools_sub, array( 'export', 'import' ), true ) ? $tools_sub : 'export';

		$notice = '';

		if ( isset( $_GET['boldform_imported'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$count    = absint( $_GET['boldform_imported'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$tools_sub = 'import';
			$notice   = sprintf(
				/* translators: %d: number of forms imported */
				_n( '%d form imported successfully.', '%d forms imported successfully.', $count, 'boldform-lite' ),
				$count
			);
		}
		?>

		<div class="boldform-smtp-subtabs">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=tools&tools_tab=export' ) ); ?>" class="<?php echo 'export' === $tools_sub ? 'active' : ''; ?>">
				<?php esc_html_e( 'Export', 'boldform-lite' ); ?>
			</a>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=tools&tools_tab=import' ) ); ?>" class="<?php echo 'import' === $tools_sub ? 'active' : ''; ?>">
				<?php esc_html_e( 'Import', 'boldform-lite' ); ?>
			</a>
		</div>

		<?php if ( 'export' === $tools_sub ) : ?>

			<?php
			$forms_table = esc_sql( $this->plugin->get_forms_table_name() );
			$forms       = $wpdb->get_results( $wpdb->prepare( "SELECT id, title FROM `{$forms_table}` WHERE status != %s ORDER BY title ASC", 'trash' ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			?>

			<div class="boldform-card boldform-card--spaced">
				<h3><?php esc_html_e( 'Export Forms & Settings', 'boldform-lite' ); ?></h3>
				<p class="boldform-tab-description"><?php esc_html_e( 'Download a JSON file to migrate forms and settings to another site.', 'boldform-lite' ); ?></p>

				<form method="post">
					<?php wp_nonce_field( 'boldform_lite_export', 'boldform_export_nonce' ); ?>

					<div class="boldform-field-row">
						<div class="boldform-field-label"><?php esc_html_e( 'What to export', 'boldform-lite' ); ?></div>
						<div class="boldform-field-control">
							<div class="boldform-radio-list">
								<label>
									<input type="radio" name="boldform_export_scope" value="all" checked>
									<?php esc_html_e( 'All forms + settings', 'boldform-lite' ); ?>
								</label>
								<label>
									<input type="radio" name="boldform_export_scope" value="single">
									<?php esc_html_e( 'Single form', 'boldform-lite' ); ?>
								</label>
								<label>
									<input type="radio" name="boldform_export_scope" value="settings_only">
									<?php esc_html_e( 'Plugin settings only', 'boldform-lite' ); ?>
								</label>
							</div>
						</div>
					</div>

					<div class="boldform-field-row" id="boldform-export-form-select" style="display:none;">
						<div class="boldform-field-label"><label for="boldform-export-form-id"><?php esc_html_e( 'Select form', 'boldform-lite' ); ?></label></div>
						<div class="boldform-field-control">
							<select id="boldform-export-form-id" name="boldform_export_form_id" style="max-width:100%;">
								<option value="0"><?php esc_html_e( '-- Select --', 'boldform-lite' ); ?></option>
								<?php foreach ( $forms as $form ) : ?>
									<option value="<?php echo absint( $form['id'] ); ?>">
										<?php
										/* translators: %d: form ID number */
										echo esc_html( $form['title'] ? $form['title'] : sprintf( __( 'Form #%d', 'boldform-lite' ), (int) $form['id'] ) );
										?>
									</option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>

					<div class="boldform-field-row" id="boldform-export-entries-row">
						<div class="boldform-field-label"><?php esc_html_e( 'Include entries', 'boldform-lite' ); ?></div>
						<div class="boldform-field-control">
							<label class="boldform-toggle">
								<input type="checkbox" name="boldform_export_entries" value="1">
								<span><?php esc_html_e( 'Include form submission entries in the export', 'boldform-lite' ); ?></span>
							</label>
						</div>
					</div>

					<div class="boldform-submit-area">
						<button type="submit" name="boldform_export" class="button button-primary"><?php esc_html_e( 'Download Export File', 'boldform-lite' ); ?></button>
					</div>
				</form>

				<?php
				wp_add_inline_script(
					'boldform-lite-admin',
					'(function(){
						var radios=document.querySelectorAll("input[name=\'boldform_export_scope\']");
						var formSelect=document.getElementById("boldform-export-form-select");
						var entriesRow=document.getElementById("boldform-export-entries-row");
						function toggle(){
							var val=document.querySelector("input[name=\'boldform_export_scope\']:checked").value;
							if(formSelect)formSelect.style.display=val==="single"?"":"none";
							if(entriesRow)entriesRow.style.display=val==="settings_only"?"none":"";
						}
						for(var i=0;i<radios.length;i++)radios[i].addEventListener("change",toggle);
						toggle();
					})();'
				);
				?>
			</div>

		<?php else : ?>

			<?php if ( $notice ) : ?>
				<div class="boldform-card boldform-card--success">
					<p><?php echo esc_html( $notice ); ?></p>
				</div>
			<?php endif; ?>

			<div class="boldform-card boldform-card--spaced">
				<h3><?php esc_html_e( 'Import Forms & Settings', 'boldform-lite' ); ?></h3>
				<p class="boldform-tab-description"><?php esc_html_e( 'Upload a previously exported JSON file to restore forms, entries, and settings.', 'boldform-lite' ); ?></p>

				<form method="post" enctype="multipart/form-data">
					<?php wp_nonce_field( 'boldform_lite_import', 'boldform_import_nonce' ); ?>

					<div class="boldform-field-row">
						<div class="boldform-field-label"><label for="boldform-import-file"><?php esc_html_e( 'JSON File', 'boldform-lite' ); ?></label></div>
						<div class="boldform-field-control">
							<input type="file" id="boldform-import-file" name="boldform_import_file" accept=".json" required>
							<p class="description"><?php esc_html_e( 'Only .json files exported from BoldForm are accepted.', 'boldform-lite' ); ?></p>
						</div>
					</div>

					<div class="boldform-submit-area">
						<button type="submit" name="boldform_import" class="button button-primary"><?php esc_html_e( 'Upload & Import', 'boldform-lite' ); ?></button>
					</div>
				</form>
			</div>

		<?php endif; ?>
		<?php
	}

	/**
	 * Handles the JSON export.
	 *
	 * @return void
	 */
	public function handle_export() {
		if ( ! isset( $_POST['boldform_export'] ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['boldform_export_nonce'] ?? '' ) ), 'boldform_lite_export' ) ) {
			return;
		}

		global $wpdb;

		$scope   = isset( $_POST['boldform_export_scope'] ) ? sanitize_key( wp_unslash( $_POST['boldform_export_scope'] ) ) : 'all';
		$form_id = isset( $_POST['boldform_export_form_id'] ) ? absint( $_POST['boldform_export_form_id'] ) : 0;

		$data = array(
			'plugin'      => 'boldform-lite',
			'version'     => BOLDFORM_LITE_VERSION,
			'exported_at' => gmdate( 'Y-m-d H:i:s' ),
			'site_url'    => home_url(),
		);

		$forms_table   = esc_sql( $this->plugin->get_forms_table_name() );
		$entries_table = esc_sql( $this->plugin->get_entries_table_name() );

		if ( 'single' === $scope && $form_id > 0 ) {
			$data['forms'] = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM `{$forms_table}` WHERE id = %d", $form_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

			if ( ! empty( $_POST['boldform_export_entries'] ) ) {
				$data['entries'] = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM `{$entries_table}` WHERE form_id = %d ORDER BY id ASC", $form_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			}

			$data['settings'] = get_option( 'boldform_lite_settings', array() );

		} elseif ( 'settings_only' === $scope ) {
			$data['settings'] = get_option( 'boldform_lite_settings', array() );

		} else {
			$data['forms'] = $wpdb->get_results( "SELECT * FROM `{$forms_table}` WHERE status != 'trash' ORDER BY id ASC", ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

			if ( ! empty( $_POST['boldform_export_entries'] ) ) {
				$data['entries'] = $wpdb->get_results( "SELECT * FROM `{$entries_table}` ORDER BY id ASC", ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			}

			$data['settings'] = get_option( 'boldform_lite_settings', array() );
		}

		$filename = 'boldform-export-' . gmdate( 'Y-m-d' ) . '.json';

		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Expires: 0' );

		echo wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
		exit;
	}

	/**
	 * Handles the JSON import.
	 *
	 * @return void
	 */
	public function handle_import() {
		if ( ! isset( $_POST['boldform_import'] ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['boldform_import_nonce'] ?? '' ) ), 'boldform_lite_import' ) ) {
			return;
		}

		if ( empty( $_FILES['boldform_import_file']['tmp_name'] ) ) {
			return;
		}

		$file = sanitize_text_field( $_FILES['boldform_import_file']['tmp_name'] );
		$json = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ( ! $json ) {
			wp_die( esc_html__( 'Unable to read the import file.', 'boldform-lite' ) );
		}

		$data = json_decode( $json, true );

		if ( ! is_array( $data ) || empty( $data['plugin'] ) || 'boldform-lite' !== $data['plugin'] ) {
			wp_die( esc_html__( 'Invalid BoldForm export file.', 'boldform-lite' ) );
		}

		$imported = $this->import_data( $data );

		wp_safe_redirect( add_query_arg( 'boldform_imported', $imported, admin_url( 'admin.php?page=boldform-lite-settings&tab=tools&tools_tab=import' ) ) );
		exit;
	}

	/**
	 * Imports parsed export data into the database.
	 *
	 * @param array<string, mixed> $data Parsed JSON data.
	 * @return int Number of forms imported.
	 */
	private function import_data( $data ) {
		global $wpdb;

		BoldForm_Lite_Activator::activate();

		$forms_imported = 0;
		$id_map         = array();

		if ( ! empty( $data['forms'] ) && is_array( $data['forms'] ) ) {
			$forms_table = $this->plugin->get_forms_table_name();

			foreach ( $data['forms'] as $form ) {
				$old_id = isset( $form['id'] ) ? (int) $form['id'] : 0;

				$inserted = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$forms_table,
					array(
						'title'         => isset( $form['title'] ) ? sanitize_text_field( (string) $form['title'] ) : '',
						'status'        => isset( $form['status'] ) ? sanitize_key( (string) $form['status'] ) : 'draft',
						'fields_json'   => isset( $form['fields_json'] ) ? wp_unslash( (string) $form['fields_json'] ) : '{}',
						'settings_json' => isset( $form['settings_json'] ) ? wp_unslash( (string) $form['settings_json'] ) : '{}',
						'created_by'    => get_current_user_id(),
					),
					array( '%s', '%s', '%s', '%s', '%d' )
				);

				if ( $inserted ) {
					$id_map[ $old_id ] = (int) $wpdb->insert_id;
					++$forms_imported;
				}
			}
		}

		if ( ! empty( $data['entries'] ) && is_array( $data['entries'] ) ) {
			$entries_table = $this->plugin->get_entries_table_name();

			foreach ( $data['entries'] as $entry ) {
				$old_form_id = isset( $entry['form_id'] ) ? (int) $entry['form_id'] : 0;
				$new_form_id = isset( $id_map[ $old_form_id ] ) ? $id_map[ $old_form_id ] : $old_form_id;

				$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$entries_table,
					array(
						'form_id'         => $new_form_id,
						'entry_data_json' => isset( $entry['entry_data_json'] ) ? wp_unslash( (string) $entry['entry_data_json'] ) : '{}',
						'submission_key'  => isset( $entry['submission_key'] ) ? sanitize_text_field( (string) $entry['submission_key'] ) : '',
						'user_id'         => isset( $entry['user_id'] ) ? absint( $entry['user_id'] ) : 0,
						'user_ip'         => isset( $entry['user_ip'] ) ? sanitize_text_field( (string) $entry['user_ip'] ) : '',
						'user_agent'      => isset( $entry['user_agent'] ) ? sanitize_textarea_field( (string) $entry['user_agent'] ) : '',
						'status'          => isset( $entry['status'] ) ? sanitize_key( (string) $entry['status'] ) : 'unread',
						'created_at'      => isset( $entry['created_at'] ) ? sanitize_text_field( (string) $entry['created_at'] ) : current_time( 'mysql', true ),
					),
					array( '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s' )
				);
			}
		}

		if ( ! empty( $data['settings'] ) && is_array( $data['settings'] ) ) {
			$existing = get_option( 'boldform_lite_settings', array() );

			if ( ! is_array( $existing ) ) {
				$existing = array();
			}

			$imported_settings = $data['settings'];
			unset( $imported_settings['smtp_password'] );

			update_option( 'boldform_lite_settings', array_merge( $existing, $imported_settings ) );
		}

		return $forms_imported;
	}
}
