'use strict';

/**
 * Retrieve the event's list where the user has some role
 *
 *  TODO #27
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


  UserModel.findById(authUserId, {events_access_allowed: true}, {lean: true})
    //UserModel.findById(authUserId)
    .populate('events_access_allowed._id',
      '_id slug title organiser_details start_date end_date dates_timezone participants owner ' +
        'location')
    .exec(
    function (err, userDoc) {
      if (err) {
        helperGlobal.addError(req,
          new iWAErrors.Db('Controller: user # Action: myEvents | Error when trying to get the ' +
            'info of the user with the id ' + authUserId, 520, err), 520);
        sendResponse(req, res, post);
        return;
      }

      if (!userDoc) {
        helperGlobal.addError(req,
          new iWAErrors.HttpRequest('Controller: user # Action: myEvents | No user found with ' +
            'the id ' + authUserId, 404, req), 404);
        sendResponse(req, res, post);
        return;
      }

      var procCounter;
      var eventList = [];
      procCounter = userDoc.events_access_allowed.length;

      if (procCounter === 0) {
        sendResponse(req, res, post, []);
      } else {

        userDoc.events_access_allowed.forEach(function (uEvent, idx) {
          var event = uEvent._id;

          if ((!event.organiser_details) || (!event.organiser_details.avatar)) {

            UserModel.getUserPersona(event.owner._id, event.owner.persona,
              ['avatars'],
              ['is_default', 'avatar'],
              function (err, owner) {

                // One error has happened in another event callback so the response has been emitted
                if (procCounter < 0) {
                  return;
                }


                if (err) {
                  helperGlobal.addError(req,
                    new iWAErrors.Db('Controller: user # Action: myEvents | Error when trying to ' +
                      'figure the organiser avatar from the event\'s owner. Event id: ' + event._id,
                      520, err), 520);
                  sendResponse(req, res, post);
                  return;
                }

                procCounter--;

                if (owner.personas[0].is_default) {
                  event.owner.persona = 'default';
                }

                if (!event.organiser_details) {
                  event.organiser_details = {
                    avatar: owner.personaAvatar()
                  };
                } else {
                  event.organiser_details.avatar = owner.personaAvatar();
                }

                eventList[idx] = {
                  persona: uEvent.persona,
                  role: uEvent.role,
                  event: event
                };

                if (procCounter === 0) {
                  sendResponse(req, res, post, eventList);
                }
              });
          } else {
            procCounter--;

            eventList[idx] = {
              persona: uEvent.persona,
              role: uEvent.role,
              event: event
            };

            if (procCounter === 0) {
              sendResponse(req, res, post, eventList);
            }

          }
        });
      }

    });
};

function sendResponse(req, res, post, eventsList) {
  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, eventsList);
  post(null, req, res);
}
