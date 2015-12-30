'use strict';

/**
 * The pre-middleware check if the login request is coming from a new and process the information
 * gathered from the login, if he used an external social network account, and create a new iWazat
 * user providing this new user to next pre-middelware populating req.processed.
 *
 * If he is a new user, then req.processed is populated with 'user_registration' attribute which
 * contains the iWazat user document saved in the data base and user is authenticated straight away
 * (session will be populated), unless one error happens in that case it doesn't populate this
 * attribute and use req.processed.errors following the coding conventions.
 *
 *  req.processed:
 *    [user_registration]: iWazat user document
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # req.processed must exist
 *    # req. processed.login_info.issue.new_user must exists if the new user registration is requested
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Models Helpers
var createUserFromSNWK = require(settings.modelsPath + '/iwazat/helpers/createUserFromSNWK');

// Utils
var iWAUtilObj = require(settings.libsPath + '/iwazat/util/objects');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');


/**
 * Globals
 */
// Logger
var globalLogger = settings.logger;
// Models
var UserModel;

//Initialize the non straight away global variables
(function initialize() {

  UserModel = iWAMongo.model(iWAUser);

}());

/**
 *  Create a new user if the user that is logging in does not exist
 */
module.exports = function (req, res, next) {

  if (helperPreMiddlewares.jumpIfErrors(req, res, next)) {
    return;
  }

  var newUser = iWAUtilObj.getObjectPropValue(req, 'processed.login_info.new_user', true);
  var firstLogin = iWAUtilObj.getObjectPropValue(req, 'processed.login_info.first_login', true);

  // Login came from a registered user
  if (newUser) {

    createUserFromSNWK(
      'initial',
      req.processed.login_info.strategy,
      req.processed.login_info.social_network_profile._json,
      req.processed.login_info.social_network_auth,
      function (err, user) {

        if (err) {
          if (err instanceof iWAErrors.iWazat) {
            helperGlobal.addError(req, err, err.code);
          } else {
            helperGlobal.addError(req, new iWAErrors.Authentication(
              'Controller: user # Pre-middleware: registration | Cannot create user. Error: ' +
                err.message, req.processed.res_status, req), 412);
          }

          next();
          return;
        }


        // User created and authenticated - Register him in the session
        iWASession.userLogIn(req.session, user, function (err) {
          if (err) {
            helperGlobal.addError(req, new iWAErrors.UnderlyingSystem(
              'Controller: user # Action: authenticate | Error when trying to register the ' +
                'user\'s authentication into the session', 531, err), 531);
            next();
            return;
          }

          user = user.toObject();

          helperPreMiddlewares.removeProcessedData(req, 'login_info.social_network_auth');
          helperPreMiddlewares.addProcessedData(req, 'user_registration', user, false, next);
        });
      });
  } else if (firstLogin) {

    // First login is a Mongoose user document, but we need to get all the user document's data
    // to return the same result as a new create account
    UserModel.findByIdAndUpdate(firstLogin._id,
      {$set: {account_status: 'initial'}},
      function (err, user) {

        if (err) {
          helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
            'Pre-middleware: registration |  Error when updating the account status of the first ' +
            'login of an unregistered account. User\'s id:' + firstLogin.id, 520, err), 520);
          helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'user login');
          next();
        } else {
          helperPreMiddlewares.removeProcessedData(req, 'login_info.first_login');
          helperPreMiddlewares.addProcessedData(req, 'user_registration', user.toObject(), false,
            next);
        }
      });

  } else {
    next();
  }
};
