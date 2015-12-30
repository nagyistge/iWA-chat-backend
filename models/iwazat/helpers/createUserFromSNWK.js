'use strict';


module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// System
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Utils
var util = require('util');
var iWAUtilObj = require(settings.libsPath + '/iwazat/util/objects');

//Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWAKeyword = require(settings.modelsPath + '/iwazat/keyword');

/**
 * Globals
 */
var userRegLogger;

// Models
var UserModel;
var KeywordModel;

// Constant Regular Expressions
var websiteProtocol;

//Initialize the non straight away global variables
(function initialize() {

	userRegLogger = iwaLogger.getWinstonLogger('userRegistrations');
	UserModel = iWAMongo.model(iWAUser);
	KeywordModel = iWAMongo.model(iWAKeyword);
	websiteProtocol = /^https?:\/\//;

}());


/**
 *  Create a new user if the user that is logging in does not exist
 */
module.exports = function (accountStatus, socialNetwork, profileObj, authObj, callback) {



	// Auxiliar variables
	var user;
	var persona;
	var sNwAccStatus;
	var pName;
	var pBirthDate;
	var pSocialNwAccounts;
	var pSocialNwAccountsIdx;
	var pCompany;
	var pSkillsHave;
	var pImAccountType;
	var aux;
	//var pBoundAccType;

	if ('function' === typeof authObj) {
		callback = authObj;
		authObj = {};
	}

	if ((accountStatus === 'initial') || (accountStatus === 'active')) {
		sNwAccStatus = 'authenticated';
	} else {
		sNwAccStatus = 'unauthenticated';
	}


	socialNetwork = socialNetwork.toLowerCase();

	try {
		switch (socialNetwork) {

			case 'google':

				user = {
					account_status: accountStatus,
					social_network_accounts: [
						{
							type: 'Google',
							account_id: profileObj.id,
							account_name: profileObj.name,
							profile_url: 'https://profiles.google.com/' + profileObj.id,
							status: sNwAccStatus,
							account_auth: authObj,
							account_profile: [ profileObj ]
						}
					],
					emails: [
						{
							address: profileObj.email,
							verified: profileObj.verified_email,
							is_default: true
						}
					]
				};


				if (profileObj.gender) {
					user.gender = profileObj.gender;
				}

				if (profileObj.birthday) {
					user.birth_date = profileObj.birthday;
				}

				persona = {
					is_default: true,
					nickname: profileObj.name,
					name: profileObj.given_name,
					surname: profileObj.family_name
				};

				if (profileObj.link) {
					if (!websiteProtocol.test(profileObj.link)) {
						persona.website = 'http://' + profileObj.link;
					} else {
						persona.website = profileObj.link;
					}
				}

				if (profileObj.picture) {
					user.avatars = [
						{
							url: profileObj.picture
						}
					];
				}

				if (profileObj.locale) {
					persona.languages = [profileObj.locale];
				}

				user.personas = [persona];
				break;

			case 'facebook':


				user = {
					account_status: accountStatus,
					birth_date: profileObj.birthday,
					gender: profileObj.gender,
					avatars: [
						{
							url: 'http://graph.facebook.com/' + profileObj.id + '/picture'
						}
					],
					social_network_accounts: [
						{
							type: 'Facebook',
							account_id: profileObj.id,
							account_name: profileObj.username,
							profile_url: 'https://www.facebook.com/' + profileObj.username,
							status: sNwAccStatus,
							account_auth: authObj,
							account_profile: [ profileObj ]
						}
					],
					emails: [
						{
							address: profileObj.email,
							verified: true,
							is_default: true
						}
					]
				};

				persona = {
					is_default: true,
					nickname: profileObj.name,
					name: profileObj.first_name,
					surname: profileObj.last_name
				};

				if (profileObj.website) {
					if (!websiteProtocol.test(profileObj.website)) {
						persona.website = 'http://' + profileObj.website;
					} else {
						persona.website = profileObj.website;
					}
				}

				if (profileObj.hometown) {
					persona.location = profileObj.hometown;
				}

				if (profileObj.locale) {
					persona.languages = [profileObj.locale]
				}

				if ((profileObj.work) && (profileObj.work.length > 0)) {
					persona.companies = [];

					profileObj.work.forEach(function (val) {
						persona.companies.push({
							name: val.employer.name,
							position: val.position.name,
							start_date: val.start_date,
							end_date: val.end_date,
							location: val.location.name
						});
					});
				}

				user.personas = [persona];
				break;

			case 'twitter':

				user = {
					account_status: accountStatus,
					avatars: [
						{
							url: profileObj.profile_image_url
						}
					],
					social_network_accounts: [
						{
							type: 'Twitter',
							account_id: profileObj.id_str,
							account_name: profileObj.screen_name,
							profile_url: 'https://twitter.com/' + profileObj.screen_name,
							status: sNwAccStatus,
							account_auth: authObj,
							account_profile: [ profileObj ]
						}
					]};

				if (profileObj.gender) {
					user.gender = profileObj.gender;
				}

				persona = {
					is_default: true,
					nickname: profileObj.screen_name,
					languages: [ profileObj.lang ],
					location: profileObj.location,
					bio: profileObj.description
				};


				pName = profileObj.name.split(' ');

				switch (pName.length) {
					case 0:
						persona.name = profileObj.screen_name;
						break;
					case 1:
						persona.name = pName[0];
						break;
					case 2:
						persona.name = pName[0];
						persona.surname = pName[1];
						break;
					default:
						persona.surname = pName.pop();
						persona.name = pName.join(' ');

				}


				if (profileObj.url) {
					if (!websiteProtocol.test(profileObj.url)) {
						persona.website = 'http://' + profileObj.url;
					} else {
						persona.website = profileObj.url;
					}
				}


				user.personas = [persona];
				break;

			case 'linkedin':

				user = {
					account_status: accountStatus,
					avatars: [
						{
							url: profileObj.pictureUrl
						}
					]
				};

				persona = {
					is_default: true,
					nickname: profileObj.formattedName,
					name: profileObj.firstName,
					surname: profileObj.lastName,
					bio: profileObj.summary,
					social_network_accounts: []
				};


				pBirthDate = {};
				aux = 0;


				if (profileObj.dateOfBirth) {

					if (profileObj.dateOfBirth.year !== undefined) {
						pBirthDate.year = profileObj.dateOfBirth.year;
						aux++;
					} else {
						pBirthDate.year = 0;
					}

					if (profileObj.dateOfBirth.month !== undefined) {
						pBirthDate.month = profileObj.dateOfBirth.month - 1;
						aux++;
					} else {
						pBirthDate.month = 0;
					}

					if (profileObj.dateOfBirth.day !== undefined) {
						pBirthDate.day = profileObj.dateOfBirth.day;
						aux++;
					} else {
						pBirthDate.day = 0;
					}

					if (aux > 0) {
						user.birth_date = new Date(pBirthDate.year, pBirthDate.month, pBirthDate.day);
					}
				}


				pSocialNwAccounts = [
					{
						type: 'LinkedIn',
						account_id: profileObj.id,
						account_name: profileObj.formattedName,
						profile_url: profileObj.publicProfileUrl,
						status: sNwAccStatus,
						account_auth: authObj,
						account_profile: [ profileObj ]
					}
				];

				// Index the account to avoid adding two times is it is added in another LinkedIn json
				// profile object's attribute
				pSocialNwAccountsIdx = {
					LinkedIn: {}
				};
				pSocialNwAccountsIdx.LinkedIn[profileObj.id] = true;

				if (profileObj.emailAddress) {
					user.emails = [
						{
							address: profileObj.emailAddress,
							verified: true,
							is_default: true
						}
					];
				}

				if ((profileObj.imAccounts) && (profileObj.imAccounts._total > 0)) {
					persona.im_accounts = [];

					profileObj.imAccounts.values.forEach(function (val) {

						//enum: [ 'AIM', 'Skype', 'Yahoo! messenger', 'GTalk', 'ICQ' ],
						switch (val.imAccountType) {
							case 'aim':
								pImAccountType = 'AIM';
								break;
							case 'gtalk':
								pImAccountType = 'GTalk';
								break;
							case 'icq':
								pImAccountType = 'ICQ';
								break;
							case 'skype':
							case 'msn':
								pImAccountType = 'Skype';
								break;
							case 'yahoo':
								pImAccountType = 'Yahoo! messenger';
							default:
								return;
						}

						persona.im_accounts.push({
							type: pImAccountType,
							account_id: val.imAccountName
						});
					});
				}


				/*** POPULATE SOCIAL NETWORK ACCOUNTS GATHERED FROM LINKEDIN PROFILE ******/
				/***
				 *  This part of code populate the social network accounts gathered from LinkedIn profile
				 *  allowing to use one iWazat account with several social networks accounts, but
				 *  we need to implement the TODO of the next commented code to avoid weird user experience
				 *  in contrast with login/register with others social networks accounts, we've left out this
				 *  feature for next a next release.


				 if ((profileObj.boundAccountTypes) && (profileObj.boundAccountTypes._total > 0)) {

          // TODO check that the user hasn't joined before with one of this social network accounts and manage accordingly

          profileObj.boundAccountTypes.values.forEach(function (boundAccType) {
            boundAccType.boundAccounts.values.forEach(function (boundAcc) {
              pBoundAccType = boundAcc.accountType.toLowerCase();

              switch (pBoundAccType) {
                case 'twitter':
                  pBoundAccType = 'Twitter';
                  break;
                case 'facebook':
                  pBoundAccType = 'Facebook';
                  break;
                case 'google':
                  pBoundAccType = 'Google';
                  break;
                case 'linkedin':
                  pBoundAccType = 'LinkedIn';
                  break;
                default:
                  return;
              }

              if (boundAcc.bindingStatus.toLowerCase() === 'authenticated') {

                if (!pSocialNwAccountsIdx[pBoundAccType]) {
                  pSocialNwAccountsIdx[pBoundAccType] = {};
                  pSocialNwAccountsIdx[pBoundAccType][boundAcc.providerAccountId] = true;

                  pSocialNwAccounts.push({
                    type: pBoundAccType,
                    account_id: boundAcc.providerAccountId,
                    account_name: boundAcc.providerAccountName
                  });
                } else if (!pSocialNwAccountsIdx[pBoundAccType][boundAcc.providerAccountId]) {
                  pSocialNwAccountsIdx[pBoundAccType][boundAcc.providerAccountId] = true;

                  pSocialNwAccounts.push({
                    type: pBoundAccType,
                    account_id: boundAcc.providerAccountId,
                    account_name: boundAcc.providerAccountName
                  });

                } else {
                  return;
                }

              } else {
                persona.social_network_accounts.push({
                  type: pBoundAccType,
                  is_authenticated: false,
                  account_id: boundAcc.providerAccountId,
                  reference: boundAcc.providerAccountName
                });
              }
            });
          });
        } // End add bound accounts

				 if ((profileObj.twitterAccounts) && (profileObj.twitterAccounts._total > 0)) {

          // TODO check that the user hasn't joined before with one of this twitter accounts and manage accordingly

          profileObj.twitterAccounts.values.forEach(function (val) {

            if (!pSocialNwAccountsIdx['Twitter']) {
              pSocialNwAccountsIdx['Twitter'] = {};
              pSocialNwAccountsIdx['Twitter'][val.providerAccountId] = true;

              pSocialNwAccounts.push({
                type: 'Twitter',
                account_id: val.providerAccountId,
                account_name: val.providerAccountName
              });
            } else if (!pSocialNwAccountsIdx['Twitter'][val.providerAccountId]) {
              pSocialNwAccountsIdx['Twitter'][val.providerAccountId] = true;

              pSocialNwAccounts.push({
                type: 'Twitter',
                account_id: val.providerAccountId,
                account_name: val.providerAccountName
              });
            }
          });
        } // End add twitter accounts
				 **/
				/********END POPULATE SOCIAL NETWORK ACCOUNTS GATHERED FROM LINKEDIN PROFILE ****/

				user.social_network_accounts = pSocialNwAccounts;


//        if (profileObj.specialties) {
//          // TODO add to keywords collection - This fields is a string so we will need to parse
//          // to extract relevant keywords
//        }
//
//        if (profileObj.interests) {
//          // TODO add to keywords collection - This fields is a string so we will need to parse
//          // to extract relevant keywords
//        }

				if ((profileObj.skills) && (profileObj.skills._total > 0)) {
					pSkillsHave = [];

					profileObj.skills.values.forEach(function (element) {
						pSkillsHave.push(element.skill.name);
					});
				}

				if ((profileObj.positions) && (profileObj.positions._total > 0)) {
					persona.companies = [];

					profileObj.positions.values.forEach(function (val) {

						pCompany = {
							name: val.company.name,
							position: val.title,
							description: val.summary
						};

						if (val.startDate) {
							if ('number' === typeof val.startDate.year) {
								if ('number' === typeof val.startDate.month) {
									pCompany.start_date = new Date(val.startDate.year, val.startDate.month - 1, 1);
								} else {
									pCompany.start_date = new Date(val.startDate.year, 0, 1);
								}
							}
						}

						if (!val.isCurrent) {
							if (val.endDate) {
								if ('number' === typeof val.endDate.year) {
									if ('number' === typeof val.endDate.month) {
										pCompany.end_date = new Date(val.endDate.year, val.endDate.month - 1, 1);
									} else {
										pCompany.end_date = new Date(val.endDate.year, 0, 1);
									}
								}
							}
						}
						persona.companies.push(pCompany);
					});
				}

				if ((profileObj.phoneNumbers) && (profileObj.phoneNumbers._total > 0)) {
					user.telephone_nums = [];

					profileObj.phoneNumbers.values.forEach(function (val) {
						user.telephone_nums.push({
							label: val.phoneType,
							number: val.phoneNumber
						});
					});
				}

				if (profileObj.location) {
					persona.location = profileObj.location.name;
				}

				if ((profileObj.languages) && (profileObj.languages._total > 0)) {
					persona.languages = [];

					profileObj.languages.values.forEach(function (val) {
						persona.languages.push(val.language.name);
					});
				}

				user.personas = [persona];
				break;
			case 'local':
				break;

			default:
				callback(new Error('Unsupported social network: ' + socialNetwork));
				return;
		} // end switch(strategy)

	} catch (e) {
		// Ignore the error, because it can be thrown when trying to access to an unexistent field of
		// the received social network profile object, however logging it to fix issues
		userRegLogger.warn('Exception when creating the user object from the ' + socialNetwork +
			' profile data. Exception message: ' + e.message);
	}

	if (pSkillsHave) {
		KeywordModel.getKeywords(pSkillsHave, 'en', function (err, keywords) {
			if (err) {
				callback(new iWAErrors.Db(
					'Controller: user # Pre-middleware: registration | Error to get the keywords', 524, err));
				return;
			}

			if (keywords) {
				persona.skills_have = iWAKeyword.unifyWords(keywords, 'en');
			}

			registerUser(socialNetwork, user, callback);

		});
	} else { // The social networks user's profile doesn't allow to figure out user's skills
		registerUser(socialNetwork, user, callback);
	} // Else without skills

};

function registerUser(socialNetwork, user, callback) {

	var userDoc;
	var persona;
	var validate = iWAUser.validateObject(user);

	// If validators fails, try to solve removing these values from social user object to save again
	// and use default values
	if (validate !== true) {
		userRegLogger.warn('User registration from ' + socialNetwork + ' social network, user object ' +
			'validation failed. Error object: ' + util.inspect(validate, {depth: null}));
		iWAUtilObj.subtractObjectProperties(user, validate);
	}


	userDoc = new UserModel(user);

	//Populate in persona the email, telephones and avatar because now we have the ids of those
	// embedded subdocuments
	persona = userDoc.personas[0];

	userDoc.emails.forEach(function (val) {
		persona.emails.push({
			_id: val._id
		});
	});

	userDoc.telephone_nums.forEach(function (val) {
		persona.telephone_nums.push({
			_id: val._id
		});
	});

	if (userDoc.avatars.length > 0) {
		persona.avatar = userDoc.avatars[0]._id
	}


	// TODO populate the other social network accouts got from the social network user's profile used for log in

	userDoc.social_network_accounts.forEach(function (authSNAcc) {

		if (authSNAcc.status === 'authenticated') {
			persona.social_network_accounts.push({
				_id: authSNAcc._id
			});
		}

//    persona.social_network_accounts.push({
//      _id: authSNAcc._id,
//      is_authenticated: true,
//      type: authSNAcc.type,
//      reference: authSNAcc.account_name
//    });
	});


	userDoc.save(function (err, user) {

		if (err) {
			callback(
				new iWAErrors.Db('Controller: user # Pre-middleware: registration | Error saving new user',
					521, err));
			return;
		}

		callback(null, user);
	});

}
