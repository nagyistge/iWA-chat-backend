'use strict';

module.exports = exports;
var settings = require('../../../../../settings');

/**
 * Depencies
 */
var util = require('util');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');

/**
 * Globals
 */
// DDBB
var UserModel;

// Loggers
var streamLogger;

//Initialize the non straight away global variables
(function initialize() {
	UserModel = iWAMongo.model(iWAUser);
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');
}());


/**
 * Return the event's callback function to use in on 'connection' socket event.
 * Connection function set in the user's session data bound to the socket's namespace. This object
 * is a view representation of the user used in messages a comments' owner,
 * @see libs/iWazat/view/timeline/messages#ownerView

 *
 * @param {String} namespace identifier
 * @param {Object} eventDoc mongoose event document
 * @param {Function} callback. This callback receive the client socket and the user's session data
 *    bound to the socket if the connection has been established successful, otherwise the callback
 *    is not called and the client will be disconnected
 * @returns {Function}
 */
module.exports = function (namespace, eventDoc, callback) {

	var eventId = eventDoc.id;

	return function (session, socket) {
		var userEventRel = iWASession.getEvent(session, eventId);

		if (!userEventRel) {
			streamLogger.error('Service: events/timeline # Action: listeners/connection | Weird case: ' +
				'The connection has been authenticated but the user\'s session doesn\'t contains any ' +
				'reference to the event.  maybe the user logged out but the socket tried to reconnect ' +
				'after it. User\'s session object: ' + util.inspect(session));
			socket.disconnect();
			return;
		}

		UserModel.findOne({
			_id: session.user.id
		}, {
			avatars: true,
			personas: {$elemMatch: {_id: userEventRel.user_relation.persona_id}}
		}, function (err, user) {
			if (err) {
				streamLogger.error('Service: events/timeline # Action: listeners/connection | Error ' +
					'when trying to get the user data (user id: ' + session.user.id + '). User socket ' +
					'connection rejected | Details: ' + err);
				socket.disconnect();
				return;
			}

			if (!user) {
				streamLogger.error('Service: events/timeline # Action: listeners/connection | No ' +
					'user returned from the database with id: ' + session.user.id + ').  Possible ' +
					' inconsistency with the user session | User socket connection rejected');
				socket.disconnect();
				return;
			}

			var userSessSocketData = {
				actor: {
					_id: user._id,
					persona: user.personas[0]._id
				},
				view: tmMessagesView.ownerView(user)
			}

			iWASession.setNamespaceSocketData(session, namespace, userSessSocketData,
				function (err) {
					if (err) {
						streamLogger.error('Service: events/timeline # Action:Action: listeners/connection | Error' +
							' when saving the user\'s socket session. Event id: ' + eventId + ' | Details' + err);
						socket.disconnect();
					} else {
						callback(socket, userSessSocketData);
					}
				});
		});// End retrieve user
	};
};