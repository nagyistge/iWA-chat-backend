/**
 * The pre-middleware check the authorization of the authenticated user to access to requested event,
 * if event is not requested then by past to next pre-middleware or action depending the
 *
 *
 * If event authorization is requested this pre-middleware populate req.processed.event with an
 * object with this fields:
 {
    event_info: {
        id: eventId
        timeline_collection: 'the current message collection of the event'
        slug: The event's slug
    }
    user_relation: {
        allowed: 'ok' | 'no' | 'pending'
        role: If allowed 'ok' then the user role: 'owner', 'manager', 'contributor', 'attendee'
        first_time: true (only exists if allowed is ok o pending and is the firstTime,
                  otherwise this filed doesn't exist)
  }
*
*  Pre conditions:
*    # req.session must exist
*    # user is authenticated
*    # req.processed must exist
*    # req.processed.event if it exists then it must be an object with id attribute
*/

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Action helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
// Utils
var iWAUtilObj = require(settings.libsPath + '/iwazat/util/objects');


/**
 * Globals
 */
// Models
var EventModel;

//Initialize the non straight away global variables
(function initialize() {

  EventModel = iWAMongo.model(iWAEvent);

}());

module.exports = function (req, res, next) {

  if (helperPreMiddlewares.jumpIfErrors(req, res, next)) {
    return;
  }

  if (!req.processed.event) {
    next();
    return;
  }

  var eventId = req.processed.event.id;
  var eventSessData = iWASession.getEvent(req.session, eventId);

  if (!eventSessData) {
    // Checking the access of the user in the event, because it has not been requested before in the
    // current session

    var user = iWASession.getAuthUser(req.session);

    //var EventModel = iWAMongo.model(iWAEvent);
    var query = EventModel.find();

    query.where('_id', eventId);
    query.select({
      _id: true,
      slug: true,
      timeline_status: true,
      message_collection_count: true,
      access: true,
      owner: true,
      managers: {$elemMatch: {_id: user.id}},
      contributors: {$elemMatch: {_id: user.id}},
      guests: {$elemMatch: {_id: user.id}},
      unaccepted: {$elemMatch: {_id: user.id}},
      requesters: {$elemMatch: {_id: user.id}},
      participants: {$elemMatch: {_id: user.id}}
    });

    query.exec(
      function (err, events) {
        if (err) {
          helperGlobal.addError(req, new iWAErrors.Db('Controller: event # pre-middleware: ' +
            'authorization | Error trying to get the info of the Event with the id ' + eventId,
            520, err), 520);
          next();
          return;
        }
        if (!events) {
          helperGlobal.addError(req,
            new iWAErrors.HttpRequest('Controller: event # pre-middleware: ' +
              'authorization | No event found with the id ' + eventId, 404, req), 404);
          next();
          return;
        }

        var event = events[0];

        if (event.owner.id === user.id) {

          eventSessData = iWASession.setEventOwner(req.session, event, event.owner.persona);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.managers.length === 1) {

          eventSessData = iWASession.setEventManager(req.session, event, event.managers[0].persona);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.contributors.length === 1) {

          eventSessData = iWASession.setEventContributor(req.session,
            event, event.contributors[0].persona);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.participants.length === 1) {

          eventSessData = iWASession.setEventAttendee(req.session,
            event, event.participants[0].persona);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.unaccepted.length === 1) {

          eventSessData = iWASession.setEventAccessDenied(req.session, event);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.requesters.length === 1) {

          eventSessData = iWASession.setEventAccessRequested(req.session, event,
            event, event.requesters[0].persona);
          helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);

        } else if (event.guests.length === 1) {
          event.guests[0].remove(function (err) {
            if (err) {
              helperGlobal.addError(req, new iWAErrors.Db('Controller: event # pre-middleware: ' +
                'authorization | Error trying remove a user from the event guests array | user id: ' +
                user.id + ' // event id: ' + eventId, 521, err), 521);
              next();
              return;
            }

            event.registerUser(user, 'participant', function (err) {
              if (err) {
                // TODO implement a post middleware to remove inconsistencies detect to avoid
                // manual operations
                helperGlobal.addError(req, new iWAErrors.Db('Controller: event # pre-middleware: ' +
                  'authorization | Error when registering the user in the event like participant | ' +
                  'Maybe the event has been pushed into User.events_access_allowed array so a manual ' +
                  ' operation may be required to remove it | user id: ' + user.id +
                  ' // event id: ' + eventId, 522, err), 522);
                next();
                return;
              }

              eventSessData = iWASession.setEventAttendee(req.session, event, user.persona.id);

              var procEvent = iWAUtilObj.clonePlainObject(eventSessData);
              procEvent.first_time = true;

              helperPreMiddlewares.addProcessedData(req, 'event_auth', procEvent, true, next);
            });
          }); // End user is in the guests list

        } else {
          if (event.access === 'public') {
            event.registerUser(user, 'participant', function (err) {
              if (err) {
                // TODO implement a post middleware to remove inconsistencies detect to avoid
                // manual operations

                helperGlobal.addError(req, new iWAErrors.Db('Controller: event # pre-middleware: ' +
                  'authorization | Error when registering the user in the event like participant' +
                  ' | Maybe the event has been pushed into User.events_access_allowed array so a ' +
                  'manual operation may be required to remove it | user id: ' + user.id +
                  ' // event id: ' +
                  eventId, 522, err), 522);
                next();
                return;
              }

              eventSessData = iWASession.setEventAttendee(req.session, event, user.persona.id);

              var procEvent = iWAUtilObj.clonePlainObject(eventSessData);
              procEvent.first_time = true;
              helperPreMiddlewares.addProcessedData(req, 'event_auth', procEvent, true, next);
            });

          } else {
            event.registerRequester(user, function (err) {
              if (err) {
                // TODO implement a post middleware to remove inconsistencies detect to avoid
                // manual operations

                helperGlobal.addError(req, new iWAErrors.Db('Controller: event # pre-middleware: ' +
                  'authorization | Error when registering the user in the event like requester | ' +
                  'Maybe the event has been pushed into User.events_access_requests array so ' +
                  ' operation may be required to remove it | user id: ' + user.id +
                  'manual // event id: ' +
                  eventId, 522, err), 522);
                next();
                return;
              }

              eventSessData =
                iWASession.setEventAccessRequested(req.session, event, user.persona.id);

              var procEvent = iWAUtilObj.clonePlainObject(eventSessData);
              procEvent.first_time = true;
              helperPreMiddlewares.addProcessedData(req, 'event_auth', procEvent, true, next);
            });
          }
        }
      });
  } else {
    // The user session already contains access information to the event
    helperPreMiddlewares.addProcessedData(req, 'event_auth', eventSessData, true, next);
  }
};



