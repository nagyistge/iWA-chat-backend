
module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwamongo');


/**
 * Globals
 */
var logger = settings.logger;

module.exports = function(req, res, next, post) {


};


function sendResponse(req, res, next, post) {

  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  //res.send(200);
  //post(null, req, res);
}