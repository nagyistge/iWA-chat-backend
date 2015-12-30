'use strict';


// Initialize authentication strategies
(function initialize() {
  var settings = require('../../../../settings');
  // Register strategies
  require(settings.libsPath + '/iwazat/auth/strategies/twitter');
  require(settings.libsPath + '/iwazat/auth/strategies/facebook');
  require(settings.libsPath + '/iwazat/auth/strategies/linkedin');
  require(settings.libsPath + '/iwazat/auth/strategies/google');

	// This file it is only called one time, to load the login strategies, so we remove the empty
	// object from require's cache to consume less memory
	delete require.cache[__filename];

}());