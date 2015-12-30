'use strict';

/**
 * Dependencies
 */
var inspect = require('util').inspect;
var redis = require('redis');


/**
 * Constants
 */
var PREFIX_ID_LOG = 'redis-shell-client: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;

/**
 *  Private attributes defined in the constructor:
 *    rClientCommander: Redis client to send the commands. This is publish message in a redis
 *      channel
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
 *    }
 *  }
 *  @param {Function} [callback]
 */
var RedisShellClient = function (options, callback) {

	if (!(this instanceof RedisShellClient)) {
		new RedisShellClient(options, callback);
		return;
	}


	var channel = 'CmdShell:';
	var redisSettings = {
		port: null,
		host: null,
		options: null
	};

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


	//# redisClientCommander ==> The redis client to send the commands (redis messages)

	//# Channel name
	Object.defineProperties(this, {
		channel: {
			configurable: false,
			enumerable: true,
			value: channel
		}
	});


	//# Redis client settings to send message commands
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


RedisShellClient.prototype = {
	open: function (callback) {

		var self = this;

		if (!callback) {
			callback = function () {};
		}

		function initialise() {

			// Remove the connect or ready listeners depending of the configuration to register again them
			// to remove the call the initialisation function
			if ((self.redisSettings.options) && (self.redisSettings.options.no_ready_check === true)) {

				self.redisClientCommander.removeAllListeners('connect');
				self.redisClientCommander.on('connect', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
							'going to send: ' + self.redisClientCommander.offline_queue.length);
					}
				});
			} else {

				self.redisClientCommander.removeAllListeners('ready');
				self.redisClientCommander.on('ready', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client ready and offline queue flushed');
					}
				});
			}

			// Remove the error listener set to report only if the connections fails
			//self.redisClientCommander.removeListener('error', callback);
			self.redisClientCommander.removeAllListeners('error');

			// Register an Error listener to avoid that the process finish if some error happens
			self.redisClientCommander.on('error', function (err) {
				if (ECONNREFUSED_REG_EXP.test(err.message)) {
					self.logger.warn(PREFIX_ID_LOG + 'redis client connection has been been ' +
						'disconnected; redis client will try to reconnect automatically');
				} else {
					self.logger.error(PREFIX_ID_LOG + 'redis client received this error: ' + err);
				}
			});

			callback(null, true);
		}


		if (this.redisClientCommander) {
			callback(null, false);
		} else {
			// redis' client setup
			this.redisClientCommander = redis.createClient(this.redisSettings.port,
				this.redisSettings.host, this.redisSettings.options);

			if (this.redisSettings.password) {
				this.redisClientCommander.auth(this.redisSettings.password, function (err) {
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
			this.redisClientCommander.on('error', function (err) {
				self.logger.error(PREFIX_ID_LOG + 'redis client connection failure. Error details: ' + err);
				callback(err);
			});

			if ((this.redisSettings.options) && (this.redisSettings.options.no_ready_check === true)) {
				this.redisClientCommander.on('connect', function () {
					if (self.verbose) {
						self.logger.info(PREFIX_ID_LOG + 'redis client connected. Number of messages are ' +
							'going to send: ' + self.redisClientCommander.offline_queue.length);
					}

					initialise();
				});
			} else {

				this.redisClientCommander.on('ready', function () {
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

		if (this.redisClientCommander) {

			self.redisClientCommander.on('end', function () {

				if (self.verbose) {
					self.logger.info(PREFIX_ID_LOG + ' redis client connection has closed');
				}

				self.redisClientCommander = null;
				callback(null, true);
			});

			self.redisClientCommander.quit();

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

	sendCommand: function (command, parameters) {

		if (!this.redisClientCommander) {
			throw new Error('Redis client is not connect, please call open before send commands');
		}

		if (parameters) {
			this.redisClientCommander.publish(this.channel, JSON.stringify({
				cmd: command,
				params: parameters
			}));

			if (this.verbose) {
				this.logger.info(PREFIX_ID_LOG + ' Command sent. Details: cmd: ' + command +
					' - Parameters: ' + inspect(parameters, {depth: 4}));
			}


		} else {
			this.redisClientCommander.publish(this.channel, JSON.stringify({
				cmd: command
			}));

			if (this.verbose) {
				this.logger.info(PREFIX_ID_LOG + ' Command sent. Details: cmd: ' + command);
			}
		}
	},

	cmdStop: function () {
		if (!this.appendCommand('stop')) {
			this.sendCommand('stop');
		}
	},

	cmdStart: function () {
		if (!this.appendCommand('start')) {
			this.sendCommand('start');
		}

	},

	cmdRestart: function () {
		if (!this.appendCommand('restart')) {
			this.sendCommand('restart');
		}
	},

	cmdAddFilter: function (filter) {
		if (!this.appendCommand('addFilter', filter)) {
			this.sendCommand('addFilter', filter);
		}
	},

	cmdSetFilters: function (filters) {
		if (!this.appendCommand('setFilters', filters)) {
			this.sendCommand('setFilters', filters);
		}
	},

	cmdDeleteFilter: function (eventId) {
		if (!this.appendCommand('deleteFilter', eventId)) {
			this.sendCommand('deleteFilter', eventId);
		}
	},

	cmdUpdateFilter: function (filter) {
		if (!this.appendCommand('updateFilter', filter)) {
			this.sendCommand('updateFilter', filter);
		}
	},

	/**
	 * First call put the client en command queue mode to emit the multi command when called on
	 * second time.
	 */
	cmdMulti: function () {
		if (this.cmdQueue) {
			this.sendCommand('multi', this.cmdQueue);
			delete this.cmdQueue;
		} else {
			this.cmdQueue = [];
		}
	},

	/**
	 *
	 * @param command
	 * @param [parameters]
	 * @api private
	 */
	appendCommand: function (command, parameters) {

		if (!this.cmdQueue) {
			return false;
		}

		if (parameters) {
			this.cmdQueue.push({
				cmd: command,
				params: parameters
			});
		} else {
			this.cmdQueue.push({
				cmd: command
			});
		}

		return true;
	}

};


module.exports = RedisShellClient;