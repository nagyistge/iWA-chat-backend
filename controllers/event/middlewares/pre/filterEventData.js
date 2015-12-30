'use strict';

/**
 * Operations:
 *
 * 1) Parse the event data received in the body of the request and populate them into the
 * req.processed.event object.
 *
 * 2) The middleware also extracts the language or from the request body under language parameter,
 * expecting the language abbreviation or if that parameter doesn't exist then it extract from the
 * event object, expecting the language's abbreviation or long name. Then the
 * req.processed.system.language is populated with an object that hold information about that
 * languages.
 *
 *
 * The pre-middleware does some basic checks of the received data and if some of the fails,
 * then it sends a response with the issue detected and abort the route pre-middleware/action chain left
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.body.event  must exist and it must be an object with the next attributes
 *     {
 *       [id]: If it exists, then a basic checking will be done to check if the parameter is a valid
  *         striginfy version of an ObjectId
  *      [language]: String with the abbreviation or full name of the language of the event, it is
  *       optional but it will be required if it doesn't exist the language parameter, see the next
  *       pre-condition
 *     },
 *     # req.body.language String with the abbreviation of the language to use, this parameter take
 *      preference over req.body.event.language, it is optional, but if it doesn't exist then
 *      req.body.event.language must exist and contains a valid value.
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

// Datasources
var iWAStatic = require(settings.dataSourcesPath + '/iwaStatic');

/**
 * Globals
 */
var objectIdRegExp;

//Initialize the non straight away global variables
(function initialize() {
  objectIdRegExp = /^[0-9A-Fa-f]{24}$/;
}());


module.exports = function (req, res, next) {

  var event = req.body.event;
  var lang;

  if ((!event) || ('object' !== typeof event)) {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: event # Pre-middleware: filterEventData | ' +
        'Event data has not been sent or it is wrong type', 400, req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
    return;
  }

  if ((event._id) && (!(objectIdRegExp.test(event._id)))) {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: event # Pre-middleware: filterEventData | ' +
        'Event\'s data object contains a wrong id. Event id: ' + event._id, 400, req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
    return;
  } else {
    lang = req.body.language;

    if (!lang) {
      lang = iWAStatic.getLangByAbbreviation(event.language);

      if (!lang) {
        lang = iWAStatic.getLangByName(event.language);
      }

    } else {
      lang = iWAStatic.getLangByAbbreviation(lang);
    }

    // TODO: Language force to english in the current release
    lang = iWAStatic.getLangByAbbreviation('en');
    /***/

    if (!lang) {
      helperPreMiddlewares.traceErrors(req,
        new iWAErrors.HttpRequest('Controller: event # Pre-middleware: filterEventData | ' +
          'The language cannot be inferred from the data sent. Event id: ' + event._id, 400, req));
      helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event');
      return;
    }

    helperPreMiddlewares.addProcessedData(req, 'event', event, false);
    helperPreMiddlewares.addProcessedData(req, 'system.language', lang, false);
    next();
  }
};
