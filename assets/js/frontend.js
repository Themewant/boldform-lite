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

			// Validate all fields.
			$form.find( '.boldform-lite-form__field' ).each(
				function () {
					var $wrapper = $( this );
					var $required = $wrapper.find( 'input[required], textarea[required], select[required]' ).first();
					var $email = $wrapper.find( 'input[type="email"]' ).first();

					// Required check.
					if ( $required.length && $wrapper.data( 'error' ) ) {
						var val = $required.val();
						var type = $required.attr( 'type' ) || '';
						var isEmpty = false;

						if ( 'checkbox' === type || 'radio' === type ) {
							var name = $required.attr( 'name' );
							isEmpty = ! $form.find( 'input[name="' + name + '"]:checked' ).length;
						} else {
							isEmpty = ! val || ! $.trim( val );
						}

						if ( isEmpty ) {
							showFieldError( $wrapper, $wrapper.data( 'error' ) );
							valid = false;
							return;
						}
					}

					// Email format check.
					if ( $email.length ) {
						var emailVal = $.trim( $email.val() || '' );
						if ( emailVal && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( emailVal ) ) {
							showFieldError( $wrapper, 'Please enter a valid email address.' );
							valid = false;
						}
					}
				}
			);

			return valid;
		}

		// Disable native browser validation only when JS is loaded — keeps HTML5 required as fallback.
		$( '.boldform-lite-form' ).attr( 'novalidate', 'novalidate' );

		// ── Live email validation ──
		$( document ).on( 'blur', '.boldform-lite-form input[type="email"]', function () {
			var $input   = $( this );
			var $wrapper = $input.closest( '.boldform-lite-form__field' );
			var val      = $.trim( $input.val() || '' );

			// Clear any previous email error on this field.
			$wrapper.find( '.boldform-lite-form__field-error' ).remove();
			$wrapper.removeClass( 'is-invalid' );

			if ( val && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( val ) ) {
				showFieldError( $wrapper, boldformLiteFrontend.invalidEmail || 'Please enter a valid email address.' );
			}
		} );

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

				// Inside a builder editor preview (Gutenberg/Elementor) the form is
				// shown live for styling only — never submit it, which would create a
				// real entry straight from the editor.
				if ( $form.is( '[data-boldform-preview]' ) ) {
					event.preventDefault();
					return;
				}

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

							// Fallback: read redirect URL from form data attribute.
							if ( ! redirectUrl ) {
								redirectUrl = $form.data( 'redirect-url' ) || '';
							}

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

		// Conditional Logic — rule engine.
		( function () {
			/**
			 * Read the current value of a form field by name.
			 *
			 * @param {jQuery} $form
			 * @param {string} fieldName   e.g. "boldform_field_abc"
			 * @return {string}
			 */
			function getFieldVal( $form, fieldName ) {
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

			/**
			 * Test one condition against the current form state.
			 *
			 * @param {jQuery} $form
			 * @param {{field_id:string, operator:string, value:string}} cond
			 * @return {boolean}
			 */
			function testCondition( $form, cond ) {
				var raw = String( getFieldVal( $form, cond.field_id ) );
				var cv  = String( cond.value || '' );
				switch ( cond.operator ) {
					case 'is':           return raw === cv;
					case 'is_not':       return raw !== cv;
					case 'contains':     return raw.toLowerCase().indexOf( cv.toLowerCase() ) !== -1;
					case 'not_contains': return raw.toLowerCase().indexOf( cv.toLowerCase() ) === -1;
					case 'starts_with':  return raw.toLowerCase().indexOf( cv.toLowerCase() ) === 0;
					case 'ends_with':    return raw.toLowerCase().slice( -cv.length ) === cv.toLowerCase();
					case 'greater_than': return parseFloat( raw ) > parseFloat( cv );
					case 'less_than':    return parseFloat( raw ) < parseFloat( cv );
					case 'not_empty':    return raw.length > 0;
					case 'empty':        return raw.length === 0;
					default:             return false;
				}
			}

			// ── Multi-condition engine ─────────────────────────────────────────
			$( '.boldform-lite-form__field[data-bf-conditions]' ).each( function () {
				var $self  = $( this );
				var $form  = $self.closest( 'form' );
				var ruleset;
				try { ruleset = JSON.parse( $self.attr( 'data-bf-conditions' ) ); } catch ( e ) { return; }
				if ( ! ruleset || ! ruleset.conditions ) return;

				var conditions = ruleset.conditions;
				var action     = ruleset.action === 'hide' ? 'hide' : 'show';
				var logic      = ruleset.logic === 'OR' ? 'OR' : 'AND';

				// Collect watched field names.
				var watched = {};
				conditions.forEach( function ( c ) { if ( c.field_id ) watched[ c.field_id ] = true; } );

				function evaluate() {
					var results = conditions.map( function ( c ) { return testCondition( $form, c ); } );
					var conditionMet = logic === 'OR'
						? results.some( Boolean )
						: results.every( Boolean );

					var visible = action === 'show' ? conditionMet : ! conditionMet;
					$self.toggle( visible );
					$self.find( '[required]' ).prop( 'disabled', ! visible );
				}

				Object.keys( watched ).forEach( function ( fieldName ) {
					$form.on( 'input change', '[name="' + fieldName + '"], [name="' + fieldName + '[]"]', evaluate );
				} );
				evaluate();
			} );

			// ── Legacy single-rule fallback (data-cond-field) ──────────────────
			$( '.boldform-lite-form__field[data-cond-field]' ).each( function () {
				var $target   = $( this );
				var action    = $target.data( 'cond-action' ) || 'show';
				var fieldName = String( $target.data( 'cond-field' ) || '' );
				var operator  = $target.data( 'cond-operator' ) || 'is';
				var condValue = String( $target.data( 'cond-value' ) || '' );
				var $form     = $target.closest( 'form' );

				function legacyEval() {
					var cond = { field_id: fieldName, operator: operator, value: condValue };
					var match = testCondition( $form, cond );
					var visible = action === 'show' ? match : ! match;
					$target.toggle( visible );
					$target.find( '[required]' ).prop( 'disabled', ! visible );
				}

				$form.on( 'input change', '[name="' + fieldName + '"], [name="' + fieldName + '[]"]', legacyEval );
				legacyEval();
			} );
		}() );

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

		// Slider Range value display (single handle).
		$( '.boldform-lite-slider:not(.boldform-lite-slider--dual) input[type="range"]' ).on( 'input', function () {
			$( this ).closest( '.boldform-lite-slider' ).find( '.boldform-lite-slider__value' ).text( $( this ).val() );
		} );

		// Slider Range — dual handle (min + max).
		function initDualSlider( el ) {
			var $w = $( el );
			if ( $w.data( 'bfDualReady' ) ) {
				return;
			}
			var $min    = $w.find( '.boldform-lite-slider__input--min' );
			var $max    = $w.find( '.boldform-lite-slider__input--max' );
			var $fill   = $w.find( '.boldform-lite-slider__fill' );
			var $val    = $w.find( '.boldform-lite-slider__value' );
			var $hidden = $w.find( 'input[type="hidden"]' );
			var $track  = $w.find( '.boldform-lite-slider__track' );
			if ( ! $min.length || ! $max.length ) {
				return;
			}
			$w.data( 'bfDualReady', true );

			var rMin = parseFloat( $min.attr( 'min' ) );
			var rMax = parseFloat( $min.attr( 'max' ) );
			var span = ( rMax - rMin ) || 1;

			function update() {
				var lo = parseFloat( $min.val() );
				var hi = parseFloat( $max.val() );
				if ( lo > hi ) {
					var t = lo; lo = hi; hi = t;
				}
				$fill.css( { left: ( ( lo - rMin ) / span * 100 ) + '%', width: ( ( hi - lo ) / span * 100 ) + '%' } );
				$val.text( lo + ' – ' + hi );
				$hidden.val( lo + ' - ' + hi );
			}

			// Keep the thumbs from crossing.
			$min.on( 'input', function () {
				if ( parseFloat( $min.val() ) > parseFloat( $max.val() ) ) {
					$min.val( $max.val() );
				}
				update();
			} );
			$max.on( 'input', function () {
				if ( parseFloat( $max.val() ) < parseFloat( $min.val() ) ) {
					$max.val( $min.val() );
				}
				update();
			} );

			// Raise whichever thumb is nearest the pointer so overlapping thumbs stay grabbable.
			$track.on( 'pointerdown', function ( e ) {
				var rect  = this.getBoundingClientRect();
				var pct   = ( e.clientX - rect.left ) / rect.width * 100;
				var loPct = ( parseFloat( $min.val() ) - rMin ) / span * 100;
				var hiPct = ( parseFloat( $max.val() ) - rMin ) / span * 100;
				var minOnTop = Math.abs( pct - loPct ) <= Math.abs( pct - hiPct );
				$min.css( 'z-index', minOnTop ? 5 : 4 );
				$max.css( 'z-index', minOnTop ? 4 : 5 );
			} );

			update();
		}

		$( '.boldform-lite-slider--dual' ).each( function () {
			initDualSlider( this );
		} );

		// The block (ServerSideRender) and Elementor editors — plus popups/AJAX —
		// inject the slider markup after load, so DOM-ready init misses it. Watch
		// for sliders added later and initialise them so the fill tracks the handles
		// there too (otherwise the server-rendered fill never updates on drag).
		if ( window.MutationObserver ) {
			var dualObserver = new MutationObserver( function ( mutations ) {
				for ( var i = 0; i < mutations.length; i++ ) {
					var added = mutations[ i ].addedNodes;
					for ( var j = 0; j < added.length; j++ ) {
						var node = added[ j ];
						if ( 1 !== node.nodeType ) {
							continue;
						}
						if ( node.classList && node.classList.contains( 'boldform-lite-slider--dual' ) ) {
							initDualSlider( node );
						}
						if ( node.querySelectorAll ) {
							var nested = node.querySelectorAll( '.boldform-lite-slider--dual' );
							for ( var k = 0; k < nested.length; k++ ) {
								initDualSlider( nested[ k ] );
							}
						}
					}
				}
			} );
			dualObserver.observe( document.body, { childList: true, subtree: true } );
		}

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
		// The .bf-select HTML is rendered by PHP. JS only attaches behaviour.
		function initBoldformSelects( $scope ) {
			var $container = $scope || $( document );
			$container.find( '.bf-select[data-boldform-custom-select]' ).each( function () {
				if ( $( this ).data( 'bf-select-init' ) ) return;
				$( this ).data( 'bf-select-init', true );
				bindSelectBehaviour( $( this ) );
			} );
		}

		function bindSelectBehaviour( $wrap ) {
			var $select     = $wrap.prev( 'select[data-boldform-select]' );
			var $trigger    = $wrap.find( '.bf-select__trigger' );
			var $panel      = $wrap.find( '.bf-select__panel' );
			var $list       = $wrap.find( '.bf-select__list' );
			var $search     = $wrap.find( '.bf-select__panel-search' );
			var isMultiple  = $wrap.data( 'multiple' ) === 1 || $wrap.data( 'multiple' ) === '1';
			var isSearchable = $search.length > 0;

			var options = [];
			var selected = [];
			var placeholderText = '';

			$select.find( 'option' ).each( function () {
				var val = $( this ).val();
				if ( val === '' ) {
					placeholderText = $( this ).text();
				} else {
					options.push( { value: val, text: $( this ).text() } );
					if ( $( this ).prop( 'selected' ) ) selected.push( val );
				}
			} );

			if ( ! placeholderText ) {
				placeholderText = isMultiple ? 'Select options\u2026' : 'Select\u2026';
			}

			var esc = function ( str ) { return $( '<span>' ).text( str ).html(); };
			var checkSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

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
				var arrow = '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';

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
				if ( isSearchable ) {
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
				renderList( isSearchable ? $search.val() : '' );
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

			if ( isSearchable ) {
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
		}

		// Initialize on page load.
		initBoldformSelects();

		// Expose globally for external callers.
		window.boldformInitSelects = initBoldformSelects;

		// Re-initialize when Elementor editor re-renders a widget.
		function bindElementor() {
			if ( window.elementorFrontend && elementorFrontend.hooks ) {
				elementorFrontend.hooks.addAction( 'frontend/element_ready/boldform.default', function ( $scope ) {
					initBoldformSelects( $scope );
				} );
			}
		}

		if ( window.elementorFrontend ) {
			bindElementor();
		} else {
			$( window ).on( 'elementor/frontend/init', bindElementor );
		}

		// Fallback: observe DOM for .bf-select added dynamically (Elementor/Gutenberg AJAX render).
		// Skip on builder page (no forms to init) and debounce to avoid performance issues.
		if ( typeof MutationObserver !== 'undefined' && ! document.getElementById( 'boldform-builder-root' ) ) {
			var bfObserverTimer = null;
			var bfObserver = new MutationObserver( function () {
				if ( bfObserverTimer ) return;
				bfObserverTimer = setTimeout( function () {
					bfObserverTimer = null;
					initBoldformSelects();
				}, 200 );
			} );
			bfObserver.observe( document.body, { childList: true, subtree: true } );
		}
	}
);
