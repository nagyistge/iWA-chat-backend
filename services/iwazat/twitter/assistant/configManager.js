'use strict';

/**
 * This script is autoremoved from the require.cache when finish the operation because the
 * operations that it performs are only to be execute a few times per day (not more than 4)
 *
 */

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Global dependencies
 */

var utilObjects = require(settings.libsPath + '/iwazat/util/objects');
var configCache;

/**
 * Constants
 */
var PREFIX_ID_LOG = 'assistant-configuration: ';
var PREFIX_TWITTER_CONFIG = 'twitter_config.';
var MAX_REDIS_CON_ATTEMPTS = 15;
var CACHE_EXPIRATION_TIME = 28800 * 1000; // 8 hours in milliseconds

/**
 * Cache cleaner function
 */
function cleanCache() {
	configCache = null;
	// next time that the cache will expires
	setTimeout(cleanCache, CACHE_EXPIRATION_TIME);
}

// Non-straight forward initialisations
(function initialise() {

	cleanCache();

}());


/**
 * Return the number maximum of characters which are allowed per tweet.
 * Wrap the value in a function for this values change in the future an it arrive from twitter
 * configuration
 *
 * @returns {number}
 */
exports.getNumMaxCharsPerTweet = function () {
	return 140;
}

/**
 * Return the configuration value associated with the provided key or the whole configuration
 * object. If the configuration is not in the cache, then it automatically launches the update
 * method, and returns the required value.
 *
 * @param {String} [key] The configuration key, in dot notation, if it is not provided,
 *          it returns the whole configuration object
 * @param {Function} callback Error is returned if some error happened on the cache's update (in the
 *    case that it was needed) or the key doesn't exist
 */
exports.getConfigValue = function (key, callback) {

	if ('function' === typeof key) {
		callback = key;
		key = null;
	}

	if (null === configCache) {
		this.update(function (err, configCache) {

			if (err) {
				callback(err);
				return;
			}

			if (!key) {
				callback(null, configCache);
			} else {
				try {
					callback(null, utilObjects.getObjectPropValue(configCache, key, false));

				} catch (e) {
					callback(new Error('Non-existent key. Any configuration value exists with the provided ' +
						'key'));
				}
			}
		});

	} else {
		try {
			if (!key) {
				callback(null, configCache);
			} else {
				callback(null, utilObjects.getObjectPropValue(configCache, key, false));
			}

		} catch (e) {
			callback(new Error('Invalid key. Any configuration value exists with the provided key'));
		}
	}
};

exports.update = function (callback) {

	// This method load all the dependencies rather than globalise them, because it is only
	// called a very few times, so, loading them here allows that the script uses less memory
	// in trade off to decrease the speed of it method

	var inspect = require('util').inspect;
	var Twit = require('twit');
	var redisConfig = require(settings.configsPath + '/redis');
	var configLoader = require(settings.libsPath + '/iwazat/util/config');
	var twitterCnf = require(settings.configsPath + '/twitter');
	var twitterLogger = require(settings.sysPath + '/tools/iwaLogger');
	var twitterAppCnf = configLoader.getConfiguration(twitterCnf, 'API_Wrapper');
	var twit = new Twit({
		consumer_key: twitterAppCnf.consumer_key,
		consumer_secret: twitterAppCnf.consumer_secret,
		access_token: twitterAppCnf.access_token,
		access_token_secret: twitterAppCnf.access_token_secret
	});
	var redisCacheConfig = configLoader.getConfiguration(redisConfig, 'cache');
	var redisClient = require(settings.libsPath + '/ifc/redis/standardClient');

	redisCacheConfig = utilObjects.clonePlainObject(redisCacheConfig);
	redisCacheConfig.options.max_attempts = MAX_REDIS_CON_ATTEMPTS;

	twitterLogger = twitterLogger.getWinstonLogger('twitter');
	redisClient = redisClient({
		logger: twitterLogger,
		logMsgPrefix: PREFIX_ID_LOG,
		redisConfig: redisCacheConfig
	});


	if (!callback) {
		callback = function () {};
	}

	twit.get('help/configuration', function (err, configObj) {

		if (err) {
			twitterLogger.error(PREFIX_ID_LOG + 'Twitter return an error: ' +
				inspect(err, {depth: null}));

			callback(err);
			redisClient.quit();
			return;
		}

		var tc;
		var flattenConfig = utilObjects.flatten(configObj, {flattenArrays: true});
		var keyValueArr = [];


		// Clean cache after and after update, to renew the expiration time
		cleanCache();
		configCache = configObj;

		for (tc in flattenConfig) {
			keyValueArr.push(PREFIX_TWITTER_CONFIG + tc, flattenConfig[tc]);
		}

		redisClient.mset(keyValueArr, function (err) {
			if (err) {
				twitterLogger.error(PREFIX_ID_LOG + 'redis client failed when set the twitter ' +
					'configuration object as multiple keys. Error details: ' + inspect(err, {depth: null}));
				callback(err);
			} else {
				callback(err, configCache);
			}

			redisClient.quit();
		});

	});
};