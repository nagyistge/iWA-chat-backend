/**
 * Parse the url parameters of the usual event's urls and populate them into the req.processed.event
 * object.
 * The pre-middleware does some basic checks of the syntax of the parameters and if some of the fails,
 * then it sends a response with the issue detected and abort the route pre-middleware/action chain
 * left
 *
 *  Pre-Middleware type: frontline
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// iWazat Models
var iWAEvent = require(settings.modelsPath + '/iwazat/event');


module.exports = function (req, res, next) {


  var eventId = req.params.eventId;

  if ((eventId) && (/^[0-9A-Fa-f]{24}$/.test(eventId))) {

    helperPreMiddlewares.addProcessedData(req, 'event', {
      id: eventId
    }, false);

    // Check if the url has a parameter that specify the timeline message collection number to use
    if (req.params.msgCollectionNum) {
      helperPreMiddlewares.addProcessedData(req, 'event.timeline.message_collection',
        iWAEvent.resolveMessageCollectionName(eventId, req.params.msgCollectionNum), false);
    }

    next();
  } else {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: event # Pre-middleware: parseUrlParams | ' +
        'Event id has not been sent or it is wrong. Event id: ' + eventId, 400, req));

    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
  }
};
