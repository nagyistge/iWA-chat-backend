'use strict';

/**
 * The pre-middleware checks if the user is authenticated
 *
 * Pre-Middleware type: frontline
 *
 * Pre conditions:
 *   # req.session must exist
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

/**
 * Globals
 */
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next) {

  // User has been authenticated before and his session is valid
  if (iWASession.isUserAuthenticated(req.session)) {
    next();
  } else {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.Authentication('Controller: user # Pre-middleware: authUserChecker | ' +
        'User not authenticated or invalid session',
        {
          request: req,
          session: req.session
        }));

    helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'user');
  }
};