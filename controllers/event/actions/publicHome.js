module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

//Services
//Services
var iWAFtReporter = require(settings.servicesPath + '/iwazat/frontendReporter');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');

/**
 * Globals
 */
var EventModel;

/**
 * Initialize global variables with non straightforward values
 */
(function initiliaze() {
  EventModel = iWAMongo.model(iWAEvent);

}());


module.exports = function (req, res, next, post) {

  // Although this route shouldn't be reached if requests carry a reserved word, this check
  // allows to by pass this route to the next one that match the url
  if (helperGlobal.isUrlReserved(req)) {
    next('route');
    return;
  }

  var eventSlug = req.params[0].toLowerCase();

  EventModel.findOne({
    slug: eventSlug
  }, {
    _id: true
  }, {
    lean: false
  }, function (err, event) {
    if (err) {
      helperGlobal.addError(req,
        new iWAErrors.Db('Controller: event # Action: publicHome | Error when trying to find the'
          + ' event with the slug ' + eventSlug, 520, err), 520);

      sendResponse(req, res, next, post);
      return;
    }

    if (!event) {
      helperGlobal.addError(req,
        new iWAErrors.HttpRequest({
          message: 'No event found under the url ' + eventSlug,
          frontend_instruction: iWAFtReporter.createReportObject('suggest', 'event', 'create', {
            slug: eventSlug
          })
        }, 404, req), 404);

      sendResponse(req, res, next, post);
      return;
    }

    sendResponse(req, res, next, post, eventSlug);
  });
};

function sendResponse(req, res, next, post, eventSlug) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  if (!eventSlug) {
    next('route');
  } else {
    res.redirect(302, '/#/event/' + eventSlug);
  }

  post(null, req, res);
}
