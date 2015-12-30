module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

// Utils
var util = require('util');
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWAUser = require(settings.modelsPath + '/iwazat/user');


/**
 * Globals
 */
// Models
var EventModel;
var UserModel;


//Initialize the non straight away global variables
(function initialize() {

  EventModel = iWAMongo.model(iWAEvent);
  UserModel = iWAMongo.model(iWAUser);

}());

module.exports = function (req, res, next, post) {

  var eventFilter;
  var eventRef = req.params.eventRef;

  // Detect if the request send the event id or the slug
  if (/^[0-9A-Fa-f]{24}$/.test(eventRef)) {
    eventFilter = { _id: eventRef }
  } else {
    eventFilter = { slug: eventRef };
  }

  EventModel.findOne(eventFilter, {
    slug: true,
    title: true,
    description: true,
    start_date: true,
    end_date: true,
    dates_timezone: true,
    location: true,
    language: true,
    tags: true,
    skills_suggestions: true,
    design: true,
    design_banner_image: true,
    design_background_image: true,
    owner: true,
    organiser_details: true,
    social_accounts: true,
    participants: true
  }, {
    lean: true
  }, function (err, event) {
    if (err) {
      helperGlobal.addError(req,
        new iWAErrors.Db('Controller: event # Action: publicInfo | Error when trying to get '
          + 'the info of the event: ' + util.inspect(eventFilter), 520, err), 520);
      sendResponse(req, res, next, post);
      return;
    }

    if (!event) {
      helperGlobal.addError(req,
        new iWAErrors.HttpRequest('No event found: ' + util.inspect(eventFilter)), 404);

      sendResponse(req, res, next, post);
      return;
    }

    event.num_participants = event.participants.length;
    delete event.participants;

    if ((!event.organiser_details) || (!event.organiser_details.avatar)) {

      UserModel.getUserPersona(event.owner._id, event.owner.persona,
        ['avatars'],
        ['avatar'],
        function (err, owner) {
          if (err) {
            helperGlobal.addError(req,
              new iWAErrors.Db('Controller: event # Action: publicInfo | Error when trying to ' +
                'figure the organiser avatar from the event\'s owner. Event:' +
                util.inspect(eventFilter),
                520, err), 520);
            sendResponse(req, res, next, post);
            return;
          }


          delete event.owner;

          if (!event.organiser_details) {
            event.organiser_details = {
              avatar: owner.personaAvatar()
            };
          } else {
            event.organiser_details.avatar = owner.personaAvatar();
          }

          sendResponse(req, res, next, post, event);
        });
    } else {
      sendResponse(req, res, next, post, event);
    }
  });
};

function sendResponse(req, res, next, post, event) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  if (!event) {
    next('route');
  } else {
    res.json(200, event);
  }

  post(null, req, res);
}