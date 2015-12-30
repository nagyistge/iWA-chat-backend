'use strict';

/**
 * The middleware checks if the user which invites the unregistered user, is able to do it, checking
 * that the guest user exists and the specified event is the list of events interacted externally.
 *
 * The middleware will replace the user id, under req.processed.invitation.user by his contact data.
 *
 * Pre conditions:
 *   # user must be authenticated
 *   # user must be authorised to access to the event specified in the invitation; although it
 *      cannot warranty that the user sent the request from that event, the security is enough to
 *      know that the user has access to the event and it accessed in his current alive session
 *   # req.processed.invitation must exist and has the attributes
 *      - user: The user id to invite
 *      - event The event id where the host user (user that invites) sent the invitation
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
var iWAUser = require(settings.modelsPath + '/iwazat/user');

/**
 * Globals
 */
// Models
var UserModel;

//Initialize the non straight away global variables
(function initialize() {

	UserModel = iWAMongo.model(iWAUser);

}());


module.exports = function (req, res, next) {

	var invitation = req.processed.invitation;

	// Unregistered user only has a default persona, it really doesn't need the
	// persona's social_network_accounts reference because they are the same
	UserModel.find({
			_id: invitation.user,
			account_status: 'unregistered',
			events_externally_interacted: new ObjectId(invitation.event)
		},
		{
			_id: true,
			social_network_accounts: {$elemMatch: {type: 'Twitter'}},
			'personas.nickname': true
		},
		function (err, userDocs) {

			if (err) {
				helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: users # ' +
					'Pre-Middleware: checkInvitationUnregistered | Error when trying to get the info of the ' +
					'user with the id ' + invitation.user, 520, err));
				helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'unregistered user invitation');
				return;
			}

			if ((userDocs) && (userDocs.length === 1) &&
				(userDocs[0].social_network_accounts.length === 1)) {
				// It is not needed to use addProcessedData helper, because it must only update an existing
				// attribute
				invitation.user = userDocs[0];
				next();
			} else {
				helperPreMiddlewares.traceErrors(req, new iWAErrors.HttpRequest('Controller: users # ' +
					'Pre-Middleware: checkInvitationUnregistered | The guest user doesn\'t exist or doesn\'t ' +
					'fulfil the requirements to send an invitation', 400, req));
				helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'unregistered user invitation');
			}

		});

};