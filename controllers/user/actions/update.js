/**
 * Dispatch the related login data
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.processed.userProfile must exist
 *    # req.processed.userProfile.persona must exist and is a persona object. _id attribute must
 *        exists.
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

// Utils
var iWAUtilObj = require(settings.libsPath + '/iwazat/util/objects');

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
  var uDataSent = req.processed.userProfile;


  // TODO check the consistency of email address and avatars of the user and they have  been populated


  UserModel.findById(authUserId, {
    created_at: false,
    activated_at: false,
    account_status: false,
    local_auth: false,
    events_access_allowed: false,
    events_access_requests: false,
    contacts: false,
    following: false,
    followers: false,
    unread_chats: false
  }, function (err, user) {

    if (err) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: user # action: update ' +
        '| Error trying to get the info of the user with the id ' + authUserId,
        520, err), 520);
      helperActions.respAllIssues(req, res, post);
      return;
    }

    if (!user) {
      helperGlobal.addError(req, new iWAErrors.Db('Controller: user # action: update ' +
        '| Error when updating the logged in user information, user registered in the session ' +
        'has not found in the database, session user id: ' + authUserId, 520), 520);
      helperActions.respAllIssues(req, res, post);
      return;
    }


    // Security checking related with the current system features and use cases
    var persona = user.personas.id(uDataSent.persona._id);
    var checker = {};
    var it;


    if (uDataSent.persona.nickname !== undefined) {
      persona.nickname = uDataSent.persona.nickname;
    }

    if (uDataSent.persona.bio !== undefined) {
      persona.bio = uDataSent.persona.bio;
    }

    if (uDataSent.persona.website !== undefined) {
      persona.website = uDataSent.persona.website;
    }


    if (uDataSent.persona.interests) {
      persona.interests = uDataSent.persona.interests;
    }

    if (uDataSent.persona.skills_have) {
      persona.skills_have = uDataSent.persona.skills_have;
    }

    if (uDataSent.persona.skills_want) {
      persona.skills_want = uDataSent.persona.skills_want;
    }

    if (uDataSent.persona.companies) {
      persona.companies.push.apply(persona.companies, uDataSent.persona.companies);
    }

    if (uDataSent.persona.emails) {

      persona.emails = [];

      if (uDataSent.persona.emails.length > 0) {

        if (uDataSent.emails) {
          uDataSent.emails.forEach(function (email) {

            if (!email._id) {

              user.emails.push({
                address: email.address,
                verified: email.verified,
                is_default: email.is_default
              });

              checker[email.address] = user.emails[user.emails.length - 1].id;
            }
          });
        }


        for (it = 0; it < uDataSent.persona.emails.length; it++) {
          if (uDataSent.persona.emails[it]._id) {
            if (!user.emails.id(uDataSent.persona.emails[it]._id)) {
              helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
                'update | Unreferenced email\'s id', 603, req, uDataSent.persona.emails[it]), 603);
              sendResponse(req, res, next, post);
              return;
            }

            persona.emails.push({
              _id: uDataSent.persona.emails[it]._id
            });

          } else if (uDataSent.persona.emails[it].address) {
            // Previous pre-middleware has been pushed the new persona address to a emails root level
            // so the addresses  exist in the checker object
            persona.emails.push({
              _id: checker[uDataSent.persona.emails[it].address]
            });

            delete uDataSent.persona.emails[it].address;
          } else {
            helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
              'update | Incorrect persona\'s email object', 603, req, uDataSent.persona.emails[it]),
              603);
            sendResponse(req, res, next, post);
            return;
          }
        }
      }
    }

    if (uDataSent.persona.telephone_nums) {

      persona.telephone_nums = [];

      if (uDataSent.persona.telephone_nums.length > 0) {
        if (uDataSent.telephone_nums) {

          uDataSent.telephone_nums.forEach(function (tel) {

            if (!tel._id) {

              user.telephone_nums.push({
                number: tel.number,
                label: tel.label
              });

              checker[tel.number] = user.telephone_nums[user.telephone_nums.length - 1].id;
            }
          });
        }


        for (it = 0; it < uDataSent.persona.telephone_nums.length; it++) {
          if (uDataSent.persona.telephone_nums[it]._id) {
            if (!user.telephone_nums.id(uDataSent.persona.telephone_nums[it]._id)) {
              helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
                'update | Unreferenced telephone number\'s id', 603, req,
                uDataSent.persona.telephone_nums[it]), 603);
              sendResponse(req, res, next, post);
              return;
            }

            persona.telephone_nums.push({
              _id: uDataSent.persona.telephone_nums[it]._id
            });

          } else if (uDataSent.persona.telephone_nums[it].number) {
            // Previous pre-middleware has been pushed the new persona address to a emails root level
            // so the addresses  exist in the checker object
            persona.telephone_nums.push({
              _id: checker[uDataSent.persona.telephone_nums[it].number]
            });

            delete uDataSent.persona.telephone_nums[it].number;
          } else {
            helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
              'update | Incorrect persona\'s telephone object', 603, req,
              uDataSent.persona.telephone_nums[it]), 603);
            sendResponse(req, res, next, post);
            return;
          }
        }
      }
    }


//    if (uDataSent.social_network_accounts) {
//
//      uDataSent.social_network_accounts.forEach(function (snAcc) {
//        //persona.social_network_accounts = [];
//
//        if (!snAcc._id) {
//          user.social_network_accounts.push(snAcc);
//          checker[snAcc.account_id] =
//            user.social_network_accounts[user.social_network_accounts.length - 1].id;
//        }
//      });
//    }
//
//    if (uDataSent.persona.social_network_accounts) {
//      persona.social_network_accounts = [];
//
//      for (it = 0; it < uDataSent.persona.social_network_accounts.length; it++) {
//        if (uDataSent.persona.social_network_accounts[it]._id) {
//          if (!user.social_network_accounts.id(uDataSent.persona.social_network_accounts[it]._id)) {
//            helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
//              'update | Unreferenced social network account\'s id', 603, req,
//              uDataSent.persona.social_network_accounts[it]), 603);
//            sendResponse(req, res, next, post);
//            return;
//          } else {
//            persona.social_network_accounts.push({
//              _id: uDataSent.persona.social_network_accounts[it]._id
//            });
//          }
//
//        } else if (uDataSent.persona.social_network_accounts[it].account_id) {
//          // Previous pre-middleware has been pushed the new persona address to a emails root level
//          // so the addresses  exist in the checker object
//          persona.social_network_accounts.push({
//            _id: checker[uDataSent.persona.social_network_accounts[it].account_id]
//          });
////          persona.social_network_accounts = [{
////            _id: checker[uDataSent.persona.social_network_accounts[it].account_id]}];
//
//
//        } else {
//          helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: user # Action: ' +
//            'update | Incorrect persona\'s social network account object', 603, req,
//            uDataSent.persona.social_network_accounts[it]), 603);
//          sendResponse(req, res, next, post);
//          return;
//        }
//
//        persona.social_network_accounts.push({
//          _id: checker[uDataSent.persona.social_network_accounts[it].account_id]
//        });
//
//      }
//    }

    //iWAUtilObj.updateMongooseDoc(user, uDataSent);


    user.save(function (err, userDoc) {
      if (err) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: user # action: update ' +
          '| Error when saving the updated user data in the data base, user id: ' + authUserId,
          521, err), 521);
        helperActions.respAllIssues(req, res, post);
        return;
      }

      if ((userDoc.personas) && (userDoc.personas.length > 0)) {

        var user = userDoc.toObject();

        userDoc.dereferenceKeywords(function (err, pKeywordsMap) {
          var pIt;
          var personaId;
          var persona;

          if (err) {
            helperGlobal.addError(req, new iWAErrors.Db('Controller: user # Action: retrieve | ' +
              'Error in the process of deference the personas\' keywords ' + authUserId, 520, err),
              520);
            sendResponse(req, res, post);
            return;
          }

          for (pIt = 0; pIt < user.personas.length; pIt++) {
            persona = user.personas[pIt];
            personaId = persona._id.toString();

            persona.interests = pKeywordsMap[personaId].interests;
            persona.skills_have = pKeywordsMap[personaId].skills_have;
            persona.skills_want = pKeywordsMap[personaId].skills_want;
          }

          sendResponse(req, res, post, user);

        });

      } else {
        sendResponse(req, res, post, userDoc);
      }

    });
  });
};

function sendResponse(req, res, post, updatedUser) {

  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, updatedUser);
  post(null, req, res);
}

