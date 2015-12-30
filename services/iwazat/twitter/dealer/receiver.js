'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Dependencies
 */
var redis = require('redis');
var configLoader = require(settings.libsPath + '/iwazat/util/config');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'twitter-dealer: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;
var REDIS_PUB_CHANEL_SCOPE = 'TwitterConsumer:';
var REDIS_SUB_FARMER_CHANEL_SCOPE = 'TwitterFarmer:tweet';
var REDIS_SUB_FILTERS_CHANEL_SCOPE = 'TwitterFilters:tweet';

/**
 * Globals
 */
// Loggers
var streamLogger;
var eventRefRegExp;

// Redis
var rClientSub;
var rClientPub;
var redisPubChannel;
var redisSubFarmerChannel;
var redisSubFiltersChannel;
var redisConfig;

var manufacturer = require('./manufacturer');

// Initialization non-straight away variables
(function initialize() {
	eventRefRegExp = /^([0-9A-Fa-f]{24})_(\d{3})$/;
	redisPubChannel = settings.env + '-' + REDIS_PUB_CHANEL_SCOPE;
	redisSubFarmerChannel = settings.env + '-' + REDIS_SUB_FARMER_CHANEL_SCOPE;
	redisSubFiltersChannel = settings.env + '-' + REDIS_SUB_FILTERS_CHANEL_SCOPE;
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');
	redisConfig =
		configLoader.getConfiguration(require(settings.configsPath + '/redis'), 'timelines');
}());

function onTweet(jsonTweet, objTweet) {

	var eventsRefObjs = [];

	objTweet.event_ids.forEach(function (tweetEventRef) {
		var eventMsgColRef = eventRefRegExp.exec(tweetEventRef);

		if (null === eventMsgColRef) {
			streamLogger.warn(PREFIX_ID_LOG + 'Received tweet associated to next invalid id: ' +
				tweetEventRef);
			return;
		}

		eventsRefObjs.push({
			id: eventMsgColRef[1],
			msgColNum: eventMsgColRef[2],
			tweetEventRef: tweetEventRef
		});
	});

	// function (eventId, messageCol, huntedTweet, callback) {
	manufacturer(eventsRefObjs, objTweet, function (err, eventsTweet) {

		if (err) {
			// Although manufacturer may only report an error on some events not all, dealer in the
			// current time doesn't check that, so it never send any tweet to the consumers if
			// manufacturer report some error.
			streamLogger.warn(PREFIX_ID_LOG + 'Twitter dealer receive an error from manufacturer. ' +
				'Error ' + err);
			return;
		}

		if (null === eventsTweet) {
			return;
		}

		eventsTweet.forEach(function (eventTweet) {
			process.nextTick(function () {
				rClientPub.publish(redisPubChannel + eventTweet.tweetEventRef,
					JSON.stringify(eventTweet.tweetView));
			});
		});

	});
}


var open = function (callback) {

	// Avoid that open can be run again in a future event loop cycle meanwhile this method waits the
	// callbacks of asynchronous calls
	delete module.exports.open;


	function initFirstStage() {

		function initSecondStage() {

			// Remove the connect or ready listeners depending of the configuration to register again them
			// to remove the call the initialisation function
			if ((redisConfig.options) && (true === redisConfig.options.no_ready_check)) {
				rClientSub.removeAllListeners('connect');
				rClientSub.on('connect', function () {
					streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber connected');
				});

			} else {

				rClientSub.removeAllListeners('ready');
				rClientSub.on('ready', function () {
					streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber ready');
				});
			}

			rClientSub.on('subscribe', function (channel, count) {
				streamLogger.info(PREFIX_ID_LOG + ' redis client subscriber is subscribed on the ' +
					'channel: ' + channel + ', it is subscribed to ' + (count - 1) + ' channels more');
			});

			// Remove the error listener set to report only if the connections fails
			rClientSub.removeAllListeners('error');

			// Register an Error listener to avoid that the process finish if some error happens
			// and also register the error to the log
			rClientSub.on('error', function (err) {
				if (ECONNREFUSED_REG_EXP.test(err.message)) {
					streamLogger.warn(PREFIX_ID_LOG + 'redis client sbuscriber connection has been' +
						'disconnected; redis client will try to reconnect automatically');
				} else {
					streamLogger.error(PREFIX_ID_LOG + 'redis client subscriber received this error: ' +
						err);
				}

			});

			rClientSub.on('message', function (channel, collectedJsonTweet) {

				// In the time being the receiver process the tweets in the same way for all the
				// subscribed channels

				var collectedTweet = JSON.parse(collectedJsonTweet);

				process.nextTick(function () {
					onTweet(collectedJsonTweet, collectedTweet);
				});
			});

			rClientSub.subscribe(redisSubFarmerChannel);
			rClientSub.subscribe(redisSubFiltersChannel);
			module.exports.close = close;
			streamLogger.info(PREFIX_ID_LOG + ' open operation successful');
			callback(null, true);

		} // End initSecondStage; it is executed after rClientSub connection is established

		// Remove the connect or ready listeners depending of the configuration to register again them
		// to remove the call the initialisation function
		if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

			rClientPub.removeAllListeners('connect');
			rClientPub.on('connect', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client publisher connected');
			});
		} else {

			rClientPub.removeAllListeners('ready');
			rClientPub.on('ready', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client publisher ready');
			});
		}

		// Remove the error listener set to report only if the connections fails
		rClientPub.removeAllListeners('error');

		// Register an Error listener to avoid that the process finish if some error happens
		// and also register the error to the log
		rClientPub.on('error', function (err) {
			if (ECONNREFUSED_REG_EXP.test(err.message)) {
				streamLogger.warn(PREFIX_ID_LOG + 'redis client publisher connection has been ' +
					'disconnected; redis client will try to reconnect automatically');
			} else {
				streamLogger.error(PREFIX_ID_LOG + 'redis client publisher received this error: ' +
					err);
			}
		});

		// redis client subscriber setup
		rClientSub = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

		if (redisConfig.password) {
			rClientSub.auth(redisConfig.password, function (err) {
				if (err) {
					streamLogger.error(PREFIX_ID_LOG + 'redis client subscriber: bad authentication. Error' +
						' details: ' + err);
					callback(err);
				} else {
					streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber: authenticated successful');
				}
			});
		}


		// Error listener to report only a connection error, it will removed after the connection
		// success, @see RedisShell#open#run
		rClientSub.on('error', function (err) {
			streamLogger.error(PREFIX_ID_LOG + 'redis client subscriber received this error: ' + err);

			close();
			callback(err);
		});

		if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {
			rClientSub.on('connect', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber connected');
				initSecondStage();
			});

		} else {

			rClientSub.on('ready', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber ready');
				initSecondStage();
			});
		}

	} // End initFirstStage; it is executed after rClientPub connection is established

// redis' client setup
	rClientPub = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

	if (redisConfig.password) {

		rClientPub.auth(redisConfig.password, function (err) {
			if (err) {
				streamLogger.error(PREFIX_ID_LOG + 'redis client publisher: bad authentication. Error' +
					' details: ' + err);
				callback(err);
			} else {
				streamLogger.info(PREFIX_ID_LOG + 'redis client publisher: authenticated successful');
			}
		});
	}


	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#run
	rClientPub.on('error', function (err) {

		streamLogger.error(PREFIX_ID_LOG + 'redis client publisher received connection error. ' +
			'Details: ' + err);

		rClientPub.quit();
		module.exports.open = open;
		callback(err);
	});

	if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {
		rClientPub.on('connect', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client publisher connected');
			initFirstStage();
		});
	} else {

		rClientPub.on('ready', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client subscriber ready');
			initFirstStage();
		});
	}

};

var close = function () {

	// Avoid that close can be run again in a future event loop cycle meanwhile this method waits the
	// callbacks of asynchronous calls
	delete module.exports.close;

	rClientSub.quit();
	rClientPub.quit();

	module.exports.open = open;
};


module.exports.open = open;