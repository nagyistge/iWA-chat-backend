/**
 * Service for managing iWazat sessions
 */
module.exports = exports;
var settings = require('../../settings.js');

/**
 * Dependencies
 */
var redis = require('redis');
//var io = require('socket.io');
var io = require(settings.libsPath + '/socket.io');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'iWazat socket.io service: ';
var ECONNREFUSED_REG_EXP = /\bECONNREFUSED\b/;

/**
 * Globals
 */
var sio;

/**
 * If the application is an express app, then the express app must be instantiated before passed to
 * this function by argument; this function must be called before set the express routes, too.
 *
 * @param {Object} server The express app instance to setup the session
 * @parma {Object} sioOptions
 * @api public
 */
module.exports.initialise = function (server, sioOptions) {


	// Avoid that initialise can be run again in a future event loop cycle meanwhile although this
	// method initialization is synchronous we execute in the beginning by convention
	delete this.initialise;

	var opt;
	var sioRedisClients = {};
	var configLoader = require(settings.libsPath + '/iwazat/util/config');
	var sioConfig = require(settings.configsPath + '/redis');
	var iWASession = require(settings.servicesPath + '/iwazat/session');


	if ((!iWASession.store) || (!iWASession.cookieParser)) {
		throw new Error('iWazat Socket service requires first the initialization of iWASession Service');
	}

	sioConfig = configLoader.getConfiguration(sioConfig, 'socketIO');

	sioRedisClients.redis = redis;
	sioRedisClients.redisPub = getRedisPubClient(sioConfig.redisPub);
	sioRedisClients.redisSub = getRedisSubClient(sioConfig.redisSub);
	sioRedisClients.redisClient = getRedisCmdClient(sioConfig.redisClient);
	

	sio = io.listen(server, {
		store: new io.RedisStore(sioRedisClients)
	});

	// Set the socket.io configuration parameters
	if (sioOptions) {
		for (opt in sioOptions) {
			if (opt === 'store') {
				throw new Error('socket.io store mustn\'t be configured by the options parameter');
			}

			sio.set(opt, sioOptions[opt]);
		}
	}


	sio = require('expression.socket.io')(sio, iWASession.store,
		iWASession.cookieParser, {
			key: iWASession.sessionKey,
			autoErrManager: true
		});


	// Methods
	this.socketIO = sio;
	this.isNamespaceUp = isNamespaceUp;
	this.shutDownNamespace = shutDownNamespace;

};


var isNamespaceUp = function (nsId) {
	return (sio.namespaces[nsId]) ? true : false;
};

var shutDownNamespace = function (nsId) {

	var ns = sio.namespaces[nsId];
	var sId;

	if (ns) {
		for (sId in ns.sockets) {
			ns.sockets[sId].disconnect();
		}

		delete sio.namespaces[nsId];
	}
};


function getRedisSubClient(config) {

	var redisClient = redis.createClient(config.port, config.host, config.options);

	if (config.password) {
		redisClient.auth(config.password, function (err) {
			if (err) {
				settings.logger.error(PREFIX_ID_LOG + 'redis subscriber client authentication failed. ' +
					'Error: ' + err.message);
				process.exit(1);
			}
		});

	}

	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#run
	redisClient.on('error', function (err) {

		if (ECONNREFUSED_REG_EXP.test(err.message)) {
			settings.logger.warn(PREFIX_ID_LOG + 'redis subscriber client connection has been ' +
				'disconnected; redis client will try to reconnect automatically');
		} else {
			settings.logger.error(PREFIX_ID_LOG + 'redis subscriber client received this error: ' + err);
		}
	});

	if ((config.options) && (config.options.no_ready_check === true)) {
		redisClient.on('connect', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis subscriber client connected. Number of ' +
				'messages are going to send: ' + redisClient.offline_queue.length);
		});
	} else {

		redisClient.on('ready', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis subscriber client ready and offline queue flushed');
		});
	}
	
	return redisClient;

}

function getRedisPubClient(config) {

	var redisClient = redis.createClient(config.port, config.host, config.options);

	if (config.password) {
		redisClient.auth(config.password, function (err) {
			if (err) {
				settings.logger.error(PREFIX_ID_LOG + 'redis publisher client authentication failed. ' +
					'Error: ' + err.message);
				process.exit(1);
			}
		});

	}


	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#run
	redisClient.on('error', function (err) {

		if (ECONNREFUSED_REG_EXP.test(err.message)) {
			settings.logger.warn(PREFIX_ID_LOG + 'redis publisher client connection has been ' +
				'disconnected; redis client will try to reconnect automatically');
		} else {
			settings.logger.error(PREFIX_ID_LOG + 'redis publisher client received this error: ' + err);
		}
	});

	if ((config.options) && (config.options.no_ready_check === true)) {
		redisClient.on('connect', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis publisher client connected. Number of messages' +
				' are going to send: ' + redisClient.offline_queue.length);
		});

	} else {
		redisClient.on('ready', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis publisher client ready and offline queue flushed');
		});
	}

	return redisClient;

}

function getRedisCmdClient(config) {

	var redisClient = redis.createClient(config.port, config.host, config.options);

	if (config.password) {
		redisClient.auth(config.password, function (err) {
			if (err) {
				settings.logger.error(PREFIX_ID_LOG + 'redis session client authentication failed. ' +
					'Error: ' + err.message);
				process.exit(1);
			}
		});

	}

	if (config.database) {
		redisClient.select(config.database);
	}

	// Error listener to report only a connection error, it will removed after the connection
	// success, @see RedisShell#open#run
	redisClient.on('error', function (err) {

		if (ECONNREFUSED_REG_EXP.test(err.message)) {
			settings.logger.warn(PREFIX_ID_LOG + 'redis session client connection has been ' +
				'disconnected; redis client will try to reconnect automatically');
		} else {
			settings.logger.error(PREFIX_ID_LOG + 'redis session client received this error: ' + err);
		}
	});

	if ((config.options) && (config.options.no_ready_check === true)) {
		redisClient.on('connect', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis session client connected. Number of messages' +
				' are going to send: ' + redisClient.offline_queue.length);

			if (config.database) {
				redisClient.send_anyway = true;
				redisClient.select(config.database);
				redisClient.send_anyway = false;
			}
		});
	} else {

		if (config.database) {
			redisClient.on('connect', function () {
				redisClient.send_anyway = true;
				redisClient.select(config.database);
				redisClient.send_anyway = false;
			});
		}

		redisClient.on('ready', function () {
			settings.logger.info(PREFIX_ID_LOG + 'redis session client ready and offline queue flushed');
		});
	}

	return redisClient;

}