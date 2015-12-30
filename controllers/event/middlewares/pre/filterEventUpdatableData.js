'use strict';

/**
 * Check that event id has been sent and filter the event data object to remove fields which are
 * not updatable straight away (i.e. of sending the main event data fields rather than one).
 *
 * Operations:
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

// System
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Utils
var screen = require('screener').screen;

/**
 * Constants
 */
var LOG_PREFIX = 'Controller --> event | Pre-Middleware --> filterEventUpdatableData: ';


module.exports = function (req, res, next) {

	var eventObj = req.processed.event;
	var eventId = eventObj._id;

	// Event id is not possible to update but it is required to know the event to update
	if (!eventObj._id) {
		helperPreMiddlewares.traceErrors(req,
			new iWAErrors.HttpRequest(LOG_PREFIX + 'Event id is required', 400, req));

		helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event update');
		return;
	}

	eventObj = screen(eventObj, {
		slug: 'string',
		title: 'string',
		description: {
			short: 'string',
			long: 'string'
		},
		start_date: 'string',
		end_date: 'string',
		dates_timezone: 'string',
		timeline_status: 'string',
		location: 'object',
		language: 'string',
		tags: true,
		skills_suggestions: true,
		organiser_details: true,
		design: 'object',
		social_accounts: 'object',
		managers: true,
		contributors: true,
		sponsors: true,
		access: 'string'
	});

	eventObj.id = eventId;
	helperPreMiddlewares.addProcessedData(req, 'event', eventObj, true, next);
};
