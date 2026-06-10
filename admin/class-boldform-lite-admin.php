<?php
/**
 * Admin functionality for BoldForm Lite.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once BOLDFORM_LITE_PATH . 'admin/ajax-save.php';

/**
 * Handles WordPress admin UI registration.
 */
class BoldForm_Lite_Admin {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Builder page hook suffix.
	 *
	 * @var string
	 */
	private $builder_page_hook = '';

	/**
	 * List page hook suffix.
	 *
	 * @var string
	 */
	private $list_page_hook = '';

	/**
	 * Entries page hook suffix.
	 *
	 * @var string
	 */
	private $entries_page_hook = '';

	/**
	 * Preview page hook suffix.
	 *
	 * @var string
	 */
	private $preview_page_hook = '';

	/**
	 * Settings page hook suffix.
	 *
	 * @var string
	 */
	private $settings_page_hook = '';

	/**
	 * Reports page hook suffix.
	 *
	 * @var string
	 */
	private $reports_page_hook = '';

	/**
	 * Documentation page hook suffix.
	 *
	 * @var string
	 */
	private $docs_page_hook = '';

	/**
	 * AJAX handler.
	 *
	 * @var BoldForm_Lite_Ajax_Save
	 */
	private $ajax_handler;

	/**
	 * Constructor.
	 *
	 * @param BoldForm_Lite $plugin Main plugin instance.
	 */
	public function __construct( $plugin ) {
		$this->plugin       = $plugin;
		$this->ajax_handler = new BoldForm_Lite_Ajax_Save( $plugin );
	}

	/**
	 * Registers admin menus.
	 *
	 * @return void
	 */
	public function register_menu() {
		$this->list_page_hook = add_menu_page(
			__( 'Bold Form', 'boldform-lite' ),
			__( 'Bold Form', 'boldform-lite' ),
			'manage_options',
			'boldform-lite',
			array( $this, 'render_forms_page' ),
			$this->get_menu_icon_data_uri(),
			56
		);

		add_submenu_page(
			'boldform-lite',
			__( 'All Forms', 'boldform-lite' ),
			__( 'All Forms', 'boldform-lite' ),
			'manage_options',
			'boldform-lite',
			array( $this, 'render_forms_page' )
		);

		$this->builder_page_hook = add_submenu_page(
			'boldform-lite',
			__( 'Add New Form', 'boldform-lite' ),
			__( 'Add New', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-builder',
			array( $this, 'render_builder_page' )
		);

		$this->entries_page_hook = add_submenu_page(
			'boldform-lite',
			__( 'Entries', 'boldform-lite' ),
			__( 'Entries', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-entries',
			array( $this, 'render_entries_page' )
		);

		$this->settings_page_hook = add_submenu_page(
			'boldform-lite',
			__( 'Settings', 'boldform-lite' ),
			__( 'Settings', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-settings',
			array( $this, 'render_settings_page' )
		);

		$this->reports_page_hook = add_submenu_page(
			'boldform-lite',
			__( 'Reports', 'boldform-lite' ),
			__( 'Reports', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-reports',
			array( $this, 'render_reports_page' )
		);

		$this->preview_page_hook = add_submenu_page(
			'',
			__( 'Preview Form', 'boldform-lite' ),
			__( 'Preview Form', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-preview',
			array( $this, 'render_preview_page' )
		);

		add_action( 'load-' . $this->preview_page_hook, array( $this, 'set_preview_title' ) );

		// Help & Support — links to online documentation and support resources.
		$this->docs_page_hook = add_submenu_page(
			'boldform-lite',
			__( 'Help & Support', 'boldform-lite' ),
			__( 'Help & Support', 'boldform-lite' ),
			'manage_options',
			'boldform-lite-docs',
			array( $this, 'render_docs_page' )
		);

		/**
		 * Fires after BoldForm Lite registers all its admin submenu pages.
		 *
		 * Pro can add its own submenu pages (Payments, Integrations, etc.) under boldform-lite.
		 *
		 * @param BoldForm_Lite_Admin $admin The admin instance.
		 */
		do_action( 'boldform_admin_menu', $this );
	}

	/**
	 * Returns the brand mark as a base64 data-URI for use as the admin-menu icon.
	 *
	 * Rendered as a white silhouette so the raw data-URI still degrades to a visible
	 * icon if the mask CSS in print_menu_icon_styles() is unavailable; once masked,
	 * only the shape's alpha matters and the colour follows the admin colour scheme.
	 *
	 * @return string
	 */
	private function get_menu_icon_data_uri() {
		$svg = boldform_lite_get_brand_icon(
			array(
				'class' => '',
				'size'  => 32,
				'fill'  => '#fff',
			)
		);

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Inlining a static brand SVG as a menu icon; not obfuscation.
		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	/**
	 * Prints scoped CSS that renders the BoldForm menu icon as a colour-aware mask.
	 *
	 * A plain SVG background image cannot be recoloured, so it would ignore the admin
	 * colour scheme and the hover/current states. Painting the mask with currentColor
	 * lets WordPress's own .wp-menu-image:before colour rules drive it, so the logo
	 * dims, brightens on hover, and turns white when active in step with the native
	 * icons. The data-URI passed to add_menu_page() remains the no-CSS fallback.
	 *
	 * @return void
	 */
	public function print_menu_icon_styles() {
		$icon = $this->get_menu_icon_data_uri();
		$css  = '#toplevel_page_boldform-lite .wp-menu-image{position:relative;background-image:none!important;}'
			. '#toplevel_page_boldform-lite .wp-menu-image::before{'
			. 'content:"";position:absolute;top:0;right:0;bottom:0;left:0;'
			. 'background-color:currentColor;'
			. '-webkit-mask:url("' . $icon . '") center/20px auto no-repeat;'
			. 'mask:url("' . $icon . '") center/20px auto no-repeat;'
			. '}';

		// $css is fully static, developer-authored CSS; the only interpolated value is
		// a base64 data-URI of our own SVG (base64 alphabet only — no markup-breaking chars).
		echo '<style id="boldform-lite-menu-icon">' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Sets the global page title for the hidden preview page.
	 *
	 * @return void
	 */
	public function set_preview_title() {
		global $title;

		$title = __( 'Preview Form', 'boldform-lite' );
	}

	/**
	 * Tags the hidden Preview Form screen with a body class.
	 *
	 * The form builder's full-bleed layout removes #wpcontent's left gutter
	 * globally (in builder.css, which the preview page also loads). The preview
	 * page uses a normal .wrap and needs that gutter, so this class lets its CSS
	 * restore it — keeping the page symmetric and free of horizontal overflow.
	 *
	 * @param string $classes Space-separated admin body classes.
	 * @return string
	 */
	public function add_admin_body_class( $classes ) {
		$screen = get_current_screen();
		if ( $screen && $this->preview_page_hook === $screen->id ) {
			$classes .= ' boldform-preview-screen';
		}
		return $classes;
	}

	/**
	 * Allow SVG uploads in the media library.
	 *
	 * @param array<string, string> $mimes Allowed mime types.
	 * @return array<string, string>
	 */
	public function allow_svg_upload( $mimes ) {
		// Only expose SVG as an allowed upload type to users who can upload files (admins).
		// Never on the front end / for anonymous form submissions — SVGs can carry scripts
		// and would otherwise become a stored-XSS vector through form file fields.
		if ( ! current_user_can( 'upload_files' ) ) {
			return $mimes;
		}
		$mimes['svg']  = 'image/svg+xml';
		$mimes['svgz'] = 'image/svg+xml';
		return $mimes;
	}

	/**
	 * Fix SVG file type detection on upload.
	 *
	 * @param array<string, string|false> $data     File data.
	 * @param string                      $file     Full path to the file.
	 * @param string                      $filename The name of the file.
	 * @param string[]|null               $mimes    Allowed mime types.
	 * @return array<string, string|false>
	 */
	public function fix_svg_filetype( $data, $file, $filename, $mimes ) {
		// Mirror allow_svg_upload(): only treat .svg as a valid type for users who can
		// upload files, so the front-end upload path can never be tricked into accepting one.
		if ( ! current_user_can( 'upload_files' ) ) {
			return $data;
		}
		if ( ! empty( $data['ext'] ) && ! empty( $data['type'] ) ) {
			return $data;
		}
		$ext = pathinfo( $filename, PATHINFO_EXTENSION );
		if ( 'svg' === $ext || 'svgz' === $ext ) {
			$data['ext']  = $ext;
			$data['type'] = 'image/svg+xml';
		}
		return $data;
	}

	/**
	 * Cache-busting version string for a plugin asset.
	 *
	 * Uses the file's modification time so edits to the (hand-maintained) builder
	 * assets are picked up on a normal page load instead of being masked by the
	 * browser cache until the plugin version constant changes. Falls back to the
	 * plugin version if the file is unreadable.
	 *
	 * @param string $relative_path Asset path relative to the plugin root, e.g. 'assets/css/builder.css'.
	 * @return string Version string for wp_enqueue_*().
	 */
	private function asset_version( $relative_path ) {
		$absolute = BOLDFORM_LITE_PATH . ltrim( $relative_path, '/' );
		$mtime    = file_exists( $absolute ) ? filemtime( $absolute ) : false;
		return ( false !== $mtime ) ? (string) $mtime : BOLDFORM_LITE_VERSION;
	}

	/**
	 * Enqueues admin assets.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public function enqueue_assets( $hook_suffix ) {
		// Hide third-party admin notices on all BoldForm pages.
		$all_pages = array(
			$this->list_page_hook,
			$this->builder_page_hook,
			$this->entries_page_hook,
			$this->settings_page_hook,
			$this->reports_page_hook,
			$this->preview_page_hook,
			$this->docs_page_hook,
		);

		if ( in_array( $hook_suffix, $all_pages, true ) ) {
			remove_all_actions( 'admin_notices' );
			remove_all_actions( 'all_admin_notices' );
			add_action( 'admin_notices', array( $this, 'render_own_notices' ) );
		}

		if ( $this->builder_page_hook === $hook_suffix ) {
			$form_id     = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$form_record = $form_id ? $this->get_form( $form_id ) : null;
			$form_data   = $this->normalize_form_for_builder( $form_record );

			wp_enqueue_style(
				'boldform-lite-builder',
				BOLDFORM_LITE_URL . 'assets/css/builder.css',
				array(),
				$this->asset_version( 'assets/css/builder.css' )
			);

			wp_enqueue_script(
				'boldform-lite-sortable',
				BOLDFORM_LITE_URL . 'assets/js/sortable.js',
				array(),
				BOLDFORM_LITE_VERSION,
				true
			);

			wp_enqueue_media();

			wp_enqueue_script(
				'boldform-lite-builder',
				BOLDFORM_LITE_URL . 'assets/js/builder.js',
				array( 'jquery', 'boldform-lite-sortable' ),
				$this->asset_version( 'assets/js/builder.js' ),
				true
			);

			// Send the builder a fully normalized payload so the JS app does not need to understand raw DB rows.
			$builder_data = array(
					'ajaxUrl'            => admin_url( 'admin-ajax.php' ),
					'nonce'              => wp_create_nonce( 'boldform_lite_save_form' ),
					'formId'             => $form_data['id'],
					'formTitle'          => $form_data['title'],
					'formStructure'      => $form_data['structure'],
					'formSettings'       => $form_data['settings'],
					'fieldLibrary'       => $this->get_field_library(),
					'columnPresets'      => array(
						array(
							'value'  => '1',
							'label'  => __( '1 Column', 'boldform-lite' ),
							'widths' => array( '100%' ),
						),
						array(
							'value'  => '2',
							'label'  => __( '2 Columns', 'boldform-lite' ),
							'widths' => array( '50%', '50%' ),
						),
						array(
							'value'  => '3',
							'label'  => __( '3 Columns', 'boldform-lite' ),
							'widths' => array( '33.33%', '33.33%', '33.33%' ),
						),
						array(
							'value'  => '4',
							'label'  => __( '4 Columns', 'boldform-lite' ),
							'widths' => array( '25%', '25%', '25%', '25%' ),
						),
					),
					'saveText'           => __( 'Save Form', 'boldform-lite' ),
						'savingText'         => __( 'Saving...', 'boldform-lite' ),
					'emptyCanvasText'    => __( 'Start building your form by adding a row, then drag or click fields into a column.', 'boldform-lite' ),
					'selectFieldText'    => __( 'Select a field to edit its settings.', 'boldform-lite' ),
					'defaultFormTitle'   => __( 'Untitled Form', 'boldform-lite' ),
					'exampleOptionsText' => __( 'Option 1, Option 2', 'boldform-lite' ),
					'pages'              => $this->get_pages_for_redirect(),
					'defaults'           => array(
						'thankYouMessage'  => __( 'Thanks! Your form was submitted successfully.', 'boldform-lite' ),
						'submitText'       => __( 'Submit', 'boldform-lite' ),
						'option1'          => __( 'Option 1', 'boldform-lite' ),
						'option2'          => __( 'Option 2', 'boldform-lite' ),
						'termsContent'     => __( 'I agree to the <a href="#">terms and conditions</a>.', 'boldform-lite' ),
						'sectionDesc'      => __( 'Add a short description for this section.', 'boldform-lite' ),
					),
					'actions'            => array(
						'duplicate' => __( 'Duplicate', 'boldform-lite' ),
						'delete'    => __( 'Delete', 'boldform-lite' ),
						'addRow'    => __( 'Add Row', 'boldform-lite' ),
					),
					'labels'             => array(
						'label'        => __( 'Label', 'boldform-lite' ),
						'selectedField'=> __( 'Selected Field', 'boldform-lite' ),
						'placeholder'  => __( 'Placeholder', 'boldform-lite' ),
						'defaultValue' => __( 'Default Value', 'boldform-lite' ),
						'required'     => __( 'Required', 'boldform-lite' ),
						'customError'  => __( 'Custom error message', 'boldform-lite' ),
						'options'      => __( 'Options', 'boldform-lite' ),
						'optionsHelp'  => __( 'Separate options with commas.', 'boldform-lite' ),
						'optionsLayout'      => __( 'Options Layout', 'boldform-lite' ),
						'optionsLayoutBlock'  => __( 'Stacked (default)', 'boldform-lite' ),
						'optionsLayoutInline' => __( 'Inline', 'boldform-lite' ),
						'columnWidth'  => __( 'Column Width', 'boldform-lite' ),
						'layout'       => __( 'Layout', 'boldform-lite' ),
						'basicFields'  => __( 'Basic Fields', 'boldform-lite' ),
						'advancedFields' => __( 'Advanced Fields', 'boldform-lite' ),
						'row'          => __( 'Row', 'boldform-lite' ),
						'columns'      => __( 'columns', 'boldform-lite' ),
						'fields'       => __( 'fields', 'boldform-lite' ),
						'dropHere'     => __( 'Drop fields here', 'boldform-lite' ),
						'blankTemplateTitle' => __( 'Blank Form', 'boldform-lite' ),
						'contactTemplateTitle' => __( 'Contact Form', 'boldform-lite' ),
						'leadTemplateTitle' => __( 'Lead Capture Form', 'boldform-lite' ),
						'contactTemplateDescription' => __( 'A simple contact form with name, email, subject, and message.', 'boldform-lite' ),
						'leadTemplateDescription' => __( 'A lead form for collecting contact details, budget, and project needs.', 'boldform-lite' ),
						'feedbackTemplateTitle' => __( 'Feedback Form', 'boldform-lite' ),
						'feedbackTemplateDescription' => __( 'Collect user feedback with rating and comments.', 'boldform-lite' ),
						'newsletterTemplateTitle' => __( 'Newsletter Signup', 'boldform-lite' ),
						'newsletterTemplateDescription' => __( 'Simple email signup with name for newsletters.', 'boldform-lite' ),
						'registrationTemplateTitle' => __( 'Registration Form', 'boldform-lite' ),
						'registrationTemplateDescription' => __( 'Event or account registration with full details.', 'boldform-lite' ),
						'importTemplate' => __( 'Import Template', 'boldform-lite' ),
						'enableAjax'   => __( 'Enable AJAX submit', 'boldform-lite' ),
						'enableRedirect' => __( 'Enable redirect after submit', 'boldform-lite' ),
						'redirectUrl'  => __( 'Redirect URL', 'boldform-lite' ),
						'thankYouMessage' => __( 'Thank you message', 'boldform-lite' ),
						'submitBehavior' => __( 'Submission Settings', 'boldform-lite' ),
						'submissionType' => __( 'After Submit', 'boldform-lite' ),
						'ajaxSubmit' => __( 'AJAX submit', 'boldform-lite' ),
						'ajaxSubmitHelp' => __( 'Submit without page reload and show a success message.', 'boldform-lite' ),
						'customPageRedirect' => __( 'Custom page redirect', 'boldform-lite' ),
						'customPageRedirectHelp' => __( 'Send the user to a custom URL after submit.', 'boldform-lite' ),
						'enableAdminEmail' => __( 'Enable admin email', 'boldform-lite' ),
						'enableUserEmail' => __( 'Enable user confirmation email', 'boldform-lite' ),
						'adminEmailAddress' => __( 'Admin email address', 'boldform-lite' ),
						'emailRecipient' => __( 'Admin Email Recipient', 'boldform-lite' ),
						'siteAdminEmail' => __( 'Site admin email', 'boldform-lite' ),
						'siteAdminEmailHelp' => __( 'Use the email address from WordPress settings.', 'boldform-lite' ),
						'customEmail' => __( 'Custom email', 'boldform-lite' ),
						'customEmailHelp' => __( 'Send notifications to a custom email address.', 'boldform-lite' ),
						'adminNotifications' => __( 'Admin Notifications', 'boldform-lite' ),
						'userNotifications' => __( 'User Confirmation Email', 'boldform-lite' ),
						'termsContent' => __( 'Terms text', 'boldform-lite' ),
						'captchaNotice' => __( 'This field will use the captcha provider selected in global settings.', 'boldform-lite' ),
						'fileUploadHint' => __( 'Choose file or drag & drop', 'boldform-lite' ),
						'allowedTypes'   => __( 'Allowed file types', 'boldform-lite' ),
						'maxFileSize'    => __( 'Max file size (MB)', 'boldform-lite' ),
						'sectionDescription' => __( 'Description', 'boldform-lite' ),
						'submitButton' => __( 'Submit Button', 'boldform-lite' ),
						'buttonText' => __( 'Button text', 'boldform-lite' ),
						'buttonAlignment' => __( 'Button alignment', 'boldform-lite' ),
						'buttonLayout' => __( 'Button layout', 'boldform-lite' ),
						'buttonIconType'  => __( 'Icon', 'boldform-lite' ),
						'dashicon'        => __( 'Dashicon', 'boldform-lite' ),
						'customSvg'       => __( 'Custom SVG', 'boldform-lite' ),
						'dashiconClass'   => __( 'Dashicon', 'boldform-lite' ),
						'uploadSvg'       => __( 'Upload SVG', 'boldform-lite' ),
						'changeSvg'       => __( 'Change SVG', 'boldform-lite' ),
						'useSvg'          => __( 'Use this SVG', 'boldform-lite' ),
						'svgCode'         => __( 'SVG Icon', 'boldform-lite' ),
						'iconPosition'    => __( 'Icon position', 'boldform-lite' ),
						'iconGap'         => __( 'Icon gap (px)', 'boldform-lite' ),
						'cssClass'          => __( 'CSS Class', 'boldform-lite' ),
						'autoPopulateKey'   => __( 'Auto Populate Key', 'boldform-lite' ),
						'autoPopulateDesc'  => __( 'Pre-fill from URL parameter (?key=value) or logged-in user data (email, first_name, last_name, display_name). Pro: also meta_*, post_meta_*, query_*.', 'boldform-lite' ),
						'rowSettings'     => __( 'Row settings', 'boldform-lite' ),
						'moveUp'          => __( 'Move up', 'boldform-lite' ),
						'moveDown'        => __( 'Move down', 'boldform-lite' ),
						'column'          => __( 'Column', 'boldform-lite' ),
						'width'           => __( 'Width', 'boldform-lite' ),
						'belowFields' => __( 'Below fields', 'boldform-lite' ),
						'inlineLastRow' => __( 'Inline with last row', 'boldform-lite' ),
						'buttonColor' => __( 'Button color', 'boldform-lite' ),
						'fieldAppearance' => __( 'Field Appearance', 'boldform-lite' ),
						'fieldStyle' => __( 'Field style', 'boldform-lite' ),
						'fieldSize' => __( 'Field size', 'boldform-lite' ),
						'fieldFocusColor' => __( 'Focus color', 'boldform-lite' ),
						'fieldStyles' => __( 'Field Styles', 'boldform-lite' ),
						'labelStyles' => __( 'Label Styles', 'boldform-lite' ),
						'buttonStyles' => __( 'Button Styles', 'boldform-lite' ),
						'stylePreviewEmpty' => __( 'Add fields in the Builder tab to preview your styling here.', 'boldform-lite' ),
						'size' => __( 'Size', 'boldform-lite' ),
						'border' => __( 'Border', 'boldform-lite' ),
						'borderSize' => __( 'Border Size', 'boldform-lite' ),
						'borderRadius' => __( 'Border Radius', 'boldform-lite' ),
						'background' => __( 'Background', 'boldform-lite' ),
						'text' => __( 'Text', 'boldform-lite' ),
						'defaultStyle' => __( 'Default', 'boldform-lite' ),
						'subLabel' => __( 'Sublabel', 'boldform-lite' ),
						'error' => __( 'Error', 'boldform-lite' ),
						'solid' => __( 'Solid', 'boldform-lite' ),
						'dashed' => __( 'Dashed', 'boldform-lite' ),
						'none' => __( 'None', 'boldform-lite' ),
						'small' => __( 'Small', 'boldform-lite' ),
						'medium' => __( 'Medium', 'boldform-lite' ),
						'large' => __( 'Large', 'boldform-lite' ),
						'left' => __( 'Left', 'boldform-lite' ),
						'center' => __( 'Center', 'boldform-lite' ),
						'right' => __( 'Right', 'boldform-lite' ),
						'teal' => __( 'Teal', 'boldform-lite' ),
						'blue' => __( 'Blue', 'boldform-lite' ),
						'green' => __( 'Green', 'boldform-lite' ),
						'red' => __( 'Red', 'boldform-lite' ),
						'dark' => __( 'Dark', 'boldform-lite' ),
					),
					// Labels for the advanced (full-parity) Style-tab controls.
					'advStyle'           => array(
						'secContainer'    => __( 'Form Container', 'boldform-lite' ),
						'secLayout'       => __( 'Layout & Spacing', 'boldform-lite' ),
						'secLabels'       => __( 'Labels', 'boldform-lite' ),
						'secInputs'       => __( 'Input Fields', 'boldform-lite' ),
						'secPlaceholder'  => __( 'Placeholder', 'boldform-lite' ),
						'secChoice'       => __( 'Checkbox & Radio', 'boldform-lite' ),
						'secSelect'       => __( 'Select Dropdown', 'boldform-lite' ),
						'secTerms'        => __( 'Terms & Conditions', 'boldform-lite' ),
						'secStar'         => __( 'Star Rating', 'boldform-lite' ),
						'secFile'         => __( 'File Upload', 'boldform-lite' ),
						'secSection'      => __( 'Section Break', 'boldform-lite' ),
						'secButton'       => __( 'Submit Button', 'boldform-lite' ),
						'secError'        => __( 'Error Messages', 'boldform-lite' ),
						'secSuccess'      => __( 'Success Message', 'boldform-lite' ),
						'maxWidth'        => __( 'Max Width', 'boldform-lite' ),
						'padding'         => __( 'Padding', 'boldform-lite' ),
						'margin'          => __( 'Margin', 'boldform-lite' ),
						'borderColor'     => __( 'Border Color', 'boldform-lite' ),
						'boxShadow'       => __( 'Box Shadow', 'boldform-lite' ),
						'hoverShadow'     => __( 'Box Shadow (Hover)', 'boldform-lite' ),
						'focusShadow'     => __( 'Box Shadow (Focus)', 'boldform-lite' ),
						'stateNormal'     => __( 'Normal', 'boldform-lite' ),
						'stateHover'      => __( 'Hover', 'boldform-lite' ),
						'stateFocus'      => __( 'Focus', 'boldform-lite' ),
						'stateChecked'    => __( 'Checked', 'boldform-lite' ),
						'stateSelected'   => __( 'Selected', 'boldform-lite' ),
						'rowGap'          => __( 'Row Gap', 'boldform-lite' ),
						'columnGap'       => __( 'Column Gap', 'boldform-lite' ),
						'fieldMargin'     => __( 'Field Margin', 'boldform-lite' ),
						'inputMargin'     => __( 'Input Margin', 'boldform-lite' ),
						'typography'      => __( 'Typography', 'boldform-lite' ),
						'requiredColor'   => __( 'Required Mark Color', 'boldform-lite' ),
						'height'          => __( 'Height', 'boldform-lite' ),
						'textareaHeight'  => __( 'Textarea Height', 'boldform-lite' ),
						'textColor'       => __( 'Text Color', 'boldform-lite' ),
						'placeholderColor'=> __( 'Placeholder Color', 'boldform-lite' ),
						'focusBorderColor'=> __( 'Focus Border Color', 'boldform-lite' ),
						'focusBgColor'    => __( 'Focus Background', 'boldform-lite' ),
						'accentColor'     => __( 'Accent Color', 'boldform-lite' ),
						'labelColor'      => __( 'Label Color', 'boldform-lite' ),
						'linkColor'       => __( 'Link Color', 'boldform-lite' ),
						'spacing'         => __( 'Spacing', 'boldform-lite' ),
						'gap'             => __( 'Gap', 'boldform-lite' ),
						'checkedColor'    => __( 'Checked Color', 'boldform-lite' ),
						'arrowColor'      => __( 'Arrow Color', 'boldform-lite' ),
						'panelBg'         => __( 'Panel Background', 'boldform-lite' ),
						'panelBorder'     => __( 'Panel Border Color', 'boldform-lite' ),
						'optionBg'        => __( 'Option Background', 'boldform-lite' ),
						'optionText'      => __( 'Option Text', 'boldform-lite' ),
						'optionHoverBg'   => __( 'Option Hover Background', 'boldform-lite' ),
						'optionHoverText' => __( 'Option Hover Text Color', 'boldform-lite' ),
						'optionActiveBg'  => __( 'Selected Option Background', 'boldform-lite' ),
						'searchBox'       => __( 'Search Box', 'boldform-lite' ),
						'searchBg'        => __( 'Search Background', 'boldform-lite' ),
						'searchText'      => __( 'Search Text Color', 'boldform-lite' ),
						'searchPh'        => __( 'Search Placeholder Color', 'boldform-lite' ),
						'copyText'        => __( 'Copy Text', 'boldform-lite' ),
						'borderWidth'     => __( 'Border Width', 'boldform-lite' ),
						'starColor'       => __( 'Star Color', 'boldform-lite' ),
						'starInactive'    => __( 'Inactive Star Color', 'boldform-lite' ),
						'starSize'        => __( 'Star Size', 'boldform-lite' ),
						'btnBg'           => __( 'Button Background', 'boldform-lite' ),
						'btnText'         => __( 'Button Text Color', 'boldform-lite' ),
						'titleColor'      => __( 'Title Color', 'boldform-lite' ),
						'descColor'       => __( 'Description Color', 'boldform-lite' ),
						'noticeBg'        => __( 'Notice Background', 'boldform-lite' ),
						'noticeText'      => __( 'Notice Text Color', 'boldform-lite' ),
						'fullWidth'       => __( 'Full Width', 'boldform-lite' ),
						'iconColor'       => __( 'Icon Color', 'boldform-lite' ),
						'hoverTextColor'  => __( 'Hover Text Color', 'boldform-lite' ),
						'hoverBg'         => __( 'Hover Background', 'boldform-lite' ),
						'hoverBorderColor'=> __( 'Hover Border Color', 'boldform-lite' ),
						'hover'           => __( 'Hover', 'boldform-lite' ),
						'focus'           => __( 'Focus', 'boldform-lite' ),
						'focusRing'       => __( 'Focus Ring Color', 'boldform-lite' ),
						'ringColor'       => __( 'Ring Color', 'boldform-lite' ),
						'hoverColor'      => __( 'Hover Color', 'boldform-lite' ),
						'linkHoverColor'  => __( 'Link Hover Color', 'boldform-lite' ),
						'focusLabelColor' => __( 'Focused Label Color', 'boldform-lite' ),
						'states'          => __( 'States', 'boldform-lite' ),
						'subLabel'        => __( 'Sub-field Label', 'boldform-lite' ),
						'subLabelColor'   => __( 'Sub-label Color', 'boldform-lite' ),
						'subfieldGap'     => __( 'Sub-field Gap', 'boldform-lite' ),
						'buttonMargin'    => __( 'Button Margin', 'boldform-lite' ),
						'containerMargin' => __( 'Container Margin', 'boldform-lite' ),
						'fontFamily'      => __( 'Font Family', 'boldform-lite' ),
						'fontSize'        => __( 'Font Size', 'boldform-lite' ),
						'fontWeight'      => __( 'Weight', 'boldform-lite' ),
						'lineHeight'      => __( 'Line Height', 'boldform-lite' ),
						'letterSpacing'   => __( 'Letter Spacing', 'boldform-lite' ),
						'textTransform'   => __( 'Transform', 'boldform-lite' ),
						'shadowX'         => __( 'X Offset', 'boldform-lite' ),
						'shadowY'         => __( 'Y Offset', 'boldform-lite' ),
						'shadowBlur'      => __( 'Blur', 'boldform-lite' ),
						'shadowSpread'    => __( 'Spread', 'boldform-lite' ),
						'shadowColor'     => __( 'Shadow Color', 'boldform-lite' ),
						'inset'           => __( 'Inset', 'boldform-lite' ),
						'gradient'        => __( 'Gradient', 'boldform-lite' ),
						'solidFill'       => __( 'Solid', 'boldform-lite' ),
						'angle'           => __( 'Angle', 'boldform-lite' ),
						'colorStop1'      => __( 'Color 1', 'boldform-lite' ),
						'colorStop2'      => __( 'Color 2', 'boldform-lite' ),
						'styleLabel'      => __( 'Style', 'boldform-lite' ),
						'widthLabel'      => __( 'Width', 'boldform-lite' ),
						'radiusLabel'     => __( 'Radius', 'boldform-lite' ),
						'linkSides'       => __( 'Link sides', 'boldform-lite' ),
						'sideTop'         => __( 'Top', 'boldform-lite' ),
						'sideRight'       => __( 'Right', 'boldform-lite' ),
						'sideBottom'      => __( 'Bottom', 'boldform-lite' ),
						'sideLeft'        => __( 'Left', 'boldform-lite' ),
						'inheritDefault'  => __( 'Default', 'boldform-lite' ),
						'opacity'         => __( 'Opacity (%)', 'boldform-lite' ),
						'reset'           => __( 'Reset color', 'boldform-lite' ),
						'resetSection'    => __( 'Reset this section', 'boldform-lite' ),
						'previewStates'   => __( 'Preview states — messages, open dropdown & file button', 'boldform-lite' ),
						'sampleSuccess'   => __( 'Your form has been submitted successfully.', 'boldform-lite' ),
						'sampleError'     => __( 'Please correct the highlighted fields below.', 'boldform-lite' ),
						'sampleFieldLabel' => __( 'Field with an error', 'boldform-lite' ),
						'sampleValue'     => __( 'Invalid value', 'boldform-lite' ),
						'sampleRequired'  => __( 'This field is required.', 'boldform-lite' ),
						'sampleDropdown'  => __( 'Dropdown (open)', 'boldform-lite' ),
						'sampleSearch'    => __( 'Search…', 'boldform-lite' ),
						'optionSelected'  => __( 'Selected option', 'boldform-lite' ),
						'optionAnother'   => __( 'Another option', 'boldform-lite' ),
						'sampleFile'      => __( 'File upload', 'boldform-lite' ),
						'themeFont'       => __( 'Theme Default', 'boldform-lite' ),
						'uppercase'       => __( 'UPPERCASE', 'boldform-lite' ),
						'lowercase'       => __( 'lowercase', 'boldform-lite' ),
						'capitalize'      => __( 'Capitalize', 'boldform-lite' ),
						'dotted'          => __( 'Dotted', 'boldform-lite' ),
					),
					'messages'           => array(
						'emptyFields' => __( 'Add at least one field before saving.', 'boldform-lite' ),
						'saveSuccess' => __( 'Form saved successfully.', 'boldform-lite' ),
						'saveError'   => __( 'Unable to save the form.', 'boldform-lite' ),
					),
					// Integrations — globalConnections + integrationsNonce injected via boldform_builder_localize_data filter by BoldForm_Lite_Integrations.
				);

			/**
			 * Filter the data passed to the builder JS.
			 *
			 * Pro can add keys like proFileSize, extra field library items, etc.
			 *
			 * @param array<string, mixed> $builder_data Builder localize data.
			 */
			$builder_data = apply_filters( 'boldform_builder_localize_data', $builder_data );

			wp_localize_script(
				'boldform-lite-builder',
				'boldformLiteBuilder',
				$builder_data
			);

			// Integrations assign panel (builder tab).
			wp_enqueue_style(
				'boldform-lite-integrations',
				BOLDFORM_LITE_URL . 'assets/css/integrations.css',
				array(),
				BOLDFORM_LITE_VERSION
			);

			wp_enqueue_script(
				'boldform-lite-integrations',
				BOLDFORM_LITE_URL . 'assets/js/integrations.js',
				array( 'jquery', 'boldform-lite-builder' ),
				BOLDFORM_LITE_VERSION,
				true
			);

			/**
			 * Fires after all core builder scripts and localisation are enqueued.
			 * Pro modules should use this action to enqueue their own builder JS.
			 *
			 * At this point `boldform-lite-builder` is already registered,
			 * so Pro scripts can safely depend on it.
			 */
			do_action( 'boldform_builder_enqueue_assets' );

			return;
		}

		if ( $this->preview_page_hook === $hook_suffix ) {
			wp_enqueue_style(
				'boldform-lite-builder',
				BOLDFORM_LITE_URL . 'assets/css/builder.css',
				array(),
				$this->asset_version( 'assets/css/builder.css' )
			);

			wp_enqueue_style(
				'boldform-lite-frontend',
				BOLDFORM_LITE_URL . 'assets/css/frontend.css',
				array(),
				BOLDFORM_LITE_VERSION
			);

			wp_enqueue_script(
				'boldform-lite-frontend',
				BOLDFORM_LITE_URL . 'assets/js/frontend.js',
				array( 'jquery' ),
				BOLDFORM_LITE_VERSION,
				true
			);

			wp_localize_script(
				'boldform-lite-frontend',
				'boldformLiteFrontend',
				array(
					'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
					'ajaxAction'     => 'boldform_lite_submit_form',
					'submittingText' => __( 'Submitting...', 'boldform-lite' ),
					'successText'    => __( 'Form submitted successfully.', 'boldform-lite' ),
					'errorText'      => __( 'Unable to submit the form.', 'boldform-lite' ),
				)
			);

			/**
			 * Fires after preview page assets are enqueued.
			 *
			 * Pro or other plugins should hook here to register and enqueue
			 * their own assets for the admin form preview page.
			 */
			do_action( 'boldform_preview_enqueue_assets' );

			wp_add_inline_script(
				'boldform-lite-frontend',
				'(function($){
					$(document).on("click","[data-preview-device]",function(){
						var device=String($(this).data("preview-device")||"desktop");
						$("[data-preview-device]").removeClass("is-active");
						$(this).addClass("is-active");
						$("#boldform-preview-stage").removeClass("is-desktop is-tablet is-mobile").addClass("is-"+device);
					});
				}(jQuery));'
			);
		}

		$admin_pages = array( $this->settings_page_hook, $this->list_page_hook, $this->entries_page_hook, $this->reports_page_hook, $this->docs_page_hook );

		if ( in_array( $hook_suffix, $admin_pages, true ) ) {
			wp_enqueue_style(
				'boldform-lite-admin',
				BOLDFORM_LITE_URL . 'assets/css/settings.css',
				array(),
				BOLDFORM_LITE_VERSION
			);

			// Shared admin JS handle — inline scripts for each page are attached below.
			wp_register_script(
				'boldform-lite-admin',
				false,
				array( 'jquery' ),
				BOLDFORM_LITE_VERSION,
				true
			);
			wp_enqueue_script( 'boldform-lite-admin' );

			// ── Forms list page ──────────────────────────────────────────────────
			if ( $this->list_page_hook === $hook_suffix ) {
				wp_localize_script(
					'boldform-lite-admin',
					'boldformAdminForms',
					array(
						'statusNonce'   => wp_create_nonce( 'boldform_lite_form_status' ),
						'labelActive'   => __( 'Active', 'boldform-lite' ),
						'labelInactive' => __( 'Inactive', 'boldform-lite' ),
					)
				);
				wp_add_inline_script(
					'boldform-lite-admin',
					'jQuery(function($){
						$("#boldform-select-all").on("change",function(){
							$("input[name=\'boldform_form_ids[]\']").prop("checked",this.checked);
						});
						$(document).on("change","input[name=\'boldform_form_ids[]\']",function(){
							var $boxes=$("input[name=\'boldform_form_ids[]\']");
							$("#boldform-select-all").prop("checked",$boxes.length>0&&$boxes.filter(":checked").length===$boxes.length);
						});
						$(".boldform-copy-shortcode").on("click",function(e){
							e.preventDefault();
							var sc=$(this).data("shortcode");
							if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(sc);}
							else{var $t=$("<textarea>").val(sc).appendTo("body");$t[0].select();try{document.execCommand("copy");}catch(err){}$t.remove();}
							var $btn=$(this);
							var $icon=$btn.find(".dashicons");
							$btn.addClass("is-copied");
							$icon.removeClass("dashicons-admin-page").addClass("dashicons-yes-alt");
							clearTimeout($btn.data("copiedTimer"));
							$btn.data("copiedTimer",setTimeout(function(){
								$btn.removeClass("is-copied");
								$icon.removeClass("dashicons-yes-alt").addClass("dashicons-admin-page");
							},1500));
						});
						$(".boldform-form-actions-btn").on("click",function(e){
							e.stopPropagation();
							var $dd=$(this).closest(".boldform-form-actions-dd");
							var wasOpen=$dd.hasClass("is-open");
							$(".boldform-form-actions-dd").removeClass("is-open");
							if(!wasOpen)$dd.addClass("is-open");
						});
						$(document).on("click",function(){$(".boldform-form-actions-dd").removeClass("is-open");});
						$(".boldform-form-status-toggle input").on("change",function(){
							var $toggle=$(this).closest(".boldform-form-status-toggle");
							var formId=$toggle.data("form-id");
							var isActive=$(this).is(":checked");
							var newStatus=isActive?"publish":"draft";
							var $label=$toggle.find(".boldform-form-status-toggle__label");
							$label.text(isActive?boldformAdminForms.labelActive:boldformAdminForms.labelInactive);
							$.post(ajaxurl,{action:"boldform_lite_toggle_form_status",_ajax_nonce:boldformAdminForms.statusNonce,form_id:formId,status:newStatus});
						});
					});'
				);
			}

			// ── Entries list page ────────────────────────────────────────────────
			if ( $this->entries_page_hook === $hook_suffix && ! isset( $_GET['entry_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_localize_script(
					'boldform-lite-admin',
					'boldformAdminEntries',
					array(
						'entryStatusNonce' => wp_create_nonce( 'boldform_lite_entry_status' ),
					)
				);
				wp_add_inline_script(
					'boldform-lite-admin',
					'jQuery(function($){
						var nonce=boldformAdminEntries.entryStatusNonce;
						$(".boldform-star-btn").on("click",function(){
							var $btn=$(this),id=$btn.data("entry-id");
							var isStarred=$btn.hasClass("is-starred");
							var newStatus=isStarred?"read":"starred";
							$.post(ajaxurl,{action:"boldform_lite_update_entry_status",_ajax_nonce:nonce,entry_id:id,status:newStatus},function(r){
								if(r.success){
									$btn.toggleClass("is-starred");
									$btn.find(".dashicons").toggleClass("dashicons-star-filled dashicons-star-empty");
									var $badge=$btn.closest("tr").find(".boldform-status-badge");
									$badge.attr("class","boldform-status-badge boldform-status--"+newStatus).text(newStatus.charAt(0).toUpperCase()+newStatus.slice(1));
									$btn.closest("tr").removeClass("boldform-entry--unread");
								}
							});
						});
						$(".boldform-dropdown__trigger").on("click",function(e){
							e.stopPropagation();
							var $dd=$(this).closest(".boldform-dropdown");
							var wasOpen=$dd.hasClass("is-open");
							$(".boldform-dropdown").removeClass("is-open");
							if(!wasOpen)$dd.addClass("is-open");
						});
						$(document).on("click",function(){$(".boldform-dropdown").removeClass("is-open");});
						$(".boldform-dropdown__panel").on("click",function(e){e.stopPropagation();});
						$("[data-action=\'custom-date\']").on("click",function(){
							$(".boldform-dropdown").removeClass("is-open");
							$("#boldform-custom-dates").removeAttr("hidden");
							$("#boldform-custom-dates input[type=\'date\']:first").focus();
						});
					});'
				);
			}

			// ── Entry detail page ────────────────────────────────────────────────
			if ( $this->entries_page_hook === $hook_suffix && isset( $_GET['entry_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$entry_id = absint( wp_unslash( $_GET['entry_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_localize_script(
					'boldform-lite-admin',
					'boldformAdminEntry',
					array(
						'entryStatusNonce' => wp_create_nonce( 'boldform_lite_entry_status' ),
						'entryId'          => $entry_id,
					)
				);
				wp_add_inline_script(
					'boldform-lite-admin',
					'jQuery(function($){
						var nonce=boldformAdminEntry.entryStatusNonce;
						var entryId=boldformAdminEntry.entryId;
						function updateStatus(status){
							$.post(ajaxurl,{action:"boldform_lite_update_entry_status",_ajax_nonce:nonce,entry_id:entryId,status:status},function(r){
								if(r.success){
									$("#boldform-detail-status").attr("class","boldform-status-badge boldform-status--"+status).text(status.charAt(0).toUpperCase()+status.slice(1));
									$("#boldform-mark-unread").prop("disabled",status==="unread");
									$("#boldform-mark-starred").find(".dashicons").attr("class","dashicons "+(status==="starred"?"dashicons-star-filled":"dashicons-star-empty"));
								}
							});
						}
						$("#boldform-mark-unread").on("click",function(){updateStatus("unread");});
						$("#boldform-mark-starred").on("click",function(){
							var current=$("#boldform-detail-status").text().toLowerCase();
							updateStatus(current==="starred"?"read":"starred");
						});
					});'
				);
			}

			// ── Settings page ─────────────────────────────────────────────────────
			if ( $this->settings_page_hook === $hook_suffix ) {
				$active_tab = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'general'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_add_inline_script(
					'boldform-lite-admin',
					'(function(){
						var options=document.querySelectorAll(".boldform-style-option");
						for(var i=0;i<options.length;i++){
							options[i].querySelector("input").addEventListener("change",function(){
								for(var j=0;j<options.length;j++)options[j].classList.remove("is-selected");
								this.closest(".boldform-style-option").classList.add("is-selected");
							});
						}
						var providerInputs=document.querySelectorAll("input[name=\'boldform_captcha_provider\']");
						var panels=document.querySelectorAll("[data-captcha-panel]");
						var cards=document.querySelectorAll(".boldform-captcha-card");
						function updateCaptchaPanels(){
							var selected="simple_math";
							for(var i=0;i<providerInputs.length;i++){if(providerInputs[i].checked)selected=providerInputs[i].value;}
							for(var j=0;j<panels.length;j++){panels[j].hidden=panels[j].getAttribute("data-captcha-panel")!==selected;}
							for(var k=0;k<cards.length;k++){cards[k].classList.toggle("is-selected",cards[k].querySelector("input").checked);}
						}
						for(var i=0;i<providerInputs.length;i++){providerInputs[i].addEventListener("change",updateCaptchaPanels);}
						updateCaptchaPanels();
						var enableYes=document.getElementById("boldform-smtp-enable-yes");
						var enableNo=document.getElementById("boldform-smtp-enable-no");
						var smtpFields=document.getElementById("boldform-smtp-fields");
						var authYes=document.getElementById("boldform-smtp-auth-yes");
						var authNo=document.getElementById("boldform-smtp-auth-no");
						var authFields=document.getElementById("boldform-smtp-auth-fields");
						if(enableYes){
							function toggleSmtp(){smtpFields.style.display=enableYes.checked?"":"none";}
							function toggleAuth(){authFields.style.display=authYes.checked?"":"none";}
							enableYes.addEventListener("change",toggleSmtp);
							enableNo.addEventListener("change",toggleSmtp);
							authYes.addEventListener("change",toggleAuth);
							authNo.addEventListener("change",toggleAuth);
						}
					})();'
				);
				if ( 'smtp' === $active_tab ) {
					wp_localize_script(
						'boldform-lite-admin',
						'boldformAdminSmtp',
						array(
							'testMailNonce'   => wp_create_nonce( 'boldform_lite_test_mail' ),
							'sendingText'     => __( 'Sending...', 'boldform-lite' ),
							'sentText'        => __( 'Email sent successfully!', 'boldform-lite' ),
							'failedText'      => __( 'Failed to send email.', 'boldform-lite' ),
						)
					);
					wp_add_inline_script(
						'boldform-lite-admin',
						'(function(){
							var btn=document.getElementById("boldform-send-test-mail");
							var result=document.getElementById("boldform-test-mail-result");
							if(!btn)return;
							btn.addEventListener("click",function(){
								btn.disabled=true;
								result.textContent=boldformAdminSmtp.sendingText;
								result.style.color="#646970";
								var data=new FormData();
								data.append("action","boldform_lite_send_test_mail");
								data.append("_ajax_nonce",boldformAdminSmtp.testMailNonce);
								data.append("to",document.getElementById("boldform-test-to").value);
								data.append("subject",document.getElementById("boldform-test-subject").value);
								data.append("message",document.getElementById("boldform-test-message").value);
								fetch(ajaxurl,{method:"POST",body:data,credentials:"same-origin"})
									.then(function(r){return r.json();})
									.then(function(r){
										result.textContent=r.data&&r.data.message?r.data.message:(r.success?boldformAdminSmtp.sentText:boldformAdminSmtp.failedText);
										result.style.color=r.success?"#00a32a":"#d63638";
										btn.disabled=false;
									});
							});
						})();'
					);
				}
			}
		}

	}

	/**
	 * Renders only BoldForm admin notices.
	 *
	 * @return void
	 */
	public function render_own_notices() {
		settings_errors( 'boldform_lite_settings' );
	}

	/**
	 * Renders the shared admin topbar navigation.
	 *
	 * @param string $active_page Current active page slug.
	 * @return void
	 */
	private function render_admin_topbar( $active_page = '' ) {
		$nav_items = array(
			array(
				'slug'  => 'boldform-lite',
				'label' => __( 'Forms', 'boldform-lite' ),
				'icon'  => 'dashicons-feedback',
				'brand' => true,
				'url'   => admin_url( 'admin.php?page=boldform-lite' ),
			),
			array(
				'slug'  => 'boldform-lite-entries',
				'label' => __( 'Entries', 'boldform-lite' ),
				'icon'  => 'dashicons-email-alt',
				'url'   => admin_url( 'admin.php?page=boldform-lite-entries' ),
			),
			array(
				'slug'  => 'boldform-lite-reports',
				'label' => __( 'Reports', 'boldform-lite' ),
				'icon'  => 'dashicons-chart-bar',
				'url'   => admin_url( 'admin.php?page=boldform-lite-reports' ),
			),
			array(
				'slug'  => 'boldform-lite-integrations',
				'label' => __( 'Integrations', 'boldform-lite' ),
				'icon'  => 'dashicons-randomize',
				'url'   => admin_url( 'admin.php?page=boldform-lite-integrations' ),
			),
			array(
				'slug'  => 'boldform-lite-settings',
				'label' => __( 'Settings', 'boldform-lite' ),
				'icon'  => 'dashicons-admin-generic',
				'url'   => admin_url( 'admin.php?page=boldform-lite-settings' ),
			),
			array(
				'slug'  => 'boldform-lite-settings#smtp',
				'label' => __( 'SMTP', 'boldform-lite' ),
				'icon'  => 'dashicons-email',
				'url'   => admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp' ),
			),
			array(
				'slug'  => 'boldform-lite-settings#tools',
				'label' => __( 'Tools', 'boldform-lite' ),
				'icon'  => 'dashicons-admin-tools',
				'url'   => admin_url( 'admin.php?page=boldform-lite-settings&tab=tools' ),
			),
		);

		/**
		 * Filter the admin topbar navigation items.
		 *
		 * Pro can append items (e.g. Payments, Integrations) to the topbar.
		 * Each item must be an array with keys: slug, label, icon (dashicon class), url.
		 *
		 * @param array<int, array<string, string>> $nav_items Topbar navigation items.
		 * @param string                            $active_page Currently active page slug.
		 */
		$nav_items = apply_filters( 'boldform_admin_topbar_items', $nav_items, $active_page );
		?>
		<div class="boldform-admin-topbar">
			<div class="boldform-admin-topbar__brand">
				<?php boldform_lite_brand_icon( array( 'class' => 'dashicons boldform-brand-icon' ) ); ?>
				<span class="boldform-admin-topbar__name"><?php esc_html_e( 'Bold Form', 'boldform-lite' ); ?></span>
				<span class="boldform-admin-topbar__version"><?php echo esc_html( BOLDFORM_LITE_VERSION ); ?></span>
			</div>
			<nav class="boldform-admin-topbar__nav">
				<?php foreach ( $nav_items as $item ) : ?>
					<?php $is_active = $item['slug'] === $active_page; ?>
					<a href="<?php echo esc_url( $item['url'] ); ?>" class="boldform-admin-topbar__link<?php echo $is_active ? ' is-active' : ''; ?>">
						<?php if ( ! empty( $item['brand'] ) ) : ?>
							<?php boldform_lite_brand_icon( array( 'class' => 'dashicons boldform-brand-icon' ) ); ?>
						<?php else : ?>
							<span class="dashicons <?php echo esc_attr( $item['icon'] ); ?>"></span>
						<?php endif; ?>
						<?php echo esc_html( $item['label'] ); ?>
					</a>
				<?php endforeach; ?>
			</nav>
		</div>
		<?php
	}

	/**
	 * Registers BoldForm nodes in the WordPress admin bar.
	 *
	 * Adds a top-level "BoldForm" node with dropdown children for each nav item.
	 * Pro can append extra items via the `boldform_admin_bar_items` filter.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The admin bar instance.
	 * @return void
	 */
	public function register_admin_bar( $wp_admin_bar ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$nav_items = array(
			array(
				'id'     => 'boldform-bar-forms',
				'title'  => __( 'All Forms', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite' ),
			),
			array(
				'id'     => 'boldform-bar-entries',
				'title'  => __( 'Entries', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite-entries' ),
			),
			array(
				'id'     => 'boldform-bar-reports',
				'title'  => __( 'Reports', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite-reports' ),
			),
			array(
				'id'     => 'boldform-bar-settings',
				'title'  => __( 'Settings', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite-settings' ),
			),
			array(
				'id'     => 'boldform-bar-smtp',
				'title'  => __( 'SMTP', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp' ),
			),
			array(
				'id'     => 'boldform-bar-tools',
				'title'  => __( 'Tools', 'boldform-lite' ),
				'href'   => admin_url( 'admin.php?page=boldform-lite-settings&tab=tools' ),
			),
		);

		/**
		 * Filter the BoldForm admin bar dropdown items.
		 *
		 * Pro can append items (e.g. Payments, Integrations).
		 * Each item must have: id (string), title (string), href (string).
		 *
		 * @param array<int, array<string, string>> $nav_items Admin bar child nodes.
		 */
		$nav_items = apply_filters( 'boldform_admin_bar_items', $nav_items );

		// Top-level parent node.
		$wp_admin_bar->add_node(
			array(
				'id'    => 'boldform-bar',
				'title' => __( 'Bold Form', 'boldform-lite' ),
				'href'  => admin_url( 'admin.php?page=boldform-lite' ),
			)
		);

		// Child nodes.
		foreach ( $nav_items as $item ) {
			$wp_admin_bar->add_node(
				array(
					'parent' => 'boldform-bar',
					'id'     => sanitize_key( $item['id'] ),
					'title'  => esc_html( $item['title'] ),
					'href'   => esc_url( $item['href'] ),
				)
			);
		}
	}

	/**
	 * Renders the All Forms page.
	 *
	 * @return void
	 */
	public function render_forms_page() {
		$current_view   = isset( $_GET['form_status'] ) && 'trash' === sanitize_key( wp_unslash( $_GET['form_status'] ) ) ? 'trash' : 'all'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$is_trash       = 'trash' === $current_view;
		$forms          = $this->get_forms( $current_view );
		$all_count      = $this->get_forms_count();
		$trash_count    = $this->get_forms_count( 'trash' );
		$entry_counts   = $this->get_entry_counts_by_form();
		$notice         = isset( $_GET['boldform_notice'] ) ? sanitize_key( wp_unslash( $_GET['boldform_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$form_action_url = $is_trash ? admin_url( 'admin.php?page=boldform-lite&form_status=trash' ) : admin_url( 'admin.php?page=boldform-lite' );

		// Status filter (Active/Inactive) — applies to the non-trash view only.
		$status_filter = isset( $_GET['status_filter'] ) ? sanitize_key( wp_unslash( $_GET['status_filter'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! in_array( $status_filter, array( 'active', 'inactive' ), true ) ) {
			$status_filter = '';
		}
		if ( '' !== $status_filter && ! $is_trash ) {
			$forms = $this->filter_forms_by_status( $forms, $status_filter );
		}

		// Sorting (server-side, WP-style): allowlisted column + direction.
		$allowed_orderby = array( 'title', 'entries', 'updated' );
		$orderby         = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! in_array( $orderby, $allowed_orderby, true ) ) {
			$orderby = '';
		}
		$order = ( isset( $_GET['order'] ) && 'asc' === strtolower( sanitize_key( wp_unslash( $_GET['order'] ) ) ) ) ? 'asc' : 'desc'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '' !== $orderby ) {
			$forms = $this->sort_forms_list( $forms, $orderby, $order, $entry_counts );
		}

		// Sort links must preserve the active status filter in the URL.
		$sort_base_url = ( '' !== $status_filter ) ? add_query_arg( 'status_filter', $status_filter, $form_action_url ) : $form_action_url;
		?>
		<?php $this->render_admin_topbar( 'boldform-lite' ); ?>
		<div class="wrap">
			<div class="boldform-page-header">
				<h1><?php esc_html_e( 'Forms', 'boldform-lite' ); ?></h1>
				<?php if ( ! $is_trash ) : ?>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder' ) ); ?>" class="boldform-btn-add">
						<span class="dashicons dashicons-plus-alt2"></span>
						<?php esc_html_e( 'Add New', 'boldform-lite' ); ?>
					</a>
				<?php endif; ?>
				<?php // Notice carries the `inline` class so WordPress does not relocate it; it sits in the header row, after the Add New button. ?>
				<?php $this->render_admin_notice( $notice ); ?>
			</div>

			<div class="boldform-forms-tabs">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite' ) ); ?>" class="boldform-forms-tab<?php echo ! $is_trash ? ' is-active' : ''; ?>">
					<?php esc_html_e( 'All Forms', 'boldform-lite' ); ?> <span class="boldform-forms-tab__count"><?php echo absint( $all_count ); ?></span>
				</a>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite&form_status=trash' ) ); ?>" class="boldform-forms-tab<?php echo $is_trash ? ' is-active' : ''; ?>">
					<?php esc_html_e( 'Trash', 'boldform-lite' ); ?> <span class="boldform-forms-tab__count"><?php echo absint( $trash_count ); ?></span>
				</a>
			</div>

			<div class="boldform-table-card">
				<div class="boldform-bulk-bar">
					<div class="boldform-bulk-action-wrap">
						<select name="boldform_bulk_action" id="boldform-bulk-action" form="boldform-bulk-form">
							<option value=""><?php esc_html_e( 'Bulk Actions', 'boldform-lite' ); ?></option>
							<?php if ( $is_trash ) : ?>
								<option value="restore"><?php esc_html_e( 'Restore', 'boldform-lite' ); ?></option>
								<option value="delete"><?php esc_html_e( 'Delete Permanently', 'boldform-lite' ); ?></option>
							<?php else : ?>
								<option value="trash"><?php esc_html_e( 'Move to Trash', 'boldform-lite' ); ?></option>
							<?php endif; ?>
						</select>
						<button type="submit" class="boldform-bulk-apply" form="boldform-bulk-form"><?php esc_html_e( 'Apply', 'boldform-lite' ); ?></button>
					</div>
					<?php if ( ! $is_trash ) : ?>
						<form method="get" class="boldform-filter-form" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
							<input type="hidden" name="page" value="boldform-lite">
							<?php if ( '' !== $orderby ) : ?>
								<input type="hidden" name="orderby" value="<?php echo esc_attr( $orderby ); ?>">
								<input type="hidden" name="order" value="<?php echo esc_attr( $order ); ?>">
							<?php endif; ?>
							<select name="status_filter" id="boldform-status-filter">
								<option value=""><?php esc_html_e( 'All Status', 'boldform-lite' ); ?></option>
								<option value="active" <?php selected( $status_filter, 'active' ); ?>><?php esc_html_e( 'Active', 'boldform-lite' ); ?></option>
								<option value="inactive" <?php selected( $status_filter, 'inactive' ); ?>><?php esc_html_e( 'Inactive', 'boldform-lite' ); ?></option>
							</select>
							<button type="submit" class="boldform-bulk-apply"><?php esc_html_e( 'Filter', 'boldform-lite' ); ?></button>
						</form>
					<?php endif; ?>
				</div>

				<form method="post" id="boldform-bulk-form" action="<?php echo esc_url( $form_action_url ); ?>">
					<?php wp_nonce_field( 'boldform_lite_bulk_action', 'boldform_bulk_nonce' ); ?>
					<table class="boldform-forms-table">
						<thead>
							<tr>
								<th class="boldform-col-cb"><input type="checkbox" id="boldform-select-all"></th>
								<?php $this->render_sortable_th( 'title', 'boldform-col-title', __( 'Form', 'boldform-lite' ), $orderby, $order, $sort_base_url ); ?>
								<th class="boldform-col-shortcode"><?php esc_html_e( 'Shortcode', 'boldform-lite' ); ?></th>
								<?php $this->render_sortable_th( 'entries', 'boldform-col-entries', __( 'Entries', 'boldform-lite' ), $orderby, $order, $sort_base_url ); ?>
								<th class="boldform-col-status"><?php esc_html_e( 'Status', 'boldform-lite' ); ?></th>
								<?php $this->render_sortable_th( 'updated', 'boldform-col-date', __( 'Updated', 'boldform-lite' ), $orderby, $order, $sort_base_url ); ?>
								<th class="boldform-col-actions"></th>
							</tr>
						</thead>
						<tbody>
							<?php if ( empty( $forms ) ) : ?>
								<tr>
									<td colspan="7" class="boldform-forms-empty">
										<?php if ( $is_trash ) : ?>
											<span class="dashicons dashicons-trash"></span>
											<p><?php esc_html_e( 'Trash is empty.', 'boldform-lite' ); ?></p>
										<?php else : ?>
											<span class="boldform-forms-empty__badge"><?php boldform_lite_brand_icon( array( 'size' => 30 ) ); ?></span>
											<p><?php esc_html_e( 'No forms yet. Create your first form!', 'boldform-lite' ); ?></p>
											<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder' ) ); ?>" class="boldform-btn-add"><?php esc_html_e( 'Add New Form', 'boldform-lite' ); ?></a>
										<?php endif; ?>
									</td>
								</tr>
							<?php else : ?>
								<?php foreach ( $forms as $form ) : ?>
									<?php
									$form_id_int   = absint( $form->id );
									$form_entries  = absint( $entry_counts[ (int) $form->id ] ?? 0 );
									$form_fields   = count( $this->extract_fields_from_record( $form ) );
									$shortcode_str = '[boldform id="' . $form_id_int . '"]';
									?>
									<tr>
										<td class="boldform-col-cb"><input type="checkbox" name="boldform_form_ids[]" value="<?php echo absint( $form_id_int ); ?>"></td>
										<td class="boldform-col-title">
											<div class="boldform-form-title-wrap">
												<?php if ( $is_trash ) : ?>
													<strong><?php echo esc_html( (string) $form->title ); ?></strong>
													<div class="boldform-form-row-actions">
														<a href="<?php echo esc_url( $this->get_form_action_url( 'restore', (int) $form->id ) ); ?>"><?php esc_html_e( 'Restore', 'boldform-lite' ); ?></a>
														<span class="boldform-form-row-sep">|</span>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'delete', (int) $form->id ) ); ?>" class="boldform-action-danger" onclick="return confirm('<?php echo esc_js( __( 'Delete permanently?', 'boldform-lite' ) ); ?>');"><?php esc_html_e( 'Delete', 'boldform-lite' ); ?></a>
													</div>
												<?php else : ?>
													<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . $form_id_int ) ); ?>" class="boldform-form-title-link">
														<?php echo esc_html( (string) $form->title ); ?>
													</a>
													<div class="boldform-form-row-actions">
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . $form_id_int ) ); ?>"><?php esc_html_e( 'Edit', 'boldform-lite' ); ?></a>
														<span class="boldform-form-row-sep">|</span>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'duplicate', (int) $form->id ) ); ?>"><?php esc_html_e( 'Duplicate', 'boldform-lite' ); ?></a>
														<span class="boldform-form-row-sep">|</span>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&form_id=' . $form_id_int ) ); ?>"><?php esc_html_e( 'Entries', 'boldform-lite' ); ?></a>
														<span class="boldform-form-row-sep">|</span>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-preview&form_id=' . $form_id_int ) ); ?>"><?php esc_html_e( 'Preview', 'boldform-lite' ); ?></a>
														<span class="boldform-form-row-sep">|</span>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'trash', (int) $form->id ) ); ?>" class="boldform-action-danger"><?php esc_html_e( 'Trash', 'boldform-lite' ); ?></a>
													</div>
												<?php endif; ?>
											</div>
										</td>
										<td class="boldform-col-shortcode">
											<button type="button" class="boldform-copy-shortcode" data-shortcode="<?php echo esc_attr( $shortcode_str ); ?>" title="<?php esc_attr_e( 'Click to copy', 'boldform-lite' ); ?>">
												<code><?php echo esc_html( $shortcode_str ); ?></code>
												<span class="dashicons dashicons-admin-page"></span>
											</button>
										</td>
										<td class="boldform-col-entries">
											<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&form_id=' . $form_id_int ) ); ?>" class="boldform-entries-link">
												<?php echo absint( $form_entries ); ?>
											</a>
										</td>
										<td class="boldform-col-status">
											<?php $form_is_active = 'publish' === ( $form->status ?? 'publish' ); ?>
											<label class="boldform-form-status-toggle" data-form-id="<?php echo absint( $form_id_int ); ?>">
												<input type="checkbox"<?php echo $form_is_active ? ' checked' : ''; ?>>
												<span class="boldform-form-status-toggle__track"><span class="boldform-form-status-toggle__thumb"></span></span>
												<span class="boldform-form-status-toggle__label"><?php echo $form_is_active ? esc_html__( 'Active', 'boldform-lite' ) : esc_html__( 'Inactive', 'boldform-lite' ); ?></span>
											</label>
										</td>
										<td class="boldform-col-date"><?php echo esc_html( isset( $form->updated_at ) ? wp_date( get_option( 'date_format' ), strtotime( (string) $form->updated_at ) ) : '—' ); ?></td>
										<td class="boldform-col-actions">
											<div class="boldform-form-actions-dd">
												<button type="button" class="boldform-form-actions-btn" title="<?php esc_attr_e( 'Actions', 'boldform-lite' ); ?>">
													<span class="dashicons dashicons-ellipsis"></span>
												</button>
												<div class="boldform-form-actions-menu">
													<?php if ( $is_trash ) : ?>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'restore', (int) $form->id ) ); ?>"><span class="dashicons dashicons-undo"></span> <?php esc_html_e( 'Restore', 'boldform-lite' ); ?></a>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'delete', (int) $form->id ) ); ?>" class="boldform-action-danger" onclick="return confirm('<?php echo esc_js( __( 'Delete permanently?', 'boldform-lite' ) ); ?>');"><span class="dashicons dashicons-trash"></span> <?php esc_html_e( 'Delete', 'boldform-lite' ); ?></a>
													<?php else : ?>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . $form_id_int ) ); ?>"><span class="dashicons dashicons-edit"></span> <?php esc_html_e( 'Edit', 'boldform-lite' ); ?></a>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&form_id=' . $form_id_int ) ); ?>"><span class="dashicons dashicons-email-alt"></span> <?php esc_html_e( 'Entries', 'boldform-lite' ); ?></a>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-preview&form_id=' . $form_id_int ) ); ?>"><span class="dashicons dashicons-visibility"></span> <?php esc_html_e( 'Preview', 'boldform-lite' ); ?></a>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'duplicate', (int) $form->id ) ); ?>"><span class="dashicons dashicons-admin-page"></span> <?php esc_html_e( 'Duplicate', 'boldform-lite' ); ?></a>
														<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings' ) ); ?>"><span class="dashicons dashicons-admin-generic"></span> <?php esc_html_e( 'Settings', 'boldform-lite' ); ?></a>
														<hr>
														<a href="<?php echo esc_url( $this->get_form_action_url( 'trash', (int) $form->id ) ); ?>" class="boldform-action-danger"><span class="dashicons dashicons-trash"></span> <?php esc_html_e( 'Trash', 'boldform-lite' ); ?></a>
													<?php endif; ?>
												</div>
											</div>
										</td>
									</tr>
								<?php endforeach; ?>
							<?php endif; ?>
						</tbody>
					</table>
				</form>
			</div>

		</div>
		<?php
	}

	/**
	 * Renders the builder page.
	 *
	 * @return void
	 */
	public function render_builder_page() {
		$form_id     = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$form_record = $form_id ? $this->get_form( $form_id ) : null;
		$form_data   = $this->normalize_form_for_builder( $form_record );

		include BOLDFORM_LITE_PATH . 'admin/admin-builder.php';
	}

	/**
	 * Renders the documentation page with links to user and developer guides.
	 *
	 * @return void
	 */
	public function render_docs_page() {
		$cards = array(
			array(
				'icon'        => 'dashicons-book',
				'icon_color'  => '#0f766e',
				'bg_color'    => '#f0fdf4',
				'border'      => '#bbf7d0',
				'title'       => __( 'User Guide', 'boldform-lite' ),
				'desc'        => __( 'Learn how to create forms, manage entries, configure settings, and embed forms on your site.', 'boldform-lite' ),
				'btn_label'   => __( 'Open User Guide', 'boldform-lite' ),
				'btn_color'   => '#0f766e',
				'url'         => 'https://documentation.themewant.com/docs/boldform-user-guide/',
			),
			array(
				'icon'        => 'dashicons-editor-code',
				'icon_color'  => '#6366f1',
				'bg_color'    => '#f5f3ff',
				'border'      => '#ddd6fe',
				'title'       => __( 'Developer Guide', 'boldform-lite' ),
				'desc'        => __( 'Hooks, filters, custom field types, integrations API, database schema, and file structure reference.', 'boldform-lite' ),
				'btn_label'   => __( 'Open Developer Guide', 'boldform-lite' ),
				'btn_color'   => '#6366f1',
				'url'         => 'https://documentation.themewant.com/docs/bold-form-developer-guide/',
			),
			array(
				'icon'        => 'dashicons-sos',
				'icon_color'  => '#0ea5e9',
				'bg_color'    => '#f0f9ff',
				'border'      => '#bae6fd',
				'title'       => __( 'Support', 'boldform-lite' ),
				'desc'        => __( 'Run into an issue? Open a support ticket and our team will help you get back on track quickly.', 'boldform-lite' ),
				'btn_label'   => __( 'Get Support', 'boldform-lite' ),
				'btn_color'   => '#0ea5e9',
				'url'         => 'https://themewant.com/support/',
			),
			array(
				'icon'        => 'dashicons-groups',
				'icon_color'  => '#f59e0b',
				'bg_color'    => '#fffbeb',
				'border'      => '#fde68a',
				'title'       => __( 'Community', 'boldform-lite' ),
				'desc'        => __( 'Join the BoldForm community to share tips, ask questions, and connect with other users and developers.', 'boldform-lite' ),
				'btn_label'   => __( 'Join Community', 'boldform-lite' ),
				'btn_color'   => '#f59e0b',
				'url'         => 'https://www.facebook.com/groups/themewant',
			),
			array(
				'icon'        => 'dashicons-star-filled',
				'icon_color'  => '#ef4444',
				'bg_color'    => '#fff1f2',
				'border'      => '#fecdd3',
				'title'       => __( 'Leave a Review', 'boldform-lite' ),
				'desc'        => __( 'Enjoying BoldForm? A quick 5-star review on WordPress.org helps others find the plugin and motivates us to keep improving.', 'boldform-lite' ),
				'btn_label'   => __( 'Leave a Review', 'boldform-lite' ),
				'btn_color'   => '#ef4444',
				'url'         => 'https://wordpress.org/support/plugin/boldform-lite/reviews/#new-post',
			),
			array(
				'icon'        => 'dashicons-lightbulb',
				'icon_color'  => '#8b5cf6',
				'bg_color'    => '#faf5ff',
				'border'      => '#e9d5ff',
				'title'       => __( 'Request a Feature', 'boldform-lite' ),
				'desc'        => __( 'Have an idea that would make BoldForm even better? Share it with us — your feedback shapes our roadmap.', 'boldform-lite' ),
				'btn_label'   => __( 'Request a Feature', 'boldform-lite' ),
				'btn_color'   => '#8b5cf6',
				'url'         => 'https://wordpress.org/support/plugin/boldform-lite/',
			),
		);
		?>
		<?php $this->render_admin_topbar( 'boldform-lite-docs' ); ?>
		<div class="wrap">
			<div class="boldform-page-header">
				<h1><?php esc_html_e( 'Help &amp; Support', 'boldform-lite' ); ?></h1>
			</div>

			<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-top:4px;">
				<?php foreach ( $cards as $card ) : ?>
				<div style="background:<?php echo esc_attr( $card['bg_color'] ); ?>;border:1px solid <?php echo esc_attr( $card['border'] ); ?>;border-radius:14px;padding:28px 24px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;">
					<span class="dashicons <?php echo esc_attr( $card['icon'] ); ?>" style="font-size:32px;width:32px;height:32px;line-height:32px;color:<?php echo esc_attr( $card['icon_color'] ); ?>;"></span>
					<h2 style="font-size:15px;font-weight:700;margin:0;padding:0;border:none;color:#0f172a;"><?php echo esc_html( $card['title'] ); ?></h2>
					<p style="color:#475569;font-size:13px;line-height:1.6;margin:0;flex:1;"><?php echo esc_html( $card['desc'] ); ?></p>
					<a href="<?php echo esc_url( $card['url'] ); ?>" target="_blank" rel="noopener noreferrer"
					   style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:<?php echo esc_attr( $card['btn_color'] ); ?>;color:#fff;font-size:13px;font-weight:600;text-decoration:none;margin-top:4px;">
						<?php echo esc_html( $card['btn_label'] ); ?>
						<span class="dashicons dashicons-external" style="font-size:14px;width:14px;height:14px;line-height:14px;"></span>
					</a>
				</div>
				<?php endforeach; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the admin preview page.
	 *
	 * @return void
	 */
	public function render_preview_page() {
		$form_id = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$form    = $form_id ? $this->get_form( $form_id ) : null;
		?>
		<div class="wrap boldform-preview-wrap">
			<h1 class="wp-heading-inline"><?php esc_html_e( 'Preview Form', 'boldform-lite' ); ?></h1>
			<?php if ( $form ) : ?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . $form_id ) ); ?>" class="page-title-action">
					<?php esc_html_e( 'Edit Form', 'boldform-lite' ); ?>
				</a>
			<?php endif; ?>
			<hr class="wp-header-end">

			<?php if ( ! $form ) : ?>
				<div class="notice notice-error"><p><?php esc_html_e( 'Form not found.', 'boldform-lite' ); ?></p></div>
				<?php return; ?>
			<?php endif; ?>

			<div class="boldform-preview-shell">
				<div class="boldform-preview-toolbar">
					<div class="boldform-preview-toolbar__devices" role="tablist" aria-label="<?php esc_attr_e( 'Preview devices', 'boldform-lite' ); ?>">
						<button type="button" class="boldform-device-btn is-active" data-preview-device="desktop" title="<?php esc_attr_e( 'Desktop', 'boldform-lite' ); ?>"><span class="dashicons dashicons-desktop"></span></button>
						<button type="button" class="boldform-device-btn" data-preview-device="tablet" title="<?php esc_attr_e( 'Tablet', 'boldform-lite' ); ?>"><span class="dashicons dashicons-tablet"></span></button>
						<button type="button" class="boldform-device-btn" data-preview-device="mobile" title="<?php esc_attr_e( 'Mobile', 'boldform-lite' ); ?>"><span class="dashicons dashicons-smartphone"></span></button>
					</div>
					<div class="boldform-preview-toolbar__meta">
						<strong><?php echo esc_html( (string) $form->title ); ?></strong>
						<code>[boldform id="<?php echo esc_html( (string) $form_id ); ?>"]</code>
					</div>
				</div>

				<div class="boldform-preview-stage is-desktop" id="boldform-preview-stage">
					<div class="boldform-preview-viewport">
						<?php echo do_shortcode( '[boldform id="' . $form_id . '"]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the entries management page.
	 *
	 * @return void
	 */
	public function render_entries_page() {
		$entry_id = isset( $_GET['entry_id'] ) ? absint( wp_unslash( $_GET['entry_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( $entry_id ) {
			$this->render_entry_detail( $entry_id );
			return;
		}

		// Collect filters from URL.
		$filter_form   = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$filter_status = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : 'all'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$filter_date   = isset( $_GET['date_range'] ) ? sanitize_key( wp_unslash( $_GET['date_range'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$filter_from   = isset( $_GET['date_from'] ) ? sanitize_text_field( wp_unslash( $_GET['date_from'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$filter_to     = isset( $_GET['date_to'] ) ? sanitize_text_field( wp_unslash( $_GET['date_to'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// Resolve date range presets.
		$today = wp_date( 'Y-m-d' );
		if ( 'today' === $filter_date ) {
			$filter_from = $today;
			$filter_to   = $today;
		} elseif ( 'yesterday' === $filter_date ) {
			$filter_from = wp_date( 'Y-m-d', strtotime( '-1 day' ) );
			$filter_to   = $filter_from;
		} elseif ( 'last_week' === $filter_date ) {
			$filter_from = wp_date( 'Y-m-d', strtotime( '-7 days' ) );
			$filter_to   = $today;
		} elseif ( 'last_month' === $filter_date ) {
			$filter_from = wp_date( 'Y-m-d', strtotime( '-30 days' ) );
			$filter_to   = $today;
		}

		$filters = array(
			'form_id'   => $filter_form,
			'status'    => $filter_status,
			'date_from' => $filter_from,
			'date_to'   => $filter_to,
		);

		$current_page = isset( $_GET['paged'] ) ? max( 1, absint( wp_unslash( $_GET['paged'] ) ) ) : 1; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$per_page     = 10;
		$total_items  = $this->get_entries_count( $filters );
		$total_pages  = max( 1, (int) ceil( $total_items / $per_page ) );
		$entries      = $this->get_entries( $current_page, $per_page, $filters );
		$all_forms    = $this->get_forms();
		$count_all    = $this->get_entries_count( array( 'form_id' => $filter_form, 'date_from' => $filter_from, 'date_to' => $filter_to ) );
		$count_unread = $this->get_entries_count( array_merge( $filters, array( 'status' => 'unread' ) ) );
		$count_read   = $this->get_entries_count( array_merge( $filters, array( 'status' => 'read' ) ) );
		$count_starred = $this->get_entries_count( array_merge( $filters, array( 'status' => 'starred' ) ) );

		$base_url = admin_url( 'admin.php?page=boldform-lite-entries' );
		$notice   = isset( $_GET['boldform_notice'] ) ? sanitize_key( wp_unslash( $_GET['boldform_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// Build filter URL helper.
		$filter_url = function ( $overrides = array() ) use ( $base_url, $filter_form, $filter_status, $filter_date, $filter_from, $filter_to ) {
			$params = array(
				'form_id'    => isset( $overrides['form_id'] ) ? $overrides['form_id'] : $filter_form,
				'status'     => isset( $overrides['status'] ) ? $overrides['status'] : $filter_status,
				'date_range' => isset( $overrides['date_range'] ) ? $overrides['date_range'] : $filter_date,
			);
			if ( 'custom' === $params['date_range'] ) {
				$params['date_from'] = isset( $overrides['date_from'] ) ? $overrides['date_from'] : $filter_from;
				$params['date_to']   = isset( $overrides['date_to'] ) ? $overrides['date_to'] : $filter_to;
			}
			// Remove empty values.
			$params = array_filter( $params, function ( $v ) { return '' !== $v && '0' !== (string) $v && 'all' !== $v; } );
			return add_query_arg( $params, $base_url );
		};
		?>
		<?php $this->render_admin_topbar( 'boldform-lite-entries' ); ?>
		<div class="wrap">
			<div class="boldform-page-header">
				<h1><?php esc_html_e( 'Entries', 'boldform-lite' ); ?></h1>
				<?php if ( ! empty( $entries ) ) : ?>
					<a href="<?php echo esc_url( wp_nonce_url( add_query_arg( array_filter( array( 'form_id' => $filter_form, 'status' => 'all' !== $filter_status ? $filter_status : '', 'date_range' => $filter_date, 'date_from' => $filter_from, 'date_to' => $filter_to ) ), admin_url( 'admin.php?page=boldform-lite-entries&boldform_export_csv=1' ) ), 'boldform_lite_csv_export' ) ); ?>" class="boldform-btn-add">
						<span class="dashicons dashicons-download"></span>
						<?php esc_html_e( 'Export CSV', 'boldform-lite' ); ?>
					</a>
				<?php endif; ?>
			</div>

			<?php if ( 'entry_deleted' === $notice ) : ?>
				<div class="boldform-card boldform-card--success" style="margin-bottom:16px;">
					<p><?php esc_html_e( 'Entry deleted successfully.', 'boldform-lite' ); ?></p>
				</div>
			<?php endif; ?>

			<!-- Filters bar -->
			<div class="boldform-entries-filters">
				<div class="boldform-entries-filters__left">
					<!-- Status tabs -->
					<div class="boldform-entries-tabs">
						<a href="<?php echo esc_url( $filter_url( array( 'status' => 'all' ) ) ); ?>" class="boldform-entries-tab<?php echo 'all' === $filter_status ? ' is-active' : ''; ?>">
							<?php esc_html_e( 'All', 'boldform-lite' ); ?> <span class="boldform-entries-tab__count"><?php echo absint( $count_all ); ?></span>
						</a>
						<a href="<?php echo esc_url( $filter_url( array( 'status' => 'unread' ) ) ); ?>" class="boldform-entries-tab<?php echo 'unread' === $filter_status ? ' is-active' : ''; ?>">
							<?php esc_html_e( 'Unread', 'boldform-lite' ); ?> <span class="boldform-entries-tab__count"><?php echo absint( $count_unread ); ?></span>
						</a>
						<a href="<?php echo esc_url( $filter_url( array( 'status' => 'read' ) ) ); ?>" class="boldform-entries-tab<?php echo 'read' === $filter_status ? ' is-active' : ''; ?>">
							<?php esc_html_e( 'Read', 'boldform-lite' ); ?> <span class="boldform-entries-tab__count"><?php echo absint( $count_read ); ?></span>
						</a>
						<a href="<?php echo esc_url( $filter_url( array( 'status' => 'starred' ) ) ); ?>" class="boldform-entries-tab<?php echo 'starred' === $filter_status ? ' is-active' : ''; ?>">
							<?php esc_html_e( 'Starred', 'boldform-lite' ); ?> <span class="boldform-entries-tab__count"><?php echo absint( $count_starred ); ?></span>
						</a>
					</div>
				</div>
				<div class="boldform-entries-filters__right">
					<!-- Form dropdown -->
					<?php
					$active_form_label = __( 'All Forms', 'boldform-lite' );
					if ( $filter_form ) {
						foreach ( $all_forms as $f ) {
							if ( (int) $f->id === $filter_form ) {
								$active_form_label = $f->title ? $f->title : '#' . $f->id;
								break;
							}
						}
					}
					?>
					<div class="boldform-dropdown" id="boldform-form-dropdown">
						<button type="button" class="boldform-dropdown__trigger">
							<span class="dashicons dashicons-format-aside"></span>
							<span class="boldform-dropdown__label"><?php echo esc_html( $active_form_label ); ?></span>
							<span class="boldform-dropdown__arrow"></span>
						</button>
						<div class="boldform-dropdown__panel">
							<a href="<?php echo esc_url( $filter_url( array( 'form_id' => 0 ) ) ); ?>" class="boldform-dropdown__item<?php echo ! $filter_form ? ' is-active' : ''; ?>">
								<?php esc_html_e( 'All Forms', 'boldform-lite' ); ?>
							</a>
							<?php foreach ( $all_forms as $f ) : ?>
								<a href="<?php echo esc_url( $filter_url( array( 'form_id' => absint( $f->id ) ) ) ); ?>" class="boldform-dropdown__item<?php echo $filter_form === (int) $f->id ? ' is-active' : ''; ?>">
									<?php echo esc_html( $f->title ? $f->title : '#' . $f->id ); ?>
								</a>
							<?php endforeach; ?>
						</div>
					</div>

					<!-- Date filter -->
					<?php
					$date_labels = array(
						''           => __( 'All Time', 'boldform-lite' ),
						'today'      => __( 'Today', 'boldform-lite' ),
						'yesterday'  => __( 'Yesterday', 'boldform-lite' ),
						'last_week'  => __( 'Last 7 Days', 'boldform-lite' ),
						'last_month' => __( 'Last 30 Days', 'boldform-lite' ),
						'custom'     => __( 'Custom Range', 'boldform-lite' ),
					);
					$active_date_label = isset( $date_labels[ $filter_date ] ) ? $date_labels[ $filter_date ] : $date_labels[''];
					?>
					<div class="boldform-dropdown" id="boldform-date-dropdown">
						<button type="button" class="boldform-dropdown__trigger">
							<span class="dashicons dashicons-calendar-alt"></span>
							<span class="boldform-dropdown__label"><?php echo esc_html( $active_date_label ); ?></span>
							<span class="boldform-dropdown__arrow"></span>
						</button>
						<div class="boldform-dropdown__panel">
							<?php foreach ( $date_labels as $key => $label ) : ?>
								<?php if ( 'custom' === $key ) : ?>
									<button type="button" class="boldform-dropdown__item<?php echo 'custom' === $filter_date ? ' is-active' : ''; ?>" data-action="custom-date">
										<?php echo esc_html( $label ); ?>
									</button>
								<?php else : ?>
									<a href="<?php echo esc_url( $filter_url( array( 'date_range' => $key ) ) ); ?>" class="boldform-dropdown__item<?php echo $filter_date === $key ? ' is-active' : ''; ?>">
										<?php echo esc_html( $label ); ?>
									</a>
								<?php endif; ?>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</div>

			<!-- Custom date range (shown when custom selected) -->
			<div id="boldform-custom-dates" class="boldform-custom-dates"<?php echo 'custom' !== $filter_date ? ' hidden' : ''; ?>>
				<form method="get" action="<?php echo esc_url( $base_url ); ?>" class="boldform-custom-dates__form">
					<input type="hidden" name="page" value="boldform-lite-entries">
					<?php if ( $filter_form ) : ?><input type="hidden" name="form_id" value="<?php echo absint( $filter_form ); ?>"><?php endif; ?>
					<?php if ( 'all' !== $filter_status ) : ?><input type="hidden" name="status" value="<?php echo esc_attr( $filter_status ); ?>"><?php endif; ?>
					<input type="hidden" name="date_range" value="custom">
					<label><?php esc_html_e( 'From', 'boldform-lite' ); ?> <input type="date" name="date_from" value="<?php echo esc_attr( $filter_from ); ?>"></label>
					<label><?php esc_html_e( 'To', 'boldform-lite' ); ?> <input type="date" name="date_to" value="<?php echo esc_attr( $filter_to ); ?>"></label>
					<button type="submit" class="button button-primary"><?php esc_html_e( 'Apply', 'boldform-lite' ); ?></button>
				</form>
			</div>

			<div class="boldform-table-card">
				<table class="widefat fixed striped boldform-entries-table">
					<thead>
						<tr>
							<th style="width:50px;">&nbsp;</th>
							<th style="width:60px;"><?php esc_html_e( 'ID', 'boldform-lite' ); ?></th>
							<th><?php esc_html_e( 'Submission', 'boldform-lite' ); ?></th>
							<th style="width:100px;"><?php esc_html_e( 'Form', 'boldform-lite' ); ?></th>
							<th style="width:150px;"><?php esc_html_e( 'Date', 'boldform-lite' ); ?></th>
							<th style="width:80px;"><?php esc_html_e( 'Status', 'boldform-lite' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php if ( empty( $entries ) ) : ?>
							<tr class="boldform-empty-row">
								<td colspan="6"><?php esc_html_e( 'No entries found.', 'boldform-lite' ); ?></td>
							</tr>
						<?php else : ?>
							<?php foreach ( $entries as $entry ) : ?>
								<?php
								$entry_status = isset( $entry->status ) ? (string) $entry->status : 'unread';
								$is_unread    = 'unread' === $entry_status;
								$is_starred   = 'starred' === $entry_status;
								$first_values = $this->get_entry_preview_text( $entry );
								$form         = $this->get_form( (int) $entry->form_id );
								$form_title   = $form ? ( $form->title ? (string) $form->title : '#' . absint( $form->id ) ) : '#' . absint( $entry->form_id );
								?>
								<tr class="<?php echo $is_unread ? 'boldform-entry--unread' : ''; ?>">
									<td class="boldform-entry-star">
										<button type="button" class="boldform-star-btn<?php echo $is_starred ? ' is-starred' : ''; ?>" data-entry-id="<?php echo absint( $entry->id ); ?>" title="<?php esc_attr_e( 'Star', 'boldform-lite' ); ?>">
											<span class="dashicons <?php echo $is_starred ? 'dashicons-star-filled' : 'dashicons-star-empty'; ?>"></span>
										</button>
									</td>
									<td><strong><?php echo absint( $entry->id ); ?></strong></td>
									<td>
										<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&entry_id=' . absint( $entry->id ) ) ); ?>" class="boldform-entry-link">
											<?php echo esc_html( $first_values ); ?>
										</a>
									</td>
									<td><span class="boldform-entry-form-badge"><?php echo esc_html( $form_title ); ?></span></td>
									<td><?php echo esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $entry->created_at ) ) ); ?></td>
									<td><span class="boldform-status-badge boldform-status--<?php echo esc_attr( $entry_status ); ?>"><?php echo esc_html( ucfirst( $entry_status ) ); ?></span></td>
								</tr>
							<?php endforeach; ?>
						<?php endif; ?>
					</tbody>
				</table>

				<?php if ( $total_pages > 1 ) : ?>
					<div class="boldform-pagination">
						<?php
						$paginate_args = array(
							'form_id'    => $filter_form ? $filter_form : '',
							'status'     => 'all' !== $filter_status ? $filter_status : '',
							'date_range' => $filter_date,
						);
						if ( 'custom' === $filter_date ) {
							$paginate_args['date_from'] = $filter_from;
							$paginate_args['date_to']   = $filter_to;
						}
						$paginate_args = array_filter( $paginate_args );

						echo wp_kses_post(
							paginate_links(
								array(
									'base'      => add_query_arg(
										array_merge(
											array(
												'page'  => 'boldform-lite-entries',
												'paged' => '%#%',
											),
											$paginate_args
										),
										admin_url( 'admin.php' )
									),
									'format'    => '',
									'current'   => min( $current_page, $total_pages ),
									'total'     => $total_pages,
									'prev_text' => __( '&laquo;', 'boldform-lite' ),
									'next_text' => __( '&raquo;', 'boldform-lite' ),
								)
							)
						);
						?>
					</div>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the global settings page.
	 *
	 * @return void
	 */
	public function render_settings_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'general'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$active_tab = in_array( $active_tab, array( 'general', 'captcha', 'smtp', 'tools' ), true ) ? $active_tab : 'general';

		$this->handle_settings_save();

		$settings = $this->get_global_settings();

		$tabs = array(
			'general' => array( 'label' => __( 'General', 'boldform-lite' ), 'icon' => 'dashicons-admin-generic' ),
			'captcha' => array( 'label' => __( 'Captcha', 'boldform-lite' ), 'icon' => 'dashicons-shield' ),
			'smtp'    => array( 'label' => __( 'SMTP', 'boldform-lite' ), 'icon' => 'dashicons-email-alt' ),
			'tools'   => array( 'label' => __( 'Tools', 'boldform-lite' ), 'icon' => 'dashicons-migrate' ),
		);
		?>
		<?php
		$topbar_active = 'boldform-lite-settings';
		if ( 'smtp' === $active_tab ) $topbar_active = 'boldform-lite-settings#smtp';
		if ( 'tools' === $active_tab ) $topbar_active = 'boldform-lite-settings#tools';
		$this->render_admin_topbar( $topbar_active );
		?>
		<div class="wrap">
			<h1 class="wp-heading-inline"><?php esc_html_e( 'Bold Form Settings', 'boldform-lite' ); ?></h1>
			<hr class="wp-header-end">

			<div class="boldform-settings-wrap">
				<nav class="boldform-settings-sidebar">
					<?php foreach ( $tabs as $tab_key => $tab ) : ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=' . $tab_key ) ); ?>" class="boldform-nav-item<?php echo $tab_key === $active_tab ? ' is-active' : ''; ?>">
							<span class="dashicons <?php echo esc_attr( $tab['icon'] ); ?>"></span>
							<?php echo esc_html( $tab['label'] ); ?>
						</a>
					<?php endforeach; ?>
				</nav>

				<div class="boldform-settings-content">
					<?php if ( 'general' === $active_tab ) : ?>
						<h2><?php esc_html_e( 'General Settings', 'boldform-lite' ); ?></h2>
						<p class="boldform-tab-description"><?php esc_html_e( 'Configure the core behavior and appearance of your forms.', 'boldform-lite' ); ?></p>

						<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=general' ) ); ?>">
							<?php wp_nonce_field( 'boldform_lite_save_settings', 'boldform_settings_nonce' ); ?>

							<div class="boldform-card">
								<h3><?php esc_html_e( 'Form Style', 'boldform-lite' ); ?></h3>
								<label class="boldform-style-option<?php echo 'plugin' === $settings['form_style_mode'] ? ' is-selected' : ''; ?>">
									<input type="radio" name="boldform_form_style_mode" value="plugin"<?php checked( $settings['form_style_mode'], 'plugin' ); ?>>
									<div>
										<strong><?php esc_html_e( 'Plugin (BoldForm)', 'boldform-lite' ); ?></strong>
										<span><?php esc_html_e( 'Use the built-in BoldForm styles for inputs, buttons, and layout.', 'boldform-lite' ); ?></span>
									</div>
								</label>
								<label class="boldform-style-option<?php echo 'theme' === $settings['form_style_mode'] ? ' is-selected' : ''; ?>">
									<input type="radio" name="boldform_form_style_mode" value="theme"<?php checked( $settings['form_style_mode'], 'theme' ); ?>>
									<div>
										<strong><?php esc_html_e( 'Theme (Inherit)', 'boldform-lite' ); ?></strong>
										<span><?php esc_html_e( 'Inherit input, button, and label styles from your active theme.', 'boldform-lite' ); ?></span>
									</div>
								</label>
							</div>

							<div class="boldform-card">
								<h3><?php esc_html_e( 'Notifications', 'boldform-lite' ); ?></h3>
								<div class="boldform-field-row">
									<div class="boldform-field-label">
										<label for="boldform-default-email"><?php esc_html_e( 'Default email', 'boldform-lite' ); ?></label>
									</div>
									<div class="boldform-field-control">
										<input type="email" id="boldform-default-email" name="boldform_default_email" value="<?php echo esc_attr( $settings['default_email'] ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>">
										<p class="description"><?php esc_html_e( 'Leave blank to use the site admin email.', 'boldform-lite' ); ?></p>
									</div>
								</div>
							</div>

							<div class="boldform-card">
								<h3><?php esc_html_e( 'Validation Messages', 'boldform-lite' ); ?></h3>
								<p class="boldform-tab-description"><?php esc_html_e( 'Customize the required field error messages. Leave blank to use the default.', 'boldform-lite' ); ?></p>
								<?php
								$msg_fields = array(
									'text'     => __( 'Text field', 'boldform-lite' ),
									'email'    => __( 'Email field', 'boldform-lite' ),
									'number'   => __( 'Number field', 'boldform-lite' ),
									'textarea' => __( 'Textarea field', 'boldform-lite' ),
									'select'   => __( 'Select field', 'boldform-lite' ),
									'checkbox' => __( 'Checkbox field', 'boldform-lite' ),
									'radio'    => __( 'Radio field', 'boldform-lite' ),
									'date'     => __( 'Date field', 'boldform-lite' ),
									'time'     => __( 'Time field', 'boldform-lite' ),
								);
								foreach ( $msg_fields as $msg_key => $msg_label ) :
									$setting_key = 'required_msg_' . $msg_key;
								?>
								<div class="boldform-field-row">
									<div class="boldform-field-label"><label for="boldform-<?php echo esc_attr( $setting_key ); ?>"><?php echo esc_html( $msg_label ); ?></label></div>
									<div class="boldform-field-control">
										<?php
										/* translators: %s: field type label (e.g. "Email field") */
										$placeholder_text = sprintf( __( '%s is required.', 'boldform-lite' ), $msg_label );
										?>
										<input type="text" id="boldform-<?php echo esc_attr( $setting_key ); ?>" name="boldform_<?php echo esc_attr( $setting_key ); ?>" value="<?php echo esc_attr( $settings[ $setting_key ] ); ?>" placeholder="<?php echo esc_attr( $placeholder_text ); ?>">
									</div>
								</div>
								<?php endforeach; ?>
							</div>

							<div class="boldform-card">
								<h3><?php esc_html_e( 'Data', 'boldform-lite' ); ?></h3>
								<label class="boldform-toggle">
									<input type="checkbox" id="boldform-uninstall-data" name="boldform_uninstall_data" value="1"<?php checked( $settings['uninstall_data'] ); ?>>
									<span><?php esc_html_e( 'Delete all forms, entries, and settings when the plugin is uninstalled.', 'boldform-lite' ); ?></span>
								</label>
							</div>

							<div class="boldform-submit-area">
								<?php submit_button( __( 'Save Changes', 'boldform-lite' ), 'primary', 'submit', false ); ?>
							</div>
						</form>

					<?php elseif ( 'captcha' === $active_tab ) : ?>
						<h2><?php esc_html_e( 'Captcha Settings', 'boldform-lite' ); ?></h2>
						<p class="boldform-tab-description"><?php esc_html_e( 'Choose which captcha service should protect all frontend forms.', 'boldform-lite' ); ?></p>

						<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=captcha' ) ); ?>">
							<?php wp_nonce_field( 'boldform_lite_save_settings', 'boldform_settings_nonce' ); ?>

							<div class="boldform-card">
								<h3><?php esc_html_e( 'Provider', 'boldform-lite' ); ?></h3>
								<div class="boldform-captcha-provider-grid" id="boldform-captcha-provider-grid">
									<label class="boldform-captcha-card<?php echo 'recaptcha' === $settings['captcha_provider'] ? ' is-selected' : ''; ?>">
										<input type="radio" name="boldform_captcha_provider" value="recaptcha"<?php checked( $settings['captcha_provider'], 'recaptcha' ); ?>>
										<span class="boldform-captcha-card__title"><?php esc_html_e( 'Google reCAPTCHA v2', 'boldform-lite' ); ?></span>
										<span class="boldform-captcha-card__description"><?php esc_html_e( 'Free checkbox challenge from Google.', 'boldform-lite' ); ?></span>
									</label>
									<label class="boldform-captcha-card<?php echo 'hcaptcha' === $settings['captcha_provider'] ? ' is-selected' : ''; ?>">
										<input type="radio" name="boldform_captcha_provider" value="hcaptcha"<?php checked( $settings['captcha_provider'], 'hcaptcha' ); ?>>
										<span class="boldform-captcha-card__title"><?php esc_html_e( 'hCaptcha', 'boldform-lite' ); ?></span>
										<span class="boldform-captcha-card__description"><?php esc_html_e( 'Privacy-focused captcha alternative.', 'boldform-lite' ); ?></span>
									</label>
									<label class="boldform-captcha-card<?php echo 'simple_math' === $settings['captcha_provider'] ? ' is-selected' : ''; ?>">
										<input type="radio" name="boldform_captcha_provider" value="simple_math"<?php checked( $settings['captcha_provider'], 'simple_math' ); ?>>
										<span class="boldform-captcha-card__title"><?php esc_html_e( 'Simple Math', 'boldform-lite' ); ?></span>
										<span class="boldform-captcha-card__description"><?php esc_html_e( 'Built-in math challenge, no external services.', 'boldform-lite' ); ?></span>
									</label>
								</div>
							</div>

							<div class="boldform-captcha-panel" data-captcha-panel="recaptcha"<?php echo 'recaptcha' === $settings['captcha_provider'] ? '' : ' hidden'; ?>>
								<div class="boldform-card">
									<h3><?php esc_html_e( 'reCAPTCHA Keys', 'boldform-lite' ); ?></h3>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-recaptcha-site-key"><?php esc_html_e( 'Site key', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="text" id="boldform-recaptcha-site-key" name="boldform_recaptcha_site_key" value="<?php echo esc_attr( $settings['recaptcha_site_key'] ); ?>">
										</div>
									</div>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-recaptcha-secret-key"><?php esc_html_e( 'Secret key', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="text" id="boldform-recaptcha-secret-key" name="boldform_recaptcha_secret_key" value="<?php echo esc_attr( $settings['recaptcha_secret_key'] ); ?>">
											<p class="description"><?php echo wp_kses( sprintf( /* translators: %s: reCAPTCHA URL */ __( 'Get your keys from %s. Supports reCAPTCHA v2 (checkbox).', 'boldform-lite' ), '<code>google.com/recaptcha/admin</code>' ), array( 'code' => array() ) ); ?></p>
										</div>
									</div>
								</div>
							</div>

							<div class="boldform-captcha-panel" data-captcha-panel="hcaptcha"<?php echo 'hcaptcha' === $settings['captcha_provider'] ? '' : ' hidden'; ?>>
								<div class="boldform-card">
									<h3><?php esc_html_e( 'hCaptcha Keys', 'boldform-lite' ); ?></h3>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-hcaptcha-site-key"><?php esc_html_e( 'Site key', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="text" id="boldform-hcaptcha-site-key" name="boldform_hcaptcha_site_key" value="<?php echo esc_attr( $settings['hcaptcha_site_key'] ); ?>">
										</div>
									</div>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-hcaptcha-secret-key"><?php esc_html_e( 'Secret key', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="text" id="boldform-hcaptcha-secret-key" name="boldform_hcaptcha_secret_key" value="<?php echo esc_attr( $settings['hcaptcha_secret_key'] ); ?>">
											<p class="description"><?php echo wp_kses( sprintf( /* translators: %s: hCaptcha URL */ __( 'Get your keys from %s.', 'boldform-lite' ), '<code>hcaptcha.com</code>' ), array( 'code' => array() ) ); ?></p>
										</div>
									</div>
								</div>
							</div>

							<div class="boldform-captcha-panel" data-captcha-panel="simple_math"<?php echo 'simple_math' === $settings['captcha_provider'] ? '' : ' hidden'; ?>>
								<div class="boldform-card">
									<p style="margin:0;">
										<strong><?php esc_html_e( 'Simple Math captcha is built in.', 'boldform-lite' ); ?></strong><br>
										<?php esc_html_e( 'No keys required. Visitors solve a small math question before submitting.', 'boldform-lite' ); ?>
									</p>
								</div>
							</div>

							<div class="boldform-submit-area">
								<?php submit_button( __( 'Save Changes', 'boldform-lite' ), 'primary', 'submit', false ); ?>
							</div>
						</form>

					<?php elseif ( 'smtp' === $active_tab ) : ?>
						<?php
						$smtp_sub = isset( $_GET['smtp_tab'] ) ? sanitize_key( wp_unslash( $_GET['smtp_tab'] ) ) : 'config'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
						$smtp_sub = in_array( $smtp_sub, array( 'config', 'test' ), true ) ? $smtp_sub : 'config';
						?>
						<h2><?php esc_html_e( 'SMTP Settings', 'boldform-lite' ); ?></h2>
						<p class="boldform-tab-description"><?php esc_html_e( 'Configure a custom SMTP server to send emails reliably.', 'boldform-lite' ); ?></p>

						<div class="boldform-smtp-subtabs">
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp&smtp_tab=config' ) ); ?>" class="<?php echo 'config' === $smtp_sub ? 'active' : ''; ?>">
								<?php esc_html_e( 'Configuration', 'boldform-lite' ); ?>
							</a>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp&smtp_tab=test' ) ); ?>" class="<?php echo 'test' === $smtp_sub ? 'active' : ''; ?>">
								<?php esc_html_e( 'Mail Test', 'boldform-lite' ); ?>
							</a>
						</div>

						<?php if ( 'config' === $smtp_sub ) : ?>
							<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-settings&tab=smtp&smtp_tab=config' ) ); ?>">
								<?php wp_nonce_field( 'boldform_lite_save_settings', 'boldform_settings_nonce' ); ?>

								<div class="boldform-card">
									<h3><?php esc_html_e( 'Sender', 'boldform-lite' ); ?></h3>
									<p class="description"><?php esc_html_e( 'Applied to all BoldForm emails, even when SMTP is disabled.', 'boldform-lite' ); ?></p>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-smtp-from-email"><?php esc_html_e( 'From Email', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="email" id="boldform-smtp-from-email" name="boldform_smtp_from_email" value="<?php echo esc_attr( $settings['smtp_from_email'] ); ?>" placeholder="<?php esc_attr_e( 'you@example.com', 'boldform-lite' ); ?>">
										</div>
									</div>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-smtp-from-name"><?php esc_html_e( 'From Name', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="text" id="boldform-smtp-from-name" name="boldform_smtp_from_name" value="<?php echo esc_attr( $settings['smtp_from_name'] ); ?>" placeholder="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
										</div>
									</div>
									<div class="boldform-field-row">
										<div class="boldform-field-label"><label for="boldform-smtp-reply-to"><?php esc_html_e( 'Reply-To', 'boldform-lite' ); ?></label></div>
										<div class="boldform-field-control">
											<input type="email" id="boldform-smtp-reply-to" name="boldform_smtp_reply_to" value="<?php echo esc_attr( $settings['smtp_reply_to'] ); ?>" placeholder="<?php esc_attr_e( 'reply@example.com', 'boldform-lite' ); ?>">
										</div>
									</div>
								</div>

								<div class="boldform-card">
									<div class="boldform-field-row">
										<div class="boldform-field-label"><?php esc_html_e( 'Enable SMTP', 'boldform-lite' ); ?></div>
										<div class="boldform-field-control">
											<div class="boldform-radio-group">
												<label><input type="radio" name="boldform_smtp_enabled" value="1" id="boldform-smtp-enable-yes"<?php checked( $settings['smtp_enabled'] ); ?>><span><?php esc_html_e( 'Yes', 'boldform-lite' ); ?></span></label>
												<label><input type="radio" name="boldform_smtp_enabled" value="0" id="boldform-smtp-enable-no"<?php checked( $settings['smtp_enabled'], false ); ?>><span><?php esc_html_e( 'No', 'boldform-lite' ); ?></span></label>
											</div>
										</div>
									</div>
								</div>

								<div id="boldform-smtp-fields" style="<?php echo $settings['smtp_enabled'] ? '' : 'display:none;'; ?>">
									<div class="boldform-card">
										<h3><?php esc_html_e( 'Server', 'boldform-lite' ); ?></h3>
										<div class="boldform-field-row">
											<div class="boldform-field-label"><label for="boldform-smtp-host"><?php esc_html_e( 'SMTP Host', 'boldform-lite' ); ?></label></div>
											<div class="boldform-field-control">
												<input type="text" id="boldform-smtp-host" name="boldform_smtp_host" value="<?php echo esc_attr( $settings['smtp_host'] ); ?>" placeholder="smtp.example.com">
											</div>
										</div>
										<div class="boldform-field-row">
											<div class="boldform-field-label"><?php esc_html_e( 'Encryption', 'boldform-lite' ); ?></div>
											<div class="boldform-field-control">
												<div class="boldform-radio-group">
													<label><input type="radio" name="boldform_smtp_encryption" value="none"<?php checked( $settings['smtp_encryption'], 'none' ); ?>><span><?php esc_html_e( 'None', 'boldform-lite' ); ?></span></label>
													<label><input type="radio" name="boldform_smtp_encryption" value="tls"<?php checked( $settings['smtp_encryption'], 'tls' ); ?>><span><?php esc_html_e( 'TLS', 'boldform-lite' ); ?></span></label>
													<label><input type="radio" name="boldform_smtp_encryption" value="ssl"<?php checked( $settings['smtp_encryption'], 'ssl' ); ?>><span><?php esc_html_e( 'SSL', 'boldform-lite' ); ?></span></label>
												</div>
											</div>
										</div>
										<div class="boldform-field-row">
											<div class="boldform-field-label"><label for="boldform-smtp-port"><?php esc_html_e( 'Port', 'boldform-lite' ); ?></label></div>
											<div class="boldform-field-control">
												<input type="number" id="boldform-smtp-port" name="boldform_smtp_port" value="<?php echo esc_attr( $settings['smtp_port'] ); ?>" placeholder="587">
											</div>
										</div>
									</div>

									<div class="boldform-card">
										<h3><?php esc_html_e( 'Authentication', 'boldform-lite' ); ?></h3>
										<div class="boldform-field-row">
											<div class="boldform-field-label"><?php esc_html_e( 'SMTP Auth', 'boldform-lite' ); ?></div>
											<div class="boldform-field-control">
												<div class="boldform-radio-group">
													<label><input type="radio" name="boldform_smtp_auth" value="1" id="boldform-smtp-auth-yes"<?php checked( $settings['smtp_auth'] ); ?>><span><?php esc_html_e( 'Yes', 'boldform-lite' ); ?></span></label>
													<label><input type="radio" name="boldform_smtp_auth" value="0" id="boldform-smtp-auth-no"<?php checked( $settings['smtp_auth'], false ); ?>><span><?php esc_html_e( 'No', 'boldform-lite' ); ?></span></label>
												</div>
											</div>
										</div>
										<div id="boldform-smtp-auth-fields" style="<?php echo $settings['smtp_auth'] ? '' : 'display:none;'; ?>">
											<div class="boldform-field-row">
												<div class="boldform-field-label"><label for="boldform-smtp-username"><?php esc_html_e( 'Username', 'boldform-lite' ); ?></label></div>
												<div class="boldform-field-control">
													<input type="text" id="boldform-smtp-username" name="boldform_smtp_username" value="<?php echo esc_attr( $settings['smtp_username'] ); ?>" autocomplete="off">
												</div>
											</div>
											<div class="boldform-field-row">
												<div class="boldform-field-label"><label for="boldform-smtp-password"><?php esc_html_e( 'Password', 'boldform-lite' ); ?></label></div>
												<div class="boldform-field-control">
													<input type="password" id="boldform-smtp-password" name="boldform_smtp_password" value="" placeholder="<?php echo '' !== $settings['smtp_password'] ? esc_attr__( 'Saved — leave blank to keep current password', 'boldform-lite' ) : ''; ?>" autocomplete="new-password">
												</div>
											</div>
										</div>
									</div>
								</div>

								<div class="boldform-submit-area">
									<?php submit_button( __( 'Save Changes', 'boldform-lite' ), 'primary', 'submit', false ); ?>
								</div>
							</form>

						<?php else : ?>
							<div class="boldform-card">
								<h3><?php esc_html_e( 'Send a Test Email', 'boldform-lite' ); ?></h3>
								<div class="boldform-field-row">
									<div class="boldform-field-label"><label for="boldform-test-to"><?php esc_html_e( 'To', 'boldform-lite' ); ?></label></div>
									<div class="boldform-field-control">
										<input type="email" id="boldform-test-to" placeholder="<?php esc_attr_e( 'recipient@example.com', 'boldform-lite' ); ?>">
									</div>
								</div>
								<div class="boldform-field-row">
									<div class="boldform-field-label"><label for="boldform-test-subject"><?php esc_html_e( 'Subject', 'boldform-lite' ); ?></label></div>
									<div class="boldform-field-control">
										<input type="text" id="boldform-test-subject" placeholder="<?php esc_attr_e( 'Subject', 'boldform-lite' ); ?>">
									</div>
								</div>
								<div class="boldform-field-row">
									<div class="boldform-field-label"><label for="boldform-test-message"><?php esc_html_e( 'Message', 'boldform-lite' ); ?></label></div>
									<div class="boldform-field-control">
										<textarea id="boldform-test-message" rows="4" placeholder="<?php esc_attr_e( 'Message', 'boldform-lite' ); ?>"></textarea>
									</div>
								</div>
							</div>
							<div class="boldform-submit-area">
								<button type="button" id="boldform-send-test-mail" class="button button-primary"><?php esc_html_e( 'Send Test Mail', 'boldform-lite' ); ?></button>
								<span id="boldform-test-mail-result" class="boldform-test-mail-result"></span>
							</div>
						<?php endif; ?>

					<?php elseif ( 'tools' === $active_tab ) : ?>
						<h2><?php esc_html_e( 'Tools', 'boldform-lite' ); ?></h2>
						<p class="boldform-tab-description"><?php esc_html_e( 'Export and import your forms, entries, and plugin settings.', 'boldform-lite' ); ?></p>

						<?php
						$export_import = BoldForm_Lite::get_instance()->get_export_import();
						if ( $export_import ) {
							$export_import->render_tools_tab( $settings );
						}
						?>

					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Returns global plugin settings.
	 *
	 * @return array<string, mixed>
	 */
	private function get_global_settings() {
		$defaults = array(
			'form_style_mode'      => 'plugin',
			'default_email'        => '',
			'uninstall_data'       => false,
			'captcha_provider'     => 'simple_math',
			'recaptcha_site_key'   => '',
			'recaptcha_secret_key' => '',
			'hcaptcha_site_key'    => '',
			'hcaptcha_secret_key'  => '',
			'required_msg_text'     => '',
			'required_msg_email'    => '',
			'required_msg_number'   => '',
			'required_msg_textarea' => '',
			'required_msg_select'   => '',
			'required_msg_checkbox' => '',
			'required_msg_radio'    => '',
			'required_msg_date'     => '',
			'required_msg_time'     => '',
			'smtp_enabled'         => false,
			'smtp_from_email'      => '',
			'smtp_from_name'       => '',
			'smtp_reply_to'        => '',
			'smtp_host'            => '',
			'smtp_encryption'      => 'none',
			'smtp_port'            => '',
			'smtp_auth'            => false,
			'smtp_username'        => '',
			'smtp_password'        => '',
		);

		$saved = get_option( 'boldform_lite_settings', array() );

		if ( ! is_array( $saved ) ) {
			$saved = array();
		}

		return array_merge( $defaults, $saved );
	}

	/**
	 * Handles settings form submission.
	 *
	 * @return void
	 */
	private function handle_settings_save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( 'POST' !== strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ?? '' ) ) ) ) {
			return;
		}

		$nonce = isset( $_POST['boldform_settings_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_settings_nonce'] ) ) : '';

		if ( ! wp_verify_nonce( $nonce, 'boldform_lite_save_settings' ) ) {
			return;
		}

		$settings = $this->get_global_settings();

		$form_style_mode                  = isset( $_POST['boldform_form_style_mode'] ) ? sanitize_key( wp_unslash( $_POST['boldform_form_style_mode'] ) ) : 'plugin';
		$settings['form_style_mode']      = in_array( $form_style_mode, array( 'plugin', 'theme' ), true ) ? $form_style_mode : 'plugin';
		$settings['default_email']        = isset( $_POST['boldform_default_email'] ) ? sanitize_email( wp_unslash( $_POST['boldform_default_email'] ) ) : '';
		$settings['uninstall_data']       = ! empty( $_POST['boldform_uninstall_data'] );

		// Validation messages.
		$msg_types = array( 'text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'time' );
		foreach ( $msg_types as $msg_type ) {
			$msg_key = 'required_msg_' . $msg_type;
			$settings[ $msg_key ] = isset( $_POST[ 'boldform_' . $msg_key ] ) ? sanitize_text_field( wp_unslash( $_POST[ 'boldform_' . $msg_key ] ) ) : '';
		}

		$captcha_provider                 = isset( $_POST['boldform_captcha_provider'] ) ? sanitize_key( wp_unslash( $_POST['boldform_captcha_provider'] ) ) : 'simple_math';
		$settings['captcha_provider']     = in_array( $captcha_provider, array( 'recaptcha', 'hcaptcha', 'simple_math' ), true ) ? $captcha_provider : 'simple_math';
		$settings['recaptcha_site_key']   = isset( $_POST['boldform_recaptcha_site_key'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_recaptcha_site_key'] ) ) : '';
		$settings['recaptcha_secret_key'] = isset( $_POST['boldform_recaptcha_secret_key'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_recaptcha_secret_key'] ) ) : '';
		$settings['hcaptcha_site_key']    = isset( $_POST['boldform_hcaptcha_site_key'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_hcaptcha_site_key'] ) ) : '';
		$settings['hcaptcha_secret_key']  = isset( $_POST['boldform_hcaptcha_secret_key'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_hcaptcha_secret_key'] ) ) : '';

		// SMTP settings.
		$settings['smtp_enabled']    = ! empty( $_POST['boldform_smtp_enabled'] );
		$settings['smtp_from_email'] = isset( $_POST['boldform_smtp_from_email'] ) ? sanitize_email( wp_unslash( $_POST['boldform_smtp_from_email'] ) ) : '';
		$settings['smtp_from_name']  = isset( $_POST['boldform_smtp_from_name'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_smtp_from_name'] ) ) : '';
		$settings['smtp_reply_to']   = isset( $_POST['boldform_smtp_reply_to'] ) ? sanitize_email( wp_unslash( $_POST['boldform_smtp_reply_to'] ) ) : '';
		$settings['smtp_host']       = isset( $_POST['boldform_smtp_host'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_smtp_host'] ) ) : '';
		$smtp_encryption             = isset( $_POST['boldform_smtp_encryption'] ) ? sanitize_key( wp_unslash( $_POST['boldform_smtp_encryption'] ) ) : 'none';
		$settings['smtp_encryption'] = in_array( $smtp_encryption, array( 'none', 'tls', 'ssl' ), true ) ? $smtp_encryption : 'none';
		$settings['smtp_port']       = isset( $_POST['boldform_smtp_port'] ) ? absint( $_POST['boldform_smtp_port'] ) : '';
		$settings['smtp_auth']       = ! empty( $_POST['boldform_smtp_auth'] );
		$settings['smtp_username']   = isset( $_POST['boldform_smtp_username'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_smtp_username'] ) ) : '';

		// Only update password if a new value was provided (preserve existing on empty).
		if ( isset( $_POST['boldform_smtp_password'] ) && '' !== $_POST['boldform_smtp_password'] ) {
			$settings['smtp_password'] = sanitize_text_field( wp_unslash( $_POST['boldform_smtp_password'] ) );
		}

		update_option( 'boldform_lite_settings', $settings );

		add_settings_error( 'boldform_lite_settings', 'settings_updated', __( 'Settings saved.', 'boldform-lite' ), 'success' );
		settings_errors( 'boldform_lite_settings' );
	}

	/**
	 * Filters the From email address for all wp_mail() calls.
	 *
	 * Applied even when SMTP is disabled so admin/user emails don't
	 * fall back to the WordPress default wordpress@domain.com address,
	 * which many mail servers reject.
	 *
	 * @param string $from Default from address.
	 * @return string
	 */
	public function filter_mail_from( $from ) {
		$settings = $this->get_global_settings();

		if ( empty( $settings['smtp_from_email'] ) || ! is_email( $settings['smtp_from_email'] ) ) {
			return $from;
		}

		$configured_email = $settings['smtp_from_email'];

		// If SMTP is enabled, trust it to handle any from address (credentials authenticate the sender).
		if ( ! empty( $settings['smtp_enabled'] ) && ! empty( $settings['smtp_host'] ) ) {
			return $configured_email;
		}

		// Without SMTP, only use the configured address as From if its domain matches the site domain.
		// Using a Gmail/Yahoo/external address as From without SMTP causes DMARC rejection.
		$site_domain       = wp_parse_url( home_url(), PHP_URL_HOST );
		$configured_domain = substr( strrchr( $configured_email, '@' ), 1 );

		if ( $configured_domain && $site_domain && rtrim( $configured_domain, '.' ) === rtrim( $site_domain, '.' ) ) {
			return $configured_email;
		}

		// Domain mismatch — keep site's default From and let configure_smtp handle Reply-To.
		return $from;
	}

	/**
	 * Filters the From name for all wp_mail() calls.
	 *
	 * @param string $name Default from name.
	 * @return string
	 */
	public function filter_mail_from_name( $name ) {
		$settings = $this->get_global_settings();

		if ( ! empty( $settings['smtp_from_name'] ) ) {
			return $settings['smtp_from_name'];
		}

		return $name;
	}

	/**
	 * Configures PHPMailer to use SMTP when enabled.
	 *
	 * @param \PHPMailer\PHPMailer\PHPMailer $phpmailer PHPMailer instance.
	 * @return void
	 */
	public function configure_smtp( $phpmailer ) {
		$settings = $this->get_global_settings();

		// Always apply Reply-To if configured (works with or without SMTP).
		$reply_to = ! empty( $settings['smtp_reply_to'] ) ? $settings['smtp_reply_to'] : '';

		// If From Email is set but its domain doesn't match the site (e.g. Gmail),
		// use it as Reply-To instead so replies go to the right address without DMARC failure.
		if ( empty( $reply_to ) && ! empty( $settings['smtp_from_email'] ) && is_email( $settings['smtp_from_email'] ) ) {
			$site_domain       = wp_parse_url( home_url(), PHP_URL_HOST );
			$configured_domain = substr( strrchr( $settings['smtp_from_email'], '@' ), 1 );
			if ( $configured_domain && $site_domain && rtrim( $configured_domain, '.' ) !== rtrim( $site_domain, '.' ) ) {
				$reply_to = $settings['smtp_from_email'];
			}
		}

		if ( $reply_to ) {
			$phpmailer->clearReplyTos();
			$phpmailer->addReplyTo( $reply_to );
		}

		if ( empty( $settings['smtp_enabled'] ) || empty( $settings['smtp_host'] ) ) {
			return;
		}

		$phpmailer->isSMTP();
		$phpmailer->Host = $settings['smtp_host']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( ! empty( $settings['smtp_port'] ) ) {
			$phpmailer->Port = (int) $settings['smtp_port']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		if ( 'tls' === $settings['smtp_encryption'] ) {
			$phpmailer->SMTPSecure = 'tls'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		} elseif ( 'ssl' === $settings['smtp_encryption'] ) {
			$phpmailer->SMTPSecure = 'ssl'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		} else {
			$phpmailer->SMTPSecure = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$phpmailer->SMTPAutoTLS = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		if ( ! empty( $settings['smtp_auth'] ) ) {
			$phpmailer->SMTPAuth = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$phpmailer->Username = $settings['smtp_username']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$phpmailer->Password = $settings['smtp_password']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		if ( ! empty( $settings['smtp_from_email'] ) ) {
			$phpmailer->From = $settings['smtp_from_email']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		if ( ! empty( $settings['smtp_from_name'] ) ) {
			$phpmailer->FromName = $settings['smtp_from_name']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

	}

	/**
	 * Sends a test email via AJAX.
	 *
	 * @return void
	 */
	public function ajax_send_test_mail() {
		check_ajax_referer( 'boldform_lite_test_mail' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$to = isset( $_POST['to'] ) ? sanitize_email( wp_unslash( $_POST['to'] ) ) : '';

		if ( ! is_email( $to ) ) {
			wp_send_json_error( array( 'message' => __( 'Please enter a valid email address.', 'boldform-lite' ) ) );
		}

		// Throttle so the endpoint can't be used to fire mail in a tight loop.
		$throttle_key = 'boldform_test_mail_' . get_current_user_id();
		if ( get_transient( $throttle_key ) ) {
			wp_send_json_error( array( 'message' => __( 'Please wait a few seconds before sending another test email.', 'boldform-lite' ) ) );
		}
		set_transient( $throttle_key, 1, 15 );

		// Fixed subject/body — the endpoint only verifies delivery, it is not a general mailer.
		$subject = __( 'BoldForm SMTP test email', 'boldform-lite' );
		$message = __( 'This is a test email from BoldForm confirming your email/SMTP settings are working.', 'boldform-lite' );

		$sent = wp_mail( $to, $subject, $message );

		if ( $sent ) {
			wp_send_json_success( array( 'message' => __( 'Email sent successfully!', 'boldform-lite' ) ) );
		}

		wp_send_json_error( array( 'message' => __( 'Failed to send email. Check your SMTP configuration.', 'boldform-lite' ) ) );
	}

	/**
	 * Proxies the AJAX save action.
	 *
	 * @return void
	 */
	public function ajax_save_form() {
		$this->ajax_handler->save_form();
	}

	/**
	 * Handles list-table actions like duplicate and delete.
	 *
	 * @return void
	 */
	public function handle_form_actions() {
		if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$this->maybe_export_csv();
		$this->maybe_delete_entry();

		// Bulk actions are submitted via POST, while single-row actions arrive through signed admin URLs.
		$this->handle_bulk_actions();

		$page   = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		$action = isset( $_GET['boldform_action'] ) ? sanitize_key( wp_unslash( $_GET['boldform_action'] ) ) : '';

		if ( 'boldform-lite' !== $page || ! in_array( $action, array( 'duplicate', 'delete', 'trash', 'restore' ), true ) ) {
			return;
		}

		$form_id = isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0;
		$nonce   = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';

		if ( ! $form_id || ! wp_verify_nonce( $nonce, 'boldform_lite_' . $action . '_form_' . $form_id ) ) {
			wp_safe_redirect( $this->get_forms_page_url( 'invalid_nonce' ) );
			exit;
		}

		if ( 'duplicate' === $action ) {
			$new_form_id = $this->duplicate_form( $form_id );
			wp_safe_redirect( $new_form_id ? admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . $new_form_id ) : $this->get_forms_page_url( 'duplicate_failed' ) );
			exit;
		}

		if ( 'trash' === $action ) {
			$this->trash_form( $form_id );
			wp_safe_redirect( $this->get_forms_page_url( 'trashed' ) );
			exit;
		}

		if ( 'restore' === $action ) {
			$this->restore_form( $form_id );
			wp_safe_redirect( $this->get_forms_page_url( 'restored', 'trash' ) );
			exit;
		}

		if ( 'delete' === $action ) {
			wp_safe_redirect( $this->delete_form( $form_id ) ? $this->get_forms_page_url( 'deleted', 'trash' ) : $this->get_forms_page_url( 'delete_failed', 'trash' ) );
			exit;
		}
	}

	/**
	 * Handles bulk actions from the forms list table.
	 *
	 * @return void
	 */
	private function handle_bulk_actions() {
		$bulk_action = isset( $_POST['boldform_bulk_action'] ) ? sanitize_key( wp_unslash( $_POST['boldform_bulk_action'] ) ) : '';

		if ( ! in_array( $bulk_action, array( 'trash', 'restore', 'delete' ), true ) ) {
			return;
		}

		$nonce = isset( $_POST['boldform_bulk_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['boldform_bulk_nonce'] ) ) : '';

		if ( ! wp_verify_nonce( $nonce, 'boldform_lite_bulk_action' ) ) {
			wp_safe_redirect( $this->get_forms_page_url( 'invalid_nonce' ) );
			exit;
		}

		$form_ids = isset( $_POST['boldform_form_ids'] ) && is_array( $_POST['boldform_form_ids'] ) ? array_map( 'absint', wp_unslash( $_POST['boldform_form_ids'] ) ) : array();

		if ( empty( $form_ids ) ) {
			wp_safe_redirect( $this->get_forms_page_url() );
			exit;
		}

		foreach ( $form_ids as $form_id ) {
			if ( ! $form_id ) {
				continue;
			}

			if ( 'trash' === $bulk_action ) {
				$this->trash_form( $form_id );
			} elseif ( 'restore' === $bulk_action ) {
				$this->restore_form( $form_id );
			} elseif ( 'delete' === $bulk_action ) {
				$this->delete_form( $form_id );
			}
		}

		if ( 'trash' === $bulk_action ) {
			wp_safe_redirect( $this->get_forms_page_url( 'bulk_trashed' ) );
		} elseif ( 'restore' === $bulk_action ) {
			wp_safe_redirect( $this->get_forms_page_url( 'bulk_restored', 'trash' ) );
		} else {
			wp_safe_redirect( $this->get_forms_page_url( 'bulk_deleted', 'trash' ) );
		}
		exit;
	}

	/**
	 * Returns a list of forms filtered by view.
	 *
	 * @param string $view 'all' for non-trashed forms, 'trash' for trashed forms.
	 * @return array<int, object>
	 */
	private function get_forms( $view = 'all' ) {
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();

		$safe_table = esc_sql( $table_name );

		if ( 'trash' === $view ) {
			return $wpdb->get_results( $wpdb->prepare( "SELECT id, title, status, fields_json, updated_at FROM `{$safe_table}` WHERE status = %s ORDER BY id DESC", 'trash' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}

		return $wpdb->get_results( $wpdb->prepare( "SELECT id, title, status, fields_json, updated_at FROM `{$safe_table}` WHERE status != %s ORDER BY id DESC", 'trash' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Filters the forms list by active/inactive status (PHP-side; the list is
	 * not paginated). 'active' means published; anything else counts as inactive.
	 *
	 * @param array<int, object> $forms         Forms to filter.
	 * @param string             $status_filter 'active' or 'inactive'.
	 * @return array<int, object>
	 */
	private function filter_forms_by_status( $forms, $status_filter ) {
		return array_values(
			array_filter(
				$forms,
				function ( $form ) use ( $status_filter ) {
					$is_active = 'publish' === ( $form->status ?? 'publish' );
					return ( 'active' === $status_filter ) ? $is_active : ! $is_active;
				}
			)
		);
	}

	/**
	 * Sorts the forms list in PHP (the list is not paginated) by an allowlisted
	 * column. Entry counts are not a forms-table column, so they are compared
	 * via the pre-fetched counts map rather than in SQL.
	 *
	 * @param array<int, object> $forms        Forms to sort.
	 * @param string             $orderby      One of 'title', 'entries', 'updated'.
	 * @param string             $order        'asc' or 'desc'.
	 * @param array<int, int>    $entry_counts Entry counts keyed by form ID.
	 * @return array<int, object>
	 */
	private function sort_forms_list( $forms, $orderby, $order, $entry_counts ) {
		$dir = ( 'asc' === $order ) ? 1 : -1;

		usort(
			$forms,
			function ( $a, $b ) use ( $orderby, $entry_counts, $dir ) {
				if ( 'title' === $orderby ) {
					$cmp = strcasecmp( (string) $a->title, (string) $b->title );
				} elseif ( 'entries' === $orderby ) {
					$count_a = (int) ( $entry_counts[ (int) $a->id ] ?? 0 );
					$count_b = (int) ( $entry_counts[ (int) $b->id ] ?? 0 );
					$cmp     = $count_a <=> $count_b;
				} else {
					$time_a = isset( $a->updated_at ) ? (int) strtotime( (string) $a->updated_at ) : 0;
					$time_b = isset( $b->updated_at ) ? (int) strtotime( (string) $b->updated_at ) : 0;
					$cmp    = $time_a <=> $time_b;
				}

				// Stable tiebreaker so equal values keep a deterministic order.
				if ( 0 === $cmp ) {
					$cmp = (int) $a->id <=> (int) $b->id;
				}

				return $cmp * $dir;
			}
		);

		return $forms;
	}

	/**
	 * Echoes a sortable column header (<th>) for the forms list, mirroring the
	 * native WordPress list-table behaviour: a link that toggles asc/desc with
	 * the active direction reflected in the markup (and aria-sort).
	 *
	 * @param string $key             Sort key ('title', 'entries', 'updated').
	 * @param string $col_class       The column's CSS class (e.g. 'boldform-col-title').
	 * @param string $label           Visible header label.
	 * @param string $current_orderby The active orderby, if any.
	 * @param string $current_order   The active order ('asc'|'desc').
	 * @param string $base_url        Page URL to build the sort link from.
	 * @return void
	 */
	private function render_sortable_th( $key, $col_class, $label, $current_orderby, $current_order, $base_url ) {
		$is_sorted = ( $current_orderby === $key );

		// Title reads naturally A→Z first; counts/dates are more useful high→low first.
		$default_dir = ( 'title' === $key ) ? 'asc' : 'desc';
		$next_order  = $is_sorted ? ( 'asc' === $current_order ? 'desc' : 'asc' ) : $default_dir;

		$th_class = $col_class . ' boldform-sortable';
		$aria     = 'none';
		if ( $is_sorted ) {
			$th_class .= ' is-sorted is-sorted-' . ( 'asc' === $current_order ? 'asc' : 'desc' );
			$aria      = ( 'asc' === $current_order ) ? 'ascending' : 'descending';
		}

		$url = add_query_arg(
			array(
				'orderby' => $key,
				'order'   => $next_order,
			),
			$base_url
		);

		printf(
			'<th class="%1$s" aria-sort="%2$s"><a href="%3$s" class="boldform-sort-link"><span class="boldform-sort-label">%4$s</span><span class="boldform-sort-indicators" aria-hidden="true"><span class="boldform-sort-indicator boldform-sort-asc"></span><span class="boldform-sort-indicator boldform-sort-desc"></span></span></a></th>',
			esc_attr( $th_class ),
			esc_attr( $aria ),
			esc_url( $url ),
			esc_html( $label )
		);
	}

	/**
	 * Returns the count of forms for a given status.
	 *
	 * @param string $status Optional status to count. Empty for non-trashed.
	 * @return int
	 */
	private function get_forms_count( $status = '' ) {
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();

		$safe_table = esc_sql( $table_name );

		if ( 'trash' === $status ) {
			return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$safe_table}` WHERE status = %s", 'trash' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}

		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$safe_table}` WHERE status != %s", 'trash' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Returns entry counts grouped by form ID.
	 *
	 * @return array<int, int> Map of form_id => count.
	 */
	private function get_entry_counts_by_form() {
		global $wpdb;

		$safe_table = esc_sql( $this->plugin->get_entries_table_name() );

		$results = $wpdb->get_results( "SELECT form_id, COUNT(*) AS total FROM `{$safe_table}` GROUP BY form_id" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$counts = array();

		foreach ( $results as $row ) {
			$counts[ (int) $row->form_id ] = (int) $row->total;
		}

		return $counts;
	}

	/**
	 * Builds a secure action URL for a form.
	 *
	 * @param string $action  Action name.
	 * @param int    $form_id Form ID.
	 * @return string
	 */
	private function get_form_action_url( $action, $form_id ) {
		return wp_nonce_url(
			add_query_arg(
				array(
					'page'            => 'boldform-lite',
					'boldform_action' => $action,
					'form_id'         => $form_id,
				),
				admin_url( 'admin.php' )
			),
			'boldform_lite_' . $action . '_form_' . $form_id
		);
	}

	/**
	 * Returns the forms list URL with an optional notice.
	 *
	 * @param string $notice      Notice key.
	 * @param string $form_status Optional status view ('trash').
	 * @return string
	 */
	private function get_forms_page_url( $notice = '', $form_status = '' ) {
		$args = array(
			'page' => 'boldform-lite',
		);

		if ( '' !== $notice ) {
			$args['boldform_notice'] = $notice;
		}

		if ( 'trash' === $form_status ) {
			$args['form_status'] = 'trash';
		}

		return add_query_arg( $args, admin_url( 'admin.php' ) );
	}

	/**
	 * Renders list-page notices for completed actions.
	 *
	 * @param string $notice Notice key.
	 * @return void
	 */
	private function render_admin_notice( $notice ) {
		$messages = array(
			'trashed'          => array( 'success', __( 'Form moved to trash.', 'boldform-lite' ) ),
			'bulk_trashed'     => array( 'success', __( 'Selected forms moved to trash.', 'boldform-lite' ) ),
			'restored'         => array( 'success', __( 'Form restored.', 'boldform-lite' ) ),
			'bulk_restored'    => array( 'success', __( 'Selected forms restored.', 'boldform-lite' ) ),
			'deleted'          => array( 'success', __( 'Form permanently deleted.', 'boldform-lite' ) ),
			'bulk_deleted'     => array( 'success', __( 'Selected forms permanently deleted.', 'boldform-lite' ) ),
			'delete_failed'    => array( 'error', __( 'Unable to delete the form.', 'boldform-lite' ) ),
			'duplicate_failed' => array( 'error', __( 'Unable to duplicate the form.', 'boldform-lite' ) ),
			'invalid_nonce'    => array( 'error', __( 'Security check failed.', 'boldform-lite' ) ),
		);

		if ( ! isset( $messages[ $notice ] ) ) {
			return;
		}

		list( $type, $message ) = $messages[ $notice ];
		$icon = ( 'error' === $type ) ? 'dashicons-warning' : 'dashicons-yes-alt';
		// Keep `notice is-dismissible` so WordPress still wires up the dismiss (×)
		// button; the boldform-admin-notice classes restyle it into a modern alert.
		?>
		<div class="notice inline is-dismissible boldform-admin-notice boldform-admin-notice--<?php echo esc_attr( $type ); ?>">
			<span class="dashicons <?php echo esc_attr( $icon ); ?>" aria-hidden="true"></span>
			<p><?php echo esc_html( $message ); ?></p>
		</div>
		<?php
	}

	/**
	 * Creates a duplicate of an existing form.
	 *
	 * @param int $form_id Source form ID.
	 * @return int
	 */
	private function duplicate_form( $form_id ) {
		global $wpdb;

		$form = $this->get_form( $form_id );

		if ( ! $form ) {
			return 0;
		}

		$table_name = $this->plugin->get_forms_table_name();
		$title      = sprintf(
			/* translators: %s: original form title */
			__( '%s (Copy)', 'boldform-lite' ),
			(string) $form->title
		);

		$inserted = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$table_name,
			array(
				'title'         => $title,
				'status'        => (string) $form->status,
				'fields_json'   => (string) $form->fields_json,
				'settings_json' => (string) $form->settings_json,
				'created_by'    => get_current_user_id(),
			),
			array( '%s', '%s', '%s', '%s', '%d' )
		);

		return $inserted ? (int) $wpdb->insert_id : 0;
	}

	/**
	 * Moves a form to trash by setting its status.
	 *
	 * @param int $form_id Form ID.
	 * @return bool
	 */
	private function trash_form( $form_id ) {
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();
		$updated    = $wpdb->update( $table_name, array( 'status' => 'trash' ), array( 'id' => $form_id ), array( '%s' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		return false !== $updated && $updated > 0;
	}

	/**
	 * Restores a form from trash.
	 *
	 * @param int $form_id Form ID.
	 * @return bool
	 */
	private function restore_form( $form_id ) {
		global $wpdb;

		$table_name = $this->plugin->get_forms_table_name();
		$updated    = $wpdb->update( $table_name, array( 'status' => 'publish' ), array( 'id' => $form_id ), array( '%s' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		return false !== $updated && $updated > 0;
	}

	/**
	 * Permanently deletes a form and its entries.
	 *
	 * @param int $form_id Form ID.
	 * @return bool
	 */
	private function delete_form( $form_id ) {
		global $wpdb;

		$forms_table   = $this->plugin->get_forms_table_name();
		$entries_table = $this->plugin->get_entries_table_name();

		$wpdb->delete( $entries_table, array( 'form_id' => $form_id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$deleted = $wpdb->delete( $forms_table, array( 'id' => $form_id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		return false !== $deleted && $deleted > 0;
	}

	/**
	 * Returns a single form.
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
	 * Returns paginated entries.
	 *
	 * @param int $page     Current page.
	 * @param int $per_page Items per page.
	 * @return array<int, object>
	 */
	private function get_entries( $page, $per_page, $filters = array() ) {
		global $wpdb;

		$table_name = $this->plugin->get_entries_table_name();
		$offset     = max( 0, ( $page - 1 ) * $per_page );
		$safe_table = esc_sql( $table_name );
		$where      = $this->build_entries_where( $filters ); // Each clause is individually prepared via $wpdb->prepare().

		return $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter
			$wpdb->prepare(
				"SELECT id, form_id, entry_data_json, status, user_ip, created_at FROM `{$safe_table}` {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$per_page,
				$offset
			)
		);
	}

	/**
	 * Renders a single entry detail view.
	 *
	 * @param int $entry_id Entry ID.
	 * @return void
	 */
	private function render_entry_detail( $entry_id ) {
		$entry = $this->get_entry( $entry_id );

		$this->render_admin_topbar( 'boldform-lite-entries' );

		if ( ! $entry ) {
			?>
			<div class="wrap">
				<div class="boldform-page-header"><h1><?php esc_html_e( 'Entry Not Found', 'boldform-lite' ); ?></h1></div>
				<p><?php esc_html_e( 'The requested entry does not exist.', 'boldform-lite' ); ?></p>
			</div>
			<?php
			return;
		}

		// Auto-mark as read when viewed.
		if ( 'unread' === $entry->status ) {
			global $wpdb;
			$wpdb->update( $this->plugin->get_entries_table_name(), array( 'status' => 'read' ), array( 'id' => $entry_id ), array( '%s' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$entry->status = 'read';
		}

		$decoded      = json_decode( (string) $entry->entry_data_json, true );
		$form         = $this->get_form( (int) $entry->form_id );
		$form_title   = $form ? ( $form->title ? (string) $form->title : '#' . absint( $form->id ) ) : '';
		$entry_status = (string) $entry->status;
		$delete_url   = wp_nonce_url(
			admin_url( 'admin.php?page=boldform-lite-entries&boldform_delete_entry=' . absint( $entry->id ) ),
			'boldform_lite_delete_entry_' . absint( $entry->id )
		);
		?>
		<div class="wrap boldform-entry-detail-wrap">
			<!-- Header bar -->
			<div class="boldform-entry-header">
				<div class="boldform-entry-header__left">
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries' ) ); ?>" class="boldform-entry-header__back" title="<?php esc_attr_e( 'Back to Entries', 'boldform-lite' ); ?>">
						<span class="dashicons dashicons-arrow-left-alt2"></span>
					</a>
					<div class="boldform-entry-header__title">
						<h1><?php /* translators: %d: entry ID */ printf( esc_html__( 'Entry #%d', 'boldform-lite' ), absint( $entry->id ) ); ?></h1>
						<?php if ( $form_title ) : ?>
							<span class="boldform-entry-header__form"><?php echo esc_html( $form_title ); ?></span>
						<?php endif; ?>
					</div>
				</div>
				<div class="boldform-entry-header__right">
					<span class="boldform-status-badge boldform-status--<?php echo esc_attr( $entry_status ); ?>" id="boldform-detail-status"><?php echo esc_html( ucfirst( $entry_status ) ); ?></span>
					<button type="button" class="boldform-entry-action-btn" id="boldform-mark-starred" title="<?php echo 'starred' === $entry_status ? esc_attr__( 'Remove Star', 'boldform-lite' ) : esc_attr__( 'Star Entry', 'boldform-lite' ); ?>">
						<span class="dashicons <?php echo 'starred' === $entry_status ? 'dashicons-star-filled' : 'dashicons-star-empty'; ?>"></span>
					</button>
					<button type="button" class="boldform-entry-action-btn" id="boldform-mark-unread" title="<?php esc_attr_e( 'Mark as Unread', 'boldform-lite' ); ?>" <?php echo 'unread' === $entry_status ? 'disabled' : ''; ?>>
						<span class="dashicons dashicons-email"></span>
					</button>
					<a href="<?php echo esc_url( $delete_url ); ?>" class="boldform-entry-action-btn boldform-entry-action-btn--danger" title="<?php esc_attr_e( 'Delete', 'boldform-lite' ); ?>" onclick="return confirm('<?php echo esc_js( __( 'Delete this entry permanently?', 'boldform-lite' ) ); ?>');">
						<span class="dashicons dashicons-trash"></span>
					</a>
				</div>
			</div>

			<div class="boldform-entry-layout">
				<!-- Main: Submitted Data -->
				<div class="boldform-entry-main">
					<?php if ( is_array( $decoded ) && ! empty( $decoded ) ) : ?>
						<div class="boldform-entry-data">
							<?php foreach ( $decoded as $idx => $field ) : ?>
								<?php
								$label   = isset( $field['label'] ) && '' !== $field['label'] ? (string) $field['label'] : __( 'Field', 'boldform-lite' );
								$type    = isset( $field['type'] ) ? (string) $field['type'] : '';
								$value   = isset( $field['value'] ) ? $field['value'] : '';
								$is_file = 'file' === $type;

								// Present each value human-readably by field type.
								if ( is_array( $value ) ) {
									// Drop empty parts (e.g. a blank middle name) before joining, so a name
									// reads "First Last" instead of "First, , Last". Names join with spaces;
									// everything else (address, multi-select) joins with commas.
									$parts = array_filter(
										array_map( 'sanitize_text_field', $value ),
										static function ( $part ) {
											return '' !== trim( (string) $part );
										}
									);
									$value = implode( 'name' === $type ? ' ' : ', ', $parts );
								} else {
									$value = (string) $value;
								}

								if ( 'country' === $type && '' !== $value ) {
									// Show the country name instead of the raw ISO code.
									$countries = BoldForm_Lite_Shortcode::get_country_list();
									$value     = isset( $countries[ $value ] ) ? $countries[ $value ] : $value;
								} elseif ( 'terms_conditions' === $type ) {
									// Stored as "1" when agreed — show a readable label.
									$value = ( '' !== $value && '0' !== $value ) ? __( 'Accepted', 'boldform-lite' ) : __( 'Not accepted', 'boldform-lite' );
								}
								?>
								<div class="boldform-entry-field">
									<div class="boldform-entry-field__label"><?php echo esc_html( $label ); ?></div>
									<div class="boldform-entry-field__value">
										<?php if ( $is_file && ! empty( $value ) ) : ?>
											<a href="<?php echo esc_url( (string) $value ); ?>" target="_blank" class="boldform-entry-file-link">
												<span class="dashicons dashicons-media-default"></span>
												<?php echo esc_html( basename( (string) $value ) ); ?>
											</a>
										<?php elseif ( '' !== (string) $value ) : ?>
											<?php echo nl2br( esc_html( (string) $value ) ); ?>
										<?php else : ?>
											<span class="boldform-entry-field__empty">&mdash;</span>
										<?php endif; ?>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>

				<!-- Sidebar: Meta -->
				<div class="boldform-entry-sidebar">
					<div class="boldform-entry-meta-card">
						<h3><span class="dashicons dashicons-info-outline"></span> <?php esc_html_e( 'Details', 'boldform-lite' ); ?></h3>
						<div class="boldform-entry-meta-list">
							<div class="boldform-entry-meta-item">
								<span class="boldform-entry-meta-item__icon dashicons dashicons-calendar-alt"></span>
								<div>
									<span class="boldform-entry-meta-item__label"><?php esc_html_e( 'Submitted', 'boldform-lite' ); ?></span>
									<span class="boldform-entry-meta-item__value"><?php echo esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $entry->created_at ) ) ); ?></span>
								</div>
							</div>
							<?php if ( $form_title ) : ?>
								<div class="boldform-entry-meta-item">
									<?php boldform_lite_brand_icon( array( 'class' => 'boldform-entry-meta-item__icon dashicons boldform-brand-icon' ) ); ?>
									<div>
										<span class="boldform-entry-meta-item__label"><?php esc_html_e( 'Form', 'boldform-lite' ); ?></span>
										<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-builder&form_id=' . absint( $entry->form_id ) ) ); ?>" class="boldform-entry-meta-item__value boldform-entry-meta-item__link"><?php echo esc_html( $form_title ); ?></a>
									</div>
								</div>
							<?php endif; ?>
							<?php if ( ! empty( $entry->user_ip ) ) : ?>
								<div class="boldform-entry-meta-item">
									<span class="boldform-entry-meta-item__icon dashicons dashicons-admin-site-alt3"></span>
									<div>
										<span class="boldform-entry-meta-item__label"><?php esc_html_e( 'IP Address', 'boldform-lite' ); ?></span>
										<span class="boldform-entry-meta-item__value"><?php echo esc_html( (string) $entry->user_ip ); ?></span>
									</div>
								</div>
							<?php endif; ?>
							<?php if ( ! empty( $entry->user_agent ) ) : ?>
								<div class="boldform-entry-meta-item">
									<span class="boldform-entry-meta-item__icon dashicons dashicons-desktop"></span>
									<div>
										<span class="boldform-entry-meta-item__label"><?php esc_html_e( 'Browser', 'boldform-lite' ); ?></span>
										<span class="boldform-entry-meta-item__value boldform-entry-meta-item__ua"><?php echo esc_html( (string) $entry->user_agent ); ?></span>
									</div>
								</div>
							<?php endif; ?>
						</div>
					</div>
				</div>
			</div>

		</div>
		<?php
	}

	/**
	 * Returns a single entry by ID.
	 *
	 * @param int $entry_id Entry ID.
	 * @return object|null
	 */
	private function get_entry( $entry_id ) {
		global $wpdb;

		$safe_table = esc_sql( $this->plugin->get_entries_table_name() );

		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT * FROM `{$safe_table}` WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$entry_id
			)
		);
	}

	/**
	 * Toggles a form's publish/draft status via AJAX.
	 *
	 * @return void
	 */
	public function ajax_toggle_form_status() {
		check_ajax_referer( 'boldform_lite_form_status' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$form_id = isset( $_POST['form_id'] ) ? absint( $_POST['form_id'] ) : 0;
		$status  = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : '';

		if ( ! $form_id || ! in_array( $status, array( 'publish', 'draft' ), true ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid request.', 'boldform-lite' ) ) );
		}

		global $wpdb;

		$wpdb->update( $this->plugin->get_forms_table_name(), array( 'status' => $status ), array( 'id' => $form_id ), array( '%s' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		wp_send_json_success( array( 'status' => $status ) );
	}

	/**
	 * Updates an entry's read/unread/starred/spam status via AJAX.
	 *
	 * @return void
	 */
	public function ajax_update_entry_status() {
		check_ajax_referer( 'boldform_lite_entry_status' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'boldform-lite' ) ), 403 );
		}

		$entry_id = isset( $_POST['entry_id'] ) ? absint( $_POST['entry_id'] ) : 0;
		$status   = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : '';

		if ( ! $entry_id || ! in_array( $status, array( 'unread', 'read', 'starred' ), true ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid request.', 'boldform-lite' ) ) );
		}

		global $wpdb;

		$table = $this->plugin->get_entries_table_name();

		$wpdb->update( $table, array( 'status' => $status ), array( 'id' => $entry_id ), array( '%s' ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		wp_send_json_success( array( 'status' => $status ) );
	}

	/**
	 * Handles entry delete action.
	 *
	 * @return void
	 */
	private function maybe_delete_entry() {
		if ( empty( $_GET['boldform_delete_entry'] ) ) {
			return;
		}

		$entry_id = absint( $_GET['boldform_delete_entry'] );

		check_admin_referer( 'boldform_lite_delete_entry_' . $entry_id );

		if ( ! current_user_can( 'manage_options' ) || ! $entry_id ) {
			return;
		}

		global $wpdb;

		$table = $this->plugin->get_entries_table_name();

		$wpdb->delete( $table, array( 'id' => $entry_id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		wp_safe_redirect( admin_url( 'admin.php?page=boldform-lite-entries&boldform_notice=entry_deleted' ) );
		exit;
	}

	/**
	 * Exports entries as a CSV download.
	 *
	 * @return void
	 */
	private function maybe_export_csv() {
		if ( empty( $_GET['boldform_export_csv'] ) ) {
			return;
		}

		check_admin_referer( 'boldform_lite_csv_export' );

		global $wpdb;

		$safe_table = esc_sql( $this->plugin->get_entries_table_name() );

		// Honor the same filters the Entries screen passes in the export link (form/status/date).
		$filters = array(
			'form_id'   => isset( $_GET['form_id'] ) ? absint( wp_unslash( $_GET['form_id'] ) ) : 0,
			'status'    => isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '',
			'date_from' => isset( $_GET['date_from'] ) ? sanitize_text_field( wp_unslash( $_GET['date_from'] ) ) : '',
			'date_to'   => isset( $_GET['date_to'] ) ? sanitize_text_field( wp_unslash( $_GET['date_to'] ) ) : '',
		);
		$where      = $this->build_entries_where( $filters ); // Each clause is individually prepared via $wpdb->prepare().
		$entries    = $wpdb->get_results( "SELECT * FROM `{$safe_table}` {$where} ORDER BY created_at DESC", ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Collect all unique field labels across entries.
		$columns = array();

		foreach ( $entries as $entry ) {
			$data = json_decode( $entry['entry_data_json'], true );

			if ( ! is_array( $data ) ) {
				continue;
			}

			foreach ( $data as $field ) {
				$label = isset( $field['label'] ) && '' !== $field['label'] ? (string) $field['label'] : 'Field';

				if ( ! in_array( $label, $columns, true ) ) {
					$columns[] = $label;
				}
			}
		}

		$filename = 'boldform-entries-' . gmdate( 'Y-m-d' ) . '.csv';

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );

		$output = fopen( 'php://output', 'w' );

		// Header row.
		fputcsv( $output, array_map( array( $this, 'csv_escape_cell' ), array_merge( array( 'Entry ID', 'Form ID', 'Date' ), $columns ) ) );

		foreach ( $entries as $entry ) {
			$data = json_decode( $entry['entry_data_json'], true );
			$row  = array(
				$entry['id'],
				$entry['form_id'],
				$entry['created_at'],
			);

			$field_map = array();

			if ( is_array( $data ) ) {
				foreach ( $data as $field ) {
					$label = isset( $field['label'] ) && '' !== $field['label'] ? (string) $field['label'] : 'Field';
					$value = isset( $field['value'] ) ? $field['value'] : '';

					if ( is_array( $value ) ) {
						$value = implode( ', ', $value );
					}

					$field_map[ $label ] = (string) $value;
				}
			}

			foreach ( $columns as $col ) {
				$row[] = isset( $field_map[ $col ] ) ? $field_map[ $col ] : '';
			}

			fputcsv( $output, array_map( array( $this, 'csv_escape_cell' ), $row ) );
		}

		fclose( $output ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- writing to php://output stream, not a filesystem file.
		exit;
	}

	/**
	 * Neutralizes CSV/spreadsheet formula injection in a single cell.
	 *
	 * Prefixes a leading =, +, -, @, tab or CR with a single quote so spreadsheet
	 * apps treat attacker-supplied submission values as text, not formulas.
	 *
	 * @param mixed $value Cell value.
	 * @return string
	 */
	private function csv_escape_cell( $value ) {
		$value = (string) $value;

		if ( '' !== $value && in_array( $value[0], array( '=', '+', '-', '@', "\t", "\r" ), true ) ) {
			$value = "'" . $value;
		}

		return $value;
	}

	/**
	 * Returns total entries count.
	 *
	 * @return int
	 */
	private function get_entries_count( $filters = array() ) {
		global $wpdb;

		$table_name = $this->plugin->get_entries_table_name();
		$safe_table = esc_sql( $table_name );
		$where      = $this->build_entries_where( $filters ); // Each clause is individually prepared via $wpdb->prepare().

		return (int) $wpdb->get_var( "SELECT COUNT(id) FROM `{$safe_table}` {$where}" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter
	}

	/**
	 * Builds WHERE clause for entries queries.
	 *
	 * @param array $filters Filter parameters.
	 * @return string
	 */
	private function build_entries_where( $filters ) {
		global $wpdb;

		$clauses = array();

		if ( ! empty( $filters['form_id'] ) ) {
			$clauses[] = $wpdb->prepare( 'form_id = %d', absint( $filters['form_id'] ) );
		}

		if ( ! empty( $filters['status'] ) && 'all' !== $filters['status'] ) {
			$clauses[] = $wpdb->prepare( 'status = %s', sanitize_key( $filters['status'] ) );
		}

		if ( ! empty( $filters['date_from'] ) ) {
			$clauses[] = $wpdb->prepare( 'created_at >= %s', sanitize_text_field( $filters['date_from'] ) . ' 00:00:00' );
		}

		if ( ! empty( $filters['date_to'] ) ) {
			$clauses[] = $wpdb->prepare( 'created_at <= %s', sanitize_text_field( $filters['date_to'] ) . ' 23:59:59' );
		}

		if ( empty( $clauses ) ) {
			return '';
		}

		return 'WHERE ' . implode( ' AND ', $clauses );
	}

	/**
	 * Normalizes a form record for the builder.
	 *
	 * @param object|null $form_record Form database record.
	 * @return array<string, mixed>
	 */
	private function normalize_form_for_builder( $form_record ) {
		// The builder expects one stable shape for both new forms and existing DB records.
		return array(
			'id'        => $form_record ? (int) $form_record->id : 0,
			'title'     => $form_record ? (string) $form_record->title : __( 'Untitled Form', 'boldform-lite' ),
			'structure' => $this->extract_structure_from_record( $form_record ),
			'settings'  => $this->extract_settings_from_record( $form_record ),
		);
	}

	/**
	 * Extracts normalized form settings from a database record.
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

		$submission_type = isset( $decoded['submission_type'] ) && in_array( $decoded['submission_type'], array( 'ajax', 'redirect' ), true )
			? $decoded['submission_type']
			: ( ! empty( $decoded['enable_redirect'] ) ? 'redirect' : 'ajax' );
		$admin_email     = isset( $decoded['admin_email'] ) ? sanitize_email( (string) $decoded['admin_email'] ) : $defaults['admin_email'];
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
			'button_icon_svg'      => isset( $decoded['button_icon_svg'] ) ? (string) $decoded['button_icon_svg'] : '',
			'button_icon_position' => isset( $decoded['button_icon_position'] ) && in_array( $decoded['button_icon_position'], array( 'left', 'right' ), true ) ? $decoded['button_icon_position'] : 'right',
			'button_icon_gap'      => isset( $decoded['button_icon_gap'] ) ? absint( $decoded['button_icon_gap'] ) : 8,
			'button_icon_size'     => isset( $decoded['button_icon_size'] ) ? absint( $decoded['button_icon_size'] ) : 18,
			'button_icon_color'    => isset( $decoded['button_icon_color'] ) && sanitize_hex_color( $decoded['button_icon_color'] ) ? sanitize_hex_color( $decoded['button_icon_color'] ) : '',
			'button_layout'     => isset( $decoded['button_layout'] ) && in_array( $decoded['button_layout'], array( 'below', 'inline' ), true ) ? $decoded['button_layout'] : 'below',
			'admin_email_type'  => $admin_email_type,
			'enable_admin_email'=> isset( $decoded['enable_admin_email'] ) ? (bool) $decoded['enable_admin_email'] : $defaults['enable_admin_email'],
			'enable_user_email' => isset( $decoded['enable_user_email'] ) ? (bool) $decoded['enable_user_email'] : $defaults['enable_user_email'],
			'admin_email'       => $admin_email,
			// Multi-step settings (data passthrough for Pro's multi-page module).
			'step_progress_style' => isset( $decoded['step_progress_style'] ) && in_array( $decoded['step_progress_style'], array( 'bar', 'steps', 'headings' ), true ) ? $decoded['step_progress_style'] : 'bar',
			'step_progress_color' => isset( $decoded['step_progress_color'] ) && sanitize_hex_color( $decoded['step_progress_color'] ) ? sanitize_hex_color( $decoded['step_progress_color'] ) : '',
			'step_btn_color'      => isset( $decoded['step_btn_color'] ) && sanitize_hex_color( $decoded['step_btn_color'] ) ? sanitize_hex_color( $decoded['step_btn_color'] ) : '',
			'step_btn_text_color' => isset( $decoded['step_btn_text_color'] ) && sanitize_hex_color( $decoded['step_btn_text_color'] ) ? sanitize_hex_color( $decoded['step_btn_text_color'] ) : '',
			'step_btn_size'       => isset( $decoded['step_btn_size'] ) && in_array( $decoded['step_btn_size'], array( 'small', 'medium', 'large' ), true ) ? $decoded['step_btn_size'] : 'medium',
			'step_btn_radius'     => isset( $decoded['step_btn_radius'] ) && '' !== $decoded['step_btn_radius'] ? max( 0, min( 50, absint( $decoded['step_btn_radius'] ) ) ) : '',
			'step_next_text'      => isset( $decoded['step_next_text'] ) ? sanitize_text_field( (string) $decoded['step_next_text'] ) : 'Next',
			'step_prev_text'      => isset( $decoded['step_prev_text'] ) ? sanitize_text_field( (string) $decoded['step_prev_text'] ) : 'Previous',
			'design_theme'        => isset( $decoded['design_theme'] ) ? sanitize_key( (string) $decoded['design_theme'] ) : '',
			'hide_labels'         => ! empty( $decoded['hide_labels'] ),
			'hide_placeholders'   => ! empty( $decoded['hide_placeholders'] ),
			'style'               => $this->extract_style_from_record_settings( $decoded ),
		);
	}

	/**
	 * Validates the nested per-device advanced style map from a decoded settings blob.
	 *
	 * Mirrors normalize_style_settings() in ajax-save.php: only BoldForm-namespaced
	 * custom properties (`--bf-*`) carrying values from the safe CSS grammar survive.
	 * The value was already sanitized on save; re-validating on the way back out means
	 * a hand-edited or legacy settings_json can never feed unsafe tokens into the
	 * builder preview or the localized payload. Without this the Style tab would boot
	 * to its defaults on every reload because the allowlist above drops the key.
	 *
	 * @param array<string, mixed> $decoded Decoded settings_json.
	 * @return array<string, array<string, string>> Per-device { '--bf-*' => value } map.
	 */
	private function extract_style_from_record_settings( $decoded ) {
		$out = array(
			'desktop' => array(),
			'tablet'  => array(),
			'mobile'  => array(),
		);

		if ( empty( $decoded['style'] ) || ! is_array( $decoded['style'] ) ) {
			return $out;
		}

		foreach ( array( 'desktop', 'tablet', 'mobile' ) as $device ) {
			if ( empty( $decoded['style'][ $device ] ) || ! is_array( $decoded['style'][ $device ] ) ) {
				continue;
			}

			foreach ( $decoded['style'][ $device ] as $css_var => $value ) {
				if ( ! is_string( $css_var ) || ! preg_match( '/^--bf-[a-z0-9-]+$/', $css_var ) || ! is_string( $value ) ) {
					continue;
				}

				$value = trim( $value );
				if ( '' === $value || strlen( $value ) > 200 ) {
					continue;
				}
				// Same hard charset gate as the save-side sanitizer: no `:;{}<>@"'` or backslash.
				if ( preg_match( '/[^a-zA-Z0-9#%().,\s_\-]/', $value ) ) {
					continue;
				}
				$lower = strtolower( $value );
				if (
					false !== strpos( $lower, 'url(' ) ||
					false !== strpos( $lower, 'expression' ) ||
					false !== strpos( $lower, 'import' ) ||
					false !== strpos( $lower, '/*' )
				) {
					continue;
				}

				$out[ $device ][ $css_var ] = $value;
			}
		}

		return $out;
	}

	/**
	 * Extracts builder structure from a database record.
	 *
	 * @param object|null $form_record Form database record.
	 * @return array<string, array<int, array<string, mixed>>>
	 */
	private function extract_structure_from_record( $form_record ) {
		if ( ! $form_record || empty( $form_record->fields_json ) ) {
			return array(
				'rows' => array(),
			);
		}

		$decoded = json_decode( (string) $form_record->fields_json, true );

		if ( isset( $decoded['rows'] ) && is_array( $decoded['rows'] ) ) {
			return array(
				'rows' => $decoded['rows'],
			);
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

		return array(
			'rows' => array(),
		);
	}

	/**
	 * Extracts field array from a database record.
	 *
	 * @param object|null $form_record Form database record.
	 * @return array<int, array<string, mixed>>
	 */
	private function extract_fields_from_record( $form_record ) {
		$structure = $this->extract_structure_from_record( $form_record );
		$fields    = array();

		if ( empty( $structure['rows'] ) || ! is_array( $structure['rows'] ) ) {
			return $fields;
		}

		foreach ( $structure['rows'] as $row ) {
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
	 * Renders entry JSON into readable HTML.
	 *
	 * @param object $entry Entry record.
	 * @return string
	 */
	/**
	 * Returns a short preview string from the first 2-3 field values.
	 *
	 * @param object $entry Entry record.
	 * @return string
	 */
	private function get_entry_preview_text( $entry ) {
		$decoded = json_decode( (string) $entry->entry_data_json, true );

		if ( empty( $decoded ) || ! is_array( $decoded ) ) {
			return __( 'No data', 'boldform-lite' );
		}

		$parts = array();

		foreach ( $decoded as $field ) {
			if ( count( $parts ) >= 3 ) {
				break;
			}

			if ( empty( $field['value'] ) || ( isset( $field['type'] ) && in_array( $field['type'], array( 'file', 'submit' ), true ) ) ) {
				continue;
			}

			$value = $field['value'];

			if ( is_array( $value ) ) {
				$value = implode( ', ', $value );
			}

			$value = sanitize_text_field( (string) $value );

			if ( mb_strlen( $value ) > 40 ) {
				$value = mb_substr( $value, 0, 40 ) . '...';
			}

			$parts[] = $value;
		}

		return $parts ? implode( ' — ', $parts ) : __( 'No data', 'boldform-lite' );
	}

	private function render_entry_data( $entry ) {
		$decoded = json_decode( (string) $entry->entry_data_json, true );

		if ( empty( $decoded ) || ! is_array( $decoded ) ) {
			return '<span>' . esc_html__( 'No submission data available.', 'boldform-lite' ) . '</span>';
		}

		$items = array();

		foreach ( $decoded as $field ) {
			$label = isset( $field['label'] ) && '' !== $field['label'] ? (string) $field['label'] : __( 'Field', 'boldform-lite' );
			$value = isset( $field['value'] ) ? $field['value'] : '';

			if ( is_array( $value ) ) {
				$value = implode( ', ', array_map( static function ( $v ) { return sanitize_text_field( (string) ( $v ?? '' ) ); }, $value ) );
			} else {
				$value = sanitize_text_field( (string) ( $value ?? '' ) );
			}

			$is_file = isset( $field['type'] ) && 'file' === $field['type'];

			if ( $is_file && ! empty( $value ) ) {
				$items[] = sprintf(
					'<li><strong>%1$s:</strong> <a href="%2$s" target="_blank">%3$s</a></li>',
					esc_html( (string) $label ),
					esc_url( (string) $value ),
					esc_html( basename( (string) $value ) )
				);
			} else {
				$items[] = sprintf(
					'<li><strong>%1$s:</strong> %2$s</li>',
					esc_html( (string) $label ),
					esc_html( (string) $value )
				);
			}
		}

		if ( empty( $items ) ) {
			return '<span>' . esc_html__( 'No submission data available.', 'boldform-lite' ) . '</span>';
		}

		return '<ul style="margin:0; padding-left:18px;">' . implode( '', $items ) . '</ul>';
	}

	/**
	 * Returns published pages for the redirect dropdown.
	 *
	 * @return array<int, array<string, string>>
	 */
	private function get_pages_for_redirect() {
		$pages  = get_pages( array( 'post_status' => 'publish', 'sort_column' => 'post_title', 'sort_order' => 'ASC' ) );
		$result = array();

		if ( $pages ) {
			foreach ( $pages as $page ) {
				$result[] = array(
					'id'    => (int) $page->ID,
					'title' => (string) $page->post_title,
					'url'   => (string) get_permalink( $page->ID ),
				);
			}
		}

		return $result;
	}

	/**
	 * Returns field library definitions for the builder.
	 *
	 * @return array<string, array<string, string>>
	 */
	private function get_field_library() {
		$library = array(
			'text'     => array(
				'label' => __( 'Text', 'boldform-lite' ),
				'icon'  => 'dashicons-editor-textcolor',
				'group' => 'basic',
			),
			'name'     => array(
				'label' => __( 'Name', 'boldform-lite' ),
				'icon'  => 'dashicons-admin-users',
				'group' => 'basic',
			),
			'email'    => array(
				'label' => __( 'Email', 'boldform-lite' ),
				'icon'  => 'dashicons-email',
				'group' => 'basic',
			),
			'number'   => array(
				'label' => __( 'Number', 'boldform-lite' ),
				'icon'  => 'dashicons-editor-ol',
				'group' => 'basic',
			),
			'textarea' => array(
				'label' => __( 'Textarea', 'boldform-lite' ),
				'icon'  => 'dashicons-media-text',
				'group' => 'basic',
			),
			'date'     => array(
				'label' => __( 'Date Picker', 'boldform-lite' ),
				'icon'  => 'dashicons-calendar-alt',
				'group' => 'basic',
			),
			'time'     => array(
				'label' => __( 'Time Picker', 'boldform-lite' ),
				'icon'  => 'dashicons-clock',
				'group' => 'basic',
			),
			'select'   => array(
				'label' => __( 'Select', 'boldform-lite' ),
				'icon'  => 'dashicons-arrow-down-alt2',
				'group' => 'basic',
			),
			'multiselect' => array(
				'label' => __( 'Multi Select', 'boldform-lite' ),
				'icon'  => 'dashicons-list-view',
				'group' => 'basic',
			),
			'checkbox' => array(
				'label' => __( 'Checkbox', 'boldform-lite' ),
				'icon'  => 'dashicons-yes-alt',
				'group' => 'basic',
			),
			'radio'    => array(
				'label' => __( 'Radio', 'boldform-lite' ),
				'icon'  => 'dashicons-marker',
				'group' => 'basic',
			),
			'tel'      => array(
				'label' => __( 'Phone', 'boldform-lite' ),
				'icon'  => 'dashicons-phone',
				'group' => 'basic',
			),
			'url'      => array(
				'label' => __( 'URL', 'boldform-lite' ),
				'icon'  => 'dashicons-admin-links',
				'group' => 'basic',
			),
			'numeric'  => array(
				'label' => __( 'Numeric', 'boldform-lite' ),
				'icon'  => 'dashicons-calculator',
				'group' => 'basic',
			),
			'input_mask' => array(
				'label' => __( 'Input Mask', 'boldform-lite' ),
				'icon'  => 'dashicons-editor-customchar',
				'group' => 'basic',
			),
			'html_editor' => array(
				'label' => __( 'HTML Editor', 'boldform-lite' ),
				'icon'  => 'dashicons-editor-code',
				'group' => 'basic',
			),
			'paragraph' => array(
				'label' => __( 'Paragraph', 'boldform-lite' ),
				'icon'  => 'dashicons-editor-paragraph',
				'group' => 'basic',
			),
			'address'  => array(
				'label' => __( 'Address', 'boldform-lite' ),
				'icon'  => 'dashicons-location',
				'group' => 'basic',
			),
			'country'  => array(
				'label' => __( 'Country', 'boldform-lite' ),
				'icon'  => 'dashicons-admin-site-alt3',
				'group' => 'basic',
			),
			'star_rating' => array(
				'label' => __( 'Star Rating', 'boldform-lite' ),
				'icon'  => 'dashicons-star-filled',
				'group' => 'basic',
			),
			'slider_range' => array(
				'label' => __( 'Slider Range', 'boldform-lite' ),
				'icon'  => 'dashicons-leftright',
				'group' => 'basic',
			),
			'captcha'  => array(
				'label' => __( 'Captcha', 'boldform-lite' ),
				'icon'  => 'dashicons-shield',
				'group' => 'advanced',
			),
			'section_break' => array(
				'label' => __( 'Section Break', 'boldform-lite' ),
				'icon'  => 'dashicons-minus',
				'group' => 'advanced',
			),
			'terms_conditions' => array(
				'label' => __( 'Terms & Conditions', 'boldform-lite' ),
				'icon'  => 'dashicons-media-document',
				'group' => 'advanced',
			),
			'file' => array(
				'label' => __( 'File Upload', 'boldform-lite' ),
				'icon'  => 'dashicons-upload',
				'group' => 'advanced',
			),
			'submit' => array(
				'label' => __( 'Submit Button', 'boldform-lite' ),
				'icon'  => 'dashicons-button',
				'group' => 'advanced',
			),
		);

		/**
		 * Filter the field library items available in the builder sidebar.
		 *
		 * Pro can add new field types here (signature, payment, etc.).
		 * Each entry: 'type_key' => array( 'label' => '', 'icon' => 'dashicons-...', 'group' => 'basic|advanced|pro' )
		 *
		 * @param array<string, array<string, string>> $library Field library items.
		 */
		return apply_filters( 'boldform_field_library', $library );
	}

	/**
	 * Renders the Reports page.
	 *
	 * @return void
	 */
	public function render_reports_page() {
		global $wpdb;

		$entries_table = esc_sql( $this->plugin->get_entries_table_name() );
		$forms_table   = esc_sql( $this->plugin->get_forms_table_name() );

		// Overview stats.
		$total_forms   = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$forms_table}` WHERE status != 'trash'" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$total_entries = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$entries_table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$unread_count  = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$entries_table}` WHERE status = %s", 'unread' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$starred_count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$entries_table}` WHERE status = %s", 'starred' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		// Today's entries.
		$today_count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$entries_table}` WHERE created_at >= %s", wp_date( 'Y-m-d' ) . ' 00:00:00' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		// This week entries.
		$week_start  = wp_date( 'Y-m-d', strtotime( 'monday this week' ) );
		$week_count  = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$entries_table}` WHERE created_at >= %s", $week_start . ' 00:00:00' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		// Entries per form.
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names sanitized via esc_sql() above.
		$per_form = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			"SELECT f.id, f.title, COUNT(e.id) AS total,
				SUM(CASE WHEN e.status = 'unread' THEN 1 ELSE 0 END) AS unread,
				SUM(CASE WHEN e.status = 'read' THEN 1 ELSE 0 END) AS is_read,
				SUM(CASE WHEN e.status = 'starred' THEN 1 ELSE 0 END) AS starred
			FROM `{$forms_table}` f
			LEFT JOIN `{$entries_table}` e ON e.form_id = f.id
			WHERE f.status != 'trash'
			GROUP BY f.id
			ORDER BY total DESC"
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Daily submissions for last 30 days.
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $entries_table sanitized via esc_sql() above.
		$daily_data = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT DATE(created_at) AS entry_date, COUNT(*) AS total
				FROM `{$entries_table}`
				WHERE created_at >= %s
				GROUP BY DATE(created_at)
				ORDER BY entry_date ASC",
				wp_date( 'Y-m-d', strtotime( '-30 days' ) ) . ' 00:00:00'
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Build 30-day labels and values arrays.
		$daily_map = array();
		foreach ( $daily_data as $row ) {
			$daily_map[ $row->entry_date ] = (int) $row->total;
		}

		$chart_labels = array();
		$chart_values = array();
		for ( $i = 29; $i >= 0; $i-- ) {
			$date           = wp_date( 'Y-m-d', strtotime( "-{$i} days" ) );
			$chart_labels[] = wp_date( 'M j', strtotime( $date ) );
			$chart_values[] = isset( $daily_map[ $date ] ) ? $daily_map[ $date ] : 0;
		}

		// Recent entries (last 10).
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names sanitized via esc_sql() above.
		$recent_entries = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			"SELECT e.id, e.form_id, e.entry_data_json, e.status, e.created_at, f.title AS form_title
			FROM `{$entries_table}` e
			LEFT JOIN `{$forms_table}` f ON f.id = e.form_id
			ORDER BY e.created_at DESC
			LIMIT 10"
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Max entries for progress bars in "Entries by Form".
		$max_form_entries = 1;
		foreach ( $per_form as $row ) {
			if ( (int) $row->total > $max_form_entries ) {
				$max_form_entries = (int) $row->total;
			}
		}

		$this->render_admin_topbar( 'boldform-lite-reports' );
		?>
		<div class="wrap boldform-reports-wrap">
			<div class="boldform-page-header">
				<h1><?php esc_html_e( 'Reports', 'boldform-lite' ); ?></h1>
				<span class="boldform-page-header__badge"><?php esc_html_e( 'Overview', 'boldform-lite' ); ?></span>
			</div>

			<!-- Overview Stat Cards -->
			<div class="boldform-reports-stats">
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--forms">
						<?php boldform_lite_brand_icon( array( 'class' => 'dashicons boldform-brand-icon' ) ); ?>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $total_forms ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'Total Forms', 'boldform-lite' ); ?></span>
					</div>
				</div>
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--entries">
						<span class="dashicons dashicons-email-alt"></span>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $total_entries ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'Total Entries', 'boldform-lite' ); ?></span>
					</div>
				</div>
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--unread">
						<span class="dashicons dashicons-email"></span>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $unread_count ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'Unread', 'boldform-lite' ); ?></span>
					</div>
				</div>
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--starred">
						<span class="dashicons dashicons-star-filled"></span>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $starred_count ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'Starred', 'boldform-lite' ); ?></span>
					</div>
				</div>
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--today">
						<span class="dashicons dashicons-calendar-alt"></span>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $today_count ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'Today', 'boldform-lite' ); ?></span>
					</div>
				</div>
				<div class="boldform-stat-card">
					<div class="boldform-stat-card__icon boldform-stat-card__icon--week">
						<span class="dashicons dashicons-calendar"></span>
					</div>
					<div class="boldform-stat-card__body">
						<span class="boldform-stat-card__value"><?php echo absint( $week_count ); ?></span>
						<span class="boldform-stat-card__label"><?php esc_html_e( 'This Week', 'boldform-lite' ); ?></span>
					</div>
				</div>
			</div>

			<?php
			/**
			 * Fires after the stat cards row on the Reports page.
			 * Pro modules can inject additional stat cards here.
			 *
			 * @param array<string, mixed> $stats {
			 *     @type int $total_forms   Total active forms.
			 *     @type int $total_entries Total submissions.
			 *     @type int $unread_count  Unread entries.
			 *     @type int $starred_count Starred entries.
			 *     @type int $today_count   Entries today.
			 *     @type int $week_count    Entries this week.
			 * }
			 */
			do_action(
				'boldform_reports_after_stats',
				array(
					'total_forms'   => $total_forms,
					'total_entries' => $total_entries,
					'unread_count'  => $unread_count,
					'starred_count' => $starred_count,
					'today_count'   => $today_count,
					'week_count'    => $week_count,
				)
			);
			?>

			<!-- Submissions Chart (FREE) -->
			<div class="boldform-reports-row">
				<div class="boldform-reports-chart-card">
					<div class="boldform-reports-card-header">
						<h2><span class="dashicons dashicons-chart-area"></span> <?php esc_html_e( 'Submissions', 'boldform-lite' ); ?></h2>
						<span class="boldform-reports-card-header__sub"><?php esc_html_e( 'Last 30 Days', 'boldform-lite' ); ?></span>
					</div>
					<canvas id="boldform-submissions-chart" height="300"></canvas>
				</div>
			</div>

			<?php
			/**
			 * Fires after the submissions chart row on the Reports page.
			 * Pro modules can inject additional chart rows here (e.g. views vs submissions).
			 *
			 * @param array<string, mixed> $chart_data {
			 *     @type string[] $chart_labels 30-day date labels (e.g. "Apr 1").
			 *     @type int[]    $chart_values 30-day submission counts.
			 * }
			 */
			do_action(
				'boldform_reports_after_chart',
				array(
					'chart_labels' => $chart_labels,
					'chart_values' => $chart_values,
				)
			);
			?>

			<!-- Two-column: Entries by Form + Recent Entries -->
			<div class="boldform-reports-row boldform-reports-row--two-col">
				<!-- Entries by Form -->
				<div class="boldform-reports-table-card boldform-reports-table-card--compact">
					<div class="boldform-reports-card-header">
						<h2><span class="dashicons dashicons-list-view"></span> <?php esc_html_e( 'Entries by Form', 'boldform-lite' ); ?></h2>
					</div>
					<?php if ( ! empty( $per_form ) ) : ?>
						<div class="boldform-reports-paginated" id="boldform-forms-paginated" data-per-page="5">
							<table class="boldform-reports-table">
								<thead>
									<tr>
										<th><?php esc_html_e( 'Form', 'boldform-lite' ); ?></th>
										<th class="boldform-col-center"><?php esc_html_e( 'Entries', 'boldform-lite' ); ?></th>
										<th><?php esc_html_e( 'Breakdown', 'boldform-lite' ); ?></th>
									</tr>
								</thead>
								<tbody>
									<?php foreach ( $per_form as $row ) : ?>
										<?php
										$total   = max( 1, (int) $row->total );
										$bar_pct = round( ( $total / $max_form_entries ) * 100 );
										?>
										<tr>
											<td>
												<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&form_id=' . absint( $row->id ) ) ); ?>">
													<?php echo esc_html( $row->title ? $row->title : '#' . $row->id ); ?>
												</a>
											</td>
											<td class="boldform-col-center">
												<span class="boldform-reports-count-badge"><?php echo absint( $row->total ); ?></span>
											</td>
											<td>
												<div class="boldform-reports-bar-wrap">
													<div class="boldform-reports-bar" style="width:<?php echo absint( $bar_pct ); ?>%;">
														<span class="boldform-reports-bar__segment boldform-reports-bar__segment--unread" style="width:<?php echo $total ? absint( round( ( (int) $row->unread / $total ) * 100 ) ) : 0; ?>%;" title="<?php /* translators: %d: unread count */ printf( esc_attr__( 'Unread: %d', 'boldform-lite' ), absint( $row->unread ) ); ?>"></span>
														<span class="boldform-reports-bar__segment boldform-reports-bar__segment--read" style="width:<?php echo $total ? absint( round( ( (int) $row->is_read / $total ) * 100 ) ) : 0; ?>%;" title="<?php /* translators: %d: read count */ printf( esc_attr__( 'Read: %d', 'boldform-lite' ), absint( $row->is_read ) ); ?>"></span>
														<span class="boldform-reports-bar__segment boldform-reports-bar__segment--starred" style="width:<?php echo $total ? absint( round( ( (int) $row->starred / $total ) * 100 ) ) : 0; ?>%;" title="<?php /* translators: %d: starred count */ printf( esc_attr__( 'Starred: %d', 'boldform-lite' ), absint( $row->starred ) ); ?>"></span>
													</div>
												</div>
											</td>
										</tr>
									<?php endforeach; ?>
								</tbody>
							</table>
							<div class="boldform-reports-card-footer">
								<div class="boldform-reports-bar-legend">
									<span class="boldform-reports-bar-legend__item"><span class="boldform-reports-bar-legend__dot boldform-reports-bar-legend__dot--unread"></span> <?php esc_html_e( 'Unread', 'boldform-lite' ); ?></span>
									<span class="boldform-reports-bar-legend__item"><span class="boldform-reports-bar-legend__dot boldform-reports-bar-legend__dot--read"></span> <?php esc_html_e( 'Read', 'boldform-lite' ); ?></span>
									<span class="boldform-reports-bar-legend__item"><span class="boldform-reports-bar-legend__dot boldform-reports-bar-legend__dot--starred"></span> <?php esc_html_e( 'Starred', 'boldform-lite' ); ?></span>
								</div>
								<div class="boldform-reports-pager"></div>
							</div>
						</div>
					<?php else : ?>
						<div class="boldform-reports-empty-state">
							<span class="dashicons dashicons-chart-pie"></span>
							<p><?php esc_html_e( 'No forms found. Create your first form to see reports.', 'boldform-lite' ); ?></p>
						</div>
					<?php endif; ?>
				</div>

				<!-- Recent Entries -->
				<div class="boldform-reports-table-card boldform-reports-table-card--compact">
					<div class="boldform-reports-card-header">
						<h2><span class="dashicons dashicons-clock"></span> <?php esc_html_e( 'Recent Entries', 'boldform-lite' ); ?></h2>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries' ) ); ?>" class="boldform-reports-card-header__link"><?php esc_html_e( 'View All', 'boldform-lite' ); ?> &rarr;</a>
					</div>
					<?php if ( ! empty( $recent_entries ) ) : ?>
						<div class="boldform-reports-paginated" id="boldform-entries-paginated" data-per-page="5">
							<div class="boldform-reports-activity">
								<?php foreach ( $recent_entries as $entry ) : ?>
									<?php
									$preview = '';
									$decoded = json_decode( (string) $entry->entry_data_json, true );
									if ( is_array( $decoded ) && ! empty( $decoded ) ) {
										$first = reset( $decoded );
										$val   = isset( $first['value'] ) ? $first['value'] : '';
										if ( is_array( $val ) ) {
											$val = implode( ', ', $val );
										}
										$preview = wp_trim_words( (string) $val, 6 );
									}
									?>
									<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite-entries&entry_id=' . absint( $entry->id ) ) ); ?>" class="boldform-reports-activity__item">
										<span class="boldform-reports-activity__dot boldform-reports-activity__dot--<?php echo esc_attr( $entry->status ); ?>"></span>
										<div class="boldform-reports-activity__body">
											<span class="boldform-reports-activity__text">
												<?php echo esc_html( $preview ? $preview : __( 'Entry', 'boldform-lite' ) ); ?>
												<span class="boldform-reports-activity__form"><?php echo esc_html( $entry->form_title ? $entry->form_title : '#' . $entry->form_id ); ?></span>
											</span>
											<span class="boldform-reports-activity__meta">
												<span class="boldform-status-badge boldform-status--<?php echo esc_attr( $entry->status ); ?>"><?php echo esc_html( ucfirst( (string) $entry->status ) ); ?></span>
												<span class="boldform-reports-activity__date"><?php echo esc_html( human_time_diff( strtotime( (string) $entry->created_at ), current_time( 'timestamp' ) ) ); ?> <?php esc_html_e( 'ago', 'boldform-lite' ); ?></span>
											</span>
										</div>
									</a>
								<?php endforeach; ?>
							</div>
							<div class="boldform-reports-card-footer">
								<span class="boldform-reports-pager-info"></span>
								<div class="boldform-reports-pager"></div>
							</div>
						</div>
					<?php else : ?>
						<div class="boldform-reports-empty-state">
							<span class="dashicons dashicons-format-chat"></span>
							<p><?php esc_html_e( 'No entries yet. Entries will appear here once forms are submitted.', 'boldform-lite' ); ?></p>
						</div>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php
		// Pass chart data to the already-enqueued admin handle, then add the chart+pagination script.
		wp_localize_script(
			'boldform-lite-admin',
			'boldformReports',
			array(
				'chartLabels'  => $chart_labels,
				'chartValues'  => $chart_values,
				'entriesLabel' => __( 'entries', 'boldform-lite' ),
			)
		);
		wp_add_inline_script(
			'boldform-lite-admin',
			'(function(){
				var labels=boldformReports.chartLabels;
				var values=boldformReports.chartValues;
				var canvas=document.getElementById("boldform-submissions-chart");
				if(canvas){
					var ctx=canvas.getContext("2d");
					var dpr=window.devicePixelRatio||1;
					var rect=canvas.parentElement.getBoundingClientRect();
					var w=rect.width;
					var h=300;
					canvas.width=w*dpr;canvas.height=h*dpr;
					canvas.style.width=w+"px";canvas.style.height=h+"px";
					ctx.scale(dpr,dpr);
					var padL=50,padR=20,padT=20,padB=50;
					var chartW=w-padL-padR;
					var chartH=h-padT-padB;
					var maxVal=Math.max.apply(null,values)||1;
					var step=Math.ceil(maxVal/5)||1;
					maxVal=step*5;
					ctx.strokeStyle="#e2e8f0";ctx.lineWidth=1;
					ctx.fillStyle="#94a3b8";
					ctx.font="11px -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif";
					ctx.textAlign="right";ctx.textBaseline="middle";
					for(var i=0;i<=5;i++){
						var y=Math.round(padT+chartH-(chartH*i/5))+0.5;
						ctx.beginPath();ctx.setLineDash(i===0?[]:[4,4]);
						ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();
						ctx.fillText(String(step*i),padL-10,y);
					}
					ctx.setLineDash([]);
					var barW=Math.max(6,Math.min(20,(chartW/labels.length)-6));
					for(var j=0;j<values.length;j++){
						var barH=maxVal>0?(values[j]/maxVal)*chartH:0;
						if(barH<0)barH=0;
						var x=padL+(chartW/labels.length)*j+((chartW/labels.length)-barW)/2;
						var barY=padT+chartH-barH;
						var gradient=ctx.createLinearGradient(x,barY,x,padT+chartH);
						gradient.addColorStop(0,"#3b82f6");gradient.addColorStop(1,"#93c5fd");
						ctx.fillStyle=gradient;
						var r=Math.min(barW/2,4);
						if(barH>r){
							ctx.beginPath();ctx.moveTo(x+r,barY);ctx.lineTo(x+barW-r,barY);
							ctx.quadraticCurveTo(x+barW,barY,x+barW,barY+r);
							ctx.lineTo(x+barW,padT+chartH);ctx.lineTo(x,padT+chartH);
							ctx.lineTo(x,barY+r);ctx.quadraticCurveTo(x,barY,x+r,barY);
							ctx.fill();
						}else if(barH>0){ctx.fillRect(x,barY,barW,barH);}
					}
					ctx.fillStyle="#94a3b8";
					ctx.font="10px -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif";
					ctx.textAlign="center";ctx.textBaseline="top";
					var labelStep=labels.length<=15?1:Math.ceil(labels.length/10);
					for(var k=0;k<labels.length;k++){
						if(k%labelStep===0){
							var lx=padL+(chartW/labels.length)*k+(chartW/labels.length)/2;
							ctx.save();ctx.translate(lx,padT+chartH+10);ctx.rotate(-0.45);
							ctx.fillText(labels[k],0,0);ctx.restore();
						}
					}
					var tooltipEl=document.createElement("div");
					tooltipEl.className="boldform-chart-tooltip";
					canvas.parentElement.style.position="relative";
					canvas.parentElement.appendChild(tooltipEl);
					canvas.addEventListener("mousemove",function(e){
						var cRect=canvas.getBoundingClientRect();
						var mx=e.clientX-cRect.left;
						var slotW=chartW/labels.length;
						var idx=Math.floor((mx-padL)/slotW);
						if(idx>=0&&idx<labels.length){
							tooltipEl.innerHTML="<strong>"+labels[idx]+"</strong><br>"+values[idx]+" "+boldformReports.entriesLabel;
							tooltipEl.style.display="block";
							tooltipEl.style.left=(padL+slotW*idx+slotW/2)+"px";
							tooltipEl.style.top="10px";
						}else{tooltipEl.style.display="none";}
					});
					canvas.addEventListener("mouseleave",function(){tooltipEl.style.display="none";});
				}
				document.querySelectorAll(".boldform-reports-paginated").forEach(function(wrap){
					var perPage=parseInt(wrap.getAttribute("data-per-page"),10)||5;
					var table=wrap.querySelector("table");
					var activity=wrap.querySelector(".boldform-reports-activity");
					var items;
					if(table){items=Array.prototype.slice.call(table.querySelectorAll("tbody tr"));}
					else if(activity){items=Array.prototype.slice.call(activity.children);}
					else{return;}
					var totalPages=Math.ceil(items.length/perPage);
					if(totalPages<=1)return;
					var currentPage=1;
					var pagerEl=wrap.querySelector(".boldform-reports-pager");
					var infoEl=wrap.querySelector(".boldform-reports-pager-info");
					function showPage(page){
						currentPage=page;
						var start=(page-1)*perPage,end=start+perPage;
						items.forEach(function(item,idx){item.style.display=(idx>=start&&idx<end)?"":"none";});
						renderPager();
						if(infoEl)infoEl.textContent=page+" / "+totalPages;
					}
					function renderPager(){
						if(!pagerEl)return;
						pagerEl.innerHTML="";
						var prev=document.createElement("button");prev.type="button";
						prev.className="boldform-pager-btn";prev.innerHTML="&lsaquo;";
						prev.disabled=currentPage===1;
						prev.addEventListener("click",function(){showPage(currentPage-1);});
						pagerEl.appendChild(prev);
						for(var p=1;p<=totalPages;p++){
							var btn=document.createElement("button");btn.type="button";
							btn.className="boldform-pager-btn"+(p===currentPage?" is-active":"");
							btn.textContent=p;
							btn.addEventListener("click",(function(pg){return function(){showPage(pg);};})(p));
							pagerEl.appendChild(btn);
						}
						var next=document.createElement("button");next.type="button";
						next.className="boldform-pager-btn";next.innerHTML="&rsaquo;";
						next.disabled=currentPage===totalPages;
						next.addEventListener("click",function(){showPage(currentPage+1);});
						pagerEl.appendChild(next);
					}
					showPage(1);
				});
			})();'
		);
	}
}
