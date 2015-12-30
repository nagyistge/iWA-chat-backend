'use strict';


/**
 * Senders
 */
var eventTimelineUserTextTweet = require('./eventTimelineUserTextTweet');

/**
 * Globals
 */
var redisCmdClient;
var redisPubSubClient;

(function initialise() {

	var settings = require('../../../../../settings');
	var streamLogger = require(settings.sysPath + '/tools/iwaLogger')
		.getWinstonLogger('eventsStream');
	var redisStandardClient = require(settings.libsPath + '/ifc/redis/standardClient');
	var redisConfig = require(settings.libsPath + '/iwazat/util/config');

	redisConfig = redisConfig.getConfiguration(require(settings.configsPath + '/redis'), 'timelines');

	redisCmdClient = redisStandardClient({
		redisConfig: redisConfig,
		logMsgPrefix: 'Twitter-sender redis client: ',
		logger: streamLogger
	});

	// Ensure that database is not provided because the next client will be used in pub/sub paradigm
	delete redisConfig.database;
	redisPubSubClient = redisStandardClient({
		redisConfig: redisConfig,
		logMsgPrefix: 'Twitter-sender redis client: ',
		logger: streamLogger
	});

})();


module.exports = {
	eventTimelineUserTextTweet: function (eventId, tmMsgColNum, userTwitterAccount, tweetText, callback) {
		eventTimelineUserTextTweet(
			redisCmdClient,
			redisPubSubClient,
			{
				id: eventId,
				msgColNum: tmMsgColNum
			},
			userTwitterAccount,
			tweetText,
			callback
		);
	}
}








