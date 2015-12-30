'use strict';

/**
 * The action confirm if a slug is accepted to a new or existent event.
 * If the request is to change the slug of an existent event, then the event id must be sent to
 * avoid to return a false negative because the slug match with the existent event
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.body should contain:
 *      - slug: the slug to check
 *      - id: The event to update the slug
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
var EventModel;
var slugRegex;


//Initialize the non straight away global variables
(function initialize() {

  EventModel = iWAMongo.model(iWAEvent);
  slugRegex = /^([\w\d\.-]){3,}$/;

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var reservedPathWords;
  var slugToCheck = req.body.slug;

  if ((slugToCheck) || ('string' === typeof slugToCheck)) {

    slugToCheck = slugToCheck.match(slugRegex);

    //malformed url it shouldn't happen
    if (slugToCheck === null) {

      sendResponse(req, res, next, post, {
        available: false,
        message: 'The slug is less than 3 character or contains some character which is a letter, ' +
          'number, _, . or -'
      });
      return;
    }

    slugToCheck = slugToCheck[0];
    reservedPathWords = settings.wireXRoutes.routePathWords;

    if ((reservedPathWords[slugToCheck]) && (reservedPathWords[slugToCheck].indexOf(1) >= 0)) {
      sendResponse(req, res, next, post, {
        available: false,
        message: 'The slug is a reserved word'
      });
      return;
    }
  } else {
    helperGlobal.addError(req,
      new iWAErrors.HttpRequest('Controller: event # Action: checkNewSlug' +
        '| The slug to check has not been sent', 400, req), 400);
    sendResponse(req, res, next, post);
    return;
  }


  var eventIdToUpdate = req.body.id;

  if ((!eventIdToUpdate) || (!/^[0-9A-Fa-f]{24}$/.test(eventIdToUpdate))) {
    eventIdToUpdate = false;
  }


  EventModel.findOne({
    slug: slugToCheck
  }, {
    _id: true
  }, {
    lean: true
  }, function (err, event) {
    if (err) {
      helperGlobal.addError(req,
        new iWAErrors.Db('Controller: event # Action: checkNewSlug | Error when find an event ' +
          'from the database, under slug: ' + slugToCheck, 520, err), 520);
      sendResponse(req, res, next, post);
      return;
    }

    if (!event) {
      sendResponse(req, res, next, post, {
        available: true
      });
    } else {
      if (event._id.toString() === eventIdToUpdate) {
        sendResponse(req, res, next, post, {
          available: true
        });
      } else {
        sendResponse(req, res, next, post, {
          available: false,
          message: 'The slug is already used by another event'
        });
      }
    }
  });
};

function sendResponse(req, res, next, post, checkObj) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, checkObj);
  post(null, req, res);
}