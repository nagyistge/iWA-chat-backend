'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Dependencies
 */
// System
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWATimelineMsg = require(settings.modelsPath + '/iwazat/timelineMessage');
// Sockets
var iWASocketIO = require(settings.servicesPath + '/iwazat/socket.io');
// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

/**
 * Globals
 */
// Services
var expressionSocket;
var twtConsumer;
// Loggers
var secIssuesLogger;
var streamLogger;
// Emitters
var emitterInst = require('./emitters');
// Event listeners
var onConnection = require('./listeners/connection');
var onTextMessage = require('./listeners/textMessage');
var onTextTweetMessage = require('./listeners/textTweetMessage');
var onComment = require('./listeners/comment');
var onMessageAssessment = require('./listeners/messageAssessment');
var onCommentAssessment = require('./listeners/commentAssessment');


//Initialize the non-straight away global variables and receive the twitter consumer instance
module.exports = function initialize(twitterConsumer) {
	twtConsumer = twitterConsumer;
	expressionSocket = iWASocketIO.socketIO;
	secIssuesLogger = iwaLogger.getWinstonLogger('securityIssues');
	streamLogger = iwaLogger.getWinstonLogger('eventsStream');


	module.exports = open;
	// Allows chaining
	return open;
};


/**
 * Opens the socket namespace to manage the event timeline
 * @param {Object} event Mongoose event's document
 * @return {Boolean} True if the stream is opened in this call, otherwise false (stream was already
 *        opened)
 */
var open = function (event) {

	var eventId = event.id,
		tmMsgCol = event.message_collection_count,
		nsId = '/event/' + event.id + '/stream';

	if (iWASocketIO.isNamespaceUp(nsId)) {
		streamLogger.warn('Requested to open a opened stream timeline. Socket namespace: ' + nsId);
		return false;
	}

	var MsgTimelineModel = iWAMongo.model(iWATimelineMsg, iWATimelineMsg.mongooseModelOptions(event));

	var streamSocket = expressionSocket.of(nsId);
	var emitters = emitterInst(streamSocket);

	// Client connection authorization
	streamSocket.authorization(function (session, handshake, fn) {

		if (true !== iWASession.isUserAuthAccessEvent(session, eventId)) {
			secIssuesLogger.warn('Service: events/timeline # Action: stream/open#authorization | User ' +
				'is no authenticated to access to the event | Client socket connection rejected, although ' +
				'somebody is trying to get access to the stream out of our available ways. POSSIBLE ATTACK!!');
			fn(null, false);
		} else {
			fn(null, true);
		}
	}); // Socket authorization callback

	//streamSocket.on('connection', onConnection(nsId, event, function (socket, userSessSocketData) {
	streamSocket.sessOn('connection',
		onConnection(nsId, event, function (socket, userSessSocketData) {

			// Attach the event listener for the new client connected

			socket.on('text message',
				onTextMessage(emitters.newMessage, MsgTimelineModel, userSessSocketData));


			socket.on('text tweet message', onTextTweetMessage(
				socket,
				emitters.newMessage,
				MsgTimelineModel,
				userSessSocketData,
				eventId,
				tmMsgCol
			));

			socket.on('comment', onComment(emitters.newComment, MsgTimelineModel, userSessSocketData));

			socket.on('message assessment',
				onMessageAssessment(emitters.messageAssessment, MsgTimelineModel,
					userSessSocketData));

			socket.on('comment assessment',
				onCommentAssessment(emitters.commentAssessment, MsgTimelineModel,
					userSessSocketData));

			socket.on('disconnect', function (msg) {

				if ('packet' === msg) {
					socket.disconnect();
				}
			});

		}));


	// Setup twitter consumer
	if (event.social_accounts.twitter) {
		twtConsumer.registerEvent(
			eventId,
			event.message_collection_count,
			event.social_accounts.twitter.hashtags,
			event.social_accounts.twitter.mentions,
			function (iwaTweet) {
				emitters.newMessage(iwaTweet);
			});
	}


	return true;
};