'use strict'

/**
 * This script provide a method to create a standard redis' client configuration that log messages
 * to the provided logger in error events, reconnections and so on
 */


/**
 * Dependencies
 */
var redis = require('redis');


/**
 * Constants
 */
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;


/**
 *  Create a redis client connecting them and managing password command if the server us
 *  authentication, set the selected database if it has been defined and appending an event
 *  listeners to log some message to the provided logger or console by default, to the events:
 *  'error', 'connect', 'ready', 'end'
 *
 * node-redis client connection parameters are:
 * port
 * host
 * options:
 *      * parser
 *      * return_buffers
 *      * detect_buffers
 *      * socket_nodelay
 *      * no_ready_check
 *      * enable_offline_queue
 *
 * @See (@link https://github.com/mranney/node_redis#rediscreateclientport-host-options):
 *
 *
 * @param {Object} [options] The configuration to use to instance the client. All properties are
 *  optional:
 *    # redisConfig: The same properties that redisClient from 'redis' node module accept, plus
 *        - password: If the server requires authentication to connect. By default it try to connect
 *          without authentication
 *        - database: The database index that the client is required to connect to a specific
 *          database, by default connect to the default database established by the server.
 *
 *          NOTE: this parameter mustn't be used if you are going to use this client with publish /
 *              subscribe message paradigm because it attach the command to select the database
 *              in 'connection' event, so if you switch on the pub/sub mode, then if one
 *              reconnection happen the client crash because in that mode redis doesn't accept
 *              commands which are not related with pub/sub scope.
 *
 *    # logMsgPrefix: The text to prepend to all the message which will be written to the log;
 *            by default any.
 *    # logger: The logger object to use; by default console
 * @returns {Object} redis client instance
 */
module.exports = function standardClient(options) {

	var redisClient;
	var redisConfig;
	var logMsgPrefix = '';
	var logger;
	var maxAttempts = null;
	var numAttemptsLeft = 0;
	// This variable avoid that if options.database (if it is provided) property is modified outside
	// this function then it doesn't affect the behaviour of this redis client
	var database = 0;


	if (options.redisConfig) {
		redisConfig = options.redisConfig;

		if ((redisConfig.options) && ('number' === typeof redisConfig.options.max_attempts)) {
			maxAttempts = redisConfig.options.max_attempts;
		}

	}

	if (options.logMsgPrefix) {
		logMsgPrefix = options.logMsgPrefix;
	}

	if (options.logger) {
		logger = options.logger;
	} else {
		logger = console;
	}


	redisClient = redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);

	if (redisConfig.password) {
		redisClient.auth(redisConfig.password, function (err) {
			if (err) {
				logger.error(logMsgPrefix + 'Bad redis client authentication. Error details: ' + err);
			} else {
				logger.info(logMsgPrefix + 'redis client authenticated successful');
			}
		});
	}


	// Id database index is 0, is the same than not to select any database, because redis clients
	// connect by default to database index 0
	if (redisConfig.database) {
		database = redisConfig.database;
		redisClient.select(database);
	}

	redisClient.on('error', function (err) {
		if (ECONNREFUSED_REG_EXP.test(err.message)) {
			logger.warn(logMsgPrefix + 'redis client cannot connect or has been disconnected');

			if (null !== maxAttempts) {
				numAttemptsLeft++;

				if (numAttemptsLeft < maxAttempts) {
					logger.warn(logMsgPrefix + 'redis client will try to reconnect. Number of attempts ' +
						'left: ' + numAttemptsLeft);
				} else {
					logger.error(logMsgPrefix + 'redis client couldn\'t connect after it tried ' +
						maxAttempts + ' times');

					redisClient.quit();
				}
			} else {
				logger.warn(logMsgPrefix + 'redis client will try to reconnect');
			}

		} else {
			logger.error(logMsgPrefix + 'redis client received this error: ' + err);
		}
	});

	if ((redisConfig.options) && (true === redisConfig.options.no_ready_check)) {

		redisClient.on('connect', function () {
			logger.info(logMsgPrefix + 'redis client connected. Number of messages are going ' +
				'to send: ' + redisClient.offline_queue.length);

			if (database) {
				redisClient.send_anyway = true;
				redisClient.select(database);
				redisClient.send_anyway = false;
			}

		});

	} else {

		if (database) {
			redisClient.on('connect', function () {
				redisClient.send_anyway = true;
				redisClient.select(database);
				redisClient.send_anyway = false;
			});
		}

		redisClient.on('ready', function () {
			logger.info(logMsgPrefix + 'redis client ready and  offline queue flushed');
		});
	}

	redisClient.on('end', function () {
		logger.info(logMsgPrefix + 'redis client disconnected');
	});

	return redisClient;

};
