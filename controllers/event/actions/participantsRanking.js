'use strict';

/**
 * The action return the list of the attendees of the requested event ranked according the
 * preferences of the attendee tha send the request
 *
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authorized to access to this event
 *    # req.processed must exist
 *    # req.processed.event  must exist and it must be an object with the next attributes
 *    {
 *      id: Event id to update
 *    }
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

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');


/**
 * Globals
 */
// Models
var EventModel;

//Initialize the non straight away global variables
(function initialize() {

  EventModel = iWAMongo.model(iWAEvent);

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var eventId = req.processed.event.id;

  EventModel.findById(eventId, function (err, event) {
    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: event # Action: participantsRanking | '
      + 'Error when trying to retrieve the event from the database, event id: ' + eventId, 520, err),
        520);
      sendResponse(req, res, next, post);
      return;
    }

    if (!event) {
      helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # Action: ' +
        'participantsRanking | The event doesn\'t exist in the database. Event id: ' + eventId,
        602, req), 602);
      sendResponse(req, res, next, post);
    }

    event.getParticipantsList(function(errs, participantDocs) {

      if (errs) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: event # Action: participantsRanking | '
          + 'Error when trying to compute the event\'s participants list of the event: ' + eventId,
          525, err), 525);
        sendResponse(req, res, next, post);
        return;
      }

      if (!participantDocs) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: event # Action: participantsRanking | '
          + 'Participants have not been retrieved from the event: ' + eventId,
          525, err), 525);
        sendResponse(req, res, next, post);
        return;
      }


      var participants = [];
      var participant;

      // TODO compute the raking according the requester user's 3Qs and the participants' 3Qs
      participantDocs.forEach(function (pDoc) {

        participant = {
          _id: pDoc.id,
          persona: (pDoc.personas[0].is_default === true) ? 'default' : pDoc.personas[0]._id,
          nickname: pDoc.personas[0].nickname,
          avatar: pDoc.personaAvatar(),
          ranking_assessment: 0
        };
        participants.push(participant);
      });

      sendResponse(req, res, next, post, participants);

    });
  });
};

function sendResponse(req, res, next, post, participants) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, participants);
  post(null, req, res);
}