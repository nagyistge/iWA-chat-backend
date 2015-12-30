'use strict';

/**
 * Parse the url parameters of the usual event's urls and populate them into the req.processed.event
 * object.
 * The pre-middleware does a basic checks of the syntax of the parameters and if some of the fails,
 * then send a response with the issue detected and abort the route pre-middleware/action chain left
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next) {

  var users = req.body.users;
  var uIt;

  if (Array.isArray(users)) {
    for (uIt = 0; uIt < users.length; uIt++) {
      if ((!users[uIt].id) || (!/^[0-9A-Fa-f]{24}$/.test(users[uIt].id))) {
        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.HttpRequest('Controller: user # Pre-middleware: parseUsersReqParams | ' +
            'Some user id has not been sent or it is wrong. User id: ' + users[uIt].id, 400, req));
        helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'users');
        return;
      }
    }
  } else {
    if ((!users) || (!users.id) || (!/^[0-9A-Fa-f]{24}$/.test(users.id))) {
      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.HttpRequest('Controller: user # Pre-middleware: parseUsersReqParams | ' +
          'The user id has not been sent or it is wrong. User id: ' +
          (!users) ? 'undefined': users.id, 400, req));
      helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'users');
      return;
    }
  }

  helperPreMiddlewares.addProcessedData(req, 'users', users, false);
  next();
};
