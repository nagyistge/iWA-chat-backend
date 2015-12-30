/**
 * Populate the req.processed.event.timeline.message_collection with the name of the current
 * collection of the specified event
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.processed.event.id must exist
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
var iWALibObj = require(settings.libsPath + '/iwazat/util/objects');
var check = require('validator').check;

/**
 * Globals
 */
var EventModel;

//Initialize the non straight away global variables
(function initialize() {
  EventModel = iWAMongo.model(iWAEvent);

}());

module.exports = function (req, res, next) {

  // Use the current messages collection of the event's timeline
  EventModel.currentMessageCollection(req.processed.event.id, function (err, colName) {
    if (err) {
      helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: event # ' +
        'Pre-middleware: setCurrentTimelineCol |  Error when retrieving the event: ' + eventId,
        520,
        err), 520);
      helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'event');
      return;
    }

    if (colName === null) {
      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.HttpRequest('Controller: event # Pre-middleware: setCurrentTimelineCol | ' +
          'The specified event doesn\'t exist. Event id: ' + eventId, 400, req));

      helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
    } else {
      helperPreMiddlewares.addProcessedData(req, 'event.timeline.message_collection', colName, false);
      next();
    }
  });


};
