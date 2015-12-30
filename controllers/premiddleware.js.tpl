module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwamongo');


/**
 * Globals
 */
var logger = settings.logger;

module.exports = function(req, res, next) {



  //next() or next('route')
};