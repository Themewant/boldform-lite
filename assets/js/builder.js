jQuery(
	function ( $ ) {
		var optionFieldTypes = [ 'select', 'multiselect', 'checkbox', 'radio' ];
		var specialFieldTypes = [ 'captcha', 'section_break', 'terms_conditions', 'file', 'submit', 'paragraph', 'html_editor', 'name', 'address', 'product', 'quantity', 'custom_amount', 'order_summary', 'signature', 'hidden_field', 'image_choice', 'repeater', 'password_field', 'rich_text', 'date_range', 'nps', 'matrix', 'lookup', 'geolocation', 'page_break' ];
		var submitButtonId = '__boldform_submit_button__';
		var state = {
			formId: Number( boldformLiteBuilder.formId || 0 ),
			formTitle: boldformLiteBuilder.formTitle || boldformLiteBuilder.defaultFormTitle,
			structure: normalizeStructure( boldformLiteBuilder.formStructure ),
			formSettings: normalizeFormSettings( boldformLiteBuilder.formSettings ),
			selectedFieldId: null,
			selectedRowIndex: null,
			activeColumn: null,
			activeSidebarTab: 'library',
			activeEditorView: 'builder',
			activeSettingsAccordion: 'settings',
			selectedTemplate: 'contact',
			activeDevice: 'desktop'
		};

		// Escapes for HTML text AND attribute contexts: encodes < > & plus both quote
		// characters, so the result is safe to interpolate inside quote-delimited
		// attribute values. In text context the extra quote-encoding renders identically.
		function escapeHtml( value ) {
			return $( '<div />' ).text( value || '' ).html()
				.replace( /"/g, '&quot;' ).replace( /'/g, '&#39;' );
		}

		function generateId() {
			return 'bf_' + Date.now() + '_' + Math.floor( Math.random() * 100000 );
		}

		// Announce builder mutations to assistive tech (drag/add/delete have no visible
		// status text otherwise). Safe no-op if wp.a11y isn't present.
		function announce( key ) {
			var messages = boldformLiteBuilder.a11y || {};
			if ( messages[ key ] && window.wp && wp.a11y && typeof wp.a11y.speak === 'function' ) {
				wp.a11y.speak( messages[ key ] );
			}
		}

		function getLibraryItem( type ) {
			return boldformLiteBuilder.fieldLibrary[ type ] || { label: type, icon: 'dashicons-editor-textcolor', group: 'basic' };
		}

		function hasSubmitField() {
			var found = false;
			state.structure.rows.forEach( function ( row ) {
				row.columns.forEach( function ( col ) {
					col.fields.forEach( function ( f ) {
						if ( 'submit' === f.type ) { found = true; }
					});
				});
			});
			return found;
		}

		function normalizeFormSettings( settings ) {
			var submissionType = settings && settings.submission_type ? settings.submission_type : ( settings && settings.enable_redirect ? 'redirect' : 'ajax' );
			var adminEmail = settings && settings.admin_email ? settings.admin_email : '';
			var adminEmailType = settings && settings.admin_email_type ? settings.admin_email_type : ( adminEmail ? 'custom' : 'site_admin' );

			var normalized = {
				submission_type: submissionType,
				enable_ajax: 'ajax' === submissionType,
				enable_redirect: 'redirect' === submissionType,
				redirect_type: settings && settings.redirect_type ? settings.redirect_type : ( settings && settings.redirect_url ? 'custom' : 'page' ),
				redirect_url: settings && settings.redirect_url ? settings.redirect_url : '',
				thank_you_message: settings && settings.thank_you_message ? settings.thank_you_message : ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.thankYouMessage || 'Thanks! Your form was submitted successfully.' ),
				// Default ONLY when button_text was never set (new form). An explicit
				// empty string is a deliberate icon-only button, so it must survive a
				// reload — a truthiness check would wrongly reset '' back to 'Submit'.
				// Mirrors the server default logic (shortcode uses isset(), not truthy).
				button_text: settings && typeof settings.button_text !== 'undefined' ? settings.button_text : ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.submitText || 'Submit' ),
				button_alignment: settings && settings.button_alignment ? settings.button_alignment : 'left',
				button_icon_type: settings && settings.button_icon_type ? settings.button_icon_type : 'none',
				button_icon_dashicon: settings && settings.button_icon_dashicon ? settings.button_icon_dashicon : 'dashicons-arrow-right-alt',
				button_icon_svg: settings && settings.button_icon_svg ? settings.button_icon_svg : '',
				button_icon_position: settings && settings.button_icon_position ? settings.button_icon_position : 'right',
				button_icon_gap: settings && settings.button_icon_gap !== '' && typeof settings.button_icon_gap !== 'undefined' ? settings.button_icon_gap : '8',
				button_icon_size: settings && settings.button_icon_size !== '' && typeof settings.button_icon_size !== 'undefined' ? settings.button_icon_size : '18',
				button_icon_color: settings && settings.button_icon_color ? settings.button_icon_color : '',
				button_color: settings && settings.button_color ? settings.button_color : 'teal',
				field_style: settings && settings.field_style ? settings.field_style : '',
				field_size: settings && settings.field_size ? settings.field_size : 'small',
				field_focus_color: settings && settings.field_focus_color ? settings.field_focus_color : '',
				field_border_width: settings && settings.field_border_width !== '' && typeof settings.field_border_width !== 'undefined' ? Number( settings.field_border_width ) : '',
				field_border_radius: settings && settings.field_border_radius !== '' && typeof settings.field_border_radius !== 'undefined' ? Number( settings.field_border_radius ) : '',
				field_background_color: settings && settings.field_background_color ? settings.field_background_color : '',
				field_border_color: settings && settings.field_border_color ? settings.field_border_color : '',
				field_text_color: settings && settings.field_text_color ? settings.field_text_color : '',
				label_size: settings && settings.label_size ? settings.label_size : '',
				label_color: settings && settings.label_color ? settings.label_color : '',
				label_subtext_color: settings && settings.label_subtext_color ? settings.label_subtext_color : '',
				error_color: settings && settings.error_color ? settings.error_color : '',
				button_size: settings && settings.button_size ? settings.button_size : 'small',
				button_border_style: settings && settings.button_border_style ? settings.button_border_style : '',
				button_border_width: settings && settings.button_border_width !== '' && typeof settings.button_border_width !== 'undefined' ? Number( settings.button_border_width ) : '',
				button_border_radius: settings && settings.button_border_radius !== '' && typeof settings.button_border_radius !== 'undefined' ? Number( settings.button_border_radius ) : '',
				button_background_color: settings && settings.button_background_color ? settings.button_background_color : '',
				button_border_color: settings && settings.button_border_color ? settings.button_border_color : '',
				button_text_color: settings && settings.button_text_color ? settings.button_text_color : '',
				admin_email_type: adminEmailType,
				enable_admin_email: ! settings || typeof settings.enable_admin_email === 'undefined' ? true : !! settings.enable_admin_email,
				enable_user_email: ! settings || typeof settings.enable_user_email === 'undefined' ? true : !! settings.enable_user_email,
				admin_email: adminEmail,
				design_theme: settings && settings.design_theme ? settings.design_theme : '',
				hide_labels: false,
				hide_placeholders: false,
				dup_enabled:  settings && settings.dup_enabled  ? true : false,
				dup_method:   settings && settings.dup_method   ? settings.dup_method   : 'email',
				dup_field_id: settings && settings.dup_field_id ? settings.dup_field_id : '',
				dup_message:  settings && settings.dup_message  ? settings.dup_message  : '',
				style: normalizeStyleSettings( settings && settings.style ),
			};

			// Preserve any extra keys (e.g. Pro module settings like Scheduling's
			// schedule_*) that Lite localizes but doesn't model above, so their builder
			// panes can repopulate saved values on reload. The core keys normalized
			// above always win; unknown keys pass through untouched. Pro re-collects its
			// own live values on boldform:before_save, so this is purely a read passthrough.
			return $.extend( {}, settings, normalized );
		}

		// Advanced per-device style vars written by the Style tab. Shape:
		// { desktop: { '--bf-*': value }, tablet: {…}, mobile: {…} }. Mirrors the
		// PHP normalize_style_settings(); only BoldForm-namespaced string vars survive.
		function normalizeStyleSettings( style ) {
			var out = { desktop: {}, tablet: {}, mobile: {} };
			if ( ! style || typeof style !== 'object' ) {
				return out;
			}
			[ 'desktop', 'tablet', 'mobile' ].forEach( function ( device ) {
				if ( style[ device ] && typeof style[ device ] === 'object' ) {
					Object.keys( style[ device ] ).forEach( function ( key ) {
						if ( /^--bf-[a-z0-9-]+$/.test( key ) && typeof style[ device ][ key ] === 'string' ) {
							out[ device ][ key ] = style[ device ][ key ];
						}
					} );
				}
			} );
			return out;
		}

		// Default placeholder text for a field type (localized in PHP). Pre-filled into a
		// new field's Placeholder setting so the same value shows in settings, canvas,
		// preview and on the front end; users can edit or clear it per field.
		function getDefaultPlaceholder( type ) {
			var map = ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.placeholders ) || {};
			return typeof map[ type ] !== 'undefined' ? map[ type ] : '';
		}

		function createField( type ) {
			var libraryItem = getLibraryItem( type );

			return {
				id: generateId(),
				type: type,
				label: libraryItem.label,
				placeholder: getDefaultPlaceholder( type ),
				required: false,
				default_value: '',
				options: optionFieldTypes.indexOf( type ) !== -1 ? [ boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.option1 || 'Option 1', boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.option2 || 'Option 2' ] : [],
				options_layout: optionFieldTypes.indexOf( type ) !== -1 ? 'block' : '',
				checkbox_style: 'checkbox' === type ? 'default' : '',
				content: 'terms_conditions' === type ? ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.termsContent || 'I agree to the <a href="#">terms and conditions</a>.' ) : '',
				description: 'section_break' === type ? ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.sectionDesc || 'Add a short description for this section.' ) : '',
				custom_error: '',
				allowed_types: 'file' === type ? '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx' : '',
				max_file_size: 'file' === type ? '5' : '',
				css_class: '',
				label_placement: 'top',
				show_middle_name: true,
				show_last_name: true,
				address_fields: { street: true, city: true, state: true, zip: true, country: true },
				address_order: [ 'street', 'city', 'state', 'zip', 'country' ],
				conditional: { enabled: false, action: 'show', field_id: '', operator: 'is', value: '' },
				select_searchable: false,
				select_multiple: false,
				mask_pattern: '',
				min_value: '',
				max_value: '',
				step_value: '',
				max_stars: 5,
				star_color: '',
				star_inactive_color: '',
				star_size: '20',
				slider_color: '',
				slider_height: '',
				dual_handle: false,
				step_title: '',
				next_text: '',
				prev_text: '',
				btn_color: '',
				btn_text_color: '',
				btn_size: '',
				btn_radius: '',
				progress_color: '',
				progress_style: '',
				product_options: 'product' === type ? [ { label: 'Option 1', price: '10.00' } ] : [],
				product_style: 'product' === type ? 'radio' : '',
				linked_product: 'quantity' === type ? '' : '',
				qty_min: 'quantity' === type ? '1' : '',
				qty_max: 'quantity' === type ? '' : '',
				qty_default: 'quantity' === type ? '1' : '',
				amount_min: 'custom_amount' === type ? '0.00' : '',
				amount_max: 'custom_amount' === type ? '' : '',
				amount_default: 'custom_amount' === type ? '0.00' : '',
				auto_populate_key: '',
				calc_formula:  'calculation' === type ? '' : '',
				calc_decimals: 'calculation' === type ? 2 : 2,
				calc_prefix:   '',
				calc_suffix:   '',
				// Seed a new repeater with two text sub-fields so the settings list, the
				// canvas preview AND the front end all show real, editable sub-fields from
				// the start (a repeater with zero sub-fields renders an empty, unusable row).
				repeater_fields: 'repeater' === type ? [
					{ id: 'sf_' + Math.random().toString( 36 ).slice( 2, 8 ), type: 'text', label: '', placeholder: '', required: false },
					{ id: 'sf_' + Math.random().toString( 36 ).slice( 2, 8 ), type: 'text', label: '', placeholder: '', required: false }
				] : []
			};
		}

		function createTemplateField( type, overrides ) {
			var field = createField( type );

			return $.extend( true, field, overrides || {} );
		}

		function normalizeField( field ) {
			var type = field && field.type ? field.type : 'text';
			var normalized = createField( type );

			normalized.id = field && field.id ? field.id : generateId();
			normalized.label = field && typeof field.label !== 'undefined' ? field.label : normalized.label;
			normalized.placeholder = field && typeof field.placeholder !== 'undefined' ? field.placeholder : '';
			normalized.required = !! ( field && field.required );
			normalized.default_value = field && typeof field.default_value !== 'undefined' ? field.default_value : '';
			normalized.options = field && Array.isArray( field.options ) ? field.options : normalized.options;
			normalized.options_layout = field && field.options_layout ? field.options_layout : normalized.options_layout;
			normalized.checkbox_style = field && 'switch' === field.checkbox_style ? 'switch' : normalized.checkbox_style;
			normalized.content = field && typeof field.content !== 'undefined' ? field.content : normalized.content;
			normalized.description = field && typeof field.description !== 'undefined' ? field.description : normalized.description;
			normalized.custom_error = field && typeof field.custom_error !== 'undefined' ? field.custom_error : '';
			normalized.allowed_types = field && typeof field.allowed_types !== 'undefined' ? field.allowed_types : normalized.allowed_types;
			normalized.max_file_size = field && typeof field.max_file_size !== 'undefined' ? field.max_file_size : normalized.max_file_size;
			normalized.css_class = field && typeof field.css_class !== 'undefined' ? field.css_class : '';
			normalized.label_placement = field && field.label_placement ? field.label_placement : 'top';
			normalized.show_middle_name = ! field || typeof field.show_middle_name === 'undefined' ? true : !! field.show_middle_name;
			normalized.show_last_name = ! field || typeof field.show_last_name === 'undefined' ? true : !! field.show_last_name;
			normalized.address_fields = field && field.address_fields ? {
				street: typeof field.address_fields.street === 'undefined' ? true : !! field.address_fields.street,
				city: typeof field.address_fields.city === 'undefined' ? true : !! field.address_fields.city,
				state: typeof field.address_fields.state === 'undefined' ? true : !! field.address_fields.state,
				zip: typeof field.address_fields.zip === 'undefined' ? true : !! field.address_fields.zip,
				country: typeof field.address_fields.country === 'undefined' ? true : !! field.address_fields.country
			} : { street: true, city: true, state: true, zip: true, country: true };
			normalized.address_order = field && Array.isArray( field.address_order ) && field.address_order.length ? field.address_order : [ 'street', 'city', 'state', 'zip', 'country' ];
			if ( field && field.conditional ) {
				var rawCond = field.conditional;
				// Preserve the saved multi-condition structure; fall back to the
				// legacy flat { field_id, operator, value } shape for old forms.
				var condList = Array.isArray( rawCond.conditions ) && rawCond.conditions.length
					? rawCond.conditions.map( function ( c ) {
						c = c || {};
						return {
							field_id: c.field_id || '',
							operator: c.operator || 'is',
							value: typeof c.value !== 'undefined' && c.value !== null ? c.value : ''
						};
					} )
					: [ {
						field_id: rawCond.field_id || '',
						operator: rawCond.operator || 'is',
						value: rawCond.value || ''
					} ];
				normalized.conditional = {
					enabled: !! rawCond.enabled,
					action: rawCond.action || 'show',
					logic: 'OR' === String( rawCond.logic || '' ).toUpperCase() ? 'OR' : 'AND',
					conditions: condList
				};
			} else {
				normalized.conditional = { enabled: false, action: 'show', logic: 'AND', conditions: [ { field_id: '', operator: 'is', value: '' } ] };
			}
			normalized.select_searchable = !! ( field && field.select_searchable );
			normalized.select_multiple = !! ( field && field.select_multiple );
			normalized.mask_pattern = field && typeof field.mask_pattern !== 'undefined' ? field.mask_pattern : '';
			normalized.min_value = field && typeof field.min_value !== 'undefined' ? field.min_value : '';
			normalized.max_value = field && typeof field.max_value !== 'undefined' ? field.max_value : '';
			normalized.step_value = field && typeof field.step_value !== 'undefined' ? field.step_value : '';
			normalized.max_stars = field && field.max_stars ? Number( field.max_stars ) : 5;
			// Treat the legacy forced default (#f59e0b) as "unset" so existing star
			// fields follow the theme accent; a deliberate custom color is kept.
			normalized.star_color = field && field.star_color && '#f59e0b' !== field.star_color ? field.star_color : '';
			normalized.star_inactive_color = field && field.star_inactive_color ? field.star_inactive_color : '';
			normalized.star_size = field && field.star_size ? field.star_size : '20';
			normalized.slider_color = field && field.slider_color ? field.slider_color : '';
			normalized.slider_height = field && field.slider_height ? field.slider_height : '';
			normalized.dual_handle = !! ( field && field.dual_handle );
			normalized.step_title = field && typeof field.step_title !== 'undefined' ? field.step_title : '';
			normalized.next_text = field && typeof field.next_text !== 'undefined' ? field.next_text : 'Next';
			normalized.prev_text = field && typeof field.prev_text !== 'undefined' ? field.prev_text : 'Previous';
			normalized.btn_color = field && typeof field.btn_color !== 'undefined' ? field.btn_color : '';
			normalized.btn_text_color = field && typeof field.btn_text_color !== 'undefined' ? field.btn_text_color : '';
			normalized.btn_size = field && typeof field.btn_size !== 'undefined' ? field.btn_size : 'medium';
			normalized.btn_radius = field && typeof field.btn_radius !== 'undefined' ? field.btn_radius : '';
			normalized.progress_color = field && typeof field.progress_color !== 'undefined' ? field.progress_color : '';
			normalized.progress_style = field && typeof field.progress_style !== 'undefined' ? field.progress_style : 'bar';
			normalized.product_options = field && Array.isArray( field.product_options ) ? field.product_options : [];
			normalized.product_style = field && field.product_style ? field.product_style : 'radio';
			normalized.linked_product = field && typeof field.linked_product !== 'undefined' ? field.linked_product : '';
			normalized.qty_min = field && typeof field.qty_min !== 'undefined' ? field.qty_min : '1';
			normalized.qty_max = field && typeof field.qty_max !== 'undefined' ? field.qty_max : '';
			normalized.qty_default = field && typeof field.qty_default !== 'undefined' ? field.qty_default : '1';
			normalized.amount_min = field && typeof field.amount_min !== 'undefined' ? field.amount_min : '';
			normalized.amount_max = field && typeof field.amount_max !== 'undefined' ? field.amount_max : '';
			normalized.amount_default = field && typeof field.amount_default !== 'undefined' ? field.amount_default : '';
			normalized.auto_populate_key = field && typeof field.auto_populate_key !== 'undefined' ? field.auto_populate_key : '';
			normalized.calc_formula   = field && typeof field.calc_formula  !== 'undefined' ? field.calc_formula  : '';
			normalized.calc_decimals  = field && typeof field.calc_decimals !== 'undefined' ? Number( field.calc_decimals ) : 2;
			normalized.calc_prefix    = field && typeof field.calc_prefix   !== 'undefined' ? field.calc_prefix   : '';
			normalized.calc_suffix    = field && typeof field.calc_suffix   !== 'undefined' ? field.calc_suffix   : '';

			// Signature field defaults.
			normalized.sig_pen_color  = field && field.sig_pen_color  ? field.sig_pen_color  : '#000000';
			normalized.sig_pen_width  = field && field.sig_pen_width  ? Number( field.sig_pen_width )  : 2;
			normalized.sig_bg_color   = field && field.sig_bg_color   ? field.sig_bg_color   : '#ffffff';
			normalized.sig_height     = field && field.sig_height     ? Number( field.sig_height )     : 160;

			// Hidden field defaults.
			normalized.hidden_source  = field && field.hidden_source  ? field.hidden_source  : 'static';
			normalized.hidden_value   = field && typeof field.hidden_value !== 'undefined' ? field.hidden_value : '';

			// Image choice field defaults.
			// image_choice_options may arrive as a JSON string (from DB) or as an array (live state).
			// Seed 3 starter options when missing OR empty so the settings-panel repeater, the
			// canvas preview and the front-end renderer all show the same options — and a save
			// persists real choices instead of "[]" (self-heals forms saved with no options).
			normalized.image_choice_options    = ( function () {
				var arr = [];
				if ( field ) {
					if ( Array.isArray( field.image_choice_options ) ) {
						arr = field.image_choice_options;
					} else if ( typeof field.image_choice_options === 'string' && field.image_choice_options ) {
						try { var p = JSON.parse( field.image_choice_options ); arr = Array.isArray( p ) ? p : []; } catch (e) { arr = []; }
					}
				}
				return arr.length ? arr : [
					{ label: 'Option 1', value: 'Option 1', image_url: '' },
					{ label: 'Option 2', value: 'Option 2', image_url: '' },
					{ label: 'Option 3', value: 'Option 3', image_url: '' }
				];
			}() );
			normalized.image_choice_type       = field && field.image_choice_type === 'checkbox' ? 'checkbox' : 'radio';
			normalized.image_choice_columns    = field && field.image_choice_columns ? Number( field.image_choice_columns ) : 3;
			normalized.image_choice_img_height = field && field.image_choice_img_height ? Number( field.image_choice_img_height ) : 160;

			// Repeater field defaults.
			// Pro persists repeater_fields as a JSON STRING (wp_json_encode), so parse it
			// back to an array on load — otherwise reopening a saved repeater would wipe its
			// sub-fields (and their options) to [] and the next save would lose them. Mirrors
			// the matrix_rows/columns self-heal below and the panel/canvas string parsing.
			// NOTE: do NOT re-seed an empty array here — a new repeater gets its starter
			// sub-fields from createField(); once the user deletes them all, an empty
			// repeater must STAY empty (respect the deletion) rather than reappearing.
			normalized.repeater_fields       = ( function () {
				var v = field ? field.repeater_fields : undefined;
				if ( Array.isArray( v ) ) { return v; }
				try { var arr = JSON.parse( v || '[]' ); return Array.isArray( arr ) ? arr : []; } catch ( e ) { return []; }
			}() );
			normalized.repeater_min_rows     = field && field.repeater_min_rows ? Number( field.repeater_min_rows ) : 1;
			normalized.repeater_max_rows     = field && field.repeater_max_rows ? Number( field.repeater_max_rows ) : 5;
			normalized.repeater_add_label    = field && typeof field.repeater_add_label    !== 'undefined' ? field.repeater_add_label    : '';
			normalized.repeater_columns      = field && field.repeater_columns ? Number( field.repeater_columns ) : 2;
			normalized.repeater_remove_label = field && typeof field.repeater_remove_label !== 'undefined' ? field.repeater_remove_label : '';

			// Advanced Pro field defaults.
			normalized.confirm_password     = !! ( field && field.confirm_password );
			normalized.rte_height           = field && field.rte_height           ? Number( field.rte_height )           : 200;
			normalized.date_range_format    = field && field.date_range_format    ? field.date_range_format              : 'Y-m-d';
			normalized.date_range_separator = field && typeof field.date_range_separator !== 'undefined' ? field.date_range_separator : ' to ';
			normalized.date_range_min_days  = field && typeof field.date_range_min_days  !== 'undefined' ? field.date_range_min_days  : '';
			normalized.date_range_max_days  = field && typeof field.date_range_max_days  !== 'undefined' ? field.date_range_max_days  : '';
			normalized.nps_low_label        = field && typeof field.nps_low_label  !== 'undefined' ? field.nps_low_label  : 'Not likely';
			normalized.nps_high_label       = field && typeof field.nps_high_label !== 'undefined' ? field.nps_high_label : 'Extremely likely';
			// NPS zone colours (detractor 0-6 / passive 7-8 / promoter 9-10). Empty = use
			// the semantic default (red/amber/green); a value overrides it everywhere.
			normalized.nps_detractor_color  = field && field.nps_detractor_color ? field.nps_detractor_color : '';
			normalized.nps_passive_color    = field && field.nps_passive_color   ? field.nps_passive_color   : '';
			normalized.nps_promoter_color   = field && field.nps_promoter_color  ? field.nps_promoter_color  : '';
			// Matrix rows/columns: keep the saved list, but fall back to defaults when the
			// value is missing OR an empty array. This self-heals forms previously saved
			// with empty matrix_rows/matrix_columns (the front-end already substitutes the
			// same defaults), so the builder, canvas and front end all stay consistent and
			// a save persists real values instead of "[]".
			normalized.matrix_rows = ( function () {
				var v = field ? field.matrix_rows : undefined;
				var arr;
				try { arr = Array.isArray( v ) ? v : JSON.parse( v || '[]' ); } catch ( e ) { arr = []; }
				return ( arr && arr.length ) ? JSON.stringify( arr ) : '["Row 1","Row 2","Row 3"]';
			}() );
			normalized.matrix_columns = ( function () {
				var v = field ? field.matrix_columns : undefined;
				var arr;
				try { arr = Array.isArray( v ) ? v : JSON.parse( v || '[]' ); } catch ( e ) { arr = []; }
				return ( arr && arr.length ) ? JSON.stringify( arr ) : '["Agree","Neutral","Disagree"]';
			}() );
			normalized.matrix_type          = field && field.matrix_type === 'checkbox' ? 'checkbox' : 'radio';
			normalized.lookup_items         = field && typeof field.lookup_items       !== 'undefined' ? field.lookup_items       : '[]';
			normalized.lookup_min_chars     = field && field.lookup_min_chars     ? Number( field.lookup_min_chars )     : 2;
			normalized.lookup_max_results   = field && field.lookup_max_results   ? Number( field.lookup_max_results )   : 8;
			normalized.lookup_allow_custom  = !! ( field && field.lookup_allow_custom );
			normalized.geo_show_map         = !! ( field && field.geo_show_map );
			normalized.geo_map_height       = field && field.geo_map_height ? Number( field.geo_map_height ) : 250;
			normalized.geo_store_format     = field && field.geo_store_format && [ 'both', 'latlng', 'address' ].indexOf( field.geo_store_format ) !== -1 ? field.geo_store_format : 'both';

			return normalized;
		}

		function createColumn( width, fields ) {
			return {
				id: generateId(),
				width: width || '100%',
				fields: Array.isArray( fields ) ? fields.map( normalizeField ) : []
			};
		}

		function createRow( widths ) {
			return {
				id: generateId(),
				css_class: '',
				columns: ( widths || [ '100%' ] ).map(
					function ( width ) {
						return createColumn( width, [] );
					}
				)
			};
		}

		function createTemplateRow( columns ) {
			return {
				id: generateId(),
				columns: ( columns || [] ).map(
					function ( column ) {
						return createColumn( column.width, column.fields || [] );
					}
				)
			};
		}

		function getTemplateDefinitions() {
			return {
				contact: {
					title: boldformLiteBuilder.labels.contactTemplateTitle || 'Contact Form',
					description: boldformLiteBuilder.labels.contactTemplateDescription || 'A simple contact form with name, email, subject, and message.',
					rows: [
						createTemplateRow(
							[
								{
									width: '50%',
									fields: [
										createTemplateField(
											'text',
											{
												label: 'First Name',
												placeholder: 'Enter your first name',
												required: true
											}
										)
									]
								},
								{
									width: '50%',
									fields: [
										createTemplateField(
											'email',
											{
												label: 'Email Address',
												placeholder: 'Enter your email address',
												required: true
											}
										)
									]
								}
							]
						),
						createTemplateRow(
							[
								{
									width: '100%',
									fields: [
										createTemplateField(
											'text',
											{
												label: 'Subject',
												placeholder: 'What is this about?',
												required: true
											}
										),
										createTemplateField(
											'textarea',
											{
												label: 'Message',
												placeholder: 'Tell us how we can help',
												required: true
											}
										)
									]
								}
							]
						)
					]
				},
				lead: {
					title: boldformLiteBuilder.labels.leadTemplateTitle || 'Lead Capture Form',
					description: boldformLiteBuilder.labels.leadTemplateDescription || 'A lead form for collecting contact details, budget, and project needs.',
					rows: [
						createTemplateRow(
							[
								{
									width: '50%',
									fields: [
										createTemplateField(
											'text',
											{
												label: 'Full Name',
												placeholder: 'Enter your full name',
												required: true
											}
										)
									]
								},
								{
									width: '50%',
									fields: [
										createTemplateField(
											'email',
											{
												label: 'Work Email',
												placeholder: 'name@company.com',
												required: true
											}
										)
									]
								}
							]
						),
						createTemplateRow(
							[
								{
									width: '50%',
									fields: [
										createTemplateField(
											'text',
											{
												label: 'Company',
												placeholder: 'Company name'
											}
										)
									]
								},
								{
									width: '50%',
									fields: [
										createTemplateField(
											'select',
											{
												label: 'Budget Range',
												placeholder: 'Select a budget range',
												required: true,
												options: [ '$1k - $5k', '$5k - $10k', '$10k+' ]
											}
										)
									]
								}
							]
						),
						createTemplateRow(
							[
								{
									width: '100%',
									fields: [
										createTemplateField(
											'textarea',
											{
												label: 'Project Details',
												placeholder: 'What are you looking to build?',
												required: true
											}
										)
									]
								}
							]
						)
					]
				},
				feedback: {
					title: boldformLiteBuilder.labels.feedbackTemplateTitle || 'Feedback Form',
					description: boldformLiteBuilder.labels.feedbackTemplateDescription || 'Collect user feedback with rating and comments.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'text', { label: 'Name', placeholder: 'Your name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'Your email', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'select', { label: 'Rating', placeholder: 'Select a rating', required: true, options: [ 'Excellent', 'Good', 'Average', 'Poor' ] } ),
								createTemplateField( 'textarea', { label: 'Comments', placeholder: 'Tell us what you think...', required: true } )
							] }
						] )
					]
				},
				newsletter: {
					title: boldformLiteBuilder.labels.newsletterTemplateTitle || 'Newsletter Signup',
					description: boldformLiteBuilder.labels.newsletterTemplateDescription || 'Simple email signup with name for newsletters.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'text', { label: 'First Name', placeholder: 'Your first name' } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email Address', placeholder: 'you@example.com', required: true } ) ] }
						] )
					]
				},
				registration: {
					title: boldformLiteBuilder.labels.registrationTemplateTitle || 'Registration Form',
					description: boldformLiteBuilder.labels.registrationTemplateDescription || 'Event or account registration with full details.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'text', { label: 'First Name', placeholder: 'First name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'text', { label: 'Last Name', placeholder: 'Last name', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'tel', { label: 'Phone', placeholder: '+1 (555) 000-0000' } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'textarea', { label: 'Additional Info', placeholder: 'Anything else we should know?' } ),
								createTemplateField( 'terms_conditions', { required: true } )
							] }
						] )
					]
				},
				support: {
					title: 'Support Ticket',
					description: 'Let users submit support requests with priority and file attachments.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Your Name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Department', placeholder: 'Select department', required: true, options: [ 'Sales', 'Technical Support', 'Billing', 'General Inquiry' ] } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Priority', placeholder: 'Select priority', required: true, options: [ 'Low', 'Medium', 'High', 'Urgent' ] } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'text', { label: 'Subject', placeholder: 'Brief description of your issue', required: true } ),
								createTemplateField( 'textarea', { label: 'Description', placeholder: 'Please describe your issue in detail...', required: true } ),
								createTemplateField( 'file', { label: 'Attachment' } )
							] }
						] )
					]
				},
				job_application: {
					title: 'Job Application',
					description: 'Collect resumes, cover letters, and candidate details for hiring.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Full Name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email Address', placeholder: 'you@example.com', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'tel', { label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'url', { label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/...' } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Position', placeholder: 'Select position', required: true, options: [ 'Frontend Developer', 'Backend Developer', 'Designer', 'Project Manager', 'Other' ] } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Experience', placeholder: 'Years of experience', options: [ '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years' ] } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'textarea', { label: 'Cover Letter', placeholder: 'Tell us why you are a great fit...' } ),
								createTemplateField( 'file', { label: 'Resume / CV', required: true } )
							] }
						] )
					]
				},
				event_rsvp: {
					title: 'Event RSVP',
					description: 'Accept RSVPs for events with guest count and dietary preferences.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Your Name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'numeric', { label: 'Number of Guests', placeholder: '1', min_value: '1', max_value: '10', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Attending?', placeholder: 'Select', required: true, options: [ 'Yes, I will attend', 'No, I cannot attend', 'Maybe' ] } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'checkbox', { label: 'Dietary Restrictions', options: [ 'Vegetarian', 'Vegan', 'Gluten-Free', 'Nut Allergy', 'None' ] } ),
								createTemplateField( 'textarea', { label: 'Special Requests', placeholder: 'Any additional notes...' } )
							] }
						] )
					]
				},
				customer_survey: {
					title: 'Customer Survey',
					description: 'Gather customer satisfaction data with star ratings and detailed feedback.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Your Name' } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com' } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'star_rating', { label: 'Overall Satisfaction', required: true, max_stars: 5 } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'star_rating', { label: 'Ease of Use', max_stars: 5 } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'radio', { label: 'Would you recommend us?', required: true, options: [ 'Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not' ] } ),
								createTemplateField( 'textarea', { label: 'What can we improve?', placeholder: 'Your feedback helps us get better...' } )
							] }
						] )
					]
				},
				booking: {
					title: 'Booking / Appointment',
					description: 'Schedule appointments with date, time, and service selection.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Full Name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'tel', { label: 'Phone', placeholder: '+1 (555) 000-0000', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Service', placeholder: 'Choose a service', required: true, options: [ 'Consultation', 'Follow-up', 'Full Session', 'Quick Check-in' ] } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'date', { label: 'Preferred Date', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'time', { label: 'Preferred Time', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'textarea', { label: 'Additional Notes', placeholder: 'Anything we should know beforehand?' } )
							] }
						] )
					]
				},
				order_form: {
					title: 'Order / Quote Request',
					description: 'Product order or quote request with quantity, budget, and shipping address.',
					rows: [
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'name', { label: 'Full Name', required: true } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'email', { label: 'Email', placeholder: 'you@example.com', required: true } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'tel', { label: 'Phone', placeholder: '+1 (555) 000-0000' } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'text', { label: 'Company', placeholder: 'Company name (optional)' } ) ] }
						] ),
						createTemplateRow( [
							{ width: '50%', fields: [ createTemplateField( 'select', { label: 'Product / Service', placeholder: 'Select', required: true, options: [ 'Basic Plan', 'Pro Plan', 'Enterprise Plan', 'Custom' ] } ) ] },
							{ width: '50%', fields: [ createTemplateField( 'numeric', { label: 'Quantity', placeholder: '1', min_value: '1', max_value: '1000' } ) ] }
						] ),
						createTemplateRow( [
							{ width: '100%', fields: [
								createTemplateField( 'address', { label: 'Shipping Address' } ),
								createTemplateField( 'textarea', { label: 'Special Instructions', placeholder: 'Any specific requirements...' } )
							] }
						] )
					]
				}
			};
		}

		function normalizeStructure( structure ) {
			var rows = [];

			if ( structure && Array.isArray( structure.rows ) ) {
				rows = structure.rows.map(
					function ( row ) {
						return {
							id: row && row.id ? row.id : generateId(),
							css_class: row && row.css_class ? row.css_class : '',
							columns: Array.isArray( row && row.columns ) && row.columns.length
								? row.columns.map(
									function ( column ) {
										return createColumn( column.width, column.fields );
									}
								)
								: [ createColumn( '100%', [] ) ]
						};
					}
				);
			}

			return {
				rows: rows
			};
		}

		function getAllRows() {
			return state.structure.rows;
		}

		function getAllFields() {
			var fields = [];
			getAllRows().forEach( function ( row ) {
				row.columns.forEach( function ( col ) {
					col.fields.forEach( function ( f ) {
						fields.push( f );
					} );
				} );
			} );
			return fields;
		}

		// --- Calculation formula chip editor helpers -------------------------------
		// The calculation Formula field is a chip editor: the user sees field LABELS,
		// while the stored/evaluated formula keeps the stable {field_id} tokens. These
		// helpers translate between the two. The engine and the saved value never see
		// labels — chips are purely a builder-display layer.

		// Resolve a field's current label from its id (empty string if not found).
		function bfCalcLabelById( id ) {
			var label = '';
			getAllFields().forEach( function ( f ) {
				if ( f.id === id ) {
					label = f.label || f.id;
				}
			} );
			return label;
		}

		// Build a single token-chip element for a field id.
		function bfCalcMakeChip( id ) {
			var label   = bfCalcLabelById( id );
			var missing = '' === label;
			var chip    = document.createElement( 'span' );
			chip.className = 'bfcp-token' + ( missing ? ' bfcp-token--missing' : '' );
			chip.setAttribute( 'contenteditable', 'false' );
			chip.setAttribute( 'data-id', id );
			chip.setAttribute( 'title', '{' + id + '}' );
			chip.textContent = missing ? ( '(' + id + ')' ) : label;
			return chip;
		}

		// Render a stored "{id} * {id2}" formula into chip + text HTML for the editor.
		function bfCalcFormulaToChips( formula ) {
			formula = String( formula || '' );
			var html = '';
			var re   = /\{([^}]+)\}/g;
			var last = 0;
			var m;
			while ( ( m = re.exec( formula ) ) !== null ) {
				if ( m.index > last ) {
					html += escapeHtml( formula.slice( last, m.index ) );
				}
				html += bfCalcMakeChip( m[1] ).outerHTML;
				last = re.lastIndex;
			}
			if ( last < formula.length ) {
				html += escapeHtml( formula.slice( last ) );
			}
			return html;
		}

		// Convert a stored "{id}" formula to a readable "Label" string (plain text)
		// for the canvas preview badge. Two deliberate transforms:
		//   1. Curly braces are dropped — they are formula syntax the user never
		//      types (fields are inserted as pills in the editor), and showing them
		//      in the read-only badge made users think they had to close a brace.
		//   2. Operators are prettified to friendly math symbols with even spacing
		//      (× ÷ + -), so "{Weight}/({Height}*{Height})" reads as
		//      "Weight ÷ (Height × Height)".
		// Both are DISPLAY-ONLY — the stored formula keeps its ASCII "*" and "/".
		// Operators are formatted BEFORE labels are substituted, so a field label
		// that itself contains a hyphen or operator character is never mangled.
		// Deleted fields fall back to "(id)" so a broken reference stays visible.
		function bfCalcFormulaToLabels( formula ) {
			var text = String( formula || '' )
				.replace( /\s*\*\s*/g, ' × ' )
				.replace( /\s*\/\s*/g, ' ÷ ' )
				.replace( /\s*\+\s*/g, ' + ' )
				.replace( /\s*-\s*/g, ' - ' )
				.replace( /\(\s+/g, '(' )
				.replace( /\s+\)/g, ')' );
			return text.replace( /\{([^}]+)\}/g, function ( match, id ) {
				var label = bfCalcLabelById( id );
				return label || ( '(' + id + ')' );
			} );
		}

		// Serialize the editor DOM back to a "{id}" formula string. Normalises any
		// non-breaking spaces the browser may inject to plain spaces, since the PHP
		// formula whitelist only accepts ASCII whitespace.
		function bfCalcChipsToFormula( editor ) {
			if ( ! editor ) {
				return '';
			}
			var out = '';
			( function walk( node ) {
				for ( var i = 0; i < node.childNodes.length; i++ ) {
					var child = node.childNodes[ i ];
					if ( 3 === child.nodeType ) {
						out += child.nodeValue;
					} else if ( 1 === child.nodeType ) {
						if ( child.classList && child.classList.contains( 'bfcp-token' ) ) {
							out += '{' + ( child.getAttribute( 'data-id' ) || '' ) + '}';
						} else if ( 'BR' === child.nodeName ) {
							out += ' ';
						} else {
							walk( child );
						}
					}
				}
			}( editor ) );
			out = out.replace( /\u00A0/g, ' ' );
			return /^\s*$/.test( out ) ? '' : out;
		}

		// Insert chip + trailing space at the caret (or end) of the formula editor.
		function bfCalcInsertChip( editor, id ) {
			var chip  = bfCalcMakeChip( id );
			var space = document.createTextNode( ' ' );
			var sel   = window.getSelection();
			var range;
			if ( sel && sel.rangeCount && editor.contains( sel.anchorNode ) ) {
				range = sel.getRangeAt( 0 );
				range.deleteContents();
			} else {
				range = document.createRange();
				range.selectNodeContents( editor );
				range.collapse( false );
			}
			var frag = document.createDocumentFragment();
			frag.appendChild( chip );
			frag.appendChild( space );
			range.insertNode( frag );
			range.setStartAfter( space );
			range.collapse( true );
			if ( sel ) {
				sel.removeAllRanges();
				sel.addRange( range );
			}
		}

		function getColumn( rowIndex, columnIndex ) {
			var row = getAllRows()[ rowIndex ];

			if ( ! row || ! row.columns || ! row.columns[ columnIndex ] ) {
				return null;
			}

			return row.columns[ columnIndex ];
		}

		function getFieldLocation( fieldId ) {
			var match = null;

			getAllRows().forEach(
				function ( row, rowIndex ) {
					row.columns.forEach(
						function ( column, columnIndex ) {
							column.fields.forEach(
								function ( field, fieldIndex ) {
									if ( field.id === fieldId ) {
										match = {
											rowIndex: rowIndex,
											columnIndex: columnIndex,
											fieldIndex: fieldIndex,
											field: field,
											column: column,
											row: row
										};
									}
								}
							);
						}
					);
				}
			);

			return match;
		}

		function getSelectedFieldLocation() {
			if ( ! state.selectedFieldId ) {
				return null;
			}

			return getFieldLocation( state.selectedFieldId );
		}

		function ensureActiveColumn() {
			if ( state.activeColumn && getColumn( state.activeColumn.rowIndex, state.activeColumn.columnIndex ) ) {
				return state.activeColumn;
			}

			if ( ! getAllRows().length ) {
				state.activeColumn = null;
				return null;
			}

			// Default to the last row, first column — new fields go to the bottom.
			var lastRowIndex = getAllRows().length - 1;
			state.activeColumn = {
				rowIndex: lastRowIndex,
				columnIndex: 0
			};

			return state.activeColumn;
		}

		function setActiveColumn( rowIndex, columnIndex ) {
			state.activeColumn = {
				rowIndex: rowIndex,
				columnIndex: columnIndex
			};
		}

		// ── Unsaved-changes tracking ──────────────────────────────────────────────
		// hasUnsavedChanges flips true on any structural or value mutation and is
		// cleared after a successful save. builderReady gates it so the initial render
		// (which builds state from saved data) does not count as a change. The Preview
		// button reads this to warn before navigating (the preview renders the SAVED form).
		var hasUnsavedChanges = false;
		var builderReady = false;
		function markDirty() {
			if ( builderReady ) {
				hasUnsavedChanges = true;
			}
		}

		function removeFieldAt( rowIndex, columnIndex, fieldIndex ) {
			var column = getColumn( rowIndex, columnIndex );

			if ( ! column || ! column.fields[ fieldIndex ] ) {
				return null;
			}

			markDirty();
			return column.fields.splice( fieldIndex, 1 )[ 0 ];
		}

		function insertFieldAt( rowIndex, columnIndex, field, fieldIndex ) {
			var column = getColumn( rowIndex, columnIndex );
			var insertAt;

			if ( ! column ) {
				return;
			}

			insertAt = typeof fieldIndex === 'number' ? fieldIndex : column.fields.length;
			column.fields.splice( insertAt, 0, field );
			state.selectedFieldId = field.id;
			setActiveColumn( rowIndex, columnIndex );
			markDirty();
		}

		function addRow( widths ) {
			var row = createRow( widths );

			getAllRows().push( row );
			markDirty();
			setActiveColumn( getAllRows().length - 1, 0 );
			switchEditorView( 'builder' );
			switchSidebarTab( 'library' );
			renderAll();
			announce( 'rowAdded' );
		}

		function duplicateRow( rowIndex ) {
			var rows = getAllRows();

			if ( ! rows[ rowIndex ] ) {
				return;
			}

			// Deep-clone the row and assign fresh IDs to every field.
			var clone = $.extend( true, {}, rows[ rowIndex ] );
			clone.columns.forEach( function ( col ) {
				col.fields = col.fields.map( function ( field ) {
					var f = $.extend( true, {}, field );
					f.id = generateId();
					return f;
				} );
			} );

			// Insert the clone immediately after the source row.
			rows.splice( rowIndex + 1, 0, clone );
			markDirty();
			setActiveColumn( rowIndex + 1, 0 );
			switchEditorView( 'builder' );
			renderAll();
			announce( 'rowDuplicated' );
		}

		function deleteRow( rowIndex ) {
			var rows = getAllRows();

			if ( ! rows[ rowIndex ] ) {
				return;
			}

			rows.splice( rowIndex, 1 );
			markDirty();
			state.selectedFieldId = null;

			if ( rows.length ) {
				setActiveColumn( 0, 0 );
			} else {
				state.activeColumn = null;
			}

			switchSidebarTab( 'library' );
			renderAll();
			announce( 'rowDeleted' );
		}

		function moveRow( oldIndex, newIndex ) {
			var rows = getAllRows();
			var row;

			if ( oldIndex === newIndex || ! rows[ oldIndex ] ) {
				return;
			}

			row = rows.splice( oldIndex, 1 )[ 0 ];
			rows.splice( newIndex, 0, row );
			markDirty();
			renderAll();
		}

		function addFieldToActiveColumn( type ) {
			if ( ! getAllRows().length ) {
				addRow( [ '100%' ] );
			}

			// Always add to the last row, first column.
			var lastRowIndex = getAllRows().length - 1;
			setActiveColumn( lastRowIndex, 0 );
			var activeColumn = state.activeColumn;

			insertFieldAt( activeColumn.rowIndex, activeColumn.columnIndex, createField( type ) );
			state.selectedFieldId = null;
			switchEditorView( 'builder' );
			renderAll();
			announce( 'fieldAdded' );
		}

		function addFieldToColumn( type, rowIndex, columnIndex, newIndex ) {
			if ( 'submit' === type && hasSubmitField() ) {
				return;
			}
			insertFieldAt( rowIndex, columnIndex, createField( type ), newIndex );
			state.selectedFieldId = null;
			switchEditorView( 'builder' );
			renderAll();
			announce( 'fieldAdded' );
		}

		function duplicateField( fieldId ) {
			var location = getFieldLocation( fieldId );
			var duplicate;

			if ( ! location ) {
				return;
			}

			duplicate = $.extend( true, {}, location.field );
			duplicate.id = generateId();
			duplicate.label = duplicate.label + ' Copy';

			insertFieldAt( location.rowIndex, location.columnIndex, duplicate, location.fieldIndex + 1 );
			switchEditorView( 'builder' );
			switchSidebarTab( 'settings' );
			renderAll();
			announce( 'fieldDuplicated' );
		}

		function buildButtonIconHtml() {
			var type = state.formSettings.button_icon_type || 'none';
			if ( 'none' === type ) return '';
			var icon = '';
			var size = state.formSettings.button_icon_size || '18';
			var color = state.formSettings.button_icon_color || '';
			var style = '';
			if ( size && size !== '18' ) {
				style += 'font-size:' + escapeHtml( size ) + 'px;width:' + escapeHtml( size ) + 'px;height:' + escapeHtml( size ) + 'px;';
			}
			if ( color ) {
				style += 'color:' + escapeHtml( color ) + ';';
			}
			var styleAttr = style ? ' style="' + style + '"' : '';

			if ( 'dashicon' === type ) {
				icon = '<span class="dashicons ' + escapeHtml( state.formSettings.button_icon_dashicon || 'dashicons-arrow-right-alt' ) + '"' + styleAttr + '></span>';
			} else if ( 'svg' === type && state.formSettings.button_icon_svg ) {
				var imgW   = ( size && size !== '18' ) ? escapeHtml( size ) : '18';
				var svgUrl = escapeHtml( state.formSettings.button_icon_svg );
				if ( color ) {
					// Tint a monochrome SVG to the chosen colour via a CSS mask: the
					// SVG shape masks a solid background-color, so it recolours reliably
					// regardless of the file's internal fills. An <img> can't be
					// recoloured; this matches how the front end renders a coloured SVG.
					var maskRef = "url('" + svgUrl + "') center / contain no-repeat";
					icon = '<span class="boldform-btn-icon-svg" aria-hidden="true" style="'
						+ 'display:inline-block;vertical-align:middle;flex-shrink:0;'
						+ 'width:' + imgW + 'px;height:' + imgW + 'px;'
						+ 'background-color:' + escapeHtml( color ) + ';'
						+ '-webkit-mask:' + maskRef + ';mask:' + maskRef + ';"></span>';
				} else {
					// No colour override — show the SVG's own colours via <img>.
					icon = '<img src="' + svgUrl + '" class="boldform-btn-icon-svg" alt="" style="'
						+ 'width:' + imgW + 'px;height:' + imgW + 'px;display:inline-block;vertical-align:middle;flex-shrink:0;">';
				}
			}
			return icon;
		}

		function buildButtonContent() {
			var icon = buildButtonIconHtml();
			var rawText = state.formSettings.button_text;
			var text = escapeHtml( rawText || '' );
			var gap = state.formSettings.button_icon_gap || '8';

			// No icon — show text (or default).
			if ( ! icon ) return text || 'Submit';

			// Icon-only (no text).
			if ( ! text ) {
				return '<span style="display:inline-flex;align-items:center;">' + icon + '</span>';
			}

			// Icon + text.
			var style = 'display:inline-flex;align-items:center;gap:' + escapeHtml( gap ) + 'px;';
			if ( 'left' === state.formSettings.button_icon_position ) {
				return '<span style="' + style + '">' + icon + text + '</span>';
			}
			return '<span style="' + style + '">' + text + icon + '</span>';
		}

		function deleteField( fieldId ) {
			var location = getFieldLocation( fieldId );

			if ( ! location ) {
				return;
			}

			removeFieldAt( location.rowIndex, location.columnIndex, location.fieldIndex );
			state.selectedFieldId = null;
			renderAll();
			announce( 'fieldDeleted' );
		}

		function renderInputPreview( field ) {
			// Match the front-end renderer (shortcode.php render_control): a field
			// whose label the user has intentionally cleared shows NO <label> at all.
			// New fields keep their real saved label (createField stores the library
			// name), so this only affects deliberately-emptied labels — keeping the
			// canvas WYSIWYG instead of falling back to the field-type name.
			var labelText = field.label || '';
			var label = ( state.formSettings.hide_labels || 'hidden' === field.label_placement || '' === labelText ) ? '' : '<label>' + escapeHtml( labelText ) + ( field.required ? ' <span class="boldform-required">*</span>' : '' ) + '</label>';
			var html = '';

			// Shared theme tokens so the advanced (Pro) field previews adopt the active
			// Design Theme — accent + field surface — exactly like the free fields,
			// instead of rendering with hardcoded greys. The accent resolves theme
			// primary (button bg, always set by a theme) → focus colour → neutral,
			// matching the established --bf-choice-accent-r fallback chain in builder.css
			// so every Pro field agrees with the core checkbox/radio accent. These read
			// the --bf-* vars emitted onto the canvas / style-preview surfaces by
			// getFormStyleBlock().
			var bfAccent      = 'var(--bf-button-bg, var(--bf-focus-color, #0f766e))';
			var bfFieldBorder = 'var(--bf-field-border, #d1d5db)';
			var bfFieldBg     = 'var(--bf-field-bg, #fff)';
			var bfFieldText   = 'var(--bf-field-text, #374151)';
			var bfFieldRadius = 'var(--bf-field-radius, 6px)';
			var bfLabelColor  = 'var(--bf-label-color, #1f2937)';
			var bfMuted       = '#9ca3af';

			if ( field.type === 'name' ) {
				html = '<div class="boldform-canvas-name">';
				html += '<div class="boldform-canvas-name__field"><input type="text" placeholder="' + escapeHtml( boldformLiteBuilder.labels.firstName || 'First Name' ) + '" disabled><span class="boldform-canvas-name__sub">' + escapeHtml( boldformLiteBuilder.labels.firstName || 'First Name' ) + '</span></div>';
				if ( field.show_middle_name ) {
					html += '<div class="boldform-canvas-name__field"><input type="text" placeholder="' + escapeHtml( boldformLiteBuilder.labels.middleName || 'Middle Name' ) + '" disabled><span class="boldform-canvas-name__sub">' + escapeHtml( boldformLiteBuilder.labels.middleName || 'Middle Name' ) + '</span></div>';
				}
				if ( field.show_last_name ) {
					html += '<div class="boldform-canvas-name__field"><input type="text" placeholder="' + escapeHtml( boldformLiteBuilder.labels.lastName || 'Last Name' ) + '" disabled><span class="boldform-canvas-name__sub">' + escapeHtml( boldformLiteBuilder.labels.lastName || 'Last Name' ) + '</span></div>';
				}
				html += '</div>';
			} else if ( field.type === 'file' ) {
				return label + '<div class="boldform-canvas-file-preview"><span class="dashicons dashicons-upload"></span> <span>' + escapeHtml( boldformLiteBuilder.labels.fileUploadHint || 'Choose file or drag & drop' ) + '</span></div>';
			} else if ( field.type === 'submit' ) {
				return '<div class="boldform-canvas-submit is-inline is-align-' + escapeHtml( state.formSettings.button_alignment || 'left' ) + '"><button type="button" class="boldform-canvas-submit__button">' + buildButtonContent() + '</button></div>';
			} else if ( field.type === 'page_break' ) {
				// Shows the Step Title set in the settings panel directly on the canvas
				// row, so which step starts here is visible without opening Settings.
				return '<div class="boldform-canvas-page-break"><span class="dashicons dashicons-layout"></span><strong>' + escapeHtml( boldformLiteBuilder.labels.pageBreak || 'Page Break' ) + '</strong>' +
					( field.step_title ? '<span class="boldform-canvas-page-break__title">&#8212; ' + escapeHtml( field.step_title ) + '</span>' : '' ) +
				'</div>';
			} else if ( field.type === 'product' ) {
				var prodOpts = Array.isArray( field.product_options ) ? field.product_options : [];
				if ( 'select' === field.product_style ) {
					html += '<select style="pointer-events:none"><option>' + ( prodOpts.length ? escapeHtml( prodOpts[0].label || 'Select…' ) + ' — $' + escapeHtml( parseFloat( prodOpts[0].price || 0 ).toFixed( 2 ) ) : 'Select…' ) + '</option></select>';
				} else {
					// Use the SAME wrapper/markup as the checkbox/radio canvas preview
					// (boldform-canvas-field-choices + __choice-control + __choice-label) so
					// the canvas CSS hides the native input, draws the custom radio, and
					// stacks rows with min-width:0 (no overflow). Frontend __choices alone
					// leaves native radios styled as full-width input lines.
					html += '<div class="boldform-canvas-field-choices">';
					// The price <em> must use the button-bg-FIRST accent chain, mirroring
					// the front end's .bfp-product-price rule (Pro payments.css). Keying
					// off --bf-focus-color alone renders teal under every theme whose
					// primary isn't blue/green/dark, because applyDesignTheme()'s focusMap
					// only covers those and leaves --bf-focus-color unset otherwise.
					prodOpts.slice( 0, 4 ).forEach( function ( opt, idx ) {
						html += '<label class="boldform-lite-form__choice"><input type="radio"' + ( 0 === idx ? ' checked' : '' ) + ' disabled><span class="boldform-lite-form__choice-control" aria-hidden="true"></span><span class="boldform-lite-form__choice-label">' + escapeHtml( opt.label || '' ) + ' <em style="color:var(--bf-button-bg, var(--bf-focus-color, #0d9488));font-weight:600">— $' + escapeHtml( parseFloat( opt.price || 0 ).toFixed( 2 ) ) + '</em></span></label>';
					} );
					if ( prodOpts.length > 4 ) { html += '<label class="boldform-lite-form__choice"><span class="boldform-lite-form__choice-label" style="color:#9ca3af">…and ' + ( prodOpts.length - 4 ) + ' more</span></label>'; }
					html += '</div>';
				}
				return label + '<div class="boldform-canvas-field-control">' + html + '</div>';
			} else if ( field.type === 'quantity' ) {
				html += '<input type="number" value="' + escapeHtml( field.qty_default || '1' ) + '" min="' + escapeHtml( field.qty_min || '1' ) + '"' + ( field.qty_max ? ' max="' + escapeHtml( field.qty_max ) + '"' : '' ) + ' disabled>';
				return label + '<div class="boldform-canvas-field-control">' + html + '</div>';
			} else if ( field.type === 'custom_amount' ) {
				var caMin = field.amount_min ? parseFloat( field.amount_min ) : 0;
				var caMax = field.amount_max ? parseFloat( field.amount_max ) : '';
				var caDefault = field.amount_default ? parseFloat( field.amount_default ) : 0;
				html += '<div class="boldform-canvas-amount">';
				html += '<span class="boldform-canvas-amount__symbol">$</span>';
				html += '<input type="number" value="' + escapeHtml( caDefault.toFixed(2) ) + '" step="0.01"' + ( caMin > 0 ? ' min="' + caMin + '"' : '' ) + ( caMax !== '' ? ' max="' + caMax + '"' : '' ) + ' disabled>';
				html += '</div>';
				return label + '<div class="boldform-canvas-field-control">' + html + '</div>';
			} else if ( field.type === 'order_summary' ) {
				var osTotal  = 0;
				var osFields = getAllFields();
				// Mirror the front end: map each product to its linked quantity
				// field's default qty (Pro's build_order_line_items()).
				var osQtyByProduct = {};
				osFields.forEach( function ( qf ) {
					if ( qf.type === 'quantity' && qf.linked_product ) {
						osQtyByProduct[ qf.linked_product ] = qf;
					}
				} );
				html  = '<div style="border:1px solid ' + bfFieldBorder + ';border-radius:' + bfFieldRadius + ';overflow:hidden;font-size:13px;color:' + bfFieldText + ';">';
				html += '<table style="width:100%;border-collapse:collapse;">';
				html += '<thead style="background:' + bfFieldBg + ';color:' + bfLabelColor + ';"><tr><th style="padding:8px 12px;text-align:left;">Item</th><th style="padding:8px 12px;text-align:right;">Price</th><th style="padding:8px 12px;text-align:right;">Qty</th><th style="padding:8px 12px;text-align:right;">Total</th></tr></thead>';
				html += '<tbody>';
				osFields.forEach( function ( pf ) {
					if ( pf.type === 'product' ) {
						var opts   = Array.isArray( pf.product_options ) ? pf.product_options : [];
						var first  = opts[0] || {};
						var price  = parseFloat( first.price || 0 );
						var qtyF   = osQtyByProduct[ pf.id ];
						var qty    = qtyF && '' !== qtyF.qty_default && typeof qtyF.qty_default !== 'undefined' ? parseInt( qtyF.qty_default, 10 ) || 1 : 1;
						var rowTot = price * qty;
						var lbl    = ( pf.label || 'Product' ) + ( first.label ? ' — ' + first.label : '' );
						osTotal += rowTot;
						html += '<tr style="border-bottom:1px solid ' + bfFieldBorder + ';"><td style="padding:8px 12px;">' + escapeHtml( lbl ) + '</td><td style="padding:8px 12px;text-align:right;">$' + price.toFixed(2) + '</td><td style="padding:8px 12px;text-align:right;">' + qty + '</td><td style="padding:8px 12px;text-align:right;">$' + rowTot.toFixed(2) + '</td></tr>';
					} else if ( pf.type === 'custom_amount' ) {
						// Front end starts this row hidden (display:none) until the
						// visitor types a non-zero amount; the default still counts
						// toward the total. Show it muted in the builder so designers
						// know it exists without implying it renders on load.
						var ca = parseFloat( pf.amount_default || 0 );
						osTotal += ca;
						html += '<tr style="border-bottom:1px solid ' + bfFieldBorder + ';opacity:.55;font-style:italic;"><td style="padding:8px 12px;">' + escapeHtml( pf.label || 'Custom Amount' ) + ' <span style="font-style:normal;font-size:11px;color:' + bfMuted + ';">(' + escapeHtml( 'appears when filled' ) + ')</span></td><td style="padding:8px 12px;text-align:right;">$' + ca.toFixed(2) + '</td><td style="padding:8px 12px;text-align:right;">1</td><td style="padding:8px 12px;text-align:right;">$' + ca.toFixed(2) + '</td></tr>';
					}
				} );
				html += '</tbody>';
				html += '<tfoot style="background:' + bfFieldBg + ';border-top:2px solid ' + bfFieldBorder + ';"><tr><td colspan="3" style="padding:10px 12px;text-align:right;font-weight:600;color:' + bfLabelColor + ';">Order Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px;color:' + bfAccent + ';">$' + osTotal.toFixed(2) + '</td></tr></tfoot>';
				html += '</table>';
				html += '';
				html += '</div>';
				return label + '<div class="boldform-canvas-field-control">' + html + '</div>';
			} else if ( field.type === 'section_break' ) {
				html = '<div class="boldform-canvas-section-break"><strong>' + escapeHtml( field.label ) + '</strong><p>' + escapeHtml( field.description || '' ) + '</p></div>';
			} else if ( field.type === 'terms_conditions' ) {
				// Intentional raw-HTML sink: field.content is admin-authored rich text
				// (builder is manage_options-only) and is re-sanitized server-side with
				// wp_kses_post() on save, so it is emitted unescaped here to preserve markup.
				// A consent field has no heading, so the shared label above never draws
				// the required asterisk for it — mirror the front end and append one to
				// the copy instead, or a required consent box looks entirely optional.
				html = '<div class="boldform-canvas-terms"><input type="checkbox"' + ( field.required ? ' checked' : '' ) + '><span class="boldform-lite-form__choice-control" aria-hidden="true"></span><div class="boldform-canvas-terms__copy">' + ( field.content || '' ) + ( field.required ? ' <span class="boldform-required">*</span>' : '' ) + '</div></div>';
			} else if ( field.type === 'captcha' ) {
				html = '<div class="boldform-canvas-field-note">' + escapeHtml( boldformLiteBuilder.labels.captchaNotice || 'This field will use the captcha provider selected in global settings.' ) + '</div>';
			} else if ( field.type === 'textarea' ) {
				html = '<textarea rows="3" placeholder="' + escapeHtml( field.placeholder || field.label || '' ) + '">' + escapeHtml( field.default_value ) + '</textarea>';
			} else if ( field.type === 'select' ) {
				var selectedValue = $.trim( field.default_value || '' );
				var selectedLabel = '';
				field.options.forEach( function ( option ) {
					if ( $.trim( option || '' ) === selectedValue ) selectedLabel = option;
				} );

				html = '<div class="bf-select">';
				html += '<div class="bf-select__trigger">';
				if ( selectedLabel ) {
					html += '<span class="bf-select__value">' + escapeHtml( selectedLabel ) + '</span>';
				} else {
					html += '<span class="bf-select__placeholder">' + escapeHtml( field.placeholder || 'Select\u2026' ) + '</span>';
				}
				html += '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';
				html += '</div></div>';
			} else if ( field.type === 'multiselect' ) {
				var msDefaults = ( field.default_value || '' ).split( ',' ).map( function ( v ) { return $.trim( v ); } ).filter( function ( v ) { return v.length; } );

				html = '<div class="bf-select bf-select--multi">';
				html += '<div class="bf-select__trigger">';
				if ( msDefaults.length ) {
					html += '<span class="bf-select__tags">';
					msDefaults.forEach( function ( v ) {
						html += '<span class="bf-select__tag">' + escapeHtml( v ) + '</span>';
					} );
					html += '</span>';
				} else {
					html += '<span class="bf-select__placeholder">' + escapeHtml( field.placeholder || 'Select options\u2026' ) + '</span>';
				}
				html += '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';
				html += '</div></div>';
			} else if ( field.type === 'checkbox' || field.type === 'radio' ) {
				var choiceDefaults = ( field.default_value || '' ).split( ',' ).map( function ( v ) { return $.trim( v ); } ).filter( function ( v ) { return v.length; } );
				var isSwitchStyle = 'checkbox' === field.type && 'switch' === field.checkbox_style;
				html = '<div class="boldform-canvas-field-choices' + ( 'inline' === field.options_layout ? ' is-inline' : '' ) + ( isSwitchStyle ? ' is-switch' : '' ) + '">';
				field.options.forEach(
					function ( option ) {
						var isChecked = choiceDefaults.indexOf( $.trim( option ) ) !== -1;
						html += '<label class="boldform-lite-form__choice"><input type="' + escapeHtml( field.type ) + '"' + ( isChecked ? ' checked' : '' ) + '><span class="boldform-lite-form__choice-control" aria-hidden="true"></span><span class="boldform-lite-form__choice-label">' + escapeHtml( option ) + '</span></label>';
					}
				);
				html += '</div>';
			} else if ( field.type === 'input_mask' ) {
				html = '<input type="text" placeholder="' + escapeHtml( field.placeholder || field.mask_pattern || field.label || '' ) + '" value="' + escapeHtml( field.default_value ) + '" disabled>';
			} else if ( field.type === 'html_editor' ) {
				html = '<div class="boldform-canvas-html-editor"><span class="dashicons dashicons-editor-code"></span> ' + escapeHtml( boldformLiteBuilder.labels.htmlEditor || 'Rich Text Editor' ) + '</div>';
			} else if ( field.type === 'paragraph' ) {
				html = '<div class="boldform-canvas-paragraph">' + escapeHtml( field.content || 'Paragraph text...' ) + '</div>';
			} else if ( field.type === 'numeric' ) {
				var numPlaceholder = field.placeholder || '';
				if ( field.min_value !== '' || field.max_value !== '' ) {
					numPlaceholder = numPlaceholder || ( ( field.min_value || '0' ) + ' - ' + ( field.max_value || '...' ) );
				}
				// Final fallback to the label so the field is never bare (matches front-end).
				numPlaceholder = numPlaceholder || field.label || '';
				html = '<input type="number" placeholder="' + escapeHtml( numPlaceholder ) + '" value="' + escapeHtml( field.default_value ) + '" disabled>';
			} else if ( field.type === 'address' ) {
				var af = field.address_fields || {};
				var addrOrder = field.address_order || [ 'street', 'city', 'state', 'zip', 'country' ];
				var addrPlaceholders = { street: 'Street Address', city: 'City', state: 'State / Province', zip: 'ZIP / Postal', country: 'Country' };
				var enabledAddr = addrOrder.filter( function ( k ) { return af[ k ] !== false; } );
				html = '<div class="boldform-canvas-address">';
				// Render in exact order. Street = full width, others pair up in sequence.
				var pairBuffer = [];
				enabledAddr.forEach( function ( key ) {
					if ( key === 'street' ) {
						// Flush any pending pair first.
						if ( pairBuffer.length ) {
							var cls = pairBuffer.length === 2 ? ' boldform-canvas-address__row--half' : '';
							html += '<div class="boldform-canvas-address__row' + cls + '">';
							pairBuffer.forEach( function ( k ) { html += '<input type="text" placeholder="' + escapeHtml( addrPlaceholders[ k ] ) + '" disabled>'; } );
							html += '</div>';
							pairBuffer = [];
						}
						html += '<input type="text" placeholder="' + escapeHtml( addrPlaceholders[ key ] ) + '" disabled>';
					} else {
						pairBuffer.push( key );
						if ( pairBuffer.length === 2 ) {
							html += '<div class="boldform-canvas-address__row boldform-canvas-address__row--half">';
							pairBuffer.forEach( function ( k ) { html += '<input type="text" placeholder="' + escapeHtml( addrPlaceholders[ k ] ) + '" disabled>'; } );
							html += '</div>';
							pairBuffer = [];
						}
					}
				} );
				// Flush remaining single field.
				if ( pairBuffer.length ) {
					html += '<div class="boldform-canvas-address__row">';
					pairBuffer.forEach( function ( k ) { html += '<input type="text" placeholder="' + escapeHtml( addrPlaceholders[ k ] ) + '" disabled>'; } );
					html += '</div>';
				}
				html += '</div>';
			} else if ( field.type === 'country' ) {
				html = '<div class="bf-select">';
				html += '<div class="bf-select__trigger">';
				html += '<span class="bf-select__placeholder">' + escapeHtml( field.placeholder || 'Select a country' ) + '</span>';
				html += '<span class="bf-select__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>';
				html += '</div></div>';
			} else if ( field.type === 'star_rating' ) {
				var maxStars = field.max_stars || 5;
				var defRating = Number( field.default_value ) || 0;
				var starSize = field.star_size || '20';
				// Emit --star-color (active) / --star-inactive only when set; otherwise the
				// CSS falls back (active → theme accent --bf-button-bg, inactive → a light
				// tint of the active colour).
				var starStyle = '--star-size:' + escapeHtml( starSize ) + 'px';
				if ( field.star_color ) {
					starStyle = '--star-color:' + escapeHtml( field.star_color ) + ';' + starStyle;
				}
				if ( field.star_inactive_color ) {
					starStyle = '--star-inactive:' + escapeHtml( field.star_inactive_color ) + ';' + starStyle;
				}
				html = '<div class="boldform-canvas-stars" style="' + starStyle + '">';
				for ( var si = 1; si <= maxStars; si++ ) {
					html += '<span class="boldform-canvas-star' + ( si <= defRating ? ' is-active' : '' ) + '">&#9733;</span>';
				}
				html += '</div>';
			} else if ( field.type === 'slider_range' ) {
				var slMin = field.min_value || '0';
				var slMax = field.max_value || '100';
				var slVal = field.default_value || slMin;
				var slColor = field.slider_color || '';
				var slHeight = field.slider_height || '';
				var slStyle = '';
				if ( slColor ) slStyle += '--slider-color:' + escapeHtml( slColor ) + ';';
				if ( slHeight ) slStyle += '--slider-height:' + escapeHtml( slHeight ) + 'px;';
				if ( field.dual_handle ) {
					// Preview thumbs sit at 25% / 75% of the track (see CSS); show the
					// matching values so the label reflects the handle positions.
					var slSpan = Number( slMax ) - Number( slMin );
					var slLo   = Math.round( Number( slMin ) + ( slSpan * 0.25 ) );
					var slHi   = Math.round( Number( slMin ) + ( slSpan * 0.75 ) );
					html = '<div class="boldform-canvas-slider boldform-canvas-slider--dual"' + ( slStyle ? ' style="' + slStyle + '"' : '' ) + '>';
					html += '<div class="boldform-canvas-slider__track">';
					html += '<div class="boldform-canvas-slider__fill"></div>';
					html += '<span class="boldform-canvas-slider__thumb boldform-canvas-slider__thumb--min"></span>';
					html += '<span class="boldform-canvas-slider__thumb boldform-canvas-slider__thumb--max"></span>';
					html += '</div>';
					html += '<div class="boldform-canvas-slider__labels"><span>' + escapeHtml( slMin ) + '</span><span>' + escapeHtml( String( slLo ) ) + ' – ' + escapeHtml( String( slHi ) ) + '</span><span>' + escapeHtml( slMax ) + '</span></div>';
					html += '</div>';
				} else {
					html = '<div class="boldform-canvas-slider"' + ( slStyle ? ' style="' + slStyle + '"' : '' ) + '>';
					html += '<input type="range" min="' + escapeHtml( slMin ) + '" max="' + escapeHtml( slMax ) + '" value="' + escapeHtml( slVal ) + '" disabled>';
					html += '<div class="boldform-canvas-slider__labels"><span>' + escapeHtml( slMin ) + '</span><span>' + escapeHtml( slVal ) + '</span><span>' + escapeHtml( slMax ) + '</span></div>';
					html += '</div>';
				}
			} else if ( field.type === 'calculation' ) {
				var calcDecimals = (typeof field.calc_decimals === 'number') ? field.calc_decimals : 2;
				var calcPrefix   = field.calc_prefix || '';
				var calcSuffix   = field.calc_suffix || '';
				var calcSample   = calcPrefix + parseFloat(0).toFixed(calcDecimals) + calcSuffix;
				var calcFormula  = field.calc_formula || '';
				html = '<div class="boldform-canvas-calculation">';
				html += '<input type="text" value="' + escapeHtml(calcSample) + '" readonly class="boldform-canvas-calc-input">';
				if ( calcFormula ) {
					html += '<div class="boldform-canvas-calc-badge">= ' + escapeHtml( bfCalcFormulaToLabels( calcFormula ) ) + '</div>';
				}
				html += '</div>';

			} else if ( field.type === 'signature' ) {
				html  = '<div class="boldform-canvas-signature">';
				html += '<span class="dashicons dashicons-edit"></span>';
				html += '<span>' + escapeHtml( boldformLiteBuilder.labels.signatureHint || 'Sign here…' ) + '</span>';
				html += '</div>';

			} else if ( field.type === 'hidden_field' ) {
				var hfSource = field.hidden_source || 'static';
				var hfValue  = field.hidden_value  || '';
				var hfSourceLabel = {
					static: 'Static value',
					url_param: 'URL parameter',
					user_id: 'User ID',
					user_email: 'User email',
					user_login: 'User login',
					post_id: 'Post ID',
					referrer: 'Referrer URL'
				}[ hfSource ] || hfSource;
				html  = '<div class="boldform-canvas-hidden-field">';
				html += '<span class="dashicons dashicons-hidden"></span>';
				html += '<span class="boldform-canvas-hidden-field__label">Hidden: ' + escapeHtml( hfSourceLabel );
				if ( 'static' === hfSource && hfValue ) {
					html += ' = <em>' + escapeHtml( hfValue ) + '</em>';
				} else if ( 'url_param' === hfSource && hfValue ) {
					html += ' <code>?' + escapeHtml( hfValue ) + '</code>';
				}
				html += '</span></div>';

			} else if ( field.type === 'image_choice' ) {
				var icOpts = [];
				if ( field.image_choice_options ) {
					try {
						icOpts = typeof field.image_choice_options === 'string'
							? JSON.parse( field.image_choice_options )
							: field.image_choice_options;
					} catch (e) { icOpts = []; }
				}
				var icCols = field.image_choice_columns || 3;
				var icImgH = Math.max( 40, Math.min( 600, Number( field.image_choice_img_height ) || 160 ) );
				// Scale down proportionally for the builder canvas (canvas ~280px wide).
				var icCanvasH = Math.round( icImgH * 0.35 );
				icCanvasH = Math.max( 40, Math.min( 180, icCanvasH ) );
				// Fallback matches normalizeField + the front-end renderer's defaults.
				var icItems = icOpts.length ? icOpts : [
					{ label: 'Option 1', value: 'Option 1', image_url: '' },
					{ label: 'Option 2', value: 'Option 2', image_url: '' },
					{ label: 'Option 3', value: 'Option 3', image_url: '' }
				];
				html = '<div class="boldform-canvas-ic boldform-canvas-ic--' + escapeHtml( String( icCols ) ) + 'col">';
				icItems.slice( 0, 6 ).forEach( function ( opt, i ) {
					var isFirst = ( i === 0 );
					html += '<div class="boldform-canvas-ic__item' + ( isFirst ? ' is-checked' : '' ) + '">';
					html += '<div class="boldform-canvas-ic__img" style="height:' + icCanvasH + 'px">';
					if ( opt.image_url ) {
						html += '<img src="' + escapeHtml( opt.image_url ) + '" alt="' + escapeHtml( opt.label || '' ) + '">';
					} else {
						html += '<span class="dashicons dashicons-format-image"></span>';
					}
					if ( isFirst ) {
						html += '<span class="boldform-canvas-ic__check">&#10003;</span>';
					}
					html += '</div>';
					html += '<span class="boldform-canvas-ic__lbl">' + escapeHtml( opt.label || ( 'Option ' + ( i + 1 ) ) ) + '</span>';
					html += '</div>';
				} );
				html += '</div>';

			} else if ( field.type === 'repeater' ) {
				var repFields = [];
				if ( field.repeater_fields ) {
					try {
						repFields = typeof field.repeater_fields === 'string'
							? JSON.parse( field.repeater_fields )
							: field.repeater_fields;
					} catch (e) { repFields = []; }
				}
				if ( ! Array.isArray( repFields ) ) { repFields = []; }
				var repColsP = Math.max( 1, Math.min( 4, Number( field.repeater_columns ) || 2 ) );
				// Default sub-field labels mirror render_sub_field() in the Pro module so
				// the canvas preview matches the front end when a sub-field has no label.
				var repLabelMap = { text: 'Text', email: 'Email', url: 'URL', tel: 'Phone', number: 'Number', date: 'Date', time: 'Time', textarea: 'Message', select: 'Select', radio: 'Choose one', checkbox: 'Select all' };
				var repSubLabel = function ( sf ) {
					var l = ( sf.label || '' ).toString();
					return ( l && l.replace( /\s+/g, '' ) ) ? l : ( repLabelMap[ sf.type ] || 'Field' );
				};
				// Render a lightweight mockup of each sub-field's control, matching its type
				// (and its options for select/radio/checkbox) so the preview reflects settings.
				var repControl = function ( sf ) {
					var t = sf.type || 'text';
					var ph = ( sf.placeholder || '' ).toString();
					// Text-style controls fall back to the (default) label so the preview box
					// is never empty — mirrors Lite core fields and the front-end render.
					var phText = ph || repSubLabel( sf );
					var opts = Array.isArray( sf.options ) ? sf.options : [];
					if ( 'textarea' === t ) {
						return '<div class="boldform-canvas-repeater__control boldform-canvas-repeater__control--area">' + escapeHtml( phText ) + '</div>';
					}
					if ( 'select' === t ) {
						return '<div class="boldform-canvas-repeater__control boldform-canvas-repeater__control--select"><span>' + escapeHtml( ph || opts[ 0 ] || 'Select…' ) + '</span><svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path fill="#94a3b8" d="M1 1l5 5 5-5"/></svg></div>';
					}
					if ( 'radio' === t || 'checkbox' === t ) {
						var items = opts.length ? opts : [ 'Option 1', 'Option 2' ];
						var markCls = 'boldform-canvas-repeater__mark' + ( 'radio' === t ? ' boldform-canvas-repeater__mark--radio' : '' );
						var ch = '<div class="boldform-canvas-repeater__choices">';
						items.slice( 0, 6 ).forEach( function ( o ) {
							ch += '<span class="boldform-canvas-repeater__choice"><span class="' + markCls + '"></span>' + escapeHtml( ( o || '' ).toString() ) + '</span>';
						} );
						ch += '</div>';
						return ch;
					}
					return '<div class="boldform-canvas-repeater__control">' + escapeHtml( phText ) + '</div>';
				};
				// Show ONLY the configured sub-fields — no fake fallback. A repeater with no
				// sub-fields shows a guidance hint (it starts with two via createField; once
				// the user deletes them all, the canvas reflects that empty state).
				var repCells = repFields.slice( 0, 8 );
				html  = '<div class="boldform-canvas-repeater">';
				if ( ! repCells.length ) {
					html += '<div class="boldform-canvas-repeater__empty" style="padding:10px 12px;color:#9ca3af;font-size:13px;font-style:italic">' + escapeHtml( 'No sub-fields yet — add one in Field Settings.' ) + '</div>';
				} else {
					html += '<div class="boldform-canvas-repeater__row" style="display:grid;grid-template-columns:repeat(' + repColsP + ',minmax(0,1fr));gap:10px 12px;align-items:start">';
					repCells.forEach( function ( sf ) {
						html += '<div class="boldform-canvas-repeater__field">';
						html += '<span class="boldform-canvas-repeater__label">' + escapeHtml( repSubLabel( sf ) ) + ( sf.required ? ' <span class="boldform-required">*</span>' : '' ) + '</span>';
						html += repControl( sf );
						html += '</div>';
					} );
					html += '</div>';
				}
				html += '<div class="boldform-canvas-repeater__add"><span class="dashicons dashicons-plus-alt2"></span> ' + escapeHtml( field.repeater_add_label || 'Add Row' ) + '</div>';
				html += '</div>';

			} else if ( field.type === 'password_field' ) {
				html  = '<div style="display:flex;align-items:center;gap:6px;position:relative">';
				html += '<input type="password" placeholder="' + escapeHtml( field.placeholder || 'Password' ) + '" disabled style="flex:1;padding-right:36px">';
				html += '<span style="position:absolute;right:10px;color:#9ca3af"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>';
				html += '</div>';
				if ( field.confirm_password ) {
					html += '<div style="display:flex;align-items:center;gap:6px;position:relative;margin-top:6px">';
					html += '<input type="password" placeholder="Confirm password" disabled style="flex:1;padding-right:36px">';
					html += '<span style="position:absolute;right:10px;color:#9ca3af"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>';
					html += '</div>';
				}

			} else if ( field.type === 'rich_text' ) {
				var rteH = Math.max( 80, Math.round( ( field.rte_height || 200 ) * 0.45 ) );
				// Mockup of the front-end TinyMCE editor (real editor renders on the front end).
				var rteBtn = 'display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 5px;border:1px solid ' + bfFieldBorder + ';border-radius:4px;background:' + bfFieldBg + ';color:' + bfFieldText + ';font-size:12px;';
				var rteSep = '<span style="width:1px;height:18px;background:' + bfFieldBorder + ';margin:0 2px"></span>';
				html  = '<div style="border:1px solid ' + bfFieldBorder + ';border-radius:' + bfFieldRadius + ';overflow:hidden;background:' + bfFieldBg + '">';
				html += '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:6px 8px;background:' + bfFieldBg + ';border-bottom:1px solid ' + bfFieldBorder + '">';
				html += '<span style="' + rteBtn + 'font-weight:700">B</span>';
				html += '<span style="' + rteBtn + 'font-style:italic">I</span>';
				html += '<span style="' + rteBtn + 'text-decoration:underline">U</span>';
				html += rteSep;
				html += '<span style="' + rteBtn + '">&#8226;</span>';
				html += '<span style="' + rteBtn + '">1.</span>';
				html += rteSep;
				html += '<span style="' + rteBtn + '">&#128279;</span>';
				html += rteSep;
				html += '<span style="' + rteBtn + '">&#8634;</span>';
				html += '<span style="' + rteBtn + '">&#8635;</span>';
				html += '</div>';
				html += '<div style="min-height:' + rteH + 'px;padding:10px 12px;color:' + bfMuted + ';font-size:13px">Rich text content…</div>';
				html += '</div>';

			} else if ( field.type === 'date_range' ) {
				html  = '<div style="position:relative;display:flex;align-items:center">';
				html += '<input type="text" placeholder="' + escapeHtml( field.placeholder || 'Select date range' ) + '" disabled style="width:100%;padding-right:32px">';
				html += '<span style="position:absolute;right:10px;color:#9ca3af"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>';
				html += '</div>';

			} else if ( field.type === 'nps' ) {
				// Each zone (detractor 0-6 / passive 7-8 / promoter 9-10) shows its own
				// colour at rest, derived from the field's zone colours (or the semantic
				// defaults). Mirrors the front-end .bf-nps-btn--<zone> rest styling.
				var npsBase = {
					d:  field.nps_detractor_color || '#ef4444',
					p:  field.nps_passive_color   || '#f59e0b',
					pr: field.nps_promoter_color  || '#22c55e'
				};
				html = '<div style="display:flex;gap:3px;flex-wrap:wrap">';
				for ( var npsI = 0; npsI <= 10; npsI++ ) {
					var npsKey   = npsI <= 6 ? 'd' : ( npsI <= 8 ? 'p' : 'pr' );
					var npsC     = npsBase[ npsKey ];
					var npsBg    = 'color-mix(in srgb, ' + npsC + ' 14%, #fff)';
					var npsBd    = 'color-mix(in srgb, ' + npsC + ' 40%, #fff)';
					html += '<div style="flex:1;min-width:20px;height:32px;border:1px solid ' + npsBd + ';border-radius:4px;background:' + npsBg + ';color:var(--bf-field-text,#374151);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600">' + npsI + '</div>';
				}
				html += '</div>';
				html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;margin-top:4px">';
				html += '<span>' + escapeHtml( field.nps_low_label || 'Not likely' ) + '</span>';
				html += '<span>' + escapeHtml( field.nps_high_label || 'Extremely likely' ) + '</span>';
				html += '</div>';

			} else if ( field.type === 'matrix' ) {
				var matRows = [];
				var matCols = [];
				// Empty/invalid data falls back to the SAME defaults the front-end renderer
				// uses (render_matrix in Pro) so the canvas preview matches what visitors see.
				try { matRows = JSON.parse( field.matrix_rows || '[]' ); } catch(e) { matRows = []; }
				try { matCols = JSON.parse( field.matrix_columns || '[]' ); } catch(e) { matCols = []; }
				if ( ! matRows.length ) matRows = [ 'Row 1', 'Row 2', 'Row 3' ];
				if ( ! matCols.length ) matCols = [ 'Agree', 'Neutral', 'Disagree' ];
				var matType = field.matrix_type || 'radio';
				// Render a styled control SPAN (radio circle / checkbox square) rather than a
				// native <input>: a bare input inherits the generic full-width canvas-input
				// styling and renders as an orange underline instead of a control. Mirrors the
				// front-end's grey outline (matches the product/choice canvas preview approach).
				var matMarkStyle = 'display:inline-block;width:16px;height:16px;border:2px solid ' + bfFieldBorder + ';background:' + bfFieldBg + ';vertical-align:middle;box-sizing:border-box;border-radius:' + ( 'checkbox' === matType ? '4px' : '50%' );
				html = '<div style="overflow-x:auto;border:1px solid ' + bfFieldBorder + ';border-radius:' + bfFieldRadius + '"><table style="width:100%;border-collapse:collapse;font-size:12px;color:' + bfFieldText + '">';
				html += '<thead><tr><th style="border:1px solid ' + bfFieldBorder + ';padding:4px 6px;background:' + bfFieldBg + '"></th>';
				matCols.forEach( function(c) { html += '<th style="border:1px solid ' + bfFieldBorder + ';padding:4px 6px;background:' + bfFieldBg + ';color:' + bfLabelColor + ';text-align:center">' + escapeHtml( c ) + '</th>'; } );
				html += '</tr></thead><tbody>';
				matRows.forEach( function(r) {
					html += '<tr><td style="border:1px solid ' + bfFieldBorder + ';padding:4px 8px;font-weight:500;color:' + bfLabelColor + '">' + escapeHtml( r ) + '</td>';
					matCols.forEach( function() { html += '<td style="border:1px solid ' + bfFieldBorder + ';text-align:center;padding:4px"><span style="' + matMarkStyle + '"></span></td>'; } );
					html += '</tr>';
				} );
				html += '</tbody></table></div>';

			} else if ( field.type === 'lookup' ) {
				html  = '<div style="position:relative;display:flex;align-items:center">';
				html += '<input type="text" placeholder="' + escapeHtml( field.placeholder || 'Type to search…' ) + '" disabled style="width:100%;padding-right:32px">';
				html += '<span style="position:absolute;right:10px;color:#9ca3af"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>';
				html += '</div>';

			} else if ( field.type === 'geolocation' ) {
				html  = '<div style="display:flex;gap:8px;align-items:center">';
				html += '<input type="text" placeholder="Detecting location…" disabled style="flex:1">';
				html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:0 10px;height:36px;background:' + bfAccent + ';color:var(--bf-button-text,#fff);border-radius:' + bfFieldRadius + ';font-size:12px;font-weight:500;white-space:nowrap">';
				html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg> Detect</span>';
				html += '</div>';
				if ( field.geo_show_map ) {
					var geoMapH = Math.max( 40, Math.round( ( field.geo_map_height || 250 ) * 0.3 ) );
					html += '<div style="margin-top:6px;height:' + geoMapH + 'px;background:' + bfFieldBg + ';border:1px solid ' + bfFieldBorder + ';border-radius:' + bfFieldRadius + ';display:flex;align-items:center;justify-content:center;color:' + bfMuted + ';font-size:12px">Map preview</div>';
				}

			} else {
				// Free-text inputs fall back to the label when no placeholder is set
				// (mirrors the front-end renderer).
				html = '<input type="' + escapeHtml( field.type ) + '" placeholder="' + escapeHtml( field.placeholder || field.label || '' ) + '" value="' + escapeHtml( field.default_value ) + '">';
			}

			return label + '<div class="boldform-canvas-field-control">' + html + '</div>';
		}

		function getFormStyleVariables() {
			var focusColorMap = {
				teal: '#0f766e',
				blue: '#2563eb',
				green: '#16a34a',
				dark: '#334155'
			};
			var fieldSize = state.formSettings.field_size || 'small';
			var labelSize = state.formSettings.label_size || 'small';
			var buttonSize = state.formSettings.button_size || 'small';
			var fieldStyle = state.formSettings.field_style || '';
			var sizeMap = {
				small: { fieldY: '10px', fieldX: '12px', fieldFont: '14px', labelFont: '14px', buttonY: '10px', buttonX: '16px', buttonFont: '14px', radius: '6px' },
				medium: { fieldY: '12px', fieldX: '14px', fieldFont: '15px', labelFont: '16px', buttonY: '12px', buttonX: '18px', buttonFont: '15px', radius: '8px' },
				large: { fieldY: '15px', fieldX: '16px', fieldFont: '16px', labelFont: '18px', buttonY: '14px', buttonX: '20px', buttonFont: '16px', radius: '10px' }
			};
			var fieldScale = fieldSize ? sizeMap[ fieldSize ] : sizeMap['small'];
			var labelScale = labelSize ? sizeMap[ labelSize ] : sizeMap['small'];
			var buttonScale = buttonSize ? sizeMap[ buttonSize ] : sizeMap['small'];
			var variables = [];

			if ( 'outline' === fieldStyle || 'soft' === fieldStyle || 'minimal' === fieldStyle ) {
				fieldStyle = 'solid';
			}

			if ( fieldStyle ) {
				variables.push( '--bf-field-border-style:' + fieldStyle );
			}
			if ( '' !== state.formSettings.field_border_width ) {
				variables.push( '--bf-field-border-width:' + Number( state.formSettings.field_border_width ) + 'px' );
			}
			if ( '' !== state.formSettings.field_border_radius ) {
				variables.push( '--bf-field-radius:' + Number( state.formSettings.field_border_radius ) + 'px' );
			}
			if ( state.formSettings.field_background_color ) {
				variables.push( '--bf-field-bg:' + state.formSettings.field_background_color );
			}
			if ( state.formSettings.field_border_color ) {
				variables.push( '--bf-field-border:' + state.formSettings.field_border_color );
			}
			if ( state.formSettings.field_text_color ) {
				variables.push( '--bf-field-text:' + state.formSettings.field_text_color );
			}
			if ( state.formSettings.field_focus_color && focusColorMap[ state.formSettings.field_focus_color ] ) {
				variables.push( '--bf-focus-color:' + focusColorMap[ state.formSettings.field_focus_color ] );
			}
			if ( state.formSettings.label_color ) {
				variables.push( '--bf-label-color:' + state.formSettings.label_color );
			}
			if ( state.formSettings.label_subtext_color ) {
				variables.push( '--bf-subtext-color:' + state.formSettings.label_subtext_color );
			}
			if ( state.formSettings.error_color ) {
				variables.push( '--bf-error-color:' + state.formSettings.error_color );
			}
			if ( labelScale ) {
				variables.push( '--bf-label-font-size:' + labelScale.labelFont );
			}
			if ( fieldScale ) {
				variables.push( '--bf-field-padding-y:' + fieldScale.fieldY );
				variables.push( '--bf-field-padding-x:' + fieldScale.fieldX );
				variables.push( '--bf-field-font-size:' + fieldScale.fieldFont );
				variables.push( '--bf-field-radius:' + fieldScale.radius );
			}
			if ( state.formSettings.button_border_style ) {
				variables.push( '--bf-button-border-style:' + state.formSettings.button_border_style );
			}
			if ( '' !== state.formSettings.button_border_width ) {
				variables.push( '--bf-button-border-width:' + Number( state.formSettings.button_border_width ) + 'px' );
			}
			if ( '' !== state.formSettings.button_border_radius ) {
				variables.push( '--bf-button-radius:' + Number( state.formSettings.button_border_radius ) + 'px' );
			}
			if ( state.formSettings.button_background_color ) {
				variables.push( '--bf-button-bg:' + state.formSettings.button_background_color );
			}
			if ( state.formSettings.button_border_color ) {
				variables.push( '--bf-button-border:' + state.formSettings.button_border_color );
			}
			if ( state.formSettings.button_text_color ) {
				variables.push( '--bf-button-text:' + state.formSettings.button_text_color );
			}
			if ( buttonScale ) {
				variables.push( '--bf-button-padding-y:' + buttonScale.buttonY );
				variables.push( '--bf-button-padding-x:' + buttonScale.buttonX );
				variables.push( '--bf-button-font-size:' + buttonScale.buttonFont );
				variables.push( '--bf-button-radius:' + buttonScale.radius );
			}

			return variables.join( ';' ) + ( variables.length ? ';' : '' );
		}

		// Resolves the advanced per-device style vars into a single cascaded map.
		// Tablet inherits desktop; mobile inherits desktop+tablet — matching how the
		// front-end media queries stack (max-width:1024 then max-width:767).
		function resolveDeviceStyleVars( device ) {
			var style = state.formSettings.style || { desktop: {}, tablet: {}, mobile: {} };
			var order = [ 'desktop' ];
			if ( 'tablet' === device ) { order = [ 'desktop', 'tablet' ]; }
			if ( 'mobile' === device ) { order = [ 'desktop', 'tablet', 'mobile' ]; }
			var merged = {};
			order.forEach( function ( layer ) {
				var vars = style[ layer ] || {};
				Object.keys( vars ).forEach( function ( key ) {
					if ( '' !== vars[ key ] && null != vars[ key ] ) {
						merged[ key ] = vars[ key ];
					}
				} );
			} );
			return merged;
		}

		function styleVarsObjectToString( obj ) {
			var out = '';
			Object.keys( obj ).forEach( function ( key ) {
				out += key + ':' + obj[ key ] + ';';
			} );
			return out;
		}

		// Builds the CSS for one preview surface, scoped to its selector. The builder
		// preview can't rely on viewport media queries (the editor viewport is always
		// "desktop"-wide), so it emits the fully RESOLVED vars for state.activeDevice
		// directly; the device toggle additionally resizes the preview container.
		function getFormStyleBlock( scopeSelector ) {
			var decl = getFormStyleVariables() + styleVarsObjectToString( resolveDeviceStyleVars( state.activeDevice ) );
			return decl ? scopeSelector + '{' + decl + '}' : '';
		}

		// Single shared <style> node carrying the scoped rules for all three preview
		// surfaces. Replaces the legacy inline style="" on each canvas so responsive
		// device resolution (and, later, more complex rules) is possible.
		function applyPreviewStyleBlock() {
			var node = document.getElementById( 'boldform-preview-style' );
			if ( ! node ) {
				node = document.createElement( 'style' );
				node.id = 'boldform-preview-style';
				document.head.appendChild( node );
			}
			node.textContent =
				getFormStyleBlock( '#boldform-canvas' ) +
				getFormStyleBlock( '#boldform-style-preview-canvas' ) +
				getFormStyleBlock( '#boldform-template-preview-canvas' );
		}

		function getStyleControlValue( value, fallback ) {
			return value || fallback;
		}

		function normalizeStyleColorValue( value, fallback ) {
			return value === fallback ? '' : value;
		}

		function renderCanvas() {
			var $rows = $( '#boldform-canvas-rows' );
			var $empty = $( '#boldform-canvas-empty' );
			var markup = '';
			var canvasClasses = 'boldform-canvas';

			$rows.empty();
			$( '#boldform-canvas' ).attr( 'class', canvasClasses );
			applyPreviewStyleBlock();

			if ( ! getAllRows().length ) {
				$empty.show();
				return;
			}

			$empty.hide();

			getAllRows().forEach(
				function ( row, rowIndex ) {
					var rowSelected = state.selectedRowIndex === rowIndex;
					markup += '<section class="boldform-row' + ( rowSelected ? ' is-row-selected' : '' ) + '" data-row-index="' + rowIndex + '">';
					markup += '<div class="boldform-row__head"><strong>' + escapeHtml( boldformLiteBuilder.labels.row ) + ' ' + ( rowIndex + 1 ) + '</strong><span>' + row.columns.length + ' ' + escapeHtml( boldformLiteBuilder.labels.columns ) + '</span><div class="boldform-row__actions">';
					markup += '<button type="button" class="boldform-action-icon boldform-row-settings' + ( rowSelected ? ' is-active' : '' ) + '" title="' + escapeHtml( boldformLiteBuilder.labels.rowSettings || 'Row settings' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.rowSettings || 'Row settings' ) + '"><span class="dashicons dashicons-admin-generic"></span></button>';
					markup += '<button type="button" class="boldform-action-icon boldform-row-move" title="Move row" aria-label="Move row" draggable="true"><span class="dashicons dashicons-move"></span></button>';
					markup += '<button type="button" class="boldform-action-icon boldform-row-duplicate" title="Duplicate row" aria-label="Duplicate row"><span class="dashicons dashicons-admin-page"></span></button>';
					markup += '<button type="button" class="boldform-action-icon is-danger boldform-row-delete" title="Delete row" aria-label="Delete row"><span class="dashicons dashicons-trash"></span></button>';
					markup += '</div></div>';
					markup += '<div class="boldform-row__columns">';

					row.columns.forEach(
						function ( column, columnIndex ) {
							var columnClasses = 'boldform-column';
							var isActive = state.activeColumn && state.activeColumn.rowIndex === rowIndex && state.activeColumn.columnIndex === columnIndex;

							if ( isActive ) {
								columnClasses += ' is-active';
							}

							markup += '<div class="' + columnClasses + '" data-row-index="' + rowIndex + '" data-column-index="' + columnIndex + '" style="width:' + escapeHtml( column.width ) + ';">';
							markup += '<div class="boldform-column__head"><span>' + escapeHtml( column.width ) + '</span><span>' + column.fields.length + ' ' + escapeHtml( boldformLiteBuilder.labels.fields ) + '</span></div>';
							var fieldsClasses = 'boldform-column-fields' + ( column.fields.length ? '' : ' is-empty' );
							markup += '<div class="' + fieldsClasses + '" data-row-index="' + rowIndex + '" data-column-index="' + columnIndex + '">';

							if ( ! column.fields.length ) {
								markup += '<div class="boldform-column__empty">' + escapeHtml( boldformLiteBuilder.labels.dropHere ) + '</div>';
							}

							column.fields.forEach(
								function ( field ) {
									var fieldClasses = 'boldform-canvas-field';
									var fieldLabelPos = field.label_placement || 'top';

									if ( field.id === state.selectedFieldId ) {
										fieldClasses += ' is-selected';
									}
									if ( fieldLabelPos !== 'top' ) {
										fieldClasses += ' is-label-' + fieldLabelPos;
									}

									markup += '<div class="' + fieldClasses + '" data-field-id="' + escapeHtml( field.id ) + '">';
									markup += '<div class="boldform-canvas-field-actions">';
									markup += '<span class="boldform-action-icon boldform-move-field" title="' + escapeHtml( boldformLiteBuilder.labels.moveField || 'Move field' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.moveField || 'Move field' ) + '" draggable="true"><span class="dashicons dashicons-move"></span></span>';
									markup += '<button type="button" class="boldform-action-icon boldform-edit-field" title="Edit field" aria-label="Edit field"><span class="dashicons dashicons-edit"></span></button>';
									markup += '<button type="button" class="boldform-action-icon boldform-duplicate-field" title="' + escapeHtml( boldformLiteBuilder.actions.duplicate ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.actions.duplicate ) + '"><span class="dashicons dashicons-admin-page"></span></button>';
									markup += '<button type="button" class="boldform-action-icon is-danger boldform-delete-field" title="' + escapeHtml( boldformLiteBuilder.actions.delete ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.actions.delete ) + '"><span class="dashicons dashicons-trash"></span></button>';
									markup += '</div>';
									markup += '<div class="boldform-canvas-field-body">';
									markup += renderInputPreview( field );
									markup += '</div></div>';
								}
							);

							markup += '</div></div>';
						}
					);

					markup += '</div></section>';
				}
			);

			// Only show the fixed bottom button if no draggable submit field exists in the structure.
			if ( ! hasSubmitField() ) {
				var submitMarkup = '<button type="button" class="boldform-canvas-submit__button' + ( state.selectedFieldId === submitButtonId ? ' is-selected' : '' ) + '" data-field-id="' + submitButtonId + '">' + buildButtonContent() + '</button>';
				markup += '<div class="boldform-canvas-submit is-align-' + escapeHtml( state.formSettings.button_alignment || 'left' ) + '">' + submitMarkup + '</div>';
			}

			markup += '<button type="button" class="boldform-canvas-add-row" id="boldform-add-row-canvas">';
			markup += '<span class="dashicons dashicons-plus-alt2"></span> ';
			markup += escapeHtml( boldformLiteBuilder.labels.addRow || 'Add Row' );
			markup += '</button>';

			$rows.html( markup );
			setupSortables();
		}

		function renderSettingsPanel() {
			var selected = getSelectedFieldLocation();
			var $panel = $( '#boldform-settings-panel' );
			var $empty = $( '#boldform-settings-empty' );
			var optionsMarkup = '';
			var isChoiceField = false;

			// Row settings.
			if ( state.selectedRowIndex !== null ) {
				var rowObj = getAllRows()[ state.selectedRowIndex ];
				if ( rowObj ) {
					$empty.hide();
					var colWidths = '';

					rowObj.columns.forEach( function ( col, ci ) {
						colWidths += '<div class="boldform-setting-group">' +
							'<label>' + escapeHtml( ( boldformLiteBuilder.labels.column || 'Column' ) + ' ' + ( ci + 1 ) + ' ' + ( boldformLiteBuilder.labels.width || 'Width' ) ) + '</label>' +
							'<input type="text" class="boldform-row-col-width" data-col-index="' + ci + '" value="' + escapeHtml( col.width ) + '" placeholder="50%">' +
						'</div>';
					} );

					// Build layout preset buttons for changing columns.
					var layoutPresets = [
						{ label: '1', widths: '100%' },
						{ label: '2', widths: '50%,50%' },
						{ label: '3', widths: '33.33%,33.33%,33.33%' },
						{ label: '2:1', widths: '66.66%,33.33%' },
						{ label: '1:2', widths: '33.33%,66.66%' },
						{ label: '4', widths: '25%,25%,25%,25%' }
					];
					var layoutHtml = '<div class="boldform-setting-group"><label>' + escapeHtml( boldformLiteBuilder.labels.columnLayout || 'Column Layout' ) + '</label><div class="boldform-row-layout-presets">';
					layoutPresets.forEach( function ( preset ) {
						var isActive = preset.widths === rowObj.columns.map( function( c ) { return c.width; } ).join( ',' );
						layoutHtml += '<button type="button" class="boldform-row-layout-btn' + ( isActive ? ' is-active' : '' ) + '" data-widths="' + escapeHtml( preset.widths ) + '" title="' + escapeHtml( preset.label ) + '">';
						preset.widths.split( ',' ).forEach( function ( w ) {
							layoutHtml += '<span style="width:' + escapeHtml( w ) + '"></span>';
						} );
						layoutHtml += '</button>';
					} );
					layoutHtml += '</div></div>';

					$panel.removeAttr( 'hidden' ).html(
						'<div class="boldform-setting-group">' +
							'<label>' + escapeHtml( boldformLiteBuilder.labels.selectedField || 'Selected' ) + '</label>' +
							'<div class="boldform-setting-field-name">' + escapeHtml( ( boldformLiteBuilder.labels.row || 'Row' ) + ' ' + ( state.selectedRowIndex + 1 ) ) + '</div>' +
						'</div>' +
						layoutHtml +
						colWidths +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-row-css-class">' + escapeHtml( boldformLiteBuilder.labels.cssClass || 'CSS Class' ) + '</label>' +
							'<input type="text" id="boldform-setting-row-css-class" value="' + escapeHtml( rowObj.css_class || '' ) + '" placeholder="my-custom-row">' +
						'</div>'
					);
					return;
				}
			}

			var isSubmitSelected = state.selectedFieldId === submitButtonId || ( selected && selected.field && 'submit' === selected.field.type );

			if ( isSubmitSelected ) {
				$empty.hide();
				$panel.removeAttr( 'hidden' ).html(
					'<div class="boldform-setting-group">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.selectedField ) + '</label>' +
						'<div class="boldform-setting-field-name">' + escapeHtml( boldformLiteBuilder.labels.submitButton ) + '</div>' +
					'</div>' +
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-button-text">' + escapeHtml( boldformLiteBuilder.labels.buttonText ) + '</label>' +
						'<input type="text" id="boldform-setting-button-text" value="' + escapeHtml( state.formSettings.button_text ) + '">' +
					'</div>' +
					'<div class="boldform-setting-group">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.buttonAlignment ) + '</label>' +
						'<div class="boldform-btn-group" id="boldform-setting-button-alignment">' +
							'<button type="button" class="boldform-btn-group__btn' + ( 'left' === state.formSettings.button_alignment ? ' is-active' : '' ) + '" data-value="left"><span class="dashicons dashicons-editor-alignleft"></span></button>' +
							'<button type="button" class="boldform-btn-group__btn' + ( 'center' === state.formSettings.button_alignment ? ' is-active' : '' ) + '" data-value="center"><span class="dashicons dashicons-editor-aligncenter"></span></button>' +
							'<button type="button" class="boldform-btn-group__btn' + ( 'right' === state.formSettings.button_alignment ? ' is-active' : '' ) + '" data-value="right"><span class="dashicons dashicons-editor-alignright"></span></button>' +
						'</div>' +
					'</div>' +
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-button-icon-type">' + escapeHtml( boldformLiteBuilder.labels.buttonIconType || 'Icon' ) + '</label>' +
						'<select id="boldform-setting-button-icon-type">' +
							'<option value="none"' + ( 'none' === ( state.formSettings.button_icon_type || 'none' ) ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.none || 'None' ) + '</option>' +
							'<option value="dashicon"' + ( 'dashicon' === state.formSettings.button_icon_type ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.dashicon || 'Dashicon' ) + '</option>' +
							'<option value="svg"' + ( 'svg' === state.formSettings.button_icon_type ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.customSvg || 'Custom SVG' ) + '</option>' +
						'</select>' +
					'</div>' +
					( 'dashicon' === state.formSettings.button_icon_type ? ( function () {
						var dashicons = [
							'dashicons-arrow-right-alt',
							'dashicons-arrow-right-alt2',
							'dashicons-arrow-right',
							'dashicons-arrow-left-alt',
							'dashicons-arrow-left-alt2',
							'dashicons-arrow-left',
							'dashicons-arrow-up-alt',
							'dashicons-arrow-up-alt2',
							'dashicons-arrow-up',
							'dashicons-arrow-down-alt',
							'dashicons-arrow-down-alt2',
							'dashicons-arrow-down',
							'dashicons-controls-forward',
							'dashicons-controls-back',
							'dashicons-controls-play',
							'dashicons-redo',
							'dashicons-undo',
							'dashicons-update',
							'dashicons-leftright',
							'dashicons-sort',
							'dashicons-randomize',
							'dashicons-external',
							'dashicons-migrate',
							'dashicons-move',
							'dashicons-download',
							'dashicons-upload',
							'dashicons-exit',
							'dashicons-plus',
							'dashicons-plus-alt',
							'dashicons-plus-alt2',
							'dashicons-minus',
							'dashicons-yes',
							'dashicons-yes-alt',
							'dashicons-no',
							'dashicons-no-alt',
							'dashicons-dismiss',
							'dashicons-saved',
							'dashicons-email',
							'dashicons-email-alt',
							'dashicons-cart',
							'dashicons-heart',
							'dashicons-star-filled',
							'dashicons-lock',
							'dashicons-unlock',
							'dashicons-search',
							'dashicons-share',
							'dashicons-share-alt',
							'dashicons-share-alt2',
							'dashicons-insert',
							'dashicons-paperclip',
							'dashicons-edit'
						];
						var current = state.formSettings.button_icon_dashicon || 'dashicons-arrow-right-alt';
						var opts = '';
						for ( var i = 0; i < dashicons.length; i++ ) {
							opts += '<option value="' + dashicons[ i ] + '"' + ( dashicons[ i ] === current ? ' selected' : '' ) + '>' + dashicons[ i ].replace( 'dashicons-', '' ) + '</option>';
						}
						return '<div class="boldform-setting-group">' +
							'<label for="boldform-setting-button-icon-dashicon">' + escapeHtml( boldformLiteBuilder.labels.dashiconClass || 'Dashicon' ) + '</label>' +
							'<div style="display:flex;align-items:center;gap:8px;">' +
								'<select id="boldform-setting-button-icon-dashicon" style="flex:1;">' + opts + '</select>' +
								'<span class="dashicons ' + escapeHtml( current ) + '" style="font-size:20px;width:20px;height:20px;color:#555;"></span>' +
							'</div>' +
						'</div>';
					}() ) : ''
					) +
					( 'svg' === state.formSettings.button_icon_type ? ( function () {
						var svgUrl = state.formSettings.button_icon_svg || '';
						return '<div class="boldform-setting-group">' +
							'<label>' + escapeHtml( boldformLiteBuilder.labels.svgCode || 'SVG Icon' ) + '</label>' +
							'<div class="boldform-svg-upload-wrap">' +
								( svgUrl ?
									'<div class="boldform-svg-preview">' +
										'<img src="' + escapeHtml( svgUrl ) + '" class="boldform-svg-preview__img" alt="icon">' +
										'<span class="boldform-svg-preview__name">' + escapeHtml( svgUrl.split( '/' ).pop() ) + '</span>' +
										'<button type="button" class="boldform-svg-remove" title="Remove">' +
											'<span class="dashicons dashicons-no-alt"></span>' +
										'</button>' +
									'</div>' : ''
								) +
								'<button type="button" class="boldform-svg-upload-btn" id="boldform-svg-upload-btn">' +
									'<span class="dashicons dashicons-upload"></span> ' +
									escapeHtml( svgUrl ? ( boldformLiteBuilder.labels.changeSvg || 'Change SVG' ) : ( boldformLiteBuilder.labels.uploadSvg || 'Upload SVG' ) ) +
								'</button>' +
							'</div>' +
						'</div>';
					}() ) : ''
					) +
					( 'none' !== ( state.formSettings.button_icon_type || 'none' ) ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-button-icon-position">' + escapeHtml( boldformLiteBuilder.labels.iconPosition || 'Icon position' ) + '</label>' +
							'<select id="boldform-setting-button-icon-position">' +
								'<option value="left"' + ( 'left' === state.formSettings.button_icon_position ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.left ) + '</option>' +
								'<option value="right"' + ( 'right' === ( state.formSettings.button_icon_position || 'right' ) ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.right ) + '</option>' +
							'</select>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-button-icon-gap">' + escapeHtml( boldformLiteBuilder.labels.iconGap || 'Icon gap (px)' ) + '</label>' +
							'<input type="number" id="boldform-setting-button-icon-gap" value="' + escapeHtml( state.formSettings.button_icon_gap || '8' ) + '" min="0" max="30" placeholder="8">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-button-icon-size">' + escapeHtml( boldformLiteBuilder.labels.iconSize || 'Icon size (px)' ) + '</label>' +
							'<input type="number" id="boldform-setting-button-icon-size" value="' + escapeHtml( state.formSettings.button_icon_size || '18' ) + '" min="10" max="60" placeholder="18">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-button-icon-color">' + escapeHtml( boldformLiteBuilder.labels.iconColor || 'Icon color' ) + '</label>' +
							'<div class="boldform-color-wrap"><input type="color" id="boldform-setting-button-icon-color" value="' + escapeHtml( state.formSettings.button_icon_color || '#ffffff' ) + '"><span class="boldform-color-preview" style="background:' + escapeHtml( state.formSettings.button_icon_color || '#ffffff' ) + '"></span></div>' +
						'</div>' +
						'<p class="description" style="color:#9ca3af;font-size:12px;margin:4px 0">Clear the button text above for an icon-only button.</p>' : ''
					)
				);
				return;
			}

			if ( ! selected ) {
				$empty.show();
				$panel.attr( 'hidden', true ).empty();
				return;
			}

			isChoiceField = selected.field.type === 'checkbox' || selected.field.type === 'radio';

			if ( optionFieldTypes.indexOf( selected.field.type ) !== -1 ) {
				var isMultiDefault = selected.field.type === 'checkbox' || selected.field.type === 'multiselect';
				var defaultInputType = isMultiDefault ? 'checkbox' : 'radio';
				var currentDefaults = isMultiDefault
					? ( selected.field.default_value || '' ).split( ',' ).map( function ( v ) { return $.trim( v ); } ).filter( function ( v ) { return v.length; } )
					: [ $.trim( selected.field.default_value || '' ) ];

				optionsMarkup = '<div class="boldform-setting-group">';
				optionsMarkup += '<label>' + escapeHtml( boldformLiteBuilder.labels.options ) + '</label>';
				optionsMarkup += '<div class="boldform-options-repeater" id="boldform-options-repeater" data-field-type="' + escapeHtml( selected.field.type ) + '">';

				selected.field.options.forEach( function ( option, index ) {
					var trimmed = $.trim( option );
					var isDefault = trimmed.length > 0 && currentDefaults.indexOf( trimmed ) !== -1;
					optionsMarkup += '<div class="boldform-options-repeater__item" data-option-index="' + index + '">';
					optionsMarkup += '<label class="boldform-options-repeater__default' + ( isDefault ? ' is-checked' : '' ) + '" title="' + escapeHtml( boldformLiteBuilder.labels.setDefault || 'Set as default' ) + '">';
					optionsMarkup += '<input type="' + defaultInputType + '" name="boldform-option-default" value="' + index + '"' + ( isDefault ? ' checked' : '' ) + '>';
					optionsMarkup += '<span class="boldform-options-repeater__' + ( isMultiDefault ? 'checkbox' : 'radio' ) + '"></span>';
					optionsMarkup += '</label>';
					optionsMarkup += '<span class="boldform-options-repeater__drag" draggable="true"><span class="dashicons dashicons-menu"></span></span>';
					optionsMarkup += '<input type="text" class="boldform-options-repeater__input" value="' + escapeHtml( option ) + '" placeholder="' + escapeHtml( boldformLiteBuilder.labels.optionPlaceholder || 'Option value' ) + '">';
					optionsMarkup += '<button type="button" class="boldform-options-repeater__remove" title="' + escapeHtml( boldformLiteBuilder.actions.delete || 'Remove' ) + '"><span class="dashicons dashicons-no-alt"></span></button>';
					optionsMarkup += '</div>';
				} );

				optionsMarkup += '</div>';
				optionsMarkup += '<button type="button" class="boldform-options-repeater__add" id="boldform-option-add"><span class="dashicons dashicons-plus-alt2"></span> ' + escapeHtml( boldformLiteBuilder.labels.addOption || 'Add Option' ) + '</button>';
				optionsMarkup += '</div>';
			}

			if ( isChoiceField ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.optionsLayout || 'Layout' ) + '</label>' +
						'<select id="boldform-setting-options-layout">' +
							'<option value="block"' + ( 'inline' !== selected.field.options_layout ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.optionsLayoutBlock || 'Stacked (default)' ) + '</option>' +
							'<option value="inline"' + ( 'inline' === selected.field.options_layout ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.optionsLayoutInline || 'Inline' ) + '</option>' +
						'</select>' +
					'</div>';
			}

			// Checkbox-only: render as a toggle switch instead of a square box.
			if ( selected.field.type === 'checkbox' ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.checkboxStyle || 'Style' ) + '</label>' +
						'<select id="boldform-setting-checkbox-style">' +
							'<option value="default"' + ( 'switch' !== selected.field.checkbox_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.checkboxStyleDefault || 'Checkbox' ) + '</option>' +
							'<option value="switch"' + ( 'switch' === selected.field.checkbox_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.checkboxStyleSwitch || 'Switch' ) + '</option>' +
						'</select>' +
					'</div>';
			}

			if ( selected.field.type === 'select' ) {
				optionsMarkup +=
					'<div class="boldform-switch-item">' +
						'<label class="boldform-switch__row">' +
							'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.selectSearchable || 'Enable search' ) + '</span>' +
							'<input type="checkbox" id="boldform-setting-select-searchable"' + ( selected.field.select_searchable ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
						'</label>' +
					'</div>';
			}

			// Name field settings.
			if ( selected.field.type === 'name' ) {
				optionsMarkup +=
					'<div class="boldform-switch-item">' +
						'<label class="boldform-switch__row">' +
							'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.showMiddleName || 'Middle Name' ) + '</span>' +
							'<input type="checkbox" id="boldform-setting-show-middle-name"' + ( selected.field.show_middle_name ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
						'</label>' +
					'</div>' +
					'<div class="boldform-switch-item">' +
						'<label class="boldform-switch__row">' +
							'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.showLastName || 'Last Name' ) + '</span>' +
							'<input type="checkbox" id="boldform-setting-show-last-name"' + ( selected.field.show_last_name ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
						'</label>' +
					'</div>';
			}

			// Address field settings.
			if ( selected.field.type === 'address' ) {
				var addrLabels = {
					street: boldformLiteBuilder.labels.street || 'Street Address',
					city: boldformLiteBuilder.labels.city || 'City',
					state: boldformLiteBuilder.labels.state || 'State / Province',
					zip: boldformLiteBuilder.labels.zip || 'ZIP / Postal Code',
					country: boldformLiteBuilder.labels.country || 'Country'
				};
				var af = selected.field.address_fields || {};
				var addrOrder = selected.field.address_order || [ 'street', 'city', 'state', 'zip', 'country' ];
				optionsMarkup += '<div class="boldform-setting-group"><label>' + escapeHtml( boldformLiteBuilder.labels.addressFields || 'Address Fields' ) + '</label></div>';
				optionsMarkup += '<div class="boldform-addr-list" id="boldform-addr-list">';
				addrOrder.forEach( function ( key ) {
					var isOn = af[ key ] !== false;
					optionsMarkup +=
						'<div class="boldform-addr-item" data-addr-key="' + key + '">' +
							'<span class="boldform-addr-item__drag" draggable="true"><span class="dashicons dashicons-menu"></span></span>' +
							'<span class="boldform-addr-item__label">' + escapeHtml( addrLabels[ key ] || key ) + '</span>' +
							'<label class="boldform-addr-item__toggle">' +
								'<input type="checkbox" class="boldform-setting-address-field" data-addr-key="' + key + '"' + ( isOn ? ' checked' : '' ) + '>' +
								'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
							'</label>' +
						'</div>';
				} );
				optionsMarkup += '</div>';
			}

			// Input mask settings.
			if ( selected.field.type === 'input_mask' ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-mask-pattern">' + escapeHtml( boldformLiteBuilder.labels.maskPattern || 'Mask Pattern' ) + '</label>' +
						'<select id="boldform-setting-mask-pattern">' +
							'<option value=""' + ( ! selected.field.mask_pattern ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.noMask || 'No mask' ) + '</option>' +
							'<option value="(999) 999-9999"' + ( '(999) 999-9999' === selected.field.mask_pattern ? ' selected' : '' ) + '>Phone: (999) 999-9999</option>' +
							'<option value="99/99/9999"' + ( '99/99/9999' === selected.field.mask_pattern ? ' selected' : '' ) + '>Date: 99/99/9999</option>' +
							'<option value="9999-9999-9999-9999"' + ( '9999-9999-9999-9999' === selected.field.mask_pattern ? ' selected' : '' ) + '>Card: 9999-9999-9999-9999</option>' +
							'<option value="99:99"' + ( '99:99' === selected.field.mask_pattern ? ' selected' : '' ) + '>Time: 99:99</option>' +
							'<option value="999.999.999-99"' + ( '999.999.999-99' === selected.field.mask_pattern ? ' selected' : '' ) + '>CPF: 999.999.999-99</option>' +
							'<option value="custom"' + ( selected.field.mask_pattern && [ '(999) 999-9999', '99/99/9999', '9999-9999-9999-9999', '99:99', '999.999.999-99' ].indexOf( selected.field.mask_pattern ) === -1 ? ' selected' : '' ) + '>Custom</option>' +
						'</select>' +
					'</div>';

				var presetMasks = [ '(999) 999-9999', '99/99/9999', '9999-9999-9999-9999', '99:99', '999.999.999-99', '' ];
				if ( selected.field.mask_pattern && presetMasks.indexOf( selected.field.mask_pattern ) === -1 ) {
					optionsMarkup +=
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-mask-custom">' + escapeHtml( boldformLiteBuilder.labels.customMask || 'Custom Mask' ) + '</label>' +
							'<input type="text" id="boldform-setting-mask-custom" value="' + escapeHtml( selected.field.mask_pattern ) + '" placeholder="999-AAA-***">' +
							'<p>9 = digit, A = letter, * = any</p>' +
						'</div>';
				}
			}

			// Numeric settings.
			if ( selected.field.type === 'numeric' || selected.field.type === 'slider_range' ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-min-value">' + escapeHtml( boldformLiteBuilder.labels.minValue || 'Min Value' ) + '</label>' +
						'<input type="number" id="boldform-setting-min-value" value="' + escapeHtml( selected.field.min_value ) + '" placeholder="0">' +
					'</div>' +
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-max-value">' + escapeHtml( boldformLiteBuilder.labels.maxValue || 'Max Value' ) + '</label>' +
						'<input type="number" id="boldform-setting-max-value" value="' + escapeHtml( selected.field.max_value ) + '" placeholder="100">' +
					'</div>' +
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-step-value">' + escapeHtml( boldformLiteBuilder.labels.stepValue || 'Step' ) + '</label>' +
						'<input type="number" id="boldform-setting-step-value" value="' + escapeHtml( selected.field.step_value ) + '" placeholder="1">' +
					'</div>';
			}

			if ( selected.field.type === 'slider_range' ) {
				optionsMarkup +=
					'<div class="boldform-switch-item">' +
						'<label class="boldform-switch__row">' +
							'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.dualHandle || 'Dual range (min–max)' ) + '</span>' +
							'<input type="checkbox" id="boldform-setting-dual-handle"' + ( selected.field.dual_handle ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
						'</label>' +
					'</div>' +
					'<div class="boldform-setting-row">' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-slider-color">' + escapeHtml( boldformLiteBuilder.labels.sliderColor || 'Track Color' ) + '</label>' +
							'<div class="bf-color-reset-wrap">' +
								'<input type="color" id="boldform-setting-slider-color" value="' + escapeHtml( selected.field.slider_color || state.formSettings.button_background_color || '#0f766e' ) + '">' +
								'<button type="button" class="bf-color-reset" data-color-reset="slider_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to theme color' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to theme color' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-slider-height">' + escapeHtml( boldformLiteBuilder.labels.sliderHeight || 'Track Height (px)' ) + '</label>' +
							'<input type="number" id="boldform-setting-slider-height" value="' + escapeHtml( selected.field.slider_height || '8' ) + '" min="2" max="20" placeholder="8">' +
						'</div>' +
					'</div>';
			}

			// Star rating settings.
			if ( selected.field.type === 'star_rating' ) {
				optionsMarkup +=
					'<div class="boldform-setting-row">' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-max-stars">' + escapeHtml( boldformLiteBuilder.labels.maxStars || 'Number of Stars' ) + '</label>' +
							'<input type="number" id="boldform-setting-max-stars" value="' + escapeHtml( selected.field.max_stars || 5 ) + '" min="1" max="10" placeholder="5">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-star-size">' + escapeHtml( boldformLiteBuilder.labels.starSizeField || 'Icon Size (px)' ) + '</label>' +
							'<input type="number" id="boldform-setting-star-size" value="' + escapeHtml( selected.field.star_size || '20' ) + '" min="12" max="60" placeholder="20">' +
						'</div>' +
					'</div>' +
					'<div class="boldform-setting-row">' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-star-inactive-color" class="boldform-setting-sublabel">' + escapeHtml( boldformLiteBuilder.labels.starColorField || 'Star Color' ) + '</label>' +
							'<div class="bf-color-reset-wrap">' +
								'<input type="color" id="boldform-setting-star-inactive-color" value="' + escapeHtml( selected.field.star_inactive_color || '#cbd5e1' ) + '">' +
								'<button type="button" class="bf-color-reset" data-color-reset="star_inactive_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-star-color" class="boldform-setting-sublabel">' + escapeHtml( boldformLiteBuilder.labels.starActiveColorField || 'Active Color' ) + '</label>' +
							'<div class="bf-color-reset-wrap">' +
								'<input type="color" id="boldform-setting-star-color" value="' + escapeHtml( selected.field.star_color || state.formSettings.button_background_color || '#f59e0b' ) + '">' +
								'<button type="button" class="bf-color-reset" data-color-reset="star_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
							'</div>' +
						'</div>' +
					'</div>';
			}

			// Paragraph content.
			if ( selected.field.type === 'paragraph' ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-content">' + escapeHtml( boldformLiteBuilder.labels.paragraphText || 'Paragraph Text' ) + '</label>' +
						'<textarea id="boldform-setting-content" rows="4">' + escapeHtml( selected.field.content || '' ) + '</textarea>' +
					'</div>';
			}

			// HTML editor rich text.
			if ( selected.field.type === 'html_editor' ) {
				optionsMarkup +=
					'<div class="boldform-setting-group">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.defaultContent || 'Content' ) + '</label>' +
						'<div class="boldform-richtext">' +
							'<div class="boldform-richtext__toolbar">' +
								'<button type="button" data-cmd="bold" title="Bold"><b>B</b></button>' +
								'<button type="button" data-cmd="italic" title="Italic"><i>I</i></button>' +
								'<button type="button" data-cmd="underline" title="Underline"><u>U</u></button>' +
								'<span class="boldform-richtext__sep"></span>' +
								'<button type="button" data-cmd="justifyLeft" title="Align Left"><span class="dashicons dashicons-editor-alignleft"></span></button>' +
								'<button type="button" data-cmd="justifyCenter" title="Center"><span class="dashicons dashicons-editor-aligncenter"></span></button>' +
								'<button type="button" data-cmd="justifyRight" title="Align Right"><span class="dashicons dashicons-editor-alignright"></span></button>' +
								'<span class="boldform-richtext__sep"></span>' +
								'<button type="button" data-cmd="insertUnorderedList" title="Bullet List"><span class="dashicons dashicons-editor-ul"></span></button>' +
								'<button type="button" data-cmd="insertOrderedList" title="Numbered List"><span class="dashicons dashicons-editor-ol"></span></button>' +
							'</div>' +
							// Intentional raw-HTML sink: seeds the contenteditable editor with the
							// admin-authored rich text. It is re-sanitized server-side via
							// wp_kses_post() on save, so it is injected unescaped to keep formatting.
							'<div class="boldform-richtext__editor" id="boldform-richtext-editor" contenteditable="true">' + ( selected.field.content || '' ) + '</div>' +
						'</div>' +
					'</div>';
			}

			// Build conditional logic setup.
			var condFields = getAllFields().filter( function ( f ) { return f.id !== selected.field.id && specialFieldTypes.indexOf( f.type ) === -1; } );
			var cond = selected.field.conditional || {};
			// Ensure multi-condition structure (no separate actions — always show/hide this field).
			if ( ! cond.conditions ) {
				cond = {
					enabled:    !! cond.enabled,
					action:     cond.action || 'show',
					logic:      'AND',
					conditions: [ { field_id: cond.field_id || '', operator: cond.operator || 'is', value: cond.value || '' } ],
				};
				selected.field.conditional = cond;
			}

			function buildCondFieldOptions( selectedId ) {
				var opts = '<option value="">' + escapeHtml( boldformLiteBuilder.labels.selectField || '— select field —' ) + '</option>';
				condFields.forEach( function ( f ) {
					opts += '<option value="' + escapeHtml( f.id ) + '"' + ( selectedId === f.id ? ' selected' : '' ) + '>' + escapeHtml( f.label || getLibraryItem( f.type ).label ) + '</option>';
				} );
				return opts;
			}

			var allowsValue = function ( op ) { return op !== 'not_empty' && op !== 'empty'; };

			var condLogicLabel = ( cond.logic || 'AND' ) === 'OR' ? 'OR' : 'AND';
			var conditionsHtml = '';
			( cond.conditions || [] ).forEach( function ( c, ci ) {
				conditionsHtml +=
					'<div class="bfcl-condition-row" data-ci="' + ci + '">' +
						'<span class="bfcl-cond-connector">' + ( ci === 0 ? 'IF' : condLogicLabel ) + '</span>' +
						'<select class="bfcl-cond-field" data-ci="' + ci + '">' + buildCondFieldOptions( c.field_id ) + '</select>' +
						'<select class="bfcl-cond-op" data-ci="' + ci + '">' +
							'<option value="is"' + ( c.operator === 'is' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.is || 'is' ) + '</option>' +
							'<option value="is_not"' + ( c.operator === 'is_not' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.isNot || 'is not' ) + '</option>' +
							'<option value="contains"' + ( c.operator === 'contains' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.contains || 'contains' ) + '</option>' +
							'<option value="not_contains"' + ( c.operator === 'not_contains' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.notContains || 'not contains' ) + '</option>' +
							'<option value="starts_with"' + ( c.operator === 'starts_with' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.startsWith || 'starts with' ) + '</option>' +
							'<option value="ends_with"' + ( c.operator === 'ends_with' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.endsWith || 'ends with' ) + '</option>' +
							'<option value="greater_than"' + ( c.operator === 'greater_than' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.greaterThan || '>' ) + '</option>' +
							'<option value="less_than"' + ( c.operator === 'less_than' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.lessThan || '<' ) + '</option>' +
							'<option value="not_empty"' + ( c.operator === 'not_empty' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.notEmpty || 'is not empty' ) + '</option>' +
							'<option value="empty"' + ( c.operator === 'empty' ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.isEmpty || 'is empty' ) + '</option>' +
						'</select>' +
						( allowsValue( c.operator ) ? '<input type="text" class="bfcl-cond-value" data-ci="' + ci + '" value="' + escapeHtml( c.value ) + '" placeholder="' + escapeHtml( boldformLiteBuilder.labels.value || 'Value' ) + '">' : '<span class="bfcl-no-value"></span>' ) +
						( ci > 0 ? '<button type="button" class="bfcl-remove-cond" data-ci="' + ci + '" title="Remove">&#215;</button>' : '<span class="bfcl-remove-placeholder"></span>' ) +
					'</div>';
			} );

			$empty.hide();
			var activeAccordion = state.activeSettingsAccordion || 'settings';

			$panel.removeAttr( 'hidden' ).html(
				'<div class="boldform-setting-group">' +
					'<label>' + escapeHtml( boldformLiteBuilder.labels.selectedField ) + '</label>' +
					'<div class="boldform-setting-field-name">' + escapeHtml( selected.field.label || getLibraryItem( selected.field.type ).label ) + '</div>' +
				'</div>' +

				// --- Settings Accordion ---
				'<div class="boldform-field-accordion' + ( activeAccordion === 'settings' ? ' is-open' : '' ) + '" data-accordion="settings">' +
					'<button type="button" class="boldform-field-accordion__head">' + escapeHtml( boldformLiteBuilder.labels.settings || 'Settings' ) + ' <span class="dashicons dashicons-arrow-down-alt2"></span></button>' +
					'<div class="boldform-field-accordion__body">' +
					( 'page_break' === selected.field.type ?
						// A Page Break is a structural divider between steps, not an input --
						// it has no visible label, placeholder or default value of its own.
						// Its only real settings are the step's title and how the multi-step
						// progress indicator looks (a form-wide choice, set from here since
						// this is the field users think of as "the step").
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-step-title">Step Title</label>' +
							'<input type="text" id="boldform-setting-step-title" value="' + escapeHtml( selected.field.step_title || '' ) + '" placeholder="' + escapeHtml( selected.field.label || 'Page Break' ) + '">' +
							'<p class="boldform-setting-desc">Shown in the multi-step progress indicator for the step that follows.</p>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-page-break-progress-style">Progress Style</label>' +
							'<select id="boldform-page-break-progress-style">' +
								'<option value="bar"' + ( 'bar' === ( state.formSettings.step_progress_style || 'bar' ) ? ' selected' : '' ) + '>Progress Bar</option>' +
								'<option value="steps"' + ( 'steps' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Numbers</option>' +
								'<option value="headings"' + ( 'headings' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Headings</option>' +
							'</select>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-progress-color">Progress Color</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( state.formSettings.step_progress_color || '#2f80ed' ) + '">' +
										'<input type="color" id="boldform-page-break-progress-color" value="' + escapeHtml( state.formSettings.step_progress_color || '#2f80ed' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( state.formSettings.step_progress_color || '#2f80ed' ) + '" data-color-for="boldform-page-break-progress-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-progress-bg-color">Progress Background</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( state.formSettings.step_progress_bg_color || '#e5e7eb' ) + '">' +
										'<input type="color" id="boldform-page-break-progress-bg-color" value="' + escapeHtml( state.formSettings.step_progress_bg_color || '#e5e7eb' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( state.formSettings.step_progress_bg_color || '#e5e7eb' ) + '" data-color-for="boldform-page-break-progress-bg-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<p class="boldform-setting-desc">Progress Color highlights the active/completed step; Progress Background is the unfilled track behind it. Both apply to Progress Bar, Numbers and Headings alike.</p>' +
						'<div class="boldform-setting-group">' +
							'<p class="boldform-setting-desc" style="margin:8px 0 0;font-weight:600;color:#374151">Step Navigation Buttons</p>' +
							'<p class="boldform-setting-desc">The Next/Previous buttons render for every style above — these settings are not tied to the Progress Style choice.</p>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-btn-color">Nav Button Color</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( state.formSettings.step_btn_color || '#2f80ed' ) + '">' +
										'<input type="color" id="boldform-page-break-btn-color" value="' + escapeHtml( state.formSettings.step_btn_color || '#2f80ed' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( state.formSettings.step_btn_color || '#2f80ed' ) + '" data-color-for="boldform-page-break-btn-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-btn-text-color">Nav Button Text Color</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( state.formSettings.step_btn_text_color || '#ffffff' ) + '">' +
										'<input type="color" id="boldform-page-break-btn-text-color" value="' + escapeHtml( state.formSettings.step_btn_text_color || '#ffffff' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( state.formSettings.step_btn_text_color || '#ffffff' ) + '" data-color-for="boldform-page-break-btn-text-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-btn-size">Nav Button Size</label>' +
								'<select id="boldform-page-break-btn-size">' +
									'<option value="small"' + ( 'small' === state.formSettings.step_btn_size ? ' selected' : '' ) + '>Small</option>' +
									'<option value="medium"' + ( 'medium' === ( state.formSettings.step_btn_size || 'medium' ) ? ' selected' : '' ) + '>Medium</option>' +
									'<option value="large"' + ( 'large' === state.formSettings.step_btn_size ? ' selected' : '' ) + '>Large</option>' +
								'</select>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-btn-radius">Nav Button Radius (px)</label>' +
								'<input type="number" id="boldform-page-break-btn-radius" min="0" max="50" value="' + escapeHtml( '' === ( state.formSettings.step_btn_radius || '' ) ? '' : String( state.formSettings.step_btn_radius ) ) + '" placeholder="6">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-next-text">Next Button Text</label>' +
								'<input type="text" id="boldform-page-break-next-text" value="' + escapeHtml( state.formSettings.step_next_text || '' ) + '" placeholder="Next">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-page-break-prev-text">Previous Button Text</label>' +
								'<input type="text" id="boldform-page-break-prev-text" value="' + escapeHtml( state.formSettings.step_prev_text || '' ) + '" placeholder="Previous">' +
							'</div>' +
						'</div>'
					:
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-label">' + escapeHtml( boldformLiteBuilder.labels.label ) + '</label>' +
							'<input type="text" id="boldform-setting-label" value="' + escapeHtml( selected.field.label ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label>' + escapeHtml( boldformLiteBuilder.labels.labelPlacement || 'Label Placement' ) + '</label>' +
							'<div class="boldform-btn-group" id="boldform-setting-label-placement">' +
								'<button type="button" class="boldform-btn-group__btn' + ( 'top' === ( selected.field.label_placement || 'top' ) ? ' is-active' : '' ) + '" data-value="top">' + escapeHtml( boldformLiteBuilder.labels.top || 'Top' ) + '</button>' +
								'<button type="button" class="boldform-btn-group__btn' + ( 'left' === selected.field.label_placement ? ' is-active' : '' ) + '" data-value="left">' + escapeHtml( boldformLiteBuilder.labels.left || 'Left' ) + '</button>' +
								'<button type="button" class="boldform-btn-group__btn' + ( 'right' === selected.field.label_placement ? ' is-active' : '' ) + '" data-value="right">' + escapeHtml( boldformLiteBuilder.labels.right || 'Right' ) + '</button>' +
								'<button type="button" class="boldform-btn-group__btn' + ( 'bottom' === selected.field.label_placement ? ' is-active' : '' ) + '" data-value="bottom">' + escapeHtml( boldformLiteBuilder.labels.below || 'Below' ) + '</button>' +
								'<button type="button" class="boldform-btn-group__btn' + ( 'hidden' === selected.field.label_placement ? ' is-active' : '' ) + '" data-value="hidden">' + escapeHtml( boldformLiteBuilder.labels.hidden || 'Hide' ) + '</button>' +
							'</div>' +
						'</div>'
					) +
					( specialFieldTypes.indexOf( selected.field.type ) !== -1 || 'star_rating' === selected.field.type ? '' :
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-placeholder">' + escapeHtml( boldformLiteBuilder.labels.placeholder ) + '</label>' +
							'<input type="text" id="boldform-setting-placeholder" value="' + escapeHtml( selected.field.placeholder ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-default">' + escapeHtml( boldformLiteBuilder.labels.defaultValue ) + '</label>' +
							'<input type="text" id="boldform-setting-default" value="' + escapeHtml( selected.field.default_value ) + '">' +
						'</div>'
					) +
					optionsMarkup +
					( 'section_break' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-description">' + escapeHtml( boldformLiteBuilder.labels.sectionDescription || 'Description' ) + '</label>' +
							'<textarea id="boldform-setting-description" rows="4">' + escapeHtml( selected.field.description || '' ) + '</textarea>' +
						'</div>' : ''
					) +
					( 'terms_conditions' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-content">' + escapeHtml( boldformLiteBuilder.labels.termsContent || 'Terms text' ) + '</label>' +
							'<textarea id="boldform-setting-content" rows="5">' + escapeHtml( selected.field.content || '' ) + '</textarea>' +
						'</div>' : ''
					) +
					( 'captcha' === selected.field.type ?
						'<p class="boldform-canvas-field-note">' + escapeHtml( boldformLiteBuilder.labels.captchaNotice || 'This field will use the captcha provider selected in global settings.' ) + '</p>' : ''
					) +
					( 'product' === selected.field.type ? ( function () {
						var prodOpts = Array.isArray( selected.field.product_options ) ? selected.field.product_options : [];
						var rowsHtml = '';
						prodOpts.forEach( function ( opt, idx ) {
							rowsHtml +=
								'<div class="boldform-product-option-row" data-product-index="' + idx + '">' +
									'<span class="boldform-product-option__drag"><span class="dashicons dashicons-menu"></span></span>' +
									'<input type="text" class="boldform-product-option__label" data-product-index="' + idx + '" value="' + escapeHtml( opt.label || '' ) + '" placeholder="Option label">' +
									'<input type="number" class="boldform-product-option__price" data-product-index="' + idx + '" value="' + escapeHtml( opt.price || '0.00' ) + '" min="0" step="0.01" placeholder="0.00" style="width:80px;">' +
									'<button type="button" class="boldform-product-option__remove" data-product-index="' + idx + '" title="Remove"><span class="dashicons dashicons-no-alt"></span></button>' +
								'</div>';
						} );
						return '<div class="boldform-setting-group">' +
							'<label>Product Options</label>' +
							'<div class="boldform-product-options-repeater" id="boldform-product-options-repeater">' +
								rowsHtml +
							'</div>' +
							'<button type="button" class="boldform-options-repeater__add" id="boldform-product-option-add"><span class="dashicons dashicons-plus-alt2"></span> Add Option</button>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-product-style">Display Style</label>' +
							'<select id="boldform-setting-product-style">' +
								'<option value="radio"' + ( 'radio' === ( selected.field.product_style || 'radio' ) ? ' selected' : '' ) + '>Radio buttons</option>' +
								'<option value="select"' + ( 'select' === selected.field.product_style ? ' selected' : '' ) + '>Dropdown</option>' +
							'</select>' +
						'</div>';
					}() ) : '' ) +
					( 'quantity' === selected.field.type ? ( function () {
						var allFields = getAllFields();
						var productFields = allFields.filter( function ( f ) { return f.type === 'product'; } );
						var productOpts = '<option value="">— none —</option>';
						productFields.forEach( function ( f ) {
							productOpts += '<option value="' + escapeHtml( f.id ) + '"' + ( selected.field.linked_product === f.id ? ' selected' : '' ) + '>' + escapeHtml( f.label || 'Product' ) + '</option>';
						} );
						return '<div class="boldform-setting-group">' +
							'<label for="boldform-setting-qty-linked-product">Linked Product Field</label>' +
							'<select id="boldform-setting-qty-linked-product">' + productOpts + '</select>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-qty-min">Min Qty</label>' +
								'<input type="number" id="boldform-setting-qty-min" value="' + escapeHtml( selected.field.qty_min || '1' ) + '" min="0" placeholder="1">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-qty-max">Max Qty</label>' +
								'<input type="number" id="boldform-setting-qty-max" value="' + escapeHtml( selected.field.qty_max || '' ) + '" min="1" placeholder="unlimited">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-qty-default">Default Qty</label>' +
							'<input type="number" id="boldform-setting-qty-default" value="' + escapeHtml( selected.field.qty_default || '1' ) + '" min="1" placeholder="1">' +
						'</div>';
					}() ) : '' ) +
					( 'custom_amount' === selected.field.type ?
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-amount-min">Min Amount</label>' +
								'<input type="number" id="boldform-setting-amount-min" value="' + escapeHtml( selected.field.amount_min || '' ) + '" min="0" step="0.01" placeholder="0.00">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-amount-max">Max Amount</label>' +
								'<input type="number" id="boldform-setting-amount-max" value="' + escapeHtml( selected.field.amount_max || '' ) + '" min="0" step="0.01" placeholder="unlimited">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-amount-default">Default Amount</label>' +
							'<input type="number" id="boldform-setting-amount-default" value="' + escapeHtml( selected.field.amount_default || '0.00' ) + '" min="0" step="0.01" placeholder="0.00">' +
						'</div>' +
						''
					: '' ) +
					( 'order_summary' === selected.field.type ?
						''
					: '' ) +
					( 'calculation' === selected.field.type ? ( function () {
						var calcField   = selected.field;
						var allFields   = getAllFields();
						var refOpts     = '';
						// Only fields that resolve to a single numeric value can be
						// referenced in a formula. Structural/text/multi-value fields
						// are excluded so the picker stays short and meaningful.
						var calcRefTypes = [ 'number', 'numeric', 'quantity', 'slider_range', 'star_rating', 'nps', 'calculation' ];
						allFields.forEach( function ( f ) {
							if ( ! f.id ) return;
							if ( calcRefTypes.indexOf( f.type ) === -1 ) return;
							if ( f.id === calcField.id ) return; // never self-reference
							// Show the label; expose the {token} as a hover tooltip
							// (a native <select> option cannot render a muted inline hint).
							refOpts += '<option value="' + escapeHtml( f.id ) + '" title="{' + escapeHtml( f.id ) + '}">' + escapeHtml( f.label || f.id ) + '</option>';
						} );
						var formula   = calcField.calc_formula  || '';
						var decimals  = typeof calcField.calc_decimals === 'number' ? calcField.calc_decimals : 2;
						var prefix    = calcField.calc_prefix   || '';
						var suffix    = calcField.calc_suffix   || '';
						var valClass  = formula ? ( /[^0-9\s\+\-\*\/\(\)\.\{\}a-z0-9_]/i.test(formula) ? 'bfcp-invalid' : 'bfcp-valid' ) : '';
						return '<div class="bfcp-panel">' +
							'<div class="bfcp-row">' +
								'<label class="bfcp-label">Formula</label>' +
								'<div class="bfcp-formula-wrap">' +
									'<div class="bfcp-formula-toolbar">' +
										'<select class="bfcp-field-insert">' +
											'<option value="">Insert Field&hellip;</option>' +
											refOpts +
										'</select>' +
									'</div>' +
									'<div class="bfcp-formula-input ' + valClass + '" id="boldform-calc-formula" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="' + escapeHtml( 'e.g. {Price} * {Quantity}' ) + '">' + bfCalcFormulaToChips( formula ) + '</div>' +
									'<div class="bfcp-formula-help">Pick a field from the dropdown to insert it, then type operators between them. Supports +, -, *, /, ( ).</div>' +
								'</div>' +
							'</div>' +
							'<div class="bfcp-row bfcp-row--inline">' +
								'<div class="bfcp-col">' +
									'<label class="bfcp-label">Decimals</label>' +
									'<input type="number" class="bfcp-decimals" id="boldform-calc-decimals" min="0" max="10" value="' + escapeHtml( String(decimals) ) + '">' +
								'</div>' +
								'<div class="bfcp-col">' +
									'<label class="bfcp-label">Prefix</label>' +
									'<input type="text" class="bfcp-prefix" id="boldform-calc-prefix" value="' + escapeHtml( prefix ) + '" placeholder="$">' +
								'</div>' +
								'<div class="bfcp-col">' +
									'<label class="bfcp-label">Suffix</label>' +
									'<input type="text" class="bfcp-suffix" id="boldform-calc-suffix" value="' + escapeHtml( suffix ) + '" placeholder=" USD">' +
								'</div>' +
							'</div>' +
						'</div>';
					}() ) : '' ) +

					// --- Signature field settings ---
					( 'signature' === selected.field.type ?
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-sig-pen-color">Pen Color</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( selected.field.sig_pen_color || '#1e293b' ) + '">' +
										'<input type="color" id="boldform-setting-sig-pen-color" value="' + escapeHtml( selected.field.sig_pen_color || '#1e293b' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( selected.field.sig_pen_color || '#1e293b' ) + '" data-color-for="boldform-setting-sig-pen-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-sig-pen-width">Pen Width (px)</label>' +
								'<input type="number" id="boldform-setting-sig-pen-width" min="1" max="8" value="' + escapeHtml( String( selected.field.sig_pen_width || 2 ) ) + '">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-sig-bg-color">Background Color</label>' +
								'<div class="boldform-color-field">' +
									'<div class="boldform-color-swatch" style="background:' + escapeHtml( selected.field.sig_bg_color || '#ffffff' ) + '">' +
										'<input type="color" id="boldform-setting-sig-bg-color" value="' + escapeHtml( selected.field.sig_bg_color || '#ffffff' ) + '">' +
									'</div>' +
									'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( selected.field.sig_bg_color || '#ffffff' ) + '" data-color-for="boldform-setting-sig-bg-color" spellcheck="false">' +
								'</div>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-sig-height">Height (px)</label>' +
								'<input type="number" id="boldform-setting-sig-height" min="80" max="400" value="' + escapeHtml( String( selected.field.sig_height || 160 ) ) + '">' +
							'</div>' +
						'</div>'
					: '' ) +

					// --- Hidden field settings ---
					( 'hidden_field' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-hidden-source">Value Source</label>' +
							'<select id="boldform-setting-hidden-source">' +
								'<option value="static"'     + ( 'static'     === ( selected.field.hidden_source || 'static' ) ? ' selected' : '' ) + '>Static value</option>' +
								'<option value="url_param"'  + ( 'url_param'  === selected.field.hidden_source ? ' selected' : '' ) + '>URL parameter</option>' +
								'<option value="user_id"'    + ( 'user_id'    === selected.field.hidden_source ? ' selected' : '' ) + '>User ID</option>' +
								'<option value="user_email"' + ( 'user_email' === selected.field.hidden_source ? ' selected' : '' ) + '>User email</option>' +
								'<option value="user_login"' + ( 'user_login' === selected.field.hidden_source ? ' selected' : '' ) + '>User login</option>' +
								'<option value="post_id"'    + ( 'post_id'    === selected.field.hidden_source ? ' selected' : '' ) + '>Post ID</option>' +
								'<option value="referrer"'   + ( 'referrer'   === selected.field.hidden_source ? ' selected' : '' ) + '>Referrer URL</option>' +
							'</select>' +
						'</div>' +
						( ( selected.field.hidden_source || 'static' ) === 'static' || ( selected.field.hidden_source || 'static' ) === 'url_param' ?
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-hidden-value">' + ( 'url_param' === selected.field.hidden_source ? 'URL Parameter Name' : 'Value' ) + '</label>' +
								'<input type="text" id="boldform-setting-hidden-value" value="' + escapeHtml( selected.field.hidden_value || '' ) + '" placeholder="' + ( 'url_param' === selected.field.hidden_source ? 'e.g. utm_source' : 'Enter value' ) + '">' +
							'</div>'
						: '<p class="description" style="color:#6b7280;font-size:12px;margin:4px 0 0">Value resolved automatically at render time.</p>' ) +
						'<p class="description" style="color:#9ca3af;font-size:12px;margin:8px 0 0"><span class="dashicons dashicons-hidden" style="font-size:13px;"></span> This field is invisible to visitors.</p>'
					: '' ) +

					// --- Image Choice settings ---
					( 'image_choice' === selected.field.type ? ( function () {
						var icOpts = [];
						if ( selected.field.image_choice_options ) {
							try {
								icOpts = typeof selected.field.image_choice_options === 'string'
									? JSON.parse( selected.field.image_choice_options )
									: ( Array.isArray( selected.field.image_choice_options ) ? selected.field.image_choice_options : [] );
							} catch (e) { icOpts = []; }
						}
						var icRowsHtml = '';
						icOpts.forEach( function ( opt, idx ) {
							var thumb = opt.image_url
								? '<img src="' + escapeHtml( opt.image_url ) + '" alt="">'
								: '<span class="dashicons dashicons-format-image"></span>';
							icRowsHtml +=
								'<div class="boldform-ic-option-row" data-ic-index="' + idx + '">' +
									'<button type="button" class="boldform-ic-option__img-btn" data-ic-index="' + idx + '" title="Choose image">' +
										thumb +
									'</button>' +
									'<div class="boldform-ic-option__fields">' +
										'<input type="text" class="boldform-ic-option__label" data-ic-index="' + idx + '" value="' + escapeHtml( opt.label || '' ) + '" placeholder="Label">' +
										'<input type="text" class="boldform-ic-option__value" data-ic-index="' + idx + '" value="' + escapeHtml( opt.value || '' ) + '" placeholder="Value (submitted)">' +
									'</div>' +
									'<button type="button" class="boldform-ic-option__remove" data-ic-index="' + idx + '" title="Remove"><span class="dashicons dashicons-no-alt"></span></button>' +
								'</div>';
						} );
						return '<div class="boldform-setting-group">' +
							'<label>Choices</label>' +
							'<div class="boldform-ic-options-repeater" id="boldform-ic-options-repeater">' + icRowsHtml + '</div>' +
							'<button type="button" class="boldform-options-repeater__add" id="boldform-ic-option-add"><span class="dashicons dashicons-plus-alt2"></span> Add Choice</button>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-ic-type">Selection</label>' +
								'<select id="boldform-setting-ic-type">' +
									'<option value="radio"'    + ( 'checkbox' !== ( selected.field.image_choice_type || 'radio' ) ? ' selected' : '' ) + '>Single (radio)</option>' +
									'<option value="checkbox"' + ( 'checkbox' === selected.field.image_choice_type ? ' selected' : '' ) + '>Multiple (checkbox)</option>' +
								'</select>' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-ic-columns">Columns</label>' +
								'<select id="boldform-setting-ic-columns">' +
									[ 2, 3, 4, 5, 6 ].map( function (n) {
										return '<option value="' + n + '"' + ( n === ( selected.field.image_choice_columns || 3 ) ? ' selected' : '' ) + '>' + n + '</option>';
									} ).join('') +
								'</select>' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-ic-img-height">Image Height (px)</label>' +
							'<input type="number" id="boldform-setting-ic-img-height" min="60" max="600" step="10" value="' + escapeHtml( String( selected.field.image_choice_img_height || 160 ) ) + '">' +
						'</div>';
					}() ) : '' ) +

					// --- Repeater field settings ---
					( 'repeater' === selected.field.type ? ( function () {
						var repFields = [];
						if ( selected.field.repeater_fields ) {
							try {
								repFields = typeof selected.field.repeater_fields === 'string'
									? JSON.parse( selected.field.repeater_fields )
									: ( Array.isArray( selected.field.repeater_fields ) ? selected.field.repeater_fields : [] );
							} catch (e) { repFields = []; }
						}
						var repRowsHtml = '';
						repFields.forEach( function ( sf, idx ) {
							var sfType    = sf.type || 'text';
							// Choice sub-types carry an options list (one per line).
							var isChoice  = ( 'select' === sfType || 'radio' === sfType || 'checkbox' === sfType );
							var sfOptions = Array.isArray( sf.options ) ? sf.options : [];
							repRowsHtml +=
								'<div class="boldform-rep-field-row" data-rep-index="' + idx + '">' +
									'<div class="boldform-rep-field-row__main">' +
										'<select class="boldform-rep-field__type" data-rep-index="' + idx + '">' +
											[ 'text','email','url','tel','number','date','time','textarea','select','radio','checkbox' ].map( function (t) {
												return '<option value="' + t + '"' + ( t === sfType ? ' selected' : '' ) + '>' + t + '</option>';
											} ).join('') +
										'</select>' +
										'<input type="text" class="boldform-rep-field__label" data-rep-index="' + idx + '" value="' + escapeHtml( sf.label || '' ) + '" placeholder="Label">' +
										'<button type="button" class="boldform-rep-field__remove" data-rep-index="' + idx + '" title="Remove"><span class="dashicons dashicons-no-alt"></span></button>' +
									'</div>' +
									( isChoice ?
										'<div class="boldform-rep-field-row__options">' +
											'<label class="boldform-rep-field__options-label">Options (one per line)</label>' +
											'<textarea class="boldform-rep-field__options" data-rep-index="' + idx + '" rows="3" placeholder="Option 1&#10;Option 2&#10;Option 3">' + escapeHtml( sfOptions.join( '\n' ) ) + '</textarea>' +
										'</div>'
									: '' ) +
								'</div>';
						} );
						return '<div class="boldform-setting-group">' +
							'<label>Sub-fields</label>' +
							'<div class="boldform-rep-fields-header">' +
								'<span>Type</span><span>Label</span><span></span>' +
							'</div>' +
							'<div class="boldform-rep-fields-list" id="boldform-rep-fields-list">' + repRowsHtml + '</div>' +
							'<button type="button" class="boldform-options-repeater__add" id="boldform-rep-field-add"><span class="dashicons dashicons-plus-alt2"></span> Add Sub-field</button>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-rep-columns">Columns</label>' +
							'<select id="boldform-setting-rep-columns">' +
								[ 1, 2, 3, 4 ].map( function (n) {
									return '<option value="' + n + '"' + ( n === ( Number( selected.field.repeater_columns ) || 2 ) ? ' selected' : '' ) + '>' + n + '</option>';
								} ).join('') +
							'</select>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-rep-min">Min rows</label>' +
								'<input type="number" id="boldform-setting-rep-min" min="1" max="10" value="' + escapeHtml( String( selected.field.repeater_min_rows || 1 ) ) + '">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-rep-max">Max rows</label>' +
								'<input type="number" id="boldform-setting-rep-max" min="1" max="20" value="' + escapeHtml( String( selected.field.repeater_max_rows || 5 ) ) + '">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-rep-add-label">Add button text</label>' +
								'<input type="text" id="boldform-setting-rep-add-label" value="' + escapeHtml( selected.field.repeater_add_label || 'Add Row' ) + '">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-rep-remove-label">Remove button text</label>' +
								'<input type="text" id="boldform-setting-rep-remove-label" value="' + escapeHtml( selected.field.repeater_remove_label || 'Remove' ) + '">' +
							'</div>' +
						'</div>';
					}() ) : '' ) +

					// --- Password field settings ---
					( 'password_field' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-pw-placeholder">Placeholder</label>' +
							'<input type="text" id="boldform-setting-pw-placeholder" value="' + escapeHtml( selected.field.placeholder || '' ) + '">' +
						'</div>' +
						'<div class="boldform-switch-item">' +
							'<label class="boldform-switch__row">' +
								'<span class="boldform-switch__text">Add confirm password field</span>' +
								'<input type="checkbox" id="boldform-setting-pw-confirm"' + ( selected.field.confirm_password ? ' checked' : '' ) + '>' +
								'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
							'</label>' +
						'</div>'
					: '' ) +

					// --- Rich Text settings ---
					( 'rich_text' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-rte-height">Editor Height (px)</label>' +
							'<input type="number" id="boldform-setting-rte-height" min="100" max="800" value="' + escapeHtml( String( selected.field.rte_height || 200 ) ) + '">' +
						'</div>'
					: '' ) +

					// --- Date Range settings ---
					( 'date_range' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-dr-placeholder">Placeholder</label>' +
							'<input type="text" id="boldform-setting-dr-placeholder" value="' + escapeHtml( selected.field.placeholder || '' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-dr-format">Date Format</label>' +
							'<select id="boldform-setting-dr-format">' +
								'<option value="Y-m-d"' + ( ( selected.field.date_range_format || 'Y-m-d' ) === 'Y-m-d' ? ' selected' : '' ) + '>YYYY-MM-DD</option>' +
								'<option value="d/m/Y"' + ( selected.field.date_range_format === 'd/m/Y' ? ' selected' : '' ) + '>DD/MM/YYYY</option>' +
								'<option value="m/d/Y"' + ( selected.field.date_range_format === 'm/d/Y' ? ' selected' : '' ) + '>MM/DD/YYYY</option>' +
								'<option value="d M Y"' + ( selected.field.date_range_format === 'd M Y' ? ' selected' : '' ) + '>DD Mon YYYY</option>' +
							'</select>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-dr-separator">Separator</label>' +
							'<input type="text" id="boldform-setting-dr-separator" value="' + escapeHtml( typeof selected.field.date_range_separator !== 'undefined' ? selected.field.date_range_separator : ' to ' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-dr-min-days">Min Days</label>' +
								'<input type="number" id="boldform-setting-dr-min-days" min="0" placeholder="—" value="' + escapeHtml( String( selected.field.date_range_min_days || '' ) ) + '">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-dr-max-days">Max Days</label>' +
								'<input type="number" id="boldform-setting-dr-max-days" min="1" placeholder="—" value="' + escapeHtml( String( selected.field.date_range_max_days || '' ) ) + '">' +
							'</div>' +
						'</div>'
					: '' ) +

					// --- NPS settings ---
					( 'nps' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-nps-low">Low end label</label>' +
							'<input type="text" id="boldform-setting-nps-low" value="' + escapeHtml( selected.field.nps_low_label || 'Not likely' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-nps-high">High end label</label>' +
							'<input type="text" id="boldform-setting-nps-high" value="' + escapeHtml( selected.field.nps_high_label || 'Extremely likely' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label>' + escapeHtml( boldformLiteBuilder.labels.npsColors || 'Zone Colors' ) + '</label>' +
							'<div class="boldform-setting-row boldform-setting-row--3">' +
								'<div class="boldform-setting-group">' +
									'<label for="boldform-setting-nps-detractor-color" class="boldform-setting-sublabel">' + escapeHtml( boldformLiteBuilder.labels.npsDetractor || 'Detractors (0–6)' ) + '</label>' +
									'<div class="bf-color-reset-wrap">' +
										'<input type="color" id="boldform-setting-nps-detractor-color" value="' + escapeHtml( selected.field.nps_detractor_color || '#ef4444' ) + '">' +
										'<button type="button" class="bf-color-reset" data-color-reset="nps_detractor_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
									'</div>' +
								'</div>' +
								'<div class="boldform-setting-group">' +
									'<label for="boldform-setting-nps-passive-color" class="boldform-setting-sublabel">' + escapeHtml( boldformLiteBuilder.labels.npsPassive || 'Passives (7–8)' ) + '</label>' +
									'<div class="bf-color-reset-wrap">' +
										'<input type="color" id="boldform-setting-nps-passive-color" value="' + escapeHtml( selected.field.nps_passive_color || '#f59e0b' ) + '">' +
										'<button type="button" class="bf-color-reset" data-color-reset="nps_passive_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
									'</div>' +
								'</div>' +
								'<div class="boldform-setting-group">' +
									'<label for="boldform-setting-nps-promoter-color" class="boldform-setting-sublabel">' + escapeHtml( boldformLiteBuilder.labels.npsPromoter || 'Promoters (9–10)' ) + '</label>' +
									'<div class="bf-color-reset-wrap">' +
										'<input type="color" id="boldform-setting-nps-promoter-color" value="' + escapeHtml( selected.field.nps_promoter_color || '#22c55e' ) + '">' +
										'<button type="button" class="bf-color-reset" data-color-reset="nps_promoter_color" title="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '" aria-label="' + escapeHtml( boldformLiteBuilder.labels.resetColor || 'Reset to default' ) + '"><span class="dashicons dashicons-image-rotate"></span></button>' +
									'</div>' +
								'</div>' +
							'</div>' +
						'</div>'
					: '' ) +

					// --- Matrix settings ---
					( 'matrix' === selected.field.type ? ( function () {
						var mRows = [];
						var mCols = [];
						// Hydrate the textareas from the saved values. Empty/invalid data falls
						// back to the same defaults the front-end renderer (Pro render_matrix)
						// substitutes, so the builder shows the effective values a visitor sees
						// instead of blank boxes — and a save then persists them (self-heals
						// forms saved with empty matrix_rows/matrix_columns).
						try { mRows = JSON.parse( selected.field.matrix_rows || '[]' ); } catch(e) { mRows = []; }
						try { mCols = JSON.parse( selected.field.matrix_columns || '[]' ); } catch(e) { mCols = []; }
						if ( ! mRows.length ) { mRows = [ 'Row 1', 'Row 2', 'Row 3' ]; }
						if ( ! mCols.length ) { mCols = [ 'Agree', 'Neutral', 'Disagree' ]; }
						return '<div class="boldform-setting-group">' +
							'<label for="boldform-setting-matrix-type">Input Type</label>' +
							'<select id="boldform-setting-matrix-type">' +
								'<option value="radio"' + ( ( selected.field.matrix_type || 'radio' ) === 'radio' ? ' selected' : '' ) + '>Radio (one per row)</option>' +
								'<option value="checkbox"' + ( selected.field.matrix_type === 'checkbox' ? ' selected' : '' ) + '>Checkbox (multiple per row)</option>' +
							'</select>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-matrix-rows">Rows <small style="color:#9ca3af">(one per line)</small></label>' +
							'<textarea id="boldform-setting-matrix-rows" rows="4">' + escapeHtml( mRows.join( '\n' ) ) + '</textarea>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-matrix-cols">Columns <small style="color:#9ca3af">(one per line)</small></label>' +
							'<textarea id="boldform-setting-matrix-cols" rows="3">' + escapeHtml( mCols.join( '\n' ) ) + '</textarea>' +
						'</div>';
					}() ) : '' ) +

					// --- Lookup settings ---
					( 'lookup' === selected.field.type ? ( function () {
						var lItems = [];
						try { lItems = JSON.parse( selected.field.lookup_items || '[]' ); } catch(e) { lItems = []; }
						return '<div class="boldform-setting-group">' +
							'<label for="boldform-setting-lookup-placeholder">Placeholder</label>' +
							'<input type="text" id="boldform-setting-lookup-placeholder" value="' + escapeHtml( selected.field.placeholder || '' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-lookup-items">Options <small style="color:#9ca3af">(one per line)</small></label>' +
							'<textarea id="boldform-setting-lookup-items" rows="5" placeholder="Option 1&#10;Option 2&#10;Option 3">' + escapeHtml( lItems.join( '\n' ) ) + '</textarea>' +
						'</div>' +
						'<div class="boldform-setting-row">' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-lookup-min-chars">Min chars to search</label>' +
								'<input type="number" id="boldform-setting-lookup-min-chars" min="1" max="5" value="' + escapeHtml( String( selected.field.lookup_min_chars || 2 ) ) + '">' +
							'</div>' +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-lookup-max-results">Max results</label>' +
								'<input type="number" id="boldform-setting-lookup-max-results" min="3" max="20" value="' + escapeHtml( String( selected.field.lookup_max_results || 8 ) ) + '">' +
							'</div>' +
						'</div>' +
						'<div class="boldform-switch-item">' +
							'<label class="boldform-switch__row">' +
								'<span class="boldform-switch__text">Allow custom typed values</span>' +
								'<input type="checkbox" id="boldform-setting-lookup-allow-custom"' + ( selected.field.lookup_allow_custom ? ' checked' : '' ) + '>' +
								'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
							'</label>' +
						'</div>';
					}() ) : '' ) +

					// --- Geolocation settings ---
					( 'geolocation' === selected.field.type ?
						'<div class="boldform-switch-item">' +
							'<label class="boldform-switch__row">' +
								'<span class="boldform-switch__text">Show map preview</span>' +
								'<input type="checkbox" id="boldform-setting-geo-show-map"' + ( selected.field.geo_show_map ? ' checked' : '' ) + '>' +
								'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
							'</label>' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-geo-map-height">Map Height (px)</label>' +
							'<input type="number" id="boldform-setting-geo-map-height" min="150" max="600" value="' + escapeHtml( String( selected.field.geo_map_height || 250 ) ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-geo-store-format">Store format</label>' +
							'<select id="boldform-setting-geo-store-format">' +
								'<option value="both"' + ( ( selected.field.geo_store_format || 'both' ) === 'both' ? ' selected' : '' ) + '>Lat/Lng + Address</option>' +
								'<option value="latlng"' + ( selected.field.geo_store_format === 'latlng' ? ' selected' : '' ) + '>Lat/Lng only</option>' +
								'<option value="address"' + ( selected.field.geo_store_format === 'address' ? ' selected' : '' ) + '>Address only</option>' +
							'</select>' +
						'</div>'
					: '' ) +

					( 'file' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-allowed-types">' + escapeHtml( boldformLiteBuilder.labels.allowedTypes || 'Allowed file types' ) + '</label>' +
							'<input type="text" id="boldform-setting-allowed-types" value="' + escapeHtml( selected.field.allowed_types || '' ) + '" placeholder=".jpg,.png,.pdf,.doc">' +
						'</div>' +
						( boldformLiteBuilder.proFileSize
							? '<div class="boldform-setting-group">' +
								'<label for="boldform-setting-max-file-size">' + escapeHtml( boldformLiteBuilder.labels.maxFileSize || 'Max file size (MB)' ) + '</label>' +
								'<input type="number" id="boldform-setting-max-file-size" value="' + escapeHtml( selected.field.max_file_size || '' ) + '" min="1" max="100" placeholder="2">' +
							'</div>'
							: '<p class="description" style="color:#9ca3af;font-size:12px;margin:0">' + escapeHtml( boldformLiteBuilder.labels.maxFileSizeNote || 'Max upload size: 2 MB' ) + '</p>'
						) : ''
					) +
				'</div></div>' +

				// --- Advanced Accordion ---
				'<div class="boldform-field-accordion' + ( activeAccordion === 'advanced' ? ' is-open' : '' ) + '" data-accordion="advanced">' +
					'<button type="button" class="boldform-field-accordion__head">' + escapeHtml( boldformLiteBuilder.labels.advanced || 'Advanced' ) + ' <span class="dashicons dashicons-arrow-down-alt2"></span></button>' +
					'<div class="boldform-field-accordion__body">' +
					( 'page_break' === selected.field.type ? '' :
						'<div class="boldform-switch-item">' +
							'<label class="boldform-switch__row">' +
								'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.required ) + '</span>' +
								'<input type="checkbox" id="boldform-setting-required"' + ( selected.field.required ? ' checked' : '' ) + '>' +
								'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
							'</label>' +
						'</div>' +
						( selected.field.required ?
							'<div class="boldform-setting-group">' +
								'<label for="boldform-setting-custom-error">' + escapeHtml( boldformLiteBuilder.labels.customError || 'Custom error message' ) + '</label>' +
								'<input type="text" id="boldform-setting-custom-error" value="' + escapeHtml( selected.field.custom_error || '' ) + '" placeholder="' + escapeHtml( ( selected.field.label || 'This field' ) + ' is required.' ) + '">' +
							'</div>' : ''
						) +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-auto-populate-key">' + escapeHtml( boldformLiteBuilder.labels.autoPopulateKey || 'Auto Populate Key' ) + '</label>' +
							'<input type="text" id="boldform-setting-auto-populate-key" value="' + escapeHtml( selected.field.auto_populate_key || '' ) + '" placeholder="e.g. name, email, user_email">' +
							'<p class="boldform-setting-desc">' + escapeHtml( boldformLiteBuilder.labels.autoPopulateDesc || 'Pre-fill from URL parameter (?key=value) or logged-in user data.' ) + '</p>' +
						'</div>'
					) +
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-css-class">' + escapeHtml( boldformLiteBuilder.labels.cssClass || 'CSS Class' ) + '</label>' +
						'<input type="text" id="boldform-setting-css-class" value="' + escapeHtml( selected.field.css_class || '' ) + '" placeholder="my-custom-class">' +
					'</div>' +

					// Conditional Logic
					'<div class="boldform-switch-item">' +
						'<label class="boldform-switch__row">' +
							'<span class="boldform-switch__text">' + escapeHtml( boldformLiteBuilder.labels.conditionalLogic || 'Conditional Logic' ) + '</span>' +
							'<input type="checkbox" id="boldform-setting-cond-enabled"' + ( cond.enabled ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__track"><span class="boldform-switch__thumb"></span></span>' +
						'</label>' +
					'</div>' +
					( cond.enabled ?
						'<div class="bfcl-builder">' +
							'<div class="bfcl-action-bar">' +
								'<select class="bfcl-action-select">' +
									'<option value="show"' + ( 'show' === ( cond.action || 'show' ) ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.show || 'Show' ) + '</option>' +
									'<option value="hide"' + ( 'hide' === cond.action ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.hide || 'Hide' ) + '</option>' +
								'</select>' +
								'<span class="bfcl-action-label">this field if</span>' +
								'<div class="bfcl-logic-toggle">' +
									'<label class="bfcl-logic-opt' + ( 'AND' === ( cond.logic || 'AND' ) ? ' is-active' : '' ) + '">' +
										'<input type="radio" name="bfcl-logic" value="AND"' + ( 'AND' === ( cond.logic || 'AND' ) ? ' checked' : '' ) + '> All' +
									'</label>' +
									'<label class="bfcl-logic-opt' + ( 'OR' === cond.logic ? ' is-active' : '' ) + '">' +
										'<input type="radio" name="bfcl-logic" value="OR"' + ( 'OR' === cond.logic ? ' checked' : '' ) + '> Any' +
									'</label>' +
								'</div>' +
								'<span class="bfcl-action-label">of the following match:</span>' +
							'</div>' +
							'<div class="bfcl-conditions-list">' + conditionsHtml + '</div>' +
							'<button type="button" class="bfcl-add-condition">+ Add Condition</button>' +
						'</div>' : ''
					) +
				'</div></div>'
			);

			setupOptionsSortable();
			setupAddressSortable();
		}

		// Remembers which settings tab is active across re-renders.
		var activeSettingsTab = 'confirmation';

		// ── Upgrade teasers ──────────────────────────────────────────────────────
		// The free plugin advertises paid features without implementing any of them:
		// a locked button that opens an upgrade dialog explaining what the feature
		// does. Nothing behind these buttons half-works -- Lite has no tag engine and
		// no custom email templates, so there is deliberately no picker to browse and
		// no toggle to flip.
		//
		// None of this detects an add-on. It renders whenever boldform_show_upgrade_cta
		// is true, exactly like the Tools -> Entries export teaser; an add-on shipping
		// the real feature turns that filter off and fills the slot itself.

		/**
		 * Whether the upgrade teasers should render.
		 *
		 * wp_localize_script stringifies the PHP boolean, so this is '1' or '' rather
		 * than true/false -- hence the truthiness check rather than a strict compare.
		 *
		 * @return {boolean} True while the upgrade CTAs are shown.
		 */
		function showUpgradeCta() {
			return !! boldformLiteBuilder.showUpgradeCta;
		}

		/**
		 * A locked button that opens an upgrade dialog.
		 *
		 * aria-haspopup="dialog": it opens the dialog named by modalId, not a menu.
		 *
		 * @param {string} label   Button text.
		 * @param {string} modalId Id of the dialog it opens.
		 * @return {string} Markup.
		 */
		function upgradeButton( label, modalId ) {
			return '<button type="button" class="boldform-upgrade-btn" aria-haspopup="dialog"' +
				' data-upgrade-modal="' + escapeHtml( modalId ) + '">' +
				'<span class="dashicons dashicons-lock" aria-hidden="true"></span>' +
				escapeHtml( label ) +
			'</button>';
		}

		/**
		 * The lock hint shown beneath a teased control.
		 *
		 * @param {string} text Hint.
		 * @return {string} Markup.
		 */
		function upgradeHint( text ) {
			return '<p class="boldform-upgrade-hint">' +
				'<span class="dashicons dashicons-lock" aria-hidden="true"></span>' +
				escapeHtml( text ) +
			'</p>';
		}

		/**
		 * Teaser for the thank-you message shortcodes, sat beside the message label.
		 *
		 * @return {string} Markup, or '' when the CTAs are off.
		 */
		function shortcodeTeaser() {
			if ( ! showUpgradeCta() ) {
				return '';
			}

			return upgradeButton(
				boldformLiteBuilder.labels.addShortcodes || 'Add Shortcodes',
				'boldform-shortcode-upgrade-modal'
			);
		}

		/**
		 * The shortcode hint under the thank-you editor.
		 *
		 * @return {string} Markup, or '' when the CTAs are off.
		 */
		function shortcodeHint() {
			if ( ! showUpgradeCta() ) {
				return '';
			}

			return upgradeHint( boldformLiteBuilder.labels.shortcodeHint || '' );
		}

		/**
		 * Teaser for the custom email editor, rendered into an email block's add-on
		 * slot. Matches where the real per-email controls appear, so the block does
		 * not change shape when the paid feature replaces it.
		 *
		 * @return {string} Markup, or '' when the CTAs are off.
		 */
		function emailTeaser() {
			if ( ! showUpgradeCta() ) {
				return '';
			}

			return '<div class="boldform-email-teaser">' +
				upgradeButton(
					boldformLiteBuilder.labels.customizeEmail || 'Customize this email',
					'boldform-email-upgrade-modal'
				) +
				upgradeHint( boldformLiteBuilder.labels.emailTeaserHint || '' ) +
			'</div>';
		}

		/**
		 * Teaser for attaching a generated document, rendered into an email
		 * block's attachment slot. Same placement as the real control, so the
		 * block does not change shape when the paid feature replaces it.
		 *
		 * Rendered into both blocks because the real control appears in both:
		 * the two notifications are attached to independently.
		 *
		 * @return {string} Markup, or '' when the CTAs are off.
		 */
		function attachmentTeaser() {
			if ( ! showUpgradeCta() ) {
				return '';
			}

			return '<div class="boldform-attachment-teaser">' +
				upgradeButton(
					boldformLiteBuilder.labels.attachDocument || 'Attach a PDF of the submission',
					'boldform-attachment-upgrade-modal'
				) +
				upgradeHint( boldformLiteBuilder.labels.attachmentTeaserHint || '' ) +
			'</div>';
		}

		/**
		 * Teaser for conditional recipient routing, rendered into the admin block's
		 * routing slot — where the real "send to different people" control appears,
		 * so the block does not change shape when the paid feature replaces it.
		 *
		 * @return {string} Markup, or '' when the CTAs are off.
		 */
		function routingTeaser() {
			if ( ! showUpgradeCta() ) {
				return '';
			}

			return '<div class="boldform-routing-teaser">' +
				upgradeButton(
					boldformLiteBuilder.labels.routeRecipients || 'Send to different people based on the answers',
					'boldform-routing-upgrade-modal'
				) +
				upgradeHint( boldformLiteBuilder.labels.routingTeaserHint || '' ) +
			'</div>';
		}

		/**
		 * Opens an upgrade dialog by id.
		 *
		 * @param {string} id Dialog id.
		 * @return {void}
		 */
		function openUpgradeModal( id ) {
			$( document.getElementById( id ) ).removeAttr( 'hidden' );
			$( 'body' ).addClass( 'boldform-upgrade-modal-open' );
		}

		/**
		 * Closes every upgrade dialog.
		 *
		 * @return {void}
		 */
		function closeUpgradeModals() {
			$( '.boldform-upgrade-modal' ).attr( 'hidden', 'hidden' );
			$( 'body' ).removeClass( 'boldform-upgrade-modal-open' );
		}

		$( document )
			.on( 'click.bfup', '.boldform-upgrade-btn', function ( e ) {
				e.preventDefault();
				openUpgradeModal( $( this ).data( 'upgrade-modal' ) );
			} )
			.on( 'click.bfup', '.boldform-upgrade-modal [data-boldform-upgrade-close]', function () {
				closeUpgradeModals();
			} )
			.on( 'keydown.bfup', function ( e ) {
				if ( 'Escape' === e.key ) {
					closeUpgradeModals();
				}
			} );

		// ── Thank-you message editor ─────────────────────────────────────────────
		// The message is rich markup, so it is edited in the WordPress editor rather
		// than a plain textarea. renderFormSettings() replaces the whole settings
		// panel's HTML, so the editor has to be torn down before each render and stood
		// back up after -- see removeThankYouEditor()/initThankYouEditor().

		var THANK_YOU_EDITOR_ID = 'boldform-thank-you-message';

		/**
		 * Whether the WordPress editor API is available.
		 *
		 * @return {boolean} True when wp.editor can be used.
		 */
		function hasEditorApi() {
			return !! ( window.wp && window.wp.editor && window.wp.editor.initialize );
		}

		/**
		 * Tears down the thank-you editor.
		 *
		 * Safe to call when no instance exists, which is the common case: the panel is
		 * re-rendered on changes that have nothing to do with this field.
		 *
		 * @return {void}
		 */
		function removeThankYouEditor() {
			if ( ! hasEditorApi() ) {
				return;
			}

			try {
				window.wp.editor.remove( THANK_YOU_EDITOR_ID );
			} catch ( e ) {
				// No instance to remove; nothing to do.
			}
		}

		/**
		 * Stands the thank-you editor up and wires it back to formSettings.
		 *
		 * Only the AJAX submit mode renders the field, so this is a no-op in the
		 * redirect modes.
		 *
		 * @return {void}
		 */
		function initThankYouEditor() {
			if ( ! hasEditorApi() || ! document.getElementById( THANK_YOU_EDITOR_ID ) ) {
				return;
			}

			// An instance can survive in TinyMCE's registry after its DOM is gone. Left
			// registered, initialize() would bind to the corpse and the message would
			// silently stop syncing.
			if ( window.tinymce && window.tinymce.get( THANK_YOU_EDITOR_ID ) ) {
				window.tinymce.remove( '#' + THANK_YOU_EDITOR_ID );
			}

			window.wp.editor.initialize( THANK_YOU_EDITOR_ID, {
				mediaButtons: false,
				quicktags:    true,
				tinymce:      {
					wpautop:  true,
					height:   200,
					toolbar1: 'formatselect,bold,italic,underline,bullist,numlist,alignleft,aligncenter,alignright,link,unlink,forecolor,removeformat,undo,redo',
					toolbar2: '',
					setup:    function ( editor ) {
						// Mirror every keystroke: TinyMCE edits an iframe, so the
						// textarea's own input/change events never fire and the
						// delegated settings collector would never see the message.
						editor.on( 'change keyup SetContent undo redo', syncThankYouMessage );
					}
				}
			} );

			$( '#' + THANK_YOU_EDITOR_ID + '-html' ).text( boldformLiteBuilder.labels.editorCode || 'Code' );
			$( '#' + THANK_YOU_EDITOR_ID + '-tmce' ).text( boldformLiteBuilder.labels.editorVisual || 'Visual' );
		}

		/**
		 * Reads the thank-you message out of whichever editor mode is active and stores it.
		 *
		 * wp.editor.getContent() flushes TinyMCE into the textarea first when Visual is
		 * active, so this is correct in either mode.
		 *
		 * @return {void}
		 */
		function syncThankYouMessage() {
			if ( ! document.getElementById( THANK_YOU_EDITOR_ID ) ) {
				return;
			}

			state.formSettings.thank_you_message = hasEditorApi()
				? window.wp.editor.getContent( THANK_YOU_EDITOR_ID )
				: ( $( '#' + THANK_YOU_EDITOR_ID ).val() || '' );
		}

		function renderFormSettings() {
			var submitMode = 'ajax';
			if ( 'redirect' === state.formSettings.submission_type ) {
				submitMode = 'custom' === state.formSettings.redirect_type ? 'custom_url' : 'page';
			}
			var useCustomAdminEmail = 'custom' === state.formSettings.admin_email_type;
			var pages = boldformLiteBuilder.pages || [];

			// ── Confirmation pane ────────────────────────────────────────────────
			var confirmationPane =
				'<div class="bfs-stab-pane-head">' +
					'<h3>' + escapeHtml( boldformLiteBuilder.labels.submitBehavior ) + '</h3>' +
					'<p>' + escapeHtml( boldformLiteBuilder.labels.submitBehaviorDesc || 'Choose what happens after a visitor submits this form.' ) + '</p>' +
				'</div>' +
				'<div class="boldform-choice-grid boldform-choice-grid--3">' +
					'<label class="boldform-choice-card' + ( 'ajax' === submitMode ? ' is-selected' : '' ) + '">' +
						'<input type="radio" name="boldform-submit-mode" value="ajax"' + ( 'ajax' === submitMode ? ' checked' : '' ) + '>' +
						'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.ajaxSubmit ) + '</span>' +
						'<span class="boldform-choice-card__description">' + escapeHtml( boldformLiteBuilder.labels.ajaxSubmitDesc || 'Show a success message without reloading.' ) + '</span>' +
					'</label>' +
					'<label class="boldform-choice-card' + ( 'page' === submitMode ? ' is-selected' : '' ) + '">' +
						'<input type="radio" name="boldform-submit-mode" value="page"' + ( 'page' === submitMode ? ' checked' : '' ) + '>' +
						'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.toAPage || 'To a Page' ) + '</span>' +
						'<span class="boldform-choice-card__description">' + escapeHtml( boldformLiteBuilder.labels.toAPageDesc || 'Redirect to an existing page.' ) + '</span>' +
					'</label>' +
					'<label class="boldform-choice-card' + ( 'custom_url' === submitMode ? ' is-selected' : '' ) + '">' +
						'<input type="radio" name="boldform-submit-mode" value="custom_url"' + ( 'custom_url' === submitMode ? ' checked' : '' ) + '>' +
						'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.customUrl || 'Custom URL' ) + '</span>' +
						'<span class="boldform-choice-card__description">' + escapeHtml( boldformLiteBuilder.labels.customUrlDesc || 'Redirect to any URL you specify.' ) + '</span>' +
					'</label>' +
				'</div>' +
				( 'ajax' === submitMode
					? '<div class="boldform-setting-group bfs-stab-field">' +
						'<div class="boldform-ty-head">' +
							'<label for="boldform-thank-you-message">' + escapeHtml( boldformLiteBuilder.labels.thankYouMessage ) + '</label>' +
							// Always rendered, even when empty: an add-on shipping real
							// shortcodes fills this slot on boldform:form_settings_rendered.
							'<div class="boldform-shortcode-slot" data-shortcode-slot="thank_you">' +
								shortcodeTeaser() +
							'</div>' +
						'</div>' +
						// Only the bare textarea: wp.editor.initialize() builds the editor
						// wrap, the Visual/Code tabs and the quicktags toolbar around it.
						'<div class="boldform-rich-editor">' +
							'<textarea id="boldform-thank-you-message" rows="6">' + escapeHtml( state.formSettings.thank_you_message ) + '</textarea>' +
						'</div>' +
						shortcodeHint() +
					'</div>'
					: ''
				) +
				( 'page' === submitMode
					? '<div class="boldform-setting-group bfs-stab-field">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.toAPage || 'Redirect to Page' ) + '</label>' +
						'<select id="boldform-redirect-url"><option value="">' + escapeHtml( '— Select a page —' ) + '</option>' +
						(function () {
							var opts = '';
							pages.forEach( function ( p ) {
								opts += '<option value="' + escapeHtml( p.url ) + '"' + ( state.formSettings.redirect_url === p.url ? ' selected' : '' ) + '>' + escapeHtml( p.title ) + '</option>';
							} );
							return opts;
						}()) +
						'</select>' +
					'</div>'
					: ''
				) +
				( 'custom_url' === submitMode
					? '<div class="boldform-setting-group bfs-stab-field">' +
						'<label>' + escapeHtml( boldformLiteBuilder.labels.customUrl || 'Custom URL' ) + '</label>' +
						'<input type="url" id="boldform-redirect-custom-url" value="' + escapeHtml( state.formSettings.redirect_url || '' ) + '" placeholder="https://example.com/thank-you">' +
					'</div>'
					: ''
				);

			// ── Email Notification pane ──────────────────────────────────────────
			var emailPane =
				'<div class="bfs-stab-pane-head">' +
					'<h3>' + escapeHtml( boldformLiteBuilder.labels.adminNotifications ) + '</h3>' +
					'<p>' + escapeHtml( boldformLiteBuilder.labels.adminNotificationsDesc || 'Send an email to yourself or a custom address every time this form is submitted.' ) + '</p>' +
				'</div>' +
				'<div class="bfsп-email-block">' +
					'<div class="bfsп-email-block__head">' +
						'<span class="bfsп-email-block__title">' + escapeHtml( boldformLiteBuilder.labels.adminNotifications ) + '</span>' +
						'<label class="boldform-switch">' +
							'<input type="checkbox" id="boldform-enable-admin-email"' + ( state.formSettings.enable_admin_email ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__slider"></span>' +
						'</label>' +
					'</div>' +
					( state.formSettings.enable_admin_email
						? '<div class="bfsп-email-block__body">' +
							'<div class="boldform-choice-grid">' +
								'<label class="boldform-choice-card' + ( ! useCustomAdminEmail ? ' is-selected' : '' ) + '">' +
									'<input type="radio" name="boldform-admin-email-type" id="boldform-admin-email-type-site-admin" value="site_admin"' + ( ! useCustomAdminEmail ? ' checked' : '' ) + '>' +
									'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.siteAdminEmail ) + '</span>' +
									'<span class="boldform-choice-card__description">' + escapeHtml( boldformLiteBuilder.labels.siteAdminEmailHelp ) + '</span>' +
								'</label>' +
								'<label class="boldform-choice-card' + ( useCustomAdminEmail ? ' is-selected' : '' ) + '">' +
									'<input type="radio" name="boldform-admin-email-type" id="boldform-admin-email-type-custom" value="custom"' + ( useCustomAdminEmail ? ' checked' : '' ) + '>' +
									'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.customEmail ) + '</span>' +
									'<span class="boldform-choice-card__description">' + escapeHtml( boldformLiteBuilder.labels.customEmailHelp ) + '</span>' +
								'</label>' +
							'</div>' +
							( useCustomAdminEmail
								? '<div class="boldform-setting-group" style="margin-top:12px;margin-bottom:0">' +
									'<label for="boldform-admin-email">' + escapeHtml( boldformLiteBuilder.labels.adminEmailAddress ) + '</label>' +
									'<input type="email" id="boldform-admin-email" value="' + escapeHtml( state.formSettings.admin_email ) + '">' +
								'</div>'
								: ''
							) +
						// A slot for what rides along with the admin notification (e.g. a
						// generated PDF of the submission). Kept distinct from the content
						// slot below so two add-ons can fill the same email block without
						// one overwriting the other.
						//
						// Carries the teaser when the CTAs are on and nothing when they
						// are off, so an add-on always finds this slot empty and can
						// never overwrite a working control with one that only
						// advertises it.
						//
						// Inside this branch on purpose: there is no sense configuring what
						// to attach to an email that is switched off.
						'<div class="boldform-email-attachment-slot" data-email-slot="admin">' + attachmentTeaser() + '</div>' +
						// A slot for who the admin notification goes to (e.g.
						// Conditional Email Routing). Kept distinct from the content
						// slot below so two add-ons can fill the same email block
						// without one overwriting the other.
						//
						// Inside this branch on purpose: there is no sense
						// configuring who an email goes to while that email is
						// switched off.
						//
						// Carries the teaser only while the upgrade CTAs are shown,
						// so an add-on always finds the slot empty and ready to fill.
						'<div class="boldform-email-routing-slot" data-email-slot="admin">' + routingTeaser() + '</div>' +
							// Pro extension slot: add-ons (e.g. Custom Email Editor) inject per-email
							// content controls here on boldform:form_settings_rendered. It lives INSIDE
							// __body alongside the attachment/routing slots so all three align
							// identically — the add-on styles its own block with a top-border divider
							// and NO horizontal padding (the body's 16px provides the inset), matching
							// .bf-pdf-block / .bf-er-block. Inside the enabled branch, so "Customize
							// this email" only shows when the notification is on. The teaser only
							// occupies it while the upgrade CTAs are shown, so an add-on always finds
							// the slot empty and ready to fill.
							'<div class="boldform-email-pro-slot" data-email-slot="admin">' + emailTeaser() + '</div>' +
						'</div>'
						: ''
					) +
				'</div>' +
				'<div class="bfsп-email-block">' +
					'<div class="bfsп-email-block__head">' +
						'<span class="bfsп-email-block__title">' + escapeHtml( boldformLiteBuilder.labels.userNotifications ) + '</span>' +
						'<label class="boldform-switch">' +
							'<input type="checkbox" id="boldform-enable-user-email"' + ( state.formSettings.enable_user_email ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__slider"></span>' +
						'</label>' +
					'</div>' +
					// A slot for what rides along with the user confirmation. Mirrors the
					// admin block: inside the enabled branch, because there is no sense
					// configuring what to attach to an email that is switched off.
					( state.formSettings.enable_user_email
						? '<div class="bfsп-email-block__body">' +
							'<div class="boldform-email-attachment-slot" data-email-slot="user">' + attachmentTeaser() + '</div>' +
							// Pro extension slot for the user confirmation email — inside __body
							// alongside the attachment slot so both align identically (see the admin
							// block above). Inside the enabled branch, so it only shows when on.
							'<div class="boldform-email-pro-slot" data-email-slot="user">' + emailTeaser() + '</div>' +
						'</div>'
						: ''
					) +
				'</div>';

			// ── Security pane — duplicate prevention ────────────────────────────
			var dupEnabled  = !! state.formSettings.dup_enabled;
			var dupMethod   = state.formSettings.dup_method   || 'email';
			var dupFieldId  = state.formSettings.dup_field_id || '';
			var dupMessage  = state.formSettings.dup_message  || '';

			// Build field options for the "custom field" method.
			var dupFields = getAllFields().filter( function ( f ) {
				return [ 'text', 'email', 'tel', 'number', 'select', 'radio', 'hidden' ].indexOf( f.type ) !== -1;
			} );
			var dupFieldOpts = '<option value="">' + escapeHtml( boldformLiteBuilder.labels.selectField || '— select field —' ) + '</option>';
			dupFields.forEach( function ( f ) {
				dupFieldOpts += '<option value="' + escapeHtml( f.id ) + '"' + ( dupFieldId === f.id ? ' selected' : '' ) + '>' + escapeHtml( f.label || f.type ) + '</option>';
			} );

			var securityPane =
				'<div class="bfs-stab-pane-head">' +
					'<h3>Duplicate Prevention</h3>' +
					'<p>Block the same person from submitting this form more than once.</p>' +
				'</div>' +
				'<div class="bfsп-email-block">' +
					'<div class="bfsп-email-block__head">' +
						'<span class="bfsп-email-block__title">Prevent Duplicate Entries</span>' +
						'<label class="boldform-switch">' +
							'<input type="checkbox" id="boldform-dup-enabled"' + ( dupEnabled ? ' checked' : '' ) + '>' +
							'<span class="boldform-switch__slider"></span>' +
						'</label>' +
					'</div>' +
					( dupEnabled ?
						'<div class="bfsп-email-block__body">' +
							'<div class="boldform-setting-group">' +
								'<label>Detection Method</label>' +
								'<div class="boldform-choice-grid boldform-choice-grid--3">' +
									'<label class="boldform-choice-card' + ( 'email' === dupMethod ? ' is-selected' : '' ) + '">' +
										'<input type="radio" name="boldform-dup-method" value="email"' + ( 'email' === dupMethod ? ' checked' : '' ) + '>' +
										'<span class="boldform-choice-card__title">Email</span>' +
										'<span class="boldform-choice-card__description">Match on email field value</span>' +
									'</label>' +
									'<label class="boldform-choice-card' + ( 'ip' === dupMethod ? ' is-selected' : '' ) + '">' +
										'<input type="radio" name="boldform-dup-method" value="ip"' + ( 'ip' === dupMethod ? ' checked' : '' ) + '>' +
										'<span class="boldform-choice-card__title">IP Address</span>' +
										'<span class="boldform-choice-card__description">Match on submitter IP</span>' +
									'</label>' +
									'<label class="boldform-choice-card' + ( 'field' === dupMethod ? ' is-selected' : '' ) + '">' +
										'<input type="radio" name="boldform-dup-method" value="field"' + ( 'field' === dupMethod ? ' checked' : '' ) + '>' +
										'<span class="boldform-choice-card__title">Custom Field</span>' +
										'<span class="boldform-choice-card__description">Match on any field value</span>' +
									'</label>' +
								'</div>' +
							'</div>' +
							( 'field' === dupMethod ?
								'<div class="boldform-setting-group">' +
									'<label for="boldform-dup-field-id">Field to match on</label>' +
									'<select id="boldform-dup-field-id">' + dupFieldOpts + '</select>' +
								'</div>' : ''
							) +
							'<div class="boldform-setting-group">' +
								'<label for="boldform-dup-message">Error message <span style="font-weight:400;color:#94a3b8">(optional)</span></label>' +
								'<input type="text" id="boldform-dup-message" value="' + escapeHtml( dupMessage ) + '" placeholder="You have already submitted this form.">' +
							'</div>' +
						'</div>' : ''
					) +
				'</div>';

			// ── Build tabbed layout ──────────────────────────────────────────────
			var tabs = [
				{ id: 'confirmation',  icon: '<span class="dashicons dashicons-yes"></span>', label: escapeHtml( boldformLiteBuilder.labels.tabConfirmation  || 'Confirmation' ),      desc: escapeHtml( boldformLiteBuilder.labels.tabConfirmationDesc  || 'Redirect or message' ) },
				{ id: 'email',         icon: '<span class="dashicons dashicons-email-alt"></span>', label: escapeHtml( boldformLiteBuilder.labels.tabEmail         || 'Email Notification' ), desc: escapeHtml( boldformLiteBuilder.labels.tabEmailDesc         || 'Admin & user emails' ) },
				{ id: 'security',      icon: '<span class="dashicons dashicons-privacy"></span>', label: 'Security',       desc: 'Duplicate prevention' }
			];

			var navHtml = '';
			tabs.forEach( function ( t ) {
				navHtml +=
					'<button type="button" class="bfs-stab-nav-item" data-stab="' + t.id + '">' +
						'<span class="bfs-stab-nav-icon">' + t.icon + '</span>' +
						'<span class="bfs-stab-nav-text">' +
							'<span class="bfs-stab-nav-label">' + t.label + '</span>' +
							'<span class="bfs-stab-nav-desc">' + t.desc + '</span>' +
						'</span>' +
						'<span class="bfs-stab-nav-arrow">&#8250;</span>' +
					'</button>';
			} );

			// Placeholder for Pro tabs (injected via boldform:form_settings_rendered).
			navHtml += '<div class="bfs-stab-nav-pro-slots"></div>';

			var html =
				'<div class="bfs-stab-layout">' +
					'<nav class="bfs-stab-nav">' + navHtml + '</nav>' +
					'<div class="bfs-stab-content">' +
						'<div class="bfs-stab-pane" data-pane="confirmation">' + confirmationPane + '</div>' +
						'<div class="bfs-stab-pane" data-pane="email">' + emailPane + '</div>' +
						'<div class="bfs-stab-pane" data-pane="security">' + securityPane + '</div>' +
					'</div>' +
				'</div>';

			// Tear the editor down before the markup it is attached to is destroyed:
			// TinyMCE keeps the instance (and its iframe) alive otherwise.
			removeThankYouEditor();

			$( '#boldform-form-settings-panel' ).html( html );

			// ── Tab switching ────────────────────────────────────────────────────
			var $panel = $( '#boldform-form-settings-panel' );

			$panel.off( 'click.bfstab', '.bfs-stab-nav-item' )
				.on( 'click.bfstab', '.bfs-stab-nav-item', function () {
					var tab = $( this ).data( 'stab' );
					activeSettingsTab = tab;
					$panel.find( '.bfs-stab-nav-item' ).removeClass( 'is-active' );
					$( this ).addClass( 'is-active' );
					$panel.find( '.bfs-stab-pane' ).removeClass( 'is-active' );
					$panel.find( '.bfs-stab-pane[data-pane="' + tab + '"]' ).addClass( 'is-active' );
				} );

			/**
			 * Fired after the core form settings panel is rendered.
			 * Pro modules append nav items to .bfs-stab-nav-pro-slots and
			 * panes to .bfs-stab-content.
			 *
			 * @event boldform:form_settings_rendered
			 * @param {object} formSettings Current state.formSettings snapshot.
			 */
			$( document ).trigger( 'boldform:form_settings_rendered', [ state.formSettings ] );

			// Order the injected tabs deterministically.
			//
			// Listeners append in whatever order they happened to bind, which depends on
			// how each one is loaded (inline script vs. its own file), so the resulting
			// tab order is otherwise incidental. Instead, an add-on declares its position
			// with a numeric `data-stab-order` on its nav item and this pass sorts by it
			// (items without one default to 50, and equal values keep their append order,
			// so a listener that declares nothing still behaves exactly as before).
			//
			// Deferred by setTimeout so it runs after every synchronous listener of the
			// event above has finished appending — sorting inline would only see the tabs
			// injected so far. Nothing here names a specific add-on: it is a generic
			// ordering seam.
			setTimeout( function () {
				var $slots = $panel.find( '.bfs-stab-nav-pro-slots' );
				if ( ! $slots.length ) {
					return;
				}

				var $items = $slots.children( '.bfs-stab-nav-item' );
				if ( $items.length < 2 ) {
					return;
				}

				$items.get()
					.map( function ( el, i ) {
						var order = parseFloat( $( el ).attr( 'data-stab-order' ) );
						return { el: el, order: isNaN( order ) ? 50 : order, i: i };
					} )
					.sort( function ( a, b ) {
						return a.order - b.order || a.i - b.i;
					} )
					.forEach( function ( item ) {
						$slots.append( item.el );
					} );
			}, 0 );

			// Restore the previously active tab (Pro panes are now injected above).
			var $restore = $panel.find( '.bfs-stab-nav-item[data-stab="' + activeSettingsTab + '"]' );
			if ( ! $restore.length ) {
				// Fallback to first tab if the stored tab no longer exists.
				$restore = $panel.find( '.bfs-stab-nav-item' ).first();
				activeSettingsTab = $restore.data( 'stab' ) || 'confirmation';
			}
			$restore.addClass( 'is-active' );
			$panel.find( '.bfs-stab-pane[data-pane="' + activeSettingsTab + '"]' ).addClass( 'is-active' );

			// After the active pane is set, so TinyMCE measures a visible container.
			initThankYouEditor();
		}

		var designThemes = {
			'default-blue':   { label: 'Default Blue',   primary: '#2f80ed', focus: '#2f80ed', btnBg: '#2f80ed', btnText: '#fff', fieldBorder: '#bfdbfe', fieldBg: '#eff6ff', fieldRadius: 16 },
			'ocean-teal':     { label: 'Ocean Teal',     primary: '#0f766e', focus: '#0f766e', btnBg: '#0f766e', btnText: '#fff', fieldBorder: '#99f6e4', fieldBg: '#f0fdfa', fieldRadius: 16 },
			'forest-green':   { label: 'Forest Green',   primary: '#16a34a', focus: '#16a34a', btnBg: '#16a34a', btnText: '#fff', fieldBorder: '#bbf7d0', fieldBg: '#f0fdf4', fieldRadius: 12 },
			'sunset-orange':  { label: 'Sunset Orange',  primary: '#ea580c', focus: '#ea580c', btnBg: '#ea580c', btnText: '#fff', fieldBorder: '#fed7aa', fieldBg: '#fff7ed', fieldRadius: 8 },
			'royal-purple':   { label: 'Royal Purple',   primary: '#7c3aed', focus: '#7c3aed', btnBg: '#7c3aed', btnText: '#fff', fieldBorder: '#ddd6fe', fieldBg: '#f5f3ff', fieldRadius: 12 },
			'midnight-dark':  { label: 'Midnight Dark',  primary: '#1e293b', focus: '#334155', btnBg: '#1e293b', btnText: '#fff', fieldBorder: '#475569', fieldBg: '#f8fafc', fieldRadius: 8 },
			'minimal-gray':   { label: 'Minimal Gray',   primary: '#6b7280', focus: '#6b7280', btnBg: '#374151', btnText: '#fff', fieldBorder: '#e5e7eb', fieldBg: '#f9fafb', fieldRadius: 4 },
			'rose-pink':      { label: 'Rose Pink',      primary: '#e11d48', focus: '#e11d48', btnBg: '#e11d48', btnText: '#fff', fieldBorder: '#fecdd3', fieldBg: '#fff1f2', fieldRadius: 16 }
		};

		// Apply a Design Theme. When clearColorOverrides is true, per-control colour
		// overrides stored in the style layer are dropped first — without that a
		// single explicit colour (e.g. --bf-choice-accent) outranks the theme's
		// --bf-button-bg for the rest of the form's life and the theme looks broken.
		// Callers should route through bfApplyThemeWithConflictCheck() so the user is
		// asked before anything is discarded.
		function applyDesignTheme( themeKey, clearColorOverrides ) {
			var theme = designThemes[ themeKey ];
			if ( ! theme ) return;
			if ( clearColorOverrides ) { bfClearThemeColorOverrides(); }
			state.formSettings.design_theme = themeKey;
			state.formSettings.button_background_color = theme.btnBg;
			state.formSettings.button_border_color = theme.btnBg;
			state.formSettings.button_text_color = theme.btnText;
			state.formSettings.field_background_color = theme.fieldBg;
			state.formSettings.field_border_color = theme.fieldBorder;
			state.formSettings.field_border_radius = theme.fieldRadius;
			// Map focus color to nearest named value for build_form_style_variables
			var focusMap = { '#2f80ed': 'blue', '#2563eb': 'blue', '#0f766e': '', '#16a34a': 'green', '#334155': 'dark' };
			state.formSettings.field_focus_color = focusMap[ theme.focus ] || '';
			renderAll();
		}

		// Small localized-label reader for the theme dialog.
		function bfThemeLabel( key, fallback ) {
			var l = boldformLiteBuilder.labels || {};
			return l[ key ] ? l[ key ] : fallback;
		}

		// Entry point for every "apply a Design Theme" interaction. Applies straight
		// away when nothing is in the way; otherwise asks before discarding the
		// colour overrides that would outrank the theme.
		function bfApplyThemeWithConflictCheck( themeKey ) {
			if ( ! designThemes[ themeKey ] ) { return; }
			var conflicts = bfThemeColorConflicts();
			if ( ! conflicts.length ) {
				applyDesignTheme( themeKey, false );
				return;
			}
			bfShowThemeConflictDialog( themeKey, conflicts );
		}

		function bfShowThemeConflictDialog( themeKey, conflicts ) {
			$( '#boldform-theme-confirm' ).remove();

			var themeName = designThemes[ themeKey ] ? designThemes[ themeKey ].label : themeKey;
			var listHtml = conflicts.map( function ( c ) {
				return '<li style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
					'<span aria-hidden="true" style="flex:0 0 auto;width:14px;height:14px;border-radius:3px;border:1px solid rgba(15,23,42,.2);background:' + escapeHtml( c.value ) + '"></span>' +
					'<span style="flex:1 1 auto;min-width:0;color:#334155">' + escapeHtml( c.label ) + '</span>' +
					'<code style="flex:0 0 auto;background:#f1f5f9;border-radius:3px;padding:1px 5px;font-size:11px;color:#475569">' + escapeHtml( c.value ) + '</code>' +
				'</li>';
			} ).join( '' );

			var intro = bfThemeLabel( 'themeConflictBody', 'These custom colors are overriding the theme. Applying it will replace them:' );

			var $overlay = $(
				'<div id="boldform-theme-confirm" role="dialog" aria-modal="true" aria-labelledby="boldform-theme-confirm-title" ' +
					'style="position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55)">' +
					'<div style="background:#fff;max-width:460px;width:calc(100% - 40px);border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px">' +
						'<h2 id="boldform-theme-confirm-title" style="margin:0 0 8px;font-size:18px;line-height:1.3">' +
							escapeHtml( bfThemeLabel( 'themeConflictTitle', 'Apply theme?' ).replace( '%s', themeName ) ) +
						'</h2>' +
						'<p style="margin:0 0 12px;color:#475569;line-height:1.5">' + escapeHtml( intro ) + '</p>' +
						'<ul style="margin:0 0 20px;padding:0;list-style:none;max-height:180px;overflow-y:auto">' + listHtml + '</ul>' +
						'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">' +
							'<button type="button" class="button" data-bf-theme="cancel">' +
								escapeHtml( bfThemeLabel( 'cancel', 'Cancel' ) ) +
							'</button>' +
							'<button type="button" class="button button-primary" data-bf-theme="apply">' +
								escapeHtml( bfThemeLabel( 'themeConflictApply', 'Apply theme' ) ) +
							'</button>' +
						'</div>' +
					'</div>' +
				'</div>'
			);

			function closeDialog() {
				$overlay.remove();
				$( document ).off( 'keydown.bftheme' );
			}

			$overlay.on( 'click', function ( e ) {
				var action = $( e.target ).closest( '[data-bf-theme]' ).attr( 'data-bf-theme' );
				if ( e.target === $overlay[ 0 ] ) { action = 'cancel'; }
				if ( ! action ) { return; }
				closeDialog();
				if ( 'apply' === action ) {
					applyDesignTheme( themeKey, true );
				}
			} );

			$( document ).on( 'keydown.bftheme', function ( e ) {
				if ( 27 === e.keyCode ) { closeDialog(); }
			} );

			$( 'body' ).append( $overlay );
			$overlay.find( '[data-bf-theme="apply"]' ).trigger( 'focus' );
		}

		function renderStylingSettings() {
			// Build theme cards.
			var themeCardsHtml = '<div class="boldform-theme-grid">';
			Object.keys( designThemes ).forEach( function ( key ) {
				var t = designThemes[ key ];
				var isActive = state.formSettings.design_theme === key;
				// Per-theme accent so the card's hover/active border + shadow match the
				// theme's own colour (not a fixed blue). Emit the hex + an RGB triplet
				// for the soft tints used by the CSS rgba() rules.
				var accent = t.primary || '#2f80ed';
				var hx = accent.replace( '#', '' );
				if ( 3 === hx.length ) { hx = hx.replace( /(.)/g, '$1$1' ); }
				var accentRgb = parseInt( hx.substr( 0, 2 ), 16 ) + ',' + parseInt( hx.substr( 2, 2 ), 16 ) + ',' + parseInt( hx.substr( 4, 2 ), 16 );
				themeCardsHtml += '<button type="button" class="boldform-theme-card' + ( isActive ? ' is-active' : '' ) + '" data-theme="' + escapeHtml( key ) + '" style="--bf-theme-accent:' + escapeHtml( accent ) + ';--bf-theme-accent-rgb:' + accentRgb + '">' +
					'<span class="boldform-theme-card__preview">' +
						'<span class="boldform-theme-card__input" style="border-color:' + escapeHtml( t.fieldBorder ) + ';background:' + escapeHtml( t.fieldBg ) + ';border-radius:' + t.fieldRadius + 'px"></span>' +
						'<span class="boldform-theme-card__btn" style="background:' + escapeHtml( t.btnBg ) + ';color:' + escapeHtml( t.btnText ) + ';border-radius:' + Math.min( t.fieldRadius, 8 ) + 'px"></span>' +
					'</span>' +
					'<span class="boldform-theme-card__name">' + escapeHtml( t.label ) + '</span>' +
				'</button>';
			} );
			themeCardsHtml += '</div>';

			var themeResetSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>';
			var themeResetLabel = escapeHtml( advLabel( 'resetSection' ) );
			$( '#boldform-form-styling-panel' ).html(
				'<div class="boldform-style-section is-open">' +
					'<div class="boldform-style-section__head"><h3>Design Theme</h3>' +
						'<div class="boldform-style-section__head-actions">' +
							'<button type="button" class="boldform-style-section__reset boldform-theme-reset" title="' + themeResetLabel + '" aria-label="' + themeResetLabel + '">' + themeResetSvg + '</button>' +
							'<span class="dashicons dashicons-arrow-down-alt2"></span>' +
						'</div>' +
					'</div>' +
					'<div class="boldform-style-section__body">' + themeCardsHtml + '</div>' +
				'</div>' +
				renderAdvancedStyleSections()
			);
			bfSyncFormMaxWidthState();
			bfRefreshResetStates();
		}

		// ====================================================================
		// Advanced (full Elementor-parity) Style controls — schema-driven and
		// responsive-aware. Each control writes finished CSS values into
		// state.formSettings.style[device] keyed by the literal custom-property
		// name. The compile/emit/persist pipeline is generic over --bf-* vars
		// (getFormStyleBlock + PHP build_responsive_style_vars + sanitize_css_value),
		// so adding a control needs no PHP change — only the matching var hook in
		// frontend.css. Hover/focus/placeholder states are expressed as static
		// frontend.css rules that read a state var with the base var as fallback.
		// ====================================================================

		// Curated, WordPress.org-safe font stacks (no remote/Google Fonts). Stored
		// unquoted (valid CSS ident sequences) so they pass the value sanitizer.
		var BF_FONT_STACKS = {
			'system':    '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
			'arial':     'Arial, Helvetica, sans-serif',
			'helvetica': 'Helvetica Neue, Helvetica, Arial, sans-serif',
			'verdana':   'Verdana, Geneva, sans-serif',
			'tahoma':    'Tahoma, Geneva, sans-serif',
			'trebuchet': 'Trebuchet MS, Helvetica, sans-serif',
			'georgia':   'Georgia, Times New Roman, serif',
			'times':     'Times New Roman, Times, serif',
			'palatino':  'Palatino Linotype, Book Antiqua, Palatino, serif',
			'courier':   'Courier New, Courier, monospace'
		};

		function advLabel( key ) {
			var a = boldformLiteBuilder.advStyle || {};
			if ( a[ key ] ) { return a[ key ]; }
			var b = boldformLiteBuilder.labels || {};
			return b[ key ] || key;
		}

		function advStyleGet( cssVar ) {
			var layer = ( state.formSettings.style && state.formSettings.style[ state.activeDevice ] ) || {};
			return typeof layer[ cssVar ] === 'string' ? layer[ cssVar ] : '';
		}

		// Writes a map of { cssVar: value } into the active device layer (deletes on
		// empty), then refreshes the preview only — never re-renders the controls,
		// so input focus is preserved while typing.
		function advStyleSetVars( map ) {
			if ( ! state.formSettings.style ) {
				state.formSettings.style = { desktop: {}, tablet: {}, mobile: {} };
			}
			var layer = state.formSettings.style[ state.activeDevice ];
			if ( ! layer ) { layer = state.formSettings.style[ state.activeDevice ] = {}; }
			Object.keys( map ).forEach( function ( k ) {
				var v = map[ k ];
				if ( '' === v || null == v ) { delete layer[ k ]; }
				else { layer[ k ] = String( v ); }
			} );
			applyPreviewStyleBlock();
			bfRefreshResetStates();
		}

		var BF_HEX6 = /^#[0-9a-fA-F]{6}$/;

		// ── Colour helpers: store/compose hex ⇄ rgba so colours can carry opacity ──
		function bfHexToRgb( hex ) {
			var n = parseInt( hex.slice( 1 ), 16 );
			return { r: ( n >> 16 ) & 255, g: ( n >> 8 ) & 255, b: n & 255 };
		}
		function bfRgbToHex( r, g, b ) {
			return '#' + [ r, g, b ].map( function ( x ) {
				x = Math.max( 0, Math.min( 255, parseInt( x, 10 ) || 0 ) );
				var h = x.toString( 16 );
				return 1 === h.length ? '0' + h : h;
			} ).join( '' );
		}
		// Compose a stored colour from an RGB hex + opacity 0–100 (plain hex when fully opaque).
		function bfComposeColor( hex, opacity ) {
			if ( ! BF_HEX6.test( hex ) ) { return ''; }
			var op = parseInt( opacity, 10 );
			if ( isNaN( op ) ) { op = 100; }
			op = Math.max( 0, Math.min( 100, op ) );
			if ( op >= 100 ) { return hex.toLowerCase(); }
			var c = bfHexToRgb( hex );
			return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + ( Math.round( op ) / 100 ) + ')';
		}
		// Parse a stored colour ( #rrggbb | #rrggbbaa | rgb()/rgba() ) → { hex, opacity }.
		function bfParseColor( val ) {
			val = ( val || '' ).trim();
			if ( BF_HEX6.test( val ) ) { return { hex: val.toLowerCase(), opacity: 100 }; }
			var m8 = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/.exec( val );
			if ( m8 ) { return { hex: ( '#' + m8[1] ).toLowerCase(), opacity: Math.round( parseInt( m8[2], 16 ) / 255 * 100 ) }; }
			var m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i.exec( val );
			if ( m ) {
				var a = ( void 0 === m[4] ) ? 1 : parseFloat( m[4] );
				if ( isNaN( a ) ) { a = 1; }
				a = Math.max( 0, Math.min( 1, a ) );
				return { hex: bfRgbToHex( m[1], m[2], m[3] ), opacity: Math.round( a * 100 ) };
			}
			return { hex: '', opacity: 100 };
		}
		// Read a .boldform-color-field element → composed colour string ('' if no valid hex).
		function bfReadColorField( $cf ) {
			if ( ! $cf || ! $cf.length ) { return ''; }
			var hv = ( $cf.find( '.bf-adv-hex' ).val() || '' ).trim();
			if ( ! BF_HEX6.test( hv ) ) { return ''; }
			var opRaw = $cf.find( '.bf-adv-opacity' ).val();
			return bfComposeColor( hv, ( '' === opRaw || null == opRaw ) ? 100 : opRaw );
		}
		// Alpha-slider track gradient: same colour fading 0→100% alpha (8-digit hex keeps
		// the hue true at every step, unlike fading to the muddy `transparent` keyword).
		function bfAlphaGrad( hex ) {
			if ( ! BF_HEX6.test( hex ) ) { hex = '#0f766e'; }
			return 'linear-gradient(to right, ' + hex + '00, ' + hex + ')';
		}
		// When an advanced colour is left unset, the colour the form actually renders is
		// the flat base/theme value (the advanced layer sits on top of it). Map the
		// advanced var → its flat settings key so the swatch can preview that real default.
		var BF_FLAT_DEFAULT = {
			'--bf-field-bg': 'field_background_color',
			'--bf-field-text': 'field_text_color',
			'--bf-field-border': 'field_border_color',
			'--bf-select-bg': 'field_background_color',
			'--bf-select-text': 'field_text_color',
			'--bf-button-bg': 'button_background_color',
			'--bf-button-text': 'button_text_color',
			'--bf-button-border': 'button_border_color',
			'--bf-label-color': 'label_color',
			'--bf-error-color': 'error_color'
		};
		// Controls whose effective default is a hard-coded CSS literal (not a theme/flat
		// value) — e.g. the success/error notices. Mirrors the fallbacks in frontend.css
		// so the swatch previews the real default instead of an empty checkerboard.
		var BF_LITERAL_DEFAULT = {
			'--bf-msg-success-bg': '#ecfdf5',
			'--bf-msg-success-text': '#166534',
			'--bf-msg-success-border-color': '#bbf7d0',
			'--bf-msg-error-bg': '#fef2f2',
			'--bf-msg-error-text': '#b91c1c',
			'--bf-msg-error-border-color': '#fecaca',
			'--bf-error-color': '#dc2626',
			'--bf-ph-color': '#9ca3af',
			'--bf-select-ph': '#9ca3af',
			'--bf-select-search-ph': '#9ca3af',
			'--bf-select-arrow': '#6b7280',
			'--bf-section-title-color': '#0f172a',
			'--bf-section-desc-color': '#6b7280',
			'--bf-file-btn-bg': '#e2e8f0',
			'--bf-file-btn-text': '#334155'
		};
		function bfEffectiveDefault( cssVar ) {
			if ( ! cssVar ) { return ''; }
			var key = BF_FLAT_DEFAULT[ cssVar ];
			if ( key && state.formSettings ) {
				var fromFlat = bfParseColor( String( state.formSettings[ key ] || '' ) ).hex;
				if ( fromFlat ) { return fromFlat; }
			}
			return BF_LITERAL_DEFAULT[ cssVar ] || '';
		}
		// Resolve a colour field's visual: an explicit value wins; otherwise preview the
		// effective default (flat base); otherwise the checkerboard 'no colour' state.
		function bfVisualFor( composed, defVar ) {
			if ( composed ) {
				return { sw: composed, grad: bfAlphaGrad( bfParseColor( composed ).hex ), isDefault: false };
			}
			var defHex = bfEffectiveDefault( defVar );
			if ( defHex ) {
				return { sw: defHex, grad: bfAlphaGrad( defHex ), isDefault: true };
			}
			return { sw: 'transparent', grad: 'linear-gradient(to right, transparent, transparent)', isDefault: false };
		}
		function bfSyncColorSwatch( $cf ) {
			var composed = bfReadColorField( $cf );
			var vis = bfVisualFor( composed, $cf.attr( 'data-def-var' ) || '' );
			$cf.css( '--bf-sw', vis.sw ).css( '--bf-agrad', vis.grad ).toggleClass( 'is-default', vis.isDefault );
			// Reset has nothing to do until an explicit colour is set — disable it otherwise.
			$cf.find( '.bf-adv-color-reset' ).prop( 'disabled', '' === composed );
		}

		function advColorFieldMarkup( hexClass, val, placeholder, defVar ) {
			var parsed = bfParseColor( val );
			var valid = '' !== parsed.hex;
			var op = valid ? parsed.opacity : 100;
			var vis = bfVisualFor( valid ? bfComposeColor( parsed.hex, parsed.opacity ) : '', defVar );
			return '<div class="boldform-color-field boldform-color-field--alpha' + ( vis.isDefault ? ' is-default' : '' ) + '"' + ( defVar ? ' data-def-var="' + escapeHtml( defVar ) + '"' : '' ) + ' style="--bf-sw:' + escapeHtml( vis.sw ) + ';--bf-agrad:' + escapeHtml( vis.grad ) + '">' +
					'<div class="boldform-color-cmain">' +
						'<div class="boldform-color-swatch">' +
							'<input type="color" class="bf-adv-colorpick" value="' + ( valid ? escapeHtml( parsed.hex ) : '#000000' ) + '">' +
						'</div>' +
						'<input type="text" class="bf-adv-input bf-adv-hex ' + hexClass + '" maxlength="7" placeholder="' + escapeHtml( placeholder || advLabel( 'inheritDefault' ) ) + '" value="' + escapeHtml( parsed.hex ) + '" spellcheck="false">' +
						'<button type="button" class="bf-adv-color-reset"' + ( valid ? '' : ' disabled' ) + ' title="' + escapeHtml( advLabel( 'reset' ) ) + '" aria-label="' + escapeHtml( advLabel( 'reset' ) ) + '"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg></button>' +
					'</div>' +
					'<div class="boldform-color-alpha">' +
						'<input type="range" class="bf-adv-opacity" min="0" max="100" step="1" value="' + op + '" title="' + escapeHtml( advLabel( 'opacity' ) ) + '" aria-label="' + escapeHtml( advLabel( 'opacity' ) ) + '">' +
						'<span class="bf-adv-op-val">' + op + '%</span>' +
					'</div>' +
				'</div>';
		}

		function advColor( cssVar, label ) {
			return '<div class="boldform-setting-group boldform-adv-field" data-type="color" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				advColorFieldMarkup( '', advStyleGet( cssVar ), null, cssVar ) +
			'</div>';
		}

		function advSlider( cssVar, label, min, max, units ) {
			units = units || [ 'px' ];
			var raw = advStyleGet( cssVar );
			var num = parseFloat( raw );
			var unit = 'px';
			var m = /[a-z%]+$/i.exec( raw ); if ( m ) { unit = m[0]; }
			var unitCtl;
			if ( units.length > 1 ) {
				unitCtl = '<select class="bf-adv-input bf-adv-unit">' + units.map( function ( u ) {
					return '<option value="' + u + '"' + ( u === unit ? ' selected' : '' ) + '>' + u + '</option>';
				} ).join( '' ) + '</select>';
			} else {
				unitCtl = '<span data-unit="' + escapeHtml( units[0] ) + '">' + escapeHtml( units[0] ) + '</span>';
			}
			return '<div class="boldform-setting-group boldform-adv-field" data-type="slider" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-num" min="' + min + '" max="' + max + '" placeholder="' + escapeHtml( advLabel( 'inheritDefault' ) ) + '" value="' + ( isNaN( num ) ? '' : num ) + '">' + unitCtl + '</div>' +
			'</div>';
		}

		function advDimension( cssVar, label, units ) {
			units = units || [ 'px', 'em', '%' ];
			var raw = advStyleGet( cssVar );
			var parts = raw.split( /\s+/ ).filter( Boolean );
			var unit = 'px';
			var nums = [ '', '', '', '' ];
			if ( parts.length ) {
				var mm = /[a-z%]+$/i.exec( parts[0] ); if ( mm ) { unit = mm[0]; }
				for ( var i = 0; i < 4; i++ ) {
					var p = parts[ i ] != null ? parts[ i ] : parts[ parts.length - 1 ];
					var n = parseFloat( p );
					nums[ i ] = isNaN( n ) ? '' : n;
				}
			}
			var unitOpts = units.map( function ( u ) {
				return '<option value="' + u + '"' + ( u === unit ? ' selected' : '' ) + '>' + u + '</option>';
			} ).join( '' );
			function dimInp( idx, cap ) {
				return '<div class="bf-adv-dim-cell">' +
					'<input type="number" class="bf-adv-input bf-adv-dim" data-side="' + idx + '" placeholder="—" value="' + nums[ idx ] + '">' +
					'<span class="bf-adv-dim-cap">' + escapeHtml( cap ) + '</span>' +
				'</div>';
			}
			// Linked when all four sides are equal — including the default all-empty state,
			// so a fresh control starts linked and one value fills every side. Only diverging
			// side values render it unlinked. Also restores the toggle state on reload.
			var linked = nums[0] === nums[1] && nums[1] === nums[2] && nums[2] === nums[3];
			return '<div class="boldform-setting-group boldform-adv-field' + ( linked ? ' is-linked' : '' ) + '" data-type="dimension" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="boldform-adv-dim">' +
					dimInp( 0, advLabel( 'sideTop' ) ) + dimInp( 1, advLabel( 'sideRight' ) ) + dimInp( 2, advLabel( 'sideBottom' ) ) + dimInp( 3, advLabel( 'sideLeft' ) ) +
					'<select class="bf-adv-input bf-adv-dim-unit">' + unitOpts + '</select>' +
					'<button type="button" class="bf-adv-dim-link' + ( linked ? ' is-active' : '' ) + '" title="' + escapeHtml( advLabel( 'linkSides' ) ) + '"><span class="dashicons dashicons-admin-links"></span></button>' +
				'</div>' +
			'</div>';
		}

		function advBorder( baseVar, label, colorVar ) {
			colorVar = colorVar || ( baseVar + '-color' );
			var w = advStyleGet( baseVar + '-width' ), st = advStyleGet( baseVar + '-style' ), c = advStyleGet( colorVar );
			var wn = parseFloat( w );
			var styles = [ 'solid', 'dashed', 'dotted', 'double', 'none' ];
			var stOpts = '<option value="">' + escapeHtml( advLabel( 'inheritDefault' ) ) + '</option>' + styles.map( function ( s ) {
				return '<option value="' + s + '"' + ( s === st ? ' selected' : '' ) + '>' + s + '</option>';
			} ).join( '' );
			return '<div class="boldform-setting-group boldform-adv-field" data-type="border" data-var="' + baseVar + '" data-colorvar="' + colorVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="boldform-adv-border">' +
					'<div class="bf-adv-bd-cell bf-adv-bd-cell--width">' +
						'<div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-bw" min="0" max="20" placeholder="' + escapeHtml( advLabel( 'inheritDefault' ) ) + '" value="' + ( isNaN( wn ) ? '' : wn ) + '"><span>px</span></div>' +
						'<span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'widthLabel' ) ) + '</span>' +
					'</div>' +
					'<div class="bf-adv-bd-cell bf-adv-bd-cell--style">' +
						'<select class="bf-adv-input bf-adv-bs">' + stOpts + '</select>' +
						'<span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'styleLabel' ) ) + '</span>' +
					'</div>' +
				'</div>' +
				'<div class="bf-adv-bc-row" data-type="color"><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'colorLabel' ) ) + '</span>' + advColorFieldMarkup( 'bf-adv-bc', c, advLabel( 'borderColor' ), colorVar ) + '</div>' +
			'</div>';
		}

		function advTypography( baseVar, label ) {
			var ff = advStyleGet( baseVar + '-ff' ), fs = advStyleGet( baseVar + '-fs' ), fw = advStyleGet( baseVar + '-fw' ),
				lh = advStyleGet( baseVar + '-lh' ), ls = advStyleGet( baseVar + '-ls' ), tt = advStyleGet( baseVar + '-tt' );
			var fsNum = parseFloat( fs ), lsNum = parseFloat( ls );
			var ffKey = '';
			Object.keys( BF_FONT_STACKS ).forEach( function ( k ) { if ( BF_FONT_STACKS[ k ] === ff ) { ffKey = k; } } );
			var ffOpts = '<option value="">' + escapeHtml( advLabel( 'themeFont' ) ) + '</option>' + Object.keys( BF_FONT_STACKS ).map( function ( k ) {
				var name = k.charAt( 0 ).toUpperCase() + k.slice( 1 );
				return '<option value="' + k + '"' + ( k === ffKey ? ' selected' : '' ) + '>' + escapeHtml( name ) + '</option>';
			} ).join( '' );
			var weights = [ '300', '400', '500', '600', '700', '800' ];
			var fwOpts = '<option value="">' + escapeHtml( advLabel( 'inheritDefault' ) ) + '</option>' + weights.map( function ( wv ) {
				return '<option value="' + wv + '"' + ( wv === fw ? ' selected' : '' ) + '>' + wv + '</option>';
			} ).join( '' );
			var transforms = [ [ 'none', 'none' ], [ 'uppercase', advLabel( 'uppercase' ) ], [ 'lowercase', advLabel( 'lowercase' ) ], [ 'capitalize', advLabel( 'capitalize' ) ] ];
			var ttOpts = '<option value="">' + escapeHtml( advLabel( 'inheritDefault' ) ) + '</option>' + transforms.map( function ( t ) {
				return '<option value="' + t[0] + '"' + ( t[0] === tt ? ' selected' : '' ) + '>' + escapeHtml( t[1] ) + '</option>';
			} ).join( '' );
			return '<div class="boldform-setting-group boldform-adv-field boldform-adv-typo" data-type="typography" data-var="' + baseVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="boldform-adv-typo-grid">' +
					'<div class="bf-adv-typo-cell bf-adv-typo-cell--full"><select class="bf-adv-input bf-adv-ff">' + ffOpts + '</select><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'fontFamily' ) ) + '</span></div>' +
					'<div class="bf-adv-typo-cell"><div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-fs" min="8" max="80" placeholder="' + escapeHtml( advLabel( 'inheritDefault' ) ) + '" value="' + ( isNaN( fsNum ) ? '' : fsNum ) + '"><span>px</span></div><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'fontSize' ) ) + '</span></div>' +
					'<div class="bf-adv-typo-cell"><select class="bf-adv-input bf-adv-fw">' + fwOpts + '</select><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'fontWeight' ) ) + '</span></div>' +
					'<div class="bf-adv-typo-cell"><div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-lh" min="0" max="100" step="1" placeholder="' + escapeHtml( advLabel( 'inheritDefault' ) ) + '" value="' + ( lh === '' ? '' : parseFloat( lh ) ) + '"><span>px</span></div><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'lineHeight' ) ) + '</span></div>' +
					'<div class="bf-adv-typo-cell"><div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-ls" min="-5" max="20" step="0.1" placeholder="' + escapeHtml( advLabel( 'inheritDefault' ) ) + '" value="' + ( isNaN( lsNum ) ? '' : lsNum ) + '"><span>px</span></div><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'letterSpacing' ) ) + '</span></div>' +
					'<div class="bf-adv-typo-cell bf-adv-typo-cell--full"><select class="bf-adv-input bf-adv-tt">' + ttOpts + '</select><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'textTransform' ) ) + '</span></div>' +
				'</div>' +
			'</div>';
		}

		function shadowBodyMarkup( cssVar ) {
			var raw = advStyleGet( cssVar );
			var inset = /(^|\s)inset(\s|$)/.test( raw );
			var nums = ( raw.replace( 'inset', '' ).match( /-?\d+(\.\d+)?px/g ) || [] ).map( parseFloat );
			// Colour may be hex (#rrggbb / #rrggbbaa) or rgb()/rgba() — bfComposeColor emits
			// rgba() whenever opacity < 100%, so parse every form back (not just hex),
			// otherwise a translucent shadow colour is lost on reload.
			var colMatch = raw.match( /#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|rgba?\([^)]*\)/i );
			var col = colMatch ? colMatch[0] : '';
			function sInp( cls, cap, v ) {
				// Caption (not placeholder) so the field name stays visible once a value is
				// entered — a bare placeholder vanishes and leaves four anonymous px boxes.
				return '<div class="bf-adv-shadow-cell">' +
					'<div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input ' + cls + '" placeholder="0" value="' + ( isNaN( v ) || v == null ? '' : v ) + '"><span>px</span></div>' +
					'<span class="bf-adv-dim-cap">' + escapeHtml( cap ) + '</span>' +
				'</div>';
			}
			return '<div class="boldform-adv-shadow-grid">' +
				sInp( 'bf-adv-sx', advLabel( 'shadowX' ), nums[0] ) +
				sInp( 'bf-adv-sy', advLabel( 'shadowY' ), nums[1] ) +
				sInp( 'bf-adv-sblur', advLabel( 'shadowBlur' ), nums[2] ) +
				sInp( 'bf-adv-sspread', advLabel( 'shadowSpread' ), nums[3] ) +
			'</div>' +
			'<div class="boldform-adv-shadow-foot">' +
				'<div class="bf-adv-sc-row" data-type="color"><span class="bf-adv-dim-cap">' + escapeHtml( advLabel( 'colorLabel' ) ) + '</span>' + advColorFieldMarkup( 'bf-adv-sc', col, advLabel( 'shadowColor' ) ) + '</div>' +
				'<label class="bf-adv-inset-lbl"><input type="checkbox" class="bf-adv-input bf-adv-inset"' + ( inset ? ' checked' : '' ) + '> ' + escapeHtml( advLabel( 'inset' ) ) + '</label>' +
			'</div>';
		}

		function advShadow( cssVar, label, states ) {
			var hasStates = states && states.length > 1;
			var activeVar = hasStates ? states[0][0] : cssVar;
			var tabs = '';
			if ( hasStates ) {
				tabs = '<div class="boldform-adv-bg-tabs boldform-adv-shadow-tabs">' + states.map( function ( st, i ) {
					return '<button type="button" class="bf-adv-bgtype bf-adv-shadow-tab' + ( 0 === i ? ' is-active' : '' ) + '" data-shadow-var="' + st[0] + '">' + escapeHtml( advLabel( st[1] ) ) + '</button>';
				} ).join( '' ) + '</div>';
			}
			return '<div class="boldform-setting-group boldform-adv-field boldform-adv-shadow" data-type="shadow" data-var="' + activeVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				tabs +
				'<div class="bf-adv-shadow-body">' + shadowBodyMarkup( activeVar ) + '</div>' +
			'</div>';
		}

		function advBackground( cssVar, label ) {
			var raw = advStyleGet( cssVar );
			var isGrad = /gradient/i.test( raw );
			var c1 = '', c2 = '', angle = 135, solid = '';
			if ( isGrad ) {
				// Match hex8/hex6/rgba so opacity-bearing gradient stops restore on reload.
				var cols = raw.match( /#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|rgba?\([^)]*\)/gi ) || [];
				c1 = cols[0] || ''; c2 = cols[1] || '';
				var am = raw.match( /(-?\d+)deg/ ); if ( am ) { angle = parseInt( am[1], 10 ); }
			} else {
				// Pass the raw colour (hex/hex8/rgba); advColorFieldMarkup parses opacity,
				// so a solid background set with <100% alpha survives a reload too.
				solid = raw;
			}
			return '<div class="boldform-setting-group boldform-adv-field boldform-adv-bg" data-type="background" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="boldform-adv-bg-tabs">' +
					'<button type="button" class="bf-adv-bgtype' + ( ! isGrad ? ' is-active' : '' ) + '" data-bg="solid">' + escapeHtml( advLabel( 'solidFill' ) ) + '</button>' +
					'<button type="button" class="bf-adv-bgtype' + ( isGrad ? ' is-active' : '' ) + '" data-bg="gradient">' + escapeHtml( advLabel( 'gradient' ) ) + '</button>' +
				'</div>' +
				'<div class="bf-adv-bg-solid"' + ( isGrad ? ' hidden' : '' ) + ' data-type="color">' + advColorFieldMarkup( 'bf-adv-bg-c', solid, null, cssVar ) + '</div>' +
				'<div class="bf-adv-bg-grad"' + ( ! isGrad ? ' hidden' : '' ) + '>' +
					'<div class="bf-adv-bg-stop" data-type="color"><span class="bf-adv-bg-cap">' + escapeHtml( advLabel( 'colorStop1' ) ) + '</span>' + advColorFieldMarkup( 'bf-adv-bg-c1', c1 ) + '</div>' +
					'<div class="bf-adv-bg-stop" data-type="color"><span class="bf-adv-bg-cap">' + escapeHtml( advLabel( 'colorStop2' ) ) + '</span>' + advColorFieldMarkup( 'bf-adv-bg-c2', c2 ) + '</div>' +
					'<div class="bf-adv-bg-stop"><span class="bf-adv-bg-cap">' + escapeHtml( advLabel( 'angle' ) ) + '</span><div class="boldform-style-input-wrap"><input type="number" class="bf-adv-input bf-adv-bg-angle" min="0" max="360" value="' + angle + '"><span>deg</span></div></div>' +
				'</div>' +
			'</div>';
		}

		function advSelectCtl( cssVar, label, options ) {
			var cur = advStyleGet( cssVar );
			var opts = '<option value="">' + escapeHtml( advLabel( 'inheritDefault' ) ) + '</option>' + options.map( function ( o ) {
				return '<option value="' + escapeHtml( o[0] ) + '"' + ( o[0] === cur ? ' selected' : '' ) + '>' + escapeHtml( o[1] ) + '</option>';
			} ).join( '' );
			return '<div class="boldform-setting-group boldform-adv-field" data-type="select" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<select class="bf-adv-input bf-adv-select">' + opts + '</select>' +
			'</div>';
		}

		function advSwitch( cssVar, label, onValue ) {
			var on = '' !== advStyleGet( cssVar );
			return '<div class="boldform-setting-group boldform-adv-field boldform-adv-switch" data-type="switch" data-var="' + cssVar + '" data-on="' + escapeHtml( onValue ) + '">' +
				'<label class="bf-adv-switch-lbl"><input type="checkbox" class="bf-adv-input bf-adv-toggle"' + ( on ? ' checked' : '' ) + '> ' + escapeHtml( label ) + '</label>' +
			'</div>';
		}

		// Segmented Normal/Hover/Focus switcher: one panel of controls visible at a
		// time, so each state's colours are grouped and discoverable instead of a flat
		// list of "Hover …"/"Focus …" labels. Inner controls are ordinary advControls,
		// so their handlers/recompute work unchanged whether shown or hidden.
		function advStateTabs( group ) {
			var states = group.states || [];
			var tabs = '<div class="boldform-adv-state-tabs">' + states.map( function ( s, i ) {
				return '<button type="button" class="bf-adv-state-tab' + ( 0 === i ? ' is-active' : '' ) + '" data-state="' + escapeHtml( s.key ) + '">' + escapeHtml( advLabel( s.label ) ) + '</button>';
			} ).join( '' ) + '</div>';
			var panels = states.map( function ( s, i ) {
				var inner = ( s.controls || [] ).map( advControl ).join( '' );
				return '<div class="bf-adv-state-panel"' + ( 0 === i ? '' : ' hidden' ) + ' data-state="' + escapeHtml( s.key ) + '"><div class="boldform-adv-grid">' + inner + '</div></div>';
			} ).join( '' );
			return '<div class="boldform-adv-statetabs">' +
				( group.label ? '<label>' + escapeHtml( advLabel( group.label ) ) + '</label>' : '' ) +
				tabs + panels +
			'</div>';
		}

		// Icon-segmented horizontal alignment (left / center / right / full width) for
		// the form container. Stores the keyword in `cssVar` so the active button
		// restores on reload; recomputeAdvField derives the margin/width vars the CSS uses.
		function advAlign( cssVar, label ) {
			var cur = advStyleGet( cssVar ) || 'left';
			var svg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">';
			var icons = {
				left:    svg + '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="14" y2="12"></line><line x1="3" y1="18" x2="18" y2="18"></line></svg>',
				center:  svg + '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="5" y1="18" x2="19" y2="18"></line></svg>',
				right:   svg + '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="6" y1="18" x2="21" y2="18"></line></svg>',
				justify: svg + '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>'
			};
			var btns = [ 'left', 'center', 'right', 'justify' ].map( function ( k ) {
				var t = escapeHtml( advLabel( 'align' + k.charAt( 0 ).toUpperCase() + k.slice( 1 ) ) );
				return '<button type="button" class="bf-adv-align-btn' + ( k === cur ? ' is-active' : '' ) + '" data-align="' + k + '" title="' + t + '" aria-label="' + t + '">' + icons[ k ] + '</button>';
			} ).join( '' );
			return '<div class="boldform-setting-group boldform-adv-field" data-type="align" data-var="' + cssVar + '">' +
				'<label>' + escapeHtml( label ) + '</label>' +
				'<div class="bf-adv-align">' + btns + '</div>' +
			'</div>';
		}

		// Max Width and the "Full Width" (justify) alignment are mutually exclusive:
		// full width forces 100% and ignores any max-width. When justify is active,
		// disable the Max Width control so the relationship is clear; re-enable it
		// for left/center/right. Runs on render and after every alignment change.
		function bfSyncFormMaxWidthState() {
			var av = $( '[data-var="--bf-form-align"] .bf-adv-align-btn.is-active' ).data( 'align' ) || '';
			var disabled = ( 'justify' === av );
			var $mw = $( '[data-var="--bf-form-max-width"]' );
			$mw.toggleClass( 'is-disabled', disabled );
			$mw.find( 'input, select' ).prop( 'disabled', disabled );
		}

		function advControl( c ) {
			switch ( c.type ) {
				case 'color':      return advColor( c.var, advLabel( c.label ) );
				case 'slider':     return advSlider( c.var, advLabel( c.label ), c.min, c.max, c.units );
				case 'dimension':  return advDimension( c.var, advLabel( c.label ), c.units );
				case 'border':     return advBorder( c.var, advLabel( c.label ), c.colorVar );
				case 'typography': return advTypography( c.var, advLabel( c.label ) );
				case 'shadow':     return advShadow( c.var, advLabel( c.label ), c.states );
				case 'background': return advBackground( c.var, advLabel( c.label ) );
				case 'select':     return advSelectCtl( c.var, advLabel( c.label ), c.options );
				case 'switch':     return advSwitch( c.var, advLabel( c.label ), c.on );
				case 'align':      return advAlign( c.var, advLabel( c.label ) );
				case 'stateTabs':  return advStateTabs( c );
				case 'heading':    return '<div class="boldform-adv-subhead">' + escapeHtml( advLabel( c.label ) ) + '</div>';
			}
			return '';
		}

		// The full control catalog. Sections are appended after the legacy
		// Design Theme / Field / Label / Button sections. Phases add sections here.
		function bfStyleSchema() {
			// Display order of the Style-tab sections: foundation (container, layout)
			// → field anatomy (labels, inputs, placeholder) → field types (select,
			// choice, star, file, terms) → structure (section break) → action (submit)
			// → messages. Reorder by editing this id list; the definitions stay put.
			var bfSectionOrder = [ 'container', 'layout', 'labels', 'placeholder', 'inputs', 'select', 'choice', 'file', 'terms', 'section', 'button', 'error', 'success' ];
			var bfSections = [
				{ id: 'container', title: advLabel( 'secContainer' ), controls: [
					{ type: 'slider', var: '--bf-form-max-width', label: 'maxWidth', min: 0, max: 1400, units: [ 'px', '%' ] },
						{ type: 'align', var: '--bf-form-align', label: 'alignment' },
					{ type: 'dimension', var: '--bf-form-padding', label: 'padding' },
					{ type: 'background', var: '--bf-form-bg', label: 'background' },
					{ type: 'border', var: '--bf-form-border', label: 'border' },
					{ type: 'dimension', var: '--bf-form-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'shadow', var: '--bf-form-shadow', label: 'boxShadow', states: [ [ '--bf-form-shadow', 'stateNormal' ], [ '--bf-form-shadow-hover', 'stateHover' ] ] }
				] },
				{ id: 'layout', title: advLabel( 'secLayout' ), controls: [
					{ type: 'slider', var: '--bf-row-gap', label: 'rowGap', min: 0, max: 100, units: [ 'px', 'em' ] },
					{ type: 'slider', var: '--bf-col-gap', label: 'columnGap', min: 0, max: 80, units: [ 'px' ] },
					{ type: 'dimension', var: '--bf-field-margin', label: 'fieldMargin' },
					{ type: 'dimension', var: '--bf-input-margin', label: 'inputMargin' },
						{ type: 'slider', var: '--bf-subfield-gap', label: 'subfieldGap', min: 0, max: 60, units: [ 'px', 'em' ] }
				] },
				{ id: 'labels', title: advLabel( 'secLabels' ), controls: [
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'color', var: '--bf-label-color', label: 'labelColor' },
							{ type: 'color', var: '--bf-sublabel-color', label: 'subLabelColor' }
						] },
						{ key: 'focus', label: 'stateFocus', controls: [
							{ type: 'color', var: '--bf-label-focus-color', label: 'labelColor' },
							{ type: 'color', var: '--bf-sublabel-focus-color', label: 'subLabelColor' }
						] }
					] },
					{ type: 'typography', var: '--bf-label', label: 'typography' },
					{ type: 'dimension', var: '--bf-label-margin', label: 'margin' },
					{ type: 'color', var: '--bf-required-color', label: 'requiredColor' },
					{ type: 'heading', label: 'subLabel' },
					{ type: 'typography', var: '--bf-sublabel', label: 'typography' }
				] },
				{ id: 'inputs', title: advLabel( 'secInputs' ), controls: [
					{ type: 'slider', var: '--bf-field-height', label: 'height', min: 24, max: 90, units: [ 'px' ] },
					{ type: 'slider', var: '--bf-textarea-height', label: 'textareaHeight', min: 40, max: 400, units: [ 'px' ] },
					{ type: 'dimension', var: '--bf-field-padding', label: 'padding' },
					{ type: 'typography', var: '--bf-field', label: 'typography' },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'background', var: '--bf-field-bg', label: 'background' },
							{ type: 'color', var: '--bf-field-text', label: 'textColor' },
							{ type: 'border', var: '--bf-field-border', colorVar: '--bf-field-border', label: 'border' },
							{ type: 'shadow', var: '--bf-field-shadow', label: 'boxShadow' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'background', var: '--bf-field-hover-bg', label: 'background' },
							{ type: 'color', var: '--bf-field-hover-text', label: 'textColor' },
							{ type: 'border', var: '--bf-field-hover-border', colorVar: '--bf-field-hover-border', label: 'border' },
							{ type: 'shadow', var: '--bf-field-hover-shadow', label: 'boxShadow' }
						] },
						{ key: 'focus', label: 'stateFocus', controls: [
							{ type: 'background', var: '--bf-field-focus-bg', label: 'background' },
							{ type: 'color', var: '--bf-field-focus-text', label: 'textColor' },
							{ type: 'border', var: '--bf-field-focus-border', colorVar: '--bf-field-focus-border', label: 'border' },
							{ type: 'shadow', var: '--bf-field-focus-shadow', label: 'boxShadow' }
						] }
					] },
					{ type: 'dimension', var: '--bf-field-radius', label: 'borderRadius', units: [ 'px', '%' ] }
				] },
				{ id: 'button', title: advLabel( 'secButton' ), controls: [
					{ type: 'switch', var: '--bf-btn-width', label: 'fullWidth', on: '100%' },
					{ type: 'dimension', var: '--bf-button-padding', label: 'padding' },
					{ type: 'typography', var: '--bf-btn', label: 'typography' },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'background', var: '--bf-button-bg', label: 'background' },
							{ type: 'color', var: '--bf-button-text', label: 'textColor' },
							{ type: 'border', var: '--bf-button-border', colorVar: '--bf-button-border', label: 'border' },
							{ type: 'shadow', var: '--bf-button-shadow', label: 'boxShadow' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'background', var: '--bf-btn-hover-bg', label: 'background' },
							{ type: 'color', var: '--bf-btn-hover-text', label: 'textColor' },
							{ type: 'border', var: '--bf-btn-hover-border', colorVar: '--bf-btn-hover-border', label: 'border' },
							{ type: 'shadow', var: '--bf-button-hover-shadow', label: 'boxShadow' }
						] }
					] },
					{ type: 'dimension', var: '--bf-button-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'color', var: '--bf-btn-icon-color', label: 'iconColor' },
					{ type: 'dimension', var: '--bf-btn-margin', label: 'buttonMargin' },
					{ type: 'dimension', var: '--bf-actions-margin', label: 'containerMargin' }
				] },
				{ id: 'choice', title: advLabel( 'secChoice' ), controls: [
					{ type: 'slider', var: '--bf-choice-size', label: 'size', min: 12, max: 32, units: [ 'px' ] },
					{ type: 'color', var: '--bf-choice-color', label: 'labelColor' },
					{ type: 'typography', var: '--bf-choice', label: 'typography' },
					{ type: 'slider', var: '--bf-choice-gap', label: 'spacing', min: 0, max: 32, units: [ 'px' ] },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'color', var: '--bf-choice-border', label: 'borderColor' },
							{ type: 'background', var: '--bf-choice-bg', label: 'background' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'color', var: '--bf-choice-hover-border', label: 'borderColor' },
							{ type: 'background', var: '--bf-choice-hover-bg', label: 'background' }
						] },
						{ key: 'checked', label: 'stateChecked', controls: [
							{ type: 'color', var: '--bf-choice-accent', label: 'accentColor' },
							{ type: 'color', var: '--bf-choice-icon', label: 'iconColor' }
						] }
					] }
				] },
				{ id: 'terms', title: advLabel( 'secTerms' ), controls: [
					{ type: 'color', var: '--bf-terms-color', label: 'textColor' },
					{ type: 'stateTabs', label: 'linkColor', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'color', var: '--bf-terms-link', label: 'linkColor' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'color', var: '--bf-terms-link-hover', label: 'linkColor' }
						] }
					] },
					{ type: 'typography', var: '--bf-terms', label: 'typography' },
					{ type: 'typography', var: '--bf-terms-copy', label: 'copyText' },
					{ type: 'heading', label: 'secChoice' },
					{ type: 'slider', var: '--bf-terms-box-size', label: 'size', min: 12, max: 32, units: [ 'px' ] },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'color', var: '--bf-terms-box-border', label: 'borderColor' },
							{ type: 'background', var: '--bf-terms-box-bg', label: 'background' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'color', var: '--bf-terms-box-hover-border', label: 'borderColor' },
							{ type: 'background', var: '--bf-terms-box-hover-bg', label: 'background' }
						] },
						{ key: 'checked', label: 'stateChecked', controls: [
							{ type: 'color', var: '--bf-terms-box-checked', label: 'checkedColor' },
							{ type: 'color', var: '--bf-terms-box-icon', label: 'iconColor' }
						] }
					] },
					{ type: 'slider', var: '--bf-terms-box-border-width', label: 'borderWidth', min: 1, max: 5, units: [ 'px' ] },
					{ type: 'slider', var: '--bf-terms-box-radius', label: 'borderRadius', min: 0, max: 12, units: [ 'px' ] },
					{ type: 'slider', var: '--bf-terms-gap', label: 'gap', min: 0, max: 30, units: [ 'px' ] },
					{ type: 'dimension', var: '--bf-terms-margin', label: 'margin' }
				] },
				{ id: 'file', title: advLabel( 'secFile' ), controls: [
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'background', var: '--bf-file-btn-bg', label: 'background' },
							{ type: 'color', var: '--bf-file-btn-text', label: 'textColor' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'background', var: '--bf-file-btn-hover-bg', label: 'background' },
							{ type: 'color', var: '--bf-file-btn-hover-text', label: 'textColor' }
						] }
					] }
				] },
				{ id: 'section', title: advLabel( 'secSection' ), controls: [
					{ type: 'dimension', var: '--bf-section-margin', label: 'margin' },
					{ type: 'dimension', var: '--bf-section-padding', label: 'padding' },
					{ type: 'border', var: '--bf-section-border', label: 'border' },
					{ type: 'dimension', var: '--bf-section-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'heading', label: 'titleColor' },
					{ type: 'color', var: '--bf-section-title-color', label: 'titleColor' },
					{ type: 'typography', var: '--bf-section-title', label: 'typography' },
					{ type: 'dimension', var: '--bf-section-title-margin', label: 'margin' },
					{ type: 'heading', label: 'descColor' },
					{ type: 'color', var: '--bf-section-desc-color', label: 'descColor' },
					{ type: 'typography', var: '--bf-section-desc', label: 'typography' },
					{ type: 'dimension', var: '--bf-section-desc-margin', label: 'margin' }
				] },
				{ id: 'select', title: advLabel( 'secSelect' ), controls: [
					{ type: 'color', var: '--bf-select-ph', label: 'placeholderColor' },
					{ type: 'color', var: '--bf-select-arrow', label: 'arrowColor' },
					{ type: 'typography', var: '--bf-select', label: 'typography' },
					{ type: 'dimension', var: '--bf-select-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'dimension', var: '--bf-select-padding', label: 'padding' },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'background', var: '--bf-select-bg', label: 'background' },
							{ type: 'color', var: '--bf-select-text', label: 'textColor' },
							{ type: 'border', var: '--bf-select-border', label: 'border' },
							{ type: 'shadow', var: '--bf-select-shadow', label: 'boxShadow' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'color', var: '--bf-select-hover-border', label: 'borderColor' }
						] },
						{ key: 'focus', label: 'stateFocus', controls: [
							{ type: 'color', var: '--bf-select-focus-border', label: 'borderColor' },
							{ type: 'background', var: '--bf-select-focus-bg', label: 'background' },
							{ type: 'color', var: '--bf-select-focus-ring', label: 'ringColor' }
						] }
					] },
					{ type: 'heading', label: 'panelBg' },
					{ type: 'background', var: '--bf-select-panel-bg', label: 'panelBg' },
					{ type: 'color', var: '--bf-select-panel-border', label: 'panelBorder' },
					{ type: 'dimension', var: '--bf-select-panel-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'shadow', var: '--bf-select-panel-shadow', label: 'boxShadow' },
					{ type: 'heading', label: 'searchBox' },
					{ type: 'background', var: '--bf-select-search-bg', label: 'searchBg' },
					{ type: 'color', var: '--bf-select-search-text', label: 'searchText' },
					{ type: 'color', var: '--bf-select-search-ph', label: 'searchPh' },
					{ type: 'heading', label: 'optionText' },
					{ type: 'typography', var: '--bf-select-opt', label: 'typography' },
					{ type: 'color', var: '--bf-select-check', label: 'accentColor' },
					{ type: 'stateTabs', label: 'states', states: [
						{ key: 'normal', label: 'stateNormal', controls: [
							{ type: 'color', var: '--bf-select-opt-bg', label: 'background' },
							{ type: 'color', var: '--bf-select-opt-color', label: 'textColor' }
						] },
						{ key: 'hover', label: 'stateHover', controls: [
							{ type: 'color', var: '--bf-select-opt-hover-bg', label: 'background' },
							{ type: 'color', var: '--bf-select-opt-hover-color', label: 'textColor' }
						] },
						{ key: 'selected', label: 'stateSelected', controls: [
							{ type: 'color', var: '--bf-select-opt-active-bg', label: 'background' },
							{ type: 'color', var: '--bf-select-opt-active-color', label: 'textColor' }
						] }
					] }
				] },
				{ id: 'placeholder', title: advLabel( 'secPlaceholder' ), controls: [
					{ type: 'color', var: '--bf-ph-color', label: 'placeholderColor' },
					{ type: 'typography', var: '--bf-ph', label: 'typography' }
				] },
				{ id: 'error', title: advLabel( 'secError' ), controls: [
					{ type: 'color', var: '--bf-error-color', label: 'textColor' },
					{ type: 'typography', var: '--bf-error', label: 'typography' },
					{ type: 'heading', label: 'noticeBg' },
					{ type: 'background', var: '--bf-msg-error-bg', label: 'noticeBg' },
					{ type: 'color', var: '--bf-msg-error-text', label: 'noticeText' },
					{ type: 'dimension', var: '--bf-msg-error-padding', label: 'padding' },
						{ type: 'dimension', var: '--bf-msg-error-margin', label: 'margin' },
					{ type: 'border', var: '--bf-msg-error-border', label: 'border' },
					{ type: 'dimension', var: '--bf-msg-error-radius', label: 'borderRadius', units: [ 'px', '%' ] }
				] },
				{ id: 'success', title: advLabel( 'secSuccess' ), controls: [
					{ type: 'background', var: '--bf-msg-success-bg', label: 'noticeBg' },
					{ type: 'color', var: '--bf-msg-success-text', label: 'noticeText' },
					{ type: 'typography', var: '--bf-msg-success', label: 'typography' },
					{ type: 'dimension', var: '--bf-msg-success-padding', label: 'padding' },
						{ type: 'dimension', var: '--bf-msg-success-margin', label: 'margin' },
					{ type: 'border', var: '--bf-msg-success-border', label: 'border' },
					{ type: 'dimension', var: '--bf-msg-success-radius', label: 'borderRadius', units: [ 'px', '%' ] },
					{ type: 'shadow', var: '--bf-msg-success-shadow', label: 'boxShadow' }
				] }
			];
			bfSections.sort( function ( a, b ) {
				return bfSectionOrder.indexOf( a.id ) - bfSectionOrder.indexOf( b.id );
			} );
			return bfSections;
		}

		// Every --bf-* var a section's controls write, expanded across composite types
		// (border → -width/-style/-color, typography → -ff/-fs/…, shadow → each state).
		function bfSectionVars( sec ) {
			var vars = [];
			function expand( c ) {
				if ( 'stateTabs' === c.type && c.states ) {
					// Recurse into each state panel's controls.
					c.states.forEach( function ( s ) { ( s.controls || [] ).forEach( expand ); } );
					return;
				}
				if ( ! c.var ) { return; }
				if ( 'border' === c.type ) {
					vars.push( c.var + '-width', c.var + '-style', c.colorVar || ( c.var + '-color' ) );
				} else if ( 'typography' === c.type ) {
					[ '-ff', '-fs', '-fw', '-lh', '-ls', '-tt' ].forEach( function ( sfx ) { vars.push( c.var + sfx ); } );
				} else if ( 'shadow' === c.type && c.states && c.states.length ) {
					c.states.forEach( function ( st ) { vars.push( st[0] ); } );
				} else if ( 'align' === c.type ) {
					// The align control also derives margin-left/right + a max-width override.
					var ab = c.var.replace( /-align$/, '' );
					vars.push( c.var, ab + '-ml', ab + '-mr', ab + '-mw' );
				} else {
					vars.push( c.var );
				}
			}
			( sec.controls || [] ).forEach( expand );
			return vars;
		}

		// Every schema var that carries a COLOUR, as { name, label } — the set a
		// Design Theme is entitled to reclaim.
		//
		// Why this exists: the colour fallback chain is
		//   var(--bf-choice-accent, var(--bf-button-bg, var(--bf-focus-color, …)))
		// and a Design Theme only writes position 2 (--bf-button-bg, via the legacy
		// button_background_color key). An explicit style-layer value in position 1
		// therefore outranks the theme permanently, so switching themes appears to do
		// nothing for that control. Clearing these lets the theme's value through.
		//
		// Deliberately EXCLUDES:
		//  - 'shadow' — its var holds a composite "x y blur spread colour", so clearing
		//    one would discard geometry the user tuned, not just a colour.
		//  - border -width / -style — only the colour half of a border control is taken.
		//  - typography / slider / dimension / align / switch — not colours.
		// Memoized: the schema and its labels are static for the life of the page, and
		// this is walked on every colour edit via bfRefreshResetStates().
		var bfThemeColorVarsCache = null;
		function bfThemeColorVars() {
			if ( bfThemeColorVarsCache ) { return bfThemeColorVarsCache; }
			var out = [];
			bfStyleSchema().forEach( function ( sec ) {
				function expand( c ) {
					if ( 'stateTabs' === c.type && c.states ) {
						c.states.forEach( function ( s ) { ( s.controls || [] ).forEach( expand ); } );
						return;
					}
					if ( ! c.var ) { return; }
					var name = null;
					if ( 'color' === c.type || 'background' === c.type ) {
						name = c.var;
					} else if ( 'border' === c.type ) {
						name = c.colorVar || ( c.var + '-color' );
					}
					if ( ! name ) { return; }
					out.push( { name: name, label: sec.title + ' · ' + advLabel( c.label ) } );
				}
				( sec.controls || [] ).forEach( expand );
			} );
			bfThemeColorVarsCache = out;
			return out;
		}

		// Non-empty colour overrides across EVERY device layer (not just the active
		// one) — a tablet-only override would otherwise silently survive a theme
		// switch and reappear at that breakpoint. Deduped by var name so one entry
		// is reported per colour regardless of how many breakpoints carry it.
		function bfThemeColorConflicts() {
			var style = state.formSettings.style || {};
			var seen = {}, out = [];
			bfThemeColorVars().forEach( function ( v ) {
				Object.keys( style ).forEach( function ( device ) {
					var layer = style[ device ] || {};
					var val = layer[ v.name ];
					if ( 'string' !== typeof val || '' === val || seen[ v.name ] ) { return; }
					seen[ v.name ] = true;
					out.push( { name: v.name, label: v.label, value: val } );
				} );
			} );
			return out;
		}

		// Drop every colour override from all three device layers so the freshly
		// applied theme is what actually renders.
		function bfClearThemeColorOverrides() {
			var style = state.formSettings.style || {};
			var names = bfThemeColorVars().map( function ( v ) { return v.name; } );
			Object.keys( style ).forEach( function ( device ) {
				var layer = style[ device ];
				if ( ! layer ) { return; }
				names.forEach( function ( n ) { delete layer[ n ]; } );
			} );
		}

		// True when the active device layer holds any non-empty value for this
		// section's vars — i.e. there is something for its reset button to clear.
		function bfSectionHasValues( sec ) {
			var layer = ( state.formSettings.style && state.formSettings.style[ state.activeDevice ] ) || {};
			return bfSectionVars( sec ).some( function ( v ) {
				return typeof layer[ v ] === 'string' && '' !== layer[ v ];
			} );
		}

		// Enable a section's reset button only when it has something to reset;
		// otherwise show it greyed + non-clickable. Covers every schema section plus
		// the Design Theme card (changed = a theme other than the default is active).
		function bfRefreshResetStates() {
			bfStyleSchema().forEach( function ( sec ) {
				var has = bfSectionHasValues( sec );
				$( '.boldform-style-section__reset[data-reset-section="' + sec.id + '"]' )
					.toggleClass( 'is-disabled', ! has )
					.prop( 'disabled', ! has )
					.attr( 'aria-disabled', has ? 'false' : 'true' );
			} );
			// Enabled when the active theme differs from the default, OR when colour
			// overrides are currently outranking the theme — otherwise a form sitting
			// on Default Blue with stale overrides would have no way to reclaim them.
			var themeChanged = ( !! state.formSettings.design_theme && 'default-blue' !== state.formSettings.design_theme ) ||
				bfThemeColorConflicts().length > 0;
			$( '.boldform-theme-reset' )
				.toggleClass( 'is-disabled', ! themeChanged )
				.prop( 'disabled', ! themeChanged )
				.attr( 'aria-disabled', themeChanged ? 'false' : 'true' );
		}

		// Within each heading-delimited segment of a section, render the non-state
		// controls first and the Normal/Hover/… state-tab groups last, so the tabs
		// never sit above unrelated non-state controls (which made those read as
		// state-specific and confused users). Headings start a new segment, so
		// sub-grouped sections (Select's panel/options groups, Terms' link vs
		// checkbox groups) keep their internal structure.
		function bfOrderControls( controls ) {
			var out = [], seg = [];
			function flush() {
				var rest = [], tabs = [];
				seg.forEach( function ( c ) { ( 'stateTabs' === c.type ? tabs : rest ).push( c ); } );
				out = out.concat( rest, tabs );
				seg = [];
			}
			( controls || [] ).forEach( function ( c ) {
				if ( 'heading' === c.type ) { flush(); }
				seg.push( c );
			} );
			flush();
			return out;
		}

		function renderAdvancedStyleSections() {
			var html = '';
			var resetSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>';
			bfStyleSchema().forEach( function ( sec ) {
				var body = '';
				bfOrderControls( sec.controls ).forEach( function ( c ) { body += advControl( c ); } );
				var rLabel = escapeHtml( advLabel( 'resetSection' ) );
				html += '<div class="boldform-style-section" data-adv-section="' + sec.id + '">' +
					'<div class="boldform-style-section__head"><h3>' + escapeHtml( sec.title ) + '</h3>' +
						'<div class="boldform-style-section__head-actions">' +
							'<button type="button" class="boldform-style-section__reset" data-reset-section="' + sec.id + '" title="' + rLabel + '" aria-label="' + rLabel + '">' + resetSvg + '</button>' +
							'<span class="dashicons dashicons-arrow-down-alt2"></span>' +
						'</div>' +
					'</div>' +
					'<div class="boldform-style-section__body"><div class="boldform-adv-grid">' + body + '</div></div>' +
				'</div>';
			} );
			return html;
		}

		// Render a live, read-only mirror of the form on the Style tab so styling
		// changes preview instantly. Reuses the canvas field structure
		// (.boldform-canvas ancestor + .boldform-canvas-field > -field-body) so the
		// same --bf-* variable styling applies, minus the editing chrome.
		// Sample state previews appended below the form: messages, an open dropdown and a
		// file button only appear on submit / interaction, so they can't render from the
		// live form alone — these labelled samples let their --bf-* styles preview too.
		function bfPreviewStatesMarkup() {
			var chk = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
			var caret = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
			return '<div class="boldform-preview-states" aria-hidden="true">' +
				'<div class="boldform-preview-states__cap">' + escapeHtml( advLabel( 'previewStates' ) ) + '</div>' +
				'<div class="boldform-lite-form__message is-success is-visible">' + escapeHtml( advLabel( 'sampleSuccess' ) ) + '</div>' +
				'<div class="boldform-lite-form__message is-error is-visible">' + escapeHtml( advLabel( 'sampleError' ) ) + '</div>' +
				'<div class="boldform-preview-states__field bf-state-invalid">' +
					'<label>' + escapeHtml( advLabel( 'sampleFieldLabel' ) ) + '</label>' +
					'<input type="text" value="' + escapeHtml( advLabel( 'sampleValue' ) ) + '" readonly>' +
					'<div class="boldform-lite-form__field-error">' + escapeHtml( advLabel( 'sampleRequired' ) ) + '</div>' +
				'</div>' +
				'<div class="boldform-preview-states__field">' +
					'<label>' + escapeHtml( advLabel( 'sampleDropdown' ) ) + '</label>' +
					'<div class="bf-select is-open">' +
						'<div class="bf-select__trigger"><span class="bf-select__value">' + escapeHtml( advLabel( 'optionSelected' ) ) + '</span><span class="bf-select__arrow">' + caret + '</span></div>' +
						'<div class="bf-select__panel">' +
							'<div class="bf-select__search-wrap"><input class="bf-select__panel-search" type="text" placeholder="' + escapeHtml( advLabel( 'sampleSearch' ) ) + '" readonly></div>' +
							'<div class="bf-select__list">' +
								'<div class="bf-select__option is-active"><span class="bf-select__check">' + chk + '</span><span class="bf-select__option-text">' + escapeHtml( advLabel( 'optionSelected' ) ) + '</span></div>' +
								'<div class="bf-select__option"><span class="bf-select__check"></span><span class="bf-select__option-text">' + escapeHtml( advLabel( 'optionAnother' ) ) + '</span></div>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>';
		}

		function renderStylePreview() {
			var $canvas = $( '#boldform-style-preview-canvas' );

			if ( ! $canvas.length ) {
				return;
			}

			var rows = getAllRows();

			// Reflect the live style variables via the shared scoped <style> node.
			applyPreviewStyleBlock();

			if ( ! rows.length ) {
				$canvas.html(
					'<div class="boldform-style-preview-empty">' +
						escapeHtml( boldformLiteBuilder.labels.stylePreviewEmpty || 'Add fields in the Builder tab to preview your styling here.' ) +
					'</div>'
				);
				return;
			}

			var markup = '<div class="boldform-style-preview-form">';

			rows.forEach(
				function ( row ) {
					markup += '<div class="boldform-style-preview-row">';

					row.columns.forEach(
						function ( column ) {
							markup += '<div class="boldform-style-preview-column" style="width:' + escapeHtml( column.width ) + ';">';

							column.fields.forEach(
								function ( field ) {
									var fieldClasses = 'boldform-canvas-field';
									var fieldLabelPos = field.label_placement || 'top';

									if ( 'top' !== fieldLabelPos ) {
										fieldClasses += ' is-label-' + fieldLabelPos;
									}

									markup += '<div class="' + fieldClasses + '">' +
										'<div class="boldform-canvas-field-body">' + renderInputPreview( field ) + '</div>' +
									'</div>';
								}
							);

							markup += '</div>';
						}
					);

					markup += '</div>';
				}
			);

			// Mirror the canvas: append a submit button only when the structure has none.
			if ( ! hasSubmitField() ) {
				markup += '<div class="boldform-canvas-submit is-align-' + escapeHtml( state.formSettings.button_alignment || 'left' ) + '">' +
					'<button type="button" class="boldform-canvas-submit__button">' + buildButtonContent() + '</button>' +
				'</div>';
			}

			markup += '</div>';
			markup += bfPreviewStatesMarkup();
			$canvas.html( markup );
		}

		function switchEditorView( view ) {
			state.activeEditorView = view;

			$( '.boldform-editor-tab' ).each(
				function () {
					var isActive = $( this ).data( 'editor-tab' ) === view;

					$( this )
						.toggleClass( 'is-active', isActive )
						.attr( 'aria-selected', isActive ? 'true' : 'false' );
				}
			);

			$( '[data-editor-view]' ).each(
				function () {
					var isActive = $( this ).data( 'editor-view' ) === view;

					$( this )
						.toggleClass( 'is-active', isActive )
						.prop( 'hidden', ! isActive );
				}
			);

			// Refresh the live preview when entering the Style tab so any
			// structure changes made on the Builder tab are reflected.
			if ( 'style' === view ) {
				renderStylePreview();
			}
		}

		function renderRowPresets() {
			var markup = '';

			( boldformLiteBuilder.columnPresets || [] ).forEach(
				function ( preset ) {
					markup += '<button type="button" class="boldform-preset" data-columns="' + escapeHtml( preset.value ) + '" data-widths="' + escapeHtml( preset.widths.join( ',' ) ) + '">';
					markup += '<span class="boldform-preset__top"><strong>' + escapeHtml( preset.label ) + '</strong>';
					markup += '<span class="boldform-preset__check" aria-hidden="true"><span class="dashicons dashicons-yes"></span></span></span>';
					markup += '<span class="boldform-preset__grid">';
					preset.widths.forEach(
						function ( width ) {
							markup += '<span style="width:' + escapeHtml( width ) + ';"></span>';
						}
					);
					markup += '</span></button>';
				}
			);

			$( '#boldform-column-presets' ).html( markup );
		}

		function switchSidebarTab( tab ) {
			state.activeSidebarTab = tab;

			$( '.boldform-sidebar-tab' ).each(
				function () {
					var isActive = $( this ).data( 'tab' ) === tab;

					$( this )
						.toggleClass( 'is-active', isActive )
						.attr( 'aria-selected', isActive ? 'true' : 'false' );
				}
			);

			$( '[data-tab-panel]' ).each(
				function () {
					var isActive = $( this ).data( 'tab-panel' ) === tab;

					$( this )
						.toggleClass( 'is-active', isActive )
						.prop( 'hidden', ! isActive );
				}
			);
		}

		function renderAll() {
			$( '#boldform-form-title' ).val( state.formTitle );
			renderCanvas();
			renderSettingsPanel();
			renderFormSettings();
			renderStylingSettings();
			renderStylePreview();
			renderRowPresets();
			switchSidebarTab( state.activeSidebarTab );
			switchEditorView( state.activeEditorView );
		}

		function getAllTemplateDefinitions() {
			var lite = getTemplateDefinitions();
			// Additional templates can be added via boldformLiteBuilder.proTemplates.
			var pro = ( boldformLiteBuilder.proTemplates && typeof boldformLiteBuilder.proTemplates === 'object' )
				? boldformLiteBuilder.proTemplates
				: {};
			return $.extend( {}, lite, pro );
		}

		function applyTemplate( templateName ) {
			var templates = getAllTemplateDefinitions();
			var template = templates[ templateName ];

			if ( ! template ) {
				// A locked row advertises a template that is not installed. The Import
				// button is hidden while one is selected, so this is belt-and-braces:
				// without it an advertised key would fall through to the blank-row
				// modal, which reads as the upgrade having silently done something.
				if ( lockedTemplate( templateName ) ) {
					openUpgradeModal( 'boldform-templates-upgrade-modal' );
					return;
				}
				openRowModal();
				return;
			}

			// normalizeStructure runs each field through normalizeField() which assigns
			// IDs and fills in all defaults — required for Pro templates that arrive as
			// plain PHP-serialized objects without pre-generated IDs.
			state.structure = normalizeStructure( { rows: template.rows } );
			markDirty();
			state.selectedFieldId = null;
			state.formTitle = template.title || state.formTitle || boldformLiteBuilder.defaultFormTitle;
			setActiveColumn( 0, 0 );
			switchEditorView( 'builder' );
			switchSidebarTab( 'library' );
			renderAll();
		}

		function openTemplateModal() {
			renderTemplateModal();
			$( '#boldform-template-modal' ).removeAttr( 'hidden' );
		}

		function closeTemplateModal() {
			$( '#boldform-template-modal' ).attr( 'hidden', true );
		}

		var tplCategories = {
			general:   'General',
			business:  'Business',
			events:    'Events & Booking',
			hr_survey: 'HR & Surveys',
			health:    'Health & Medical',
			education: 'Education & Nonprofit',
			payment:   'Payment & Calculation',
			multi_step: 'Multi-Step'
		};
		var tplCategoryMap = {
			contact: 'general', newsletter: 'general', feedback: 'general', registration: 'general',
			lead: 'business', support: 'business', order_form: 'business',
			event_rsvp: 'events', booking: 'events',
			job_application: 'hr_survey', customer_survey: 'hr_survey',
			// Additional template category mappings can be added dynamically.
		};

		// Labels of any feature modules a template needs that are currently disabled.
		// A template declares dependencies via `requires_modules` (an array of module
		// keys); the live on/off state comes from boldformLiteBuilder.proModules (set
		// by the Pro add-on). Returns [] when nothing is missing — so the notice shows
		// only while a required module is off and disappears once it is re-enabled.
		function bfTemplateMissingModules( tpl ) {
			var req  = ( tpl && Array.isArray( tpl.requires_modules ) ) ? tpl.requires_modules : [];
			if ( ! req.length ) return [];
			var mods = ( boldformLiteBuilder.proModules && typeof boldformLiteBuilder.proModules === 'object' )
				? boldformLiteBuilder.proModules
				: {};
			var missing = [];
			req.forEach( function ( key ) {
				var m = mods[ key ];
				// Only flag a module we actually know about AND that is off. If Pro
				// isn't present, req is empty for Lite templates, so this never fires.
				if ( m && ! m.active ) missing.push( m.label || key );
			} );
			return missing;
		}

		/**
		 * Locked template rows advertised in the library, keyed by category.
		 *
		 * Empty whenever the upgrade CTAs are off, which is also when the add-on
		 * supplies the real versions — so a locked row never sits beside the template
		 * it advertises. A locked entry whose key already exists as a real template is
		 * dropped as a second guarantee of that.
		 *
		 * @param {Object} realTemplates Templates that can actually be imported.
		 * @return {Object} Category key => array of {key,title,description}.
		 */
		function groupedTemplateTeasers( realTemplates ) {
			var grouped = {};

			if ( ! showUpgradeCta() || ! Array.isArray( boldformLiteBuilder.premiumTemplates ) ) {
				return grouped;
			}

			boldformLiteBuilder.premiumTemplates.forEach( function ( tpl ) {
				if ( ! tpl || ! tpl.key || realTemplates[ tpl.key ] ) {
					return;
				}
				var cat = tpl.category || 'general';
				if ( ! grouped[ cat ] ) grouped[ cat ] = [];
				grouped[ cat ].push( tpl );
			} );

			return grouped;
		}

		/**
		 * Looks a locked entry up by key, or null when it is not one.
		 *
		 * @param {string} key Template key.
		 * @return {Object|null} The locked entry, or null.
		 */
		function lockedTemplate( key ) {
			if ( ! showUpgradeCta() || ! Array.isArray( boldformLiteBuilder.premiumTemplates ) ) {
				return null;
			}
			var found = null;
			boldformLiteBuilder.premiumTemplates.forEach( function ( tpl ) {
				if ( tpl && tpl.key === key ) found = tpl;
			} );
			return found;
		}

		function renderTemplateModal() {
			var templates = getAllTemplateDefinitions();
			var teasers   = groupedTemplateTeasers( templates );

			// A locked row can be "selected" to preview what it offers, so the
			// selection is valid if it names either a real template or a locked one.
			var lockedSelection = templates[ state.selectedTemplate ] ? null : lockedTemplate( state.selectedTemplate );
			var selectedKey = ( templates[ state.selectedTemplate ] || lockedSelection )
				? state.selectedTemplate
				: 'contact';
			var selectedTemplate = templates[ selectedKey ];
			var listMarkup = '';
			var previewMarkup = '';

			// Group templates by category.
			var grouped = {};
			Object.keys( tplCategories ).forEach( function ( cat ) { grouped[ cat ] = []; } );
			Object.keys( templates ).forEach( function ( key ) {
				// A template may declare its own `category` (this is how Pro
				// templates land in the right group without editing tplCategoryMap);
				// fall back to the built-in map, then to 'general'.
				var tpl = templates[ key ];
				var cat = ( tpl && tpl.category ) || tplCategoryMap[ key ] || 'general';
				if ( ! grouped[ cat ] ) grouped[ cat ] = [];
				grouped[ cat ].push( key );
			} );

			// Categories the add-on fills but this plugin does not — Health & Medical,
			// Education & Nonprofit, Payment & Calculation, Multi-Step — hold nothing but
			// locked rows, so they have to be walked too or they never render at all.
			Object.keys( teasers ).forEach( function ( cat ) {
				if ( ! grouped[ cat ] ) grouped[ cat ] = [];
			} );

			Object.keys( grouped ).forEach( function ( cat ) {
				var catTeasers = teasers[ cat ] || [];
				if ( ! grouped[ cat ].length && ! catTeasers.length ) return;
				// Accordion: the group holding the currently-selected template starts
				// open, the rest start collapsed. On first open the selection defaults
				// to 'contact', so the first (General) group is the one shown. Keeping
				// the selected group open means it stays expanded across the re-render
				// that fires when a template is picked.
				var groupOpen = grouped[ cat ].indexOf( selectedKey ) !== -1 ||
					catTeasers.some( function ( t ) { return t.key === selectedKey; } );
				listMarkup += '<div class="boldform-template-group' + ( groupOpen ? ' is-open' : '' ) + '">';
				listMarkup += '<button type="button" class="boldform-template-group__header" data-template-group-toggle aria-expanded="' + ( groupOpen ? 'true' : 'false' ) + '">';
				listMarkup += '<span class="boldform-template-group__title">' + escapeHtml( tplCategories[ cat ] || cat ) + '</span>';
				listMarkup += '<span class="boldform-template-group__chevron dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>';
				listMarkup += '</button>';
				listMarkup += '<div class="boldform-template-group__body"><div class="boldform-template-group__inner">';
				grouped[ cat ].forEach( function ( key ) {
					var tpl = templates[ key ];
					var isActive = key === selectedKey;
					listMarkup += '<button type="button" class="boldform-template-option' +
						( isActive ? ' is-active' : '' ) +
						'" data-template-option="' + escapeHtml( key ) + '">';
					listMarkup += '<span class="boldform-tpl-option-label"><strong>' + escapeHtml( tpl.title ) + '</strong></span>';
					listMarkup += '</button>';
				} );
				// Locked rows sit under the importable ones so the free templates always
				// come first. They are real buttons, not inert chips: selecting one shows
				// what the form does in the preview pane, which is the whole point.
				catTeasers.forEach( function ( tpl ) {
					var isActive = tpl.key === selectedKey;
					listMarkup += '<button type="button" class="boldform-template-option is-locked' +
						( isActive ? ' is-active' : '' ) +
						'" data-template-option="' + escapeHtml( tpl.key ) + '">';
					listMarkup += '<span class="boldform-tpl-option-label"><strong>' + escapeHtml( tpl.title ) + '</strong></span>';
					listMarkup += '<span class="boldform-template-option__lock dashicons dashicons-lock" aria-hidden="true"></span>';
					listMarkup += '</button>';
				} );
				listMarkup += '</div></div>';
				listMarkup += '</div>';
			} );

			// A locked row has no structure to draw — it is an advertisement, not a
			// template — so the canvas shows what the form is for and how to get it,
			// and the Import button is swapped for the upgrade call to action.
			if ( ! selectedTemplate ) {
				var lockedTpl = lockedSelection || lockedTemplate( selectedKey );

				$( '#boldform-template-list' ).html( listMarkup );
				$( '#boldform-template-preview__head' ).html(
					'<h3>' + escapeHtml( lockedTpl ? lockedTpl.title : '' ) + '</h3>' +
					'<p>' + escapeHtml( lockedTpl ? lockedTpl.description : '' ) + '</p>'
				);
				$( '#boldform-template-preview-canvas' ).html(
					'<div class="boldform-template-lock">' +
						'<span class="boldform-template-lock__badge dashicons dashicons-lock" aria-hidden="true"></span>' +
						'<strong class="boldform-template-lock__title">' +
							escapeHtml( boldformLiteBuilder.labels.templateLockTitle || 'Available with an upgrade' ) +
						'</strong>' +
						'<p class="boldform-template-lock__text">' +
							escapeHtml( boldformLiteBuilder.labels.templateLockText || '' ) +
						'</p>' +
						'<button type="button" class="boldform-upgrade-btn boldform-template-lock__cta" aria-haspopup="dialog" data-upgrade-modal="boldform-templates-upgrade-modal">' +
							'<span class="dashicons dashicons-lock" aria-hidden="true"></span>' +
							escapeHtml( boldformLiteBuilder.labels.upgradeNow || 'Upgrade Now' ) +
						'</button>' +
					'</div>'
				);
				$( '#boldform-import-template' ).attr( 'hidden', 'hidden' );
				return;
			}

			$( '#boldform-import-template' ).removeAttr( 'hidden' );

			selectedTemplate.rows.forEach( function ( row ) {
				previewMarkup += '<div class="boldform-template-preview-row">';
				row.columns.forEach( function ( column ) {
					previewMarkup += '<div class="boldform-template-preview-column" style="width:' + escapeHtml( column.width ) + ';">';
					column.fields.forEach( function ( field ) {
						previewMarkup += '<div class="boldform-template-preview-field">';
						previewMarkup += renderInputPreview( field );
						previewMarkup += '</div>';
					} );
					previewMarkup += '</div>';
				} );
				previewMarkup += '</div>';
			} );
			previewMarkup += '<div class="boldform-template-preview-submit"><button type="button" class="boldform-canvas-submit__button">' + escapeHtml( state.formSettings.button_text || 'Submit' ) + '</button></div>';

			$( '#boldform-template-list' ).html( listMarkup );
			$( '#boldform-template-preview-canvas' ).html( previewMarkup );
			applyPreviewStyleBlock();
			var missingModules = bfTemplateMissingModules( selectedTemplate );
			var moduleNotice   = '';
			if ( missingModules.length ) {
				var noticeText = ( boldformLiteBuilder.labels.templateNeedsModule || 'This template uses %s, which is currently disabled. Enable it in Settings for the form to work fully.' )
					.replace( '%s', missingModules.join( ', ' ) );
				moduleNotice = '<div class="boldform-template-module-notice"><span class="dashicons dashicons-warning" aria-hidden="true"></span> ' + escapeHtml( noticeText ) + '</div>';
			}

			$( '#boldform-template-preview__head' ).html(
				'<h3>' + escapeHtml( selectedTemplate.title ) + '</h3>' +
				'<p>' + escapeHtml( selectedTemplate.description ) + '</p>' +
				moduleNotice
			);

			$( '#boldform-import-template' )
				.text( boldformLiteBuilder.labels.importTemplate || 'Import Template' );
		}

		function updateShortcodeDisplay() {
			var $shortcode = $( '#boldform-builder-shortcode' );
			var $code = $( '#boldform-builder-shortcode-code' );
			var $preview = $( '#boldform-preview-form' );

			if ( ! state.formId ) {
				$shortcode.attr( 'hidden', true ).removeClass( 'is-visible' );
				$preview.hide();
				return;
			}

			$code.text( '[boldform id="' + state.formId + '"]' );
			$shortcode.removeAttr( 'hidden' ).addClass( 'is-visible' );
			$preview.attr( 'href', 'admin.php?page=boldform-lite-preview&form_id=' + state.formId ).show();
		}

		function copyShortcode() {
			var shortcode;

			if ( ! state.formId ) {
				return;
			}

			shortcode = '[boldform id="' + state.formId + '"]';

			// Brief "copied" feedback: swap the copy icon to a checkmark, then revert.
			var flashCopied = function () {
				var $btn  = $( '#boldform-builder-shortcode' );
				var $icon = $btn.find( '.boldform-builder-shortcode__copy' );
				$btn.addClass( 'is-copied' );
				$icon.removeClass( 'dashicons-admin-page' ).addClass( 'dashicons-yes-alt' );
				clearTimeout( $btn.data( 'copiedTimer' ) );
				$btn.data( 'copiedTimer', setTimeout( function () {
					$btn.removeClass( 'is-copied' );
					$icon.removeClass( 'dashicons-yes-alt' ).addClass( 'dashicons-admin-page' );
				}, 1500 ) );
			};

			// Legacy copy for non-secure contexts (e.g. plain-HTTP local sites)
			// where navigator.clipboard is unavailable.
			var legacyCopy = function () {
				var $temp = $( '<textarea>' ).val( shortcode ).css( {
					position: 'fixed',
					top: '-9999px',
					opacity: 0
				} ).appendTo( 'body' );
				$temp[0].select();
				try {
					document.execCommand( 'copy' );
				} catch ( e ) {}
				$temp.remove();
			};

			if ( navigator.clipboard && navigator.clipboard.writeText ) {
				navigator.clipboard.writeText( shortcode ).then( flashCopied, function () {
					legacyCopy();
					flashCopied();
				} );
				return;
			}

			legacyCopy();
			flashCopied();
		}

		// Save the form. Accepts an optional onSaved( formId ) callback invoked only
		// after a successful save — used by the Preview button to auto-save the current
		// builder state (including unsaved fields) before navigating to the preview page,
		// which renders the SAVED form from the database.
		function saveForm( onSaved ) {
			var $save = $( '#boldform-save-form' );
			var title = $.trim( $( '#boldform-form-title' ).val() ) || boldformLiteBuilder.defaultFormTitle;
			var payload;

			// Note: an empty form (no rows/fields) is intentionally allowed to save,
			// so a user can clear a form and have that persist. The server stores an
			// empty structure and the renderer skips a field-less form gracefully.

			// Flush the thank-you editor. Typing in Code view fires no event the editor
			// reports, so without this a message written there and saved immediately
			// would not be picked up.
			syncThankYouMessage();

			/**
			 * Allow Pro modules to mutate state.formSettings before it is serialised.
			 * Attach handlers to `boldform:before_save` to inject extra keys.
			 *
			 * @event boldform:before_save
			 * @param {object} formSettings Live reference to state.formSettings.
			 */
			$( document ).trigger( 'boldform:before_save', [ state.formSettings ] );

			payload = {
				action: 'boldform_lite_save_form',
				nonce: boldformLiteBuilder.nonce,
				form_id: state.formId,
				title: title,
				structure: JSON.stringify( state.structure ),
				settings: JSON.stringify( state.formSettings )
			};

			$save.prop( 'disabled', true ).text( boldformLiteBuilder.savingText );

			// Reset the status line: cancel any pending auto-dismiss and restore visibility.
			var $status = $( '#boldform-builder-status' );
			clearTimeout( $status.data( 'dismissTimer' ) );
			$status.stop( true, true ).css( { display: '', opacity: 1 } ).text( '' );

			$.post( boldformLiteBuilder.ajaxUrl, payload )
				.done(
					function ( response ) {
						if ( response && response.success ) {
							state.formId = response.data.formId;
							hasUnsavedChanges = false; // saved → no pending changes
							updateShortcodeDisplay();
							$( '#boldform-builder-status' ).text( response.data.message );

							// Auto-dismiss the success message after a few seconds (errors stay).
							$status.data( 'dismissTimer', setTimeout( function () {
								$status.fadeOut( 300, function () {
									$( this ).text( '' ).css( { display: '', opacity: 1 } );
								} );
							}, 4000 ) );

							// Keep form_id in the URL so a page refresh stays on the builder.
							if ( state.formId && window.history && window.history.replaceState ) {
								var url = window.location.href;
								if ( url.indexOf( 'form_id=' ) !== -1 ) {
									url = url.replace( /form_id=\d*/, 'form_id=' + state.formId );
								} else {
									url += ( url.indexOf( '?' ) !== -1 ? '&' : '?' ) + 'form_id=' + state.formId;
								}
								window.history.replaceState( null, '', url );
							}

							if ( 'function' === typeof onSaved ) {
								onSaved( state.formId );
							}

							return;
						}

						// WordPress returns 0 or -1 as response body when nonce/auth fails.
						if ( response === '0' || response === '-1' || response === 0 ) {
							$( '#boldform-builder-status' ).text( boldformLiteBuilder.messages.saveError + ' (session expired — please reload the page)' );
							return;
						}

						$( '#boldform-builder-status' ).text( response && response.data && response.data.message ? response.data.message : boldformLiteBuilder.messages.saveError );
					}
				)
				.fail(
					function ( xhr ) {
						var message = boldformLiteBuilder.messages.saveError;

						if ( xhr && xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message ) {
							message = xhr.responseJSON.data.message;
						} else if ( xhr && xhr.status === 403 ) {
							message = boldformLiteBuilder.messages.saveError + ' (session expired — please reload the page)';
						}

						$( '#boldform-builder-status' ).text( message );
					}
				)
				.always(
					function () {
						$save.prop( 'disabled', false ).text( boldformLiteBuilder.saveText );
					}
				);
		}

		function setupSortables() {
			if ( document.getElementById( 'boldform-canvas-rows' ) ) {
				Sortable.create(
					document.getElementById( 'boldform-canvas-rows' ),
					{
						group: {
							name: 'boldform-rows',
							put: false
						},
						draggable: '.boldform-row',
						handle: '.boldform-row-move',
						onEnd: function ( event ) {
							moveRow( event.oldIndex, event.newIndex );
						}
					}
				);
			}

			// The premium-fields teaser reuses .boldform-library-grid for layout but its
			// chips are inert adverts, so it is excluded here — never a drag source.
			$( '.boldform-library-grid' ).not( '.boldform-library-grid--locked' ).each(
				function () {
					Sortable.create(
						this,
						{
							group: {
								name: 'boldform-fields',
								pull: 'clone',
								put: false
							},
							// Palette only: drag a copy out to the canvas, but never
							// reorder items within the library sidebar itself. The
							// custom sortable honours this flag in canAccept().
							sort: false,
							draggable: '.boldform-library-item',
							handle: '.boldform-library-item'
						}
					);
				}
			);

			$( '.boldform-column-fields' ).each(
				function () {
					Sortable.create(
						this,
						{
							group: {
								name: 'boldform-fields',
								put: true
							},
							draggable: '.boldform-canvas-field',
							handle: '.boldform-move-field',
							onAdd: function ( event ) {
								var type = $( event.item ).data( 'field-type' );
								var toRowIndex = Number( $( event.to ).data( 'row-index' ) );
								var toColumnIndex = Number( $( event.to ).data( 'column-index' ) );

								if ( type ) {
									addFieldToColumn( type, toRowIndex, toColumnIndex, event.newIndex );
								}
							},
							onEnd: function ( event ) {
								var fromRowIndex = Number( $( event.from ).data( 'row-index' ) );
								var fromColumnIndex = Number( $( event.from ).data( 'column-index' ) );
								var toRowIndex = Number( $( event.to ).data( 'row-index' ) );
								var toColumnIndex = Number( $( event.to ).data( 'column-index' ) );
								var fromColumn = getColumn( fromRowIndex, fromColumnIndex );
								var toColumn = getColumn( toRowIndex, toColumnIndex );

								if ( ! fromColumn || ! toColumn ) return;

								var field = fromColumn.fields.splice( event.oldIndex, 1 )[ 0 ];
								if ( ! field ) return;
								toColumn.fields.splice( event.newIndex, 0, field );
								state.selectedFieldId = field.id;
								setActiveColumn( toRowIndex, toColumnIndex );
								renderAll();
							}
						}
					);
				}
			);
		}

		function openRowModal() {
			$( '#boldform-row-modal' ).removeAttr( 'hidden' );
		}

		function closeRowModal() {
			$( '#boldform-row-modal' ).attr( 'hidden', true );
		}

		function collectRepeaterOptions() {
			var options = [];
			$( '#boldform-options-repeater .boldform-options-repeater__input' ).each( function () {
				var val = $.trim( $( this ).val() );
				if ( val.length ) {
					options.push( val );
				}
			} );
			return options;
		}

		function syncRepeaterToField() {
			var selected = getSelectedFieldLocation();
			if ( ! selected || optionFieldTypes.indexOf( selected.field.type ) === -1 ) return;
			selected.field.options = collectRepeaterOptions();

			var defaults = [];
			$( '#boldform-options-repeater input[name="boldform-option-default"]:checked' ).each( function () {
				var idx = $( this ).closest( '.boldform-options-repeater__item' ).index();
				var val = $.trim( selected.field.options[ idx ] || '' );
				if ( val.length ) {
					defaults.push( val );
				}
			} );
			selected.field.default_value = defaults.join( ', ' );

			renderCanvas();
		}

		function setupOptionsSortable() {
			var el = document.getElementById( 'boldform-options-repeater' );
			if ( ! el ) return;
			Sortable.create( el, {
				draggable: '.boldform-options-repeater__item',
				handle: '.boldform-options-repeater__drag',
				onEnd: function () {
					syncRepeaterToField();
				}
			} );
		}

		function setupAddressSortable() {
			var el = document.getElementById( 'boldform-addr-list' );
			if ( ! el ) return;
			Sortable.create( el, {
				draggable: '.boldform-addr-item',
				handle: '.boldform-addr-item__drag',
				onEnd: function () {
					var selected = getSelectedFieldLocation();
					if ( ! selected ) return;
					var newOrder = [];
					$( '#boldform-addr-list .boldform-addr-item' ).each( function () {
						newOrder.push( $( this ).data( 'addr-key' ) );
					} );
					selected.field.address_order = newOrder;
					renderCanvas();
				}
			} );
		}

		// Style section collapse toggle — accordion: only one section open at a
		// time. Opening a section collapses any sibling that was open; clicking an
		// already-open section's head closes it (leaving all collapsed).
		$( document ).on( 'click', '.boldform-style-section__head', function () {
			var $sec = $( this ).closest( '.boldform-style-section' );
			var willOpen = ! $sec.hasClass( 'is-open' );
			$sec.siblings( '.boldform-style-section' ).removeClass( 'is-open' );
			$sec.toggleClass( 'is-open', willOpen );
		} );

		// Reset a whole section: clear every var its controls write (active device), then
		// rebuild the section body so all controls fall back to their default.
		// Design Theme reset — revert to the default theme (no schema section, so it
		// needs its own handler; the generic one below no-ops on this button).
		$( document ).on( 'click', '.boldform-theme-reset', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			if ( $( this ).is( '.is-disabled, :disabled' ) ) { return; }
			bfApplyThemeWithConflictCheck( 'default-blue' );
		} );

		$( document ).on( 'click', '.boldform-style-section__reset', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			var $btn = $( this ), secId = $btn.attr( 'data-reset-section' ), sec = null;
			if ( $btn.is( '.is-disabled, :disabled' ) ) { return; }
			bfStyleSchema().forEach( function ( s ) { if ( s.id === secId ) { sec = s; } } );
			if ( ! sec ) { return; }
			var layer = state.formSettings.style && state.formSettings.style[ state.activeDevice || 'desktop' ];
			if ( layer ) { bfSectionVars( sec ).forEach( function ( v ) { delete layer[ v ]; } ); }
			var body = '';
			bfOrderControls( sec.controls ).forEach( function ( c ) { body += advControl( c ); } );
			$btn.closest( '.boldform-style-section' ).find( '.boldform-adv-grid' ).html( body );
			applyPreviewStyleBlock();
			bfRefreshResetStates();
			bfSyncFormMaxWidthState();
		} );

		// Live-preview device switcher. Sets the active breakpoint, frames the preview
		// at a representative width, and re-renders so the controls + preview reflect
		// that device's values.
		$( document ).on( 'click', '.boldform-device-btn', function () {
			var device = $( this ).data( 'device' );
			if ( ! device || device === state.activeDevice ) {
				return;
			}
			state.activeDevice = device;

			$( '.boldform-device-btn' ).removeClass( 'is-active' ).attr( 'aria-pressed', 'false' );
			$( this ).addClass( 'is-active' ).attr( 'aria-pressed', 'true' );

			$( '#boldform-style-preview-canvas' )
				.removeClass( 'is-device-desktop is-device-tablet is-device-mobile' )
				.addClass( 'is-device-' + device );

			renderStylingSettings();
			renderStylePreview();
		} );

		// ---- Advanced style controls: recompute a field's CSS var(s) from its inputs ----
		function recomputeAdvField( $field ) {
			if ( ! $field || ! $field.length ) { return; }
			var type = $field.data( 'type' );
			var cssVar = $field.data( 'var' );
			var out = {};
			var px = function ( v ) { return ( '' === v || null == v ) ? 0 : parseFloat( v ); };

			if ( 'color' === type ) {
				out[ cssVar ] = bfReadColorField( $field.find( '.boldform-color-field' ).first() );
			} else if ( 'slider' === type ) {
				var n = $field.find( '.bf-adv-num' ).val();
				var u = $field.find( '.bf-adv-unit' ).length ? $field.find( '.bf-adv-unit' ).val() : ( $field.find( 'span[data-unit]' ).data( 'unit' ) || 'px' );
				out[ cssVar ] = ( '' === n ) ? '' : ( parseFloat( n ) + u );
			} else if ( 'dimension' === type ) {
				var du = $field.find( '.bf-adv-dim-unit' ).val() || 'px';
				var vals = $field.find( '.bf-adv-dim' ).map( function () { return $( this ).val(); } ).get();
				var anySet = vals.some( function ( x ) { return '' !== x; } );
				out[ cssVar ] = anySet ? vals.map( function ( x ) { return px( x ) + du; } ).join( ' ' ) : '';
			} else if ( 'border' === type ) {
				var colorVar = $field.data( 'colorvar' ) || ( cssVar + '-color' );
				var bw = $field.find( '.bf-adv-bw' ).val();
				out[ cssVar + '-width' ] = ( '' === bw ) ? '' : ( parseFloat( bw ) + 'px' );
				var bs = $field.find( '.bf-adv-bs' ).val() || '';
				// A width with no explicit style would otherwise resolve to `none` (button)
				// and render nothing — default to `solid` so setting a width is visible.
				if ( ! bs && '' !== bw && parseFloat( bw ) > 0 ) { bs = 'solid'; }
				out[ cssVar + '-style' ] = bs;
				out[ colorVar ] = bfReadColorField( $field.find( '.bf-adv-bc' ).closest( '.boldform-color-field' ) );
			} else if ( 'typography' === type ) {
				var ffKey = $field.find( '.bf-adv-ff' ).val();
				out[ cssVar + '-ff' ] = ( ffKey && BF_FONT_STACKS[ ffKey ] ) ? BF_FONT_STACKS[ ffKey ] : '';
				var fsv = $field.find( '.bf-adv-fs' ).val();
				out[ cssVar + '-fs' ] = ( '' === fsv ) ? '' : ( parseFloat( fsv ) + 'px' );
				out[ cssVar + '-fw' ] = $field.find( '.bf-adv-fw' ).val() || '';
				var lhv = $field.find( '.bf-adv-lh' ).val();
				out[ cssVar + '-lh' ] = ( '' === lhv ) ? '' : ( parseFloat( lhv ) + 'px' );
				var lsv = $field.find( '.bf-adv-ls' ).val();
				out[ cssVar + '-ls' ] = ( '' === lsv ) ? '' : ( parseFloat( lsv ) + 'px' );
				out[ cssVar + '-tt' ] = $field.find( '.bf-adv-tt' ).val() || '';
			} else if ( 'shadow' === type ) {
				var sx = $field.find( '.bf-adv-sx' ).val(), sy = $field.find( '.bf-adv-sy' ).val(),
					sb = $field.find( '.bf-adv-sblur' ).val(), ss = $field.find( '.bf-adv-sspread' ).val();
				var sc = bfReadColorField( $field.find( '.bf-adv-sc' ).closest( '.boldform-color-field' ) );
				var anyNum = ( '' !== sx || '' !== sy || '' !== sb || '' !== ss );
				if ( ! sc || ! anyNum ) {
					out[ cssVar ] = '';
				} else {
					out[ cssVar ] = ( $field.find( '.bf-adv-inset' ).prop( 'checked' ) ? 'inset ' : '' ) +
						px( sx ) + 'px ' + px( sy ) + 'px ' + px( sb ) + 'px ' + px( ss ) + 'px ' + sc;
				}
			} else if ( 'background' === type ) {
				if ( $field.find( '.bf-adv-bgtype[data-bg="gradient"]' ).hasClass( 'is-active' ) ) {
					var c1 = bfReadColorField( $field.find( '.bf-adv-bg-c1' ).closest( '.boldform-color-field' ) );
					var c2 = bfReadColorField( $field.find( '.bf-adv-bg-c2' ).closest( '.boldform-color-field' ) );
					var ang = parseInt( $field.find( '.bf-adv-bg-angle' ).val(), 10 );
					if ( isNaN( ang ) ) { ang = 135; }
					out[ cssVar ] = ( c1 && c2 )
						? ( 'linear-gradient(' + ang + 'deg, ' + c1 + ' 0%, ' + c2 + ' 100%)' ) : '';
				} else {
					out[ cssVar ] = bfReadColorField( $field.find( '.bf-adv-bg-c' ).closest( '.boldform-color-field' ) );
				}
			} else if ( 'select' === type ) {
				out[ cssVar ] = $field.find( '.bf-adv-select' ).val() || '';
			} else if ( 'switch' === type ) {
				out[ cssVar ] = $field.find( '.bf-adv-toggle' ).prop( 'checked' ) ? ( String( $field.data( 'on' ) ) || '1' ) : '';
			} else if ( 'align' === type ) {
				// Keep the keyword (for state restore) + derive margin-left/right and a
				// max-width override (full width = "justify") onto <base>-ml/-mr/-mw.
				var av = $field.find( '.bf-adv-align-btn.is-active' ).data( 'align' ) || '';
				var base = cssVar.replace( /-align$/, '' );
				var amap = { left: [ '0', 'auto', '' ], center: [ 'auto', 'auto', '' ], right: [ 'auto', '0', '' ], justify: [ '0', '0', '100%' ] };
				var a = amap[ av ] || [ '', '', '' ];
				out[ cssVar ] = av;
				out[ base + '-ml' ] = a[0];
				out[ base + '-mr' ] = a[1];
				out[ base + '-mw' ] = a[2];
			}

			advStyleSetVars( out );
		}

		// Alignment segmented control → activate the clicked button, recompute.
		$( document ).on( 'click', '.bf-adv-align-btn', function () {
			var $btn = $( this );
			$btn.closest( '.bf-adv-align' ).find( '.bf-adv-align-btn' ).removeClass( 'is-active' );
			$btn.addClass( 'is-active' );
			recomputeAdvField( $btn.closest( '.boldform-adv-field' ) );
			bfSyncFormMaxWidthState();
		} );

		// Color picker → sync hex text + swatch, then recompute owning field.
		$( document ).on( 'input', '.boldform-adv-field .bf-adv-colorpick', function () {
			var v = $( this ).val();
			var $cf = $( this ).closest( '.boldform-color-field' );
			$cf.find( '.bf-adv-hex' ).val( v );
			bfSyncColorSwatch( $cf );
			recomputeAdvField( $( this ).closest( '.boldform-adv-field' ) );
		} );

		// Opacity (alpha) range slider → live % readout, swatch overlay, recompute → rgba().
		$( document ).on( 'input', '.boldform-adv-field .bf-adv-opacity', function () {
			var $cf = $( this ).closest( '.boldform-color-field' );
			$cf.find( '.bf-adv-op-val' ).text( ( $( this ).val() || '0' ) + '%' );
			bfSyncColorSwatch( $cf );
			recomputeAdvField( $( this ).closest( '.boldform-adv-field' ) );
		} );

		// Reset a colour field back to "unset" — clears the hex + opacity so the
		// underlying --bf-* var is dropped (advStyleSetVars deletes empty values),
		// i.e. the colour behaves exactly as if the user never touched it.
		$( document ).on( 'click', '.boldform-adv-field .bf-adv-color-reset', function ( e ) {
			e.preventDefault();
			var $cf = $( this ).closest( '.boldform-color-field' );
			$cf.find( '.bf-adv-hex' ).val( '' );
			$cf.find( '.bf-adv-colorpick' ).val( '#000000' );
			$cf.find( '.bf-adv-opacity' ).val( 100 );
			$cf.find( '.bf-adv-op-val' ).text( '100%' );
			bfSyncColorSwatch( $cf );
			recomputeAdvField( $( this ).closest( '.boldform-adv-field' ) );
		} );

		// Any other advanced input/select/checkbox change.
		$( document ).on( 'input change', '.boldform-adv-field .bf-adv-input', function () {
			var $el = $( this );
			if ( $el.hasClass( 'bf-adv-hex' ) ) {
				var hv = ( $el.val() || '' ).trim();
				var $cf = $el.closest( '.boldform-color-field' );
				if ( BF_HEX6.test( hv ) ) {
					$cf.find( '.bf-adv-colorpick' ).val( hv );
				}
				bfSyncColorSwatch( $cf );
			}
			if ( $el.hasClass( 'bf-adv-dim' ) && $el.closest( '.boldform-adv-field' ).hasClass( 'is-linked' ) ) {
				$el.closest( '.boldform-adv-field' ).find( '.bf-adv-dim' ).val( $el.val() );
			}
			recomputeAdvField( $el.closest( '.boldform-adv-field' ) );
		} );

		// Dimension link toggle.
		$( document ).on( 'click', '.bf-adv-dim-link', function () {
			var $field = $( this ).closest( '.boldform-adv-field' );
			$field.toggleClass( 'is-linked' );
			$( this ).toggleClass( 'is-active', $field.hasClass( 'is-linked' ) );
		} );

		// State switcher tabs (Normal / Hover / Focus): show only the active state's panel.
		$( document ).on( 'click', '.bf-adv-state-tab', function () {
			var $wrap = $( this ).closest( '.boldform-adv-statetabs' );
			var key = String( $( this ).data( 'state' ) );
			$wrap.find( '.bf-adv-state-tab' ).removeClass( 'is-active' );
			$( this ).addClass( 'is-active' );
			$wrap.find( '.bf-adv-state-panel' ).each( function () {
				$( this ).prop( 'hidden', String( $( this ).data( 'state' ) ) !== key );
			} );
		} );

		// Background type tabs (solid / gradient).
		$( document ).on( 'click', '.bf-adv-bgtype', function () {
			// Shadow state tabs share the segmented .bf-adv-bgtype styling — let their
			// own handler manage them.
			if ( $( this ).hasClass( 'bf-adv-shadow-tab' ) ) { return; }
			var $field = $( this ).closest( '.boldform-adv-field' );
			$field.find( '.bf-adv-bgtype' ).removeClass( 'is-active' );
			$( this ).addClass( 'is-active' );
			var grad = 'gradient' === $( this ).data( 'bg' );
			$field.find( '.bf-adv-bg-solid' ).prop( 'hidden', grad );
			$field.find( '.bf-adv-bg-grad' ).prop( 'hidden', ! grad );
			recomputeAdvField( $field );
		} );

		// Box-shadow Normal/Hover (or Normal/Focus) state tabs: switch which CSS var the
		// shadow fields edit, repopulating them from that state's stored value. The other
		// state's value persists untouched in state.formSettings.style.
		$( document ).on( 'click', '.bf-adv-shadow-tab', function () {
			var $field = $( this ).closest( '.boldform-adv-field' );
			var newVar = $( this ).attr( 'data-shadow-var' );
			$field.find( '.bf-adv-shadow-tab' ).removeClass( 'is-active' );
			$( this ).addClass( 'is-active' );
			$field.attr( 'data-var', newVar ).data( 'var', newVar );
			$field.find( '.bf-adv-shadow-body' ).html( shadowBodyMarkup( newVar ) );
		} );

		// Field setting accordion toggle (only one open at a time).
		$( document ).on( 'click', '.boldform-field-accordion__head', function () {
			var $accordion = $( this ).closest( '.boldform-field-accordion' );
			var isOpen = $accordion.hasClass( 'is-open' );
			$accordion.siblings( '.boldform-field-accordion' ).removeClass( 'is-open' );
			$accordion.toggleClass( 'is-open', ! isOpen );
			state.activeSettingsAccordion = ! isOpen ? ( $accordion.data( 'accordion' ) || 'settings' ) : 'settings';
		} );

		// Reset a field-setting color picker (slider track / star) back to its
		// theme-following default by clearing the stored color.
		$( document ).on( 'click', '.bf-color-reset', function () {
			var prop = $( this ).data( 'color-reset' );
			var selected = getSelectedFieldLocation();

			if ( ! selected || ! prop ) {
				return;
			}

			selected.field[ prop ] = '';
			renderAll();
		} );

		// Conditional logic — enable/disable toggle.
		$( document ).on( 'change', '#boldform-setting-cond-enabled', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.enabled = $( this ).is( ':checked' );
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		// Conditional logic — AND/OR logic toggle.
		$( document ).on( 'change', 'input[name="bfcl-logic"]', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.logic = $( this ).val();
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		// Conditional logic — condition field/operator changes.
		$( document ).on( 'change', '.bfcl-cond-field, .bfcl-cond-op', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var ci = parseInt( $( this ).data( 'ci' ), 10 );
			var cond = selected.field.conditional;
			if ( ! cond || ! cond.conditions || ! cond.conditions[ ci ] ) return;
			if ( $( this ).hasClass( 'bfcl-cond-field' ) ) {
				cond.conditions[ ci ].field_id = $( this ).val();
			} else {
				cond.conditions[ ci ].operator = $( this ).val();
			}
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		// Conditional logic — condition value input.
		$( document ).on( 'input', '.bfcl-cond-value', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var ci = parseInt( $( this ).data( 'ci' ), 10 );
			var cond = selected.field.conditional;
			if ( cond && cond.conditions && cond.conditions[ ci ] ) {
				cond.conditions[ ci ].value = $( this ).val();
			}
		} );

		// Conditional logic — add condition.
		$( document ).on( 'click', '.bfcl-add-condition', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.conditions.push( { field_id: '', operator: 'is', value: '' } );
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		// Conditional logic — remove condition.
		$( document ).on( 'click', '.bfcl-remove-cond', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var ci = parseInt( $( this ).data( 'ci' ), 10 );
			selected.field.conditional.conditions.splice( ci, 1 );
			if ( ! selected.field.conditional.conditions.length ) {
				selected.field.conditional.conditions.push( { field_id: '', operator: 'is', value: '' } );
			}
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		// Conditional logic — show/hide action selector.
		$( document ).on( 'change', '.bfcl-action-select', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.action = $( this ).val();
		} );

		// Address field toggle.
		$( document ).on( 'change', '.boldform-setting-address-field', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var key = $( this ).data( 'addr-key' );
			selected.field.address_fields[ key ] = $( this ).is( ':checked' );
			renderCanvas();
		} );

		// Button group clicks (label placement, button alignment).
		$( document ).on( 'click', '.boldform-btn-group__btn', function () {
			var $group = $( this ).closest( '.boldform-btn-group' );
			var val = $( this ).data( 'value' );
			$group.find( '.boldform-btn-group__btn' ).removeClass( 'is-active' );
			$( this ).addClass( 'is-active' );

			if ( $group.attr( 'id' ) === 'boldform-setting-label-placement' ) {
				var selected = getSelectedFieldLocation();
				if ( selected ) {
					selected.field.label_placement = val;
					renderCanvas();
				}
			} else if ( $group.attr( 'id' ) === 'boldform-setting-button-alignment' ) {
				state.formSettings.button_alignment = val;
				renderAll();
			}
		} );

		// Rich text editor toolbar.
		$( document ).on( 'click', '.boldform-richtext__toolbar button', function ( e ) {
			e.preventDefault();
			document.execCommand( $( this ).data( 'cmd' ), false, null );
			$( '#boldform-richtext-editor' ).focus();
		} );

		// Rich text editor content sync.
		$( document ).on( 'input', '#boldform-richtext-editor', function () {
			var selected = getSelectedFieldLocation();
			if ( selected ) {
				selected.field.content = $( this ).html();
				renderCanvas();
			}
		} );

		// Repeater: input change.
		$( document ).on( 'input', '.boldform-options-repeater__input', function () {
			syncRepeaterToField();
		} );

		// Repeater: default option change.
		$( document ).on( 'change', 'input[name="boldform-option-default"]', function () {
			var $label = $( this ).closest( '.boldform-options-repeater__default' );
			if ( $( this ).attr( 'type' ) === 'radio' ) {
				$( '.boldform-options-repeater__default' ).removeClass( 'is-checked' );
				$label.addClass( 'is-checked' );
			} else {
				$label.toggleClass( 'is-checked', $( this ).is( ':checked' ) );
			}
			syncRepeaterToField();
		} );


		// Repeater: add option.
		$( document ).on( 'click', '#boldform-option-add', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.options.push( '' );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			// Focus the new empty input.
			$( '#boldform-options-repeater .boldform-options-repeater__item:last-child .boldform-options-repeater__input' ).focus();
		} );

		// Repeater: remove option.
		$( document ).on( 'click', '.boldform-options-repeater__remove', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var index = $( this ).closest( '.boldform-options-repeater__item' ).data( 'option-index' );
			if ( selected.field.options.length <= 1 ) return; // Keep at least one.
			selected.field.options.splice( index, 1 );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			renderCanvas();
		} );

		// Product options repeater: add row.
		$( document ).on( 'click', '#boldform-product-option-add', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			if ( ! Array.isArray( selected.field.product_options ) ) {
				selected.field.product_options = [];
			}
			selected.field.product_options.push( { label: '', price: '0.00' } );
			renderSettingsPanel();
			$( '#boldform-product-options-repeater .boldform-product-option-row:last-child .boldform-product-option__label' ).focus();
		} );

		// Product options repeater: remove row.
		$( document ).on( 'click', '.boldform-product-option__remove', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			var idx = Number( $( this ).data( 'product-index' ) );
			if ( ! Array.isArray( selected.field.product_options ) || selected.field.product_options.length <= 1 ) return;
			selected.field.product_options.splice( idx, 1 );
			renderSettingsPanel();
			renderCanvas();
		} );

		// Product options repeater: update label/price inline.
		$( document ).on( 'input change', '.boldform-product-option__label, .boldform-product-option__price', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.product_options ) ) return;
			var $row = $( this ).closest( '.boldform-product-option-row' );
			var idx = Number( $row.data( 'product-index' ) );
			if ( ! selected.field.product_options[ idx ] ) return;
			if ( $( this ).hasClass( 'boldform-product-option__label' ) ) {
				selected.field.product_options[ idx ].label = $( this ).val();
			} else {
				selected.field.product_options[ idx ].price = $( this ).val();
			}
			renderCanvas();
		} );

		// ---- Image Choice option management ----

		// Add image-choice option row.
		$( document ).on( 'click', '#boldform-ic-option-add', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			if ( ! Array.isArray( selected.field.image_choice_options ) ) {
				selected.field.image_choice_options = [];
			}
			selected.field.image_choice_options.push( { label: '', value: '', image_url: '' } );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			$( '#boldform-ic-options-repeater .boldform-ic-option-row:last-child .boldform-ic-option__label' ).focus();
		} );

		// Remove image-choice option row.
		$( document ).on( 'click', '.boldform-ic-option__remove', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.image_choice_options ) ) return;
			var idx = Number( $( this ).data( 'ic-index' ) );
			selected.field.image_choice_options.splice( idx, 1 );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			renderCanvas();
		} );

		// Edit image-choice option label/value inline.
		$( document ).on( 'input', '.boldform-ic-option__label, .boldform-ic-option__value', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.image_choice_options ) ) return;
			var $row = $( this ).closest( '.boldform-ic-option-row' );
			var idx = Number( $row.data( 'ic-index' ) );
			if ( ! selected.field.image_choice_options[ idx ] ) return;
			if ( $( this ).hasClass( 'boldform-ic-option__label' ) ) {
				selected.field.image_choice_options[ idx ].label = $( this ).val();
			} else {
				selected.field.image_choice_options[ idx ].value = $( this ).val();
			}
			renderCanvas();
		} );

		// ---- Repeater sub-field management ----

		// Add repeater sub-field row.
		$( document ).on( 'click', '#boldform-rep-field-add', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			if ( ! Array.isArray( selected.field.repeater_fields ) ) {
				selected.field.repeater_fields = [];
			}
			if ( selected.field.repeater_fields.length >= 8 ) return; // MAX_SUB_FIELDS
			var newId = 'sf_' + Math.random().toString( 36 ).slice( 2, 8 );
			selected.field.repeater_fields.push( { id: newId, type: 'text', label: '', placeholder: '', required: false } );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			renderCanvas();
			$( '#boldform-rep-fields-list .boldform-rep-field-row:last-child .boldform-rep-field__label' ).focus();
		} );

		// Remove repeater sub-field row.
		$( document ).on( 'click', '.boldform-rep-field__remove', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.repeater_fields ) ) return;
			var idx = Number( $( this ).data( 'rep-index' ) );
			selected.field.repeater_fields.splice( idx, 1 );
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			renderCanvas();
		} );

		// Edit repeater sub-field label inline.
		$( document ).on( 'input', '.boldform-rep-field__label', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.repeater_fields ) ) return;
			var $row = $( this ).closest( '.boldform-rep-field-row' );
			var idx = Number( $row.data( 'rep-index' ) );
			if ( selected.field.repeater_fields[ idx ] ) {
				selected.field.repeater_fields[ idx ].label = $( this ).val();
			}
			renderCanvas();
		} );

		// Edit repeater sub-field type via change.
		$( document ).on( 'change', '.boldform-rep-field__type', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.repeater_fields ) ) return;
			var $row = $( this ).closest( '.boldform-rep-field-row' );
			var idx = Number( $row.data( 'rep-index' ) );
			if ( selected.field.repeater_fields[ idx ] ) {
				selected.field.repeater_fields[ idx ].type = $( this ).val();
			}
			// Re-render so the per-sub-field options editor appears/disappears when
			// switching to/from a choice sub-type (select/radio/checkbox).
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
			renderCanvas();
		} );

		// Edit repeater sub-field options (one per line) for choice sub-types.
		$( document ).on( 'input', '.boldform-rep-field__options', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected || ! Array.isArray( selected.field.repeater_fields ) ) return;
			var $row = $( this ).closest( '.boldform-rep-field-row' );
			var idx = Number( $row.data( 'rep-index' ) );
			if ( selected.field.repeater_fields[ idx ] ) {
				// Keep raw line splits while editing; the Pro sanitizer drops blanks on
				// save and the array is re-joined with newlines on reload.
				selected.field.repeater_fields[ idx ].options = $( this ).val().split( '\n' );
				renderCanvas();
			}
		} );

		$( '#boldform-field-library' ).on(
			'click',
			'.boldform-library-item',
			function () {
				addFieldToActiveColumn( $( this ).data( 'field-type' ) );
			}
		);

		$( document ).on(
			'click',
			'.boldform-column',
			function ( event ) {
				var $column = $( this );

				if ( $( event.target ).closest( '.boldform-canvas-field-actions, .boldform-canvas-field' ).length ) {
					return;
				}

				setActiveColumn( Number( $column.data( 'row-index' ) ), Number( $column.data( 'column-index' ) ) );
				renderCanvas();
			}
		);

		$( document ).on(
			'click',
			'.boldform-canvas-submit__button',
			function ( event ) {
				event.preventDefault();
				event.stopPropagation();
				state.selectedFieldId = submitButtonId;
				switchEditorView( 'builder' );
				switchSidebarTab( 'settings' );
				renderAll();
			}
		);

		$( document ).on(
			'click',
			'.boldform-canvas-field',
			function ( event ) {
				var location;

				if ( $( event.target ).closest( '.boldform-canvas-field-actions' ).length ) {
					return;
				}

				state.selectedFieldId = $( this ).data( 'field-id' );
				state.selectedRowIndex = null;
				state.activeSettingsAccordion = 'settings';
				location = getSelectedFieldLocation();

				if ( location ) {
					setActiveColumn( location.rowIndex, location.columnIndex );
					switchEditorView( 'builder' );
					switchSidebarTab( 'settings' );
				}

				renderAll();
			}
		);

		$( document ).on(
			'click',
			'.boldform-edit-field',
			function ( event ) {
				var $field = $( this ).closest( '.boldform-canvas-field' );

				event.stopPropagation();
				state.selectedFieldId = $field.data( 'field-id' );
				state.selectedRowIndex = null;
				switchEditorView( 'builder' );
				switchSidebarTab( 'settings' );
				renderAll();
			}
		);

		$( document ).on(
			'click',
			'.boldform-editor-tab',
			function () {
				switchEditorView( $( this ).data( 'editor-tab' ) );
			}
		);

		$( document ).on(
			'click',
			'.boldform-sidebar-tab',
			function () {
				switchSidebarTab( $( this ).data( 'tab' ) );
			}
		);

		$( document ).on(
			'click',
			'.boldform-duplicate-field',
			function ( event ) {
				event.stopPropagation();
				duplicateField( $( this ).closest( '.boldform-canvas-field' ).data( 'field-id' ) );
			}
		);

		$( document ).on(
			'click',
			'.boldform-delete-field',
			function ( event ) {
				event.stopPropagation();
				deleteField( $( this ).closest( '.boldform-canvas-field' ).data( 'field-id' ) );
			}
		);


		$( document ).on(
			'click',
			'.boldform-row-duplicate',
			function ( event ) {
				event.stopPropagation();
				duplicateRow( Number( $( this ).closest( '.boldform-row' ).data( 'row-index' ) ) );
			}
		);


		$( document ).on(
			'click',
			'.boldform-row-delete',
			function ( event ) {
				event.stopPropagation();
				deleteRow( Number( $( this ).closest( '.boldform-row' ).data( 'row-index' ) ) );
			}
		);


		// Row settings button click.
		$( document ).on(
			'click',
			'.boldform-row-settings',
			function ( event ) {
				event.stopPropagation();
				var rowIndex = Number( $( this ).closest( '.boldform-row' ).data( 'row-index' ) );
				if ( state.selectedRowIndex === rowIndex ) {
					state.selectedRowIndex = null;
				} else {
					state.selectedRowIndex = rowIndex;
					state.selectedFieldId = null;
				}
				switchSidebarTab( 'settings' );
				renderAll();
			}
		);

		// Row column width change.
		$( document ).on( 'input', '.boldform-row-col-width', function () {
			if ( state.selectedRowIndex === null ) return;
			var row = getAllRows()[ state.selectedRowIndex ];
			if ( ! row ) return;
			var ci = Number( $( this ).data( 'col-index' ) );
			if ( row.columns[ ci ] ) {
				row.columns[ ci ].width = $.trim( $( this ).val() ) || '100%';
				renderCanvas();
			}
		} );

		// Row CSS class input.
		$( document ).on( 'input', '#boldform-setting-row-css-class', function () {
			if ( state.selectedRowIndex === null ) return;
			var row = getAllRows()[ state.selectedRowIndex ];
			if ( row ) { row.css_class = $( this ).val(); }
		} );

		// Deselect row when a field is clicked.
		$( document ).on( 'click', '.boldform-canvas-field', function () {
			if ( state.selectedRowIndex !== null ) {
				state.selectedRowIndex = null;
			}
		} );

		$( document ).on(
			'input',
			'#boldform-setting-label, #boldform-setting-placeholder, #boldform-setting-default, #boldform-setting-button-text, #boldform-setting-content, #boldform-setting-description, #boldform-setting-custom-error, #boldform-setting-allowed-types, #boldform-setting-max-file-size, #boldform-setting-button-icon-gap, #boldform-setting-css-class, #boldform-setting-auto-populate-key, #boldform-setting-min-value, #boldform-setting-max-value, #boldform-setting-step-value, #boldform-setting-mask-custom, #boldform-setting-max-stars, #boldform-setting-star-color, #boldform-setting-star-inactive-color, #boldform-setting-star-size, #boldform-setting-slider-color, #boldform-setting-slider-height, #boldform-setting-step-title, #boldform-setting-next-text, #boldform-setting-prev-text, #boldform-setting-btn-color, #boldform-setting-btn-text-color, #boldform-setting-btn-size, #boldform-setting-btn-radius, #boldform-setting-progress-color, #boldform-setting-progress-style, #boldform-setting-button-icon-size, #boldform-setting-button-icon-color, #boldform-step-progress-style-field, #boldform-page-break-progress-style, #boldform-page-break-progress-color, #boldform-page-break-progress-bg-color, #boldform-page-break-btn-color, #boldform-page-break-btn-text-color, #boldform-page-break-btn-size, #boldform-page-break-btn-radius, #boldform-page-break-next-text, #boldform-page-break-prev-text, #boldform-setting-product-style, #boldform-setting-qty-linked-product, #boldform-setting-qty-min, #boldform-setting-qty-max, #boldform-setting-qty-default, #boldform-setting-amount-min, #boldform-setting-amount-max, #boldform-setting-amount-default, #boldform-calc-formula, #boldform-calc-decimals, #boldform-calc-prefix, #boldform-calc-suffix, #boldform-setting-sig-pen-color, #boldform-setting-sig-pen-width, #boldform-setting-sig-bg-color, #boldform-setting-sig-height, #boldform-setting-hidden-value, #boldform-setting-rep-min, #boldform-setting-rep-max, #boldform-setting-rep-add-label, #boldform-setting-rep-remove-label, #boldform-setting-ic-img-height, #boldform-setting-matrix-rows, #boldform-setting-matrix-cols, #boldform-setting-lookup-items, #boldform-setting-lookup-placeholder, #boldform-setting-lookup-min-chars, #boldform-setting-lookup-max-results, #boldform-setting-geo-map-height, #boldform-setting-rte-height, #boldform-setting-pw-placeholder, #boldform-setting-dr-placeholder, #boldform-setting-dr-separator, #boldform-setting-dr-min-days, #boldform-setting-dr-max-days, #boldform-setting-nps-low, #boldform-setting-nps-high, #boldform-setting-nps-detractor-color, #boldform-setting-nps-passive-color, #boldform-setting-nps-promoter-color',
			function () {
				var selected = getSelectedFieldLocation();

				var isSubmitInput = state.selectedFieldId === submitButtonId || ( selected && selected.field && 'submit' === selected.field.type );

				if ( isSubmitInput ) {
					state.formSettings.button_text = $( '#boldform-setting-button-text' ).val();
					if ( $( '#boldform-setting-button-icon-gap' ).length ) {
						state.formSettings.button_icon_gap = $( '#boldform-setting-button-icon-gap' ).val() || '8';
					}
					if ( $( '#boldform-setting-button-icon-size' ).length ) {
						state.formSettings.button_icon_size = $( '#boldform-setting-button-icon-size' ).val() || '18';
					}
					if ( $( '#boldform-setting-button-icon-color' ).length ) {
						var $iconColorInput = $( '#boldform-setting-button-icon-color' );
						state.formSettings.button_icon_color = $iconColorInput.val() || '';
						// Live-update the swatch preview in place while dragging the native
						// picker. renderCanvas() repaints only the canvas (so the icon
						// updates instantly) but not the settings panel — updating the panel
						// wholesale would close the open picker — so nudge the swatch directly.
						$iconColorInput.siblings( '.boldform-color-preview' ).css( 'background', $iconColorInput.val() || '#ffffff' );
					}
					renderCanvas();
					return;
				}

				if ( ! selected ) {
					return;
				}

				selected.field.label = $( '#boldform-setting-label' ).length ? $( '#boldform-setting-label' ).val() : selected.field.label;
				selected.field.placeholder = $( '#boldform-setting-placeholder' ).length ? $( '#boldform-setting-placeholder' ).val() : ( selected.field.placeholder || '' );
				selected.field.default_value = $( '#boldform-setting-default' ).length ? $( '#boldform-setting-default' ).val() : ( selected.field.default_value || '' );
				selected.field.content = $( '#boldform-setting-content' ).length ? $( '#boldform-setting-content' ).val() : selected.field.content;
				selected.field.description = $( '#boldform-setting-description' ).length ? $( '#boldform-setting-description' ).val() : selected.field.description;
				selected.field.custom_error = $( '#boldform-setting-custom-error' ).length ? $( '#boldform-setting-custom-error' ).val() : ( selected.field.custom_error || '' );
				selected.field.allowed_types = $( '#boldform-setting-allowed-types' ).length ? $( '#boldform-setting-allowed-types' ).val() : ( selected.field.allowed_types || '' );
				selected.field.max_file_size = $( '#boldform-setting-max-file-size' ).length ? $( '#boldform-setting-max-file-size' ).val() : ( selected.field.max_file_size || '' );
				selected.field.css_class = $( '#boldform-setting-css-class' ).length ? $( '#boldform-setting-css-class' ).val() : ( selected.field.css_class || '' );
			selected.field.auto_populate_key = $( '#boldform-setting-auto-populate-key' ).length ? $( '#boldform-setting-auto-populate-key' ).val() : ( selected.field.auto_populate_key || '' );
				selected.field.min_value = $( '#boldform-setting-min-value' ).length ? $( '#boldform-setting-min-value' ).val() : selected.field.min_value;
				selected.field.max_value = $( '#boldform-setting-max-value' ).length ? $( '#boldform-setting-max-value' ).val() : selected.field.max_value;
				selected.field.step_value = $( '#boldform-setting-step-value' ).length ? $( '#boldform-setting-step-value' ).val() : selected.field.step_value;
				if ( $( '#boldform-setting-mask-custom' ).length ) {
					selected.field.mask_pattern = $( '#boldform-setting-mask-custom' ).val();
				}
				if ( $( '#boldform-setting-max-stars' ).length ) {
					selected.field.max_stars = Number( $( '#boldform-setting-max-stars' ).val() ) || 5;
				}
				if ( $( '#boldform-setting-star-color' ).length ) {
					selected.field.star_color = $( '#boldform-setting-star-color' ).val();
				}
				if ( $( '#boldform-setting-star-inactive-color' ).length ) {
					selected.field.star_inactive_color = $( '#boldform-setting-star-inactive-color' ).val();
				}
				if ( $( '#boldform-setting-star-size' ).length ) {
					selected.field.star_size = $( '#boldform-setting-star-size' ).val();
				}
				if ( $( '#boldform-setting-slider-color' ).length ) {
					selected.field.slider_color = $( '#boldform-setting-slider-color' ).val();
				}
				if ( $( '#boldform-setting-slider-height' ).length ) {
					selected.field.slider_height = $( '#boldform-setting-slider-height' ).val();
				}
				if ( $( '#boldform-setting-step-title' ).length ) {
					selected.field.step_title = $( '#boldform-setting-step-title' ).val();
				}
				// Progress style is a form-wide setting (there is one indicator for the
				// whole multi-step form), not a per-field one -- edited from the Page
				// Break panel since that's where users look for it, but stored on
				// formSettings like the submit button's settings are above.
				if ( $( '#boldform-page-break-progress-style' ).length ) {
					state.formSettings.step_progress_style = $( '#boldform-page-break-progress-style' ).val() || 'bar';
				}
				if ( $( '#boldform-page-break-progress-color' ).length ) {
					state.formSettings.step_progress_color = $( '#boldform-page-break-progress-color' ).val() || '';
				}
				if ( $( '#boldform-page-break-progress-bg-color' ).length ) {
					state.formSettings.step_progress_bg_color = $( '#boldform-page-break-progress-bg-color' ).val() || '';
				}
				if ( $( '#boldform-page-break-btn-color' ).length ) {
					state.formSettings.step_btn_color = $( '#boldform-page-break-btn-color' ).val() || '';
				}
				if ( $( '#boldform-page-break-btn-text-color' ).length ) {
					state.formSettings.step_btn_text_color = $( '#boldform-page-break-btn-text-color' ).val() || '';
				}
				if ( $( '#boldform-page-break-btn-size' ).length ) {
					state.formSettings.step_btn_size = $( '#boldform-page-break-btn-size' ).val() || 'medium';
				}
				if ( $( '#boldform-page-break-btn-radius' ).length ) {
					state.formSettings.step_btn_radius = '' === $( '#boldform-page-break-btn-radius' ).val() ? '' : Math.max( 0, Math.min( 50, parseInt( $( '#boldform-page-break-btn-radius' ).val(), 10 ) || 0 ) );
				}
				if ( $( '#boldform-page-break-next-text' ).length ) {
					state.formSettings.step_next_text = $( '#boldform-page-break-next-text' ).val() || '';
				}
				if ( $( '#boldform-page-break-prev-text' ).length ) {
					state.formSettings.step_prev_text = $( '#boldform-page-break-prev-text' ).val() || '';
				}
				if ( $( '#boldform-setting-product-style' ).length ) {
					selected.field.product_style = $( '#boldform-setting-product-style' ).val();
				}
				if ( $( '#boldform-setting-qty-linked-product' ).length ) {
					selected.field.linked_product = $( '#boldform-setting-qty-linked-product' ).val();
				}
				if ( $( '#boldform-setting-qty-min' ).length ) {
					selected.field.qty_min = $( '#boldform-setting-qty-min' ).val();
				}
				if ( $( '#boldform-setting-qty-max' ).length ) {
					selected.field.qty_max = $( '#boldform-setting-qty-max' ).val();
				}
				if ( $( '#boldform-setting-qty-default' ).length ) {
					selected.field.qty_default = $( '#boldform-setting-qty-default' ).val();
				}
				if ( $( '#boldform-setting-amount-min' ).length ) {
					selected.field.amount_min = $( '#boldform-setting-amount-min' ).val();
				}
				if ( $( '#boldform-setting-amount-max' ).length ) {
					selected.field.amount_max = $( '#boldform-setting-amount-max' ).val();
				}
				if ( $( '#boldform-setting-amount-default' ).length ) {
					selected.field.amount_default = $( '#boldform-setting-amount-default' ).val();
				}
				var calcEditor = document.getElementById( 'boldform-calc-formula' );
				if ( calcEditor ) {
					var calcFormulaVal = bfCalcChipsToFormula( calcEditor );
					selected.field.calc_formula = calcFormulaVal;
					// Live validity styling without rebuilding the editor (keeps the caret).
					var calcInvalid = calcFormulaVal && /[^0-9\s\+\-\*\/\(\)\.\{\}a-z0-9_]/i.test( calcFormulaVal );
					$( calcEditor )
						.toggleClass( 'bfcp-valid', !! calcFormulaVal && ! calcInvalid )
						.toggleClass( 'bfcp-invalid', !! calcFormulaVal && !! calcInvalid );
				}
				if ( $( '#boldform-calc-decimals' ).length ) {
					selected.field.calc_decimals = Math.max( 0, Math.min( 10, parseInt( $( '#boldform-calc-decimals' ).val(), 10 ) || 0 ) );
				}
				if ( $( '#boldform-calc-prefix' ).length ) {
					selected.field.calc_prefix = $( '#boldform-calc-prefix' ).val();
				}
				if ( $( '#boldform-calc-suffix' ).length ) {
					selected.field.calc_suffix = $( '#boldform-calc-suffix' ).val();
				}

				// Signature field.
				if ( $( '#boldform-setting-sig-pen-color' ).length ) {
					selected.field.sig_pen_color = $( '#boldform-setting-sig-pen-color' ).val();
				}
				if ( $( '#boldform-setting-sig-pen-width' ).length ) {
					selected.field.sig_pen_width = Math.max( 1, Math.min( 8, parseInt( $( '#boldform-setting-sig-pen-width' ).val(), 10 ) || 2 ) );
				}
				if ( $( '#boldform-setting-sig-bg-color' ).length ) {
					selected.field.sig_bg_color = $( '#boldform-setting-sig-bg-color' ).val();
				}
				if ( $( '#boldform-setting-sig-height' ).length ) {
					selected.field.sig_height = Math.max( 80, Math.min( 400, parseInt( $( '#boldform-setting-sig-height' ).val(), 10 ) || 160 ) );
				}

				// Hidden field.
				if ( $( '#boldform-setting-hidden-value' ).length ) {
					selected.field.hidden_value = $( '#boldform-setting-hidden-value' ).val();
				}

				// Repeater field.
				if ( $( '#boldform-setting-rep-min' ).length ) {
					selected.field.repeater_min_rows = Math.max( 1, Math.min( 10, parseInt( $( '#boldform-setting-rep-min' ).val(), 10 ) || 1 ) );
				}
				if ( $( '#boldform-setting-rep-max' ).length ) {
					selected.field.repeater_max_rows = Math.max( 1, Math.min( 20, parseInt( $( '#boldform-setting-rep-max' ).val(), 10 ) || 5 ) );
				}
				if ( $( '#boldform-setting-rep-add-label' ).length ) {
					selected.field.repeater_add_label = $( '#boldform-setting-rep-add-label' ).val();
				}
				if ( $( '#boldform-setting-rep-remove-label' ).length ) {
					selected.field.repeater_remove_label = $( '#boldform-setting-rep-remove-label' ).val();
				}

				// Image choice image height.
				if ( $( '#boldform-setting-ic-img-height' ).length ) {
					selected.field.image_choice_img_height = Math.max( 60, Math.min( 600, parseInt( $( '#boldform-setting-ic-img-height' ).val(), 10 ) || 160 ) );
				}

				// Password field.
				if ( $( '#boldform-setting-pw-placeholder' ).length ) {
					selected.field.placeholder = $( '#boldform-setting-pw-placeholder' ).val();
				}

				// Rich Text.
				if ( $( '#boldform-setting-rte-height' ).length ) {
					selected.field.rte_height = Math.max( 100, Math.min( 800, parseInt( $( '#boldform-setting-rte-height' ).val(), 10 ) || 200 ) );
				}

				// Date Range.
				if ( $( '#boldform-setting-dr-placeholder' ).length ) {
					selected.field.placeholder = $( '#boldform-setting-dr-placeholder' ).val();
				}
				if ( $( '#boldform-setting-dr-format' ).length ) {
					selected.field.date_range_format = $( '#boldform-setting-dr-format' ).val();
				}
				if ( $( '#boldform-setting-dr-separator' ).length ) {
					selected.field.date_range_separator = $( '#boldform-setting-dr-separator' ).val();
				}
				if ( $( '#boldform-setting-dr-min-days' ).length ) {
					selected.field.date_range_min_days = $( '#boldform-setting-dr-min-days' ).val();
				}
				if ( $( '#boldform-setting-dr-max-days' ).length ) {
					selected.field.date_range_max_days = $( '#boldform-setting-dr-max-days' ).val();
				}

				// NPS.
				if ( $( '#boldform-setting-nps-low' ).length ) {
					selected.field.nps_low_label = $( '#boldform-setting-nps-low' ).val();
				}
				if ( $( '#boldform-setting-nps-high' ).length ) {
					selected.field.nps_high_label = $( '#boldform-setting-nps-high' ).val();
				}
				if ( $( '#boldform-setting-nps-detractor-color' ).length ) {
					selected.field.nps_detractor_color = $( '#boldform-setting-nps-detractor-color' ).val();
				}
				if ( $( '#boldform-setting-nps-passive-color' ).length ) {
					selected.field.nps_passive_color = $( '#boldform-setting-nps-passive-color' ).val();
				}
				if ( $( '#boldform-setting-nps-promoter-color' ).length ) {
					selected.field.nps_promoter_color = $( '#boldform-setting-nps-promoter-color' ).val();
				}

				// Matrix — convert textareas to JSON arrays.
				if ( $( '#boldform-setting-matrix-rows' ).length ) {
					var mRowsText = $( '#boldform-setting-matrix-rows' ).val().trim();
					selected.field.matrix_rows = JSON.stringify(
						mRowsText ? mRowsText.split( /\r?\n/ ).map( function(s) { return s.trim(); } ).filter( Boolean ) : []
					);
				}
				if ( $( '#boldform-setting-matrix-cols' ).length ) {
					var mColsText = $( '#boldform-setting-matrix-cols' ).val().trim();
					selected.field.matrix_columns = JSON.stringify(
						mColsText ? mColsText.split( /\r?\n/ ).map( function(s) { return s.trim(); } ).filter( Boolean ) : []
					);
				}

				// Lookup — convert textarea to JSON array.
				if ( $( '#boldform-setting-lookup-placeholder' ).length ) {
					selected.field.placeholder = $( '#boldform-setting-lookup-placeholder' ).val();
				}
				if ( $( '#boldform-setting-lookup-items' ).length ) {
					var lItemsText = $( '#boldform-setting-lookup-items' ).val().trim();
					selected.field.lookup_items = JSON.stringify(
						lItemsText ? lItemsText.split( /\r?\n/ ).map( function(s) { return s.trim(); } ).filter( Boolean ) : []
					);
				}
				if ( $( '#boldform-setting-lookup-min-chars' ).length ) {
					selected.field.lookup_min_chars = Math.max( 1, Math.min( 5, parseInt( $( '#boldform-setting-lookup-min-chars' ).val(), 10 ) || 2 ) );
				}
				if ( $( '#boldform-setting-lookup-max-results' ).length ) {
					selected.field.lookup_max_results = Math.max( 3, Math.min( 20, parseInt( $( '#boldform-setting-lookup-max-results' ).val(), 10 ) || 8 ) );
				}

				// Geolocation.
				if ( $( '#boldform-setting-geo-map-height' ).length ) {
					selected.field.geo_map_height = Math.max( 150, Math.min( 600, parseInt( $( '#boldform-setting-geo-map-height' ).val(), 10 ) || 250 ) );
				}
				if ( $( '#boldform-setting-geo-store-format' ).length ) {
					selected.field.geo_store_format = $( '#boldform-setting-geo-store-format' ).val();
				}

				if ( optionFieldTypes.indexOf( selected.field.type ) !== -1 ) {
					selected.field.options = collectRepeaterOptions();
				}

				renderCanvas();
			}
		);

		$( document ).on(
			'change',
			'#boldform-setting-required, #boldform-setting-button-icon-type, #boldform-setting-button-icon-dashicon, #boldform-setting-button-icon-position, #boldform-setting-button-icon-color, #boldform-setting-button-color-global, #boldform-setting-options-layout, #boldform-setting-checkbox-style, #boldform-setting-select-searchable, #boldform-setting-mask-pattern, #boldform-setting-show-middle-name, #boldform-setting-show-last-name, #boldform-setting-hidden-source, #boldform-setting-ic-type, #boldform-setting-ic-columns, #boldform-setting-rep-columns, #boldform-setting-pw-confirm, #boldform-setting-lookup-allow-custom, #boldform-setting-geo-show-map, #boldform-setting-matrix-type, #boldform-setting-dr-format, #boldform-setting-geo-store-format, #boldform-setting-dual-handle',
			function () {
				var selected = getSelectedFieldLocation();
				var isSubmitSel = state.selectedFieldId === submitButtonId || ( selected && selected.field && 'submit' === selected.field.type );

				if ( isSubmitSel ) {
					state.formSettings.button_icon_type = $( '#boldform-setting-button-icon-type' ).val() || 'none';
					if ( $( '#boldform-setting-button-icon-dashicon' ).length ) {
						state.formSettings.button_icon_dashicon = $( '#boldform-setting-button-icon-dashicon' ).val() || 'dashicons-arrow-right-alt';
					}
					state.formSettings.button_icon_position = $( '#boldform-setting-button-icon-position' ).val() || 'right';
					// Native <input type="color"> fires 'change' reliably (on picker close)
					// but 'input' inconsistently across browsers, so capture the icon colour
					// here too — the 'input' handler covers live dragging where supported.
					if ( $( '#boldform-setting-button-icon-color' ).length ) {
						state.formSettings.button_icon_color = $( '#boldform-setting-button-icon-color' ).val() || '';
					}
					renderAll();
					return;
				}

				if ( $( this ).is( '#boldform-setting-button-color-global' ) ) {
					state.formSettings.button_color = $( '#boldform-setting-button-color-global' ).val() || 'teal';
					renderCanvas();
					return;
				}

				if ( ! selected ) {
					return;
				}

				selected.field.required = $( '#boldform-setting-required' ).is( ':checked' );

				if ( ! selected.field.required ) {
					selected.field.custom_error = '';
				}

				if ( $( '#boldform-setting-options-layout' ).length ) {
					selected.field.options_layout = $( '#boldform-setting-options-layout' ).val() || 'block';
				}

				if ( $( '#boldform-setting-checkbox-style' ).length ) {
					selected.field.checkbox_style = $( '#boldform-setting-checkbox-style' ).val() || 'default';
				}

				if ( $( '#boldform-setting-select-searchable' ).length ) {
					selected.field.select_searchable = $( '#boldform-setting-select-searchable' ).is( ':checked' );
				}
				if ( $( '#boldform-setting-show-middle-name' ).length ) {
					selected.field.show_middle_name = $( '#boldform-setting-show-middle-name' ).is( ':checked' );
				}
				if ( $( '#boldform-setting-show-last-name' ).length ) {
					selected.field.show_last_name = $( '#boldform-setting-show-last-name' ).is( ':checked' );
				}

				if ( $( '#boldform-setting-mask-pattern' ).length ) {
					var maskVal = $( '#boldform-setting-mask-pattern' ).val();
					selected.field.mask_pattern = maskVal === 'custom' ? ( selected.field.mask_pattern || '' ) : maskVal;
				}
				// Hidden field source.
				if ( $( '#boldform-setting-hidden-source' ).length ) {
					selected.field.hidden_source = $( '#boldform-setting-hidden-source' ).val();
					// Re-render panel so the value/param input shows or hides.
					renderSettingsPanel();
					setupOptionsSortable();
					setupAddressSortable();
					return;
				}

				// Image choice settings.
				if ( $( '#boldform-setting-ic-type' ).length ) {
					selected.field.image_choice_type = $( '#boldform-setting-ic-type' ).val();
				}
				if ( $( '#boldform-setting-ic-columns' ).length ) {
					selected.field.image_choice_columns = Number( $( '#boldform-setting-ic-columns' ).val() ) || 3;
				}

				// Repeater columns.
				if ( $( '#boldform-setting-rep-columns' ).length ) {
					selected.field.repeater_columns = Math.max( 1, Math.min( 4, Number( $( '#boldform-setting-rep-columns' ).val() ) || 2 ) );
				}

				// Password confirm toggle.
				if ( $( '#boldform-setting-pw-confirm' ).length ) {
					selected.field.confirm_password = $( '#boldform-setting-pw-confirm' ).is( ':checked' );
				}

				// Lookup allow custom.
				if ( $( '#boldform-setting-lookup-allow-custom' ).length ) {
					selected.field.lookup_allow_custom = $( '#boldform-setting-lookup-allow-custom' ).is( ':checked' );
				}

				// Geolocation show map.
				if ( $( '#boldform-setting-geo-show-map' ).length ) {
					selected.field.geo_show_map = $( '#boldform-setting-geo-show-map' ).is( ':checked' );
				}

				// Matrix type.
				if ( $( '#boldform-setting-matrix-type' ).length ) {
					selected.field.matrix_type = $( '#boldform-setting-matrix-type' ).val();
				}

				// Date range format.
				if ( $( '#boldform-setting-dr-format' ).length ) {
					selected.field.date_range_format = $( '#boldform-setting-dr-format' ).val();
				}

				// Geo store format.
				if ( $( '#boldform-setting-geo-store-format' ).length ) {
					selected.field.geo_store_format = $( '#boldform-setting-geo-store-format' ).val();
				}

				// Slider dual-handle toggle.
				if ( $( '#boldform-setting-dual-handle' ).length ) {
					selected.field.dual_handle = $( '#boldform-setting-dual-handle' ).is( ':checked' );
				}

				renderAll();
			}
		);

		// SVG icon upload via WP media library.
		$( document ).on( 'click', '#boldform-svg-upload-btn', function ( e ) {
			e.preventDefault();
			var frame = wp.media( {
				title: boldformLiteBuilder.labels.uploadSvg || 'Upload SVG',
				button: { text: boldformLiteBuilder.labels.useSvg || 'Use this SVG' },
				multiple: false,
				library: { type: 'image/svg+xml' }
			} );
			frame.on( 'select', function () {
				var attachment = frame.state().get( 'selection' ).first().toJSON();
				state.formSettings.button_icon_svg = attachment.url || '';
				renderAll();
			} );
			frame.open();
		} );

		// SVG icon remove.
		$( document ).on( 'click', '.boldform-svg-remove', function ( e ) {
			e.preventDefault();
			state.formSettings.button_icon_svg = '';
			renderAll();
		} );

		// Image Choice — open WP media library to pick image for an option.
		$( document ).on( 'click', '.boldform-ic-option__img-btn', function ( e ) {
			e.preventDefault();
			if ( typeof wp === 'undefined' || ! wp.media ) return;

			var $btn = $( this );
			var idx  = Number( $btn.data( 'ic-index' ) );

			var frame = wp.media( {
				title: 'Choose Image',
				button: { text: 'Use this image' },
				multiple: false,
				library: { type: 'image' }
			} );

			frame.on( 'select', function () {
				var attachment = frame.state().get( 'selection' ).first().toJSON();
				var url = attachment.url || '';
				var selected = getSelectedFieldLocation();
				if ( ! selected || ! Array.isArray( selected.field.image_choice_options ) ) return;
				if ( ! selected.field.image_choice_options[ idx ] ) return;

				selected.field.image_choice_options[ idx ].image_url = url;

				// Update the thumbnail in the button immediately.
				$btn.html( '<img src="' + escapeHtml( url ) + '" alt="">' );

				renderCanvas();
			} );

			frame.open();
		} );

		// Calculation — insert a field-reference chip into the formula editor.
		$( document ).on( 'change', '.bfcp-field-insert', function () {
			var val = $( this ).val();
			if ( !val ) return;
			var editor = document.getElementById( 'boldform-calc-formula' );
			if ( !editor ) return;
			editor.focus();
			bfCalcInsertChip( editor, val );
			$( editor ).trigger( 'input' ); // Sync model + canvas + validity.
			$( this ).val( '' ); // Reset dropdown.
		} );

		$( document ).on(
			'input change',
			'input[name="boldform-submit-mode"], #boldform-redirect-url, #boldform-redirect-custom-url, #boldform-thank-you-message, #boldform-enable-admin-email, #boldform-enable-user-email, input[name="boldform-admin-email-type"], #boldform-admin-email, #boldform-field-size-style, #boldform-field-border-style, #boldform-field-border-width, #boldform-field-border-radius, #boldform-field-background-color, #boldform-field-border-color, #boldform-field-text-color, #boldform-label-size-style, #boldform-label-color-style, #boldform-label-subtext-color-style, #boldform-error-color-style, #boldform-button-size-style, #boldform-button-border-style, #boldform-button-border-width, #boldform-button-border-radius, #boldform-button-background-color, #boldform-button-border-color, #boldform-button-text-color, #boldform-field-focus-color, #boldform-step-progress-style, #boldform-step-progress-color, #boldform-step-btn-color, #boldform-step-btn-text-color, #boldform-step-btn-size, #boldform-step-btn-radius, #boldform-step-next-text, #boldform-step-prev-text, #boldform-hide-labels, #boldform-hide-placeholders, #boldform-dup-enabled, input[name="boldform-dup-method"], #boldform-dup-field-id, #boldform-dup-message, #boldform-custom-css, #boldform-custom-js, .boldform-color-hex',
			function ( event ) {
				var needsRerender = false;

				if ( $( 'input[name="boldform-submit-mode"]' ).length ) {
					var mode = $( 'input[name="boldform-submit-mode"]:checked' ).val() || 'ajax';
					if ( 'ajax' === mode ) {
						state.formSettings.submission_type = 'ajax';
						state.formSettings.redirect_type = 'page';
					} else if ( 'page' === mode ) {
						state.formSettings.submission_type = 'redirect';
						state.formSettings.redirect_type = 'page';
					} else if ( 'custom_url' === mode ) {
						state.formSettings.submission_type = 'redirect';
						state.formSettings.redirect_type = 'custom';
					}
					state.formSettings.enable_ajax = 'ajax' === state.formSettings.submission_type;
					state.formSettings.enable_redirect = 'redirect' === state.formSettings.submission_type;
				}
				if ( $( '#boldform-redirect-url' ).length ) {
					state.formSettings.redirect_url = $( '#boldform-redirect-url' ).val() || '';
				} else if ( $( '#boldform-redirect-custom-url' ).length ) {
					state.formSettings.redirect_url = $( '#boldform-redirect-custom-url' ).val() || '';
				}
				// Read through the editor, not the textarea: while Visual is active the
				// textarea holds whatever it was seeded with, so a plain .val() here
				// would overwrite the live message every time an unrelated setting on
				// this panel changed.
				syncThankYouMessage();
				if ( $( '#boldform-enable-admin-email' ).length ) {
					state.formSettings.enable_admin_email = $( '#boldform-enable-admin-email' ).is( ':checked' );
				}
				if ( $( '#boldform-enable-user-email' ).length ) {
					state.formSettings.enable_user_email = $( '#boldform-enable-user-email' ).is( ':checked' );
				}
				if ( $( 'input[name="boldform-admin-email-type"]' ).length ) {
					state.formSettings.admin_email_type = $( 'input[name="boldform-admin-email-type"]:checked' ).val() || 'site_admin';
				}
				if ( $( '#boldform-admin-email' ).length ) {
					state.formSettings.admin_email = $( '#boldform-admin-email' ).val() || '';
				}
				if ( $( '#boldform-field-size-style' ).length ) {
					state.formSettings.field_size = $( '#boldform-field-size-style' ).val() || '';
				}
				if ( $( '#boldform-field-border-style' ).length ) {
					state.formSettings.field_style = $( '#boldform-field-border-style' ).val() || '';
				}
				if ( $( '#boldform-field-focus-color' ).length ) {
					state.formSettings.field_focus_color = $( '#boldform-field-focus-color' ).val() || '';
				}
				if ( $( '#boldform-field-border-width' ).length ) {
					state.formSettings.field_border_width = '' === $( '#boldform-field-border-width' ).val() ? '' : Number( $( '#boldform-field-border-width' ).val() );
				}
				if ( $( '#boldform-field-border-radius' ).length ) {
					state.formSettings.field_border_radius = '' === $( '#boldform-field-border-radius' ).val() ? '' : Number( $( '#boldform-field-border-radius' ).val() );
				}
				if ( $( '#boldform-field-background-color' ).length ) {
					state.formSettings.field_background_color = normalizeStyleColorValue( $( '#boldform-field-background-color' ).val() || '#ffffff', '#ffffff' );
				}
				if ( $( '#boldform-field-border-color' ).length ) {
					state.formSettings.field_border_color = normalizeStyleColorValue( $( '#boldform-field-border-color' ).val() || '#d1d5db', '#d1d5db' );
				}
				if ( $( '#boldform-field-text-color' ).length ) {
					state.formSettings.field_text_color = normalizeStyleColorValue( $( '#boldform-field-text-color' ).val() || '#111827', '#111827' );
				}
				if ( $( '#boldform-label-size-style' ).length ) {
					state.formSettings.label_size = $( '#boldform-label-size-style' ).val() || '';
				}
				if ( $( '#boldform-label-color-style' ).length ) {
					state.formSettings.label_color = normalizeStyleColorValue( $( '#boldform-label-color-style' ).val() || '#4b5563', '#4b5563' );
				}
				if ( $( '#boldform-label-subtext-color-style' ).length ) {
					state.formSettings.label_subtext_color = normalizeStyleColorValue( $( '#boldform-label-subtext-color-style' ).val() || '#6b7280', '#6b7280' );
				}
				if ( $( '#boldform-error-color-style' ).length ) {
					state.formSettings.error_color = normalizeStyleColorValue( $( '#boldform-error-color-style' ).val() || '#dc2626', '#dc2626' );
				}
				if ( $( '#boldform-button-size-style' ).length ) {
					state.formSettings.button_size = $( '#boldform-button-size-style' ).val() || '';
				}
				if ( $( '#boldform-button-border-style' ).length ) {
					state.formSettings.button_border_style = $( '#boldform-button-border-style' ).val() || '';
				}
				if ( $( '#boldform-button-border-width' ).length ) {
					state.formSettings.button_border_width = '' === $( '#boldform-button-border-width' ).val() ? '' : Number( $( '#boldform-button-border-width' ).val() );
				}
				if ( $( '#boldform-button-border-radius' ).length ) {
					state.formSettings.button_border_radius = '' === $( '#boldform-button-border-radius' ).val() ? '' : Number( $( '#boldform-button-border-radius' ).val() );
				}
				if ( $( '#boldform-button-background-color' ).length ) {
					state.formSettings.button_background_color = normalizeStyleColorValue( $( '#boldform-button-background-color' ).val() || '#2f80ed', '#2f80ed' );
				}
				if ( $( '#boldform-button-border-color' ).length ) {
					state.formSettings.button_border_color = normalizeStyleColorValue( $( '#boldform-button-border-color' ).val() || '#2f80ed', '#2f80ed' );
				}
				if ( $( '#boldform-button-text-color' ).length ) {
					state.formSettings.button_text_color = normalizeStyleColorValue( $( '#boldform-button-text-color' ).val() || '#ffffff', '#ffffff' );
				}

				// Duplicate prevention settings.
				if ( $( '#boldform-dup-enabled' ).length ) {
					state.formSettings.dup_enabled = $( '#boldform-dup-enabled' ).is( ':checked' );
				}
				if ( $( 'input[name="boldform-dup-method"]' ).length ) {
					state.formSettings.dup_method = $( 'input[name="boldform-dup-method"]:checked' ).val() || 'email';
				}
				if ( $( '#boldform-dup-field-id' ).length ) {
					state.formSettings.dup_field_id = $( '#boldform-dup-field-id' ).val() || '';
				}
				if ( $( '#boldform-dup-message' ).length ) {
					state.formSettings.dup_message = $( '#boldform-dup-message' ).val() || '';
				}
				if (
					$( event.target ).is( 'input[name="boldform-submit-mode"]' ) ||
					$( event.target ).is( '#boldform-enable-admin-email' ) ||
					$( event.target ).is( '#boldform-enable-user-email' ) ||
					$( event.target ).is( 'input[name="boldform-admin-email-type"]' ) ||
					$( event.target ).is( '#boldform-dup-enabled' ) ||
					$( event.target ).is( 'input[name="boldform-dup-method"]' )
				) {
					needsRerender = true;
				}

				renderCanvas();
				renderStylePreview();

				if ( needsRerender ) {
					renderFormSettings();
				}
			}
		);

		$( '#boldform-form-title' ).on(
			'input',
			function () {
				state.formTitle = $( this ).val();
			}
		);

		// Color picker → update swatch background + hex text input.
		// Excludes advanced (.bf-adv-colorpick) pickers — those have their own
		// alpha-aware handler that composes rgba() and paints the swatch overlay.
		$( document ).on( 'input', '.boldform-color-swatch input[type="color"]:not(.bf-adv-colorpick)', function () {
			var val = $( this ).val();
			$( this ).closest( '.boldform-color-swatch' ).css( 'background', val );
			$( '[data-color-for="' + $( this ).attr( 'id' ) + '"]' ).val( val );
		} );

		// Hex text input → update color picker + swatch background.
		$( document ).on( 'input', '.boldform-color-hex', function () {
			var val = $( this ).val().trim();
			if ( /^#[0-9a-fA-F]{6}$/.test( val ) ) {
				var pickerId = $( this ).data( 'color-for' );
				var $picker = $( '#' + pickerId );
				$picker.val( val );
				$( this ).closest( '.boldform-color-field' ).find( '.boldform-color-swatch' ).css( 'background', val );
				// Fire input event so field-settings handlers (signature colors, etc.) also update.
				if ( $picker.closest( '#boldform-settings-panel' ).length ) {
					$picker.trigger( 'input' );
				}
			}
		} );

		// Design theme card click.
		$( document ).on( 'click', '.boldform-theme-card', function () {
			bfApplyThemeWithConflictCheck( $( this ).data( 'theme' ) );
		} );

		// Choice card click — ensure radio toggles reliably on all browsers.
		$( document ).on( 'click', '.boldform-choice-card', function ( e ) {
			var $card = $( this );
			var $radio = $card.find( 'input[type="radio"]' );
			if ( ! $radio.length ) return;

			// Prevent double-fire: the label click already checks the radio natively,
			// so just ensure the change event propagates for the delegated handler.
			if ( ! $radio.prop( 'checked' ) ) {
				$radio.prop( 'checked', true );
			}
			$radio.trigger( 'change' );
		} );

		// Field library search.
		$( document ).on( 'input', '#boldform-field-search', function () {
			var q = $.trim( $( this ).val() ).toLowerCase();
			var $library = $( '#boldform-field-library' );
			var totalVisible = 0;

			if ( ! q ) {
				// Empty search — show everything, remove no-results.
				$library.find( '.boldform-library-item' ).css( 'display', '' );
				$library.find( '.boldform-library-group' ).css( 'display', '' );
				$( '#boldform-field-search-empty' ).hide();
				return;
			}

			// Filter items.
			$library.find( '.boldform-library-item' ).each( function () {
				var match = $( this ).text().toLowerCase().indexOf( q ) !== -1;
				$( this ).css( 'display', match ? '' : 'none' );
				if ( match ) totalVisible++;
			} );

			// Hide groups with zero visible items.
			$library.find( '.boldform-library-group' ).each( function () {
				var groupHasVisible = false;
				$( this ).find( '.boldform-library-item' ).each( function () {
					if ( $( this ).css( 'display' ) !== 'none' ) groupHasVisible = true;
				} );
				$( this ).css( 'display', groupHasVisible ? '' : 'none' );
			} );

			// No results message.
			if ( ! $( '#boldform-field-search-empty' ).length ) {
				$library.after( '<p id="boldform-field-search-empty" style="display:none;text-align:center;color:#9ca3af;font-size:13px;padding:16px 0;">No fields found.</p>' );
			}
			$( '#boldform-field-search-empty' ).css( 'display', totalVisible === 0 ? '' : 'none' );
		} );

		// Column layout change for existing rows.
		$( document ).on( 'click', '.boldform-row-layout-btn', function () {
			var rowIndex = state.selectedRowIndex;
			if ( rowIndex === null ) return;
			var row = getAllRows()[ rowIndex ];
			if ( ! row ) return;

			var newWidths = $( this ).data( 'widths' ).toString().split( ',' );
			var oldColumns = row.columns;
			var newColumns = [];

			// Build new columns — preserve existing fields by distributing them.
			newWidths.forEach( function ( width, i ) {
				if ( oldColumns[ i ] ) {
					newColumns.push( createColumn( width, oldColumns[ i ].fields ) );
				} else {
					newColumns.push( createColumn( width, [] ) );
				}
			} );

			// If new layout has fewer columns, move orphaned fields to the last column.
			if ( oldColumns.length > newWidths.length ) {
				var lastCol = newColumns[ newColumns.length - 1 ];
				for ( var i = newWidths.length; i < oldColumns.length; i++ ) {
					oldColumns[ i ].fields.forEach( function ( f ) {
						lastCol.fields.push( f );
					} );
				}
			}

			row.columns = newColumns;
			markDirty();
			setActiveColumn( rowIndex, 0 );
			renderAll();
		} );

		$( '#boldform-save-form' ).on(
			'click',
			function () {
				saveForm();
			}
		);

		// Any value edit in the builder (field settings, form settings, title, style
		// controls, option repeaters) marks the form dirty so Preview can warn about
		// unsaved changes. Structural changes (add/remove/move field & row, layout,
		// template import) are flagged in their mutation functions via markDirty().
		$( '#boldform-builder-main' ).on( 'input change', 'input, textarea, select', markDirty );

		// Preview button. The preview page renders the SAVED form from the database, so an
		// unsaved change can only be previewed by saving first. If there are unsaved changes
		// we ask the user (Save & Preview / Preview last saved / Cancel) instead of silently
		// saving; with no unsaved changes we navigate straight to the preview.
		function boldformPreviewUrl( formId ) {
			return 'admin.php?page=boldform-lite-preview&form_id=' + formId;
		}

		function boldformSaveThenPreview() {
			saveForm( function ( formId ) {
				if ( formId ) {
					window.location.href = boldformPreviewUrl( formId );
				}
			} );
		}

		function boldformShowPreviewUnsavedDialog() {
			$( '#boldform-preview-confirm' ).remove();

			// "Preview last saved" is only meaningful once the form has been saved at least once.
			var canPreviewSaved = !! state.formId;

			var $overlay = $(
				'<div id="boldform-preview-confirm" role="dialog" aria-modal="true" aria-labelledby="boldform-preview-confirm-title" ' +
					'style="position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55)">' +
					'<div style="background:#fff;max-width:460px;width:calc(100% - 40px);border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px">' +
						'<h2 id="boldform-preview-confirm-title" style="margin:0 0 8px;font-size:18px;line-height:1.3">' +
							escapeHtml( boldformLiteBuilder.labels && boldformLiteBuilder.labels.previewUnsavedTitle ? boldformLiteBuilder.labels.previewUnsavedTitle : 'You have unsaved changes' ) +
						'</h2>' +
						'<p style="margin:0 0 20px;color:#475569;line-height:1.5">' +
							escapeHtml( boldformLiteBuilder.labels && boldformLiteBuilder.labels.previewUnsavedBody ? boldformLiteBuilder.labels.previewUnsavedBody : 'The preview shows your saved form. Save your changes first to preview your latest work.' ) +
						'</p>' +
						'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">' +
							'<button type="button" class="button" data-bf-prev="cancel">' +
								escapeHtml( boldformLiteBuilder.labels && boldformLiteBuilder.labels.cancel ? boldformLiteBuilder.labels.cancel : 'Cancel' ) +
							'</button>' +
							( canPreviewSaved
								? '<button type="button" class="button" data-bf-prev="saved">' +
									escapeHtml( boldformLiteBuilder.labels && boldformLiteBuilder.labels.previewSaved ? boldformLiteBuilder.labels.previewSaved : 'Preview last saved' ) +
									'</button>'
								: '' ) +
							'<button type="button" class="button button-primary" data-bf-prev="save">' +
								escapeHtml( boldformLiteBuilder.labels && boldformLiteBuilder.labels.savePreview ? boldformLiteBuilder.labels.savePreview : 'Save & Preview' ) +
							'</button>' +
						'</div>' +
					'</div>' +
				'</div>'
			);

			function closeDialog() {
				$overlay.remove();
				$( document ).off( 'keydown.bfpreview' );
			}

			$overlay.on( 'click', function ( e ) {
				var action = $( e.target ).closest( '[data-bf-prev]' ).attr( 'data-bf-prev' );
				if ( e.target === $overlay[ 0 ] ) {
					action = 'cancel'; // clicked the backdrop
				}
				if ( ! action ) {
					return;
				}
				if ( 'cancel' === action ) {
					closeDialog();
				} else if ( 'saved' === action ) {
					window.location.href = boldformPreviewUrl( state.formId );
				} else if ( 'save' === action ) {
					closeDialog();
					boldformSaveThenPreview();
				}
			} );

			$( document ).on( 'keydown.bfpreview', function ( e ) {
				if ( 'Escape' === e.key ) {
					closeDialog();
				}
			} );

			$( 'body' ).append( $overlay );
			$overlay.find( '[data-bf-prev="save"]' ).trigger( 'focus' );
		}

		$( '#boldform-preview-form' ).on(
			'click',
			function ( event ) {
				event.preventDefault();

				if ( hasUnsavedChanges ) {
					boldformShowPreviewUnsavedDialog();
				} else if ( state.formId ) {
					window.location.href = boldformPreviewUrl( state.formId );
				} else {
					// Brand-new form never saved yet — save so there is something to preview.
					boldformSaveThenPreview();
				}
			}
		);

		$( '#boldform-builder-shortcode' ).on(
			'click',
			function () {
				copyShortcode();
			}
		);

		$( document ).on( 'click', '#boldform-add-row-canvas', function () {
			openRowModal();
		} );

		$( '#boldform-open-template-modal' ).on(
			'click',
			function () {
				openTemplateModal();
			}
		);

		$( document ).on(
			'click',
			'[data-template]',
			function () {
				applyTemplate( String( $( this ).data( 'template' ) || 'blank' ) );
			}
		);

		$( document ).on(
			'click',
			'[data-template-option]',
			function () {
				state.selectedTemplate = String( $( this ).data( 'template-option' ) || 'contact' );
				renderTemplateModal();
			}
		);

		// Accordion: toggle a template category open/closed on header click. Purely
		// DOM-driven (no re-render), so categories toggle independently — several can
		// be open at once, and the state persists until the modal is re-rendered.
		$( document ).on(
			'click',
			'[data-template-group-toggle]',
			function () {
				var open = $( this ).closest( '.boldform-template-group' )
					.toggleClass( 'is-open' )
					.hasClass( 'is-open' );
				$( this ).attr( 'aria-expanded', open ? 'true' : 'false' );
			}
		);


		$( document ).on(
			'click',
			'.boldform-preset',
			function () {
				var widths = String( $( this ).data( 'widths' ) ).split( ',' );

				addRow( widths );
				closeRowModal();
			}
		);

		$( document ).on(
			'click',
			'[data-boldform-close-modal]',
			function () {
				closeRowModal();
			}
		);

		$( document ).on(
			'click',
			'[data-boldform-close-template-modal]',
			function () {
				closeTemplateModal();
			}
		);

		if ( getAllRows().length ) {
			setActiveColumn( 0, 0 );
		}

		// --- Setup screen for new forms ---
		function closeSetupScreen() {
			$( '#boldform-setup-screen' ).attr( 'hidden', true );
			$( '#boldform-builder-main' ).removeAttr( 'hidden' );
		}

		$( document ).on( 'click', '#boldform-setup-blank', function () {
			closeSetupScreen();
			addRow( [ '100%' ] );
		} );

		$( document ).on( 'click', '#boldform-setup-template', function () {
			openTemplateModal();
		} );

		// Import template — also closes setup screen if open.
		$( '#boldform-import-template' ).on( 'click', function () {
			closeTemplateModal();
			if ( ! $( '#boldform-setup-screen' ).is( '[hidden]' ) ) {
				closeSetupScreen();
			}
			applyTemplate( state.selectedTemplate || 'contact' );
		} );

		updateShortcodeDisplay();
		renderAll();

		// Initial render is done — from here on, mutations count as unsaved changes.
		builderReady = true;

		// Canvas is rendered — remove the loading overlay shown for existing forms
		// so the real layout (or the empty state) is revealed without flashing the
		// "Start building your form" placeholder while this script downloaded.
		$( '#boldform-canvas-loading' ).fadeOut( 150, function () {
			$( this ).remove();
		} );

		// Expose builder state globally so companion scripts (integrations.js, Pro modules) can read it.
		window.boldformBuilderState = state;
	}
);
