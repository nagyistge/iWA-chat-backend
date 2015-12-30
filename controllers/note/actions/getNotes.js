'use strict';

/**
 *  Launch the existent mongoose query object attached to req.processed.query and send a response
 *  with the result
 *
 * Pre-conditions
 *    # req.processed.query must exist and contains a read operation mongoose query object ready
 *        to execute
 */


module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var query = req.processed.query;


  query.exec(function (err, notes) {

    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: note # Action: getNotes| Error ' +
        'when retrieving the user\'s notes', 520, err), 520);
      sendResponse(req, res, post);
      return;
    }

    sendResponse(req, res, post, notes);
  });

};

function sendResponse(req, res, post, notes) {

  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, notes);
  post(null, req, res);
}