/**
 * Operations:
 *
 *  Parse the query parameter infoLevel that contains the user's role identifier to fulfil the
 *  the information provided by the response accordingly to it.
 *
 *  The pre-middleware parse the parameter and populate that value in: req.processed.event.infoLevel
 *  it the user can request information with the specified right's access, otherwise it doesn't
 *  add the parameter to req.processed.event.
 *
 *  This parameter allows to the user to get a response as if he had that right's access, so only
 *  the users who have an event's role higher or equal than the requested one are able that this
 *  pre-middleware populates the req.processed.event.infoLevel, otherwise the parameter will be dropped
 *  and a message log will be reported
 *
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.processed.event.id must exist
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
// System
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

/**
 * Globals
 */
var secIssuesLogger;

//Initialize the non straight away global variables
(function initialize() {
  secIssuesLogger = iwaLogger.getWinstonLogger('securityIssues');

}());

module.exports = function (req, res, next) {

  var eventId = req.processed.event.id;
  var reqInfoLevel = req.query.infoLevel;
  var sessRole;
  var accessRoles;
  var rn;

  if (reqInfoLevel) {
    accessRoles = iWASession.userEventRoles;
    sessRole = iWASession.getUserRoleEvent(req.session, eventId);

    for (rn = 0; rn < accessRoles.length; rn++) {
      if (accessRoles[rn] === sessRole) {
        helperPreMiddlewares.addProcessedData(req, 'event.infoLevel', reqInfoLevel, false);
        break;
      }

      if (accessRoles[rn] === reqInfoLevel) {
        // The specified access level request higher rights' access that the user has, so parameter
        // is dropped
        secIssuesLogger.warn('Controller: event # Pre-middleware: parseSpecAccessRight | An user ' +
          'requested an event\'s information with higher access rights that he has. That access ' +
          ' has been dropped but the request has been provided to next middleware or action of ' +
          'the chain');
        next();
        break;
      }
    }
  }

  next();

};
