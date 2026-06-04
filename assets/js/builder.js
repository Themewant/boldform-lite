jQuery(
	function ( $ ) {
		var optionFieldTypes = [ 'select', 'multiselect', 'checkbox', 'radio' ];
		var specialFieldTypes = [ 'captcha', 'section_break', 'terms_conditions', 'file', 'submit', 'paragraph', 'html_editor', 'name', 'address', 'product', 'quantity', 'custom_amount', 'order_summary', 'signature', 'hidden_field', 'image_choice', 'repeater', 'password_field', 'rich_text', 'date_range', 'nps', 'matrix', 'lookup', 'geolocation' ];
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
			selectedTemplate: 'contact'
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

			return {
				submission_type: submissionType,
				enable_ajax: 'ajax' === submissionType,
				enable_redirect: 'redirect' === submissionType,
				redirect_type: settings && settings.redirect_type ? settings.redirect_type : ( settings && settings.redirect_url ? 'custom' : 'page' ),
				redirect_url: settings && settings.redirect_url ? settings.redirect_url : '',
				thank_you_message: settings && settings.thank_you_message ? settings.thank_you_message : ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.thankYouMessage || 'Thanks! Your form was submitted successfully.' ),
				button_text: settings && settings.button_text ? settings.button_text : ( boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.submitText || 'Submit' ),
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
			};
		}

		function createField( type ) {
			var libraryItem = getLibraryItem( type );

			return {
				id: generateId(),
				type: type,
				label: libraryItem.label,
				placeholder: '',
				required: false,
				default_value: '',
				options: optionFieldTypes.indexOf( type ) !== -1 ? [ boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.option1 || 'Option 1', boldformLiteBuilder.defaults && boldformLiteBuilder.defaults.option2 || 'Option 2' ] : [],
				options_layout: optionFieldTypes.indexOf( type ) !== -1 ? 'block' : '',
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
				star_color: '#f59e0b',
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
				calc_suffix:   ''
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
			normalized.conditional = field && field.conditional ? {
				enabled: !! field.conditional.enabled,
				action: field.conditional.action || 'show',
				field_id: field.conditional.field_id || '',
				operator: field.conditional.operator || 'is',
				value: field.conditional.value || ''
			} : { enabled: false, action: 'show', field_id: '', operator: 'is', value: '' };
			normalized.select_searchable = !! ( field && field.select_searchable );
			normalized.select_multiple = !! ( field && field.select_multiple );
			normalized.mask_pattern = field && typeof field.mask_pattern !== 'undefined' ? field.mask_pattern : '';
			normalized.min_value = field && typeof field.min_value !== 'undefined' ? field.min_value : '';
			normalized.max_value = field && typeof field.max_value !== 'undefined' ? field.max_value : '';
			normalized.step_value = field && typeof field.step_value !== 'undefined' ? field.step_value : '';
			normalized.max_stars = field && field.max_stars ? Number( field.max_stars ) : 5;
			normalized.star_color = field && field.star_color ? field.star_color : '#f59e0b';
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
			normalized.image_choice_options    = ( function () {
				if ( ! field ) { return []; }
				if ( Array.isArray( field.image_choice_options ) ) { return field.image_choice_options; }
				if ( typeof field.image_choice_options === 'string' && field.image_choice_options ) {
					try { var p = JSON.parse( field.image_choice_options ); return Array.isArray( p ) ? p : []; } catch (e) { return []; }
				}
				return [];
			}() );
			normalized.image_choice_type       = field && field.image_choice_type === 'checkbox' ? 'checkbox' : 'radio';
			normalized.image_choice_columns    = field && field.image_choice_columns ? Number( field.image_choice_columns ) : 3;
			normalized.image_choice_img_height = field && field.image_choice_img_height ? Number( field.image_choice_img_height ) : 160;

			// Repeater field defaults.
			normalized.repeater_fields       = field && Array.isArray( field.repeater_fields )  ? field.repeater_fields  : [];
			normalized.repeater_min_rows     = field && field.repeater_min_rows ? Number( field.repeater_min_rows ) : 1;
			normalized.repeater_max_rows     = field && field.repeater_max_rows ? Number( field.repeater_max_rows ) : 5;
			normalized.repeater_add_label    = field && typeof field.repeater_add_label    !== 'undefined' ? field.repeater_add_label    : '';
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
			normalized.matrix_rows          = field && typeof field.matrix_rows    !== 'undefined' ? field.matrix_rows    : '["Row 1","Row 2","Row 3"]';
			normalized.matrix_columns       = field && typeof field.matrix_columns !== 'undefined' ? field.matrix_columns : '["Agree","Neutral","Disagree"]';
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

		function removeFieldAt( rowIndex, columnIndex, fieldIndex ) {
			var column = getColumn( rowIndex, columnIndex );

			if ( ! column || ! column.fields[ fieldIndex ] ) {
				return null;
			}

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
		}

		function addRow( widths ) {
			var row = createRow( widths );

			getAllRows().push( row );
			setActiveColumn( getAllRows().length - 1, 0 );
			switchEditorView( 'builder' );
			switchSidebarTab( 'library' );
			renderAll();
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
			setActiveColumn( rowIndex + 1, 0 );
			switchEditorView( 'builder' );
			renderAll();
		}

		function deleteRow( rowIndex ) {
			var rows = getAllRows();

			if ( ! rows[ rowIndex ] ) {
				return;
			}

			rows.splice( rowIndex, 1 );
			state.selectedFieldId = null;

			if ( rows.length ) {
				setActiveColumn( 0, 0 );
			} else {
				state.activeColumn = null;
			}

			switchSidebarTab( 'library' );
			renderAll();
		}

		function moveRow( oldIndex, newIndex ) {
			var rows = getAllRows();
			var row;

			if ( oldIndex === newIndex || ! rows[ oldIndex ] ) {
				return;
			}

			row = rows.splice( oldIndex, 1 )[ 0 ];
			rows.splice( newIndex, 0, row );
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
		}

		function addFieldToColumn( type, rowIndex, columnIndex, newIndex ) {
			if ( 'submit' === type && hasSubmitField() ) {
				return;
			}
			insertFieldAt( rowIndex, columnIndex, createField( type ), newIndex );
			state.selectedFieldId = null;
			switchEditorView( 'builder' );
			renderAll();
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
				var imgW = ( size && size !== '18' ) ? escapeHtml( size ) : '18';
				var imgStyle = 'width:' + imgW + 'px;height:' + imgW + 'px;display:inline-block;vertical-align:middle;flex-shrink:0;';
				if ( color ) {
					// Approximate color in builder preview via CSS filter.
					imgStyle += 'filter:var(--bf-svg-filter,none);';
				}
				icon = '<img src="' + escapeHtml( state.formSettings.button_icon_svg ) + '" class="boldform-btn-icon-svg" style="' + imgStyle + '" alt="">';
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
		}

		function renderInputPreview( field ) {
			var label = ( state.formSettings.hide_labels || 'hidden' === field.label_placement ) ? '' : '<label>' + escapeHtml( field.label || getLibraryItem( field.type ).label ) + ( field.required ? ' <span class="boldform-required">*</span>' : '' ) + '</label>';
			var html = '';

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
				return '<div class="boldform-canvas-submit is-inline"><button type="button" class="boldform-canvas-submit__button">' + buildButtonContent() + '</button></div>';
			} else if ( field.type === 'product' ) {
				var prodOpts = Array.isArray( field.product_options ) ? field.product_options : [];
				if ( 'select' === field.product_style ) {
					html += '<select style="pointer-events:none"><option>' + ( prodOpts.length ? escapeHtml( prodOpts[0].label || 'Select…' ) + ' — $' + escapeHtml( parseFloat( prodOpts[0].price || 0 ).toFixed( 2 ) ) : 'Select…' ) + '</option></select>';
				} else {
					html += '<div class="boldform-lite-form__choices">';
					prodOpts.slice( 0, 4 ).forEach( function ( opt, idx ) {
						html += '<label class="boldform-lite-form__choice"><input type="radio"' + ( 0 === idx ? ' checked' : '' ) + ' disabled><span>' + escapeHtml( opt.label || '' ) + ' <em style="color:var(--bf-focus-color,#0d9488);font-weight:600">— $' + escapeHtml( parseFloat( opt.price || 0 ).toFixed( 2 ) ) + '</em></span></label>';
					} );
					if ( prodOpts.length > 4 ) { html += '<label class="boldform-lite-form__choice" style="color:#9ca3af">…and ' + ( prodOpts.length - 4 ) + ' more</label>'; }
					html += '</div>';
				}
				return html;
			} else if ( field.type === 'quantity' ) {
				html += '<input type="number" value="' + escapeHtml( field.qty_default || '1' ) + '" min="' + escapeHtml( field.qty_min || '1' ) + '"' + ( field.qty_max ? ' max="' + escapeHtml( field.qty_max ) + '"' : '' ) + ' disabled style="width:120px;">';
				return html;
			} else if ( field.type === 'custom_amount' ) {
				var caMin = field.amount_min ? parseFloat( field.amount_min ) : 0;
				var caMax = field.amount_max ? parseFloat( field.amount_max ) : '';
				var caDefault = field.amount_default ? parseFloat( field.amount_default ) : 0;
				html += '<div style="display:flex;align-items:center;gap:4px;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;width:fit-content;">';
				html += '<span style="font-weight:600;color:#374151;">$</span>';
				html += '<input type="number" value="' + escapeHtml( caDefault.toFixed(2) ) + '" step="0.01"' + ( caMin > 0 ? ' min="' + caMin + '"' : '' ) + ( caMax !== '' ? ' max="' + caMax + '"' : '' ) + ' disabled style="border:none;outline:none;width:100px;">';
				html += '</div>';
				return html;
			} else if ( field.type === 'order_summary' ) {
				var osTotal = 0;
				html  = '<div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">';
				html += '<table style="width:100%;border-collapse:collapse;">';
				html += '<thead style="background:#f3f4f6;"><tr><th style="padding:8px 12px;text-align:left;">Item</th><th style="padding:8px 12px;text-align:right;">Price</th><th style="padding:8px 12px;text-align:right;">Qty</th><th style="padding:8px 12px;text-align:right;">Total</th></tr></thead>';
				html += '<tbody>';
				getAllFields().forEach( function ( pf ) {
					if ( pf.type === 'product' ) {
						var opts  = Array.isArray( pf.product_options ) ? pf.product_options : [];
						var first = opts[0] || {};
						var price = parseFloat( first.price || 0 );
						var lbl   = ( pf.label || 'Product' ) + ( first.label ? ' — ' + first.label : '' );
						osTotal += price;
						html += '<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;">' + escapeHtml( lbl ) + '</td><td style="padding:8px 12px;text-align:right;">$' + price.toFixed(2) + '</td><td style="padding:8px 12px;text-align:right;">1</td><td style="padding:8px 12px;text-align:right;">$' + price.toFixed(2) + '</td></tr>';
					} else if ( pf.type === 'custom_amount' ) {
						var ca = parseFloat( pf.amount_default || 0 );
						osTotal += ca;
						html += '<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;">' + escapeHtml( pf.label || 'Custom Amount' ) + '</td><td style="padding:8px 12px;text-align:right;">$' + ca.toFixed(2) + '</td><td style="padding:8px 12px;text-align:right;">1</td><td style="padding:8px 12px;text-align:right;">$' + ca.toFixed(2) + '</td></tr>';
					}
				} );
				html += '</tbody>';
				html += '<tfoot style="background:#f9fafb;border-top:2px solid #e5e7eb;"><tr><td colspan="3" style="padding:10px 12px;text-align:right;font-weight:600;">Order Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px;">$' + osTotal.toFixed(2) + '</td></tr></tfoot>';
				html += '</table>';
				html += '';
				html += '</div>';
				return html;
			} else if ( field.type === 'section_break' ) {
				html = '<div class="boldform-canvas-section-break"><strong>' + escapeHtml( field.label ) + '</strong><p>' + escapeHtml( field.description || '' ) + '</p></div>';
			} else if ( field.type === 'terms_conditions' ) {
				html = '<div class="boldform-canvas-terms"><input type="checkbox"' + ( field.required ? ' checked' : '' ) + '><div class="boldform-canvas-terms__copy">' + ( field.content || '' ) + '</div></div>';
			} else if ( field.type === 'captcha' ) {
				html = '<div class="boldform-canvas-field-note">' + escapeHtml( boldformLiteBuilder.labels.captchaNotice || 'This field will use the captcha provider selected in global settings.' ) + '</div>';
			} else if ( field.type === 'textarea' ) {
				html = '<textarea rows="3" placeholder="' + escapeHtml( field.placeholder ) + '">' + escapeHtml( field.default_value ) + '</textarea>';
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
				html = '<div class="boldform-canvas-field-choices' + ( 'inline' === field.options_layout ? ' is-inline' : '' ) + '">';
				field.options.forEach(
					function ( option ) {
						var isChecked = choiceDefaults.indexOf( $.trim( option ) ) !== -1;
						html += '<label class="boldform-choice"><input type="' + escapeHtml( field.type ) + '"' + ( isChecked ? ' checked' : '' ) + '> ' + escapeHtml( option ) + '</label>';
					}
				);
				html += '</div>';
			} else if ( field.type === 'input_mask' ) {
				html = '<input type="text" placeholder="' + escapeHtml( field.placeholder || field.mask_pattern ) + '" value="' + escapeHtml( field.default_value ) + '" disabled>';
			} else if ( field.type === 'html_editor' ) {
				html = '<div class="boldform-canvas-html-editor"><span class="dashicons dashicons-editor-code"></span> ' + escapeHtml( boldformLiteBuilder.labels.htmlEditor || 'Rich Text Editor' ) + '</div>';
			} else if ( field.type === 'paragraph' ) {
				html = '<div class="boldform-canvas-paragraph">' + escapeHtml( field.content || 'Paragraph text...' ) + '</div>';
			} else if ( field.type === 'numeric' ) {
				var numPlaceholder = field.placeholder || '';
				if ( field.min_value !== '' || field.max_value !== '' ) {
					numPlaceholder = numPlaceholder || ( ( field.min_value || '0' ) + ' - ' + ( field.max_value || '...' ) );
				}
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
				var starColor = field.star_color || '#f59e0b';
				var starSize = field.star_size || '20';
				html = '<div class="boldform-canvas-stars" style="--star-color:' + escapeHtml( starColor ) + ';--star-size:' + escapeHtml( starSize ) + 'px">';
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
					html += '<div class="boldform-canvas-calc-badge">= ' + escapeHtml(calcFormula) + '</div>';
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
				var icItems = icOpts.length ? icOpts : [
					{ label: 'Option 1', value: '1', image_url: '' },
					{ label: 'Option 2', value: '2', image_url: '' },
					{ label: 'Option 3', value: '3', image_url: '' }
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
				html  = '<div class="boldform-canvas-repeater">';
				html += '<div class="boldform-canvas-repeater__row">';
				if ( repFields.length ) {
					repFields.slice( 0, 4 ).forEach( function ( sf ) {
						html += '<div class="boldform-canvas-repeater__cell" title="' + escapeHtml( sf.label || sf.type || '' ) + '"></div>';
					} );
				} else {
					html += '<div class="boldform-canvas-repeater__cell"></div>';
					html += '<div class="boldform-canvas-repeater__cell"></div>';
					html += '<div class="boldform-canvas-repeater__cell"></div>';
				}
				html += '<div class="boldform-canvas-repeater__remove-placeholder"></div>';
				html += '</div>';
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
				var rteH = Math.max( 60, Math.round( ( field.rte_height || 200 ) * 0.4 ) );
				html  = '<div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">';
				html += '<div style="display:flex;gap:4px;padding:5px 8px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:12px">';
				html += '<span style="font-weight:700">B</span><span style="font-style:italic">I</span><span style="text-decoration:underline">U</span>';
				html += '<span style="margin:0 4px;border-left:1px solid #d1d5db"></span><span>&#8226; List</span>';
				html += '</div>';
				html += '<div style="min-height:' + rteH + 'px;padding:8px;color:#9ca3af;font-size:13px;font-style:italic">Rich text content…</div>';
				html += '</div>';

			} else if ( field.type === 'date_range' ) {
				html  = '<div style="position:relative;display:flex;align-items:center">';
				html += '<input type="text" placeholder="' + escapeHtml( field.placeholder || 'Select date range' ) + '" disabled style="width:100%;padding-right:32px">';
				html += '<span style="position:absolute;right:10px;color:#9ca3af"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>';
				html += '</div>';

			} else if ( field.type === 'nps' ) {
				html = '<div style="display:flex;gap:3px;flex-wrap:wrap">';
				for ( var npsI = 0; npsI <= 10; npsI++ ) {
					var npsColor = npsI <= 6 ? '#fee2e2' : ( npsI <= 8 ? '#fef9c3' : '#dcfce7' );
					var npsBorder = npsI <= 6 ? '#fca5a5' : ( npsI <= 8 ? '#fde047' : '#86efac' );
					html += '<div style="flex:1;min-width:20px;height:32px;border:1px solid ' + npsBorder + ';border-radius:4px;background:' + npsColor + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600">' + npsI + '</div>';
				}
				html += '</div>';
				html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;margin-top:4px">';
				html += '<span>' + escapeHtml( field.nps_low_label || 'Not likely' ) + '</span>';
				html += '<span>' + escapeHtml( field.nps_high_label || 'Extremely likely' ) + '</span>';
				html += '</div>';

			} else if ( field.type === 'matrix' ) {
				var matRows = [];
				var matCols = [];
				try { matRows = JSON.parse( field.matrix_rows || '[]' ); } catch(e) { matRows = [ 'Row 1', 'Row 2' ]; }
				try { matCols = JSON.parse( field.matrix_columns || '[]' ); } catch(e) { matCols = [ 'Col 1', 'Col 2' ]; }
				if ( ! matRows.length ) matRows = [ 'Row 1', 'Row 2' ];
				if ( ! matCols.length ) matCols = [ 'Col 1', 'Col 2' ];
				var matType = field.matrix_type || 'radio';
				html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
				html += '<thead><tr><th style="border:1px solid #e5e7eb;padding:4px 6px;background:#f9fafb"></th>';
				matCols.forEach( function(c) { html += '<th style="border:1px solid #e5e7eb;padding:4px 6px;background:#f9fafb;text-align:center">' + escapeHtml( c ) + '</th>'; } );
				html += '</tr></thead><tbody>';
				matRows.forEach( function(r) {
					html += '<tr><td style="border:1px solid #e5e7eb;padding:4px 8px;font-weight:500">' + escapeHtml( r ) + '</td>';
					matCols.forEach( function() { html += '<td style="border:1px solid #e5e7eb;text-align:center;padding:4px"><input type="' + matType + '" disabled></td>'; } );
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
				html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:0 10px;height:36px;background:#6366f1;color:#fff;border-radius:5px;font-size:12px;font-weight:500;white-space:nowrap">';
				html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg> Detect</span>';
				html += '</div>';
				if ( field.geo_show_map ) {
					var geoMapH = Math.max( 40, Math.round( ( field.geo_map_height || 250 ) * 0.3 ) );
					html += '<div style="margin-top:6px;height:' + geoMapH + 'px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px">Map preview</div>';
				}

			} else {
				html = '<input type="' + escapeHtml( field.type ) + '" placeholder="' + escapeHtml( field.placeholder ) + '" value="' + escapeHtml( field.default_value ) + '">';
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
			$( '#boldform-canvas' ).attr( 'style', getFormStyleVariables() );

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
							markup += '<div class="boldform-column-fields" data-row-index="' + rowIndex + '" data-column-index="' + columnIndex + '">';

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
							'<input type="color" id="boldform-setting-slider-color" value="' + escapeHtml( selected.field.slider_color || '#0f766e' ) + '">' +
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
					'<div class="boldform-setting-group">' +
						'<label for="boldform-setting-max-stars">' + escapeHtml( boldformLiteBuilder.labels.maxStars || 'Number of Stars' ) + '</label>' +
						'<input type="number" id="boldform-setting-max-stars" value="' + escapeHtml( selected.field.max_stars || 5 ) + '" min="1" max="10" placeholder="5">' +
					'</div>' +
					'<div class="boldform-setting-row">' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-star-color">' + escapeHtml( boldformLiteBuilder.labels.starColor || 'Star Color' ) + '</label>' +
							'<input type="color" id="boldform-setting-star-color" value="' + escapeHtml( selected.field.star_color || '#f59e0b' ) + '">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-star-size">' + escapeHtml( boldformLiteBuilder.labels.starSize || 'Star Size (px)' ) + '</label>' +
							'<input type="number" id="boldform-setting-star-size" value="' + escapeHtml( selected.field.star_size || '20' ) + '" min="16" max="60" placeholder="20">' +
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
					'</div>' +
					( specialFieldTypes.indexOf( selected.field.type ) !== -1 ? '' :
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
						allFields.forEach( function ( f ) {
							if ( f.type === 'calculation' || !f.id ) return;
							refOpts += '<option value="' + escapeHtml( f.id ) + '">' + escapeHtml( f.label || f.id ) + ' — {' + escapeHtml( f.id ) + '}</option>';
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
									'<textarea class="bfcp-formula-input ' + valClass + '" id="boldform-calc-formula" rows="3" placeholder="{field_id} * 2">' + escapeHtml( formula ) + '</textarea>' +
									'<div class="bfcp-formula-help">Use {field_id} to reference a field value. Supports +, -, *, /, ( ).</div>' +
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
							repRowsHtml +=
								'<div class="boldform-rep-field-row" data-rep-index="' + idx + '">' +
									'<select class="boldform-rep-field__type" data-rep-index="' + idx + '">' +
										[ 'text','email','number','tel','textarea','select','date' ].map( function (t) {
											return '<option value="' + t + '"' + ( t === ( sf.type || 'text' ) ? ' selected' : '' ) + '>' + t + '</option>';
										} ).join('') +
									'</select>' +
									'<input type="text" class="boldform-rep-field__label" data-rep-index="' + idx + '" value="' + escapeHtml( sf.label || '' ) + '" placeholder="Label">' +
									'<button type="button" class="boldform-rep-field__remove" data-rep-index="' + idx + '" title="Remove"><span class="dashicons dashicons-no-alt"></span></button>' +
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
						'</div>'
					: '' ) +

					// --- Matrix settings ---
					( 'matrix' === selected.field.type ? ( function () {
						var mRows = [];
						var mCols = [];
						try { mRows = JSON.parse( selected.field.matrix_rows || '["Row 1","Row 2","Row 3"]' ); } catch(e) { mRows = [ 'Row 1', 'Row 2', 'Row 3' ]; }
						try { mCols = JSON.parse( selected.field.matrix_columns || '["Agree","Neutral","Disagree"]' ); } catch(e) { mCols = [ 'Agree', 'Neutral', 'Disagree' ]; }
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
					'</div>' +
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
						'<label for="boldform-thank-you-message">' + escapeHtml( boldformLiteBuilder.labels.thankYouMessage ) + '</label>' +
						'<textarea id="boldform-thank-you-message" rows="4">' + escapeHtml( state.formSettings.thank_you_message ) + '</textarea>' +
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
				{ id: 'confirmation',  icon: '&#10003;', label: escapeHtml( boldformLiteBuilder.labels.tabConfirmation  || 'Confirmation' ),      desc: escapeHtml( boldformLiteBuilder.labels.tabConfirmationDesc  || 'Redirect or message' ) },
				{ id: 'email',         icon: '&#9993;',  label: escapeHtml( boldformLiteBuilder.labels.tabEmail         || 'Email Notification' ), desc: escapeHtml( boldformLiteBuilder.labels.tabEmailDesc         || 'Admin & user emails' ) },
				{ id: 'security',      icon: '&#128274;', label: 'Security',       desc: 'Duplicate prevention' }
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

			// Restore the previously active tab (Pro panes are now injected above).
			var $restore = $panel.find( '.bfs-stab-nav-item[data-stab="' + activeSettingsTab + '"]' );
			if ( ! $restore.length ) {
				// Fallback to first tab if the stored tab no longer exists.
				$restore = $panel.find( '.bfs-stab-nav-item' ).first();
				activeSettingsTab = $restore.data( 'stab' ) || 'confirmation';
			}
			$restore.addClass( 'is-active' );
			$panel.find( '.bfs-stab-pane[data-pane="' + activeSettingsTab + '"]' ).addClass( 'is-active' );
		}

		var designThemes = {
			'default-blue':   { label: 'Default Blue',   primary: '#2f80ed', focus: '#2f80ed', btnBg: '#2f80ed', btnText: '#fff', fieldBorder: '#d1d5db', fieldBg: '#fff', fieldRadius: 16 },
			'ocean-teal':     { label: 'Ocean Teal',     primary: '#0f766e', focus: '#0f766e', btnBg: '#0f766e', btnText: '#fff', fieldBorder: '#d1d5db', fieldBg: '#fff', fieldRadius: 16 },
			'forest-green':   { label: 'Forest Green',   primary: '#16a34a', focus: '#16a34a', btnBg: '#16a34a', btnText: '#fff', fieldBorder: '#d1d5db', fieldBg: '#fff', fieldRadius: 12 },
			'sunset-orange':  { label: 'Sunset Orange',  primary: '#ea580c', focus: '#ea580c', btnBg: '#ea580c', btnText: '#fff', fieldBorder: '#e5e7eb', fieldBg: '#fff', fieldRadius: 8 },
			'royal-purple':   { label: 'Royal Purple',   primary: '#7c3aed', focus: '#7c3aed', btnBg: '#7c3aed', btnText: '#fff', fieldBorder: '#d1d5db', fieldBg: '#fff', fieldRadius: 12 },
			'midnight-dark':  { label: 'Midnight Dark',  primary: '#1e293b', focus: '#334155', btnBg: '#1e293b', btnText: '#fff', fieldBorder: '#475569', fieldBg: '#f8fafc', fieldRadius: 8 },
			'minimal-gray':   { label: 'Minimal Gray',   primary: '#6b7280', focus: '#6b7280', btnBg: '#374151', btnText: '#fff', fieldBorder: '#e5e7eb', fieldBg: '#f9fafb', fieldRadius: 4 },
			'rose-pink':      { label: 'Rose Pink',      primary: '#e11d48', focus: '#e11d48', btnBg: '#e11d48', btnText: '#fff', fieldBorder: '#fecdd3', fieldBg: '#fff1f2', fieldRadius: 16 }
		};

		function applyDesignTheme( themeKey ) {
			var theme = designThemes[ themeKey ];
			if ( ! theme ) return;
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

		function renderStylingSettings() {
			function colorField( id, label, value, fallback ) {
				var displayVal = value || '';
				var colorVal = displayVal || fallback;
				return '<div class="boldform-setting-group">' +
					'<label for="' + id + '">' + escapeHtml( label ) + '</label>' +
					'<div class="boldform-color-field">' +
						'<div class="boldform-color-swatch" style="background:' + escapeHtml( colorVal ) + '">' +
							'<input type="color" id="' + id + '" value="' + escapeHtml( colorVal ) + '">' +
						'</div>' +
						'<input type="text" class="boldform-color-hex" maxlength="7" value="' + escapeHtml( colorVal ) + '" data-color-for="' + escapeHtml( id ) + '" spellcheck="false">' +
					'</div>' +
				'</div>';
			}

			// Build theme cards.
			var themeCardsHtml = '<div class="boldform-theme-grid">';
			Object.keys( designThemes ).forEach( function ( key ) {
				var t = designThemes[ key ];
				var isActive = state.formSettings.design_theme === key;
				themeCardsHtml += '<button type="button" class="boldform-theme-card' + ( isActive ? ' is-active' : '' ) + '" data-theme="' + escapeHtml( key ) + '">' +
					'<span class="boldform-theme-card__preview">' +
						'<span class="boldform-theme-card__input" style="border-color:' + escapeHtml( t.fieldBorder ) + ';background:' + escapeHtml( t.fieldBg ) + ';border-radius:' + t.fieldRadius + 'px"></span>' +
						'<span class="boldform-theme-card__btn" style="background:' + escapeHtml( t.btnBg ) + ';color:' + escapeHtml( t.btnText ) + ';border-radius:' + Math.min( t.fieldRadius, 8 ) + 'px"></span>' +
					'</span>' +
					'<span class="boldform-theme-card__name">' + escapeHtml( t.label ) + '</span>' +
				'</button>';
			} );
			themeCardsHtml += '</div>';

			$( '#boldform-form-styling-panel' ).html(
				'<div class="boldform-style-section is-open">' +
					'<div class="boldform-style-section__head"><h3>Design Theme</h3><span class="dashicons dashicons-arrow-down-alt2"></span></div>' +
					'<div class="boldform-style-section__body">' + themeCardsHtml + '</div>' +
				'</div>' +
				'<div class="boldform-style-section">' +
					'<div class="boldform-style-section__head"><h3>' + escapeHtml( boldformLiteBuilder.labels.fieldStyles ) + '</h3><span class="dashicons dashicons-arrow-down-alt2"></span></div>' +
					'<div class="boldform-style-section__body">' +
						'<div class="boldform-style-grid">' +
							'<div class="boldform-setting-group"><label for="boldform-field-size-style">' + escapeHtml( boldformLiteBuilder.labels.size ) + '</label><select id="boldform-field-size-style"><option value="small"' + ( 'small' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.small ) + '</option><option value="medium"' + ( 'medium' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.medium ) + '</option><option value="large"' + ( 'large' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.large ) + '</option></select></div>' +
							'<div class="boldform-setting-group"><label for="boldform-field-border-style">' + escapeHtml( boldformLiteBuilder.labels.border ) + '</label><select id="boldform-field-border-style"><option value="">' + escapeHtml( boldformLiteBuilder.labels.defaultStyle ) + '</option><option value="solid"' + ( 'solid' === state.formSettings.field_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.solid ) + '</option><option value="dashed"' + ( 'dashed' === state.formSettings.field_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.dashed ) + '</option><option value="none"' + ( 'none' === state.formSettings.field_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.none ) + '</option></select></div>' +
							'<div class="boldform-setting-group"><label for="boldform-field-border-width">' + escapeHtml( boldformLiteBuilder.labels.borderSize ) + '</label><div class="boldform-style-input-wrap"><input type="number" id="boldform-field-border-width" min="0" max="10" value="' + escapeHtml( state.formSettings.field_border_width ) + '"><span>px</span></div></div>' +
							'<div class="boldform-setting-group"><label for="boldform-field-border-radius">' + escapeHtml( boldformLiteBuilder.labels.borderRadius ) + '</label><div class="boldform-style-input-wrap"><input type="number" id="boldform-field-border-radius" min="0" max="50" value="' + escapeHtml( state.formSettings.field_border_radius ) + '"><span>px</span></div></div>' +
						'</div>' +
						'<div class="boldform-style-color-grid">' +
							colorField( 'boldform-field-background-color', boldformLiteBuilder.labels.background, state.formSettings.field_background_color, '#ffffff' ) +
							colorField( 'boldform-field-border-color', boldformLiteBuilder.labels.border, state.formSettings.field_border_color, '#d1d5db' ) +
							colorField( 'boldform-field-text-color', boldformLiteBuilder.labels.text, state.formSettings.field_text_color, '#111827' ) +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="boldform-style-section">' +
					'<div class="boldform-style-section__head"><h3>' + escapeHtml( boldformLiteBuilder.labels.labelStyles ) + '</h3><span class="dashicons dashicons-arrow-down-alt2"></span></div>' +
					'<div class="boldform-style-section__body">' +
						'<div class="boldform-style-color-grid">' +
							colorField( 'boldform-label-color-style', boldformLiteBuilder.labels.label, state.formSettings.label_color, '#4b5563' ) +
							colorField( 'boldform-label-subtext-color-style', boldformLiteBuilder.labels.subLabel, state.formSettings.label_subtext_color, '#6b7280' ) +
							colorField( 'boldform-error-color-style', boldformLiteBuilder.labels.error, state.formSettings.error_color, '#dc2626' ) +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="boldform-style-section">' +
					'<div class="boldform-style-section__head"><h3>' + escapeHtml( boldformLiteBuilder.labels.buttonStyles ) + '</h3><span class="dashicons dashicons-arrow-down-alt2"></span></div>' +
					'<div class="boldform-style-section__body">' +
						'<div class="boldform-style-grid">' +
							'<div class="boldform-setting-group"><label for="boldform-button-size-style">' + escapeHtml( boldformLiteBuilder.labels.size ) + '</label><select id="boldform-button-size-style"><option value="small"' + ( 'small' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.small ) + '</option><option value="medium"' + ( 'medium' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.medium ) + '</option><option value="large"' + ( 'large' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.large ) + '</option></select></div>' +
							'<div class="boldform-setting-group"><label for="boldform-button-border-style">' + escapeHtml( boldformLiteBuilder.labels.border ) + '</label><select id="boldform-button-border-style"><option value="">' + escapeHtml( boldformLiteBuilder.labels.defaultStyle ) + '</option><option value="none"' + ( 'none' === state.formSettings.button_border_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.none ) + '</option><option value="solid"' + ( 'solid' === state.formSettings.button_border_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.solid ) + '</option><option value="dashed"' + ( 'dashed' === state.formSettings.button_border_style ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.dashed ) + '</option></select></div>' +
							'<div class="boldform-setting-group"><label for="boldform-button-border-width">' + escapeHtml( boldformLiteBuilder.labels.borderSize ) + '</label><div class="boldform-style-input-wrap"><input type="number" id="boldform-button-border-width" min="0" max="10" value="' + escapeHtml( state.formSettings.button_border_width ) + '"><span>px</span></div></div>' +
							'<div class="boldform-setting-group"><label for="boldform-button-border-radius">' + escapeHtml( boldformLiteBuilder.labels.borderRadius ) + '</label><div class="boldform-style-input-wrap"><input type="number" id="boldform-button-border-radius" min="0" max="50" value="' + escapeHtml( state.formSettings.button_border_radius ) + '"><span>px</span></div></div>' +
						'</div>' +
						'<div class="boldform-style-color-grid">' +
							colorField( 'boldform-button-background-color', boldformLiteBuilder.labels.background, state.formSettings.button_background_color, '#2f80ed' ) +
							colorField( 'boldform-button-border-color', boldformLiteBuilder.labels.border, state.formSettings.button_border_color, '#2f80ed' ) +
							colorField( 'boldform-button-text-color', boldformLiteBuilder.labels.text, state.formSettings.button_text_color, '#ffffff' ) +
						'</div>' +
					'</div>' +
				'</div>' +
				''
			);
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
		}

		function renderRowPresets() {
			var markup = '';

			( boldformLiteBuilder.columnPresets || [] ).forEach(
				function ( preset ) {
					markup += '<button type="button" class="boldform-preset" data-columns="' + escapeHtml( preset.value ) + '" data-widths="' + escapeHtml( preset.widths.join( ',' ) ) + '">';
					markup += '<strong>' + escapeHtml( preset.label ) + '</strong>';
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
				openRowModal();
				return;
			}

			// normalizeStructure runs each field through normalizeField() which assigns
			// IDs and fills in all defaults — required for Pro templates that arrive as
			// plain PHP-serialized objects without pre-generated IDs.
			state.structure = normalizeStructure( { rows: template.rows } );
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

		function renderTemplateModal() {
			var templates = getAllTemplateDefinitions();

			var selectedKey = templates[ state.selectedTemplate ]
				? state.selectedTemplate
				: 'contact';
			var selectedTemplate = templates[ selectedKey ];
			var listMarkup = '';
			var previewMarkup = '';

			// Group templates by category.
			var grouped = {};
			Object.keys( tplCategories ).forEach( function ( cat ) { grouped[ cat ] = []; } );
			Object.keys( templates ).forEach( function ( key ) {
				var cat = tplCategoryMap[ key ] || 'general';
				if ( ! grouped[ cat ] ) grouped[ cat ] = [];
				grouped[ cat ].push( key );
			} );

			Object.keys( grouped ).forEach( function ( cat ) {
				if ( ! grouped[ cat ].length ) return;
				listMarkup += '<div class="boldform-template-group">';
				listMarkup += '<div class="boldform-template-group__title">' + escapeHtml( tplCategories[ cat ] ) + '</div>';
				grouped[ cat ].forEach( function ( key ) {
					var tpl = templates[ key ];
					var isActive = key === selectedKey;
					listMarkup += '<button type="button" class="boldform-template-option' +
						( isActive ? ' is-active' : '' ) +
						'" data-template-option="' + escapeHtml( key ) + '">';
					listMarkup += '<span class="boldform-tpl-option-label"><strong>' + escapeHtml( tpl.title ) + '</strong></span>';
					listMarkup += '</button>';
				} );
				listMarkup += '</div>';
			} );

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
			$( '#boldform-template-preview-canvas' ).attr( 'style', getFormStyleVariables() );
			$( '#boldform-template-preview__head' ).html(
				'<h3>' + escapeHtml( selectedTemplate.title ) + '</h3>' +
				'<p>' + escapeHtml( selectedTemplate.description ) + '</p>'
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

		function saveForm() {
			var $save = $( '#boldform-save-form' );
			var title = $.trim( $( '#boldform-form-title' ).val() ) || boldformLiteBuilder.defaultFormTitle;
			var payload;

			if ( ! getAllRows().length ) {
				$( '#boldform-builder-status' ).text( boldformLiteBuilder.messages.emptyFields );
				return;
			}

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

			$( '.boldform-library-grid' ).each(
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

		// Style section collapse toggle.
		$( document ).on( 'click', '.boldform-style-section__head', function () {
			$( this ).closest( '.boldform-style-section' ).toggleClass( 'is-open' );
		} );

		// Field setting accordion toggle (only one open at a time).
		$( document ).on( 'click', '.boldform-field-accordion__head', function () {
			var $accordion = $( this ).closest( '.boldform-field-accordion' );
			var isOpen = $accordion.hasClass( 'is-open' );
			$accordion.siblings( '.boldform-field-accordion' ).removeClass( 'is-open' );
			$accordion.toggleClass( 'is-open', ! isOpen );
			state.activeSettingsAccordion = ! isOpen ? ( $accordion.data( 'accordion' ) || 'settings' ) : 'settings';
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
			renderCanvas();
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
			'#boldform-setting-label, #boldform-setting-placeholder, #boldform-setting-default, #boldform-setting-button-text, #boldform-setting-content, #boldform-setting-description, #boldform-setting-custom-error, #boldform-setting-allowed-types, #boldform-setting-max-file-size, #boldform-setting-button-icon-gap, #boldform-setting-css-class, #boldform-setting-auto-populate-key, #boldform-setting-min-value, #boldform-setting-max-value, #boldform-setting-step-value, #boldform-setting-mask-custom, #boldform-setting-star-color, #boldform-setting-star-size, #boldform-setting-slider-color, #boldform-setting-slider-height, #boldform-setting-step-title, #boldform-setting-next-text, #boldform-setting-prev-text, #boldform-setting-btn-color, #boldform-setting-btn-text-color, #boldform-setting-btn-size, #boldform-setting-btn-radius, #boldform-setting-progress-color, #boldform-setting-progress-style, #boldform-setting-button-icon-size, #boldform-setting-button-icon-color, #boldform-step-progress-style-field, #boldform-setting-product-style, #boldform-setting-qty-linked-product, #boldform-setting-qty-min, #boldform-setting-qty-max, #boldform-setting-qty-default, #boldform-setting-amount-min, #boldform-setting-amount-max, #boldform-setting-amount-default, #boldform-calc-formula, #boldform-calc-decimals, #boldform-calc-prefix, #boldform-calc-suffix, #boldform-setting-sig-pen-color, #boldform-setting-sig-pen-width, #boldform-setting-sig-bg-color, #boldform-setting-sig-height, #boldform-setting-hidden-value, #boldform-setting-rep-min, #boldform-setting-rep-max, #boldform-setting-rep-add-label, #boldform-setting-rep-remove-label, #boldform-setting-ic-img-height',
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
						state.formSettings.button_icon_color = $( '#boldform-setting-button-icon-color' ).val() || '';
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
				if ( $( '#boldform-setting-star-color' ).length ) {
					selected.field.star_color = $( '#boldform-setting-star-color' ).val();
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
				if ( $( '#boldform-calc-formula' ).length ) {
					selected.field.calc_formula = $( '#boldform-calc-formula' ).val();
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
			'#boldform-setting-required, #boldform-setting-button-icon-type, #boldform-setting-button-icon-dashicon, #boldform-setting-button-icon-position, #boldform-setting-button-color-global, #boldform-setting-options-layout, #boldform-setting-select-searchable, #boldform-setting-mask-pattern, #boldform-setting-max-stars, #boldform-setting-show-middle-name, #boldform-setting-show-last-name, #boldform-setting-hidden-source, #boldform-setting-ic-type, #boldform-setting-ic-columns, #boldform-setting-pw-confirm, #boldform-setting-lookup-allow-custom, #boldform-setting-geo-show-map, #boldform-setting-matrix-type, #boldform-setting-dr-format, #boldform-setting-geo-store-format, #boldform-setting-dual-handle',
			function () {
				var selected = getSelectedFieldLocation();
				var isSubmitSel = state.selectedFieldId === submitButtonId || ( selected && selected.field && 'submit' === selected.field.type );

				if ( isSubmitSel ) {
					state.formSettings.button_icon_type = $( '#boldform-setting-button-icon-type' ).val() || 'none';
					if ( $( '#boldform-setting-button-icon-dashicon' ).length ) {
						state.formSettings.button_icon_dashicon = $( '#boldform-setting-button-icon-dashicon' ).val() || 'dashicons-arrow-right-alt';
					}
					state.formSettings.button_icon_position = $( '#boldform-setting-button-icon-position' ).val() || 'right';
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
				if ( $( '#boldform-setting-max-stars' ).length ) {
					selected.field.max_stars = Number( $( '#boldform-setting-max-stars' ).val() ) || 5;
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

		// Calculation — insert field reference into formula textarea.
		$( document ).on( 'change', '.bfcp-field-insert', function () {
			var val = $( this ).val();
			if ( !val ) return;
			var $textarea = $( '#boldform-calc-formula' );
			if ( !$textarea.length ) return;
			var pos = $textarea[0].selectionStart;
			var current = $textarea.val();
			var insertion = '{' + val + '}';
			$textarea.val( current.slice( 0, pos ) + insertion + current.slice( pos ) );
			var newPos = pos + insertion.length;
			$textarea[0].setSelectionRange( newPos, newPos );
			$textarea.trigger( 'input' ).focus();
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
				if ( $( '#boldform-thank-you-message' ).length ) {
					state.formSettings.thank_you_message = $( '#boldform-thank-you-message' ).val() || '';
				}
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
					$( event.target ).is( 'input[name="boldform-admin-email-type"]' ) ||
					$( event.target ).is( '#boldform-dup-enabled' ) ||
					$( event.target ).is( 'input[name="boldform-dup-method"]' )
				) {
					needsRerender = true;
				}

				renderCanvas();

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
		$( document ).on( 'input', '.boldform-color-swatch input[type="color"]', function () {
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
			applyDesignTheme( $( this ).data( 'theme' ) );
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
			setActiveColumn( rowIndex, 0 );
			renderAll();
		} );

		$( '#boldform-save-form' ).on(
			'click',
			function () {
				saveForm();
			}
		);

		$( '#boldform-builder-shortcode' ).on(
			'click',
			function () {
				copyShortcode();
			}
		);

		$( '#boldform-add-row, #boldform-add-row-inline, #boldform-empty-add-row' ).on(
			'click',
			function () {
				switchEditorView( 'builder' );
				openRowModal();
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

		// Expose builder state globally so companion scripts (integrations.js, Pro modules) can read it.
		window.boldformBuilderState = state;
	}
);
