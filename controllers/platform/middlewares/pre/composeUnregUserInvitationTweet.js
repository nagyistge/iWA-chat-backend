'use strict';

/**
 * Create a twitter's statuses/update object from req.processed.invitation object and populate
 * it into req.processed.twitterObject.
 *
 * the statuses/update object fulfil the specification of twitter API 1.1, but this pre-middleware
 * only attaches the require 'status' property.
 *
 *
 * Pre-conditions:
 *    # user must be authenticated
 *    # req.processed.invitation exists and has the next properties:
 *      - {String} event: Event's id
 *      - {Object} user: Guest user's contact data
 *      - {String} [source_id]: The tweet id; if it exists, then the invitation will be sent as
 *          a reply of that tweet.
 */

var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

// Hybrid middlewares
var getEventRefInfo = require(settings.ctrlsPath + '/event').middlewares.pre.getReferenceInfo;
var getCurrentPersContactData = require(settings.ctrlsPath + '/user').middlewares.pre.getCurrentPersContactData;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Utils
var async = require('async');

/**
 * Globals
 */
var webAppBaseUrl;

// Initialise non-straight forward variables
(function initialise() {

	var iWazatApp = require(settings.configsPath + '/iWazatServer');
	var configLoader = require(settings.libsPath + '/iwazat/util/config');

	webAppBaseUrl = 'http://' + configLoader.getConfiguration(iWazatApp, 'http').publicBaseUrl + '/';

}());


module.exports = function (req, res, next) {

	var invitation = req.processed.invitation;
	var guestUser = invitation.user;
	req.processed.event = invitation.event;

	async.parallel({
		eventRef: function (asyncCb) {
			getEventRefInfo(req, res, function callback(err, eventRefInfo) {
				asyncCb(err, eventRefInfo);
			});
		},
		hostUser: function (asyncCb) {
			getCurrentPersContactData(req, res, function callback(err, userContactData) {
				asyncCb(err, userContactData);
			});
		}
	}, function (iwaErr, results) {

		if (iwaErr) {
			helperPreMiddlewares.traceErrors(req, iwaErr);
			helperPreMiddlewares.sendRespOfIssue(req, res, iwaErr.code, 'composing user invitation');
			return;
		}

		/*
			@twitternick, <<name logged user>> invited you to join the <<event.title>> community at
			<<eventurl>>!
		 */
//		var status = Date() + ' / ' + results.hostUser.nickname + ' invited you to an awesome iWazat ' +
//			'event ' + webAppBaseUrl + results.eventRef.slug;

		var tweetObj = {
			status: '@' + guestUser.social_network_accounts[0].account_name + ', ' +
				results.hostUser.personas[0].nickname + ' invited you to join the ' +
				results.eventRef.title + ' community at ' + webAppBaseUrl + results.eventRef.slug
		};

		if (invitation.source_id) {
			tweetObj.in_reply_to_status_id = invitation.source_id;
		}

		helperPreMiddlewares.addProcessedData(req, 'twitterObject', tweetObj, false, next);
	});

};
