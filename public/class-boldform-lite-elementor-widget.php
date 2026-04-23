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

		$this->add_control(
			'edit_form_link',
			array(
				'type'            => \Elementor\Controls_Manager::RAW_HTML,
				'raw'             => '<a href="#" class="boldform-edit-form-link" target="_blank" style="display:inline-flex;align-items:center;gap:4px;color:#2f80ed;font-weight:500;font-size:13px;text-decoration:none;"><span class="dashicons dashicons-edit" style="font-size:14px;width:14px;height:14px;"></span>' . esc_html__( 'Edit this form in builder', 'boldform-lite' ) . '</a>',
				'content_classes' => 'boldform-elementor-edit-link',
				'condition'       => array( 'form_id!' => '0' ),
			)
		);

		$this->add_control(
			'hide_labels',
			array(
				'label'        => __( 'Hide Labels', 'boldform-lite' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'default'      => '',
				'return_value' => 'yes',
				'selectors'    => array(
					'{{WRAPPER}} .boldform-lite-form__label' => 'display: none !important;',
				),
			)
		);

		$this->add_control(
			'hide_placeholders',
			array(
				'label'        => __( 'Hide Placeholders', 'boldform-lite' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'default'      => '',
				'return_value' => 'yes',
				'prefix_class' => 'boldform-hide-ph-',
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

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'form_background',
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form',
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

		$this->start_controls_tabs( 'form_shadow_tabs' );

		$this->start_controls_tab( 'form_shadow_normal', array( 'label' => __( 'Normal', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'form_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form',
			)
		);
		$this->end_controls_tab();

		$this->start_controls_tab( 'form_shadow_hover', array( 'label' => __( 'Hover', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'form_box_shadow_hover',
				'selector' => '{{WRAPPER}} .boldform-lite-form:hover',
			)
		);
		$this->end_controls_tab();

		$this->end_controls_tabs();

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
			'column_gap',
			array(
				'label'      => __( 'Column Gap', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 80 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__row'    => 'margin-left: -{{SIZE}}px; margin-right: -{{SIZE}}px;',
					'{{WRAPPER}} .boldform-lite-form__column' => 'padding-left: {{SIZE}}px; padding-right: {{SIZE}}px;',
				),
			)
		);

		$this->add_responsive_control(
			'field_margin',
			array(
				'label'      => __( 'Field Margin', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'input_margin',
			array(
				'label'      => __( 'Input Margin', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea, {{WRAPPER}} .boldform-lite-form__field select, {{WRAPPER}} .boldform-lite-form__field .bf-select__trigger' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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

		$this->add_control(
			'required_indicator_color',
			array(
				'label'     => __( 'Required Indicator Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__required' => 'color: {{VALUE}};',
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
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select' => 'height: {{SIZE}}{{UNIT}}; min-height: {{SIZE}}{{UNIT}};',
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
				'default'    => array( 'size' => 120, 'unit' => 'px' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field textarea' => 'height: {{SIZE}}{{UNIT}}; min-height: {{SIZE}}{{UNIT}};',
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
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'field_background',
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea',
			)
		);

		$this->add_control(
			'field_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea' => 'color: {{VALUE}};',
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
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'field_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea',
			)
		);

		$this->add_responsive_control(
			'field_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
					'{{WRAPPER}} .boldform-lite-form__field input:focus, {{WRAPPER}} .boldform-lite-form__field textarea:focus' => 'border-color: {{VALUE}};',
				),
			)
		);

		$this->start_controls_tabs( 'field_shadow_tabs' );

		$this->start_controls_tab( 'field_shadow_normal', array( 'label' => __( 'Normal', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'field_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea',
			)
		);
		$this->end_controls_tab();

		$this->start_controls_tab( 'field_shadow_focus', array( 'label' => __( 'Focus', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'field_box_shadow_focus',
				'selector' => '{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]):focus, {{WRAPPER}} .boldform-lite-form__field textarea:focus',
			)
		);
		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_responsive_control(
			'input_el_margin',
			array(
				'label'      => __( 'Margin', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'separator'  => 'before',
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__field input:not([type="checkbox"]):not([type="radio"]), {{WRAPPER}} .boldform-lite-form__field textarea' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Placeholder ──
		$this->start_controls_section(
			'section_style_placeholder',
			array(
				'label' => __( 'Placeholder', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'placeholder_color',
			array(
				'label'     => __( 'Placeholder Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form input::placeholder' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form textarea::placeholder' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'placeholder_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form input::placeholder, {{WRAPPER}} .boldform-lite-form textarea::placeholder',
			)
		);

		$this->end_controls_section();

		// ── Style: Checkbox & Radio ──
		$this->start_controls_section(
			'section_style_checkbox_radio',
			array(
				'label' => __( 'Checkbox & Radio', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'choice_accent_color',
			array(
				'label'     => __( 'Accent Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__choice input[type="checkbox"]' => 'accent-color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__choice input[type="radio"]' => 'accent-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'choice_size',
			array(
				'label'      => __( 'Size', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 12, 'max' => 30 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__choice input[type="checkbox"], {{WRAPPER}} .boldform-lite-form__choice input[type="radio"]' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'choice_label_color',
			array(
				'label'     => __( 'Label Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__choice' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'choice_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__choice',
			)
		);

		$this->add_control(
			'choice_spacing',
			array(
				'label'      => __( 'Spacing Between Options', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 24 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__choice' => 'margin-bottom: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Select Dropdown ──
		$this->start_controls_section(
			'section_style_select',
			array(
				'label' => __( 'Select Dropdown', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		// ── Trigger (closed state) ────────────────────────────────────────────

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_background',
				'label'    => __( 'Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select',
			)
		);

		$this->add_control(
			'select_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__trigger' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form .bf-select__value' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form select' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'select_placeholder_color',
			array(
				'label'     => __( 'Placeholder Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__placeholder' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'select_arrow_color',
			array(
				'label'     => __( 'Arrow Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__arrow' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'select_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'select_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select',
			)
		);

		$this->add_responsive_control(
			'select_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_responsive_control(
			'select_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->start_controls_tabs( 'select_shadow_tabs' );

		$this->start_controls_tab( 'select_shadow_normal', array( 'label' => __( 'Normal', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'select_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select',
			)
		);
		$this->end_controls_tab();

		$this->start_controls_tab( 'select_shadow_focus', array( 'label' => __( 'Focus', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'select_box_shadow_focus',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select.is-open .bf-select__trigger, {{WRAPPER}} .boldform-lite-form select:focus',
			)
		);
		$this->end_controls_tab();

		$this->end_controls_tabs();

		// ── Open / Focus state ────────────────────────────────────────────────

		$this->add_control(
			'select_open_heading',
			array(
				'label'     => __( 'Open / Focus State', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);

		$this->add_control(
			'select_focus_border_color',
			array(
				'label'     => __( 'Focus Border Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select.is-open .bf-select__trigger' => 'border-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'select_focus_shadow_color',
			array(
				'label'     => __( 'Focus Ring Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select.is-open .bf-select__trigger' => 'box-shadow: 0 0 0 3px {{VALUE}};',
				),
			)
		);

		// ── Dropdown panel ────────────────────────────────────────────────────

		$this->add_control(
			'select_panel_heading',
			array(
				'label'     => __( 'Dropdown Panel', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_dropdown_background',
				'label'    => __( 'Panel Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__panel',
			)
		);

		$this->add_control(
			'select_panel_border_color',
			array(
				'label'     => __( 'Panel Border Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__panel' => 'border-color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form .bf-select__search-wrap' => 'border-bottom-color: {{VALUE}};',
				),
			)
		);

		$this->add_responsive_control(
			'select_panel_border_radius',
			array(
				'label'      => __( 'Panel Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__panel' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'select_panel_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__panel',
			)
		);

		// ── Search box inside panel ───────────────────────────────────────────

		$this->add_control(
			'select_search_heading',
			array(
				'label'     => __( 'Search Box', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_search_background',
				'label'    => __( 'Search Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__search-wrap, {{WRAPPER}} .boldform-lite-form .bf-select__panel-search',
			)
		);

		$this->add_control(
			'select_search_color',
			array(
				'label'     => __( 'Search Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__panel-search' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'select_search_placeholder_color',
			array(
				'label'     => __( 'Search Placeholder Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__panel-search::placeholder' => 'color: {{VALUE}};',
				),
			)
		);

		// ── Options ───────────────────────────────────────────────────────────

		$this->add_control(
			'select_options_heading',
			array(
				'label'     => __( 'Options', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_option_background',
				'label'    => __( 'Option Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__option',
			)
		);

		$this->add_control(
			'select_option_color',
			array(
				'label'     => __( 'Option Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__option' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form .bf-select__option-text' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'select_option_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__option',
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_option_hover_background',
				'label'    => __( 'Option Hover Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__option:hover',
			)
		);

		$this->add_control(
			'select_option_hover_color',
			array(
				'label'     => __( 'Option Hover Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__option:hover' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'select_option_active_background',
				'label'    => __( 'Selected Option Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form .bf-select__option.is-active',
			)
		);

		$this->add_control(
			'select_option_active_color',
			array(
				'label'     => __( 'Selected Option Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__option.is-active' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'select_check_color',
			array(
				'label'     => __( 'Checkmark Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form .bf-select__option.is-active .bf-select__check' => 'background-color: {{VALUE}}; border-color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Terms & Conditions ──
		$this->start_controls_section(
			'section_style_terms',
			array(
				'label' => __( 'Terms & Conditions', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'terms_text_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__terms' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'terms_link_color',
			array(
				'label'     => __( 'Link Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__terms a' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'terms_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__terms',
			)
		);

		$this->add_control(
			'terms_checkbox_size',
			array(
				'label'      => __( 'Checkbox Size', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 12, 'max' => 30 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__terms input[type="checkbox"]' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Star Rating ──
		$this->start_controls_section(
			'section_style_star_rating',
			array(
				'label' => __( 'Star Rating', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'star_color',
			array(
				'label'     => __( 'Star Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-star-rating' => '--bf-star-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'star_inactive_color',
			array(
				'label'     => __( 'Inactive Star Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-star' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'star_size',
			array(
				'label'      => __( 'Star Size', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::SLIDER,
				'size_units' => array( 'px' ),
				'range'      => array( 'px' => array( 'min' => 16, 'max' => 60 ) ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-star-rating' => '--bf-star-size: {{SIZE}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: File Upload ──
		$this->start_controls_section(
			'section_style_file',
			array(
				'label' => __( 'File Upload', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'file_btn_color',
			array(
				'label'     => __( 'Button Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form input[type="file"]::file-selector-button' => 'background-color: {{VALUE}}; border-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'file_btn_text_color',
			array(
				'label'     => __( 'Button Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form input[type="file"]::file-selector-button' => 'color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Section Break ──
		$this->start_controls_section(
			'section_style_section_break',
			array(
				'label' => __( 'Section Break', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'section_break_color',
			array(
				'label'     => __( 'Title Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__section-title' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'section_break_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__section-title',
			)
		);

		$this->add_control(
			'section_break_desc_color',
			array(
				'label'     => __( 'Description Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__section-description' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'section_break_border_color',
			array(
				'label'     => __( 'Border Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__section-break' => 'border-bottom-color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Submit Button ──
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
				'return_value' => 'yes',
				'selectors'    => array(
					'{{WRAPPER}} .boldform-lite-form__actions' => 'display: block;',
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

		$this->start_controls_tabs( 'button_colors' );

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

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'button_background',
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit',
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

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'button_hover_background',
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit:hover',
			)
		);

		$this->add_control(
			'button_hover_border_color',
			array(
				'label'     => __( 'Border Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit:hover' => 'border-color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'button_hover_border_width',
			array(
				'label'      => __( 'Border Width', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__submit:hover' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_control(
			'button_hover_border_style',
			array(
				'label'     => __( 'Border Style', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::SELECT,
				'options'   => array(
					''       => __( 'Default', 'boldform-lite' ),
					'solid'  => __( 'Solid', 'boldform-lite' ),
					'dashed' => __( 'Dashed', 'boldform-lite' ),
					'dotted' => __( 'Dotted', 'boldform-lite' ),
					'double' => __( 'Double', 'boldform-lite' ),
					'none'   => __( 'None', 'boldform-lite' ),
				),
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit:hover' => 'border-style: {{VALUE}};',
				),
			)
		);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_control(
			'button_icon_color_el',
			array(
				'label'     => __( 'Icon Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'separator' => 'before',
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__submit .dashicons' => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__submit .boldform-btn-icon-svg svg' => 'fill: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__submit .boldform-btn-icon-svg svg path' => 'fill: {{VALUE}};',	
					'{{WRAPPER}} .boldform-lite-form__submit .boldform-btn-icon-svg svg rect' => 'fill: {{VALUE}};',
				),
			)
		);

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

		$this->start_controls_tabs( 'button_shadow_tabs' );

		$this->start_controls_tab( 'button_shadow_normal', array( 'label' => __( 'Normal', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'button_box_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit',
			)
		);
		$this->end_controls_tab();

		$this->start_controls_tab( 'button_shadow_hover', array( 'label' => __( 'Hover', 'boldform-lite' ) ) );
		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'button_box_shadow_hover',
				'selector' => '{{WRAPPER}} .boldform-lite-form__submit:hover',
			)
		);
		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_responsive_control(
			'button_el_margin',
			array(
				'label'      => __( 'Margin', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'separator'  => 'before',
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__actions' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
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
					'{{WRAPPER}} .boldform-lite-form__field-error'   => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__required'      => 'color: {{VALUE}};',
					'{{WRAPPER}} .boldform-lite-form__field.is-invalid input, {{WRAPPER}} .boldform-lite-form__field.is-invalid textarea, {{WRAPPER}} .boldform-lite-form__field.is-invalid select, {{WRAPPER}} .boldform-lite-form__field.is-invalid .bf-select__trigger' => 'border-color: {{VALUE}};',
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

		$this->add_responsive_control(
			'error_message_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'separator'  => 'before',
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-error' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'error_message_background',
				'label'    => __( 'Notice Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-error',
			)
		);

		$this->add_control(
			'error_message_text_color',
			array(
				'label'     => __( 'Notice Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-error' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'error_message_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-error',
			)
		);

		$this->add_responsive_control(
			'error_message_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-error' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->end_controls_section();

		// ── Style: Success Message ──
		$this->start_controls_section(
			'section_style_success',
			array(
				'label' => __( 'Success Message', 'boldform-lite' ),
				'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Typography::get_type(),
			array(
				'name'     => 'success_typography',
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-success',
			)
		);

		$this->add_responsive_control(
			'success_message_padding',
			array(
				'label'      => __( 'Padding', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', 'em' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-success' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Background::get_type(),
			array(
				'name'     => 'success_message_background',
				'label'    => __( 'Background', 'boldform-lite' ),
				'types'    => array( 'classic', 'gradient' ),
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-success',
			)
		);

		$this->add_control(
			'success_message_color',
			array(
				'label'     => __( 'Text Color', 'boldform-lite' ),
				'type'      => \Elementor\Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-success' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			array(
				'name'     => 'success_message_border',
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-success',
			)
		);

		$this->add_responsive_control(
			'success_message_border_radius',
			array(
				'label'      => __( 'Border Radius', 'boldform-lite' ),
				'type'       => \Elementor\Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%' ),
				'selectors'  => array(
					'{{WRAPPER}} .boldform-lite-form__message.is-success' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			)
		);

		$this->add_group_control(
			\Elementor\Group_Control_Box_Shadow::get_type(),
			array(
				'name'     => 'success_message_shadow',
				'selector' => '{{WRAPPER}} .boldform-lite-form__message.is-success',
			)
		);

		$this->end_controls_section();

		/**
		 * Fires after all Elementor widget controls are registered.
		 *
		 * Pro can add additional control sections (e.g. multi-step style, payment, etc.).
		 *
		 * @param \Elementor\Widget_Base $widget This widget instance.
		 */
		do_action( 'boldform_elementor_widget_controls', $this );
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
