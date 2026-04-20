<?php
/**
 * BoldForm Integrations admin page.
 *
 * Unified integrations list — each service is a row with toggle + settings.
 * Free: Mailchimp, Brevo (fully configurable).
 * Pro:  ActiveCampaign, ConvertKit, HubSpot, Google Sheets, Slack
 *       (shown with "Upgrade" badge; functional when Pro active).
 *
 * Connections stored in wp_options under `boldform_connections` keyed by type.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Integrations admin page handler.
 */
class BoldForm_Lite_Integrations_Page {

	/**
	 * Plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * wp_options key for global connections.
	 */
	const OPTION_KEY = 'boldform_connections';

	/**
	 * Free connection types.
	 */
	const FREE_TYPES = array( 'mailchimp', 'brevo' );

	/**
	 * All type definitions (extended by Pro via filter).
	 *
	 * @var array<string, array<string, mixed>>|null
	 */
	private static $type_defs = null;

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite $plugin Plugin instance.
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu',                              array( $this, 'register_menu' ), 20 );
		add_action( 'wp_ajax_boldform_connection_save',        array( $this, 'ajax_save_connection' ) );
		add_action( 'wp_ajax_boldform_connection_delete',      array( $this, 'ajax_delete_connection' ) );
		add_action( 'wp_ajax_boldform_connection_test',        array( $this, 'ajax_test_connection' ) );
		add_action( 'wp_ajax_boldform_connection_toggle',      array( $this, 'ajax_toggle_connection' ) );
		add_action( 'wp_ajax_boldform_connection_fetch_lists', array( $this, 'ajax_fetch_lists' ) );
		add_action( 'admin_enqueue_scripts',                   array( $this, 'enqueue_assets' ) );
	}

	// =====================================================================
	// Menu
	// =====================================================================

	/**
	 * Registers the Integrations submenu page.
	 *
	 * @return void
	 */
	public function register_menu(): void {
		add_submenu_page(
			'boldform-lite',
			__( 'Integrations', 'boldform-lite' ),
			__( 'Integrations', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-integrations',
			array( $this, 'render_page' )
		);
	}

	// =====================================================================
	// Assets
	// =====================================================================

	/**
	 * Enqueues JS/CSS only on the integrations page.
	 *
	 * @param string $hook Current admin hook suffix.
	 * @return void
	 */
	public function enqueue_assets( string $hook ): void {
		if ( false === strpos( $hook, 'boldform-lite-integrations' ) ) {
			return;
		}

		// Remove third-party admin notices.
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );

		wp_enqueue_style(
			'boldform-lite-admin',
			BOLDFORM_LITE_URL . 'assets/css/settings.css',
			array(),
			BOLDFORM_LITE_VERSION
		);

		wp_enqueue_style(
			'boldform-lite-integrations-page',
			BOLDFORM_LITE_URL . 'assets/css/integrations-page.css',
			array( 'boldform-lite-admin' ),
			BOLDFORM_LITE_VERSION
		);

		wp_enqueue_script(
			'boldform-lite-integrations-page',
			BOLDFORM_LITE_URL . 'assets/js/integrations-page.js',
			array( 'jquery' ),
			BOLDFORM_LITE_VERSION,
			true
		);

		$connections = $this->get_all_connections();

		wp_localize_script(
			'boldform-lite-integrations-page',
			'boldformIntegrationsPage',
			array(
				'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
				'nonce'       => wp_create_nonce( 'boldform_integration_nonce' ),
				'connections' => (object) $connections, // keyed by type or conn_id
				'typeDefs'    => array_values( $this->get_type_defs() ),
				'freeTypes'   => self::FREE_TYPES,
				'hasPro'      => (bool) apply_filters( 'boldform_has_pro', false ),
				'i18n'        => array(
					'save'           => __( 'Save', 'boldform-lite' ),
					'saving'         => __( 'Saving…', 'boldform-lite' ),
					'test'           => __( 'Test Connection', 'boldform-lite' ),
					'testing'        => __( 'Testing…', 'boldform-lite' ),
					'delete'         => __( 'Delete', 'boldform-lite' ),
					'confirmDelete'  => __( 'Remove this connection and its settings?', 'boldform-lite' ),
					'selectList'     => __( '— select —', 'boldform-lite' ),
					'active'         => __( 'Active', 'boldform-lite' ),
					'inactive'       => __( 'Inactive', 'boldform-lite' ),
					'testOk'         => __( 'Connection successful!', 'boldform-lite' ),
					'testFail'       => __( 'Connection failed: ', 'boldform-lite' ),
					'saved'          => __( 'Saved.', 'boldform-lite' ),
					'errRequired'    => __( 'API Key is required.', 'boldform-lite' ),
					'upgradeTo'      => __( 'Upgrade to Pro', 'boldform-lite' ),
				),
			)
		);
	}

	// =====================================================================
	// Page render
	// =====================================================================

	/**
	 * Renders the Integrations admin page.
	 *
	 * @return void
	 */
	public function render_page(): void {
		$active_tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'all'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$active_tab  = in_array( $active_tab, array( 'all', 'newsletter', 'crm', 'productivity', 'automation', 'messaging', 'storage' ), true ) ? $active_tab : 'all';
		$type_defs   = $this->get_type_defs();
		$has_pro     = (bool) apply_filters( 'boldform_has_pro', false );
		$connections = $this->get_all_connections();
		?>
		<?php $this->render_topbar(); ?>
		<div class="wrap boldform-int-page">
			<hr class="wp-header-end">

			<div class="boldform-int-header">
				<h1><?php esc_html_e( 'Integrations', 'boldform-lite' ); ?></h1>
				<p><?php esc_html_e( 'Connect your forms to email marketing, CRMs, and apps.', 'boldform-lite' ); ?></p>
			</div>

			<!-- Tabs -->
			<div class="boldform-int-tabs">
				<?php
				$tabs = array(
					'all'          => __( 'All', 'boldform-lite' ),
					'newsletter'   => __( 'Newsletter', 'boldform-lite' ),
					'crm'          => __( 'CRM', 'boldform-lite' ),
					'productivity' => __( 'Productivity', 'boldform-lite' ),
					'automation'   => __( 'Automation', 'boldform-lite' ),
					'messaging'    => __( 'Messaging', 'boldform-lite' ),
					'storage'      => __( 'Storage', 'boldform-lite' ),
				);
				foreach ( $tabs as $tab_key => $tab_label ) :
				?>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-integrations&tab=' . $tab_key ) ); ?>"
					   class="boldform-int-tab<?php echo $tab_key === $active_tab ? ' is-active' : ''; ?>">
						<?php echo esc_html( $tab_label ); ?>
					</a>
				<?php endforeach; ?>
			</div>

			<!-- Integration grid -->
			<div class="bf-int-grid">
				<?php foreach ( $type_defs as $type => $def ) :
					if ( 'all' !== $active_tab && ( $def['category'] ?? 'newsletter' ) !== $active_tab ) {
						continue;
					}

					$is_free  = in_array( $type, self::FREE_TYPES, true );
					$is_pro   = ! $is_free;
					$locked   = $is_pro && ! $has_pro;
					$conn     = null;

					foreach ( $connections as $c ) {
						if ( ( $c['type'] ?? '' ) === $type ) {
							$conn = $c;
							break;
						}
					}

					$is_on = $conn && 'active' === ( $conn['status'] ?? 'inactive' );
				?>
					<div class="bf-int-card<?php echo $is_on ? ' is-on' : ''; ?><?php echo $locked ? ' is-locked' : ''; ?>"
						 data-type="<?php echo esc_attr( $type ); ?>"
						 data-conn-id="<?php echo esc_attr( $conn ? $conn['id'] : '' ); ?>"
						 style="--bf-svc-color:<?php echo esc_attr( $def['color'] ); ?>">

						<div class="bf-int-card__icon" style="background:<?php echo esc_attr( $def['color'] ); ?>">
							<span class="dashicons <?php echo esc_attr( $def['icon'] ); ?>" style="color:<?php echo esc_attr( $def['icon_color'] ); ?>"></span>
						</div>

						<span class="bf-int-card__name"><?php echo esc_html( $def['label'] ); ?></span>
						<span class="bf-int-card__desc"><?php echo esc_html( $def['desc'] ?? '' ); ?></span>

						<div class="bf-int-card__actions">
							<?php if ( $locked ) : ?>
								<a href="https://boldform.dev/pro" target="_blank" class="bf-int-card__upgrade">
									<?php esc_html_e( 'Upgrade to Pro', 'boldform-lite' ); ?>
								</a>
							<?php else : ?>
								<label class="bf-int-toggle" title="<?php echo $is_on ? esc_attr__( 'Disable', 'boldform-lite' ) : esc_attr__( 'Enable', 'boldform-lite' ); ?>">
									<input type="checkbox" class="bf-toggle-input" data-type="<?php echo esc_attr( $type ); ?>"<?php echo $is_on ? ' checked' : ''; ?>>
									<span class="bf-int-toggle__track"></span>
								</label>

								<button type="button" class="bf-int-card__settings bf-settings-btn" data-type="<?php echo esc_attr( $type ); ?>" title="<?php esc_attr_e( 'Settings', 'boldform-lite' ); ?>">
									<span class="dashicons dashicons-admin-generic"></span>
								</button>
							<?php endif; ?>
						</div>
					</div>
				<?php endforeach; ?>
			</div>

			<!-- Modal -->
			<div class="bf-conn-modal" id="bf-conn-modal" hidden>
				<div class="bf-conn-modal__backdrop" id="bf-conn-modal-backdrop"></div>
				<div class="bf-conn-modal__dialog" role="dialog" aria-modal="true">
					<div class="bf-conn-modal__head">
						<span class="bf-conn-modal__title" id="bf-conn-modal-title"></span>
						<button type="button" class="bf-conn-modal__close" id="bf-conn-modal-close">&times;</button>
					</div>
					<div class="bf-conn-modal__body" id="bf-conn-modal-body"></div>
					<div class="bf-conn-modal__foot">
						<span class="bf-conn-modal__status" id="bf-conn-modal-status"></span>
						<div class="bf-conn-modal__actions">
							<button type="button" class="button" id="bf-conn-modal-cancel"><?php esc_html_e( 'Cancel', 'boldform-lite' ); ?></button>
							<button type="button" class="button button-secondary" id="bf-conn-test-btn"><?php esc_html_e( 'Test Connection', 'boldform-lite' ); ?></button>
							<button type="button" class="button button-primary" id="bf-conn-save-btn"><?php esc_html_e( 'Save', 'boldform-lite' ); ?></button>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the shared admin topbar.
	 *
	 * @return void
	 */
	private function render_topbar(): void {
		$nav_items = array(
			array( 'slug' => 'boldform-lite',              'label' => __( 'Forms', 'boldform-lite' ),        'icon' => 'dashicons-feedback',      'url' => admin_url( 'admin.php?page=boldform-lite' ) ),
			array( 'slug' => 'boldform-lite-entries',       'label' => __( 'Entries', 'boldform-lite' ),      'icon' => 'dashicons-email-alt',     'url' => admin_url( 'admin.php?page=boldform-lite-entries' ) ),
			array( 'slug' => 'boldform-lite-reports',       'label' => __( 'Reports', 'boldform-lite' ),      'icon' => 'dashicons-chart-bar',     'url' => admin_url( 'admin.php?page=boldform-lite-reports' ) ),
			array( 'slug' => 'boldform-lite-integrations',  'label' => __( 'Integrations', 'boldform-lite' ), 'icon' => 'dashicons-randomize',     'url' => admin_url( 'admin.php?page=boldform-lite-integrations' ) ),
			array( 'slug' => 'boldform-lite-settings',      'label' => __( 'Settings', 'boldform-lite' ),     'icon' => 'dashicons-admin-generic', 'url' => admin_url( 'admin.php?page=boldform-lite-settings' ) ),
			array( 'slug' => 'boldform-lite-settings#smtp',  'label' => __( 'SMTP', 'boldform-lite' ),        'icon' => 'dashicons-email',         'url' => admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp' ) ),
			array( 'slug' => 'boldform-lite-settings#tools', 'label' => __( 'Tools', 'boldform-lite' ),       'icon' => 'dashicons-admin-tools',   'url' => admin_url( 'admin.php?page=boldform-lite-settings&tab=tools' ) ),
		);
		$nav_items = apply_filters( 'boldform_admin_topbar_items', $nav_items, 'boldform-lite-integrations' );
		?>
		<div class="boldform-admin-topbar">
			<div class="boldform-admin-topbar__brand">
				<span class="dashicons dashicons-feedback"></span>
				<span class="boldform-admin-topbar__name"><?php esc_html_e( 'BoldForm', 'boldform-lite' ); ?></span>
				<span class="boldform-admin-topbar__version"><?php echo esc_html( BOLDFORM_LITE_VERSION ); ?></span>
			</div>
			<nav class="boldform-admin-topbar__nav">
				<?php foreach ( $nav_items as $item ) : ?>
					<a href="<?php echo esc_url( $item['url'] ); ?>"
					   class="boldform-admin-topbar__link<?php echo 'boldform-lite-integrations' === $item['slug'] ? ' is-active' : ''; ?>">
						<span class="dashicons <?php echo esc_attr( $item['icon'] ); ?>"></span>
						<?php echo esc_html( $item['label'] ); ?>
					</a>
				<?php endforeach; ?>
			</nav>
		</div>
		<?php
	}

	// =====================================================================
	// Connection CRUD
	// =====================================================================

	/** @return array<string, array<string, mixed>> */
	public function get_all_connections(): array {
		$raw = get_option( self::OPTION_KEY, array() );
		return is_array( $raw ) ? $raw : array();
	}

	/** @return array<string, mixed>|null */
	public function get_connection( string $id ): ?array {
		$all = $this->get_all_connections();
		return $all[ $id ] ?? null;
	}

	/** @return string Connection ID. */
	public function upsert_connection( array $data ): string {
		$all  = $this->get_all_connections();
		$id   = ! empty( $data['id'] ) ? sanitize_key( (string) $data['id'] ) : 'conn_' . wp_generate_uuid4();
		$type = sanitize_key( (string) ( $data['type'] ?? '' ) );

		$normalized = array(
			'id'     => $id,
			'type'   => $type,
			'name'   => sanitize_text_field( (string) ( $data['name'] ?? '' ) ),
			'status' => ! empty( $data['status'] ) && 'active' === $data['status'] ? 'active' : 'inactive',
		);

		$normalized = array_merge( $normalized, $this->normalize_type_fields( $data, $type ) );

		$all[ $id ] = $normalized;
		update_option( self::OPTION_KEY, $all, false );

		return $id;
	}

	/** @return void */
	public function delete_connection( string $id ): void {
		$all = $this->get_all_connections();
		unset( $all[ $id ] );
		update_option( self::OPTION_KEY, $all, false );
	}

	/**
	 * Normalizes type-specific fields.
	 *
	 * @param array<string, mixed> $data Raw data.
	 * @param string               $type Connection type.
	 * @return array<string, mixed>
	 */
	private function normalize_type_fields( array $data, string $type ): array {
		$fields = array(
			'api_key'      => sanitize_text_field( (string) ( $data['api_key'] ?? '' ) ),
			'list_id'      => sanitize_text_field( (string) ( $data['list_id'] ?? '' ) ),
			'tags'         => sanitize_text_field( (string) ( $data['tags'] ?? '' ) ),
			'double_optin' => ! empty( $data['double_optin'] ),
		);

		return (array) apply_filters( 'boldform_connection_normalize_fields', $fields, $data, $type );
	}

	// =====================================================================
	// Type definitions
	// =====================================================================

	/** @return array<string, array<string, mixed>> */
	public function get_type_defs(): array {
		if ( self::$type_defs !== null ) {
			return self::$type_defs;
		}

		$defs = array(
			'mailchimp' => array(
				'type'       => 'mailchimp',
				'label'      => 'Mailchimp',
				'icon'       => 'dashicons-email-alt',
				'color'      => '#ffe01b',
				'icon_color' => '#241c15',
				'category'   => 'newsletter',
				'desc'       => __( 'Sync subscribers to a Mailchimp audience.', 'boldform-lite' ),
				'list_label' => __( 'Audience', 'boldform-lite' ),
				'fields'     => array(
					array( 'key' => 'api_key',      'label' => 'API Key',              'type' => 'password', 'required' => true, 'placeholder' => 'xxxxxxxxxxxx-us6' ),
					array( 'key' => 'list_id',      'label' => 'Audience',             'type' => 'list_select', 'required' => true ),
					array( 'key' => 'tags',         'label' => 'Tags',                 'type' => 'text',     'placeholder' => 'newsletter, webform' ),
					array( 'key' => 'double_optin', 'label' => 'Enable double opt-in', 'type' => 'checkbox' ),
				),
			),
			'brevo' => array(
				'type'       => 'brevo',
				'label'      => 'Brevo',
				'icon'       => 'dashicons-email',
				'color'      => '#0b996e',
				'icon_color' => '#ffffff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add contacts to a Brevo contact list.', 'boldform-lite' ),
				'list_label' => __( 'Contact List', 'boldform-lite' ),
				'fields'     => array(
					array( 'key' => 'api_key', 'label' => 'API Key',      'type' => 'password', 'required' => true, 'placeholder' => 'xkeysib-…' ),
					array( 'key' => 'list_id', 'label' => 'Contact List', 'type' => 'list_select', 'required' => true ),
					array( 'key' => 'tags',    'label' => 'Tags',         'type' => 'text',     'placeholder' => 'subscriber' ),
				),
			),
			// Pro types — always shown, locked unless Pro is active. Fields injected by Pro via filter.
			// ── Newsletter ──
			'activecampaign' => array(
				'type'       => 'activecampaign',
				'label'      => 'ActiveCampaign',
				'icon'       => 'dashicons-megaphone',
				'color'      => '#356ae6',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add contacts and apply tags in ActiveCampaign.', 'boldform-lite' ),
				'list_label' => __( 'List', 'boldform-lite' ),
				'fields'     => array(),
			),
			'convertkit' => array(
				'type'       => 'convertkit',
				'label'      => 'Kit (ConvertKit)',
				'icon'       => 'dashicons-rss',
				'color'      => '#fb6970',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Subscribe to a Kit form or sequence.', 'boldform-lite' ),
				'list_label' => __( 'Form', 'boldform-lite' ),
				'fields'     => array(),
			),
			'aweber' => array(
				'type'       => 'aweber',
				'label'      => 'AWeber',
				'icon'       => 'dashicons-email-alt2',
				'color'      => '#2c5aa0',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add subscribers to an AWeber list.', 'boldform-lite' ),
				'list_label' => __( 'List', 'boldform-lite' ),
				'fields'     => array(),
			),
			'getresponse' => array(
				'type'       => 'getresponse',
				'label'      => 'GetResponse',
				'icon'       => 'dashicons-email',
				'color'      => '#00baff',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add contacts to a GetResponse campaign.', 'boldform-lite' ),
				'list_label' => __( 'Campaign', 'boldform-lite' ),
				'fields'     => array(),
			),
			'mailerlite' => array(
				'type'       => 'mailerlite',
				'label'      => 'MailerLite',
				'icon'       => 'dashicons-email-alt',
				'color'      => '#09c269',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add subscribers to a MailerLite group.', 'boldform-lite' ),
				'list_label' => __( 'Group', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── CRM & Apps ──
			'hubspot' => array(
				'type'       => 'hubspot',
				'label'      => 'HubSpot',
				'icon'       => 'dashicons-networking',
				'color'      => '#ff7a59',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create or update HubSpot CRM contacts.', 'boldform-lite' ),
				'list_label' => __( 'Portal', 'boldform-lite' ),
				'fields'     => array(),
			),
			'zoho' => array(
				'type'       => 'zoho',
				'label'      => 'Zoho CRM',
				'icon'       => 'dashicons-groups',
				'color'      => '#e42527',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Push leads and contacts to Zoho CRM.', 'boldform-lite' ),
				'list_label' => __( 'Module', 'boldform-lite' ),
				'fields'     => array(),
			),
			'helpscout' => array(
				'type'       => 'helpscout',
				'label'      => 'Help Scout',
				'icon'       => 'dashicons-sos',
				'color'      => '#1292ee',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create conversations in Help Scout.', 'boldform-lite' ),
				'list_label' => __( 'Mailbox', 'boldform-lite' ),
				'fields'     => array(),
			),
			'fluentcrm' => array(
				'type'       => 'fluentcrm',
				'label'      => 'FluentCRM',
				'icon'       => 'dashicons-admin-users',
				'color'      => '#7742e6',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Add contacts and tags in FluentCRM.', 'boldform-lite' ),
				'list_label' => __( 'List', 'boldform-lite' ),
				'fields'     => array(),
			),
			'googlesheets' => array(
				'type'       => 'googlesheets',
				'label'      => 'Google Sheets',
				'icon'       => 'dashicons-media-spreadsheet',
				'color'      => '#34a853',
				'icon_color' => '#fff',
				'category'   => 'storage',
				'desc'       => __( 'Append each submission as a new row.', 'boldform-lite' ),
				'list_label' => __( 'Spreadsheet', 'boldform-lite' ),
				'fields'     => array(),
			),
			'dropbox' => array(
				'type'       => 'dropbox',
				'label'      => 'Dropbox',
				'icon'       => 'dashicons-cloud-saved',
				'color'      => '#0061fe',
				'icon_color' => '#fff',
				'category'   => 'storage',
				'desc'       => __( 'Upload file submissions to Dropbox.', 'boldform-lite' ),
				'list_label' => __( 'Folder', 'boldform-lite' ),
				'fields'     => array(),
			),
			'slack' => array(
				'type'       => 'slack',
				'label'      => 'Slack',
				'icon'       => 'dashicons-format-chat',
				'color'      => '#4a154b',
				'icon_color' => '#fff',
				'category'   => 'messaging',
				'desc'       => __( 'Post a notification to a Slack channel.', 'boldform-lite' ),
				'list_label' => __( 'Channel', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── Newsletter (new) ──
			'constantcontact' => array(
				'type'       => 'constantcontact',
				'label'      => 'Constant Contact',
				'icon'       => 'dashicons-email-alt',
				'color'      => '#0076be',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add contacts to a Constant Contact list.', 'boldform-lite' ),
				'list_label' => __( 'List', 'boldform-lite' ),
				'fields'     => array(),
			),
			'drip' => array(
				'type'       => 'drip',
				'label'      => 'Drip',
				'icon'       => 'dashicons-migrate',
				'color'      => '#613ebe',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Subscribe to a Drip campaign.', 'boldform-lite' ),
				'list_label' => __( 'Campaign', 'boldform-lite' ),
				'fields'     => array(),
			),
			'moosend' => array(
				'type'       => 'moosend',
				'label'      => 'Moosend',
				'icon'       => 'dashicons-email',
				'color'      => '#02b15a',
				'icon_color' => '#fff',
				'category'   => 'newsletter',
				'desc'       => __( 'Add subscribers to a Moosend mailing list.', 'boldform-lite' ),
				'list_label' => __( 'Mailing List', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── CRM (new) ──
			'salesforce' => array(
				'type'       => 'salesforce',
				'label'      => 'Salesforce',
				'icon'       => 'dashicons-cloud',
				'color'      => '#00a1e0',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create leads or contacts in Salesforce.', 'boldform-lite' ),
				'list_label' => __( 'Object', 'boldform-lite' ),
				'fields'     => array(),
			),
			'pipedrive' => array(
				'type'       => 'pipedrive',
				'label'      => 'Pipedrive',
				'icon'       => 'dashicons-chart-line',
				'color'      => '#017737',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create deals and contacts in Pipedrive.', 'boldform-lite' ),
				'list_label' => __( 'Pipeline', 'boldform-lite' ),
				'fields'     => array(),
			),
			'freshsales' => array(
				'type'       => 'freshsales',
				'label'      => 'Freshsales',
				'icon'       => 'dashicons-businessman',
				'color'      => '#f36c21',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create leads in Freshsales CRM.', 'boldform-lite' ),
				'list_label' => __( 'View', 'boldform-lite' ),
				'fields'     => array(),
			),
			'monday' => array(
				'type'       => 'monday',
				'label'      => 'Monday.com',
				'icon'       => 'dashicons-grid-view',
				'color'      => '#ff3d57',
				'icon_color' => '#fff',
				'category'   => 'crm',
				'desc'       => __( 'Create items on a Monday.com board.', 'boldform-lite' ),
				'list_label' => __( 'Board', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── Productivity ──
			'notion' => array(
				'type'       => 'notion',
				'label'      => 'Notion',
				'icon'       => 'dashicons-editor-table',
				'color'      => '#000000',
				'icon_color' => '#fff',
				'category'   => 'productivity',
				'desc'       => __( 'Add entries to a Notion database.', 'boldform-lite' ),
				'list_label' => __( 'Database', 'boldform-lite' ),
				'fields'     => array(),
			),
			'airtable' => array(
				'type'       => 'airtable',
				'label'      => 'Airtable',
				'icon'       => 'dashicons-layout',
				'color'      => '#18bfff',
				'icon_color' => '#fff',
				'category'   => 'productivity',
				'desc'       => __( 'Create records in an Airtable base.', 'boldform-lite' ),
				'list_label' => __( 'Table', 'boldform-lite' ),
				'fields'     => array(),
			),
			'trello' => array(
				'type'       => 'trello',
				'label'      => 'Trello',
				'icon'       => 'dashicons-columns',
				'color'      => '#0052cc',
				'icon_color' => '#fff',
				'category'   => 'productivity',
				'desc'       => __( 'Create cards on a Trello board.', 'boldform-lite' ),
				'list_label' => __( 'List', 'boldform-lite' ),
				'fields'     => array(),
			),
			'asana' => array(
				'type'       => 'asana',
				'label'      => 'Asana',
				'icon'       => 'dashicons-list-view',
				'color'      => '#f06a6a',
				'icon_color' => '#fff',
				'category'   => 'productivity',
				'desc'       => __( 'Create tasks in an Asana project.', 'boldform-lite' ),
				'list_label' => __( 'Project', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── Automation ──
			'zapier' => array(
				'type'       => 'zapier',
				'label'      => 'Zapier',
				'icon'       => 'dashicons-controls-repeat',
				'color'      => '#ff4a00',
				'icon_color' => '#fff',
				'category'   => 'automation',
				'desc'       => __( 'Trigger a Zapier webhook on submission.', 'boldform-lite' ),
				'list_label' => __( 'Zap', 'boldform-lite' ),
				'fields'     => array(),
			),
			'make' => array(
				'type'       => 'make',
				'label'      => 'Make (Integromat)',
				'icon'       => 'dashicons-update',
				'color'      => '#6d00cc',
				'icon_color' => '#fff',
				'category'   => 'automation',
				'desc'       => __( 'Trigger a Make scenario via webhook.', 'boldform-lite' ),
				'list_label' => __( 'Scenario', 'boldform-lite' ),
				'fields'     => array(),
			),
			'pabbly' => array(
				'type'       => 'pabbly',
				'label'      => 'Pabbly Connect',
				'icon'       => 'dashicons-randomize',
				'color'      => '#333333',
				'icon_color' => '#fff',
				'category'   => 'automation',
				'desc'       => __( 'Trigger a Pabbly Connect workflow.', 'boldform-lite' ),
				'list_label' => __( 'Workflow', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── Messaging ──
			'discord' => array(
				'type'       => 'discord',
				'label'      => 'Discord',
				'icon'       => 'dashicons-format-status',
				'color'      => '#5865f2',
				'icon_color' => '#fff',
				'category'   => 'messaging',
				'desc'       => __( 'Post notifications to a Discord channel.', 'boldform-lite' ),
				'list_label' => __( 'Channel', 'boldform-lite' ),
				'fields'     => array(),
			),
			'telegram' => array(
				'type'       => 'telegram',
				'label'      => 'Telegram',
				'icon'       => 'dashicons-share-alt2',
				'color'      => '#26a5e4',
				'icon_color' => '#fff',
				'category'   => 'messaging',
				'desc'       => __( 'Send messages to a Telegram chat.', 'boldform-lite' ),
				'list_label' => __( 'Chat', 'boldform-lite' ),
				'fields'     => array(),
			),
			'msteams' => array(
				'type'       => 'msteams',
				'label'      => 'Microsoft Teams',
				'icon'       => 'dashicons-groups',
				'color'      => '#6264a7',
				'icon_color' => '#fff',
				'category'   => 'messaging',
				'desc'       => __( 'Post notifications to a Teams channel.', 'boldform-lite' ),
				'list_label' => __( 'Channel', 'boldform-lite' ),
				'fields'     => array(),
			),
			// ── Storage ──
			'googledrive' => array(
				'type'       => 'googledrive',
				'label'      => 'Google Drive',
				'icon'       => 'dashicons-cloud-upload',
				'color'      => '#4285f4',
				'icon_color' => '#fff',
				'category'   => 'storage',
				'desc'       => __( 'Upload file submissions to Google Drive.', 'boldform-lite' ),
				'list_label' => __( 'Folder', 'boldform-lite' ),
				'fields'     => array(),
			),
		);

		self::$type_defs = (array) apply_filters( 'boldform_integration_type_defs', $defs );

		return self::$type_defs;
	}

	// =====================================================================
	// AJAX handlers
	// =====================================================================

	/** AJAX: save connection settings. */
	public function ajax_save_connection(): void {
		check_ajax_referer( 'boldform_integration_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$data = isset( $_POST['connection'] ) ? (array) wp_unslash( $_POST['connection'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( empty( $data['type'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Type is required.', 'boldform-lite' ) ) );
		}

		// Use type label as default name.
		if ( empty( $data['name'] ) ) {
			$defs = $this->get_type_defs();
			$data['name'] = $defs[ $data['type'] ]['label'] ?? $data['type'];
		}

		$id         = $this->upsert_connection( $data );
		$connection = $this->get_connection( $id );

		wp_send_json_success( array( 'connection' => $connection ) );
	}

	/** AJAX: delete connection. */
	public function ajax_delete_connection(): void {
		check_ajax_referer( 'boldform_integration_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$id = isset( $_POST['id'] ) ? sanitize_key( wp_unslash( $_POST['id'] ) ) : '';
		if ( $id ) {
			$this->delete_connection( $id );
		}
		wp_send_json_success();
	}

	/** AJAX: toggle connection active/inactive. */
	public function ajax_toggle_connection(): void {
		check_ajax_referer( 'boldform_integration_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$type   = isset( $_POST['type'] )   ? sanitize_key( wp_unslash( $_POST['type'] ) )   : '';
		$enable = isset( $_POST['enable'] ) && 'true' === $_POST['enable']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput

		if ( ! $type ) {
			wp_send_json_error( array( 'message' => __( 'Missing type.', 'boldform-lite' ) ) );
		}

		// Find existing connection for this type.
		$connections = $this->get_all_connections();
		$found       = null;
		foreach ( $connections as $c ) {
			if ( ( $c['type'] ?? '' ) === $type ) {
				$found = $c;
				break;
			}
		}

		if ( $enable ) {
			// Create or activate.
			$data = $found ? $found : array( 'type' => $type );
			$data['status'] = 'active';
			$id   = $this->upsert_connection( $data );
			$conn = $this->get_connection( $id );
			wp_send_json_success( array( 'connection' => $conn ) );
		} else {
			// Deactivate (keep settings).
			if ( $found ) {
				$found['status'] = 'inactive';
				$this->upsert_connection( $found );
			}
			wp_send_json_success();
		}
	}

	/** AJAX: test connection (validate + fetch lists). */
	public function ajax_test_connection(): void {
		check_ajax_referer( 'boldform_integration_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$type    = isset( $_POST['type'] )    ? sanitize_key( wp_unslash( $_POST['type'] ) )           : '';
		$api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		$extra   = isset( $_POST['extra'] )   ? (array) wp_unslash( $_POST['extra'] )                  : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		$result = $this->fetch_lists_for_type( $type, $api_key, $extra );

		if ( is_null( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Unknown integration type.', 'boldform-lite' ) ) );
		}
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success( array( 'lists' => $result ) );
	}

	/** AJAX: fetch lists for a saved connection. */
	public function ajax_fetch_lists(): void {
		check_ajax_referer( 'boldform_integration_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$conn_id = isset( $_POST['conn_id'] ) ? sanitize_key( wp_unslash( $_POST['conn_id'] ) ) : '';
		$conn    = $this->get_connection( $conn_id );

		if ( ! $conn || empty( $conn['api_key'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Connection not found.', 'boldform-lite' ) ) );
		}

		$result = $this->fetch_lists_for_type( $conn['type'], $conn['api_key'], $conn );

		if ( is_null( $result ) || is_wp_error( $result ) ) {
			wp_send_json_success( array( 'lists' => array() ) );
		} else {
			wp_send_json_success( array( 'lists' => $result ) );
		}
	}

	/**
	 * Dispatches list-fetch to the correct handler.
	 *
	 * @return array|WP_Error|null
	 */
	public function fetch_lists_for_type( string $type, string $api_key, array $extra = array() ) {
		switch ( $type ) {
			case 'mailchimp':
				return $this->fetch_mailchimp_lists( $api_key );
			case 'brevo':
				return $this->fetch_brevo_lists( $api_key );
			default:
				return apply_filters( 'boldform_connection_fetch_lists_' . $type, null, $type, $api_key, $extra );
		}
	}

	// =====================================================================
	// API clients (free)
	// =====================================================================

	private function fetch_mailchimp_lists( string $api_key ) {
		$api_key = trim( $api_key );
		$dc      = 'us1';
		if ( preg_match( '/-([a-z0-9]+)$/', $api_key, $m ) ) {
			$dc = $m[1];
		}

		$response = wp_remote_get(
			"https://{$dc}.api.mailchimp.com/3.0/lists?count=200&fields=lists.id,lists.name",
			array(
				'timeout' => 15,
				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( 'anystring:' . $api_key ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				),
			)
		);

		if ( is_wp_error( $response ) ) return $response;

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code !== 200 || ! isset( $body['lists'] ) ) {
			return new WP_Error( 'mailchimp_error', $body['detail'] ?? __( 'Invalid API key.', 'boldform-lite' ) );
		}

		return array_map( fn( $l ) => array( 'id' => (string) $l['id'], 'name' => (string) $l['name'] ), (array) $body['lists'] );
	}

	private function fetch_brevo_lists( string $api_key ) {
		$response = wp_remote_get(
			'https://api.brevo.com/v3/contacts/lists?limit=50&offset=0',
			array(
				'timeout' => 15,
				'headers' => array( 'api-key' => trim( $api_key ), 'Accept' => 'application/json' ),
			)
		);

		if ( is_wp_error( $response ) ) return $response;

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code !== 200 || ! isset( $body['lists'] ) ) {
			return new WP_Error( 'brevo_error', $body['message'] ?? __( 'Invalid API key.', 'boldform-lite' ) );
		}

		return array_map( fn( $l ) => array( 'id' => (string) $l['id'], 'name' => (string) $l['name'] ), (array) $body['lists'] );
	}
}
