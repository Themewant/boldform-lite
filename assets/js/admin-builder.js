jQuery(
	function ( $ ) {
		var fields = [];
		var formId = 0;

		function escapeHtml( value ) {
			return $( '<div />' ).text( value ).html();
		}

		function getFieldDefaults( type ) {
			var labels = boldformLiteAdmin.fieldLabels;

			return {
				id: 'field_' + Date.now() + '_' + Math.floor( Math.random() * 1000 ),
				type: type,
				label: labels[ type ] || type,
				options: ( type === 'select' || type === 'checkbox' || type === 'radio' ) ? [ 'Option 1', 'Option 2' ] : [],
				required: false
			};
		}

		function getPreviewMarkup( field ) {
			var html = '';

			if ( field.type === 'textarea' ) {
				html = '<textarea class="regular-text" rows="3" disabled></textarea>';
			} else if ( field.type === 'select' ) {
				html = '<select disabled>' + field.options.map(
					function ( option ) {
						return '<option>' + escapeHtml( option ) + '</option>';
					}
				).join( '' ) + '</select>';
			} else if ( field.type === 'checkbox' || field.type === 'radio' ) {
				html = field.options.map(
					function ( option, index ) {
						return '<label class="boldform-lite-choice"><input type="' + escapeHtml( field.type ) + '" disabled ' + ( index === 0 ? 'checked' : '' ) + '> ' + escapeHtml( option ) + '</label>';
					}
				).join( '' );
			} else {
				html = '<input type="' + escapeHtml( field.type ) + '" class="regular-text" disabled />';
			}

			return html;
		}

		function renderFields() {
			var $list = $( '#boldform-lite-preview-list' );
			var $empty = $( '#boldform-lite-preview-empty' );

			$list.empty();

			if ( ! fields.length ) {
				$empty.show();
				return;
			}

			$empty.hide();

			fields.forEach(
				function ( field, index ) {
					var optionsMarkup = '';

					if ( field.type === 'select' || field.type === 'checkbox' || field.type === 'radio' ) {
						optionsMarkup = '<p class="boldform-lite-options"><label>Options</label><input type="text" class="widefat boldform-lite-field-options" data-index="' + index + '" value="' + escapeHtml( field.options.join( ', ' ) ) + '" /></p>';
					}

					$list.append(
						'<div class="boldform-lite-field-card" data-index="' + index + '">' +
							'<div class="boldform-lite-field-card-header">' +
								'<strong>' + escapeHtml( field.label ) + '</strong>' +
								'<button type="button" class="button-link-delete boldform-lite-remove-field" data-index="' + index + '">' + escapeHtml( boldformLiteAdmin.removeText ) + '</button>' +
							'</div>' +
							'<p><label>Label</label><input type="text" class="widefat boldform-lite-field-label" data-index="' + index + '" value="' + escapeHtml( field.label ) + '" /></p>' +
							optionsMarkup +
							'<label><input type="checkbox" class="boldform-lite-field-required" data-index="' + index + '"' + ( field.required ? ' checked' : '' ) + '> Required</label>' +
							'<div class="boldform-lite-field-preview">' + getPreviewMarkup( field ) + '</div>' +
						'</div>'
					);
				}
			);
		}

		$( document ).on(
			'click',
			'.boldform-lite-add-field',
			function () {
				var type = $( this ).data( 'field-type' );

				fields.push( getFieldDefaults( type ) );
				renderFields();
			}
		);

		$( document ).on(
			'click',
			'.boldform-lite-remove-field',
			function () {
				var index = parseInt( $( this ).data( 'index' ), 10 );

				fields.splice( index, 1 );
				renderFields();
			}
		);

		$( document ).on(
			'change',
			'.boldform-lite-field-label',
			function () {
				var index = parseInt( $( this ).data( 'index' ), 10 );

				fields[ index ].label = $( this ).val();
				renderFields();
			}
		);

		$( document ).on(
			'change',
			'.boldform-lite-field-options',
			function () {
				var index = parseInt( $( this ).data( 'index' ), 10 );

				fields[ index ].options = $( this ).val().split( ',' ).map(
					function ( option ) {
						return $.trim( option );
					}
				).filter(
					function ( option ) {
						return option.length > 0;
					}
				);

				renderFields();
			}
		);

		$( document ).on(
			'change',
			'.boldform-lite-field-required',
			function () {
				var index = parseInt( $( this ).data( 'index' ), 10 );

				fields[ index ].required = $( this ).is( ':checked' );
			}
		);

		$( '#boldform-lite-save-form' ).on(
			'click',
			function () {
				var $button = $( this );
				var title = $( '#boldform-lite-form-title' ).val();

				if ( ! fields.length ) {
					$( '#boldform-lite-save-status' ).text( boldformLiteAdmin.messages.emptyFields );
					return;
				}

				$button.prop( 'disabled', true ).text( boldformLiteAdmin.savingText );
				$( '#boldform-lite-save-status' ).text( '' );

				$.post(
					boldformLiteAdmin.ajaxUrl,
					{
						action: 'boldform_lite_save_form',
						nonce: boldformLiteAdmin.nonce,
						form_id: formId,
						title: title,
						fields: JSON.stringify( fields )
					}
				).done(
					function ( response ) {
						if ( response.success ) {
							formId = response.data.formId;
							$( '#boldform-lite-save-status' ).text( response.data.message );
							return;
						}

						$( '#boldform-lite-save-status' ).text( response.data && response.data.message ? response.data.message : boldformLiteAdmin.messages.saveError );
					}
				).fail(
					function () {
						$( '#boldform-lite-save-status' ).text( boldformLiteAdmin.messages.saveError );
					}
				).always(
					function () {
						$button.prop( 'disabled', false ).text( boldformLiteAdmin.saveText );
					}
				);
			}
		);
	}
);
