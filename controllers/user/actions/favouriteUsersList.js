'use strict';

/**
 * The action return the list of the user's favourite users
 *
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticate
 *    # req.processed must exist
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

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');


/**
 * Globals
 */
// Models
var UserModel;

//Initialize the non straight away global variables
(function initialize() {

  UserModel = iWAMongo.model(iWAUser);

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var authUserId = iWASession.getAuthUser(req.session).id;

  UserModel.findById(authUserId, function (err, user) {
    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: favouriteUsersList |' +
        'Error when trying to get the info of the User with the id ' + authUserId, 520, err), 520);
      sendResponse(req, res, post);
      return;
    }

    if (!user) {
      helperGlobal.addError(req, new iWAErrors.HttpRequest('Controller: user # Action: ' +
        'favouriteUsersList | No user found with the id ' + authUserId, 404, req), 404);
      sendResponse(req, res, post);
      return;
    }


    user.getFavouriteUsersList(function(errs, favUsersDocs) {
      if (errs) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: favouriteUsersList | '
          + 'Error when trying to compute the user\'s favourite users list of the user: ' + authUserId,
          525, err), 525);
        sendResponse(req, res, post);
        return;
      }

      if (!favUsersDocs) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: favouriteUsersList | '
          + 'Favourite users have not been retrieved from the user: ' + authUserId,
          525, err), 525);
        sendResponse(req, res, post);
        return;
      }

      var favUsersList = [];

      favUsersDocs.forEach(function (favUserDoc) {
        favUsersList = [{
          _id: favUserDoc.id,
          persona: 'default',
          name: favUserDoc.personas[0].name,
          surname: favUserDoc.personas[0].surname,
          avatar: favUserDoc.personaAvatar(),
          ranking_assessment: 0
        }];

      });

      sendResponse(req, res, post, favUsersList);
    });

  });
};

function sendResponse(req, res, post, favouriteUsers) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, favouriteUsers);
  post(null, req, res);
}