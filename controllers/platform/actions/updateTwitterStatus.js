'use strict';

/**
 * The action update the iWazat's twitter (application account) status, with the data provided under
 * req.processed.twitterObject.
 * The action call next() if req.processed.nextAction is true (boolean), otherwise send a response.
 *
 * NOTE: The action checks that req.processed.twitterObject exist and fulfil the twitter
 * statuses/update 1.1 API object structure, so it responds with an Error if the object is
 * malformed.
 *
 * Pre conditions:
 *   # req.processed must exist
 *
 */
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Utils
var screen = require('screener').screen;
var uInspect = require('util').inspect;

/**
 * Globals
 */
var twit;

// Initialization of non-straight away variables
(function initialize() {

	var twitterCnf = require(settings.configsPath + '/twitter');
	var configLoader = require(settings.libsPath + '/iwazat/util/config');
	var twitterAppCnf = configLoader.getConfiguration(twitterCnf, 'iWazat_app');

	twit = new (require('twit'))({
		consumer_key: twitterAppCnf.consumer_key,
		consumer_secret: twitterAppCnf.consumer_secret,
		access_token: twitterAppCnf.access_token,
		access_token_secret: twitterAppCnf.access_token_secret
	});

}());


module.exports = function (req, res, next, post) {

	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	var error;
	var updateTwitterObject = screen(req.processed.twitterObject, {
		status: 'string',
		in_reply_to_status_id: 'string',
		lat: 'number',
		long: 'number',
		place_id: 'string',
		display_coordinates: 'boolean'
	});

	if (!updateTwitterObject.status) {

		error = new iWAErrors.ServerApp('Controller: platform # ' +
			'Action: updateTwitterStatus | Malformed twitter statuses/update object: ' +
			uInspect(updateTwitterObject));

		if (true === req.processed.nextAction) {
			sendResponse(error, req, res, next, post);
		} else {
			helperGlobal.addError(req, error, 500);
			sendResponse(error, req, res, null, post);
		}

		return;
	}

	// optimising the response received from twitter
	updateTwitterObject.trim_user = true;

	twit.post('statuses/update', updateTwitterObject, function (err, tweet) {
		var errorObj;
		var foreseenTwitterErr;

		if (err) {

			// Check if the error reported is a duplicate status
			if ((403 === err.statusCode) && (err.twitterReply)) {
				foreseenTwitterErr = JSON.parse(err.twitterReply).errors;

				if ((foreseenTwitterErr) && (1 === foreseenTwitterErr.length)) {
					foreseenTwitterErr = foreseenTwitterErr[0];
				} else {
					foreseenTwitterErr = null;
				}
			}


			if ((!foreseenTwitterErr) || (187 !== foreseenTwitterErr.code) ||
				(true === req.processed.nextAction)) {

				errorObj = new iWAErrors.UnderlyingSystem('Controller: platform # ' +
					'Action: updateTwitterStatus | Twitter statuses/update error, sent object: ' +
					updateTwitterObject, 533, err);

				if (true === req.processed.nextAction) {
					sendResponse(errorObj, req, res, next, post);
				} else {
					helperGlobal.addError(req, errorObj, 533);
					sendResponse(errorObj, req, res, null, post);
				}

				return;
			}

		}

		if (true === req.processed.nextAction) {

			// Because the action is chained with another it use a pre-middleware helper to add
			// the received raw tweet object to the request to pass it to the follow route chain's
			// elements
			helperPreMiddlewares.addProcessedData(req, 'twitter.receivedTweet', tweet);
			sendResponse(null, req, res, next, post);

		} else {
			sendResponse(null, req, res, null, post);
		}

	});
};

/**
 *
 * @param {Object} err If it is not null, it will be reported to post function although if next()
 *    function is not provided, so this function will send the response, it reply successful
 *    (200 - OK) if the error has not been registered in the request.
 * @param req
 * @param res
 * @param next
 * @param post
 */
function sendResponse(err, req, res, next, post) {

	if ('function' === typeof next) {
		next();

		if (post) {
			post(err, req, res);
		}

		return;
	}

	// is there errors the helper will send the response
	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	res.send(200);
	post(err, req, res);
}
