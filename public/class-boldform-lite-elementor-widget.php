<?php
/**
 * Elementor BoldForm widget.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * BoldForm Elementor widget class.
 */
class BoldForm_Lite_Elementor_Widget extends \Elementor\Widget_Base {

	/**
	 * Main plugin instance.
	 *
	 * @var BoldForm_Lite
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param array<string, mixed>       $data Initial widget data.
	 * @param array<string, mixed>|null  $args Extra widget args.
	 * @param BoldForm_Lite|null         $plugin Plugin instance.
	 */
	public function __construct( $data = array(), $args = null, $plugin = null ) {
		$this->plugin = $plugin instanceof BoldForm_Lite ? $plugin : null;

		parent::__construct( $data, $args );
	}

	/**
	 * Widget slug.
	 *
	 * @return string
	 */
	public function get_name() {
		return 'boldform';
	}

	/**
	 * Widget title.
	 *
	 * @return string
	 */
	public function get_title() {
		return __( 'BoldForm', 'boldform-lite' );
	}

	/**
	 * Widget icon.
	 *
	 * @return string
	 */
	public function get_icon() {
		return 'eicon-form-horizontal';
	}

	/**
	 * Widget categories.
	 *
	 * @return array<int, string>
	 */
	public function get_categories() {
		return array( 'general' );
	}

	/**
	 * Returns style dependencies for Elementor preview/editor.
	 *
	 * @return array<int, string>
	 */
	public function get_style_depends() {
		$this->register_frontend_assets();

		return array( 'boldform-lite-frontend' );
	}

	/**
	 * Returns script dependencies for Elementor preview/editor.
	 *
	 * @return array<int, string>
	 */
	public function get_script_depends() {
		$this->register_frontend_assets();

		return array( 'boldform-lite-frontend' );
	}

	/**
	 * Registers widget controls.
	 *
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'section_content',
			array(
				'label' => __( 'BoldForm', 'boldform-lite' ),
			)
		);

		$this->add_control(
			'form_id',
			array(
				'label'   => __( 'Select Form', 'boldform-lite' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'options' => $this->get_form_options(),
				'default' => '0',
			)
		);

		$this->end_controls_section();

		// ── Style: Form Container ──
		$this->start_controls_section(
			'section_style_form',
			array(
				'label' => __( 'Form Container', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_responsive_control(
			'form_max_width',
			array(
				'label'      => __( 'Max Width', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px', '%' ),
				'range'      => array(
					'px' => array( 'min' => 200, 'max' => 1400 ),
					'%'  => array( 'min' => 10, 'max' => 100 ),
				),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form' => 'max-width: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'form_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'form_bg_color',
			array(
				'label'     => __( 'Background Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'form_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form',
			)
		);

		$this->add_responsive_control(
			'form_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'form_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form',
			)
		);

		$this->end_controls_section();

		// ── Style: Layout / Spacing ──
		$this->start_controls_section(
			'section_style_layout',
			array(
				'label' => __( 'Layout & Spacing', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_responsive_control(
			'row_gap',
			array(
				'label'      => __( 'Row Gap', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 80 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__fields' => 'gap: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'column_gap',
			array(
				'label'      => __( 'Column Gap', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 60 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__column' => 'padding: 0 {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .boldform-lite-form__row' => 'margin: 0 -{{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'field_gap',
			array(
				'label'      => __( 'Field Spacing', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 40 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field' => 'gap: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Labels ──
		$this->start_controls_section(
			'section_style_labels',
			array(
				'label' => __( 'Labels', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'label_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__label' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'label_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__label',
			)
		);

		$this->add_responsive_control(
			'label_margin',
			array(
				'label'      => __( 'Margin', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Input Fields ──
		$this->start_controls_section(
			'section_style_fields',
			array(
				'label' => __( 'Input Fields', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_responsive_control(
			'field_height',
			array(
				'label'      => __( 'Height', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 30, 'max' => 80 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field select' => 'height: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'textarea_height',
			array(
				'label'      => __( 'Textarea Height', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 60, 'max' => 400 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field textarea' => 'height: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'field_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'field_bg_color',
			array(
				'label'     => __( 'Background Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'field_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'field_placeholder_color',
			array(
				'label'     => __( 'Placeholder Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field input::placeholder, {{WRAPPER}} .boldform-lite-form__field textarea::placeholder' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'field_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'field_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select',
			)
		);

		$this->add_responsive_control(
			'field_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'field_focus_heading',
			array(
				'label'     => __( 'Focus State', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);

		$this->add_control(
			'field_focus_border_color',
			array(
				'label'     => __( 'Focus Border Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field input:focus, {{WRAPPER}} .boldform-lite-form__field textarea:focus, {{WRAPPER}} .boldform-lite-form__field select:focus' => 'border-color: {{VALUE}}; box-shadow: 0 0 0 1px {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'field_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select',
			)
		);

		$this->end_controls_section();

		// ── Style: Button ──
		$this->start_controls_section(
			'section_style_button',
			array(
				'label' => __( 'Submit Button', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'button_full_width',
			array(
				'label'        => __( 'Full Width', 'boldform-lite' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'label_on'     => __( 'Yes', 'boldform-lite' ),
				'label_off'    => __( 'No', 'boldform-lite' ),
				'return_value' => 'yes',
				'selectors'    => array(
					'{{WRAPPER}} .boldform-lite-form__submit' => 'width: 100%;',
				),
			)
		);

		$this->add_responsive_control(
			'button_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__submit' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'button_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit',
			)
		);

		$this->start_controls_tabs( 'button_style_tabs' );

		$this->start_controls_tab(
			'button_normal',
			array( 'label' => __( 'Normal', 'boldform-lite' ) )
		);

		$this->add_control(
			'button_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'button_bg_color',
			array(
				'label'     => __( 'Background Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'button_hover',
			array( 'label' => __( 'Hover', 'boldform-lite' ) )
		);

		$this->add_control(
			'button_hover_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit:hover' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'button_hover_bg_color',
			array(
				'label'     => __( 'Background Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit:hover' => 'background-color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'      => 'button_border',
				'selector'  => '{{WRAPPER}} .boldform-lite-form__submit',
				'separator' => 'before',
			)
		);

		$this->add_responsive_control(
			'button_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__submit' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'button_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit',
			)
		);

		$this->end_controls_section();

		// ── Style: Error Messages ──
		$this->start_controls_section(
			'section_style_errors',
			array(
				'label' => __( 'Error Messages', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'error_color',
			array(
				'label'     => __( 'Error Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field-error' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__required' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__field.is-invalid input, {{WRAPPER}} .boldform-lite-form__field.is-invalid textarea, {{WRAPPER}} .boldform-lite-form__field.is-invalid select' => 'border-color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'error_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field-error',
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Renders the widget output.
	 *
	 * @return void
	 */
	protected function render() {
		$this->register_frontend_assets();

		$settings = $this->get_settings_for_display();
		$form_id  = isset( $settings['form_id'] ) ? absint( $settings['form_id'] ) : 0;

		if ( ! $form_id ) {
			echo esc_html__( 'Select a form to display.', 'boldform-lite' );
			return;
		}

		echo do_shortcode( sprintf( '[boldform id="%d"]', $form_id ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Registers frontend assets when Elementor preview requests them in admin/editor context.
	 *
	 * @return void
	 */
	private function register_frontend_assets() {
		if ( ! wp_style_is( 'boldform-lite-frontend', 'registered' ) ) {
			wp_register_style(
				'boldform-lite-frontend',
				BOLDFORM_LITE_URL . 'assets/css/frontend.css',
				array(),
				BOLDFORM_LITE_VERSION
			);
		}

		if ( ! wp_script_is( 'boldform-lite-frontend', 'registered' ) ) {
			wp_register_script(
				'boldform-lite-frontend',
				BOLDFORM_LITE_URL . 'assets/js/frontend.js',
				array( 'jquery' ),
				BOLDFORM_LITE_VERSION,
				true
			);
		}

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
	}

	/**
	 * Returns the available forms as Elementor select options.
	 *
	 * @return array<string, string>
	 */
	private function get_form_options() {
		global $wpdb;

		$options = array(
			'0' => __( 'Select a form', 'boldform-lite' ),
		);

		if ( ! $this->plugin ) {
			return $options;
		}

		$table_name = $this->plugin->get_forms_table_name();
		$cache_key  = 'boldform_lite_elementor_form_options';
		$forms      = wp_cache_get( $cache_key, 'boldform_lite' );

		$safe_table = esc_sql( $table_name );

		if ( false === $forms ) {
			$forms = $wpdb->get_results( $wpdb->prepare( "SELECT id, title FROM `{$safe_table}` WHERE status = %s ORDER BY title ASC", 'publish' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery
			wp_cache_set( $cache_key, $forms, 'boldform_lite', MINUTE_IN_SECONDS );
		}

		foreach ( $forms as $form ) {
			/* translators: %d: form ID number */
			$options[ (string) $form->id ] = $form->title ? (string) $form->title : sprintf( __( 'Form #%d', 'boldform-lite' ), (int) $form->id );
		}

		return $options;
	}
}
