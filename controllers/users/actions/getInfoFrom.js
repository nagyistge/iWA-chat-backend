/**
 * Dispatch the related users' persona data, if the user's persona id is not provided then his
 * default persona will be retrieved.
 *
 * TODO Add security, when the system provide the muti persona feature, to check if the user that
 * launched the request can access to the users' personas
 *
 *  Pre conditions:
 *    # req.processed must exist
 *    # user has been authenticated
 *
 */
'use strict';

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
//Services
//var iWASession = require(settings.servicesPath + '/iwazat/session');
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
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

  var qConditions;
  var specUsers;
  var users = req.processed.users;
  var specPersonas = false;
  var projection = {
    _id: true,
    birth_date: true,
    gender: true,
    avatars: true,
    emails: true,
    telephone_nums: true,
    social_network_accounts: true
  };

  if (Array.isArray(users)) {

    if (users.length === 0) {
      sendResponse(req, res, next, post, []);
      return;
    }

    qConditions = {
      _id: {
        $in: []
      }
    };

    specUsers = qConditions._id.$in;

//    projection = {
//      _id: true,
//      birth_date: true,
//      gender: true,
//      avatars: true,
//      emails: true,
//      telephone_nums: true,
//      social_network_accounts: true,
//      personas: {
//        $elemMatch: {
//          is_default: true
//        }
//      }
//    };

    projection.personas = {
      $elemMatch: {
        is_default: true
      }
    };

    users.forEach(function (user) {

      if (user.persona) {
        if (specPersonas === false) {
          projection.personas.$elemMatch = {
            $or: [
              {
                is_default: true
              },
              {
                _id: {$in: [user.persona]}
              }
            ]
          };

          specPersonas = projection.personas.$elemMatch.$or[1]._id.$in;

        } else {
          specPersonas.push(user.persona);
        }
      } // End specified user's persona request

      specUsers.push(user.id);
    }); // End users requested loop to build query conditions and projection


    UserModel.find(qConditions, projection, function (err, userDocs) {
      if (err) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: getInfoFrom | ' +
          'Error when trying to get the info of several users', 520, err), 520);
        sendResponse(req, res, next, post);
        return;
      }

      if ((!userDocs) || (userDocs.length !== users.length)) {
        helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
          'getInfoFrom | not all requested users exist in the database', 602, req), 602);
        sendResponse(req, res, next, post);
        return;
      }

      // we don't check if one persona has been returned with the user, because if any persona id
      // match to one user, the query return his default persona
      var usersInfo = [];
      var abort = false;

      function iWazatContactCb(err, userInfo) {

        if (abort) {
          return;
        }

        if (err) {
          abort = true;
          helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: getInfoForm | '
            + 'Error when trying get the contact data from one user', 525, err), 525);
          sendResponse(req, res, next, post);
          return;
        }

        usersInfo.push(userInfo);
        if (usersInfo.length === userDocs.length) {
          sendResponse(req, res, next, post, usersInfo);
        }
      }

      userDocs.forEach(function (uDoc) {
        uDoc.iWazatContact(iWazatContactCb);
      });

    }); // End database search

  } else { // Only the information from one user has been requested
    qConditions = {
      _id: users.id
    };

    if (users.persona) {
      projection.personas = {
        $elemMatch: {
          _id: users.persona
        }
      }
      ;
    } else {
      projection.personas = {
        $elemMatch: {
          is_default: true
        }
      };
    }

    UserModel.find(qConditions, projection, function (err, userDocs) {
      if (err) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: getInfoFrom | ' +
          'Error when trying to get the info of the user with the id ' + users.id, 520, err), 520);
        sendResponse(req, res, next, post);
        return;
      }

      if ((!userDocs) || (userDocs.length === 0)) {
        helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
          'getInfoFrom | the requested user id: ' + users.id + ' , doesn\'t exist in the database',
          602, req), 602);
        sendResponse(req, res, next, post);
        return;
      }

      var user = userDocs[0];

      if ((!user.personas) || (user.personas.length === 0)) {
        helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
          'getInfoFrom | the requested user\'s persona doesn\'t exist in the database # user: ' +
          users.id + ' / persona: ' + users.persona, 602, req), 602);
        sendResponse(req, res, next, post);
        return;
      }

      user.iWazatContact(function (err, userInfo) {
        if (err) {
          helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: getInfoFrom | '
            + 'Error when trying get the contact data from the user # user: ' + users.id +
            ' / persona: ' + (users.persona) ? user.personas : 'default', 525, err), 525);
          sendResponse(req, res, next, post);
          return;
        }

        sendResponse(req, res, next, post, userInfo);
      });
    }); // End database search
  } // End request info from one only user

};

function sendResponse(req, res, next, post, usersInfo) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, usersInfo);
  post(null, req, res);
}
