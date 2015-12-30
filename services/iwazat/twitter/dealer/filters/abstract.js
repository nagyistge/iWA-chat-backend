'use strict';


module.exports = exports;



/**
 * @param {String} idMessagesLog
 * @param {Object} redisClient
 * @param {Object} options
 */

module.exports = function (idMessagesLog, redisClient, options) {


	this.redisClient = redisClient;

	if (options) {
		this.looger = (options.logger) ? options.logger : console;
		this.messageLogPrefix = (options.messageLogPrefix) ?
			options.messageLogPrefix + idMessagesLog : idMessagesLog;



	} else {
		this.logger = console;
		this.messageLogPrefix = idMessagesLog;
	}

};

module.exports.prototype = {

};




