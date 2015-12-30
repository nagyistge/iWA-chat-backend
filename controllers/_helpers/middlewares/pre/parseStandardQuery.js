'use strict';

/**
 * Check that the request's body contains an iWazat standard query's object checking that it only
 * contains the expected number and attributes names.
 * The pre-middleware populate the query object in req.processed.query or abort the route's chain
 * of the request if the body's request doesn't fit to an iWazat standard query's object.
 *
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.body
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var preMidAddProcessedData = require('./addProcessedData');
var preMidTraceErrors = require('./traceErrors');
var preMidSendRespOfIssue = require('./sendRespOfIssue');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next) {

  var reqQuery = req.body;
  var queryParams;
  var accepted = false;
  var p;


  if (reqQuery) {

    queryParams = Object.keys(reqQuery);

    if (queryParams.length <= 3) {
      accepted = true;

      for (p = 0; p < queryParams.length && accepted; p++) {

        switch (queryParams[p]) {
          case 'conditions':
          case 'fields':
          case 'options':
            break;
          default:
            accepted = false;
        }
      }
    }
  }

  if (accepted) {
    preMidAddProcessedData(req, 'query', reqQuery, false);
    next();
  } else {
    preMidTraceErrors(req,
      new iWAErrors.ClientAttack('Controller: _helpers # Pre-middleware: parseQuery | Specified a ' +
        'wrong query object\'s structure', 603, req, reqQuery));
    preMidSendRespOfIssue(req, res, 400, 'Notes query');
  }

};