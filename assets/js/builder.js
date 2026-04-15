jQuery(
	function ( $ ) {
		var optionFieldTypes = [ 'select', 'multiselect', 'checkbox', 'radio' ];
		var specialFieldTypes = [ 'captcha', 'section_break', 'terms_conditions', 'file', 'submit', 'paragraph', 'html_editor', 'name', 'address', 'page_break' ];
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

		function escapeHtml( value ) {
			return $( '<div />' ).text( value || '' ).html();
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
				field_size: settings && settings.field_size ? settings.field_size : '',
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
				button_size: settings && settings.button_size ? settings.button_size : '',
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
				step_progress_style: settings && settings.step_progress_style ? settings.step_progress_style : 'bar',
				step_progress_color: settings && settings.step_progress_color ? settings.step_progress_color : '',
				step_btn_color: settings && settings.step_btn_color ? settings.step_btn_color : '',
				step_btn_text_color: settings && settings.step_btn_text_color ? settings.step_btn_text_color : '',
				step_btn_size: settings && settings.step_btn_size ? settings.step_btn_size : 'medium',
				step_btn_radius: settings && settings.step_btn_radius !== '' && typeof settings.step_btn_radius !== 'undefined' ? Number( settings.step_btn_radius ) : '',
				step_next_text: settings && settings.step_next_text ? settings.step_next_text : 'Next',
				step_prev_text: settings && settings.step_prev_text ? settings.step_prev_text : 'Previous',
				design_theme: settings && settings.design_theme ? settings.design_theme : '',
				hide_labels: false,
				hide_placeholders: false
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
				star_size: '28',
				slider_color: '',
				slider_height: '',
				step_title: '',
				next_text: 'page_break' === type ? 'Next' : '',
				prev_text: 'page_break' === type ? 'Previous' : '',
				btn_color: '',
				btn_text_color: '',
				btn_size: 'page_break' === type ? 'medium' : '',
				btn_radius: '',
				progress_color: '',
				progress_style: 'page_break' === type ? 'bar' : ''
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
			normalized.star_size = field && field.star_size ? field.star_size : '28';
			normalized.slider_color = field && field.slider_color ? field.slider_color : '';
			normalized.slider_height = field && field.slider_height ? field.slider_height : '';
			normalized.step_title = field && typeof field.step_title !== 'undefined' ? field.step_title : '';
			normalized.next_text = field && typeof field.next_text !== 'undefined' ? field.next_text : 'Next';
			normalized.prev_text = field && typeof field.prev_text !== 'undefined' ? field.prev_text : 'Previous';
			normalized.btn_color = field && typeof field.btn_color !== 'undefined' ? field.btn_color : '';
			normalized.btn_text_color = field && typeof field.btn_text_color !== 'undefined' ? field.btn_text_color : '';
			normalized.btn_size = field && typeof field.btn_size !== 'undefined' ? field.btn_size : 'medium';
			normalized.btn_radius = field && typeof field.btn_radius !== 'undefined' ? field.btn_radius : '';
			normalized.progress_color = field && typeof field.progress_color !== 'undefined' ? field.progress_color : '';
			normalized.progress_style = field && typeof field.progress_style !== 'undefined' ? field.progress_style : 'bar';

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
			} else if ( field.type === 'page_break' ) {
				html = '<div class="boldform-canvas-page-break"><span class="dashicons dashicons-layout"></span> ' + escapeHtml( field.label || 'Page Break' ) + ( field.step_title ? ' — <em>' + escapeHtml( field.step_title ) + '</em>' : '' ) + '</div>';
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
				html += '<span class="bf-select__arrow"></span>';
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
				html += '<span class="bf-select__arrow"></span>';
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
				html += '<span class="bf-select__arrow"></span>';
				html += '</div></div>';
			} else if ( field.type === 'star_rating' ) {
				var maxStars = field.max_stars || 5;
				var defRating = Number( field.default_value ) || 0;
				var starColor = field.star_color || '#f59e0b';
				var starSize = field.star_size || '28';
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
				html = '<div class="boldform-canvas-slider"' + ( slStyle ? ' style="' + slStyle + '"' : '' ) + '>';
				html += '<input type="range" min="' + escapeHtml( slMin ) + '" max="' + escapeHtml( slMax ) + '" value="' + escapeHtml( slVal ) + '" disabled>';
				html += '<div class="boldform-canvas-slider__labels"><span>' + escapeHtml( slMin ) + '</span><span>' + escapeHtml( slVal ) + '</span><span>' + escapeHtml( slMax ) + '</span></div>';
				html += '</div>';
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
			var fieldSize = state.formSettings.field_size || '';
			var labelSize = state.formSettings.label_size || '';
			var buttonSize = state.formSettings.button_size || '';
			var fieldStyle = state.formSettings.field_style || '';
			var sizeMap = {
				small: { fieldY: '10px', fieldX: '12px', fieldFont: '14px', labelFont: '14px', buttonY: '10px', buttonX: '16px', buttonFont: '14px' },
				medium: { fieldY: '12px', fieldX: '14px', fieldFont: '15px', labelFont: '16px', buttonY: '12px', buttonX: '18px', buttonFont: '15px' },
				large: { fieldY: '15px', fieldX: '16px', fieldFont: '16px', labelFont: '18px', buttonY: '14px', buttonX: '20px', buttonFont: '16px' },
				compact: { fieldY: '10px', fieldX: '12px', fieldFont: '14px', labelFont: '14px', buttonY: '10px', buttonX: '16px', buttonFont: '14px' },
				comfortable: { fieldY: '12px', fieldX: '14px', fieldFont: '15px', labelFont: '16px', buttonY: '12px', buttonX: '18px', buttonFont: '15px' },
				spacious: { fieldY: '15px', fieldX: '16px', fieldFont: '16px', labelFont: '18px', buttonY: '14px', buttonX: '20px', buttonFont: '16px' }
			};
			var fieldScale = fieldSize ? sizeMap[ fieldSize ] : null;
			var labelScale = labelSize ? sizeMap[ labelSize ] : null;
			var buttonScale = buttonSize ? sizeMap[ buttonSize ] : null;
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
							'<input type="number" id="boldform-setting-star-size" value="' + escapeHtml( selected.field.star_size || '28' ) + '" min="16" max="60" placeholder="28">' +
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

			// Build conditional logic field options.
			var condFields = getAllFields().filter( function ( f ) { return f.id !== selected.field.id && specialFieldTypes.indexOf( f.type ) === -1; } );
			var cond = selected.field.conditional || {};
			var condFieldOptions = '<option value="">' + escapeHtml( boldformLiteBuilder.labels.selectField || 'Select field' ) + '</option>';
			condFields.forEach( function ( f ) {
				condFieldOptions += '<option value="' + escapeHtml( f.id ) + '"' + ( cond.field_id === f.id ? ' selected' : '' ) + '>' + escapeHtml( f.label || getLibraryItem( f.type ).label ) + '</option>';
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
					( 'page_break' === selected.field.type ?
						'<div class="boldform-setting-group">' +
							'<label for="boldform-setting-step-title">Step Title</label>' +
							'<input type="text" id="boldform-setting-step-title" value="' + escapeHtml( selected.field.step_title || '' ) + '" placeholder="e.g. Billing Information">' +
						'</div>' +
						'<div class="boldform-setting-group">' +
							'<label for="boldform-step-progress-style-field">Progress Style</label>' +
							'<select id="boldform-step-progress-style-field">' +
								'<option value="bar"' + ( 'bar' === ( state.formSettings.step_progress_style || 'bar' ) ? ' selected' : '' ) + '>Progress Bar</option>' +
								'<option value="steps"' + ( 'steps' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Step Dots</option>' +
								'<option value="headings"' + ( 'headings' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Step Headings</option>' +
							'</select>' +
						'</div>' +
						'<p class="description" style="color:#9ca3af;font-size:12px;margin:4px 0 0">More multi-step options in <strong>Style</strong> tab → <strong>Multi-Step</strong>.</p>' : ''
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
						'<div class="boldform-cond-rules">' +
							'<div class="boldform-cond-row">' +
								'<select id="boldform-setting-cond-action">' +
									'<option value="show"' + ( 'show' === cond.action ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.show || 'Show' ) + '</option>' +
									'<option value="hide"' + ( 'hide' === cond.action ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.hide || 'Hide' ) + '</option>' +
								'</select>' +
								'<span>' + escapeHtml( boldformLiteBuilder.labels.thisFieldIf || 'this field if' ) + '</span>' +
							'</div>' +
							'<div class="boldform-cond-row">' +
								'<select id="boldform-setting-cond-field">' + condFieldOptions + '</select>' +
							'</div>' +
							'<div class="boldform-cond-row">' +
								'<select id="boldform-setting-cond-operator">' +
									'<option value="is"' + ( 'is' === cond.operator ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.is || 'is' ) + '</option>' +
									'<option value="is_not"' + ( 'is_not' === cond.operator ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.isNot || 'is not' ) + '</option>' +
									'<option value="contains"' + ( 'contains' === cond.operator ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.contains || 'contains' ) + '</option>' +
									'<option value="not_empty"' + ( 'not_empty' === cond.operator ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.notEmpty || 'is not empty' ) + '</option>' +
									'<option value="empty"' + ( 'empty' === cond.operator ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.isEmpty || 'is empty' ) + '</option>' +
								'</select>' +
								( cond.operator !== 'not_empty' && cond.operator !== 'empty' ?
									'<input type="text" id="boldform-setting-cond-value" value="' + escapeHtml( cond.value ) + '" placeholder="' + escapeHtml( boldformLiteBuilder.labels.value || 'Value' ) + '">' : ''
								) +
							'</div>' +
						'</div>' : ''
					) +
				'</div></div>'
			);

			setupOptionsSortable();
			setupAddressSortable();
		}

		function renderFormSettings() {
			var submitMode = 'ajax';
			if ( 'redirect' === state.formSettings.submission_type ) {
				submitMode = 'custom' === state.formSettings.redirect_type ? 'custom_url' : 'page';
			}
			var useCustomAdminEmail = 'custom' === state.formSettings.admin_email_type;
			var pages = boldformLiteBuilder.pages || [];

			$( '#boldform-form-settings-panel' ).html(
				'<div class="boldform-settings-section">' +
					'<div class="boldform-settings-section__head">' +
						'<h3>' + escapeHtml( boldformLiteBuilder.labels.submitBehavior ) + '</h3>' +
					'</div>' +
					'<div class="boldform-choice-grid boldform-choice-grid--3">' +
						'<label class="boldform-choice-card' + ( 'ajax' === submitMode ? ' is-selected' : '' ) + '">' +
							'<input type="radio" name="boldform-submit-mode" value="ajax"' + ( 'ajax' === submitMode ? ' checked' : '' ) + '>' +
							'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.ajaxSubmit ) + '</span>' +
						'</label>' +
						'<label class="boldform-choice-card' + ( 'page' === submitMode ? ' is-selected' : '' ) + '">' +
							'<input type="radio" name="boldform-submit-mode" value="page"' + ( 'page' === submitMode ? ' checked' : '' ) + '>' +
							'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.toAPage || 'To a Page' ) + '</span>' +
						'</label>' +
						'<label class="boldform-choice-card' + ( 'custom_url' === submitMode ? ' is-selected' : '' ) + '">' +
							'<input type="radio" name="boldform-submit-mode" value="custom_url"' + ( 'custom_url' === submitMode ? ' checked' : '' ) + '>' +
							'<span class="boldform-choice-card__title">' + escapeHtml( boldformLiteBuilder.labels.customUrl || 'Custom URL' ) + '</span>' +
						'</label>' +
					'</div>' +
					( 'ajax' === submitMode
						? '<div class="boldform-setting-group"><label for="boldform-thank-you-message">' + escapeHtml( boldformLiteBuilder.labels.thankYouMessage ) + '</label><textarea id="boldform-thank-you-message" rows="4">' + escapeHtml( state.formSettings.thank_you_message ) + '</textarea></div>'
						: ''
					) +
					( 'page' === submitMode
						? '<div class="boldform-setting-group"><select id="boldform-redirect-url"><option value="">' + escapeHtml( '— Select a page —' ) + '</option>' +
							(function () {
								var opts = '';
								pages.forEach( function ( p ) {
									opts += '<option value="' + escapeHtml( p.url ) + '"' + ( state.formSettings.redirect_url === p.url ? ' selected' : '' ) + '>' + escapeHtml( p.title ) + '</option>';
								} );
								return opts;
							}()) +
							'</select></div>'
						: ''
					) +
					( 'custom_url' === submitMode
						? '<div class="boldform-setting-group"><input type="url" id="boldform-redirect-custom-url" value="' + escapeHtml( state.formSettings.redirect_url || '' ) + '" placeholder="https://example.com/thank-you"></div>'
						: ''
					) +
				'</div>' +
				'<div class="boldform-settings-section">' +
					'<div class="boldform-settings-section__head">' +
						'<h3>' + escapeHtml( boldformLiteBuilder.labels.adminNotifications ) + '</h3>' +
						'<label class="boldform-switch"><input type="checkbox" id="boldform-enable-admin-email"' + ( state.formSettings.enable_admin_email ? ' checked' : '' ) + '><span class="boldform-switch__slider"></span><span class="boldform-switch__label">' + escapeHtml( boldformLiteBuilder.labels.enableAdminEmail ) + '</span></label>' +
					'</div>' +
					( state.formSettings.enable_admin_email
						? '<div class="boldform-choice-grid">' +
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
							? '<div class="boldform-setting-group"><label for="boldform-admin-email">' + escapeHtml( boldformLiteBuilder.labels.adminEmailAddress ) + '</label><input type="email" id="boldform-admin-email" value="' + escapeHtml( state.formSettings.admin_email ) + '"></div>'
							: ''
						)
						: ''
					) +
				'</div>' +
				'<div class="boldform-settings-section">' +
					'<div class="boldform-settings-section__head">' +
						'<h3>' + escapeHtml( boldformLiteBuilder.labels.userNotifications ) + '</h3>' +
						'<label class="boldform-switch"><input type="checkbox" id="boldform-enable-user-email"' + ( state.formSettings.enable_user_email ? ' checked' : '' ) + '><span class="boldform-switch__slider"></span><span class="boldform-switch__label">' + escapeHtml( boldformLiteBuilder.labels.enableUserEmail ) + '</span></label>' +
					'</div>' +
				'</div>'
			);
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
			// Also store direct hex for step progress
			state.formSettings.step_progress_color = theme.primary;
			state.formSettings.step_btn_color = theme.btnBg;
			state.formSettings.step_btn_text_color = theme.btnText;
			renderAll();
		}

		function renderStylingSettings() {
			function colorField( id, label, value, fallback ) {
				var displayVal = value || '';
				var colorVal = displayVal || fallback;
				return '<div class="boldform-setting-group"><label for="' + id + '">' + escapeHtml( label ) + '</label><div class="boldform-color-wrap"><input type="color" id="' + id + '" value="' + escapeHtml( colorVal ) + '"><span class="boldform-color-preview" style="background:' + escapeHtml( colorVal ) + '"></span></div></div>';
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
							'<div class="boldform-setting-group"><label for="boldform-field-size-style">' + escapeHtml( boldformLiteBuilder.labels.size ) + '</label><select id="boldform-field-size-style"><option value="">' + escapeHtml( boldformLiteBuilder.labels.defaultStyle ) + '</option><option value="small"' + ( 'small' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.small ) + '</option><option value="medium"' + ( 'medium' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.medium ) + '</option><option value="large"' + ( 'large' === state.formSettings.field_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.large ) + '</option></select></div>' +
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
							'<div class="boldform-setting-group"><label for="boldform-button-size-style">' + escapeHtml( boldformLiteBuilder.labels.size ) + '</label><select id="boldform-button-size-style"><option value="">' + escapeHtml( boldformLiteBuilder.labels.defaultStyle ) + '</option><option value="small"' + ( 'small' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.small ) + '</option><option value="medium"' + ( 'medium' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.medium ) + '</option><option value="large"' + ( 'large' === state.formSettings.button_size ? ' selected' : '' ) + '>' + escapeHtml( boldformLiteBuilder.labels.large ) + '</option></select></div>' +
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
				'<div class="boldform-style-section">' +
					'<div class="boldform-style-section__head"><h3>Multi-Step</h3><span class="dashicons dashicons-arrow-down-alt2"></span></div>' +
					'<div class="boldform-style-section__body">' +
						'<div class="boldform-style-grid">' +
							'<div class="boldform-setting-group"><label for="boldform-step-progress-style">Progress Style</label>' +
								'<select id="boldform-step-progress-style">' +
									'<option value="bar"' + ( 'bar' === ( state.formSettings.step_progress_style || 'bar' ) ? ' selected' : '' ) + '>Progress Bar</option>' +
									'<option value="steps"' + ( 'steps' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Step Dots</option>' +
									'<option value="headings"' + ( 'headings' === state.formSettings.step_progress_style ? ' selected' : '' ) + '>Step Headings</option>' +
								'</select>' +
							'</div>' +
							'<div class="boldform-setting-group"><label for="boldform-step-btn-size">Button Size</label>' +
								'<select id="boldform-step-btn-size">' +
									'<option value="small"' + ( 'small' === state.formSettings.step_btn_size ? ' selected' : '' ) + '>Small</option>' +
									'<option value="medium"' + ( 'medium' === ( state.formSettings.step_btn_size || 'medium' ) ? ' selected' : '' ) + '>Medium</option>' +
									'<option value="large"' + ( 'large' === state.formSettings.step_btn_size ? ' selected' : '' ) + '>Large</option>' +
								'</select>' +
							'</div>' +
							'<div class="boldform-setting-group"><label for="boldform-step-btn-radius">Button Radius</label><div class="boldform-style-input-wrap"><input type="number" id="boldform-step-btn-radius" min="0" max="50" value="' + escapeHtml( state.formSettings.step_btn_radius ) + '"><span>px</span></div></div>' +
						'</div>' +
						'<div class="boldform-style-grid">' +
							'<div class="boldform-setting-group"><label for="boldform-step-next-text">Next Text</label><input type="text" id="boldform-step-next-text" value="' + escapeHtml( state.formSettings.step_next_text || 'Next' ) + '"></div>' +
							'<div class="boldform-setting-group"><label for="boldform-step-prev-text">Previous Text</label><input type="text" id="boldform-step-prev-text" value="' + escapeHtml( state.formSettings.step_prev_text || 'Previous' ) + '"></div>' +
						'</div>' +
						'<div class="boldform-style-color-grid">' +
							colorField( 'boldform-step-progress-color', 'Progress Color', state.formSettings.step_progress_color, '#2f80ed' ) +
							colorField( 'boldform-step-btn-color', 'Button Background', state.formSettings.step_btn_color, '#2f80ed' ) +
							colorField( 'boldform-step-btn-text-color', 'Button Text', state.formSettings.step_btn_text_color, '#ffffff' ) +
						'</div>' +
					'</div>' +
				'</div>'
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

		function applyTemplate( templateName ) {
			var templates = getTemplateDefinitions();
			var template = templates[ templateName ];

			if ( ! template ) {
				openRowModal();
				return;
			}

			state.structure = {
				rows: template.rows
			};
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
			hr_survey: 'HR & Surveys'
		};
		var tplCategoryMap = {
			contact: 'general', newsletter: 'general', feedback: 'general', registration: 'general',
			lead: 'business', support: 'business', order_form: 'business',
			event_rsvp: 'events', booking: 'events',
			job_application: 'hr_survey', customer_survey: 'hr_survey'
		};

		function renderTemplateModal() {
			var templates = getTemplateDefinitions();
			var selectedKey = templates[ state.selectedTemplate ] ? state.selectedTemplate : 'contact';
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
					var template = templates[ key ];
					listMarkup += '<button type="button" class="boldform-template-option' + ( key === selectedKey ? ' is-active' : '' ) + '" data-template-option="' + escapeHtml( key ) + '">';
					listMarkup += '<strong>' + escapeHtml( template.title ) + '</strong>';
					listMarkup += '</button>';
				} );
				listMarkup += '</div>';
			} );

			selectedTemplate.rows.forEach(
				function ( row ) {
					previewMarkup += '<div class="boldform-template-preview-row">';
					row.columns.forEach(
						function ( column ) {
							previewMarkup += '<div class="boldform-template-preview-column" style="width:' + escapeHtml( column.width ) + ';">';
							column.fields.forEach(
								function ( field ) {
									previewMarkup += '<div class="boldform-template-preview-field">';
									previewMarkup += renderInputPreview( field );
									previewMarkup += '</div>';
								}
							);
							previewMarkup += '</div>';
						}
					);
					previewMarkup += '</div>';
				}
			);

			previewMarkup += '<div class="boldform-template-preview-submit"><button type="button" class="boldform-canvas-submit__button">' + escapeHtml( state.formSettings.button_text || 'Submit' ) + '</button></div>';

			$( '#boldform-template-list' ).html( listMarkup );
			$( '#boldform-template-preview-canvas' ).html( previewMarkup );
			$( '#boldform-template-preview-canvas' ).attr( 'style', getFormStyleVariables() );
			$( '#boldform-template-preview__head' ).html(
				'<h3>' + escapeHtml( selectedTemplate.title ) + '</h3>' +
				'<p>' + escapeHtml( selectedTemplate.description ) + '</p>'
			);
			$( '#boldform-import-template' ).text( boldformLiteBuilder.labels.importTemplate || 'Import Template' );
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

			if ( navigator.clipboard && navigator.clipboard.writeText ) {
				navigator.clipboard.writeText( shortcode ).then(
					function () {
						$( '#boldform-builder-status' ).text( 'Shortcode copied to clipboard.' );
					}
				);
				return;
			}

			$( '#boldform-builder-status' ).text( shortcode );
		}

		function saveForm() {
			var $save = $( '#boldform-save-form' );
			var title = $.trim( $( '#boldform-form-title' ).val() ) || boldformLiteBuilder.defaultFormTitle;
			var payload;

			if ( ! getAllRows().length ) {
				$( '#boldform-builder-status' ).text( boldformLiteBuilder.messages.emptyFields );
				return;
			}

			payload = {
				action: 'boldform_lite_save_form',
				nonce: boldformLiteBuilder.nonce,
				form_id: state.formId,
				title: title,
				structure: JSON.stringify( state.structure ),
				settings: JSON.stringify( state.formSettings )
			};

			$save.prop( 'disabled', true ).text( boldformLiteBuilder.savingText );
			$( '#boldform-builder-status' ).text( '' );

			$.post( boldformLiteBuilder.ajaxUrl, payload )
				.done(
					function ( response ) {
						if ( response && response.success ) {
							state.formId = response.data.formId;
							updateShortcodeDisplay();
							$( '#boldform-builder-status' ).text( response.data.message );
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

		// Conditional logic changes.
		$( document ).on( 'change', '#boldform-setting-cond-enabled, #boldform-setting-cond-action, #boldform-setting-cond-field, #boldform-setting-cond-operator', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.enabled = $( '#boldform-setting-cond-enabled' ).is( ':checked' );
			if ( $( '#boldform-setting-cond-action' ).length ) {
				selected.field.conditional.action = $( '#boldform-setting-cond-action' ).val() || 'show';
			}
			if ( $( '#boldform-setting-cond-field' ).length ) {
				selected.field.conditional.field_id = $( '#boldform-setting-cond-field' ).val() || '';
			}
			if ( $( '#boldform-setting-cond-operator' ).length ) {
				selected.field.conditional.operator = $( '#boldform-setting-cond-operator' ).val() || 'is';
			}
			state.activeSettingsAccordion = 'advanced';
			renderSettingsPanel();
			setupOptionsSortable();
			setupAddressSortable();
		} );

		$( document ).on( 'input', '#boldform-setting-cond-value', function () {
			var selected = getSelectedFieldLocation();
			if ( ! selected ) return;
			selected.field.conditional.value = $( this ).val();
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
			'#boldform-setting-label, #boldform-setting-placeholder, #boldform-setting-default, #boldform-setting-button-text, #boldform-setting-content, #boldform-setting-description, #boldform-setting-custom-error, #boldform-setting-allowed-types, #boldform-setting-max-file-size, #boldform-setting-button-icon-gap, #boldform-setting-css-class, #boldform-setting-min-value, #boldform-setting-max-value, #boldform-setting-step-value, #boldform-setting-mask-custom, #boldform-setting-star-color, #boldform-setting-star-size, #boldform-setting-slider-color, #boldform-setting-slider-height, #boldform-setting-step-title, #boldform-setting-next-text, #boldform-setting-prev-text, #boldform-setting-btn-color, #boldform-setting-btn-text-color, #boldform-setting-btn-size, #boldform-setting-btn-radius, #boldform-setting-progress-color, #boldform-setting-progress-style, #boldform-setting-button-icon-size, #boldform-setting-button-icon-color, #boldform-step-progress-style-field',
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
				if ( $( '#boldform-step-progress-style-field' ).length ) {
					state.formSettings.step_progress_style = $( '#boldform-step-progress-style-field' ).val();
				}
				if ( $( '#boldform-setting-next-text' ).length ) {
					selected.field.next_text = $( '#boldform-setting-next-text' ).val();
				}
				if ( $( '#boldform-setting-prev-text' ).length ) {
					selected.field.prev_text = $( '#boldform-setting-prev-text' ).val();
				}
				if ( $( '#boldform-setting-btn-color' ).length ) {
					selected.field.btn_color = $( '#boldform-setting-btn-color' ).val();
				}
				if ( $( '#boldform-setting-btn-text-color' ).length ) {
					selected.field.btn_text_color = $( '#boldform-setting-btn-text-color' ).val();
				}
				if ( $( '#boldform-setting-btn-size' ).length ) {
					selected.field.btn_size = $( '#boldform-setting-btn-size' ).val();
				}
				if ( $( '#boldform-setting-btn-radius' ).length ) {
					selected.field.btn_radius = $( '#boldform-setting-btn-radius' ).val();
				}
				if ( $( '#boldform-setting-progress-color' ).length ) {
					selected.field.progress_color = $( '#boldform-setting-progress-color' ).val();
				}
				if ( $( '#boldform-setting-progress-style' ).length ) {
					selected.field.progress_style = $( '#boldform-setting-progress-style' ).val();
				}

				if ( optionFieldTypes.indexOf( selected.field.type ) !== -1 ) {
					selected.field.options = collectRepeaterOptions();
				}

				renderCanvas();
			}
		);

		$( document ).on(
			'change',
			'#boldform-setting-required, #boldform-setting-button-icon-type, #boldform-setting-button-icon-dashicon, #boldform-setting-button-icon-position, #boldform-setting-button-color-global, #boldform-setting-options-layout, #boldform-setting-select-searchable, #boldform-setting-mask-pattern, #boldform-setting-max-stars, #boldform-setting-show-middle-name, #boldform-setting-show-last-name',
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

		$( document ).on(
			'input change',
			'input[name="boldform-submit-mode"], #boldform-redirect-url, #boldform-redirect-custom-url, #boldform-thank-you-message, #boldform-enable-admin-email, #boldform-enable-user-email, input[name="boldform-admin-email-type"], #boldform-admin-email, #boldform-field-size-style, #boldform-field-border-style, #boldform-field-border-width, #boldform-field-border-radius, #boldform-field-background-color, #boldform-field-border-color, #boldform-field-text-color, #boldform-label-size-style, #boldform-label-color-style, #boldform-label-subtext-color-style, #boldform-error-color-style, #boldform-button-size-style, #boldform-button-border-style, #boldform-button-border-width, #boldform-button-border-radius, #boldform-button-background-color, #boldform-button-border-color, #boldform-button-text-color, #boldform-field-focus-color, #boldform-step-progress-style, #boldform-step-progress-color, #boldform-step-btn-color, #boldform-step-btn-text-color, #boldform-step-btn-size, #boldform-step-btn-radius, #boldform-step-next-text, #boldform-step-prev-text, #boldform-hide-labels, #boldform-hide-placeholders',
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

				// Multi-step settings.
				if ( $( '#boldform-step-progress-style' ).length ) {
					state.formSettings.step_progress_style = $( '#boldform-step-progress-style' ).val();
				}
				if ( $( '#boldform-step-progress-color' ).length ) {
					state.formSettings.step_progress_color = normalizeStyleColorValue( $( '#boldform-step-progress-color' ).val() || '#2f80ed', '#2f80ed' );
				}
				if ( $( '#boldform-step-btn-color' ).length ) {
					state.formSettings.step_btn_color = normalizeStyleColorValue( $( '#boldform-step-btn-color' ).val() || '#2f80ed', '#2f80ed' );
				}
				if ( $( '#boldform-step-btn-text-color' ).length ) {
					state.formSettings.step_btn_text_color = normalizeStyleColorValue( $( '#boldform-step-btn-text-color' ).val() || '#ffffff', '#ffffff' );
				}
				if ( $( '#boldform-step-btn-size' ).length ) {
					state.formSettings.step_btn_size = $( '#boldform-step-btn-size' ).val();
				}
				if ( $( '#boldform-step-btn-radius' ).length ) {
					state.formSettings.step_btn_radius = $( '#boldform-step-btn-radius' ).val();
				}
				if ( $( '#boldform-step-next-text' ).length ) {
					state.formSettings.step_next_text = $( '#boldform-step-next-text' ).val();
				}
				if ( $( '#boldform-step-prev-text' ).length ) {
					state.formSettings.step_prev_text = $( '#boldform-step-prev-text' ).val();
				}
	
				if (
					$( event.target ).is( 'input[name="boldform-submit-mode"]' ) ||
					$( event.target ).is( '#boldform-enable-admin-email' ) ||
					$( event.target ).is( 'input[name="boldform-admin-email-type"]' )
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

		// Live color preview swatch update for all color pickers.
		$( document ).on( 'input', '.boldform-color-wrap input[type="color"]', function () {
			$( this ).siblings( '.boldform-color-preview' ).css( 'background', $( this ).val() );
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
	}
);
