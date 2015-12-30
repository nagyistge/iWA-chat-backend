'use strict';

/**
 * Dispatch the related 3 edge login data
 *
 *  Pre conditions:
 *    # req.processed.authentication must exist
 *    # req.session must exist
 *    # user has been authenticated
 *
 * NOTE:
 * This action mustn't call next('route'), for security reasons
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  switch (req.processed.authentication.accessType) {
    case 'local':
    case 'insession':
      // Let's return logged in data from local login
      sendLoggedInData(req, res, post);
      break;

    default: // Login requested with some of the supported social network

      if (!req.processed.authentication.data_collector) {

        var traceObj = {};

        if (req.processed.user_registration) {
          traceObj.user_registration = req.processed.user_registration;
        }

        if (req.processed.event_auth) {
          traceObj.event_auth = req.processed.event_auth;
        }

        helperGlobal.regTraceReq(req, 'logged_in', traceObj, 120000, false,
          function (err) {
            if (err) {
              helperGlobal.addError(req, err, 500);
	            helperActions.respAllIssues(req, res, post);
	            return;
            } else {
//                res.redirect(302,
//                  '/#/user/login?strategy=' + req.processed.authentication.accessType +
//                    '&action=collect_data');
              res.redirect(302, '/#/?instruction=user_login&strategy=' +
                req.processed.authentication.accessType + '&action=collect_data');
            }
          });
      } else {
        // Data collector was requested

        helperGlobal.getTraceReq(req, 'logged_in', function (err, traceObj) {
          if (err) {
            helperGlobal.addError(req, err, 500);
          } else {
            if ((traceObj === false) || (traceObj === null)) {
              helperGlobal.addError(req, new iWAErrors.ServerApp(
                'Controller: user # action: authEndPoint | failed to get trace login data ' +
                  'after social network login. Social network: ' +
                  req.processed.authentication.accessType), 500);
	            helperActions.respAllIssues(req, res, post);
	            return;
            } else {
              var entity;

              for (entity in traceObj.data) {
                // The data is added to req.processed for internal use. sendLoggedInData functions
                // takes the data from there
                helperPreMiddlewares.addProcessedData(req, entity, traceObj.data[entity], true);
              }

              // Let's return logged in data from external social network login
              sendLoggedInData(req, res, post);
            }
          }
        });
      }

    // Response is sent by the above callbacks
  }
};

function sendLoggedInData(req, res, post) {

  var resStatusCode = -1;
  var authUser = iWASession.getAuthUser(req.session);

  var resDataObj = {
    auth_user: {
      id: authUser.id,
      persona: {
        id: authUser.persona.id
      }
    }
  };


  // Event login
  // If event_auth exists then the user authentication was checked before so we don't need to check
  // it again
  if (req.processed.event_auth) {

    switch (req.processed.event_auth.user_relation.allowed) {
      case 'ok':
        resStatusCode = 200;
        break;
      case 'pending':
        if (req.processed.event_auth.user_relation.first_time) {
          resStatusCode = 230;
        } else {
          resStatusCode = 231;
        }
        break;
      case 'no':
      default:
        resStatusCode = 403;
    }
  }

  if (resStatusCode > 0) {
    resDataObj.event_auth = req.processed.event_auth;
  } else {
    resStatusCode = 200;
  }

  if (req.processed.user_registration) {
    resDataObj.user_registration = req.processed.user_registration;
  }


  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(resStatusCode, resDataObj);
  post(null, req, res);

}