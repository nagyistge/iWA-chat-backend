'use strict';

/**
 * Thi pre-middleware authenticate the users, and it deals with new users who coming from one
 * accepted social network
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # req.processed.authentication.accessType must always exist if the user has not been authenticated,
 *      so his session doesn't hold the authentication credentials
 *
 *
 * The authentication is based in 'passport' (node module).
 * The strategies can return an info object to 'passport' callback which can contains some info to
 * manage some uses case, read the next comments to be clearer about it:
 *
 *  ## About issues:
 *  'issue object' can have a 'check' field that it is an array that contains the names of the
 *  'issue object' properties names which contains the object with information about the issue.
 *
 *  ##### Use cases
 *  ### New user is coming from social network profile (fields: new_user, social_network_profile)
 *  Info object: {
      strategy: 'google',
      new_user: true,
      social_network_auth: {
         token: accessToken,
         token_secret: refreshToken
      },
      social_network_profile: profile
    }
 *  ### Existing user has logged user a social network account
 Info object: {
      strategy: 'google',
      new_profile: The social network profile object or 'false' if it hasn't changed,
      account_status: The user account status (@see models/iwazat/user)
 }
 */


module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Passport
var passport = require('passport');

// iWazat login managers
var twitterLogin = require(settings.libsPath + '/iwazat/auth/login/twitter');
var facebookLogin = require(settings.libsPath + '/iwazat/auth/login/facebook');
var linkedInLogin = require(settings.libsPath + '/iwazat/auth/login/linkedin');
var googleLogin = require(settings.libsPath + '/iwazat/auth/login/google');


/**
 * Function pre middleware
 *
 *    # Pre-conditions
 *     * Request parameters have been parsed and processed under authentication attribute
 *      (req.processed.authentication)
 *
 * NOTE: Authenticate strategies only populate the user object if there isn't any login issue,
 * although some issues may allow the user's access (for example some non "active" status account)
 * they mustn't manage in the strategies nor this pre-middleware must populate the session with the
 * user's data object, it must only populate the request into processed property (attribute of the
 * request object) to leave the management of those issues to the next pre-middlewares or action
 *
 */
module.exports = function (req, res, next) {

	// User has been authenticated before and his session is valid
	if (iWASession.isUserAuthenticated(req.session)) {
		try {
			// If not authentication access type them populate it to identify that the user's session holds
			// his authentication credentials
			helperPreMiddlewares.addProcessedData(req, 'authentication', {accessType: 'insession'},
				false);
		} catch (e) {
			// Ignore the error because the accessType has been specified although the session holds
			// the user authentication. This makes sense when the user login from the social network
			// because require two calls, one to authenticate the user through the social network
			// authentication page and process the callback and the second to collect data about the
			// authentication process due the single web application lost the state when jump out.
		}
		next();
		return;
	}

	// Login from social network requested, redirect to the social network authorization page
	if (req.processed.authentication.accessType !== 'local') {

		if (!req.processed.authentication.callback) {

			// Save the request state before redirect the request to the social network authentication page
			// to restore when its response arrive to be able to restore it
			helperGlobal.regTraceReq(req, 'social_network_login', req.processed, 120000, true,
				function (err) {
					if (err) {
						helperGlobal.addError(req, err, 500);
						next();
						return;

					} else {
						// Redirect to the social network authentication page
						switch (req.processed.authentication.accessType) {
							case 'twitter':
								passport.authenticate('twitter')(req, res, next);
								break;
							case 'linkedin':
								passport.authenticate('linkedin',
									{
										scope: [
											'r_fullprofile',
											'r_emailaddress',
											'r_contactinfo'
										]
									})(req, res, next);
								break;
							case 'facebook':
								//passport.authenticate('facebook')(req, res, next);
								passport.authenticate(
									'facebook',
									{
										scope: [
											'user_about_me',
											'user_birthday',
											'user_hometown',
											'user_interests',
											'user_location',
											'user_website',
											'user_work_history',
											'email' ]
									})(req, res, next);
								//http://graph.facebook.com/ifraixedes/picture
								// The profile picture is not sent when login, it need to request from that public url

								// If we need to request some extended permissions then we need to use the scope parameter
								// and the display parameter if we want to set the rendering of the authroization dialog
								// @see https://github.com/jaredhanson/passport-facebook
								// Ex. passport.authenticate('facebook', { scope: ['user_status', 'user_checkins'], display: 'touch' });
								break;
							case 'google':
								// Google requires the scope parameter
								passport.authenticate(
									'google',
									{
										scope: [
											'https://www.googleapis.com/auth/userinfo.profile',
											'https://www.googleapis.com/auth/userinfo.email' ]
									})(req, res, next);
								// If we need to request some extended permissions then we need to use the scope
								// parameter
								// @see https://github.com/jaredhanson/passport-google-oauth/blob/master/examples/oauth2/app.js
								// Ex. passport.authenticate('google', {
								//  scope: ['https://www.googleapis.com/auth/userinfo.profile',
								//    'https://www.googleapis.com/auth/userinfo.email'
								// ] }
								break;
							default:
								// Requesting callback from an unsupported social network - is someone attacking iWazat?

								helperPreMiddlewares.traceErrors(req,
									new iWAErrors.Authentication('Controller: user# pre-middleware: authentication ' +
										'| Requesting to login from an unsupported social network',
										{ social_network_name: req.processed.authentication.accessType }));
								helperPreMiddlewares.sendRespOfIssue(req, res, 412, 'user authentication');
								return;
						}
					}
				});
		} else {
			// Restore the parameters sent when login before redirecting the request to social network
			// authorization page
			helperGlobal.getTraceReq(req, 'social_network_login', function (err, traceObj) {
				if (err) {
					helperGlobal.addError(req, err, 500);
				} else {
					if (traceObj === false) {
						helperGlobal.addError(req, new iWAErrors.ServerApp(
							'Controller: user # pre-middleware: authentication | Session doesn\'t exists'),
							500);

					} else {
						if (traceObj !== null) {
							var entity;

							for (entity in traceObj.data) {
								helperPreMiddlewares.addProcessedData(req, entity, traceObj.data[entity], true);
							}
						}
					}
				}

				authenticateUser(req, res, next);
			});
		}
	} else {
		authenticateUser(req, res, next);
	}

};

/**
 * Resolve authentication & issues
 *
 * @param req
 * @param res
 * @param next
 */
function authenticateUser(req, res, next) {

	function loginCallback(err, user, loginInfo) {
		if (err) {

			helperPreMiddlewares.traceErrors(req, new iWAErrors.UnderlyingSystem(
				'Controller: user # Pre-Middleware: authentication | Error when trying to register ' +
					'the user\'s authentication into the session', 531, err));
			helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'user authentication');
			return;
		}

		switch (loginInfo.account_status) {
			case 'blocked':

				helperPreMiddlewares.traceErrors(req, new iWAErrors.Authentication('Controller: user # ' +
					'Pre-Middleware: authentication | Access denied. The account has been blocked', 460,
					loginInfo));
				helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'user authentication');

				return;

			case 'disabled':
				helperPreMiddlewares.traceErrors(req, new iWAErrors.Authentication('Controller: user # ' +
					'Pre-Middleware: authentication | Access denied. The account has been disabled', 461,
					loginInfo));
				helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'user authentication');

				return;

			case 'unregistered':
				// TODO #18
//        helperGlobal.addError(req, new iWAErrors.ServerApp(
//          'Controller: user # Pre-Middleware: authentication | Unimplemented functionality: ' +
//            'unregistered user status account found', loginInfo), 515);
//        next();
				//user.account_status = 'active';

				// Populate the status to warn the next middlewares/action and execute the code as if it
				// was an 'active' account
				loginInfo.first_login = user;

			default:
				// User authenticated - Register the user in the session
				iWASession.userLogIn(req.session, user, function (err) {

					if (err) {
						helperPreMiddlewares.traceErrors(req, new iWAErrors.UnderlyingSystem(
							'Controller: user # Pre-Middleware: authentication | Error when trying to register ' +
								'the user\'s authentication into the session', 531, err));
						helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'user authentication');
						return;
					}

					if (loginInfo) {
						// Some info about the issue if it happened or some change in user's social network
						// profile has been detected if the login was OK
						helperPreMiddlewares.addProcessedData(req, 'login_info', loginInfo, false);
					}

					next();
				});
		}
	}

	// Try to authenticate the user
	passport.authenticate(
		req.processed.authentication.accessType,
		function (err, user, info) {

			if (err) {
				helperPreMiddlewares.traceErrors(req, new iWAErrors.Db(
					'Controller: user # Pre-Middleware: authentication | Error when trying to search the ' +
						'user into the database', 520, err));
				helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'user authentication');
				return;
			}


			if (!user) {
				if (req.processed.authentication.accessType !== 'local') {
					info.new_user = true;
					helperPreMiddlewares.addProcessedData(req, 'login_info', info, false);

				} else {
					helperPreMiddlewares.traceErrors(req, new iWAErrors.Authentication('Controller: user # ' +
						'Pre-Middleware: authentication | ' + 'Access denied. Incorrect email\'s address or ' +
						'password', info));
					helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'user authentication');
					return;
				}

				next();
			} else {

				switch (req.processed.authentication.accessType) {
					case 'linkedin':
						linkedInLogin(user, info, loginCallback);
						break;

					case 'facebook':
						facebookLogin(user, info, loginCallback);
						break;

					case 'twitter':
						twitterLogin(user, info, loginCallback);
						break;

					case 'google':
						googleLogin(user, info, loginCallback);
						break;

					default:

						helperPreMiddlewares.traceErrors(req, new iWAErrors.Authentication('Controller: user ' +
							'# pre-middleware: authentication | Requesting to login from an unsupported social ' +
							'network', { social_network_name: req.processed.authentication.accessType }));
						helperPreMiddlewares.sendRespOfIssue(req, res, 412, 'user authentication');
				}
			}
		})(req, res, next);
}