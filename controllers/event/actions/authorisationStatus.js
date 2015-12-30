'use strict';
/**
 *  Dispatch the user's authorization for the requested event
 *
 *  Pre conditions:
 *    # req.processed.event_auth must exist and contains the event's authorization information of
 *      the user

 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
// Utils
var _ = require('underscore');


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

    res.json(200, req.processed.event_auth);
    post(null, req, res);

};