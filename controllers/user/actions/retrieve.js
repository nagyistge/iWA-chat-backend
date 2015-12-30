'use strict';

/**
 * Retrieve the the logged in user's data
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticated
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');

// Utils
var _ = require('underscore');

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

  var filter;

  if (_.isEmpty(req.query)) {
    //Avoid to disclose some user attributes
    filter = {
      __v: false,
      local_auth: false,
      'social_network_accounts.account_auth': false
    };
  } else {

    // Remove possible undisclosed user's attributes requested or attributes which only used in backend
    // NOTE: Social network accounts is an object that some attributes are available to request, so
    // we need to remove the undisclosed after retrieve them from the database
    delete req.query.__v;
    delete req.query.local_auth;


    // if some field has been sent with value '0' then requesting not to send that fields
    // we need two filters because the current mongoose doesn't allow to mix including and
    // excluding fields.
    // NOTE that the result is the same if the some fields are requested and others not that only
    // specify the fields to request, but doing it we avoid that mongoose thrown an error so we
    // avoid to log irrelevant errors. For example, tre quest #A is the same than #B
    //  #A ?following&contacts&personas=0
    //  #B ?following&contacts
    var reqFields = {};
    var unreqFields = {};

    for (var f in req.query) {
      if (req.query[f] === '0') {
        unreqFields[f] = false;
      } else {
        reqFields[f] = true;
      }
    }

    if (Object.keys(reqFields).length === 0) {
      filter = unreqFields;
    } else {
      filter = reqFields;
    }
  }

  UserModel.findById(authUserId, filter,
  //UserModel.findById(authUserId,
    function (err, userDoc) {
      if (err) {
        helperGlobal.addError(req,
          new iWAErrors.Db('Controller: user # Action: retrieve | Error when trying to get the ' +
            'info of the user with the id ' + authUserId, 520, err), 520);
        sendResponse(req, res, post);
        return;
      }

      if (!userDoc) {
        helperGlobal.addError(req,
          new iWAErrors.HttpRequest('Controller: user # Action: retrieve | No user found with ' +
            'the id ' + authUserId, 404, req), 404);
        sendResponse(req, res, post);
        return;
      }

      if ((userDoc.personas) && (userDoc.personas.length > 0)) {

        var user = userDoc.toObject();

        userDoc.dereferenceKeywords(function (err, pKeywordsMap) {
          var pIt;
          var personaId;
          var persona;

          if (err) {
            helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: retrieve | ' +
              'Error in the process of deference the personas\' keywords ' + authUserId, 520, err),
              520);
            sendResponse(req, res, post);
            return;
          }

          for (pIt = 0; pIt < user.personas.length; pIt++) {
            persona = user.personas[pIt];
            personaId = persona._id.toString();

            persona.interests = pKeywordsMap[personaId].interests;
            persona.skills_have = pKeywordsMap[personaId].skills_have;
            persona.skills_want = pKeywordsMap[personaId].skills_want;
          }

          sendResponse(req, res, post, user);

        });

      } else {
        sendResponse(req, res, post, userDoc);
      }


    });
};

function sendResponse(req, res, post, user) {
  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, user);
  post(null, req, res);
}
