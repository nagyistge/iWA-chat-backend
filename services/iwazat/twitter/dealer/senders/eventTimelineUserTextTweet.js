'use strict';


/**
 * Dependencies
 */
var settings = require('../../../../../settings');
var Twit = require('twit');
var ttConfigManager = require(settings.servicesPath + '/iwazat/twitter/assistant/configManager');
var utilUrls = require(settings.libsPath + '/ifc/util/urls');

/**
 * Constants
 */
var LOG_PREFIX = 'Event-timeline-send-text-tweet: ';
var FILTER_ID = 'iWazatTweet:';
var REDIS_SUB_FILTERS_CHANEL_SCOPE = 'TwitterFilters:tweet';

/**
 * Globals
 */
var twitterConfig;
var twitterLogger;
var criticalLogger;
var gDBSysIssuesLogger;
var redisSubFiltersChannel;


// Initialisation non-straight forward variables
(function initialisation() {
	var iWALogger = require(settings.sysPath + '/tools/iwaLogger');

	twitterConfig = require(settings.libsPath + '/iwazat/util/config');
	twitterConfig =
		twitterConfig.getConfiguration(require(settings.configsPath + '/twitter'), 'iWazat_app');


	twitterLogger = iWALogger.getWinstonLogger('twitter');
	criticalLogger = iWALogger.getWinstonLogger('criticalIssues');
	gDBSysIssuesLogger = iWALogger.getWinstonLogger('globalDBSysIssues');

	redisSubFiltersChannel = settings.env + '-' + REDIS_SUB_FILTERS_CHANEL_SCOPE;

}());

/**
 *
 * @param {Object} redisCmdClient Connected redis client to emit command
 * @param {Object} redisPubClient Connected redis client to publish messages
 * @param {Object} eventRef The event's timeline collection where the tweet was sent.
 *      The object properties are:
 *          # id: The event's id.
 *          # msgColNum: The timeline collection's number.
 * @param {Object} userTwitterAccount User's twitter account data. Required attributes:
 *            # id: Twitter account's id
 *            # auth: Twitter account's authorization data, so it must contain:
 *                - token
 *                - token_secret
 *            # status: The account registration status. Our system use the status to know if the
 *                  account has been authenticated, validated and so on
 * @param tweetText
 * @param callback
 */
module.exports = function (
	redisCmdClient, redisPubClient, eventRef, userTwitterAccount, tweetText, callback) {

	if ('authenticated' !== userTwitterAccount.status) {
		callback(new Error('Users with non-authenticated twitter account cannot send tweets'));
		return;
	}

	ttConfigManager.getConfigValue('short_url_length',
		function (err, shortUrlLength) {

			var userRedisKey;

			if (err) {
				callback(err);
				return;
			}

			var numCharsInTweet = tweetText.length;

			utilUrls.parseWebHostDomainNames(tweetText).forEach(function (urlInfoObj) {
				var urlLength = urlInfoObj.indexes.end - urlInfoObj.indexes.start - shortUrlLength;

				if ('https' === urlInfoObj.protocol) {
					urlLength--;
				}

				if (0 < urlLength) {
					numCharsInTweet -= urlLength;
				}

			});

			if (numCharsInTweet > ttConfigManager.getNumMaxCharsPerTweet()) {
				callback(new Error('The text for the tweet exceeds of ' +
					ttConfigManager.getNumMaxCharsPerTweet() + ' characters'));
				return;
			}

			userRedisKey = FILTER_ID + eventRef.id + ':' + eventRef.msgColNum + ':' +
				userTwitterAccount.id;

			redisCmdClient.set(userRedisKey, 'waiting', function (err) {
				if (err) {
					callback(err);
					return;
				}

				try {
					var twit = new Twit({
						consumer_key: twitterConfig.consumer_key,
						consumer_secret: twitterConfig.consumer_secret,
						access_token: userTwitterAccount.auth.token,
						access_token_secret: userTwitterAccount.auth.token_secret
					});

					twit.post('statuses/update', { status: tweetText }, function (err, tweet) {

						if (tweet) {
							releaseQueue(redisCmdClient, redisPubClient, tweet.id_str, userRedisKey, eventRef);
						} else {
							releaseQueue(redisCmdClient, redisPubClient, null, userRedisKey, eventRef);
						}

						if (err) {
							twitterLogger.error(LOG_PREFIX + err.message);
							callback(err);
						} else {
							callback(null, tweet);
						}

					}); // End send tweet
				} catch (e) {
					callback(e);
				}
			});
		});
};

function releaseQueue(redisCmdClient, redisPubClient, tweetId, userRedisKey, eventRef) {

	// This function avoid to be declared in each element removed from the queue, so it enhance the
	// performance
	function delQueuesConfirmationFn(err) {
		if (err) {
			gDBSysIssuesLogger(LOG_PREFIX + 'Cannot delete the queues which ' +
				'manage the tweets meanwhile the system wait the twitter response when the user ' +
				'sent a tweet from the platform.Queues keys:  ' + queueKey + ' & ' + queueBackupKey +
				' / Error ' + 'details: ' + err.message);
		}
	}

	function delKeyConfirmationFn(err) {
		if (err) {
			criticalLogger(LOG_PREFIX + 'Cannot delete the value of the key (semaphore) which stops ' +
				'the user\'s tweets meanwhile the system wait the twitter response when the user sent a ' +
				'tweet from the platform. key: ' + userRedisKey + ' / Error ' + 'details: ' + err.message);
		}
	}



	function releaseTweets() {
		redisCmdClient.rpoplpush(queueKey, queueBackupKey, function (err, jsonIWATwitterServerTweet) {

			if (err) {
				// Error should be if the keys are not queues otherwise the error should be so weird, so
				// it logs the error and carry on removing elements until a number of error be reached
				numReportedErrors++;

				gDBSysIssuesLogger.error(LOG_PREFIX + ':redis: When removing tweet using queue reliable ' +
					'pattern on queues ' + queueKey + ' --> ' + queueBackupKey + ' / Error details: ' +
					err.message);

				if (15 < numReportedErrors) {

					criticalLogger(LOG_PREFIX + 'Cannot get rid of user\'s tweet queue which avoid to ' +
						'process meanwhile the system waited for the twitter\'s response when the user send ' +
						'a tweet from the application. Redis queues: ' + queueKey + ' --> ' + queueBackupKey +
						' / Error details: ' + err.message);

				} else {
					releaseTweets();
				}

				return;
			}

			var iWATwitterServerTweet;

			if (jsonIWATwitterServerTweet) {
				iWATwitterServerTweet = JSON.parse(jsonIWATwitterServerTweet);

				if (iWATwitterServerTweet.source.id !== tweetId) {
					// Because this sender use filters with filters which work at event timeline level,
					// the tweets don't have a event reference, so it must attach the reference for
					// this event before publishing in the filter channel to be processed properly
					iWATwitterServerTweet.event_ids = [eventRefString];
					redisPubClient.publish(redisSubFiltersChannel, JSON.stringify(iWATwitterServerTweet));
				} else {
					// Because the tweet was in the queue, it deletes the tweet id from the set
						redisCmdClient.srem(setKey, tweetId, function (err) {
							if (err) {
								gDBSysIssuesLogger(LOG_PREFIX + 'error from redis\'s client to remove ' +
									'one element from the set: ' + setKey);
								callback(err);
								return;
							}
						});
				}

				releaseTweets();

			} else {
				// Delete queues when it is empty
				redisCmdClient.del(queueKey, queueBackupKey, delQueuesConfirmationFn);
			}

		});
	}

	var numReportedErrors = 0;
	var queueKey = userRedisKey + ':queue';
	var queueBackupKey = queueKey + '_backup';
	var setKey = userRedisKey + ':set:drop';
	var eventRefString = eventRef.id + '_' + eventRef.msgColNum;

	if (null !== tweetId) {
		redisCmdClient.sadd(setKey, tweetId, function (err) {
			if (err) {
				gDBSysIssuesLogger(LOG_PREFIX + 'Cannot delete added the tweet to be dropped, so it may be' +
					'captured for the event stream and appears in the event timeline and it hold two different' +
					'iWazat messages with the same content. Set key: ' + setKey + ' / Error ' + 'details: ' +
					err.message);
			} else {

				// Timeout to get rid of the tweet after 10 seconds in the case that it has been removed
				// because it isn't in the queue and/or it hasn't been collected for stream and classified
				// for this event timeline.
				setTimeout(function () {
					redisCmdClient.srem(setKey, tweetId, function (err) {
						if (err) {
							gDBSysIssuesLogger(LOG_PREFIX + 'error from redis\'s client to remove ' +
								'one element from the set: ' + setKey);
							callback(err);
							return;
						}
					});
				}, 10000);

			}

			redisCmdClient.del(userRedisKey, delKeyConfirmationFn);
		});

	} else {
		redisCmdClient.del(userRedisKey, delKeyConfirmationFn);
	}

	releaseTweets();

};


//function deleteUserRedisKey(redisClient, userRedisKey) {
//
//	redisClient.del(userRedisKey, function (err) {
//		if (err) {
//			criticalLogger(LOG_PREFIX + 'Cannot delete the key that holds the tweets from ' +
//				'one user, for one timeline. Redis key: ' + userRedisKey + ' / Error details' +
//				': ' + err.message);
//		}
//	}); //End delete key
//}




