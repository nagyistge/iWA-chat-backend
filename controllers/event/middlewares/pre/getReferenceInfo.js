'use strict';

/**
 * The middleware gets the event's reference information.
 *
 * The middleware check req.processed.event's type, if it is a string then it regards that it is
 * an event's id, otherwise it must to be an object with 'id' property specifying the event's id
 * and 'procRef' property specifying the name (in dot notation) to attach the event's reference
 * information into req.processed; when it is a string the event's reference information will
 * replace req.processed.event with it, otherwise the procRef will be used replacing the value
 * in the case that the specified property's name existed.
 *
 * The middleware is an hybrid function so it can be used to get the result generated to it
 * rather than attaching them to req.processed or sending an error response on error;  to call
 * in this mode the third argument must be non-anonymous function with name 'callback'.
 *
 *
 * Pre conditions:
 *   # req.processed.event must exist and it must be a string (it should contain an event's id) or
 *      an object with the following properties:
 *        # id: Event's id
 *        # procRef: property name (in dot notation) to attach the event's reference information
 *          into req.processed
 */

var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var ObjectId = require('mongoose').Types.ObjectId;
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');

/**
 * Globals
 */
// Models
var EventModel;

//Initialize the non straight away global variables
(function initialize() {

	EventModel = iWAMongo.model(iWAEvent);

}());


module.exports = function (req, res, nextOrCb) {

	var eventId;
	var procRef;

	if ('object' === typeof req.processed.event) {
		eventId = req.processed.event.id;
		procRef = req.processed.event.procRef;
	} else {
		eventId = req.processed.event;
		procRef = 'event';
	}

	EventModel.findById(eventId,
		{
			_id: true,
			title: true,
			slug: true
		},
		function (err, eventDoc) {

			var iwaErr;

			if (err) {
				iwaErr = new iWAErrors.Db('Controller: event # ' +
					'Pre-Middleware: getReferenceInfo | Error when trying to get the event\'s reference ' +
					'information. Event\'s id ' + eventId, 520, err);

				if ('callback' === nextOrCb.name) {
					nextOrCb(iwaErr);
				} else {
					helperPreMiddlewares.traceErrors(req, iwaErr);
					helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'event\'s reference information');
				}

				return;
			}

			if (eventDoc) {

				if ('callback' === nextOrCb.name) {
					nextOrCb(null, eventDoc);
				} else {
					helperPreMiddlewares.addProcessedData(req, procRef, eventDoc, true);
					nextOrCb();
				}
			} else {
				iwaErr =  new iWAErrors.HttpRequest('Controller: users # Pre-Middleware: ' +
					'checkInvitationUnregistered | No event with the id: ' + eventId, 400, req);

				if ('callback' === nextOrCb.name) {
					nextOrCb(iwaErr);
				} else {
					helperPreMiddlewares.traceErrors(req, iwaErr);
					helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'event\'s reference information');
				}
			}
		});

};