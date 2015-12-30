'use strict';

/**
 * Service for managing iWazat sessions
 *
 * Public attributes  are populated when module.exports.initialise is called
 * @property read
 * sessionKey: The session key used
 * store: Session Store object used
 * cookieParser: Cookie parser function used
 *
 * IMPORTANT stuff about this service:
 *
 * Bear in mind that Session shouldn't store a lot of data to avoid to overload the data en each
 * request, so only data required to check authorizations should be stored to avoid the
 * inconvenience to update the sessions' data which may change for a process/function out of
 * the user's session scope
 *
 */

module.exports = exports;
var settings = require('../../settings.js');

/**
 * Dependencies
 */
var express = require('express');

//Util
var iWALibObj = require(settings.libsPath + '/iwazat/util/objects');


(function bootstrap() {
	Object.defineProperty(module.exports, 'sessionKey', {
		configurable: false,
		enumerable: true,
		value: 'iWazat.sess',
		writable: false
	});

}());

/**
 * If the application is an express app, then the express app must be instantiated before passed to
 * this function by argument; this function must be called before set the express routes, too.
 *
 * @param {Object} [expressApp] The express app instance to setup the session
 * @api public
 */
module.exports.initialise = function (expressApp) {

	if (expressApp === undefined) {
		throw new Error('The express application object reference is required');
	}

	// Avoid that initialize can be run again in a future event loop cycle meanwhile although this
	// method initialization is synchronous we execute in the beginning by convention
	delete this.initialise;


	var cookieParser = express.cookieParser('Connecting people into the events');

	// Cookie secret: 'Connecting people into the events'

	//this.store = new connect.middleware.session.MemoryStore();
	var RedisStore = new require('connect-redis')(express);
	var expRedisConfig = require(settings.configsPath + '/redis');
	expRedisConfig = expRedisConfig[settings.app.id][settings.env]['expressSession'];

	//@see parameters in {@link https://github.com/visionmedia/connect-redis#options}
	var store = new RedisStore({
		port: expRedisConfig.port,
		host: expRedisConfig.host,
		options: expRedisConfig.options,
		ttl: 86400,  //86400 = 1 day
		prefix: 'sess:'
	});

	Object.defineProperty(this, 'cookieParser', {
		configurable: false,
		enumerable: true,
		value: cookieParser,
		writable: false
	});

	Object.defineProperty(this, 'store', {
		configurable: false,
		enumerable: true,
		value: store,
		writable: false
	});


	// Cookies
	expressApp.use(cookieParser);

	// Session
	expressApp.use(express.session({
		key: this.sessionKey,
		store: store,
		cookie: {
			path: '/',
			httpOnly: true,
			maxAge: null
		}
	}));


	// Populate this session service with the properties and methods available post initialization

	// Return the user's roles used to identify the priviledge access to the events
	// The property is an array, with the name of the priviledge and it is sorted from more to less
	// access rights
	Object.defineProperty(this, 'userEventRoles', {
		configurable: false,
		enumerable: true,
		value: ['owner', 'manager', 'contributor', 'attendee'],
		writable: false
	});


	/** User's session data**/
	this.userLogIn = userLogIn;
	this.userLogOut = userLogOut;
	this.destroy = destroy;
	this.getAuthUser = getAuthUser;
	this.isUserAuthenticated = isUserAuthenticated;
	this.isHisDefaultPersona = isHisDefaultPersona;
	this.isCurrentlyUsingDefaultPersona = isCurrentlyUsingDefaultPersona;

	/** User's chat references **/
	this.registerChat = registerChat;
	this.getChat = getChat;
	this.isChatRegistered = isChatRegistered;

	/** Events' session data related with the user **/
		// Event session's data getters and setters
	this.getEvent = getEvent;
	this.getEvents = getEvents;
	this.getEventUserSettings = getEventUserSettings;
	this.getUserRoleEvent = getUserRoleEvent;
	this.addEventUserSettings = addEventUserSettings;

	// Event session's authenticators
	this.setEventOwner = setEventOwner;
	this.setEventManager = setEventManager;
	this.setEventContributor = setEventContributor;
	this.setEventAttendee = setEventAttendee;
	this.setEventAccessRequested = setEventAccessRequested;
	this.setEventAccessDenied = setEventAccessDenied;


	// Event access' checkers
	this.isUserAnEventAttendee = isUserAnEventAttendee;
	this.isUserAuthAccessEvent = isUserAuthAccessEvent;
	this.isUserAuthManageEvent = isUserAuthManageEvent;

	/** Sockets' session data related with the user **/
	this.setNamespaceSocketData = setNamespaceSocketData;
	this.getNamespaceSocketData = getNamespaceSocketData;
	this.setRoomSocketData = setRoomSocketData;
	this.getRoomSocketData = getRoomSocketData;

};


/**
 * Add to the session the object which hold an authorised user.
 *
 * In session is stored the user id and current persona id and each time that an user change to use
 * another persona, it should be registered the id in the session.
 *
 * The session also store the default persona id, to be able to access to it straight away.
 *
 * This method create a new session object not to reuse the session created when the user access to
 * the public pages and avoid "Session Fixations attack".
 *
 * @see {http://www.senchalabs.org/connect/session.html#session Connect#Session#regenerate()}
 *
 * @param {Object} sess Connect Session object
 * @param {Object} user User document (iWazat user model document). The user document must have
 *            the personas array.
 * @param {String | Object} [persona] The id of the persona which will be used as a current; it
 *      isn't provided the default persona will be used, taking from users.personas array. If
 *      an object is provided, then it must an ObjectId
 * @param {Function} callback
 */
var userLogIn = function (sess, user, persona, callback) {

	var sessPersona = null,
		defPersId,
		p;

	// Populate the persona id that the user is going to use at login time. The method is able to
	// populate this information in the next ways
	if ('function' === typeof persona) {
		callback = persona;
		persona = null;
	} else {
		if ('object' === typeof persona) {
			persona = persona.toString();
		}
	}

	for (p = 0; p < user.personas.length; p++) {

		if (persona) {
			if (persona === user.personas[p].id) {

				sessPersona = {
					id: user.personas[p].id
					//social_network_accounts: []
				};
			}
		} else {

			if (true === user.personas[p].is_default) {
				sessPersona = {
					id: user.personas[p].id,
					social_network_accounts: []
				};

				defPersId = user.personas[p].id;
			}

			break;
		}

		if (true === user.personas[p].is_default) {
			defPersId = user.personas[p].id;
		}
	}

	if (null === sessPersona) {
		callback(new Error('The user doesn\'t have a default persona or doesn\'t have any persona ' +
			'with the specified persona id to use as a current persona'));
		return;
	}


	// Regenerate the session to avoid Session Fixations attack
	// (http://en.wikipedia.org/wiki/Session_fixation)

	sess.regenerate(function (err) {

		if (err) {
			callback(err);
			return;
		}

		// Update our session reference to the new one which has been generated
		sess = sess.req.session;
		sess.user = {
			id: user.id,
			default_persona_id: defPersId,
			persona: sessPersona
		};

		callback(null);
	});

};

/**
 * User log out and session destroy.
 *
 * NOTE: this method doesn't guarantee destroy the session, only removing from it, all the data
 * related to an authenticated user
 *
 * @param {Object} sess Connect Session object
 * @param {Function} callback
 */
var userLogOut = function (sess, callback) {
	sess.destroy(callback);
};

/**
 * Completely destroys the session (all public and private data will be removed)
 *
 * @param {Object} sess Connect Session object
 * @param {Function} callback
 */
var destroy = function (sess, callback) {
	sess.destroy(callback);
};

/**
 * @return {Object} or null if the user is not authorized
 */
var getAuthUser = function (sess) {
	if (isUserAuthenticated(sess)) {
		return sess.user;
	} else {
		return null;
	}
};


/**
 *
 * @param  {Object} sess Connect Session object
 * @return {Boolean} True if user was authenticated, otherwise false
 */
var isUserAuthenticated = function (sess) {
	return ((sess.user) && (sess.user.id)) ? true : false;
};

var isHisDefaultPersona = function (sess, personaId) {
	return (sess.user.default_persona_id === personaId);
};

var isCurrentlyUsingDefaultPersona = function (sess) {
	return (sess.user.default_persona_id === sess.persona.id);
};

/**
 * Register or update the current message collection of the specified chat id
 *
 * @param  {Object} sess Connect Session object
 * @param {String} chatId The stringify version of the chat id
 * @param {String} currentCollectionNum The number (3 digit characters) of the current chat message
 *                collection
 */
var registerChat = function (sess, chatId, currentCollectionNum) {

	if (!sess.chats) {
		sess.chats = {};
	}

	sess.chats[chatId] = currentCollectionNum;
};

/**
 *
 * @param  {Object} sess Connect Session object
 * @param {String} chatId The stringify version of the chat id
 */
var getChat = function (sess, chatId) {
	return (sess.chats) ? sess.chats[chatId] : null;
};

/**
 *
 * @param  {Object} sess Connect Session object
 * @param {String} chatId The stringify version of the chat id
 */
var isChatRegistered = function (sess, chatId) {

	if ((sess.chats) && (sess.chats[chatId])) {
		return true;
	} else {
		return false;
	}
};

/**
 * Retrieve from the session an array which all event's data that holds
 *
 * @param {Object} sess Connect Session object
 * @return {Array} The object that contains event data and the user's relation with it if
 *          it exists, otherwise false.
 */
var getEvents = function (sess) {
	return (sess.events) ? sess.events : [];
};

/**
 * Retrieve from the session the object which contains the related event's data
 *
 * @param {Object} sess Connect Session object
 * @param {String} eventId The event's identifier
 * @return {Object | Boolean} The object that contains event data and the user's relation with it if
 *          it exists, otherwise false.
 */
var getEvent = function (sess, eventId) {

	if ((sess.events) && (sess.events[eventId])) {
		return sess.events[eventId];
	} else {
		return false;
	}
};

/**
 * Get the user's settings for the specified event.
 * NOTE: This method assume that the user has requested the authorization to the event before.
 *
 * @param sess
 * @param eventId
 * @param {String} [parameter] If not specified returns all the settings object, otherwise the
 *    value of that parameter. It is possible use the dot notation to access to sub attributes.
 * @return {*} The value or undefined if it doesn't exist
 */
var getEventUserSettings = function (sess, eventId, parameter) {

	if (parameter !== undefined) {
		return sess.events[eventId].user_settings;
	} else {
		return iWALibObj.getObjectPropValue(
			sess.events[eventId].user_settings,
			parameter,
			true
		);
	}
};

/**
 * Returns the user's role relate with the specified event. *
 *
 * @param {Object} sess Connect Session object
 * @param {String} eventId The event's identifier
 * @return {String | Null} Return the string that indentify the role if the user is allowed to
 *  access to the event, otherwise null
 */
var getUserRoleEvent = function (sess, eventId) {

	var sessEvent = getEvent(sess, eventId);

	if (sessEvent !== false) {
		if (sessEvent.user_relation.allowed === 'ok') {
			return sessEvent.user_relation.role;
		}
	}

	return null;
};

/**
 * Add settings to the user's settings for the specified event. If some of the provided settings
 * exists, then it will be overridden.
 * NOTE: This method assume that the user has requested the authorization to the event before.
 *
 * @param sess
 * @param eventId
 * @param settings
 */
var addEventUserSettings = function (sess, eventId, settings) {

	var eventSettings = sess.events[eventId].user_settings;
	var sparam;

	for (sparam in settings) {
		iWALibObj.addPropertyOrAppendValue(eventSettings, sparam, settings[sparam], true);
	}

};

/**
 * Register the event data and the user's relation with it
 *
 * NOTE: This is valid meanwhile we don't allow to change the event slug after it has been created
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} allowStatus Identifier's allowed status
 * @param {String} role Event user's role
 * @param {String} personaId The users personas id that the user is using in the event, this parameter
 *        is required if the user has access to the event, otherwise it will be ignored
 * @return {Object} The registered object
 */
var setEvent = function (sess, event, allowStatus, role, personaId) {

	if (!sess.events) {
		sess.events = {};
		sess.events[event.id] = {};
	} else {
		if (!sess.events[event.id]) {
			sess.events[event.id] = {};
		}
	}

	sess.events[event.id].event_info = {
		id: event.id,
		slug: event.slug
	};

	switch (allowStatus) {
		case 'ok':
			sess.events[event.id].event_info.timeline_collection = event.currentMessageCollection;
			sess.events[event.id].user_relation = {
				allowed: 'ok',
				role: role,
				persona_id: personaId
			};
			//sess.events[event.id].user_settings ---> This object will be used to store user's settings
			// related with this event, i.e. the timeline message collection selected.
			break;
		case 'requested':
			sess.events[event.id].user_relation = {
				allowed: 'requested',
				persona_id: personaId
			};
			break;
		default:
			sess.events[event.id].user_relation = {
				allowed: 'no'
			};
	}

	return sess.events[event.id];
};

/**
 * Register the event data and relate the user to it like owner
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} personaId The users personas id that the user is using in the event
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventOwner = function (sess, event, personaId) {
	return setEvent(sess, event, 'ok', 'owner', personaId);
};

/**
 * Register the event data and relate the user to it like manager
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} personaId The users personas id that the user is using in the event
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventManager = function (sess, event, personaId) {
	return setEvent(sess, event, 'ok', 'manager', personaId);
};

/**
 * Register the event data and relate the user to it like contributor
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} personaId The users personas id that the user is using in the event
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventContributor = function (sess, event, personaId) {
	return setEvent(sess, event, 'ok', 'contributor', personaId);
};

/**
 * Register the event data and relate the user to it like attendee
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} personaId The users personas id that the user is using in the event
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventAttendee = function (sess, event, personaId) {
	return setEvent(sess, event, 'ok', 'attendee', personaId);
};

/**
 * Register the event public data and relate the user to it like a requester to attend
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @param {String} personaId The users personas id that the use has used to request the access
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventAccessRequested = function (sess, event, personaId) {
	return setEvent(sess, event, 'requested', personaId);
};


/**
 * Register the event public data and relate the user to it like no authorized to access
 *
 * @param  {Object} sess Connect Session object
 * @param {Object} event Mongoose Event document
 * @return {Object} The registered object that contains event's data and the user's right on the
 *    specified event
 */
var setEventAccessDenied = function (sess, event) {
	return setEvent(sess, event, 'no');
};


/**
 * Check if the logged in user has been authorized to the specified event (Access to the event
 * is granted to attendee role or any with higher rights)
 *
 * @param {Object} sess Connect Session object
 * @param {String} eventId The event's identifier
 * @return {Boolean | Null} True if the user was authorized to the specified event, false if
 *    the access was denied for him and Null if the access' authorization has not been requested yet
 */
var isUserAuthAccessEvent = function (sess, eventId) {

	var sessEvent = getEvent(sess, eventId);

	if (sessEvent !== false) {
		return (sessEvent.user_relation.allowed === 'ok') ? true : false;
	}

	return null;
};

/**
 * Check if the logged in user has been authorized and is an event's attendee
 *
 * @param {Object} sess Connect Session object
 * @param {String} eventId The event's identifier
 * @return {Boolean | Null} True if the user was authorized to the specified event, false if
 *    the access was denied or he isn't an event's attendee and Null if the access' authorization
 *    has not been requested yet
 */
var isUserAnEventAttendee = function (sess, eventId) {

	var sessEvent = getEvent(sess, eventId);

	if (sessEvent !== false) {
		if ((sessEvent.user_relation.allowed === 'ok') &&
			(sessEvent.user_relation.role === 'attendee')) {
			return true;
		} else {
			return false;
		}
	}

	return null;
};

/**
 * Check if the logged in user has been authorized to manage the specified event
 *
 * @param {Object} sess Connect Session object
 * @param {String} eventId The event's identifier
 * @return {Boolean | Null} True if the user was authorized to the specified event, false if
 *    the access was denied for him and Null if the access' authorization has not been requested yet
 */
var isUserAuthManageEvent = function (sess, eventId) {

	var sessEvent = getEvent(sess, eventId);

	if (sessEvent !== false) {
		if (sessEvent.user_relation.allowed === 'ok') {
			switch (sessEvent.user_relation.role) {
				case 'onwer':
				case 'manager':
					return true;
				default:
					return false;
			}
		} else {
			return false;
		}
	}

	return null;
};


/**
 *  Set data related with the specified socket namespace
 *
 *  NOTE: This method reload the session before set the data into the session and after call
 *  save to avoid lose data set by common web request managed by connect; this two operations are
 *  executed because this method should be use into the callbacks function used in event's listeners
 *  of the sockets, so the request that they receive are not  processed by connect middlewares
 *
 * @param {Object} sess
 * @param {String} nsId
 * @param {Object} data
 * @param {Function} callback
 */
var setNamespaceSocketData = function (sess, nsId, data, callback) {

	sess.reload(function (err) {

		if (err) {
			if (callback) {
				callback(err);
			}
			return;
		}

		sess = sess.req.session;

		if (!sess.socketNamespaces) {
			sess.socketNamespaces = {}
		}
		sess.socketNamespaces[nsId] = data;
		sess.save(callback);
	});
};

/**
 * Get the session's data related with the specified socket namespace
 *
 * @param {Object} sess
 * @param {String} nsId
 * @param {Object} data
 */
var getNamespaceSocketData = function (sess, nsId, data) {

	if (sess.socketNamespaces) {
		return sess.socketNamespaces[nsId];
	} else {
		return null;
	}
};

/**
 *  Set data related with the specified socket namespace's room
 *
 *  NOTE: This method reload the session before set the data into the session and after call
 *  save to avoid lose data set by common web request managed by connect; this two operations are
 *  executed because this method should be use into the callbacks function used in event's listeners
 *  of the sockets, so the request that they receive are not  processed by connect middlewares
 *
 * @param {Object} sess
 * @param {String} nsId
 * @param {String} roomId
 * @param {Object} data
 * @param {Function} callback
 */
var setRoomSocketData = function (sess, nsId, roomId, data, callback) {

	sess.reload(function (err) {

		if (err) {
			if (callback) {
				callback(err);
			}
			return;
		}

		sess = sess.req.session;

		if (!sess.socketRooms) {
			sess.socketRooms = {}
		}

		if (sess.socketRooms[nsId]) {
			sess.socketRooms[nsId] = {};
		}

		sess.socketRooms[nsId][roomId] = data;
		sess.save(callback);
	});
};

/**
 * Get the session's data related with the specified socket namespace
 *
 * @param {Object} sess
 * @param {String} nsId
 * @param {String} roomId
 * @param {Object} data
 */
var getRoomSocketData = function (sess, nsId, roomId, data) {

	if (sess.socketNamespaces) {
		return sess.socketNamespaces[nsId];
	} else {
		return null;
	}
};