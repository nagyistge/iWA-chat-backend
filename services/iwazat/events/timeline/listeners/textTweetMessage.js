'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Depencies
 */
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
// Utils
var sanitizer = require('validator').sanitize;
// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');
// Twitter
var userTweetSender =
	require(settings.servicesPath + '/iwazat/twitter/dealer/senders').eventTimelineUserTextTweet;


/**
 * Globals
 */
// Loggers
var streamLogger;
var UserModel;

//Initialize the non straight away global variables
(function initialize() {
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');
	UserModel = iWAMongo.model(iWAUser);

}());


/**
 * Return the event's callback function to use for a new text-tweet message received.
 * This function returns the success or unsuccess confirmation the client. If success, then
 * the newMessage emitter is called sending an message's object.
 *
 * @see libs/iWazat/view/timeline/messages#iWazatTextMessageView
 *
 * @param {Object} clientSocket the socket instance associate to the client who sent this message
 * @param {Function} newMessageEmitter the new message emitter for the server socket
 * @param {Object} MsgTimelineModel The message timeline mongoose model
 * @param {Object} userSessSocketData The user's session data stored for this namespace socket.
 *    Because this data is set when the client's socket connects, and it shouldn't be updated
 *    out of the connection listener function scope and those changes will not be used out of it,
 *    we use straight away the object rather than access to the session (connect session) in each
 *    call to enhance the performance.
 *    TODO Check that it works running a cluster (multiple server processes)
 * @param {String} eventId  The event's id which the server socket manages
 * @param {String} msgColNum The message collection number used by the timeline which the server
 *      socket manages
 * @returns {Function}
 */
module.exports =
	function (
		clientSocket, newMessageEmitter, MsgTimelineModel, userSessSocketData, eventId, msgColNum) {

		function sendTweetListener(text, confirmFn) {

			function sendTweetAndStore(userTwitterData) {
				try {

					text = text.trim();
					text = sanitizer(text).xss();


					userTweetSender(
						eventId,
						msgColNum,
						userTwitterData,
						text,
						function (err, tweet) {

							if (err) {
								confirmFn(false);
								streamLogger.error('Service: events/timeline # Action: listeners/textTweetMessage' +
									'| Error received from tweet sender | Details: ' + err.message);
								return;
							}

							MsgTimelineModel.createIWATextTweet(tweet, userSessSocketData.actor._id,
								userSessSocketData.actor.persona,
								function (err, iWATextMsg) {

									if (err) {
										confirmFn(false);
										streamLogger.error('Service: events/timeline # Action: listeners/' +
											'textTweetMessage | Error to create a new timeline text tweet message | ' +
											'Details: ' + err.message);

									} else {
										confirmFn(true);

										newMessageEmitter(
											tmMessagesView.iWazatTextTweetMessageView(
												iWATextMsg,
												userSessSocketData.view
											)
										);
									}
								});
						});

				} catch (e) {
					confirmFn(false);
					streamLogger.warn('Exception in the service: events/timeline # Action: ' +
						'listeners/textMessage, maybe it was thrown because the message received is of ' +
						'unappropriated format. Exception message: ' + e.message);
				}
			}

			clientSocket.get('userTwitterAccount', function (err, userTwitterData) {

				if (err) {
					streamLogger.error('Service: events/timeline # Action: listeners/textTweetMessage | ' +
						'Error to get the user\'s twitter data from the client socket\'s session | Details: ' +
						err);
					confirmFn(false);
					return;
				}

				if (userTwitterData) {
					sendTweetAndStore(JSON.parse(userTwitterData));
				} else {
					streamLogger.error('Service: events/timeline # Action: listeners/textTweetMessage | ' +
						'The client socket\'s session doesn\'t has the user\'s twitter data; it is an ' +
						'unexpected behaviour');
					confirmFn(false);
				}

			});
		}

		// Listener is a function that return a false confirmation in the first time, and it will be
		// replace by sendTweetListener function if the user has an twitter authorised account attached
		// to the session's persona and the twitter's data has been store in the socket's session
		// successful
		var listener = function (text, confirmFn) {
			confirmFn(false);
		};

		// Populate the user's twitter data required to send tweets into the socket's session
		UserModel.findById(userSessSocketData.actor._id,
			{
				social_network_accounts: true,
				personas: {$elemMatch: {_id: userSessSocketData.actor.persona}}
			},
			function (err, user) {

				if (err) {
					streamLogger.error('Service: events/timeline # Action: listeners/textTweetMessage | ' +
						'Error when retrieving the user twitter data to store in the session\'s socket. Error' +
						' details: ' + err.message);
					return;
				}

				if ((!user) && (1 === user.personas.length)) {
					streamLogger.error('Service: events/timeline # Action: listeners/textTweetMessage | ' +
						'Weird case: Any user or persona found with the provided credentials');
					return;
				}

				var sn;
				var sNAccObj;
				var uSNAccounts = user.social_network_accounts;
				var perSNAcc = user.personas[0].social_network_accounts;

				for (sn = 0; sn < perSNAcc.length; sn++) {
					sNAccObj = uSNAccounts.id(perSNAcc[sn]._id);

					if ((sNAccObj) && ('Twitter' === sNAccObj.type)) {
						break;
					}
				}

				if (sn === perSNAcc.length) {
					streamLogger.info('Service: events/timeline # Action: listeners/textTweetMessage | ' +
						'No twitter social network account registered for the user: ' +
						userSessSocketData.actor._id + ' and persona: ' + userSessSocketData.actor.persona);
					return;

				} else {

					clientSocket.set('userTwitterAccount', JSON.stringify({
							id: sNAccObj.account_id,
							auth: sNAccObj.account_auth,
							status: sNAccObj.status
						}
					),
						function () {
							listener = sendTweetListener;
						});
				}
			});


		// Return the listener function. It doesn't wait the confirmation of Redis, because it is
		// enough reliable not to wait
		return function (text, confirmFn) {
			listener(text, confirmFn);
		};
	};