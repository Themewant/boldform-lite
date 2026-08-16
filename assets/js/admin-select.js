/**
 * Bulk-bar dropdowns.
 *
 * A native <select> renders its option list as an operating-system menu: on
 * macOS a floating panel with its own font, corner radius and blue pill
 * highlight, drawn outside the page entirely. No CSS reaches it — not the
 * panel, not the rows, not the checkmark. So once the closed control is styled
 * to match the plugin, the open list is the one part that still looks like
 * something else.
 *
 * This replaces the list with markup we own, and nothing else. The real
 * <select> stays in the DOM, keeps its name, id, `form` attribute and value,
 * and is still what submits — so `$('#boldform-bulk-action').val()` and every
 * other consumer is untouched. Selecting from the menu writes to it and fires
 * a real `change` event, which is what the Apply button listens for.
 *
 * Progressive by construction: with no JS the plain <select> is left exactly
 * as it was, styled and fully usable.
 *
 * @package BoldForm_Lite
 */
( function ( window, document ) {
	'use strict';

	// Every select inside a bulk bar, and only those. Row-level and settings
	// selects are deliberately left native.
	var SELECTOR = '.boldform-bulk-bar select';

	var openInstance = null;
	var idSeq = 0;

	function fire( el, type ) {
		el.dispatchEvent( new window.Event( type, { bubbles: true } ) );
	}

	function upgrade( select ) {
		if ( select.boldformSelect ) {
			return;
		}

		// Measured BEFORE the select is taken out of the flow. The native
		// control sizes itself to its widest option; the toggle shows only the
		// current one, so without this the control would shrink on upgrade and
		// then jump width every time the selection changed. Freezing it to what
		// the select already occupied means the bar does not move at all.
		var width = select.offsetWidth;
		var height = select.offsetHeight;

		var wrap = document.createElement( 'div' );
		var toggle = document.createElement( 'button' );
		var label = document.createElement( 'span' );
		var caret = document.createElement( 'span' );
		var menu = document.createElement( 'ul' );
		var items = [];
		var activeIndex = -1;
		var instance;

		menu.id = 'boldform-select-menu-' + ( ++idSeq );

		wrap.className = 'boldform-select';
		if ( width ) {
			wrap.style.minWidth = width + 'px';
		}
		if ( height ) {
			wrap.style.setProperty( '--boldform-select-h', height + 'px' );
		}

		toggle.type = 'button';
		toggle.className = 'boldform-select__toggle';
		toggle.setAttribute( 'aria-haspopup', 'listbox' );
		toggle.setAttribute( 'aria-expanded', 'false' );
		toggle.setAttribute( 'aria-controls', menu.id );
		// These selects carry no <label>. Their first option is the prompt —
		// "Bulk Actions", "All Status" — which is exactly the name a screen
		// reader needs, and it stops the accessible name changing to whatever
		// happens to be selected.
		toggle.setAttribute(
			'aria-label',
			select.getAttribute( 'aria-label' ) || ( select.options[ 0 ] ? select.options[ 0 ].text : '' )
		);
		if ( select.disabled ) {
			toggle.disabled = true;
		}

		label.className = 'boldform-select__label';
		caret.className = 'boldform-select__caret';
		caret.setAttribute( 'aria-hidden', 'true' );
		toggle.appendChild( label );
		toggle.appendChild( caret );

		menu.className = 'boldform-select__menu';
		menu.setAttribute( 'role', 'listbox' );
		menu.tabIndex = -1;
		menu.hidden = true;

		select.parentNode.insertBefore( wrap, select );
		wrap.appendChild( select );
		wrap.appendChild( toggle );
		wrap.appendChild( menu );

		select.classList.add( 'boldform-select__native' );
		// Not aria-hidden: a focusable element must never be hidden from the
		// accessibility tree. Taking it out of the tab order is enough — the
		// toggle is what a keyboard reaches.
		select.tabIndex = -1;

		Array.prototype.forEach.call( select.options, function ( option, index ) {
			var item = document.createElement( 'li' );

			item.className = 'boldform-select__option';
			item.id = menu.id + '-option-' + index;
			item.setAttribute( 'role', 'option' );
			item.setAttribute( 'aria-selected', 'false' );
			item.textContent = option.text;

			if ( option.disabled ) {
				item.classList.add( 'is-disabled' );
				item.setAttribute( 'aria-disabled', 'true' );
			}

			menu.appendChild( item );
			items.push( item );
		} );

		instance = { select: select, wrap: wrap, toggle: toggle, menu: menu };
		select.boldformSelect = instance;

		function sync() {
			var index = select.selectedIndex;
			var current = index >= 0 ? select.options[ index ] : null;

			label.textContent = current ? current.text : '';
			// The prompt option is not a choice, so it is not shown as one.
			toggle.classList.toggle( 'is-placeholder', !! current && '' === current.value );

			items.forEach( function ( item, i ) {
				var on = i === index;
				item.classList.toggle( 'is-selected', on );
				item.setAttribute( 'aria-selected', on ? 'true' : 'false' );
			} );
		}

		function setActive( index ) {
			if ( index < 0 || index >= items.length ) {
				return;
			}

			if ( activeIndex >= 0 && items[ activeIndex ] ) {
				items[ activeIndex ].classList.remove( 'is-active' );
			}

			activeIndex = index;
			items[ index ].classList.add( 'is-active' );
			menu.setAttribute( 'aria-activedescendant', items[ index ].id );

			if ( items[ index ].scrollIntoView ) {
				items[ index ].scrollIntoView( { block: 'nearest' } );
			}
		}

		// Skips disabled options in whichever direction it is walking, and
		// stops at the ends rather than wrapping.
		function step( from, delta ) {
			var i = from + delta;

			while ( i >= 0 && i < items.length ) {
				if ( ! items[ i ].classList.contains( 'is-disabled' ) ) {
					return i;
				}

				i += delta;
			}

			return from;
		}

		function open() {
			if ( openInstance && openInstance !== instance ) {
				openInstance.close();
			}

			menu.hidden = false;
			wrap.classList.add( 'is-open' );
			toggle.setAttribute( 'aria-expanded', 'true' );
			openInstance = instance;

			setActive( select.selectedIndex >= 0 ? select.selectedIndex : 0 );
			menu.focus();
		}

		function close( refocus ) {
			menu.hidden = true;
			wrap.classList.remove( 'is-open' );
			toggle.setAttribute( 'aria-expanded', 'false' );
			menu.removeAttribute( 'aria-activedescendant' );

			if ( activeIndex >= 0 && items[ activeIndex ] ) {
				items[ activeIndex ].classList.remove( 'is-active' );
			}

			activeIndex = -1;

			if ( openInstance === instance ) {
				openInstance = null;
			}

			if ( refocus ) {
				toggle.focus();
			}
		}

		function choose( index ) {
			if ( index < 0 || index >= select.options.length || select.options[ index ].disabled ) {
				return;
			}

			if ( select.selectedIndex !== index ) {
				select.selectedIndex = index;
				// Real events on the real control, so anything already bound to
				// this select — jQuery included — hears the change exactly as it
				// would from a native pick.
				fire( select, 'input' );
				fire( select, 'change' );
			}

			sync();
			close( true );
		}

		instance.close = close;
		instance.sync = sync;

		toggle.addEventListener( 'click', function () {
			if ( menu.hidden ) {
				open();
			} else {
				close( true );
			}
		} );

		toggle.addEventListener( 'keydown', function ( event ) {
			if ( 'ArrowDown' === event.key || 'ArrowUp' === event.key || ' ' === event.key || 'Enter' === event.key ) {
				event.preventDefault();
				open();
			}
		} );

		menu.addEventListener( 'keydown', function ( event ) {
			switch ( event.key ) {
				case 'ArrowDown':
					event.preventDefault();
					setActive( step( activeIndex, 1 ) );
					break;
				case 'ArrowUp':
					event.preventDefault();
					setActive( step( activeIndex, -1 ) );
					break;
				case 'Home':
					event.preventDefault();
					setActive( step( -1, 1 ) );
					break;
				case 'End':
					event.preventDefault();
					setActive( step( items.length, -1 ) );
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					choose( activeIndex );
					break;
				case 'Escape':
					event.preventDefault();
					close( true );
					break;
				case 'Tab':
					// Let focus go where it was going, but do not leave a menu
					// hanging open behind it.
					close( false );
					break;
				default:
					break;
			}
		} );

		menu.addEventListener( 'click', function ( event ) {
			var item = event.target.closest( '.boldform-select__option' );

			if ( item && ! item.classList.contains( 'is-disabled' ) ) {
				choose( items.indexOf( item ) );
			}
		} );

		menu.addEventListener( 'mousemove', function ( event ) {
			var item = event.target.closest( '.boldform-select__option' );

			if ( item ) {
				setActive( items.indexOf( item ) );
			}
		} );

		// Something else set the value — keep the label honest.
		select.addEventListener( 'change', sync );

		// Both ways, deliberately. jQuery's .trigger('change') does NOT dispatch
		// a native event for a <select> — there is no element.change() method for
		// it to call, so it runs jQuery's own handler queue and stops. A value
		// set the jQuery way would leave the toggle showing the old label. This
		// is opportunistic, not a dependency: without jQuery the line is skipped
		// and native events still work.
		if ( window.jQuery ) {
			window.jQuery( select ).on( 'change', sync );
		}

		sync();
	}

	// One document-level pair rather than a listener per instance.
	document.addEventListener( 'mousedown', function ( event ) {
		if ( openInstance && ! openInstance.wrap.contains( event.target ) ) {
			openInstance.close( false );
		}
	} );

	document.addEventListener( 'focusin', function ( event ) {
		if ( openInstance && ! openInstance.wrap.contains( event.target ) ) {
			openInstance.close( false );
		}
	} );

	function init() {
		Array.prototype.forEach.call( document.querySelectorAll( SELECTOR ), upgrade );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

	// Exposed so a page that injects a bulk bar later can upgrade it.
	window.boldformUpgradeSelects = init;
}( window, document ) );
