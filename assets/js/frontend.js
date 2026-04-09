jQuery(
	function ( $ ) {
		function clearFieldErrors( $form ) {
			$form.find( '.boldform-lite-form__field-error' ).remove();
			$form.find( '.is-invalid' ).removeClass( 'is-invalid' );
		}

		function showFieldError( $wrapper, message ) {
			$wrapper.addClass( 'is-invalid' );
			$wrapper.append( '<div class="boldform-lite-form__field-error">' + $( '<span />' ).text( message ).html() + '</div>' );
		}

		function showFieldErrors( $form, errors ) {
			if ( ! errors || typeof errors !== 'object' ) {
				return;
			}

			$.each(
				errors,
				function ( fieldId, message ) {
					var $wrapper = $form.find( '[name="boldform_' + fieldId + '"], [name="boldform_' + fieldId + '[]"]' ).first().closest( '.boldform-lite-form__field' );

					if ( $wrapper.length ) {
						showFieldError( $wrapper, message );
					}
				}
			);
		}

		function validateClientSide( $form ) {
			var valid = true;

			$form.find( '.boldform-lite-form__field[data-error]' ).each(
				function () {
					var $wrapper = $( this );
					var $input = $wrapper.find( 'input[required], textarea[required], select[required]' ).first();

					if ( ! $input.length ) {
						return;
					}

					var val = $input.val();
					var type = $input.attr( 'type' ) || '';
					var isEmpty = false;

					if ( 'checkbox' === type || 'radio' === type ) {
						var name = $input.attr( 'name' );
						isEmpty = ! $form.find( 'input[name="' + name + '"]:checked' ).length;
					} else {
						isEmpty = ! val || ! $.trim( val );
					}

					if ( isEmpty ) {
						showFieldError( $wrapper, $wrapper.data( 'error' ) );
						valid = false;
					}
				}
			);

			return valid;
		}

		// Disable native browser validation only when JS is loaded — keeps HTML5 required as fallback.
		$( '.boldform-lite-form' ).attr( 'novalidate', 'novalidate' );

		// ── Flatpickr date/time pickers ──
		if ( typeof flatpickr !== 'undefined' ) {
			$( 'input[data-boldform-picker="date"]' ).each( function () {
				flatpickr( this, {
					dateFormat: 'Y-m-d',
					altInput: true,
					altFormat: 'F j, Y',
					allowInput: false,
					disableMobile: true
				} );
			} );

			$( 'input[data-boldform-picker="time"]' ).each( function () {
				flatpickr( this, {
					enableTime: true,
					noCalendar: true,
					dateFormat: 'H:i',
					altInput: true,
					altFormat: 'h:i K',
					allowInput: false,
					disableMobile: true,
					minuteIncrement: 15
				} );
			} );
		}

		$( document ).on(
			'submit',
			'.boldform-lite-form',
			function ( event ) {
				var $form = $( this );
				var $message = $form.find( '[data-boldform-message]' );
				var $submit = $form.find( '.boldform-lite-form__submit' );
				var submitText = $submit.text();
				var enableAjax = '1' === String( $form.data( 'enable-ajax' ) || '0' );

				clearFieldErrors( $form );

				if ( ! enableAjax ) {
					// Non-AJAX: validate client-side, allow native submit if valid.
					if ( ! validateClientSide( $form ) ) {
						event.preventDefault();
						$message.addClass( 'is-visible is-error' ).text( boldformLiteFrontend.errorText );
					}
					return;
				}

				event.preventDefault();
				clearFieldErrors( $form );

				if ( ! validateClientSide( $form ) ) {
					$message
						.addClass( 'is-visible is-error' )
						.text( boldformLiteFrontend.errorText );
					return;
				}

				$message
					.removeClass( 'is-visible is-success is-error' )
					.text( boldformLiteFrontend.submittingText );

				$submit.prop( 'disabled', true ).text( boldformLiteFrontend.submittingText );

				$.ajax( {
					url: boldformLiteFrontend.ajaxUrl,
					type: 'POST',
					data: new FormData( $form[0] ),
					processData: false,
					contentType: false
				} )
					.done(
						function ( response ) {
							var message = response && response.data && response.data.message ? response.data.message : boldformLiteFrontend.successText;
							var redirectUrl = response && response.data && response.data.redirectUrl ? response.data.redirectUrl : '';

							if ( redirectUrl ) {
								window.location.href = redirectUrl;
								return;
							}

							$message
								.addClass( 'is-visible is-success' )
								.text( message );

							$form.trigger( 'reset' );
						}
					)
					.fail(
						function ( xhr ) {
							var response = xhr && xhr.responseJSON ? xhr.responseJSON : null;
							var message = response && response.data && response.data.message ? response.data.message : boldformLiteFrontend.errorText;
							var errors = response && response.data && response.data.errors ? response.data.errors : null;

							$message
								.addClass( 'is-visible is-error' )
								.text( message );

							showFieldErrors( $form, errors );
						}
					)
					.always(
						function () {
							$submit.prop( 'disabled', false ).text( submitText );
						}
					);
			}
		);

		// Conditional Logic.
		$( '.boldform-lite-form__field[data-cond-field]' ).each( function () {
			var $target = $( this );
			var action = $target.data( 'cond-action' ) || 'show';
			var fieldName = $target.data( 'cond-field' );
			var operator = $target.data( 'cond-operator' ) || 'is';
			var condValue = String( $target.data( 'cond-value' ) || '' );
			var $form = $target.closest( 'form' );

			function getFieldValue() {
				var $el = $form.find( '[name="' + fieldName + '"], [name="' + fieldName + '[]"]' );
				if ( ! $el.length ) return '';
				if ( $el.is( ':checkbox' ) ) {
					var vals = [];
					$el.filter( ':checked' ).each( function () { vals.push( $( this ).val() ); } );
					return vals.join( ', ' );
				}
				if ( $el.is( ':radio' ) ) {
					return $el.filter( ':checked' ).val() || '';
				}
				return $el.val() || '';
			}

			function evaluate() {
				var val = String( getFieldValue() );
				var match = false;
				if ( operator === 'is' ) match = val === condValue;
				else if ( operator === 'is_not' ) match = val !== condValue;
				else if ( operator === 'contains' ) match = val.toLowerCase().indexOf( condValue.toLowerCase() ) !== -1;
				else if ( operator === 'not_empty' ) match = val.length > 0;
				else if ( operator === 'empty' ) match = val.length === 0;

				var visible = action === 'show' ? match : ! match;
				$target.toggle( visible );
				$target.find( '[required]' ).prop( 'disabled', ! visible );
			}

			$form.on( 'input change', '[name="' + fieldName + '"], [name="' + fieldName + '[]"]', evaluate );
			evaluate();
		} );

		// Star Rating.
		$( '.boldform-lite-star-rating' ).each( function () {
			var $rating = $( this );
			var $field = $( '#' + $rating.data( 'field' ) );
			var $stars = $rating.find( '.boldform-lite-star' );

			$stars.on( 'mouseenter', function () {
				var val = $( this ).data( 'value' );
				$stars.each( function () {
					$( this ).toggleClass( 'is-hover', $( this ).data( 'value' ) <= val );
				} );
			} );

			$rating.on( 'mouseleave', function () {
				$stars.removeClass( 'is-hover' );
			} );

			$stars.on( 'click', function () {
				var val = $( this ).data( 'value' );
				$field.val( val ).trigger( 'change' );
				$stars.each( function () {
					$( this ).toggleClass( 'is-active', $( this ).data( 'value' ) <= val );
				} );
			} );
		} );

		// Slider Range value display.
		$( '.boldform-lite-slider input[type="range"]' ).on( 'input', function () {
			$( this ).closest( '.boldform-lite-slider' ).find( '.boldform-lite-slider__value' ).text( $( this ).val() );
		} );

		// Input Mask.
		$( 'input[data-mask]' ).each( function () {
			var $input = $( this );
			var mask = $input.data( 'mask' );
			if ( ! mask ) return;

			$input.on( 'input', function () {
				var raw = $input.val().replace( /[^\dA-Za-z]/g, '' );
				var result = '';
				var ri = 0;

				for ( var mi = 0; mi < mask.length && ri < raw.length; mi++ ) {
					var mc = mask[ mi ];
					if ( mc === '9' ) {
						if ( /\d/.test( raw[ ri ] ) ) { result += raw[ ri ]; ri++; } else { ri++; mi--; }
					} else if ( mc === 'A' ) {
						if ( /[A-Za-z]/.test( raw[ ri ] ) ) { result += raw[ ri ]; ri++; } else { ri++; mi--; }
					} else if ( mc === '*' ) {
						result += raw[ ri ]; ri++;
					} else {
						result += mc;
						if ( raw[ ri ] === mc ) ri++;
					}
				}
				$input.val( result );
			} );
		} );

		// Custom select & multiselect dropdown.
		$( 'select[data-boldform-select]' ).each( function () {
			var $select = $( this );
			var isMultiple = $select.data( 'multiple' ) === 1 || $select.data( 'multiple' ) === '1';
			var isSearchable = $select.data( 'searchable' ) === 1 || $select.data( 'searchable' ) === '1';
			var selected = [];
			var options = [];
			var placeholderText = '';

			$select.find( 'option' ).each( function () {
				var val = $( this ).val();
				if ( val === '' ) {
					placeholderText = $( this ).text();
				} else {
					var isSelected = $( this ).prop( 'selected' );
					options.push( { value: val, text: $( this ).text() } );
					if ( isSelected ) selected.push( val );
				}
			} );

			if ( ! placeholderText ) {
				placeholderText = isMultiple ? 'Select options\u2026' : 'Select\u2026';
			}

			var esc = function ( str ) { return $( '<span>' ).text( str ).html(); };
			var checkSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
			var searchSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

			var wrapClass = 'bf-select';
			if ( isMultiple ) wrapClass += ' bf-select--multi';

			var $wrap = $( '<div class="' + wrapClass + '"></div>' );
			var $trigger = $( '<div class="bf-select__trigger" tabindex="0" role="combobox" aria-expanded="false"></div>' );
			var $panel = $( '<div class="bf-select__panel"></div>' );
			var $list = $( '<div class="bf-select__list" role="listbox"></div>' );
			var $search = null;

			// Search goes inside the dropdown panel, above options.
			if ( isSearchable ) {
				var $searchWrap = $( '<div class="bf-select__search-wrap">' + searchSvg + '<input type="text" class="bf-select__panel-search" placeholder="Search\u2026" autocomplete="off"></div>' );
				$search = $searchWrap.find( 'input' );
				$panel.append( $searchWrap );
			}

			$panel.append( $list );
			$wrap.append( $trigger ).append( $panel );
			$select.after( $wrap );

			function findOpt( val ) {
				for ( var i = 0; i < options.length; i++ ) {
					if ( options[ i ].value === val ) return options[ i ];
				}
				return null;
			}

			function syncToSelect() {
				$select.find( 'option' ).each( function () {
					var v = $( this ).val();
					if ( v === '' ) return;
					$( this ).prop( 'selected', selected.indexOf( v ) !== -1 );
				} );
				$select.trigger( 'change' );
			}

			function renderTrigger() {
				var arrow = '<span class="bf-select__arrow"></span>';

				if ( isMultiple ) {
					if ( ! selected.length ) {
						$trigger.html( '<span class="bf-select__placeholder">' + esc( placeholderText ) + '</span>' + arrow );
					} else {
						var html = '<span class="bf-select__tags">';
						selected.forEach( function ( v ) {
							var o = findOpt( v );
							if ( o ) {
								html += '<span class="bf-select__tag">' + esc( o.text ) + '<button type="button" class="bf-select__tag-x" data-val="' + esc( v ) + '" aria-label="Remove">&times;</button></span>';
							}
						} );
						html += '</span>' + arrow;
						$trigger.html( html );
					}
				} else {
					var o = selected.length ? findOpt( selected[ 0 ] ) : null;
					if ( o ) {
						$trigger.html( '<span class="bf-select__value">' + esc( o.text ) + '</span>' + arrow );
					} else {
						$trigger.html( '<span class="bf-select__placeholder">' + esc( placeholderText ) + '</span>' + arrow );
					}
				}
			}

			function renderList( filter ) {
				var q = ( filter || '' ).toLowerCase();
				var html = '';

				options.forEach( function ( opt ) {
					if ( q && opt.text.toLowerCase().indexOf( q ) === -1 ) return;
					var active = selected.indexOf( opt.value ) !== -1;
					html += '<div class="bf-select__option' + ( active ? ' is-active' : '' ) + '" role="option" aria-selected="' + active + '" data-val="' + esc( opt.value ) + '">';
					if ( isMultiple ) {
						html += '<span class="bf-select__check">' + ( active ? checkSvg : '' ) + '</span>';
					}
					html += '<span class="bf-select__option-text">' + esc( opt.text ) + '</span>';
					if ( ! isMultiple && active ) {
						html += '<span class="bf-select__active-mark">' + checkSvg + '</span>';
					}
					html += '</div>';
				} );

				$list.html( html || '<div class="bf-select__empty">No results found</div>' );
			}

			function open() {
				if ( $wrap.hasClass( 'is-open' ) ) return;
				$wrap.addClass( 'is-open' );
				$trigger.attr( 'aria-expanded', 'true' );
				if ( $search ) {
					$search.val( '' ).focus();
				}
				renderList();
			}

			function close() {
				$wrap.removeClass( 'is-open' );
				$trigger.attr( 'aria-expanded', 'false' );
			}

			function toggle( val ) {
				if ( isMultiple ) {
					var idx = selected.indexOf( val );
					if ( idx !== -1 ) {
						selected.splice( idx, 1 );
					} else {
						selected.push( val );
					}
					renderTrigger();
				} else {
					selected = [ val ];
					close();
					renderTrigger();
				}
				syncToSelect();
				renderList( $search ? $search.val() : '' );
			}

			// Events.
			$trigger.on( 'click', function ( e ) {
				if ( $( e.target ).closest( '.bf-select__tag-x' ).length ) return;
				$wrap.hasClass( 'is-open' ) ? close() : open();
			} );

			$trigger.on( 'keydown', function ( e ) {
				if ( e.key === 'Enter' || e.key === ' ' ) { e.preventDefault(); open(); }
				if ( e.key === 'Escape' ) close();
			} );

			if ( $search ) {
				$search.on( 'input', function () {
					renderList( $( this ).val() );
				} );

				$search.on( 'keydown', function ( e ) {
					if ( e.key === 'Escape' ) close();
				} );
			}

			$trigger.on( 'click', '.bf-select__tag-x', function ( e ) {
				e.stopPropagation();
				toggle( $( this ).data( 'val' ) + '' );
			} );

			$list.on( 'click', '.bf-select__option', function () {
				toggle( $( this ).data( 'val' ) + '' );
			} );

			$( document ).on( 'click', function ( e ) {
				if ( ! $( e.target ).closest( $wrap ).length ) close();
			} );

			renderTrigger();
		} );
	}
);
