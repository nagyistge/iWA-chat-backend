'use strict';

/**
 * Parse the request's body, to create an unregistered user invitation object under
 * req.processed.invitation; invitation object has the next attributes:
 *  # {String} event: The event's id from the invitation has been sent
 *  # {String} user: The guest user's id
 *  # {String} [source_id]: The message id provided by the source (external system) which generated
 *      it.
 *
 * The pre-middleware picks up from request's body the 'event' and 'user' attributes to create the
 * invitation object commented above, any other parameter will be ignored.
 *
 *
 * The pre-middleware does some basic checks of the syntax of the parameters and if some of the fails,
 * then it sends a response with the issue detected and abort the route pre-middleware/action chain
 * left
 *
 *  Pre-Middleware type: frontline
 */

var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


module.exports = function (req, res, next) {

	var objectIdRegExp = /^[0-9A-Fa-f]{24}$/;
	var eventId = req.body.event;
	var guestUserId = req.body.user;
	var invitationObj;

	if ((objectIdRegExp.test(eventId)) && (objectIdRegExp.test(guestUserId))) {

		invitationObj = {
			event: eventId,
			user: guestUserId
		};

		if (req.body.source_id) {
			invitationObj.source_id = req.body.source_id;
		}

		helperPreMiddlewares.addProcessedData(req, 'invitation', invitationObj, false);
		next();

	} else {
		helperPreMiddlewares.traceErrors(req,
			new iWAErrors.HttpRequest('Controller: platform # Pre-middleware: parseUnregUserInvitation ' +
				'| The sent parameters don\'t fulfil the invitation\'s requirements', 400, req));

		helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'unregistered user invitation');
	}
};
