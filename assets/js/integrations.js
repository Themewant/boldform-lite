/**
 * BoldForm Integrations — Builder assign panel
 *
 * Injects an "Integrations" tab into the form settings panel.
 * Users pick which globally-configured connections to activate for this form,
 * then map the Email / First Name / Last Name fields for each connection.
 *
 * Global connections are loaded from boldformLiteBuilder.globalConnections.
 * Assignment + field map are synced to formSettings via boldform:before_save.
 */
( function ( $ ) {
	'use strict';

	var cfg        = window.boldformLiteBuilder || {};
	var ajaxUrl    = cfg.ajaxUrl || '';
	var nonce      = cfg.integrationsNonce || '';
	var adminUrl   = cfg.integrationsAdminUrl || '';

	// Global connections catalogue (loaded from PHP, never mutated here).
	var globalConns = Array.isArray( cfg.globalConnections ) ? cfg.globalConnections : [];

	// Per-form state — populated from formSettings on render.
	var assignedIds = [];    // string[]  — connection IDs active for this form
	var fieldMap    = {};    // { [connId]: { email, fname, lname } }

	// =========================================================================
	// Helpers
	// =========================================================================

	function escHtml( s ) {
		return $( '<div>' ).text( String( s || '' ) ).html();
	}

	function connById( id ) {
		return globalConns.find( function ( c ) { return c.id === id; } ) || null;
	}

	function isAssigned( id ) {
		return assignedIds.indexOf( id ) !== -1;
	}

	/** Pull form fields from live builder state for field-mapping dropdowns. */
	function getFormFields() {
		var fields = [];
		var state  = window.boldformBuilderState;
		if ( ! state ) return fields;
		state.structure.rows.forEach( function ( row ) {
			row.columns.forEach( function ( col ) {
				col.fields.forEach( function ( f ) {
					var skip = [ 'submit', 'section_break', 'html_editor', 'paragraph', 'page_break' ];
					if ( skip.indexOf( f.type ) !== -1 ) return;
					fields.push( { id: f.id, label: f.label || f.type } );
				} );
			} );
		} );
		return fields;
	}

	function fieldOptions( selectedId ) {
		var fields = getFormFields();
		var opts = '<option value="">— map field —</option>';
		fields.forEach( function ( f ) {
			opts += '<option value="' + escHtml( f.id ) + '"' + ( f.id === selectedId ? ' selected' : '' ) + '>' + escHtml( f.label ) + '</option>';
		} );
		return opts;
	}

	// =========================================================================
	// Render pane
	// =========================================================================

	function renderPane( formSettings ) {
		// Sync from formSettings snapshot.
		if ( formSettings ) {
			assignedIds = Array.isArray( formSettings.assigned_connections ) ? formSettings.assigned_connections.slice() : [];
			fieldMap    = ( formSettings.connection_field_map && typeof formSettings.connection_field_map === 'object' )
				? $.extend( true, {}, formSettings.connection_field_map )
				: {};
		}

		var html = '<div class="bf-assign-pane">';

		// ── No connections message ──────────────────────────────────────────
		if ( ! globalConns.length ) {
			html +=
				'<div class="bf-assign-empty">' +
					'<span class="dashicons dashicons-randomize"></span>' +
					'<p>No connections configured yet.</p>' +
					( adminUrl ? '<a href="' + escHtml( adminUrl ) + '" target="_blank" class="button button-primary">Configure Integrations</a>' : '' ) +
				'</div>';
			html += '</div>';
			return html;
		}

		// ── Connection cards ────────────────────────────────────────────────
		html += '<div class="bf-assign-grid">';

		globalConns.forEach( function ( conn ) {
			var on  = isAssigned( conn.id );
			var cls = 'bf-assign-card' + ( on ? ' is-on' : '' );
			html +=
				'<div class="' + cls + '" data-conn-id="' + escHtml( conn.id ) + '">' +
					'<div class="bf-assign-card__check">' +
						( on ? '<span class="dashicons dashicons-yes-alt"></span>' : '<span class="dashicons dashicons-marker"></span>' ) +
					'</div>' +
					'<div class="bf-assign-card__info">' +
						'<span class="bf-assign-card__name">' + escHtml( conn.name ) + '</span>' +
						'<span class="bf-assign-card__type">' + escHtml( conn.type ) + '</span>' +
					'</div>' +
					'<label class="bf-int-toggle" title="' + ( on ? 'Disable' : 'Enable' ) + ' for this form">' +
						'<input type="checkbox" class="bf-assign-toggle" data-conn-id="' + escHtml( conn.id ) + '"' + ( on ? ' checked' : '' ) + '>' +
						'<span class="bf-int-toggle__track"></span>' +
					'</label>' +
				'</div>';
		} );

		html += '</div>'; // .bf-assign-grid

		// ── Field mapping for assigned connections ──────────────────────────
		html += '<div class="bf-assign-maps" id="bf-assign-maps">';

		if ( assignedIds.length ) {
			html += renderFieldMaps();
		}

		html += '</div>';

		// ── Manage link ─────────────────────────────────────────────────────
		if ( adminUrl ) {
			html +=
				'<div class="bf-assign-footer">' +
					'<a href="' + escHtml( adminUrl ) + '" target="_blank" class="bf-assign-manage-link">' +
						'<span class="dashicons dashicons-external"></span> Manage Connections' +
					'</a>' +
				'</div>';
		}

		html += '</div>'; // .bf-assign-pane
		return html;
	}

	function renderFieldMaps() {
		var html = '<h4 class="bf-assign-maps__title">Field Mapping</h4>';

		assignedIds.forEach( function ( connId ) {
			var conn = connById( connId );
			if ( ! conn ) return;
			var map = fieldMap[ connId ] || {};

			html +=
				'<div class="bf-assign-map" data-conn-id="' + escHtml( connId ) + '">' +
					'<div class="bf-assign-map__head">' +
						'<span class="bf-assign-map__name">' + escHtml( conn.name ) + '</span>' +
						'<span class="bf-assign-map__type">' + escHtml( conn.type ) + '</span>' +
					'</div>' +
					'<div class="bf-assign-map__rows">' +

						'<div class="bf-assign-map__row">' +
							'<label class="bf-assign-map__label">Email <span class="bf-assign-map__req">*</span></label>' +
							'<select class="bf-assign-map__select" data-conn-id="' + escHtml( connId ) + '" data-map-key="email">' +
								fieldOptions( map.email || '' ) +
							'</select>' +
						'</div>' +

						'<div class="bf-assign-map__row">' +
							'<label class="bf-assign-map__label">First Name</label>' +
							'<select class="bf-assign-map__select" data-conn-id="' + escHtml( connId ) + '" data-map-key="fname">' +
								fieldOptions( map.fname || '' ) +
							'</select>' +
						'</div>' +

						'<div class="bf-assign-map__row">' +
							'<label class="bf-assign-map__label">Last Name</label>' +
							'<select class="bf-assign-map__select" data-conn-id="' + escHtml( connId ) + '" data-map-key="lname">' +
								fieldOptions( map.lname || '' ) +
							'</select>' +
						'</div>' +

					'</div>' +
				'</div>';
		} );

		return html;
	}

	// =========================================================================
	// Inject tab into builder form settings panel
	// =========================================================================

	function injectTab( formSettings ) {
		var $panel   = $( '#boldform-form-settings-panel' );
		var $navSlot = $panel.find( '.bfsп-stab-nav-pro-slots' );
		var $content = $panel.find( '.bfsп-stab-content' );

		if ( ! $navSlot.length || ! $content.length ) return;

		// Remove stale injected elements.
		$panel.find( '.bfsп-stab-nav-item[data-stab="integrations"]' ).remove();
		$panel.find( '.bfsп-stab-pane[data-pane="integrations"]' ).remove();

		var count   = assignedIds.length;
		var countBadge = count ? ' <span class="bf-int-count-badge">' + count + '</span>' : '';

		$navSlot.append(
			'<button type="button" class="bfsп-stab-nav-item" data-stab="integrations">' +
				'<span class="bfsп-stab-nav-icon">&#9741;</span>' +
				'<span class="bfsп-stab-nav-text">' +
					'<span class="bfsп-stab-nav-label">Integrations' + countBadge + '</span>' +
					'<span class="bfsп-stab-nav-desc">Assign connections</span>' +
				'</span>' +
				'<span class="bfsп-stab-nav-arrow">&#8250;</span>' +
			'</button>'
		);

		var $pane = $( '<div class="bfsп-stab-pane" data-pane="integrations"></div>' );
		$pane.html( renderPane( formSettings ) );
		$content.append( $pane );
	}

	// =========================================================================
	// Event handlers
	// =========================================================================

	$( document ).on( 'boldform:form_settings_rendered', function ( e, formSettings ) {
		injectTab( formSettings );
	} );

	// Toggle a connection on/off for this form.
	$( document ).on( 'change', '.bf-assign-toggle', function () {
		var connId = String( $( this ).data( 'conn-id' ) );
		var on     = $( this ).is( ':checked' );

		if ( on ) {
			if ( assignedIds.indexOf( connId ) === -1 ) assignedIds.push( connId );
			if ( ! fieldMap[ connId ] ) fieldMap[ connId ] = { email: '', fname: '', lname: '' };
		} else {
			assignedIds = assignedIds.filter( function ( id ) { return id !== connId; } );
		}

		// Update card class.
		var $card = $( '.bf-assign-card[data-conn-id="' + connId + '"]' );
		$card.toggleClass( 'is-on', on );
		$card.find( '.bf-assign-card__check .dashicons' )
			.toggleClass( 'dashicons-yes-alt', on )
			.toggleClass( 'dashicons-marker', ! on );

		// Re-render maps section.
		$( '#bf-assign-maps' ).html( assignedIds.length ? renderFieldMaps() : '' );

		// Update count badge in nav.
		var $badge = $( '.bfsп-stab-nav-item[data-stab="integrations"] .bf-int-count-badge' );
		if ( assignedIds.length ) {
			if ( $badge.length ) {
				$badge.text( assignedIds.length );
			} else {
				$( '.bfsп-stab-nav-item[data-stab="integrations"] .bfsп-stab-nav-label' ).append(
					' <span class="bf-int-count-badge">' + assignedIds.length + '</span>'
				);
			}
		} else {
			$badge.remove();
		}
	} );

	// Field mapping select change.
	$( document ).on( 'change', '.bf-assign-map__select', function () {
		var connId = String( $( this ).data( 'conn-id' ) );
		var key    = String( $( this ).data( 'map-key' ) );
		if ( ! fieldMap[ connId ] ) fieldMap[ connId ] = {};
		fieldMap[ connId ][ key ] = $( this ).val() || '';
	} );

	// Before save — write back into formSettings.
	$( document ).on( 'boldform:before_save', function ( e, formSettings ) {
		formSettings.assigned_connections  = assignedIds.slice();
		formSettings.connection_field_map  = $.extend( true, {}, fieldMap );
	} );

}( jQuery ) );
