( function ( blocks, element, components, blockEditor, serverSideRender, i18n ) {
	var el = element.createElement;
	var Fragment = element.Fragment;
	var InspectorControls = blockEditor.InspectorControls;
	var useBlockProps = blockEditor.useBlockProps;
	var PanelBody = components.PanelBody;
	var SelectControl = components.SelectControl;
	var RangeControl = components.RangeControl;
	var ToggleControl = components.ToggleControl;
	var TextControl = components.TextControl;
	var Placeholder = components.Placeholder;
	var ServerSideRender = serverSideRender && serverSideRender.default ? serverSideRender.default : serverSideRender;
	var __ = i18n.__;

	function colorField( label, value, onChange ) {
		return el(
			'div',
			{ style: { marginBottom: '16px' } },
			el( 'label', { style: { display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' } }, label ),
			el( 'div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
				el( 'input', {
					type: 'color',
					value: value || '#000000',
					onChange: function ( e ) { onChange( e.target.value ); },
					style: { width: '36px', height: '36px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
				} ),
				el( 'input', {
					type: 'text',
					value: value || '',
					onChange: function ( e ) { onChange( e.target.value ); },
					placeholder: label,
					style: { flex: 1, padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }
				} ),
				value ? el( 'button', {
					onClick: function () { onChange( '' ); },
					style: { background: 'none', border: 'none', color: '#cc1818', cursor: 'pointer', fontSize: '12px', padding: '4px' },
					title: __( 'Clear', 'boldform-lite' )
				}, '\u00d7' ) : null
			)
		);
	}

	blocks.registerBlockType(
		'boldform/form',
		{
			title: __( 'BoldForm', 'boldform-lite' ),
			icon: 'feedback',
			category: 'widgets',
			description: __( 'Display a BoldForm form.', 'boldform-lite' ),
			edit: function ( props ) {
				var attributes = props.attributes;
				var setAttributes = props.setAttributes;
				var blockProps = useBlockProps();
				var forms = window.boldformLiteBlock && Array.isArray( window.boldformLiteBlock.forms ) ? window.boldformLiteBlock.forms : [];
				var options = [
					{
						label: window.boldformLiteBlock && window.boldformLiteBlock.placeholder ? window.boldformLiteBlock.placeholder : __( 'Select a form', 'boldform-lite' ),
						value: 0
					}
				];

				forms.forEach( function ( form ) {
					options.push( { label: form.label, value: form.value } );
				} );

				function setAttr( key ) {
					return function ( val ) {
						var obj = {};
						obj[ key ] = val;
						setAttributes( obj );
					};
				}

				function setAttrStr( key ) {
					return function ( val ) {
						var obj = {};
						obj[ key ] = val !== undefined && val !== null ? String( val ) : '';
						setAttributes( obj );
					};
				}

				function setAttrPx( key ) {
					return function ( val ) {
						var obj = {};
						obj[ key ] = val !== undefined && val !== null ? val + 'px' : '';
						setAttributes( obj );
					};
				}

				function parsePx( val ) {
					if ( ! val ) return undefined;
					var n = parseInt( val, 10 );
					return isNaN( n ) ? undefined : n;
				}

				return el(
					Fragment,
					null,
					el(
						InspectorControls,
						null,

						/* ── Form Selection ── */
						el( PanelBody, { title: __( 'Form Settings', 'boldform-lite' ), initialOpen: true },
							el( SelectControl, {
								label: __( 'Select Form', 'boldform-lite' ),
								value: attributes.formId || 0,
								options: options,
								onChange: function ( value ) {
									setAttributes( { formId: parseInt( value, 10 ) || 0 } );
								}
							} ),
							attributes.formId ? el(
								'a',
								{
									href: ( window.boldformLiteBlock && window.boldformLiteBlock.builderUrl || '/wp-admin/admin.php?page=boldform-lite-builder&form_id=' ) + attributes.formId,
									target: '_blank',
									rel: 'noopener',
									style: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2f80ed', fontWeight: 500, fontSize: '13px', textDecoration: 'none', marginBottom: '12px' }
								},
								el( 'span', { className: 'dashicons dashicons-edit', style: { fontSize: '14px', width: '14px', height: '14px' } } ),
								__( 'Edit this form in builder', 'boldform-lite' )
							) : null,
							el( ToggleControl, {
								label: __( 'Hide Labels', 'boldform-lite' ),
								checked: !! attributes.hideLabels,
								onChange: setAttr( 'hideLabels' )
							} ),
							el( ToggleControl, {
								label: __( 'Hide Placeholders', 'boldform-lite' ),
								checked: !! attributes.hidePlaceholders,
								onChange: setAttr( 'hidePlaceholders' )
							} )
						),

						/* ── Form Container ── */
						el( PanelBody, { title: __( 'Form Container', 'boldform-lite' ), initialOpen: false },
							el( TextControl, {
								label: __( 'Max Width', 'boldform-lite' ),
								value: attributes.formMaxWidth || '',
								onChange: setAttrStr( 'formMaxWidth' ),
								placeholder: '720px',
								help: __( 'e.g. 720px, 100%, 50vw', 'boldform-lite' )
							} ),
							el( TextControl, {
								label: __( 'Padding', 'boldform-lite' ),
								value: attributes.formPadding || '',
								onChange: setAttrStr( 'formPadding' ),
								placeholder: '0',
								help: __( 'e.g. 20px, 20px 30px', 'boldform-lite' )
							} ),
							colorField( __( 'Background Color', 'boldform-lite' ), attributes.formBgColor, setAttrStr( 'formBgColor' ) ),
							el( TextControl, {
								label: __( 'Border Radius', 'boldform-lite' ),
								value: attributes.formBorderRadius || '',
								onChange: setAttrStr( 'formBorderRadius' ),
								placeholder: '0'
							} ),
							el( TextControl, {
								label: __( 'Border Width', 'boldform-lite' ),
								value: attributes.formBorderWidth || '',
								onChange: setAttrStr( 'formBorderWidth' ),
								placeholder: '0'
							} ),
							colorField( __( 'Border Color', 'boldform-lite' ), attributes.formBorderColor, setAttrStr( 'formBorderColor' ) )
						),

						/* ── Layout & Spacing ── */
						el( PanelBody, { title: __( 'Layout & Spacing', 'boldform-lite' ), initialOpen: false },
							el( RangeControl, {
								label: __( 'Row Gap', 'boldform-lite' ),
								value: parsePx( attributes.rowGap ),
								onChange: setAttrPx( 'rowGap' ),
								min: 0, max: 80, step: 1,
								allowReset: true
							} ),
							el( RangeControl, {
								label: __( 'Column Gap', 'boldform-lite' ),
								value: parsePx( attributes.columnGap ),
								onChange: setAttrPx( 'columnGap' ),
								min: 0, max: 60, step: 1,
								allowReset: true
							} ),
							el( RangeControl, {
								label: __( 'Field Spacing', 'boldform-lite' ),
								value: parsePx( attributes.fieldGap ),
								onChange: setAttrPx( 'fieldGap' ),
								min: 0, max: 40, step: 1,
								allowReset: true
							} )
						),

						/* ── Labels ── */
						el( PanelBody, { title: __( 'Labels', 'boldform-lite' ), initialOpen: false },
							colorField( __( 'Text Color', 'boldform-lite' ), attributes.labelColor, setAttrStr( 'labelColor' ) ),
							el( TextControl, {
								label: __( 'Font Size', 'boldform-lite' ),
								value: attributes.labelFontSize || '',
								onChange: setAttrStr( 'labelFontSize' ),
								placeholder: '17px'
							} ),
							colorField( __( 'Required Indicator Color', 'boldform-lite' ), attributes.requiredIndicatorColor, setAttrStr( 'requiredIndicatorColor' ) )
						),

						/* ── Input Fields ── */
						el( PanelBody, { title: __( 'Input Fields', 'boldform-lite' ), initialOpen: false },
							el( RangeControl, {
								label: __( 'Height', 'boldform-lite' ),
								value: parsePx( attributes.fieldHeight ),
								onChange: setAttrPx( 'fieldHeight' ),
								min: 30, max: 80, step: 1,
								allowReset: true
							} ),
							el( RangeControl, {
								label: __( 'Textarea Height', 'boldform-lite' ),
								value: parsePx( attributes.textareaHeight ),
								onChange: setAttrPx( 'textareaHeight' ),
								min: 60, max: 400, step: 5,
								allowReset: true
							} ),
							el( TextControl, {
								label: __( 'Padding', 'boldform-lite' ),
								value: attributes.fieldPadding || '',
								onChange: setAttrStr( 'fieldPadding' ),
								placeholder: '18px 24px'
							} ),
							colorField( __( 'Background Color', 'boldform-lite' ), attributes.fieldBgColor, setAttrStr( 'fieldBgColor' ) ),
							colorField( __( 'Text Color', 'boldform-lite' ), attributes.fieldTextColor, setAttrStr( 'fieldTextColor' ) ),
							el( TextControl, {
								label: __( 'Border Width', 'boldform-lite' ),
								value: attributes.fieldBorderWidth || '',
								onChange: setAttrStr( 'fieldBorderWidth' ),
								placeholder: '1px'
							} ),
							colorField( __( 'Border Color', 'boldform-lite' ), attributes.fieldBorderColor, setAttrStr( 'fieldBorderColor' ) ),
							el( TextControl, {
								label: __( 'Border Radius', 'boldform-lite' ),
								value: attributes.fieldBorderRadius || '',
								onChange: setAttrStr( 'fieldBorderRadius' ),
								placeholder: '16px'
							} ),
							colorField( __( 'Focus Border Color', 'boldform-lite' ), attributes.fieldFocusColor, setAttrStr( 'fieldFocusColor' ) ),
							colorField( __( 'Focus Background Color', 'boldform-lite' ), attributes.fieldFocusBgColor, setAttrStr( 'fieldFocusBgColor' ) )
						),

						/* ── Submit Button ── */
						el( PanelBody, { title: __( 'Submit Button', 'boldform-lite' ), initialOpen: false },
							el( ToggleControl, {
								label: __( 'Full Width', 'boldform-lite' ),
								checked: !! attributes.buttonFullWidth,
								onChange: setAttr( 'buttonFullWidth' )
							} ),
							el( TextControl, {
								label: __( 'Padding', 'boldform-lite' ),
								value: attributes.buttonPadding || '',
								onChange: setAttrStr( 'buttonPadding' ),
								placeholder: '18px 42px'
							} ),
							el( TextControl, {
								label: __( 'Font Size', 'boldform-lite' ),
								value: attributes.buttonFontSize || '',
								onChange: setAttrStr( 'buttonFontSize' ),
								placeholder: '18px'
							} ),
							colorField( __( 'Background Color', 'boldform-lite' ), attributes.buttonBgColor, setAttrStr( 'buttonBgColor' ) ),
							colorField( __( 'Text Color', 'boldform-lite' ), attributes.buttonTextColor, setAttrStr( 'buttonTextColor' ) ),
							colorField( __( 'Hover Background', 'boldform-lite' ), attributes.buttonHoverBgColor, setAttrStr( 'buttonHoverBgColor' ) ),
							el( TextControl, {
								label: __( 'Border Radius', 'boldform-lite' ),
								value: attributes.buttonBorderRadius || '',
								onChange: setAttrStr( 'buttonBorderRadius' ),
								placeholder: '16px'
							} )
						),

						/* ── Errors ── */
						el( PanelBody, { title: __( 'Error Messages', 'boldform-lite' ), initialOpen: false },
							colorField( __( 'Error Color', 'boldform-lite' ), attributes.errorColor, setAttrStr( 'errorColor' ) )
						)
					),
					el(
						'div',
						blockProps,
						attributes.formId
							? el( ServerSideRender, {
								block: 'boldform/form',
								attributes: attributes
							} )
							: el(
								Placeholder,
								{
									label: __( 'BoldForm', 'boldform-lite' ),
									instructions: forms.length
										? ( window.boldformLiteBlock && window.boldformLiteBlock.previewText ? window.boldformLiteBlock.previewText : __( 'Select a form to preview it in the editor.', 'boldform-lite' ) )
										: ( window.boldformLiteBlock && window.boldformLiteBlock.emptyMessage ? window.boldformLiteBlock.emptyMessage : __( 'No published forms found.', 'boldform-lite' ) )
								},
								el( SelectControl, {
									label: __( 'Form', 'boldform-lite' ),
									value: attributes.formId || 0,
									options: options,
									onChange: function ( value ) {
										setAttributes( { formId: parseInt( value, 10 ) || 0 } );
									}
								} )
							)
					)
				);
			},
			save: function () {
				return null;
			}
		}
	);
} )(
	window.wp.blocks,
	window.wp.element,
	window.wp.components,
	window.wp.blockEditor,
	window.wp.serverSideRender,
	window.wp.i18n
);
