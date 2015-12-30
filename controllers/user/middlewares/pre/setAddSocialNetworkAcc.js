'use strict';

/**
 * The pre-middleware setup the needed parameters to allow the action of the routes where it is
 * used to attend a request to add a new social network account to the logged user.
 * Only an authenticated social network account is valid to add, so this process is done in two
 * steps as the login by a social network account. 1) redirect the user to the social network
 * authentication page and 2) process the response from the social network account using a callback
 * URL.
 *
 * The middleware populate req.processed.socialNetworkToAdd if the request fits to add a new social
 * network account. Its value is an object with the next attributes:
 * {
 *    type: The supported social network's id
 *    callback: True of False regarding the request
 * }
 *
 * NOTE: Because the Passport strategies are registered with an unique configuration, we cannot use
 * different callbacks to distinguish between the user authentication using a social network account
 * and to add a new social network account to the logged user (this action), however we can set a
 * different route for the step 1; regarding to it, this middleware must be used for both routes,
 * but it is needed to use a route that for the step 1 that populate in the first parameter
 * (req.params[0]) the string 'add' and in the second, the identifier of one of the supported social
 * networks (req.params[1]).
 * Because the social network callback is attended by the same route for the mentioned reason, the
 * middleware populate req.processed.snAuthValidate accordingly, checking if a specified trace
 * object exists, which has been traced if the operation requested was to add a social network, so
 * the action in the callback route can differentiate if the callback is to add a new social network
 * or to authenticate an user.
 *
 * Pre conditions:
 *   # req.session must exist
 *   # req.params:
 *        A - if req.params[1] === 'add' then req.params[0] must be a string with the value that
 *          identify one of the supported social network
 *        B - if req.params[1] === 'callback' hen req.params[0] must be a string with the value
 *          that identify one of the supported social network
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

/**
 * Globals
 */
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next) {

  if (helperPreMiddlewares.jumpIfErrors(req, res, next)) {
    return;
  }

  if (false === iWASession.isUserAuthenticated(req.session)) {
    next('route');
    return;
  }


  if ('callback' === req.params[1]) {

    helperGlobal.getTraceReq(req, 'social_network_to_add', function (err, traceObj) {
      if (err) {

        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.ServerApp('Controller: user # Pre-middleware: setAddSocialNetworkAcc | ' +
            'Error to get the traced information related to the operation to add a new social ' +
            'to the logged user. Error: ' + err));

        helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'social network to add');

      } else {

        if (true !== traceObj.data) {

          helperPreMiddlewares.traceErrors(req,
            new iWAErrors.ServerApp('Controller: user # Pre-middleware: setAddSocialNetworkAcc | ' +
              'The traced information related to the operation to add a new social to the ' +
              'logged user, has an unexpected value. Its value is: ' + traceObj));

          helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'social network to add');
        }

        helperPreMiddlewares.addProcessedData(req, 'socialNetworkToAdd', {
          type: req.params[0],
          callback: true
        }, false);
        next();
      }

    });

  } else if ('add' === req.params[1]) {
    helperGlobal.regTraceReq(req, 'social_network_to_add', true, 120000, false,
      function (err) {
        if (err) {

          helperPreMiddlewares.traceErrors(req,
            new iWAErrors.ServerApp('Controller: user # Pre-middleware: setAddSocialNetworkAcc | ' +
              'Error to trace the information related to the operation to add a new social ' +
              'to the logged user. Error: ' + err));

          helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'social network to add');

        } else {

          helperPreMiddlewares.addProcessedData(req, 'socialNetworkToAdd', {
            type: req.params[0],
            callback: false
          }, false);

          next();
        }
      });

  } else {

    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.ServerApp('Controller: user # Pre-middleware: setAddSocialNetworkAcc | ' +
        'Middleware used in an incorrect route. The route doesn\'t fit the expected parameter\'s ' +
        'values'));

    helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'social network to add');
  }
};