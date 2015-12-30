'use strict';

module.exports = exports;
var settings = require('../../../settings');

/**
 * Dependencies
 */
var redis = require('redis');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'twitter-farmer: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;
var REDIS_PUB_CHANEL_SCOPE = 'TwitterFarmer:tweet';

/**
 * Globals
 */
// Loggers
var streamLogger;
// Redis
var redisClient;
var redisShell;
var redisPubChannel;
// Twitter Service
var twitterServer;

// Initialization non-straight away variables
(function initialize() {
	redisPubChannel = settings.env + '-' + REDIS_PUB_CHANEL_SCOPE;
}());

var onTweet = function (tweet) {

	redisClient.publish(redisPubChannel, JSON.stringify(tweet));

	return tweet;
};

/**
 * Create a twitter server and connect them to a redisShell to allows it to receive commands from
 * other process to perform operations on twitter and register a a redis client, named
 * "TwitterFarmer:tweet", to publish each tweet that Twitter server collects.
 *
 * @param callback
 * @api public It is only available when the client is closed
 */
var open = function (callback) {

	// Avoid that open can be run again in a future event loop cycle meanwhile this method waits the
	// callbacks of asynchronous calls
	delete module.exports.open;


	var redisConfig = require(settings.configsPath + '/redis');
	redisConfig = require(settings.libsPath + '/iwazat/util/config').getConfiguration(
		redisConfig, 'timelines');

	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');


	function initialise() {

		// Remove the connect or ready listeners depending of the configuration to register again them
		// to remove the call the initialisation function
		if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

			redisClient.removeAllListeners('connect');
			redisClient.on('connect', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
					'going to send: ' + redisClient.offline_queue.length);
			});
		} else {

			redisClient.removeAllListeners('ready');
			redisClient.on('ready', function () {
				streamLogger.info(PREFIX_ID_LOG + 'redis client ready and offline queue flushed');
			});
		}

		// Remove the error listener set to report only if the connections fails
		redisClient.removeAllListeners('error');

		// Register an Error listener to avoid that the process finish if some error happens
		// and also register the error to the log
		redisClient.on('error', function (err) {
			if (ECONNREFUSED_REG_EXP.test(err.message)) {
				streamLogger.warn(PREFIX_ID_LOG + 'redis client connection has been been disconnected; ' +
					'redis client will try to reconnect automatically');
			} else {
				streamLogger.error(PREFIX_ID_LOG + 'redis client received this error: ' +
					err);
			}
		});

		twitterServer = require('./TwitterServer');
		twitterServer = new twitterServer({
			verbose: false,
			bulk_process: false,
			on_tweet: onTweet
		});

		redisShell = require('./redisShell');
		redisShell = new redisShell({
			channel: settings.env + '-TwitterFarmer:',
			redisSettings: redisConfig,
			twitterService: twitterServer,
			verbose: true,
			logger: streamLogger
		}, function (err, confirmation) {

			if (err) {
				streamLogger.info(PREFIX_ID_LOG + ' open operation failure. Error: ' + err);
				module.exports.open = open;
			} else {
				streamLogger.info(PREFIX_ID_LOG + ' open operation successful');
				module.exports.close = close;
			}

			callback(err, confirmation);

		});

	} // End initialise callback definition


	// redis' client setup
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


	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#run
	redisClient.on('error', function (err) {
		streamLogger.error(PREFIX_ID_LOG + 'redis client connection failure. Error details: ' + err);
		module.exports.open = open;
		callback(err);
	});

	if ((redisConfig.options) && (redisConfig.options.no_ready_check === true)) {

		redisClient.on('connect', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
				'going to send: ' + redisClient.offline_queue.length);
			initialise();

		});
	} else {

		redisClient.on('ready', function () {
			streamLogger.info(PREFIX_ID_LOG + 'redis client ready and offline queue flushed');
			initialise();
		});
	}
};

/**
 * close the service, stopping the associated twitter server and its associated redis channels
 *
 * @api public It is only available when the client is opened
 */
var close = function () {

	// Avoid that close can be run again in a future event loop cycle meanwhile this method waits the
	// callbacks of asynchronous calls
	delete module.exports.close;

	redisShell.close();
	twitterServer.stop();
	redisClient.quit();

	streamLogger.info(PREFIX_ID_LOG + ' service is closing');

	redisClient.on('end', function () {

		// All these components are instantiated in the open operation
		redisShell = null;
		twitterServer = null;
		redisClient = null;

		module.exports.open = open;
		streamLogger.info(PREFIX_ID_LOG + ' service closed');
	});

};


module.exports.open = open;