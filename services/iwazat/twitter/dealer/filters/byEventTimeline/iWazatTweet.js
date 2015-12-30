'use strict';


module.exports = exports;

/**
 * Dependencies
 */
var FilterAbstract = require('../abstract');

/**
 * Constants
 */

var FILTER_ID = 'iWazatTweet:';

/**
 * Global variables
 */
var iWATwitterAppNameRegExp;


(function initialise() {

	var settings = require('../../../../../../settings');
	var configLoader = require(settings.libsPath + '/iwazat/util/config');
	iWATwitterAppNameRegExp =
		configLoader.getConfiguration(require(settings.configsPath + '/twitter'), 'iWazat_app');
	iWATwitterAppNameRegExp = new RegExp(iWATwitterAppNameRegExp.application_name, 'i');

}());

/**
 *
 * @param redisClient
 * @param options
 */

module.exports = function (redisClient, options) {

	FilterAbstract.call(this, FILTER_ID + ' ', redisClient, options);

};

module.exports.prototype = {
	__proto__: FilterAbstract.prototype,
	filter: function (eventId, msgColNum, tweet, callback) {

		var self = this;
		var key = FILTER_ID + eventId + ':' + msgColNum + ':' + tweet.from.source_id;
		var setDropKey = key + ':set:drop';

		// Check if the tweet was sent from iWazat
		if (iWATwitterAppNameRegExp.test(tweet.source.raw.source)) {
			this.redisClient.get(key, function (err, val) {

				var jsonTweet;
				var eventIds;

				if (err) {
					self.logger.error(self.messageLogPrefix + 'error from redis\'s client to retrieve ' +
						'value from the key: ' + key);
					callback(err);
					return;
				}


				if ('waiting' === val) {

					// Remove the events reference to store the event so the process which pops the tweets
					// from the queue must attach only the reference for this event
					delete tweet.event_ids;
					jsonTweet = JSON.stringify(tweet);

					self.redisClient.lpush(key + ':queue', jsonTweet, function (err) {
						if (err) {
							self.logger.error(self.messageLogPrefix + 'error from redis\'s client to enqueue ' +
								'a tweet, so it has been lost. Json Twee value: ' + jsonTweet);
							callback(err);
						} else {
							callback();
						}
					});

				} else {

					// Check if the tweet is in the sets to execute some individual operations
					// Set to drop it if exist
					self.redisClient.srem(setDropKey, tweet.source.id, function (err, count) {

						if (err) {
							self.logger.error(self.messageLogPrefix + 'error from redis\'s client to remove ' +
								'one element from the set: ' + setDropKey);
							callback(err);
							return;
						}

						if (0 === count) {
							callback(null, tweet);
						} else {
							callback();
						}
					});
				}
			});

		} else {
			callback(null, tweet);
		}
	}
};



