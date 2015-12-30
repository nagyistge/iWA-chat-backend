'use strict';

var settings = require('../../../../settings');

/**
 * Constants
 */
var PREFIX_ID_LOG = 'twitter-manufacturer: ';

/**
 * Dependencies
 */
var inspect = require('util').inspect;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWATimelineMsg = require(settings.modelsPath + '/iwazat/timelineMessage');
//Models Helpers
var createUserFromSNWK = require(settings.modelsPath + '/iwazat/helpers/createUserFromSNWK');
// Redis tracker
var iwaTracker = require('./tracker');
// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');


/**
 * Globals
 */
// Loggers
var streamLogger;
// Models
var UserModel;
var EventModel;
var filterChains = require('./filters/iWazatFiltersChains');

//Initialize the non-straight away global variables
(function initialize() {
	streamLogger = require(settings.sysPath + '/tools/iwaLogger').getWinstonLogger('eventsStream');
	UserModel = iWAMongo.model(iWAUser);
	EventModel = iWAMongo.model(iWAEvent);
}());


/**
 *
 * NOTE: This method doesn't check the number and type of the parameters to increase the performance
 *  so the caller must ensure to provide the right number of parameters and types
 *
 * @param {Array} eventsRefObjs Objects that hold the events' reference to store the tweet.
 *    The objects have this attributes:
 *      {
 *        id: EventId,
 *        msgColNum: The message collection number where the tweet will be stored
 *        tweetEventRef: The raw reference that the receiver received attached to the tweet
 *      }
 * @param {Object} collectedTweet
 * @param {Function} callback A node convention callback, where the second parameter is an array
 *  of objects with the next properties:
 *  {
 *    id: The stringify version of an event Id
 *    msgColNum: The stringify version of event timeline message collection number
 *    tweetEventRef: The original event reference received attached with the received tweet
 *    tweetView: the iWazat tweet view representation object
 *  }
 *
 *  NOTE: an error may exist but the result array may have some results as well, because the
 *    error may exist only for some of the events that the tweet has been processed but not in all
 *    of them
 *
 */
module.exports = function (eventsRefObjs, collectedTweet, callback) {

	function getManufactrerCollector() {
		var errors = [];
		var processedTweets = [];
		var counter = eventsRefObjs.length;

		function done() {

			if (processedTweets.length === 0) {
				processedTweets = null;
			}

			if (counter === 0) {
				switch (errors.length) {
					case 0:
						callback(null, processedTweets);
						break;
					case 1:
						if (eventsRefObjs.length === 1) {
							callback(errors[0], null);
						} else {
							callback(errors[0], processedTweets);
						}

						break;
					default:
						if (eventsRefObjs.length === errors.length) {
							callback(new Error(PREFIX_ID_LOG + 'Multiple errors: ' + inspect(errors)),
								null);
						} else {
							callback(new Error(PREFIX_ID_LOG + 'Multiple errors: ' + inspect(errors)),
								processedTweets);
						}
				}
			} // End finish process and return the result to the callback
		}

		return function (eventRefObj, trackedUser, processedTweet) {

			if (processedTweet === null) {
				counter--;
				done();

			} else {
				storeTweet(
					iWAEvent.resolveMessageCollectionName(eventRefObj.id, eventRefObj.msgColNum),
					processedTweet,
					trackedUser,
					function (err, iwaTweetMsgDoc) {

						counter--;

						if (err) {
							errors.push(new Error(PREFIX_ID_LOG +
								'Error when storing a tweet into DB. Event Id: ' +
								eventRefObj.id + ', message collection num: ' + eventRefObj.msgColNum + '. Error ' +
								'details: ' + err.msg));
						} else {
							processedTweets.push({
								id: eventRefObj.id,
								msgColNum: eventRefObj.msgColNum,
								tweetEventRef: eventRefObj.tweetEventRef,
								tweetView: tmMessagesView.tweetMessageView(iwaTweetMsgDoc, trackedUser.view)
							});
						}

						done();
					});
			}
		}; //End done function;
	} // End getDone function


	var userTwitterId = collectedTweet.from.source_id;
	var manufacturerCollector = getManufactrerCollector();

	eventsRefObjs.forEach(function (eventRefObj) {

		filterChains.filterByEventTimeline(eventRefObj.id, eventRefObj.msgColNum, collectedTweet,
			function (err, filteredTweet) {

				if (err) {
					callback(new Error(PREFIX_ID_LOG + 'Error from event timeline filters chain. Error: ' +
						err));
					return;
				}

				if (!filteredTweet) {
					return;
				}

				iwaTracker.retrieveEventUser(eventRefObj.id, userTwitterId, function (err, trackedUser) {

					if ((err) || (!trackedUser)) {
						// Ignore the error because tracker report the error into a log
						eventUserInfoFromTweet(eventRefObj.id, filteredTweet.source.raw.user,
							function (err, trackedUser) {
								if (err) {
									callback(new Error(PREFIX_ID_LOG + 'Error processing the twitter owner. Error: ' +
										err));
									return;
								}

								manufacturerCollector(eventRefObj, trackedUser, filteredTweet);
							});

					} else {
						manufacturerCollector(eventRefObj, trackedUser, filteredTweet);
					}
				});
			});
	}); // End events' reference iteration
};


function storeTweet(messageColName, processedTweet, trackedUser, callback) {

	var MsgTimelineModel = iWAMongo.model(iWATimelineMsg,
		iWATimelineMsg.mongooseModelOptions(messageColName));

	MsgTimelineModel.createTweet(processedTweet, trackedUser.actor._id, trackedUser.actor.persona,
		function (err, iwaTweetMsgDoc) {

			if (err) {
				callback(err);
				return;
			}

			callback(null, iwaTweetMsgDoc);
		});
};

/**
 * Wrapper to chain the two calls to the functions getUser, eventUserRole and track the user
 * (tracker#trackEventUser)
 *
 * @param eventId
 * @param twitterUserProfile
 * @param callback
 */
function eventUserInfoFromTweet(eventId, twitterUserProfile, callback) {

	getUser(twitterUserProfile.id, function (err, user) {

		if (err) {
			// Ignore the error, that method already logged it
			callback(err, null);
			return;
		}

		if (!user) {

			createUserFromSNWK(
				'unregistered',
				'twitter',
				twitterUserProfile,
				function (err, user) {

					if (err) {
						callback(err);
						return;
					}

					if (!user) {
						callback(new Error(PREFIX_ID_LOG + 'The function that creates new users from user ' +
							'twitter profile, doesn\'t return any user'));
						return
					}

					user.events_externally_interacted.push(eventId);

					user.save(function (err, updatedUser) {

						if (err) {
							callback(new Error(PREFIX_ID_LOG + 'Error when saving the user document after set ' +
								'the event into the user\'s field: events_externally_interacted. User id: ' +
								user.id + ' / ' + 'event id: ' + eventId + ' || MongoDB err: ' + err));
							return;
						}

						callback(null,
							iwaTracker.trackEventUser(eventId, twitterUserProfile.id, updatedUser, 'twitter'));
					});
				});

			return;
		}

		// TODO rethink what do of each different user's account status
		switch (user.account_status) {
			case 'unregistered':

				user.events_externally_interacted.addToSet(eventId);

				user.save(function (err, updatedUser) {

					if (err) {
						callback(new Error(PREFIX_ID_LOG + 'Error when saving the user document after set ' +
							'the event into the user\'s field: events_externally_interacted. User id: ' +
							user.id + ' / ' + 'event id: ' + eventId + ' || MongoDB err: ' + err));
						return;
					}

					callback(null,
						iwaTracker.trackEventUser(eventId, twitterUserProfile.id, updatedUser, 'twitter'));
				});
				break;
			case 'active':
			case 'initial':
			case 'unconfirmed':
			case 'disabled':
			case 'blocked':
			default:
				eventUserInfo(eventId, user, twitterUserProfile.id, function (err, trackedUser) {
					if (err) {
						callback(err);
						return;
					}

					if (trackedUser) {
						callback(null, trackedUser);
					} else {
						callback(null, null);
					}

				});
		}
	});
}


function eventUserInfo(eventId, user, userTwitterId, callback) {

	var userId = user.id;


	function getPersona(personaId) {
		var pn;
		var personas = user.personas;

		for (pn = 0; pn < personas.length; pn++) {
			if (personas[pn].id === personaId) {
				return personas[pn];
			}
		}
	}

	EventModel.findById(eventId,
		{
			access: true,
			owner: true,
			managers: {$elemMatch: {_id: userId}},
			contributors: {$elemMatch: {_id: userId}},
			guests: {$elemMatch: {_id: userId}},
			unaccepted: {$elemMatch: {_id: userId}},
			participants: {$elemMatch: {_id: userId}}
		},
		{
			lean: true
		},
		function (err, event) {

			var persona;
			var userRole;
			var pn;

			if (err) {
				streamLogger.warn(PREFIX_ID_LOG + 'timeline#twitter#parser | Error retrieving event from ' +
					'database to identify a user\'s role. Error: ' + err);
				callback(err, null);
				return;
			}

			if (!event) {
				callback(null, null);
				return;
			}

			if (event.owner._id.toString() === userId) {

				// We need to put the selected persona in the 0 position because the ownerView method
				// use that persona to create the user view object
				user.personas[0] = getPersona(event.owner.persona.toString());
				callback(null, iwaTracker.trackEventUser(eventId, userTwitterId, user, 'owner'));
				return;

			} else if (event.managers) {

				// We need to put the selected persona in the 0 position because the ownerView method
				// use that persona to create the user view object
				user.personas[0] = getPersona(event.managers[0].persona.toString());
				callback(null, iwaTracker.trackEventUser(eventId, userTwitterId, user, 'manager'));
				return;

			} else if (event.contributors) {

				// We need to put the selected persona in the 0 position because the ownerView method
				// use that persona to create the user view object
				user.personas[0] = getPersona(event.contributors[0].persona.toString());
				callback(null, iwaTracker.trackEventUser(eventId, userTwitterId, user, 'contributor'));
				return;

			} else if (event.participants) {

				// We need to put the selected persona in the 0 position because the ownerView method
				// use that persona to create the user view object
				user.personas[0] = getPersona(event.participants[0].persona.toString());
				callback(iwaTracker.trackEventUser(eventId, userTwitterId, user, 'participant'));
				return;

			} else if (event.unaccepted) {

				// TODO #19
				userRole = 'unaccepted';
				persona = getPersona(event.unaccepted[0].persona.toString());

			} else if (event.requesters) {

				// TODO #19
				userRole = 'requester';
				persona = getPersona(event.requesters[0].persona.toString());

			} else if (event.guests) {

				// TODO #19
				userRole = 'guest';
				persona = getPersona(event.guests[0].persona.toString());

			} else {
				// TODO #19
				userRole = 'iWazat';
				persona = user.personas;

				for (pn = 0; pn < persona.length; pn++) {
					if (persona[pn].is_default === true) {
						// We need to put the selected persona in the 0 position because the ownerView method
						// use that persona to create the user view object
						persona = persona[pn];
						break;
					}
				}
			}

			// The next operations only must be performed if the user is not in any event's list that
			// allows him to access to the event, so if he is into one, we exit the function before

			user.events_externally_interacted.addToSet(eventId);

			user.save(function (err, user) {

				if (err) {
					callback(new Error(PREFIX_ID_LOG + 'Error when saving the user document after set the ' +
						'event into the user\'s field: events_externally_interacted. User id: ' +
						user.id + ' / ' + 'event id: ' + eventId));
					return;
				}

				// We need to put the selected persona in the 0 position because the ownerView method
				// use that persona to create the user view object
				user.personas[0] = persona;
				callback(null, iwaTracker.trackEventUser(eventId, userTwitterId, user, userRole));
			});


		});
}


function getUser(userTwitterId, callback) {

	UserModel.findOne({
		'social_network_accounts.type': 'Twitter',
		'social_network_accounts.account_id': userTwitterId
	}, {
		_id: true,
		account_status: true,
		social_network_accounts: true,
		avatars: true,
		events_externally_interacted: true,
		personas: true
	}, function (err, user) {

		if (err) {
			streamLogger.warn(PREFIX_ID_LOG + 'timeline#twitter#parser | Error retrieving use from ' +
				'database to identify a new tweet. Error: ' + err);
		}

		callback(err, user);
	});
}
