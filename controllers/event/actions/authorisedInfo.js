'use strict';
/**
 *  Retrieve the event's information regarding the information level requested or regarding the
 *  session
 *
 *  Pre conditions:
 *    # req.processed.event.id must exist
 *    # req.processed.event.infoLevel is optional, if it doesn't exist then it applies the user's role
 *        of event holds in the session, to retrieve the event's information regarding to it

 */

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
var async = require('async');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWAUser = require(settings.modelsPath + '/iwazat/user');

// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');


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

	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	var eventId = req.processed.event.id;
	var reqInfoLevel = req.processed.event.infoLevel;

	if (!reqInfoLevel) {
		reqInfoLevel = iWASession.getUserRoleEvent(req.session, eventId);
	}


	// TODO Implement the event fields to return depending of the access rights for the specified event

	EventModel.findById(eventId, {
		created_at: true,
		slug: true,
		title: true,
		description: true,
		start_date: true,
		end_date: true,
		dates_timezone: true,
		timeline_status: true,
		location: true,
		language: true,
		tags: true,
		skills_suggestions: true,
		organiser_details: true,
		design: true,
		design_banner_image: true,
		design_background_image: true,
		owner: true,
		message_collection_count: true,
		social_accounts: true,
		participants: true
	}, function (err, event) {
		if (err) {
			helperGlobal.addError(req,
				new iWAErrors.Db('Controller: event # Action: authorisedInfo | Error when trying to get '
					+ 'the info of the event with id: ' + eventId, 520, err), 520);
			sendResponse(req, res, next, post);
			return;
		}

		if (!event) {
			helperGlobal.addError(req,
				new iWAErrors.HttpRequest('No event found. Event id: ' + eventId), 404);

			sendResponse(req, res, next, post);
			return;
		}


		var parallelFns;

		event._info_level = reqInfoLevel;

		event.num_participants = event.participants.length;
		delete event.participants;

		if ((!event.organiser_details) || (!event.organiser_details.avatar)) {

			parallelFns = [
				function (asyncCb) {
					UserModel.getUserPersona(event.owner._id, event.owner.persona,
						['avatars'],
						['is_default', 'avatar'],
						function (err, owner) {
							if (err) {
								helperGlobal.addError(req,
									new iWAErrors.Db('Controller: event # Action: authorisedInfo | Error when trying to ' +
										'figure the organiser avatar from the event\'s owner. Event id: ' + eventId,
										520, err), 520);

								// It passes true rather than an error because each function report the error to
								// have more informed logs
								asyncCb(true);
								return;
							}

							if (owner.personas[0].is_default) {
								event.owner.persona = 'default';
							}

							if (!event.organiser_details) {
								event.organiser_details = {
									avatar: owner.personaAvatar()
								};
							} else {
								event.organiser_details.avatar = owner.personaAvatar();
							}

							// It calls the callback without result because it attaches them to the event
							asyncCb();

						});
				},
				event.dereferenceTags.bind(event)
			];

			async.parallel(parallelFns, function (err, results) {

				if (err) {
					sendResponse(req, res, next, post);
					return;
				}

				// Transform event document object to a plain object to be able to update the tags field
				event = event.toObject();

				// Dereferenced tags are in the second element of the array
				event.tags = results[1];

				sendResponse(req, res, next, post, event);
			});

		} else {

			event.dereferenceTags(function (err, defTags) {

				if (err) {
					helperGlobal.addError(req,
						new iWAErrors.Db('Controller: event # Action: authorisedInfo | Error when trying to ' +
							'deference the event\'s tags. Event id: ' + eventId, 520, err), 520);
					sendResponse(req, res, next, post);
					return;
				}

				// Transform event document object to a plain object to be able to update the tags field
				event = event.toObject();

				// Replace the original array of tags object for the array of deferenced tags objects
				event.tags = defTags;
				sendResponse(req, res, next, post, event);
			});
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