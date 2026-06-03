( function ( window, document ) {
	var activeDrag = null;

	function matches( element, selector ) {
		if ( ! element || 1 !== element.nodeType ) {
			return false;
		}

		return element.matches( selector );
	}

	function closestMatch( element, root, selector ) {
		while ( element && element !== root ) {
			if ( matches( element, selector ) ) {
				return element;
			}

			element = element.parentNode;
		}

		return matches( root, selector ) ? root : null;
	}

	function getItems( container, selector ) {
		return Array.prototype.slice.call( container.querySelectorAll( selector ) );
	}

	function getIndex( container, element, selector ) {
		return getItems( container, selector ).indexOf( element );
	}

	function clearPlaceholder() {
		if ( activeDrag && activeDrag.placeholder && activeDrag.placeholder.parentNode ) {
			activeDrag.placeholder.parentNode.removeChild( activeDrag.placeholder );
		}
	}

	function cleanup() {
		clearPlaceholder();
		activeDrag = null;
	}

	function canAccept( sortable ) {
		var sourceGroup;
		var targetGroup;

		if ( ! activeDrag ) {
			return false;
		}

		if ( activeDrag.source === sortable.el ) {
			// Dropping back onto the same list (i.e. reordering within it).
			// Reject this when internal sorting is disabled (`sort: false`) or
			// when the list is a clone-source palette (`pull: 'clone'`), such as
			// the field library: its items may be cloned out to the canvas but
			// must never be reordered or dropped back into the sidebar itself.
			var selfGroup = sortable.options.group || {};

			return false !== sortable.options.sort && 'clone' !== selfGroup.pull;
		}

		sourceGroup = activeDrag.sortable.options.group || {};
		targetGroup = sortable.options.group || {};

		if ( sourceGroup.name && targetGroup.name && sourceGroup.name !== targetGroup.name ) {
			return false;
		}

		return false !== targetGroup.put;
	}

	function createPlaceholder( element ) {
		var placeholder = document.createElement( 'div' );

		placeholder.className = 'boldform-sortable-placeholder';
		placeholder.style.height = element.offsetHeight + 'px';
		return placeholder;
	}

	function placePlaceholder( sortable, event ) {
		var container = sortable.el;
		var selector = sortable.options.draggable;
		var items = getItems( container, selector ).filter(
			function ( item ) {
				return item !== activeDrag.placeholder && item !== activeDrag.dragEl;
			}
		);
		var inserted = false;

		items.forEach(
			function ( item ) {
				var rect = item.getBoundingClientRect();

				if ( ! inserted && event.clientY < rect.top + rect.height / 2 ) {
					container.insertBefore( activeDrag.placeholder, item );
					inserted = true;
				}
			}
		);

		if ( ! inserted ) {
			container.appendChild( activeDrag.placeholder );
		}
	}

	function Sortable( el, options ) {
		this.el = el;
		this.options = options || {};
		this.bind();
	}

	Sortable.prototype.bind = function () {
		var sortable = this;
		var selector = sortable.options.draggable || '> *';
		var handleSelector = sortable.options.handle || null;

		if ( sortable.el.__boldformSortable ) {
			return;
		}

		sortable.el.__boldformSortable = sortable;

		sortable.el.addEventListener( 'dragstart', function ( event ) {
			var item;
			var group;
			var handle;

			// A nested sortable already claimed this drag — do not interfere.
			if ( activeDrag ) {
				return;
			}

			item = closestMatch( event.target, sortable.el, selector );
			group = sortable.options.group || {};

			if ( ! item ) {
				return;
			}

			if ( handleSelector ) {
				handle = closestMatch( event.target, item, handleSelector );

				if ( ! handle ) {
					return;
				}
			}

			activeDrag = {
				sortable: sortable,
				source: sortable.el,
				sourceIndex: getIndex( sortable.el, item, selector ),
				dragEl: item,
				placeholder: createPlaceholder( item ),
				cloneMode: 'clone' === group.pull
			};

			if ( event.dataTransfer ) {
				event.dataTransfer.effectAllowed = activeDrag.cloneMode ? 'copyMove' : 'move';
				event.dataTransfer.setData( 'text/plain', item.getAttribute( 'data-field-type' ) || item.getAttribute( 'data-field-id' ) || '' );
			}
		} );

		sortable.el.addEventListener( 'dragover', function ( event ) {
			if ( ! canAccept( sortable ) ) {
				return;
			}

			event.preventDefault();
			placePlaceholder( sortable, event );
		} );

		sortable.el.addEventListener( 'drop', function ( event ) {
			var item;
			var newIndex;
			var sortableEvent;
			var draggableItems;

			if ( ! canAccept( sortable ) ) {
				return;
			}

			event.preventDefault();
			placePlaceholder( sortable, event );

			item = activeDrag.cloneMode ? activeDrag.dragEl.cloneNode( true ) : activeDrag.dragEl;

			// Count only draggable siblings before the placeholder (excluding the dragged element itself) to get the correct data index.
			draggableItems = getItems( sortable.el, selector ).filter( function ( el ) {
				return el !== activeDrag.dragEl && el !== activeDrag.placeholder;
			} );
			newIndex = 0;
			draggableItems.forEach( function ( el ) {
				// If the element comes before the placeholder in DOM order, increment index.
				if ( activeDrag.placeholder.compareDocumentPosition( el ) & Node.DOCUMENT_POSITION_PRECEDING ) {
					newIndex++;
				}
			} );

			sortable.el.insertBefore( item, activeDrag.placeholder );

			sortableEvent = {
				item: item,
				from: activeDrag.source,
				to: sortable.el,
				oldIndex: activeDrag.sourceIndex,
				newIndex: newIndex
			};

			if ( activeDrag.cloneMode && typeof sortable.options.onAdd === 'function' ) {
				sortable.options.onAdd( sortableEvent );
			}

			if ( ! activeDrag.cloneMode && typeof sortable.options.onEnd === 'function' ) {
				sortable.options.onEnd( sortableEvent );
			}

			cleanup();
		} );

		sortable.el.addEventListener( 'dragend', function () {
			cleanup();
		} );
	};

	window.Sortable = {
		create: function ( el, options ) {
			return new Sortable( el, options );
		}
	};
}( window, document ) );
