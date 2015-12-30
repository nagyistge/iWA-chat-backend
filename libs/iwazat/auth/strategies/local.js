
// TODO #17

(function initialize() {
  'use strict';

  /** Dependencies **/
  var settings = require('../../../../settings.js');

// Passport
  var passport = require('passport');

//Database (MongoDB)
  var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
  var iWAUser = require(settings.modelsPath + '/iwazat/user');
  /************************/


  var UserModel = iWAMongo.model(iWAUser);

  // Local login strategy
  var LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function (emailAddr, password, done) {
    UserModel.findOne({
      'emails.address': emailAddr
    }, {
      _id: true,
      account_status: true,
      local_auth: true
    }, function (err, user) {

      if (err) {
        return done(err);
      }

      // Check if there is an user registered, otherwise a new user is requesting create a new account
      // this function doesn't save the new user into the the DDBB, it is delegated to other
      if (!user) {
        return done(null, false, {
          strategy: 'local',
          issue: {
            new_user: true,
            email_address: emailAddr
          }
        });
      }

      // Check the account status for if it is appropriated for granting the access
      if (user.account_status !== 'active') {
        return done(null, false, {
          strategy: 'local',
          issue: {
            new_user: false,
            check: [ 'account_status' ],
            account_status: user.account_status
          }
        });
      }

      // Check if the password sent is correct
      user.authenticate(password, function (err, user, info) {

        var infoAuth = {
          strategy: 'local',
          issue: {
            new_user: false,
            check: [ 'password' ],
            user: {
              id: user.id
            }
          }
        };

        // Check if an error happened in the checking password function
        if (err) {
          return done(err, false, infoAuth);
        }

        // Check if the password is right
        if (!user) {
          infoAuth.message = info.message;
          return done(null, false, infoAuth);
        }

        // User authentication successful
        return done(null, user);

      }); // End user's password check
    }); // End the search of the user in the database
  })); // End Passport local authentication

// This file it is only called one time, to load the login strategy, so we remove the empty
	// object from require's cache to consume less memory
	delete require.cache[__filename];

}()); // End module initialization
