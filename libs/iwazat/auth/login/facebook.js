'use strict';

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

// Utils
var nodeUtil = require('util');
var _ = require('underscore');
var crc = require('crc');

// Logger
var globalLogger = settings.logger;

/**
 *
 * @param {Object} user Mongoose document
 * @param infoObj Information received from the Facebook authentication
 * @param callback The callback to call
 */
module.exports = function (user, infoObj, callback) {

  var idxLastProfile;
  var receivedProfile;
  var lastStoredProfile;
  var isNewProfile = false;
  var profile = infoObj.social_network_profile;
  // Update the social account information - We only save the JSON object sent by social network
  var accountObject = _.find(user.social_network_accounts, function (account) {
    return account.type === 'Facebook';
  });

  accountObject.account_auth = {
    token: infoObj.social_network_auth.token,
    token_secret: infoObj.social_network_auth.token_secret
  };

  accountObject.markModified('account_auth');
  idxLastProfile = accountObject.account_profile.length - 1;

  if (idxLastProfile >= 0) {
    // Save the profile if it's changed
    lastStoredProfile = accountObject.account_profile[idxLastProfile];

    if (profile._json.updated_time.toString() !== lastStoredProfile.updated_time.toString()) {

      receivedProfile = _.clone(profile._json);
      delete lastStoredProfile.updated_time;
      delete receivedProfile.updated_time;


      if (crc.crc16(nodeUtil.inspect(receivedProfile)) !== crc.crc16(nodeUtil
        .inspect(lastStoredProfile))) {
        accountObject.account_profile.push(profile._json);

        isNewProfile = profile;
      }
    }
  } // End check if there was some stored social network profile


// User is registered (new users from social network don't will save in database here)
  user.save(function (err) {

    var loginInfo = {
      strategy: 'Facebook',
      new_profile: false,
      account_status: user.account_status
    };

    if (err) {
      // Only register the error in the log file, but we don't stop the authentication process
      // because the error is not relevant to continue with it
      globalLogger.error('lib: iWazat/auth # module: login/facebook. Error when saving the user ' +
        'document updates received from the Facebook. | Error details: ' + err);
    }

    if (isNewProfile !== false) {
      loginInfo.new_profile = isNewProfile;
    }

    callback(null, user, loginInfo);

  }); // End saving registered user information received from Facebook
};