'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Globals
 */
// Services
var twtConsumer;


//Initialize the non-straight away global variables and receive the twitter consumer instance
module.exports = function initialize(twitterConsumer) {
	twtConsumer = twitterConsumer;

	module.exports = updateTwitterFilter;
	// Allows chaining
	return updateTwitterFilter;
};


/**
 * Update the twitter filter of the specified timeline's event
 * @param {Object} event Mongoose event's document
 * @return {Boolean} True if the stream is closed in this call, otherwise false (stream was already
 *        closed)
 */
function updateTwitterFilter(event) {

	return twtConsumer.changeFilter(
		event.id,
		event.message_collection_count,
		event.social_accounts.twitter.hashtags,
		event.social_accounts.twitter.mentions
	);
};