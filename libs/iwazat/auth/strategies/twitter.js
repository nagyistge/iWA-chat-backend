
(function initialize() {
  'use strict';

  /** Dependencies **/
  var settings = require('../../../../settings.js');
// Utils
  var configLoader = require(settings.libsPath + '/iwazat/util/config');

// Passport
  var passport = require('passport');

//Database (MongoDB)
  var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
  var iWAUser = require(settings.modelsPath + '/iwazat/user');
  /************************/


  var UserModel = iWAMongo.model(iWAUser);

  // Twitter login strategy
  var TwitterStrategy = require('passport-twitter').Strategy;
  // Twitter account data

  var socialAccountCnfg = require(settings.configsPath + '/twitter');
  socialAccountCnfg = configLoader.getConfiguration(socialAccountCnfg, 'iWazat_app');

  passport.use(new TwitterStrategy({
    consumerKey: socialAccountCnfg.consumer_key,
    consumerSecret: socialAccountCnfg.consumer_secret,
    callbackURL: socialAccountCnfg.callback_url
  }, function (token, tokenSecret, profile, done) {

    UserModel.findOne({
      'social_network_accounts.type': 'Twitter',
      'social_network_accounts.account_id': profile.id
    }, {
      _id: true,
      account_status: true,
      social_network_accounts: true,
      personas: {$elemMatch: {is_default: true}}
    }, function (err, user) {

      if (err) {
        return done(err);
      }

      // Check if there is an user registered, otherwise a new user is requesting create a new account
      // this function doesn't save the new user into the the DB, it is delegated to the
      // passport.authenticate caller
      if (!user) {
        // Create an info object with information received from the social network
        return done(null, null, {
          strategy: 'twitter',
          social_network_auth: {
            token: token,
            token_secret: tokenSecret
          },
          social_network_profile: profile
        });

      } else {
        return done(null, user, {
          strategy: 'twitter',
          social_network_auth: {
            token: token,
            token_secret: tokenSecret
          },
          social_network_profile: profile
        });
      }
    }); // End the search of the user in the database
  })); // End Passport Twitter authentication

	// This file it is only called one time, to load the login strategy, so we remove the empty
	// object from require's cache to consume less memory
	delete require.cache[__filename];

}()); // End module initialization
