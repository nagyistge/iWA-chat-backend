'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Dependencies
 */
var redis = require('redis');


/**
 * Constants
 */
var PREFIX_ID_LOG = 'twitter-consumer: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;
var REDIS_SUB_CHANEL_SCOPE = 'TwitterConsumer:';

/**
 * Globals
 */
// Loggers
var streamLogger;
// Redis
var redisConfig;
var rShellClient;
var redisClients;
var redisSubChannelPrefix;

module.exports = function (callback) {

	redisSubChannelPrefix = settings.env + '-' + REDIS_SUB_CHANEL_SCOPE;
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');

	redisConfig = require(settings.configsPath + '/redis');
	redisConfig = require(settings.libsPath + '/iwazat/util/config').getConfiguration(
		redisConfig, 'timelines');


	rShellClient = require(settings.servicesPath + '/iwazat/twitter/redisShellClient');

	rShellClient = new rShellClient({
		channel: settings.env + '-TwitterFarmer:',
		redisSettings: redisConfig,
		verbose: true,
		logger: streamLogger
	}, callback);


	// TODO store the redisClients ids in redis to be able to run the server in cluster
	redisClients = {};


	// Attach the function that the service offer to bootstrap the service. The bootstrap allows
	// to register events before opening the twitter server, then wen bootstrap is called,
	// the events' twitter filters will be registered in one instruction and twitter server will be
	// opened
	var twitterFilters = [];

	module.exports.bootstrap = function () {

		if (twitterFilters.length > 0) {
			rShellClient.cmdMulti();
			rShellClient.cmdSetFilters(twitterFilters);
			rShellClient.cmdRestart();
			rShellClient.cmdMulti();
		}


		// Attach the function that the service offer after it has been bootstrapped
		delete module.exports.bootstrap;
		module.exports.isEventRegistered = isEventRegistered;
		module.exports.registerEvent = registerEvent;
		module.exports.unregisterEvent = unregisterEvent;
		module.exports.changeFilter = changeFilter;
	};

	module.exports.registerEvent = function (eventId, messageColNum, hashtags, mentions, consumerFn) {

		var keywords = [];
		var consumerId = eventId + '_' + messageColNum;


		// TODO store the redisClients ids in redis to be able to run the server in cluster
		if (redisClients[consumerId]) {
			streamLogger.warn(PREFIX_ID_LOG + 'The message collection of this event already has a ' +
				'registered consumer. Consumer client ID: ' + consumerId);
		}


		addConsumer(consumerId, consumerFn, function (err) {

			if (err) {
				// TODO think how to manage if it fails for example to emit a notification to know that we need
				// to open manually later or whatever
				streamLogger.error(PREFIX_ID_LOG + 'Error to open the twitter consumer service for ' +
					'the event: ' + eventId + ' and message collection number: ' + messageColNum +
					'. Reported error: ' + err);
				return;
			}


			if (hashtags) {
				hashtags.forEach(function (hashtag) {
					keywords.push('#' + hashtag);
				});
			}

			if (mentions) {
				mentions.forEach(function (mention) {
					keywords.push('@' + mention);
				});
			}

			twitterFilters.push({
				event_id: consumerId,
				keywords: keywords
			});
		});
	};

};


function isEventRegistered(eventId, messageColNum) {

	// TODO store the redisClients ids in redis to be able to run the server in cluster
	return (redisClients[eventId + '_' + messageColNum]) ? true : false;
};

/**
 *
 *
 * @param eventId
 * @param messageColNum
 * @param hashtags
 * @param mentions
 * @param {Function} [consumerFn]
 * @throws Error if the event's message collection already has a registered consumer
 */
function registerEvent(eventId, messageColNum, hashtags, mentions, consumerFn) {

	var keywords = [];
	var consumerId = eventId + '_' + messageColNum;


	// TODO store the redisClients ids in redis to be able to run the server in cluster
	if (redisClients[consumerId]) {
		streamLogger.warn(PREFIX_ID_LOG + 'The message collection of this event already has a ' +
			'registered consumer. Consumer client ID: ' + consumerId);
		return false;
	}


	addConsumer(consumerId, consumerFn, function (err) {

		if (err) {
			// TODO think how to manage if it fails for example to emit a notification to know that we need
			// to open manually later or whatever
			streamLogger.error(PREFIX_ID_LOG + 'Error to open the twitter consumer service for the ' +
				'event: ' + eventId + ' and message collection number: ' + messageColNum +
				'. Reported error: ' + err);
			return false;
		}

		if (hashtags) {
			hashtags.forEach(function (hashtag) {
				keywords.push('#' + hashtag);
			});
		}

		if (mentions) {
			mentions.forEach(function (mention) {
				keywords.push('@' + mention);
			});
		}

		rShellClient.cmdMulti();

		rShellClient.cmdAddFilter({
			event_id: consumerId,
			keywords: keywords
		});

		rShellClient.cmdRestart();

		rShellClient.cmdMulti();

	});

	return true;

};


/**
 *
 * @param eventId
 * @param messageColNum
 * @throws Error if the event's message collection doesn't have a registered consumer
 */
function unregisterEvent(eventId, messageColNum) {

	var keywords = [];
	var consumerId = eventId + '_' + messageColNum;
	var redisClient = redisClients[consumerId];


	// TODO store the redisClients ids in redis to be able to run the server in cluster
	if (!redisClient) {
		streamLogger.warn(PREFIX_ID_LOG + 'The message collection of this event doesn\'t have a ' +
			'registered consumer. Consumer client ID: ' + consumerId);

		return false;

	} else {
		delete redisClients[consumerId];
	}

	redisClient.quit();

	rShellClient.cmdMulti();

	rShellClient.cmdDeleteFilter({
		event_id: consumerId,
		keywords: keywords
	});

	rShellClient.cmdStop();

	rShellClient.cmdMulti();

	return true;

};

/**
 *
 * @param eventId
 * @param messageColNum
 * @param hashtags
 * @throws Error if the event's message collection doesn't have a registered consumer
 */
function changeFilter(eventId, messageColNum, hashtags, mentions) {

	var keywords = [];
	var consumerId = eventId + '_' + messageColNum;


	// TODO store the redisClients ids in redis to be able to run the server in cluster
	if (!redisClients[consumerId]) {
		streamLogger.warn(PREFIX_ID_LOG + 'The message collection of this event doesn\'t have a ' +
			'registered consumer. Consumer client ID: ' + consumerId);
		return false;
	}


	if (hashtags) {
		hashtags.forEach(function (hashtag) {
			keywords.push('#' + hashtag);
		});
	}

	if (mentions) {
		mentions.forEach(function (mention) {
			keywords.push('@' + mention);
		});
	}


	rShellClient.cmdMulti();

	if (0 === keywords.length) {
		rShellClient.cmdDeleteFilter(consumerId);
	} else {
		rShellClient.cmdUpdateFilter({
			event_id: consumerId,
			keywords: keywords
		});
	}

	rShellClient.cmdRestart();
	rShellClient.cmdMulti();

	return true;
};


function addConsumer(id, consumerFn, callback) {

	var redisClient;

	function initialise() {

		redisClient.on('subscribe', function () {

			// Remove the connect or ready listeners depending of the configuration to register again them
			// to remove the call the initialise function
			if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

				redisClient.removeAllListeners('connect');
				redisClient.on('connect', function () {
					streamLogger.info(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | redis client ' +
						'connected. Number of messages are going to send: ' + redisClient.offline_queue.length);
				});

			} else {

				redisClient.removeAllListeners('ready');
				redisClient.on('ready', function () {
					streamLogger.info(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | redis client ready ' +
						'and offline queue flushed');
				});
			}

			// Remove the error listener set to report only if the connections fails
			redisClient.removeAllListeners('error');

			// Register an Error listener to avoid that the process finish if some error happens
			redisClient.on('error', function (err) {

				if (ECONNREFUSED_REG_EXP.test(err.message)) {
					streamLogger.warn(PREFIX_ID_LOG + 'The redis client connection of the consumer ID:' + id +
						' has been disconnected; redis client will try to reconnect automatically');
				} else {
					streamLogger.error(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | Error: ' + err);
				}
			});

			redisClient.on('message', function (channel, iwaTweet) {

				iwaTweet = JSON.parse(iwaTweet);

				process.nextTick(function () {
					consumerFn(iwaTweet);
				});
			});

			redisClients[id] = redisClient;
			callback(null);

		});

		redisClient.subscribe(redisSubChannelPrefix + id);
	} // End initialise callback definition


	// redis' client setup
	redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

	if (redisConfig.password) {
		redisClient.auth(redisConfig.password, function (err) {
			if (err) {
				streamLogger.error(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | Bad authentication.' +
					' Error details: ' + err);
				callback(err);
			} else {
				streamLogger.info(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | redis client ' +
					'authenticated successful');
			}
		});
	}

	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#initialise
	redisClient.on('error', callback);

	if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

		redisClient.on('connect', function () {
			streamLogger.info(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | redis client connected.' +
				' Number of messages are going to send: ' + redisClient.offline_queue.length);
			initialise();
		});

	} else {

		redisClient.on('ready', function () {
			streamLogger.info(PREFIX_ID_LOG + 'Consumer client ID: ' + id + ' | redis client ready and ' +
				'offline queue flushed');
			initialise();
		});
	}

}