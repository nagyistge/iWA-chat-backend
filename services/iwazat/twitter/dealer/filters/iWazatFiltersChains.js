'use strict';

module.exports = exports;

/**
 * Dependencies
 */
var settings = require('../../../../../settings');
var ifcAsync = require(settings.libsPath +  '/async');

/**
 * Globals
 */
var filterByEventTimelineFns;


(function initialise() {

	/**
	 * Constants
	 */
	var PREFIX_ID_LOG = 'twitter-filters (common components): ';
	var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;


	/**
	 * Dependencies
	 */
	var redis = require('redis');
	var configLoader = require(settings.libsPath + '/iwazat/util/config');
	var streamLogger = require(settings.sysPath +
		'/tools/iwaLogger').getWinstonLogger('eventsStream');
	var redisConfig = require(settings.configsPath + '/redis');
	var redisClient;
	var filterOptions;

	/**
	 * Variables
	 */
	var filters;
	var f;

	redisConfig = configLoader.getConfiguration(redisConfig, 'timelines');

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
			streamLogger.info(PREFIX_ID_LOG +
				'redis client connected. Number of messages are going ' +
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

	filterOptions = {
		logger: streamLogger,
		messageLogPrefix: 'twitter-filter:'
	};


	filters = {
		iWazatTweet: new (require('./byEventTimeline/iWazatTweet'))(redisClient, filterOptions)
	};

	module.exports.filtersByEventTimeline = filters;
	filterByEventTimelineFns = [];

	for (f in filters) {
		// We bind each filter function to use the array with async#applyEach
		filterByEventTimelineFns.push(filters[f].filter.bind(filters[f]));
	}

})();


module.exports.filterByEventTimeline = function (eventId, msgColNum, tweet, callback) {

	// Maybe these filters would be executed in series rather than in parallel
	ifcAsync.applyEach(filterByEventTimelineFns, eventId, msgColNum, tweet,
		function (err, results) {


			if (err) {
				callback(err);
				return;
			}

			var fr;

			for (fr = 0; fr < results.length; fr++) {
				if (results[fr][0] === true) {
					// If the filter return true, then the twee has been filtered and dropped, so it mustn't
					// be processed
					callback(null, null);
					return;
				} else if (results[fr][0] === false) {
					// If the filter return true, then the twee hasn't been modified by the filter
					continue;
				} else {
					// If the filter return an object then the filter has been filtered the tweet and
					// it made some modifications so the chain return the first filter which made the
					// modification
					callback(null, results[fr][0], true);
					return;
				}
			}

			// Return the first filter that return not null, if not return null to the callback
			callback(null, tweet, false);

		});

};

