<?php
/**
 * Admin builder template.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$boldform_lite_field_groups = array(
	'basic'    => __( 'Basic Fields', 'boldform-lite' ),
	'advanced' => __( 'Advanced Fields', 'boldform-lite' ),
);

/**
 * Filter the field group headings shown in the builder sidebar.
 *
 * Pro can add new groups (e.g. 'pro' => 'Pro Fields') so its field types
 * appear under a dedicated section.
 *
 * @param array<string, string> $groups Group key => Label pairs.
 */
$boldform_lite_field_groups = apply_filters( 'boldform_builder_field_groups', $boldform_lite_field_groups );
?>
<?php $boldform_lite_is_new_form = ! $form_data['id']; ?>
<div class="wrap boldform-builder-page" id="boldform-builder-root">

	<?php
	// Notice-placement marker — WordPress relocates admin notices to right after the first
	// .wp-header-end (wp-admin/js/common.js). On the NEW-form setup screen we want the dark
	// header bar on top and the notice BELOW it, so the marker is emitted inside the setup
	// body further down. The existing-form editor keeps it at the very top.
	?>
	<?php if ( ! $boldform_lite_is_new_form ) : ?>
		<hr class="wp-header-end">
	<?php endif; ?>

	<!-- Setup screen for new forms -->
	<div class="boldform-setup-screen" id="boldform-setup-screen"<?php echo ! $boldform_lite_is_new_form ? ' hidden' : ''; ?>>
		<?php
		// The Add-New landing shares the exact BoldForm topbar used on every other admin
		// screen (brand + section nav + Upgrade), so the create flow stays visually
		// consistent and fully navigable instead of showing a near-empty mini header.
		// 'Forms' is the active section (Add New lives under it). The deep field-editing
		// canvas below keeps its own focused builder toolbar — matching how top form
		// plugins strip section nav only once you are actually editing fields.
		$this->render_admin_topbar( 'boldform-lite' );
		?>

		<div class="boldform-setup-body">
			<?php // New-form marker: relocates the notice here — below the dark header bar, above "Create a New Form". ?>
			<?php if ( $boldform_lite_is_new_form ) : ?>
				<hr class="wp-header-end">
			<?php endif; ?>
			<div class="boldform-setup-intro">
				<h1><?php esc_html_e( 'Create a New Form', 'boldform-lite' ); ?></h1>
				<p><?php esc_html_e( 'Start from scratch or pick a pre-built template.', 'boldform-lite' ); ?></p>
			</div>
			<div class="boldform-setup-choices">
				<button type="button" class="boldform-setup-card" id="boldform-setup-blank">
					<span class="boldform-setup-card__icon boldform-setup-card__icon--blank">
						<span class="dashicons dashicons-plus-alt2"></span>
					</span>
					<strong><?php esc_html_e( 'Blank Form', 'boldform-lite' ); ?></strong>
					<span><?php esc_html_e( 'Start with an empty canvas and build your form from scratch.', 'boldform-lite' ); ?></span>
				</button>
				<button type="button" class="boldform-setup-card" id="boldform-setup-template">
					<span class="boldform-setup-card__icon boldform-setup-card__icon--template">
						<span class="dashicons dashicons-layout"></span>
					</span>
					<strong><?php esc_html_e( 'Use a Template', 'boldform-lite' ); ?></strong>
					<span><?php esc_html_e( 'Browse ready-made templates, preview them, and import in one click.', 'boldform-lite' ); ?></span>
				</button>
			</div>
		</div>
	</div>

	<div class="boldform-builder-main" id="boldform-builder-main"<?php echo $boldform_lite_is_new_form ? ' hidden' : ''; ?>>
	<div class="boldform-builder-topbar">
		<div class="boldform-builder-title-wrap">
			<div class="boldform-builder-title">
				<span class="boldform-builder-title__badge"><?php boldform_lite_brand_icon( array( 'size' => 22 ) ); ?></span>
				<input
					type="text"
					id="boldform-form-title"
					value="<?php echo esc_attr( $form_data['title'] ); ?>"
					placeholder="<?php esc_attr_e( 'Untitled Form', 'boldform-lite' ); ?>"
				/>
			</div>

			<div class="boldform-editor-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Editor sections', 'boldform-lite' ); ?>">
				<button type="button" class="boldform-editor-tab is-active" id="boldform-editor-tab-builder" data-editor-tab="builder" role="tab" aria-selected="true">
					<?php esc_html_e( 'Builder', 'boldform-lite' ); ?>
				</button>
				<button type="button" class="boldform-editor-tab" id="boldform-editor-tab-style" data-editor-tab="style" role="tab" aria-selected="false">
					<?php esc_html_e( 'Style', 'boldform-lite' ); ?>
				</button>
				<button type="button" class="boldform-editor-tab" id="boldform-editor-tab-settings" data-editor-tab="settings" role="tab" aria-selected="false">
					<?php esc_html_e( 'Settings', 'boldform-lite' ); ?>
				</button>
			</div>
		</div>

		<div class="boldform-builder-actions">
			<button type="button" class="boldform-builder-shortcode<?php echo $form_data['id'] > 0 ? ' is-visible' : ''; ?>" id="boldform-builder-shortcode"<?php echo $form_data['id'] > 0 ? '' : ' hidden'; ?>>
				<span class="boldform-builder-shortcode__label"><?php esc_html_e( 'Shortcode', 'boldform-lite' ); ?></span>
				<code class="boldform-builder-shortcode__code"><span class="boldform-builder-shortcode__text" id="boldform-builder-shortcode-code">[boldform id="<?php echo esc_html( (string) $form_data['id'] ); ?>"]</span><span class="dashicons dashicons-admin-page boldform-builder-shortcode__copy" aria-hidden="true"></span></code>
			</button>
			<a href="<?php echo $form_data['id'] > 0 ? esc_url( admin_url( 'admin.php?page=boldform-lite-preview&form_id=' . absint( $form_data['id'] ) ) ) : '#'; ?>" class="button boldform-preview-btn" id="boldform-preview-form"<?php echo $form_data['id'] > 0 ? '' : ' style="display:none"'; ?>>
				<span class="dashicons dashicons-visibility"></span>
				<?php esc_html_e( 'Preview', 'boldform-lite' ); ?>
			</a>
			<button type="button" class="button button-primary" id="boldform-save-form">
				<?php esc_html_e( 'Save Form', 'boldform-lite' ); ?>
			</button>
			<span class="boldform-builder-status" id="boldform-builder-status" aria-live="polite"></span>
		</div>
	</div>

	<div class="boldform-editor-view is-active" id="boldform-editor-view-builder" data-editor-view="builder">
	<div class="boldform-builder-shell">
		<aside class="boldform-builder-sidebar boldform-builder-sidebar-main">
			<div class="boldform-panel boldform-sidebar-panel">
				<div class="boldform-sidebar-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Builder panels', 'boldform-lite' ); ?>">
					<button type="button" class="boldform-sidebar-tab is-active" id="boldform-tab-library" data-tab="library" role="tab" aria-selected="true">
						<?php esc_html_e( 'Field Library', 'boldform-lite' ); ?>
					</button>
					<button type="button" class="boldform-sidebar-tab" id="boldform-tab-settings" data-tab="settings" role="tab" aria-selected="false">
						<?php esc_html_e( 'Field Settings', 'boldform-lite' ); ?>
					</button>
				</div>

				<div class="boldform-sidebar-panel__content">
					<section class="boldform-sidebar-view is-active" id="boldform-sidebar-library" data-tab-panel="library" role="tabpanel" aria-labelledby="boldform-tab-library">
						<div class="boldform-panel-head">
							<h2><?php esc_html_e( 'Field Library', 'boldform-lite' ); ?></h2>
							<p><?php esc_html_e( 'Drag fields into a column or click to insert into the selected column.', 'boldform-lite' ); ?></p>
						</div>

						<div class="boldform-field-search">
								<input type="text" id="boldform-field-search" placeholder="<?php esc_attr_e( 'Search fields...', 'boldform-lite' ); ?>" autocomplete="off">
							</div>

							<div class="boldform-field-library" id="boldform-field-library">
							<?php foreach ( $boldform_lite_field_groups as $boldform_lite_group_key => $boldform_lite_group_label ) : ?>
								<div class="boldform-library-group">
									<h3><?php echo esc_html( $boldform_lite_group_label ); ?></h3>
									<div class="boldform-library-grid">
										<?php
										$boldform_lite_all_fields = $this->get_field_library();

										/**
										 * Filter the complete field library used in the builder sidebar.
										 *
										 * Additional field types can be added via this filter.
										 *
										 * @param array<string, array<string, string>> $fields All field definitions.
										 * @param string                               $group  Current group being rendered.
										 */
										$boldform_lite_all_fields = apply_filters( 'boldform_builder_fields', $boldform_lite_all_fields, $boldform_lite_group_key );

										foreach ( $boldform_lite_all_fields as $boldform_lite_field_type => $boldform_lite_field_data ) :
											if ( ! isset( $boldform_lite_field_data['group'] ) || $boldform_lite_group_key !== $boldform_lite_field_data['group'] ) :
												continue;
											endif;
										?>
											<button
												type="button"
												class="boldform-library-item"
												data-field-type="<?php echo esc_attr( $boldform_lite_field_type ); ?>"
												draggable="true"
											>
												<span class="dashicons <?php echo esc_attr( $boldform_lite_field_data['icon'] ); ?>"></span>
												<span><?php echo esc_html( $boldform_lite_field_data['label'] ); ?></span>
											</button>
										<?php endforeach; ?>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					</section>

					<section class="boldform-sidebar-view" id="boldform-sidebar-settings" data-tab-panel="settings" role="tabpanel" aria-labelledby="boldform-tab-settings" hidden>
						<div class="boldform-panel-head">
							<h2><?php esc_html_e( 'Field Settings', 'boldform-lite' ); ?></h2>
							<p><?php esc_html_e( 'Update the selected field properties.', 'boldform-lite' ); ?></p>
						</div>

						<div class="boldform-settings-empty" id="boldform-settings-empty">
							<?php esc_html_e( 'Select a field to edit its settings.', 'boldform-lite' ); ?>
						</div>

						<div class="boldform-settings-panel" id="boldform-settings-panel" hidden></div>
					</section>

				</div>
			</div>
		</aside>

		<main class="boldform-builder-canvas-wrap">
			<div class="boldform-panel boldform-canvas-panel">
				<?php if ( ! $boldform_lite_is_new_form ) : ?>
					<div class="boldform-canvas-loading" id="boldform-canvas-loading">
						<span class="boldform-canvas-loading__spinner" aria-hidden="true"></span>
						<span class="screen-reader-text"><?php esc_html_e( 'Loading form…', 'boldform-lite' ); ?></span>
					</div>
				<?php endif; ?>
				<div class="boldform-panel-head boldform-panel-head--canvas">
					<div>
						<h2><?php esc_html_e( 'Form Canvas', 'boldform-lite' ); ?></h2>
						<p><?php esc_html_e( 'Build layouts with rows and columns, then drop fields into each column.', 'boldform-lite' ); ?></p>
					</div>
				</div>

				<div class="boldform-canvas-empty" id="boldform-canvas-empty">
					<div class="boldform-empty-state">
						<span class="boldform-empty-state__icon dashicons dashicons-layout" aria-hidden="true"></span>
						<h3><?php esc_html_e( 'Start building your form', 'boldform-lite' ); ?></h3>
						<p><?php esc_html_e( 'Start from a blank canvas or open the built-in template gallery.', 'boldform-lite' ); ?></p>
						<div class="boldform-start-grid">
							<button type="button" class="boldform-start-card" data-template="blank">
								<span class="boldform-start-card__icon"><span class="dashicons dashicons-welcome-add-page" aria-hidden="true"></span></span>
								<span class="boldform-start-card__body">
									<strong><?php esc_html_e( 'Blank Form', 'boldform-lite' ); ?></strong>
									<span><?php esc_html_e( 'Choose your layout and build the form from scratch.', 'boldform-lite' ); ?></span>
								</span>
								<span class="boldform-start-card__arrow dashicons dashicons-arrow-right-alt2" aria-hidden="true"></span>
							</button>
							<button type="button" class="boldform-start-card" id="boldform-open-template-modal">
								<span class="boldform-start-card__icon"><span class="dashicons dashicons-layout" aria-hidden="true"></span></span>
								<span class="boldform-start-card__body">
									<strong><?php esc_html_e( 'Use a Template', 'boldform-lite' ); ?></strong>
									<span><?php esc_html_e( 'Browse starter templates, preview them, and import in one click.', 'boldform-lite' ); ?></span>
								</span>
								<span class="boldform-start-card__arrow dashicons dashicons-arrow-right-alt2" aria-hidden="true"></span>
							</button>
						</div>
					</div>
				</div>

				<div class="boldform-canvas" id="boldform-canvas">
					<div class="boldform-canvas-rows" id="boldform-canvas-rows"></div>
				</div>
			</div>
		</main>
	</div>
	</div>

	<section class="boldform-editor-view" id="boldform-editor-view-style" data-editor-view="style" hidden>
		<div class="boldform-style-shell">
			<div class="boldform-panel boldform-style-controls">
				<div class="boldform-panel-head">
					<h2><?php esc_html_e( 'Form Styling', 'boldform-lite' ); ?></h2>
					<p><?php esc_html_e( 'Customize field, label, button, and multi-step styles. Changes preview instantly.', 'boldform-lite' ); ?></p>
				</div>
				<div class="boldform-settings-panel" id="boldform-form-styling-panel"></div>
			</div>
			<aside class="boldform-panel boldform-style-preview" aria-label="<?php esc_attr_e( 'Form preview', 'boldform-lite' ); ?>">
				<div class="boldform-panel-head boldform-style-preview__head">
					<div>
						<h2><?php esc_html_e( 'Live Preview', 'boldform-lite' ); ?></h2>
						<p><?php esc_html_e( 'See your styling applied to the form in real time.', 'boldform-lite' ); ?></p>
					</div>
					<div class="boldform-device-toggle" role="group" aria-label="<?php esc_attr_e( 'Preview device', 'boldform-lite' ); ?>">
						<button type="button" class="boldform-device-btn is-active" data-device="desktop" aria-pressed="true" title="<?php esc_attr_e( 'Desktop', 'boldform-lite' ); ?>"><span class="dashicons dashicons-desktop" aria-hidden="true"></span></button>
						<button type="button" class="boldform-device-btn" data-device="tablet" aria-pressed="false" title="<?php esc_attr_e( 'Tablet', 'boldform-lite' ); ?>"><span class="dashicons dashicons-tablet" aria-hidden="true"></span></button>
						<button type="button" class="boldform-device-btn" data-device="mobile" aria-pressed="false" title="<?php esc_attr_e( 'Mobile', 'boldform-lite' ); ?>"><span class="dashicons dashicons-smartphone" aria-hidden="true"></span></button>
					</div>
				</div>
				<div class="boldform-canvas boldform-style-preview-canvas" id="boldform-style-preview-canvas"></div>
			</aside>
		</div>
	</section>

	<section class="boldform-editor-view" id="boldform-editor-view-settings" data-editor-view="settings" hidden>
		<div class="boldform-panel boldform-global-settings-panel">
			<div class="boldform-panel-head">
				<h2><?php esc_html_e( 'Form Settings', 'boldform-lite' ); ?></h2>
				<p><?php esc_html_e( 'Configure submission behavior, redirect rules, and email notifications for this form.', 'boldform-lite' ); ?></p>
			</div>
			<div class="boldform-settings-panel" id="boldform-form-settings-panel"></div>
		</div>
	</section>

	</div><!-- /.boldform-builder-main -->

	<div class="boldform-modal" id="boldform-row-modal" hidden>
		<div class="boldform-modal__backdrop" data-boldform-close-modal></div>
		<div class="boldform-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="boldform-row-modal-title">
			<div class="boldform-modal__head">
				<div class="boldform-modal__heading">
					<span class="boldform-modal__icon" aria-hidden="true"><span class="dashicons dashicons-screenoptions"></span></span>
					<div class="boldform-modal__heading-text">
						<h2 id="boldform-row-modal-title"><?php esc_html_e( 'Choose Column Layout', 'boldform-lite' ); ?></h2>
						<p class="boldform-modal__subtitle"><?php esc_html_e( 'Select a layout for your new row.', 'boldform-lite' ); ?></p>
					</div>
				</div>
				<button type="button" class="boldform-modal__close" data-boldform-close-modal aria-label="<?php esc_attr_e( 'Close', 'boldform-lite' ); ?>"><span class="dashicons dashicons-no-alt"></span></button>
			</div>
			<div class="boldform-column-presets" id="boldform-column-presets"></div>
			<div class="boldform-modal__foot">
				<span class="boldform-modal__hint-icon" aria-hidden="true"><span class="dashicons dashicons-lightbulb"></span></span>
				<span><?php esc_html_e( 'You can change or add more columns anytime later.', 'boldform-lite' ); ?></span>
			</div>
		</div>
	</div>

	<div class="boldform-modal" id="boldform-template-modal" hidden>
		<div class="boldform-modal__backdrop" data-boldform-close-template-modal></div>
		<div class="boldform-modal__dialog boldform-modal__dialog--template" role="dialog" aria-modal="true" aria-labelledby="boldform-template-modal-title">
			<div class="boldform-modal__head">
				<h2 id="boldform-template-modal-title"><?php esc_html_e( 'Choose a Template', 'boldform-lite' ); ?></h2>
				<button type="button" class="boldform-modal__close" data-boldform-close-template-modal aria-label="<?php esc_attr_e( 'Close', 'boldform-lite' ); ?>"><span class="dashicons dashicons-no-alt"></span></button>
			</div>
			<div class="boldform-template-modal">
				<div class="boldform-template-list" id="boldform-template-list"></div>
				<div class="boldform-template-preview">
					<div class="boldform-template-preview__head" id="boldform-template-preview__head"></div>
					<div class="boldform-template-preview__canvas" id="boldform-template-preview-canvas"></div>
					<div class="boldform-template-preview__actions">
						<button type="button" class="button button-primary" id="boldform-import-template"><?php esc_html_e( 'Import Template', 'boldform-lite' ); ?></button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
