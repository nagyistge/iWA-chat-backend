'use strict';

/**
 * Parse the url query of the request to parametrize the timeline's messages to retrieve.
 *
 * The expected req.body.query attributes are (all are optional):
 *  [numMsgs]: The maximum number of timeline's messages to retrieve
 *  [dateLastMsg]: The date of the last message that the WebApp knows.
 *
 * Thi pre-middleware create or add to the existent the req.processed.event.timeline object the next
 * attributes:
 *  # message_collection: This value is expected that it may be populate by another pre-middleware,
 *    so if it exists, its current value will be leave, otherwise the message_collection will be
 *    populate from the user's session if it is defined in the settings of the specified event or
 *    the current event message's collection will be used like the last fallback and populated and
 *    saved in the user's session.
 *  # num_max_messages: The maximum number of messages to get, if it hasn't been sent then a default
 *    values is used.
 *  # [newest_message_created_at]: the date of the newest message to get, if it hasn't been sent then
 *    it is not populated.
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.processed.event.id must exist
 *    # req.session must exist
 *    # user is authorized to access to the specified event
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// Datasources
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
// iWazat Models
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
// Utils
var check = require('validator').check;

/**
 * Globals
 */
var EventModel;
var timelineDefaults;

//Initialize the non straight away global variables
(function initialize() {
  EventModel = iWAMongo.model(iWAEvent);
  timelineDefaults = settings.entities.events.timeline;
}());

module.exports = function (req, res, next) {

  var eventId = req.processed.event.id;
  var procTimeline = req.processed.event.timeline;
  var messageColName;

  if (!procTimeline) {
    procTimeline = {};
  }

  try {
    check(req.query.numMsgs).isInt();

    if ((req.query.numMsgs > timelineDefaults.num_max_messages_allowed) || (req.query.numMsgs < 1)) {
      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.ClientAttack('Controller: event # Pre-middleware: parseTimelineQuery ' +
          '| Specified to retrieve more than the maximum timeline\'s message allowed', 603, req,
          req.query));
      helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'timeline\'s message');
      return;
    }

    procTimeline.num_max_messages = req.query.numMsgs;
  } catch (e) {
    procTimeline.num_max_messages = timelineDefaults.num_max_messages;
  }

  try {
    check(req.query.dateLastMsg).isDate();
    procTimeline.newest_message_created_at = req.query.dateLastMsg;
  } catch (e) {
    // Nothing
  }

  if (!procTimeline.message_collection) {

    messageColName =
      iWASession.getEventUserSettings(req.session, eventId, 'timeline.message_collection');

    if (messageColName !== undefined) {
      procTimeline.message_collection = messageColName;
      helperPreMiddlewares.addProcessedData(req, 'event.timeline', procTimeline, false);
      next();

    } else {
      // Use the current messages collection of the event's timeline
      EventModel.currentMessageCollection(eventId, function (err, colName) {
        if (err) {
          helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: event # ' +
            'Pre-middleware: parseTimelineQuery |  Error when retrieving the event: ' + eventId,
            520, err), 520);
          helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'event');
          return;
        }

        if (colName === null) {
          helperPreMiddlewares.traceErrors(req,
            new iWAErrors.HttpRequest('Controller: event # Pre-middleware: parseTimelineQuery | ' +
              'The specified event doesn\'t exist. Event id: ' + eventId, 400, req));

          helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
        } else {
          // Save the current collection in the user's settings of the event
          iWASession.addEventUserSettings(req.sess, eventId, {
            timeline: {
              message_collection: colName
            }
          });
          procTimeline.message_collection = colName;
          helperPreMiddlewares.addProcessedData(req, 'event.timeline', procTimeline, false);
          next();
        }
      });
    }
  } else {
    next();
  }

};
