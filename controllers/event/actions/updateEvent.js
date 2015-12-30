'use strict';

/**
 * The action update the event details data.
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authenticated
 *    # user is authorised to modify the event's details data
 *    # req.processed must exist
 *    # req.processed object may have the next attributes
 *    {
 *      system: {
 *        language: Object with the related data about the specified language
 *      },
 *      event: {
 *      // Hold all the event data, especial fields are skills_suggestion and interests, which hold
 *      // the next structure
 *
 *        [skills_suggestions]: {
 *          [existing]: {Array} Existing keywords references
 *          [new]: {Array} Strings with the new words (words which aren't registered in any keyword)
 *        }
 *      }
 *    }
 *
 *    A new keyword is an object that has the next attributes (event.skills_suggestions.new):
 *    {
 *      word: The string with the word to add
 *      position: The number of the position of the word into the array created but the union of the
 *      new and existing keywords. So when the two arrays are merged and this array keeps the position
 *      of the existing array elements shifting those elements one position when one new keyword
 *        is requested in its position.
 *        For example:
 *          update: ['a', 'b', 'z']
 *          new: [ {word: 'y', position: 1}, {word: 'w', position: 2}]
 *
 *          result: ['a', 'y', 'w', 'b', 'z']
 *    }
 *
 *    An existing keyword is an object that has the next attributes (event.skills_suggestions.existing):
 *    {
 *      keyword_id: Keyword id
 *      word_id: Word id bound to the keyword
 *      lang: The language of the word is
 *    }
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

//utils
var httpGet = require('http-get');
var iwaUtilObj = require(settings.libsPath + '/iwazat/util/objects');
var screen = require('screener').screen;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');
var timelineStream = require(settings.servicesPath + '/iwazat/events/timeline');

// Datasources
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');

// Data models
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWAKeyword = require(settings.modelsPath + '/iwazat/keyword');

// Files
var path = require('path');
var fs = require('fs');

// Input validations and sanitizations
var sanitize = require('validator').sanitize;


/**
 * Globals
 */
var EventModel;
var KeywordModel;
var uploadedImgRegExp;
var extFileRegExp;

//Initialize the non straight away global variables
(function initialize() {

	EventModel = iWAMongo.model(iWAEvent);
	KeywordModel = iWAMongo.model(iWAKeyword);
	uploadedImgRegExp = /^data:image\/([a-z]{3,4});base64,/i;
	extFileRegExp = /\.([a-z]{3,4})$/i;

}());


/**
 *
 * The workflow is call all of this function, and each function call to processCollector function
 * which manages if finish the action in front of one error or calling the last operations,
 * updateEvent which executes the last operations that need to be executed in a row.
 *
 * Asynchronous operations (procOperations variable): the id of each asynchronous
 * process are:
 *  # computeTags:                   0x01
 *  # computeSkillSuggestions:       0x02
 *  # computeOrganiserAvatar:        0x04
 *
 * If some error happens in one of this function then the procOperations is -1 and the
 * processCollector function call response function and the error reported by the operation will
 * produce an error response.
 *
 * @param req
 * @param res
 * @param next
 * @param post
 */
module.exports = function (req, res, next, post) {

	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	var authUser = iWASession.getAuthUser(req.session);
	var eventData = req.processed.event;
	var procEvent = iwaUtilObj.clonePlainObject(eventData);
	var language = req.processed.system.language;
	var procOperations = 0x00;

	// Remove the event's ids because they're not updateble but they may exist because they were used
	// for some pre-middlewares
	delete procEvent.id;

// Operation ID: 0x01
	var computeTags = function () {
		var counter = 0;
		var tags = [];

		if (!eventData.tags) {
			procOperations |= 0x01;
			processCollector();
			return;
		}

		if ((eventData.tags.new) && (0 < eventData.tags.new.length)) {

			eventData.tags.new.forEach(function (newWord) {
				counter++;

				KeywordModel.getKeywords(newWord.word, language.abbreviation, function (err, keyword) {
					if (0 > procOperations) {
						return;
					}

					if (err) {
						helperGlobal.addError(req, new iWAErrors.Db(
							'Controller: event # Action: updateEvent | Error to create the new keywords specified ' +
								'like tags', 524, err), 524);
						procOperations = -1;
						processCollector();
						return;
					}

					if (keyword) {
						tags[newWord.position] = keyword;
					}

					counter--;
					if (0 === counter) {
						if ((eventData.tags.existing) &&
							(0 < eventData.tags.existing.length)) {

							KeywordModel.countFromKeywordsRefs(eventData.tags.existing,
								language.abbreviation,
								function (err, numKeywords) {
									if (0 > procOperations) {
										return;
									}

									if (err) {
										helperGlobal.addError(req, new iWAErrors.Db(
											'Controller: event # action updateEvent | Error to count the existing keywords' +
												' specified like tags', 524, err), 524);

										procOperations = -1;
										processCollector();
										return;
									}

									if (numKeywords !== eventData.tags.existing.length) {
										helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
											'Action: updateEvent | Nonexistent keyword references', 602, req,
											eventData.tags.existing), 602);

										procOperations = -1;
										processCollector();
										return;
									} else {

										eventData.tags.existing.forEach(function (kWord) {
											do {
												if (tags[counter] === undefined) {
													tags[counter] = kWord;
													kWord = false;
												}
												counter++;
											} while (false !== kWord);
										});


										procEvent.tags =
											iWAKeyword.unifyWords(tags, language.abbreviation);

										procOperations |= 0x01;
										processCollector();
									}
								}); // End check existing keyword references and putting all together
						} else {
							if (tags.length > eventData.tags.new.length) {
								helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
									'Action: updateEvent | The specified new keywords array for tags specifies ' +
									'positions  out of the expected array length', 603, req, tags), 603);

								procOperations = -1;
								processCollector();
								return;
							}

							procEvent.tags =
								iWAKeyword.unifyWords(tags, language.abbreviation);

							procOperations |= 0x01;
							processCollector();
						} // End non-specified existing keywords
					}
				}); // End create new keywords
			});
		} else if ((eventData.tags.existing) &&
			(0 < eventData.tags.existing.length)) {

			// there isn't new keywords
			KeywordModel.countFromKeywordsRefs(eventData.tags.existing,
				language.abbreviation,
				function (err, numKeywords) {
					if (0 > procOperations) {
						return;
					}

					if (numKeywords !== eventData.tags.existing.length) {
						helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
							'Action: updateEvent | Nonexistent keyword references', 602, req,
							eventData.tags.existing), 602);

						procOperations = -1;
						processCollector();
						return;
					} else {
						procEvent.tags =
							iWAKeyword.unifyWords(eventData.tags.existing, language.abbreviation);

						procOperations |= 0x01;
						processCollector();
					}
				}); // End count keyword references
		} else {
			procOperations |= 0x01;
			// Avoid that a wrong tags object be pushed to the database
			delete procEvent.tags;
			processCollector();
		}
	}; // End function skills suggestions computation

	// Operation ID: 0x02
	var computeSkillSuggestions = function computeSkillsSuggestions() {
		var counter = 0;
		var skillSuggestions = [];

		if (!eventData.skills_suggestions) {
			procOperations |= 0x02;
			processCollector();
			return;
		}

		if ((eventData.skills_suggestions.new) && (0 < eventData.skills_suggestions.new.length)) {

			eventData.skills_suggestions.new.forEach(function (newWord) {
				counter++;

				KeywordModel.getKeywords(newWord.word, language.abbreviation, function (err, keyword) {
					if (0 > procOperations) {
						return;
					}

					if (err) {
						helperGlobal.addError(req, new iWAErrors.Db(
							'Controller: event # action updateEvent | Error to create the new keywords ',
							'specified like skills suggestion', 524, err), 524);
						procOperations = -1;
						processCollector();
						return;
					}

					if (keyword) {
						skillSuggestions[newWord.position] = keyword;
					}

					counter--;
					if (0 === counter) {
						if ((eventData.skills_suggestions.existing) &&
							(0 < eventData.skills_suggestions.existing.length)) {

							KeywordModel.countFromKeywordsRefs(eventData.skills_suggestions.existing,
								language.abbreviation,
								function (err, numKeywords) {
									if (0 > procOperations) {
										return;
									}

									if (err) {
										helperGlobal.addError(req, new iWAErrors.Db(
											'Controller: event # action updateEvent | Error to count the ' +
												'existing keywords specified like skills suggestion', 524, err), 524);

										procOperations = -1;
										processCollector();
										return;
									}

									if (numKeywords !== eventData.skills_suggestions.existing.length) {
										helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
											'Action: updateEvent | Nonexistent keyword references', 602, req,
											eventData.skills_suggestions.existing), 602);

										procOperations = -1;
										processCollector();
										return;
									} else {

										eventData.skills_suggestions.existing.forEach(function (kWord) {
											do {
												if (skillSuggestions[counter] === undefined) {
													skillSuggestions[counter] = kWord;
													kWord = false;
												}
												counter++;
											} while (false !== kWord);
										});


										procEvent.skills_suggestions =
											iWAKeyword.unifyWords(skillSuggestions, language.abbreviation);

										procOperations |= 0x02;
										processCollector();
									}
								}); // End check existing keyword references and putting all together
						} else {
							if (skillSuggestions.length > eventData.skills_suggestions.new.length) {
								helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
									'Action: updateEvent | The specified new keywords array for skills suggestions ' +
									'specifies positions out of the expected array length', 603, req,
									skillSuggestions), 603);

								procOperations = -1;
								processCollector();
								return;
							}

							procEvent.skills_suggestions =
								iWAKeyword.unifyWords(skillSuggestions, language.abbreviation);

							procOperations |= 0x02;
							processCollector();
						} // End non-specified existing keywords
					}
				}); // End create new keywords
			});
		} else if ((eventData.skills_suggestions.existing) &&
			(0 < eventData.skills_suggestions.existing.length)) {

			// there isn't new keywords
			KeywordModel.countFromKeywordsRefs(eventData.skills_suggestions.existing,
				language.abbreviation,
				function (err, numKeywords) {
					if (0 > procOperations) {
						return;
					}

					if (numKeywords !== eventData.skills_suggestions.existing.length) {
						helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # ' +
							'Action: updateEvent | Nonexistent keyword references', 602, req,
							eventData.skills_suggestions.existing), 602);

						procOperations = -1;
						processCollector();
						return;
					} else {
						procEvent.skills_suggestions =
							iWAKeyword.unifyWords(eventData.skills_suggestions.existing, language.abbreviation);

						procOperations |= 0x02;
						processCollector();
					}
				}); // End count keyword references
		} else {
			procOperations |= 0x02;
			processCollector();
		}
	}; // End function skills suggestions computation

	// Operation ID: 0x04
	var computeOrganiserAvatar = function computeOrganiserAvatar(eventDoc) {
		var writableStream;
		var imgFileExt;
		var tmpFileName;

		if ((procEvent.organiser_details) && (procEvent.organiser_details.avatar) &&
			('owner' !== procEvent.organiser_details.avatar)) {

			if (uploadedImgRegExp.test(procEvent.organiser_details.avatar)) {
				imgFileExt = procEvent.organiser_details.avatar.match(uploadedImgRegExp);
				imgFileExt = imgFileExt[1];

				procEvent.organiser_details.avatar =
					procEvent.organiser_details.avatar.replace(uploadedImgRegExp, '');
				procEvent.organiser_details.avatar = procEvent.organiser_details.avatar.replace(' ', '+');
				tmpFileName = path.join(settings.directories.temp.images,
					'organiser_avatar_' + authUser.id + Date.now() + '.' + imgFileExt);

				writableStream = fs.createWriteStream(tmpFileName, {
					flags: 'w',
					encoding: 'base64',
					mode: '0666'
				});


				writableStream.end(sanitize(procEvent.organiser_details.avatar).xss(true), 'base64',
					function (err) {
						if (0 > procOperations) {
							return;
						}

						if (err) {
							helperGlobal.addError(req, new iWAErrors.UnderlyingSystem('Controller: event # ' +
								'Action: updateEvent | Fail to create the temporary file of uploaded organiser avatar image',
								532, err), 532);
							procOperations = -1;
							processCollector();
						} else {
							procOperations |= 0x04;
							procEvent.organiser_details.avatar = tmpFileName;
							processCollector();
						}
					});
			} else {

				imgFileExt = procEvent.organiser_details.avatar.match(extFileRegExp);

				if (null !== imgFileExt) {
					imgFileExt = imgFileExt[1];
					tmpFileName = path.join(settings.directories.temp.images, 'organiser_avatar_' +
						authUser.id + Date.now() + '.' + imgFileExt);
				} else {
					tmpFileName = path.join(settings.directories.temp.images, 'organiser_avatar_' +
						authUser.id + Date.now());
				}

				httpGet.get(procEvent.organiser_details.avatar, tmpFileName, function (err, result) {
					if (0 > procOperations) {
						return;
					}

					if (err) {
						helperGlobal.addError(req, new iWAErrors.UnderlyingSystem('Controller: event # ' +
							'Action: updateEvent | Failed to download the organiser avatar image file', 533,
							err),
							533);
						procOperations = -1;
						processCollector();
					} else {
						procEvent.organiser_details.avatar = result.file;
						procOperations |= 0x04;
						processCollector();
					}
				});
			}// End uploaded or external reference image


		} else {
			// No organiser's avatar updated or the new one is the same owner's avatar
			procOperations |= 0x04;
			processCollector();
		}
	};

	// Create the event document (mongoose document)
	var updateEvent = function updateEvent(eventDoc, procEvent) {

		var uploadedOrgAvatarImg;

		var saveDocFn = function saveDocFn(eventDoc, procEvent) {
			var p;
			var timelineOperation = null;


			if ('open' === procEvent.timeline_status) {
				if ('open' === eventDoc.timeline_status) {

					p = iwaUtilObj.getObjectPropValue(procEvent, 'social_accounts.twitter.hashtags', true);

					if (p) {
						timelineOperation = 'updateTwitterFilter';
					} else {
						p = iwaUtilObj.getObjectPropValue(procEvent, 'social_accounts.twitter.mentions', true);

						if (p) {
							timelineOperation = 'updateTwitterFilter';
						}
					}
				} else {
					timelineOperation = 'open';
				}
			} else {
				// If the value is another than close it was hacked, so it is forced to 'close', in
				// the time being there is only two timeline status available
				timelineOperation = procEvent.timeline_status = 'close';
			}

			iwaUtilObj.updateMongooseDoc(eventDoc, procEvent);


			eventDoc.save(function (err, updatedEventDoc) {
				if (err) {
					helperGlobal.addError(req, new iWAErrors.Db(
						'Controller: event # action updateEvent | Error saving new event', 521, err), 521);
					sendResponse(req, res, post);
					return;
				}

				if (timelineOperation) {
					timelineStream[timelineOperation](updatedEventDoc);
				}

				sendResponse(req, res, post, updatedEventDoc.toObject());
			});

		};


		if ((procEvent.organiser_details) && (procEvent.organiser_details.avatar)) {
			if ('owner' !== procEvent.organiser_details.avatar) {
				uploadedOrgAvatarImg = procEvent.organiser_details.avatar;

				eventDoc.attach('organiser_avatar', {
					path: uploadedOrgAvatarImg
				}, function (err) {

					if (err) {
						helperGlobal.addError(req, new iWAErrors.UnderlyingSystem('Controller: event # ' +
							'Action: updateEvent | Fail to create the organiser avatar images collection // ' +
							'Mongoose-attachments', 533, err), 533);
						sendResponse(req, res, post);
					} else {

						if (!eventDoc.organiser_details) {
							eventDoc.organiser_details = {};
						}

						procEvent.organiser_details.avatar = eventDoc.organiser_avatar.original.defaultUrl;
						eventDoc.organiser_avatar = undefined;
						saveDocFn(eventDoc, procEvent);
					}

					cleanTempFiles(uploadedOrgAvatarImg);
				});

				return;

			} else {
				// The event organiser avatar has been update but the user want to use the owner's avatar
				// (User's avatar who owns the event)
				procEvent.organiser_details.avatar = null;
			}
		} else {
			uploadedOrgAvatarImg = false;
		}


		saveDocFn(eventDoc, procEvent);
	};

	var cleanTempFiles = function cleanTempFiles(mainFileFullPath, fileSufixList) {

		var extension = path.extname(mainFileFullPath);
		var dirPath = path.dirname(mainFileFullPath);
		var baseName = path.basename(mainFileFullPath, extension);


		fs.unlink(mainFileFullPath, function (err) {
			//TODO report into logs but the error don't affect to the system and user
		});


		if (Array.isArray(fileSufixList)) {
			fileSufixList.forEach(function (sufix) {
				fs.unlink(path.join(dirPath, baseName) + '-' + sufix + extension, function (err) {
					//TODO report into logs but the error don't affect to the system and user
				});
			});
		}
	};


// Manage the calls to the function that process the event data to create the new Event
	var processCollector = function processCollector() {

		if (0 > procOperations) {
			sendResponse(req, res, post);
			return;
		}

		if (0x07 === procOperations) {
			updateEvent(eventDoc, procEvent);
			return;
		}
	};

	var eventDoc;

	EventModel.findById(req.processed.event.id,
		function (err, event) {

			if (err) {
				helperGlobal.addError(req, new iWAErrors.Db(
					'Controller: event # action updateEvent | Error when retrieving the data form the ' +
						'event with id: ' + req.processed.event._id, 520, err), 520);
				sendResponse(req, res, post);
				return;
			}

			if (event) {
				eventDoc = event;
				// Operations calls
				computeTags();
				computeSkillSuggestions();
				computeOrganiserAvatar(eventDoc);

			} else {

				helperGlobal.addError(req, new iWAErrors.HttpRequest('No event with id: ' +
					req.processed.event._id, 400, req));
				sendResponse(req, res, post);
			}
		});


};

function sendResponse(req, res, post, eventData) {
	// is there errors the helper will send the response
	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	res.json(200, eventData);

	post(null, req, res);
}