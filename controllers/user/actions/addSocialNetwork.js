/**
 * Add a new social network to the logged user if it isn't registered by another user.
 *
 * The action manges the redirection to the social network authentication page to validate the
 * account and the callback request to add the account if it isn't used by another user.
 *
 * NOTE: Because the Passport strategies are registered with an unique configuration, we cannot use
 * different callbacks to distinguish between add a new social network account to the logged user
 * (this action) and the user authentication using a social network account, so this action
 * check the existence of req.processed.snAuthValidate to apply the operations to add the social
 * network account otherwise pass the request to the next route (next('route')), so this
 * action should be matched before the authentication action (in express this action must be
 * registered before the another, because the matching is done by the registering order)
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticated
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');

// Passport
var passport = require('passport');

/**
 * Globals
 */
// Models
var UserModel;

//Initialize the non straight away global variables
(function initialize() {

  UserModel = iWAMongo.model(iWAUser);

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var authUserId = iWASession.getAuthUser(req.session).id;
  var socialNetworkToAdd = req.processed.socialNetworkToAdd;

  // The request is to add a new social network account
  if (socialNetworkToAdd) {

    if (socialNetworkToAdd.callback === false) {

      // Redirect to the social network authentication page
      switch (socialNetworkToAdd.type) {
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
          //http://graph.facebook.com/ifraixedes/picture // The profile picture is not sent when login, it need to request from that public url

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
          // If we need to request some extended permissions then we need to use the scope parameter
          // @see https://github.com/jaredhanson/passport-google-oauth/blob/master/examples/oauth2/app.js
          // Ex. passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'] }
          break;
        default:
          // Requesting callback from an unsupported social network - is someone attacking iWazat?
          helperGlobal.addError(req,
            new iWAErrors.Authentication('Controller: user # Action: addSocialNetwork | ' +
              'Requesting to add an unsupported social network account.',
              {
                social_network_name: socialNetworkToAdd.type
              }), 412);
          sendResponse(req, res, post);

      } // End switch
    } else {

      // Try to authenticate the user
      passport.authenticate(
        socialNetworkToAdd.type,
        function (err, user, info) {

          var snObj;

          if (err) {
            helperGlobal.addError(req, new iWAErrors.Db(
              'Controller: user # Action: addSocialNetwork | Error when trying to search the ' +
                'user into the database', 520, err), 520);

            sendResponse(req, res, post);
            return;
          }


          if (!user) {

            switch (info.strategy) {
              case 'twitter':
                snObj = {
                  type: 'Twitter',
                  account_id: info.social_network_profile._json.id,
                  account_name: info.social_network_profile._json.screen_name,
                  status: 'authenticated',
                  account_auth: info.social_network_auth,
                  account_profile: [ info.social_network_profile._json ]
                };

                break;

              case 'facebook':
                snObj = {
                  type: 'Facebook',
                  account_id: info.social_network_profile._json.id,
                  account_name: info.social_network_profile._json.name,
                  status: 'authenticated',
                  account_auth: info.social_network_auth,
                  account_profile: [ info.social_network_profile._json ]
                };

                break;

              case 'linkedin':
                snObj = {
                  type: 'LinkedIn',
                  account_id: info.social_network_profile._json.id,
                  account_name: info.social_network_profile._json.formattedName,
                  status: 'authenticated',
                  account_auth: info.social_network_auth,
                  account_profile: [ info.social_network_profile._json ]
                };

                break;

              case 'google':
                snObj = {
                  type: 'Google',
                  account_id: info.social_network_profile._json.id,
                  account_name: info.social_network_profile._json.name,
                  status: 'authenticated',
                  account_auth: info.social_network_auth,
                  account_profile: [ info.social_network_profile._json ]
                };

                break;
            }

            UserModel.findByIdAndUpdate(authUserId, {
                $push: {
                  social_network_accounts: snObj
                }
              },
              {
                select: {social_network_accounts: true}
              },
              function (err, updateUser) {
                var newSNAcc;

                if (err) {
                  helperGlobal.addError(req, new iWAErrors.Db(
                    'Controller: user # Action: addSocialNetwork | Error when updating the user\'s ' +
                      'social network accounts', 521, err), 521);
                  sendResponse(req, res, post);
                  return;
                }


                newSNAcc = updateUser.social_network_accounts[updateUser.social_network_accounts.length - 1];

                delete newSNAcc.social_network_auth;

                //sendResponse(req, res, post, newSNAcc);
                res.redirect(302, '/#/')
              });

          } else {
            if (user.id === authUserId) {
              sendResponse(req, res, post, 'This user already has this social network registered',
                240);

            } else {
              sendResponse(req, res, post, 'This social network account is registered in another ' +
                'user account', 241);
            }
          }
        })(req, res, next);
    } // Social network passport callback

  } else {
    next('route');
  }
};

function sendResponse(req, res, post, respData, resCode) {

  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  if ('string' === typeof respData) {
    if (resCode) {
      res.send(resCode, respData);
    } else {
      res.send(200, respData);
    }
  } else {
    if (resCode) {
      res.json(resCode, respData);
    } else {
      res.json(200, respData);
    }
  }


  post(null, req, res);
}

