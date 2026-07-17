<?php
/**
 * Shared SVG sanitizer.
 *
 * @package BoldFormLite
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Strips active content from SVG markup so a stored SVG cannot execute script
 * if it is ever opened directly in a browser.
 *
 * Single source of truth for SVG sanitization: both the media-library upload
 * path (BoldForm_Lite_Admin::sanitize_uploaded_svg()) and the settings/form
 * import path (BoldForm_Lite_Export_Import::restore_media()) call this same
 * sanitizer, so a hardening improvement made here protects every path that
 * writes an SVG to disk instead of only the one it was made in.
 */
class BoldForm_Lite_Svg_Sanitizer {

	/**
	 * Sanitizes SVG markup, rejecting anything that cannot be parsed as a valid SVG.
	 *
	 * SVGs can carry executable script (inline <script>, on* event handlers,
	 * javascript: hrefs, <foreignObject>, CSS exfiltration via <style>, SMIL
	 * animation elements that rewrite an href/src at runtime, XXE via
	 * DOCTYPE/ENTITY). All of that is stripped or the file is rejected outright
	 * when it cannot be parsed cleanly.
	 *
	 * @param string $svg Raw SVG markup.
	 * @return string|null Sanitized SVG (with XML prolog), or null when the input
	 *                      is not a valid, safely-parseable <svg> document.
	 */
	public static function sanitize( $svg ) {
		$svg = trim( (string) $svg );

		if ( '' === $svg || ! class_exists( 'DOMDocument' ) ) {
			return null;
		}

		// Drop DOCTYPE/ENTITY declarations (XXE / entity-expansion) before parsing.
		$svg = preg_replace( '/<!DOCTYPE.*?>/is', '', $svg );
		$svg = preg_replace( '/<!ENTITY[^>]*>/i', '', (string) $svg );

		$dom                     = new DOMDocument();
		$dom->preserveWhiteSpace = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMDocument property.
		$dom->formatOutput       = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMDocument property.

		$libxml_prev = libxml_use_internal_errors( true );

		// PHP < 8.0: explicitly disable external entity loading (default-safe on 8.0+/libxml 2.9+).
		$entity_prev = null;
		if ( PHP_VERSION_ID < 80000 && function_exists( 'libxml_disable_entity_loader' ) ) {
			$entity_prev = libxml_disable_entity_loader( true ); // phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated -- guarded to only run on PHP < 8.0, where it is not yet deprecated; needed there to prevent XXE.
		}

		$loaded = $dom->loadXML( (string) $svg, LIBXML_NONET );

		if ( null !== $entity_prev ) {
			libxml_disable_entity_loader( $entity_prev ); // phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated -- see guard above.
		}
		libxml_clear_errors();
		libxml_use_internal_errors( $libxml_prev );

		if ( ! $loaded || ! $dom->documentElement || 'svg' !== strtolower( $dom->documentElement->nodeName ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMDocument/DOMNode properties.
			return null;
		}

		// Dangerous elements removed wholesale. Matched case-INSENSITIVELY on the local
		// name because SVG/XML is case-sensitive (e.g. <foreignObject>, <animateMotion>),
		// so a tag-name match must normalize case rather than rely on getElementsByTagName.
		$dangerous_tags = array(
			'script',
			'foreignobject',
			'iframe',
			'embed',
			'object',
			'audio',
			'video',
			'handler',
			'listener',
			'set',
			'animate',
			'animatemotion',
			'animatetransform',
			'style', // CSS can exfiltrate via @import / url(); strip the whole block.
		);

		$href_attrs = array( 'href', 'xlink:href', 'src', 'from', 'to', 'values', 'by' );

		// Single pass over every element: collect first (removal mutates the live list).
		$xpath     = new DOMXPath( $dom );
		$node_list = $xpath->query( '//*' );
		$elements  = array();

		if ( $node_list ) {
			foreach ( $node_list as $el ) {
				$elements[] = $el;
			}
		}

		foreach ( $elements as $el ) {
			$local = strtolower( $el->localName ? $el->localName : $el->nodeName ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMElement/DOMNode properties.

			if ( in_array( $local, $dangerous_tags, true ) ) {
				if ( $el->parentNode ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMNode property, not our naming to change.
					$el->parentNode->removeChild( $el ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				}
				continue;
			}

			if ( ! $el->attributes ) {
				continue;
			}

			$remove = array();

			foreach ( $el->attributes as $attr ) {
				$attr_name = strtolower( $attr->nodeName ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$attr_val  = (string) $attr->nodeValue; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				if ( 0 === strpos( $attr_name, 'on' ) ) {
					$remove[] = $attr;
				} elseif ( in_array( $attr_name, $href_attrs, true ) && self::href_is_unsafe( $attr_val ) ) {
					$remove[] = $attr;
				} elseif ( 'style' === $attr_name && preg_match( '/expression\s*\(|url\s*\(|@import|javascript\s*:|vbscript\s*:/i', $attr_val ) ) {
					$remove[] = $attr;
				}
			}

			foreach ( $remove as $attr ) {
				$el->removeAttributeNode( $attr );
			}
		}

		$clean = $dom->saveXML( $dom->documentElement ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- native DOMDocument property.

		if ( false === $clean || '' === trim( (string) $clean ) ) {
			return null;
		}

		return '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . $clean;
	}

	/**
	 * Determines whether an SVG href/src-like value is unsafe.
	 *
	 * Normalizes the value (decodes entities, strips whitespace and control chars)
	 * so obfuscated schemes like "java&#9;script:" are caught, then rejects
	 * executable schemes, non-image data: URIs, and external/protocol-relative
	 * references (which can fetch remote content or exfiltrate). Internal fragment
	 * references (#id), relative paths, and safe base64 raster images are allowed.
	 *
	 * @param string $value Raw attribute value.
	 * @return bool True if the reference is unsafe and should be stripped.
	 */
	private static function href_is_unsafe( $value ) {
		$normalized = html_entity_decode( (string) $value, ENT_QUOTES, 'UTF-8' );
		$normalized = preg_replace( '/[\s\x00-\x20]+/', '', (string) $normalized );
		$normalized = strtolower( (string) $normalized );

		if ( '' === $normalized || '#' === $normalized[0] ) {
			return false;
		}

		if ( preg_match( '#^(javascript|vbscript|mocha|livescript):#', $normalized ) ) {
			return true;
		}

		if ( 0 === strpos( $normalized, 'data:' ) ) {
			// Allow only safe base64 raster images; reject data:text/html, data:image/svg+xml, etc.
			return ! preg_match( '#^data:image/(png|jpe?g|gif|webp);base64,#', $normalized );
		}

		// Block external and protocol-relative references.
		if ( preg_match( '#^(https?:)?//#', $normalized ) ) {
			return true;
		}

		return false;
	}
}
