'use strict';

/**
 * Tracker provide some methods to retrieve and store information from/to redis.
 * It should provide reusable methods rather than a specific methods that only one component
 * need,
 */

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Dependencies
 */
// Database (Redis)
var redis = require('redis');
// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'twitter-tracker: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;

/**
 * Globals
 */
// Loggers
var streamLogger;
// Redis
var redisClient;
var keyExpireSecs;


(function initialize() {

	var redisConfig = require(settings.configsPath + '/redis');
	redisConfig =
		require(settings.libsPath + '/iwazat/util/config').getConfiguration(redisConfig, 'timelines');

	keyExpireSecs = 900;
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');

	redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

	if (redisConfig.password) {
		redisClient.auth(redisConfig.password, function (err) {
			if (err) {
				streamLogger.error(PREFIX_ID_LOG + 'Bad authentication. Error details: ' + err);
				callback(err);
			} else {
				streamLogger.info(PREFIX_ID_LOG + 'redis client authenticated successful');
			}
		});
	}


	if (redisConfig.database) {
		redisClient.select(redisConfig.database);
	}

	redisClient.on('error', function (err) {
		if (ECONNREFUSED_REG_EXP.test(err.message)) {
			streamLogger.warn(PREFIX_ID_LOG + 'redis client connection has been been ' +
				'disconnected; redis client will try to reconnect automatically');
		} else {
			streamLogger.error(PREFIX_ID_LOG + 'redis client received this error: ' + err);
		}
	});

	if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

		redisClient.on('connect', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are going ' +
				'to send: ' + redisClient.offline_queue.length);

			if (redisConfig.database) {
				redisClient.send_anyway = true;
				redisClient.select(redisConfig.database);
				redisClient.send_anyway = false;
			}

		});

	} else {

		if (redisConfig.database) {
			redisClient.on('connect', function () {
				redisClient.send_anyway = true;
				redisClient.select(redisConfig.database);
				redisClient.send_anyway = false;
			});
		}

		redisClient.on('ready', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client ready and  offline queue flushed');
		});
	}

}());


/**
 *
 * @param eventId
 * @param userTwitterId
 * @param userDoc Mongoose user document with only the persona into the personas' array, that it is
 *    the persona used in the event
 * @param role
 * @return {Object} The tacked user's object
 */
module.exports.trackEventUser = function (eventId, userTwitterId, userDoc, role) {

	var key = 'event:' + eventId + ':' + userTwitterId;

	var trackedUser = {
		actor: {
			_id: userDoc.id,
			persona: userDoc.personas[0].id,
			role: role
		},
		view: tmMessagesView.ownerView(userDoc)
	};

	redisClient.set(key, JSON.stringify(trackedUser), function (err) {
		if (err) {
			streamLogger.warn(PREFIX_ID_LOG + ' redis client error when tracking an user\'s info of ' +
				'one event. Error: ' + err);
		}
		redisClient.expire(key, keyExpireSecs);
	});

	return trackedUser;
};


/**
 *
 * @param eventId
 * @param userTwitterId
 * @param callback
 */
module.exports.retrieveEventUser = function (eventId, userTwitterId, callback) {

	var key = 'event:' + eventId + ':' + userTwitterId;

	redisClient.get(key, function (err, trackedUser) {
		if (err) {
			streamLogger.warn(PREFIX_ID_LOG + 'redis client error when retrieving an user\'s info of ' +
				'one event. Error: ' + err);
			callback(err);
			return;
		}

		if (trackedUser) {
			redisClient.expire(key, keyExpireSecs);
			callback(null, JSON.parse(trackedUser));
		} else {
			callback(null, null);
		}

	});
};