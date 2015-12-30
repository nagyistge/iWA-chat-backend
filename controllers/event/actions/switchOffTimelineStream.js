'use strict';

/**
 * The action close the stream of the event's timeline and update the timeline status of the event
 * in the DDBB.
 *
 * If the  stream is in a state which doesn't agree with the performed action then the stream state
 * change is ignored but one error will be reported.
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authorized to manage this event
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
// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
var timelineStream = require(settings.servicesPath + '/iwazat/events/timeline');

/**
 * Globals
 */
var EventModel;


// Initialize the non straight away global variables
(function initialize() {
  EventModel = iWAMongo.model(iWAEvent);
}()); // End module initialization

/**
 * The function of the action
 *
 */
module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }


  var eventId = req.processed.event.id;

  EventModel.findByIdAndUpdate(eventId,
    {
      $set: {timeline_status: 'close'}
    },
    {
      new: true,
      upsert: false,
      select: {
        _id: true,
        timeline_status: true,
        social_accounts: true,
        message_collection_count: true
      }
    },
    function (err, event) {
      if (err) {
        helperGlobal.addError(req,
          new iWAErrors.Db('Controller: event # Action: switchOffTimelineStream ' +
            '| Error when trying to update the event with the id ' + eventId, 521, err), 521);
        sendResponse(req, res, next, post);
        return;
      }

      if (!event) {
        helperGlobal.addError(req, new iWAErrors.HttpRequest('Controller: event # Action: ' +
          'switchOffTimelineStreamStream | The event doesn\'t exist. Event id ' + eventId, 404, req),
          404);
        sendResponse(req, res, next, post);
        return;
      }

      if (timelineStream.close(event) === false) {
        helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # Action: ' +
          'switchOffTimelineStream | The stream of the event with id: ' + eventId +
          ' was already closed, so the call may come out of the web application\'s frontend', 603,
          req, 'Authenticated user id: ' + iWASession.getAuthUser(req.session).id), 603);
      }

      sendResponse(req, res, next, post);
    }
  );
};

/**
 *  Function to unify the response
 */
function sendResponse(req, res, next, post) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.send(200);
  post(null, req, res);
}