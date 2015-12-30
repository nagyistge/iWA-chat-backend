'use strict';

/**
 * Dependencies
 */
var EventEmitter = require('events').EventEmitter;
var inspect = require('util').inspect;
var redis = require('redis');
var TwitterServer = require('./TwitterServer.js');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'redis-shell: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;

/**
 *  Private attributes defined in the constructor:
 *    rClientCmdShell: Redis client to listen the commands. This is subscribe a redis channel to
 *      receive the messages which will be the commands to execute
 *
 *  Command's structure:
 *  {
 *    cmd: The string that identify the command
 *    params: The parameters to pass to the command, only required when the command require any, and
 *      the types of them depends of the command
 *  }
 *
 * @constructor
 * @param {Object} options
 *  {
 *    channel: by default 'CmdShell:'
 *    redisSettings:  {
 *      port: null,
 *      host: null,
 *      options: null,
 *      password
 *    },
 *    twitterService;
 *  }
 *  @param {Function} [callback]
 */
var RedisShell = function (options, callback) {

	if (!(this instanceof RedisShell)) {
		new RedisShell(options, callback);
		return;
	}


	var channel = 'CmdShell:';
	var redisSettings = {
		port: null,
		host: null,
		options: null
	};
	var twitterService = false;

	this.verbose = false;

	if (options) {
		if (options.channel) {
			channel = options.channel;
		}

		if (options.redisSettings) {
			if (options.redisSettings.port) {
				redisSettings.port = options.redisSettings.port;
			}

			if (options.redisSettings.host) {
				redisSettings.host = options.redisSettings.host;
			}

			if (options.redisSettings.options) {
				redisSettings.options = options.redisSettings.options;
			}
		}

		if (options.twitterService) {
			twitterService = options.twitterService;
		}

		if (options.logger) {
			this.logger = options.logger;
		}

		if (options.verbose) {
			this.verbose = true;
		}
	}

	if (!this.logger) {
		this.logger = console;
	}

	// Create a twitter server is it has been provided
	if (!twitterService) {
		twitterService = new TwitterServer();
	}

	//# redisClientCmdShell ==> The redis client to listen the twitter service commands (redis messages)

	//# Channel name
	Object.defineProperties(this, {
		channel: {
			configurable: false,
			enumerable: true,
			value: channel
		}
	});

	//# Twitter server instance
	Object.defineProperties(this, {
		twitterService: {
			configurable: false,
			enumerable: true,
			value: twitterService
		}
	});

	//# Redis client settings to listen message commands
	Object.defineProperties(this, {
		redisSettings: {
			configurable: false,
			enumerable: true,
			value: redisSettings
		}
	});

	if ('function' === typeof callback) {
		this.open(callback);
	}

};


RedisShell.prototype = {
	open: function (callback) {

		var self = this;

		if (!callback) {
			callback = function () {};
		}

		function initialise() {
			// Remove the connect or ready listeners depending of the configuration to register again them
			// to remove the call the initialisation function
			if ((self.redisSettings.options) && (self.redisSettings.options.no_ready_check === true)) {

				self.redisClientCmdShell.removeAllListeners('connect');
				self.redisClientCmdShell.on('connect', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
							'going to send: ' + self.redisClientCmdShell.offline_queue.length);
					}
				});
			} else {

				self.redisClientCmdShell.removeAllListeners('ready');
				self.redisClientCmdShell.on('ready', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client ready and offline queue flushed');
					}
				});
			}

			self.redisClientCmdShell.on('subscribe', function (channel) {

				if (channel !== self.channel) {
					self.redisClientCmdShell.unsubscribe(channel);

					throw new Error('This client redis client instance is for internal use of an instance' +
						'of redisShell (Wrapper to set commands to Twitter Hunter)');

				} else {
					self.logger.info(PREFIX_ID_LOG + 'redis client has been been subscribed to its channel ' +
						'(' + channel + ')');
				}
			});


			// Remove the error listener set to report only if the connections fails
			//self.redisClientCmdShell.removeListener('error', callback);
			self.redisClientCmdShell.removeAllListeners('error');

			// Register an Error listener to avoid that the process finish if some error happens
			self.redisClientCmdShell.on('error', function (err) {

				if (ECONNREFUSED_REG_EXP.test(err.message)) {
					self.logger.warn(PREFIX_ID_LOG + 'redis client connection has been disconnected; redis ' +
						'client will try to reconnect automatically');
				} else {
					self.logger.error(PREFIX_ID_LOG + 'redis client received this error: ' + err);
				}

			});

			// ensure that only there is one listener
			self.redisClientCmdShell.removeAllListeners('message');
			self.redisClientCmdShell.on('message', function (channel, message) {

				message = JSON.parse(message);
				self.onCommand(message.cmd, message.params);
			});


			self.redisClientCmdShell.subscribe(self.channel);
			callback(null, true);

		} // End initialise function declaration


		if (this.redisClientCmdShell) {
			callback(null, false);
		} else {
			// redis' client setup
			this.redisClientCmdShell = redis.createClient(this.redisSettings.port,
				this.redisSettings.host, this.redisSettings.options);

			if (this.redisSettings.password) {
				this.redisClientCmdShell.auth(this.redisSettings.password, function (err) {
					if (err) {
						self.logger.error(PREFIX_ID_LOG + 'Bad authentication. Error details: ' + err);
						callback(err);
					} else {
						if (self.verbose) {
							self.logger.info(PREFIX_ID_LOG + ' redis client authenticated successful');
						}
					}
				});
			}

			// Error listener to report only a connection error, it will removed after the connection
			// success, @see RedisShell#open#run
			this.redisClientCmdShell.on('error', function (err) {
				self.logger.error(PREFIX_ID_LOG + 'redis client connection failure. Error details: ' + err);
				callback(err);
			});

			if ((this.redisSettings.options) && (this.redisSettings.options.no_ready_check === true)) {
				this.redisClientCmdShell.on('connect', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
							'going to send: ' + self.redisClientCmdShell.offline_queue.length);
					}

					initialise();
				});
			} else {

				this.redisClientCmdShell.on('ready', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client ready and offline queue flushed');
					}

					initialise();
				});
			}
		}

	},

	close: function (callback) {

		var self = this;

		if (!callback) {
			callback = function () {};
		}

		if (this.redisClientCmdShell) {

			self.redisClientCmdShell.on('end', function () {

				if (self.verbose) {
					self.logger.info(PREFIX_ID_LOG + ' redis client connection has closed');
				}

				self.redisClientCmdShell = null;
				callback(null, true);
			});

			self.redisClientCmdShell.quit();

			if (self.verbose) {
				self.logger.info(PREFIX_ID_LOG + ' redis client \'quit\' command sent');
			}

		} else {

			if (self.verbose) {
				self.logger.info(PREFIX_ID_LOG + ' redis client has not been opened, so operation aborted');
			}

			callback(null, false);
		}
	},

	onCommand: function (command, parameters) {

		var self = this;

		if (this.verbose) {
			if (parameters) {
			this.logger.info(PREFIX_ID_LOG + 'Command received: ' + command + ' -- Parameters: ' +
				inspect(parameters, {depth: 4}));
			} else {
				this.logger.info(PREFIX_ID_LOG + 'Command received: ' + command);
			}
		}

		switch (command) {
			case 'stop':
				this.twitterService.stop();
				break;
			case 'start':
				this.twitterService.start();
				break;
			case 'restart':
				this.twitterService.restart();
				break;
			case 'addFilter':
				this.twitterService.addFilter(parameters);
				break;
			case 'setFilters':
				this.twitterService.setFilters(parameters);
				break;
			case 'deleteFilter':
				this.twitterService.deleteFilter(parameters);
				break;
			case 'updateFilter':
				this.twitterService.deleteFilter(parameters.event_id);
				this.twitterService.addFilter(parameters);
				break;
			case 'addUser':
				this.twitterService.addUser(parameters.user_id, parameters.twitter_display_name,
					parameters.twitter_id);
				break;
			case 'deleteUser':
				this.twitterService.deleteUser(parameters);
				break;
			case 'setUsers':
				this.twitterService.setUsers(parameters);
				break;
			case 'multi':
				parameters.forEach(function (commandObj) {
					self.onCommand(commandObj.cmd, commandObj.params);
				});
				break;
			default:
		}

	}

};


module.exports = RedisShell;