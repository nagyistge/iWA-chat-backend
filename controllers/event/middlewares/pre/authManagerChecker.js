/**
 * The pre-middleware checks if the user has a manager's rights on the requested event
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authenticated
 *    # req.processed must exist
 *    # req.processed.event  must exist and it must be an object with the next attributes
 *     {
 *       id: Event id to check
 *     }
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Action helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');


module.exports = function (req, res, next) {

  var eventAuth = iWASession.isUserAuthAccessEvent(req.session, req.processed.event.id);

  if (eventAuth === true) {
    next();
  } else {
    if (eventAuth === false) {
      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.Authorization('Controller: event # Pre-middleware: authManagerChecker | ' +
          'User has not been authorized to manage to the event ' + req.processed.event.id,
          {
            request: req,
            session: {
              events: req.session.events
            }
          }));

      helperPreMiddlewares.sendRespOfIssue(req, res, 403,
        'manage the event: ' + req.processed.event.id);
    } else {

      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.Authentication('Controller: event # Pre-middleware: authManagerChecker | ' +
          'User has not been request the authorization to access to the event ' +
          req.processed.event.id,
          {
            request: req,
            session: {
              events: req.session.events
            }
          }));

      helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'manage the event: ' +
        req.processed.event.id);
    }
  }
};



