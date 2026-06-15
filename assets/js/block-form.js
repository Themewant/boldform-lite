( function ( blocks, element, components, blockEditor, serverSideRender, i18n ) {
	var el = element.createElement;
	var Fragment = element.Fragment;
	var InspectorControls = blockEditor.InspectorControls;
	var useBlockProps = blockEditor.useBlockProps;
	var PanelBody = components.PanelBody;
	var SelectControl = components.SelectControl;
	var ToggleControl = components.ToggleControl;
	var Placeholder = components.Placeholder;
	var ServerSideRender = serverSideRender && serverSideRender.default ? serverSideRender.default : serverSideRender;
	var __ = i18n.__;

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
