'use strict';

/**
 * Execute all the code in a function avoiding to maintain references which will not be used
 */
module.exports = function (expressApp) {

  var settings = require('../settings.js');

  var defaults = {
  //  method : 'get'
  };
  var routes = [];

  // NOTE: the order of the next files is important, because it defines the order that how the routes
  // are registered in express, so it impacts in the route matching
  routes.push.apply(routes, require('./user'));
  routes.push.apply(routes, require('./users'));
  //routes.push.apply(routes, require('./note'));
  routes.push.apply(routes, require('./chat'));
  routes.push.apply(routes, require('./keyword'));
  routes.push.apply(routes, require('./note'));
  // How the public url of the events is defined in the next routes files using a regular expression
  // this file must be add at the end if others don't require to do it before
  routes.push.apply(routes, require('./event'));
  routes.push.apply(routes, require('./api'));
	routes.push.apply(routes, require('./platform'));

  // Register the routes in express application
  var Wirexroutes = require('wirexroutes');
  settings.wireXRoutes = new Wirexroutes(expressApp, routes, defaults);

	// Remove this module from the cache, because it is not used more than one so reduce memory usage
	// from the server
	delete require.cache[require.resolve(__filename)];

};

