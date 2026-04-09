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
?>
<?php $boldform_lite_is_new_form = ! $form_data['id']; ?>
<div class="wrap boldform-builder-page" id="boldform-builder-root">

	<!-- Setup screen for new forms -->
	<div class="boldform-setup-screen" id="boldform-setup-screen"<?php echo ! $boldform_lite_is_new_form ? ' hidden' : ''; ?>>
		<div class="boldform-setup-header">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=boldform-lite' ) ); ?>" class="boldform-setup-header__back">
				<span class="dashicons dashicons-arrow-left-alt2"></span>
			</a>
			<div class="boldform-setup-header__brand">
				<span class="dashicons dashicons-feedback"></span>
				<span><?php esc_html_e( 'BoldForm', 'boldform-lite' ); ?></span>
			</div>
		</div>
		<div class="boldform-setup-body">
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
				<span class="dashicons dashicons-feedback"></span>
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
				<button type="button" class="boldform-editor-tab" id="boldform-editor-tab-settings" data-editor-tab="settings" role="tab" aria-selected="false">
					<?php esc_html_e( 'Settings', 'boldform-lite' ); ?>
				</button>
			</div>
		</div>

		<div class="boldform-builder-actions">
			<button type="button" class="boldform-builder-shortcode<?php echo $form_data['id'] > 0 ? ' is-visible' : ''; ?>" id="boldform-builder-shortcode"<?php echo $form_data['id'] > 0 ? '' : ' hidden'; ?>>
				<span class="boldform-builder-shortcode__label"><?php esc_html_e( 'Shortcode', 'boldform-lite' ); ?></span>
				<code class="boldform-builder-shortcode__code" id="boldform-builder-shortcode-code">[boldform id="<?php echo esc_html( (string) $form_data['id'] ); ?>"]</code>
			</button>
			<a href="<?php echo $form_data['id'] > 0 ? esc_url( admin_url( 'admin.php?page=boldform-lite-preview&form_id=' . absint( $form_data['id'] ) ) ) : '#'; ?>" class="button boldform-preview-btn" id="boldform-preview-form"<?php echo $form_data['id'] > 0 ? '' : ' style="display:none"'; ?>>
				<span class="dashicons dashicons-visibility"></span>
				<?php esc_html_e( 'Preview', 'boldform-lite' ); ?>
			</a>
			<button type="button" class="button" id="boldform-save-continue">
				<?php esc_html_e( 'Save & Continue', 'boldform-lite' ); ?>
			</button>
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
					<button type="button" class="boldform-sidebar-tab" id="boldform-tab-styling" data-tab="styling" role="tab" aria-selected="false">
						<?php esc_html_e( 'Styling', 'boldform-lite' ); ?>
					</button>
				</div>

				<div class="boldform-sidebar-panel__content">
					<section class="boldform-sidebar-view is-active" id="boldform-sidebar-library" data-tab-panel="library" role="tabpanel" aria-labelledby="boldform-tab-library">
						<div class="boldform-panel-head">
							<h2><?php esc_html_e( 'Field Library', 'boldform-lite' ); ?></h2>
							<p><?php esc_html_e( 'Drag fields into a column or click to insert into the selected column.', 'boldform-lite' ); ?></p>
						</div>

						<div class="boldform-field-library" id="boldform-field-library">
							<?php foreach ( $boldform_lite_field_groups as $boldform_lite_group_key => $boldform_lite_group_label ) : ?>
								<div class="boldform-library-group">
									<h3><?php echo esc_html( $boldform_lite_group_label ); ?></h3>
									<div class="boldform-library-grid">
										<?php foreach ( $this->get_field_library() as $boldform_lite_field_type => $boldform_lite_field_data ) : ?>
											<?php if ( ! isset( $boldform_lite_field_data['group'] ) || $boldform_lite_group_key !== $boldform_lite_field_data['group'] ) : ?>
												<?php continue; ?>
											<?php endif; ?>
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

					<section class="boldform-sidebar-view" id="boldform-sidebar-styling" data-tab-panel="styling" role="tabpanel" aria-labelledby="boldform-tab-styling" hidden>
						<div class="boldform-panel-head">
							<h2><?php esc_html_e( 'Form Styling', 'boldform-lite' ); ?></h2>
							<p><?php esc_html_e( 'Change field and button styles and see the preview update instantly.', 'boldform-lite' ); ?></p>
						</div>

						<div class="boldform-settings-panel" id="boldform-form-styling-panel"></div>
					</section>
				</div>
			</div>
		</aside>

		<main class="boldform-builder-canvas-wrap">
			<div class="boldform-panel boldform-canvas-panel">
				<div class="boldform-panel-head boldform-panel-head--canvas">
					<div>
						<h2><?php esc_html_e( 'Form Canvas', 'boldform-lite' ); ?></h2>
						<p><?php esc_html_e( 'Build layouts with rows and columns, then drop fields into each column.', 'boldform-lite' ); ?></p>
					</div>
					<button type="button" class="button button-secondary" id="boldform-add-row-inline">
						<?php esc_html_e( 'Add Row', 'boldform-lite' ); ?>
					</button>
				</div>

				<div class="boldform-canvas-empty" id="boldform-canvas-empty">
					<div class="boldform-empty-state">
						<span class="dashicons dashicons-layout"></span>
						<h3><?php esc_html_e( 'Start building your form', 'boldform-lite' ); ?></h3>
						<p><?php esc_html_e( 'Start from a blank canvas or open the built-in template gallery.', 'boldform-lite' ); ?></p>
						<div class="boldform-start-grid">
							<button type="button" class="boldform-start-card" data-template="blank">
								<strong><?php esc_html_e( 'Blank Form', 'boldform-lite' ); ?></strong>
								<span><?php esc_html_e( 'Choose your layout and build the form from scratch.', 'boldform-lite' ); ?></span>
							</button>
							<button type="button" class="boldform-start-card" id="boldform-open-template-modal">
								<strong><?php esc_html_e( 'Use a Template', 'boldform-lite' ); ?></strong>
								<span><?php esc_html_e( 'Browse starter templates, preview them, and import in one click.', 'boldform-lite' ); ?></span>
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
				<h2 id="boldform-row-modal-title"><?php esc_html_e( 'Choose Column Layout', 'boldform-lite' ); ?></h2>
				<button type="button" class="boldform-modal__close" data-boldform-close-modal aria-label="<?php esc_attr_e( 'Close', 'boldform-lite' ); ?>"><span class="dashicons dashicons-no-alt"></span></button>
			</div>
			<div class="boldform-column-presets" id="boldform-column-presets"></div>
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
