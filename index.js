/**
 * Fastpass
 * Used to create a single sign on with Get Satisfaction
 * 
 * @author Pete Fredricks
 */

var OAuth = require( 'oauth' ).OAuth;

// constructor
var Fastpass = function( params ) {
	
	var errors = [];
	
	this.domain = 'getsatisfaction.com';
	
	this.key = params.key || ( errors.push( 'Consumer Key' ) );
	this.secret = params.secret || ( errors.push( 'Consumer Secret' ) );
	this.isSecure = params.secure || false;
	
	// save standard params
	this.requestParams = {
		email: params.email || ( errors.push( 'User Email' ) ),
		name: params.name || ( errors.push( 'User Name' ) ),
		uid: params.uid || ( errors.push( 'User ID' ) )
	}
	
	// if any of the required params are missing, throw error
	if ( errors.length !== 0 ) {
		console.error( 'The following parameters must set: ' + errors.join( ', ' ) );
		return;
	}
	
	// add any additional fields to params
	for ( var field in ( params.fields || {} ) ) {
		this.requestParams[ field ] = params.fields[ field ];
	}
	
	// create a new OAuth object
	this.oauth = new OAuth( null, null, this.key, this.secret, '1.0', null, 'HMAC-SHA1' );
}

// Create the url to be used with the client-side code.
Fastpass.prototype.getUrl = function() {
	
	var baseUrl = [ 'http', ( this.isSecure ? 's' : '' ), '://', this.domain, '/fastpass' ].join( '' );
	
	// let's use the OAuth prepareParameters method because it does all the signing for us
	var params = this.oauth._prepareParameters( null, null, 'GET', baseUrl, this.requestParams );
	
	return baseUrl + '?' + this._createFastpassQuery( params );
}

// Format the query string parameters.
Fastpass.prototype._createFastpassQuery = function( params ) {
	
	var formattedParams = [];
	var set;
	
	// the prepared params are an array
	// loop through and encode the values
	for ( var i = 0, len = params.length; i < len; i++ ) {
		set = params[ i ];
		set[ 1 ] = encodeURIComponent( set[ 1 ] );
		
		formattedParams.push( set.join( '=' ) );
	}
	
	// join KVPs for url
	return formattedParams.join( '&' );
}

// Return the client-side script provided by FastPass
Fastpass.prototype.script = function( params ) {

	var url = this.getUrl();
	
	// this is FastPass javascript code
	var result = [
		'<script type="text/javascript">',
			'var GSFN;',

			'if (GSFN == undefined) { GSFN = {}; }',

			'(function(){',
				'add_js = function(jsid, url) {',
					'var head = document.getElementsByTagName("head")[0];',
					'script = document.createElement("script");',
					'script.id = jsid;',
					'script.type = "text/javascript";',
					'script.src = url;',
					'head.appendChild(script);',
				'};' ,

				'add_js("fastpass_common", document.location.protocol + "//getsatisfaction.com/javascripts/fastpass.js");',

				'if (window.onload) { var old_load = window.onload; }',
				'window.onload = function() {',
					'if(old_load) old_load();',
					'add_js("fastpass", "' , url, '");',
				'}',
			'})();',
		'</script>'].join( '' );

	return result;
}

module.exports = Fastpass;