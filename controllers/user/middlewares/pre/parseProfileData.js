'use strict';

/**
 *
 * Require that personas array has zero or one element
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');

// Data models
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWAKeyword = require(settings.modelsPath + '/iwazat/keyword');

/**
 * Globals
 */
var KeywordModel;

//Initialize the non straight away global variables
(function initialize() {

  KeywordModel = iWAMongo.model(iWAKeyword);

})();

/**
 *
 * The workflow is call all of this function, and each function call to processCollector function
 * which manages if finish the action in front of one error or calling the last operations,
 * createEvent which executes the last operations that need to be executed in a row.
 *
 * Asynchronous operations (procOperations variable): the id of each asynchronous
 * process are:
 *  # computeInterests:              0x01
 *  # computeSkillsHave:             0x02
 *  # computeSkillsWant:             0x04
 *
 * If some error happens in one of this function then the procOperations is -1 and the
 * processCollector function call response function and the error reported by the operation will
 * produce an error response.
 *
 * @param req
 * @param res
 * @param next
 */
module.exports = function (req, res, next) {

  var uProfile = req.processed.userProfile;
  var language = req.processed.system.language;

  var procOperations = 0x00;


  var computeInterests = function () {
    var counter = 0;
    var interests = [];
    var sentInterests = uProfile.persona.interests;

    if (!sentInterests) {
      procOperations |= 0x01;
      processCollector();
      return;
    }

    if ((sentInterests.new) && (sentInterests.new.length > 0)) {

      sentInterests.new.forEach(function (newWord) {
        counter++;

        KeywordModel.getKeywords(newWord.word, language.abbreviation, function (err, keyword) {
          if (procOperations < 0) {
            return;
          }

          if (err) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
              'Pre-middleware: parseProfileData | Error to create the new keywords specified ' +
              'like interests', 524, err));

            procOperations = -1;
            processCollector();
            return;
          }

          if (keyword) {
            interests[newWord.position] = keyword;
          }

          counter--;
          if (counter === 0) {
            if ((sentInterests.existing) &&
              (sentInterests.existing.length > 0)) {

              KeywordModel.countFromKeywordsRefs(sentInterests.existing, language.abbreviation,
                function (err, numKeywords) {
                  if (procOperations < 0) {
                    return;
                  }

                  if (err) {
                    helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
                      'Pre-middleware: parseProfileData | Error to count the existing keywords ' +
                      'specified like interests', 524, err));

                    procOperations = -1;
                    processCollector();
                    return;
                  }

                  if (numKeywords !== sentInterests.existing.length) {
                    helperPreMiddlewares.traceErrors(req,
                      new iWAErrors.ClientAttack('Controller: ' +
                        'user # Pre-middleware: parseProfileData | Nonexistent keyword references',
                        602, req, sentInterests.existing));

                    procOperations = -1;
                    processCollector();
                    return;
                  } else {

                    sentInterests.existing.forEach(function (kWord) {
                      do {
                        if (interests[counter] === undefined) {
                          interests[counter] = kWord;
                          kWord = false;
                        }
                        counter++;
                      } while (kWord !== false);
                    });


                    uProfile.persona.interests =
                      iWAKeyword.unifyWords(interests, language.abbreviation);

                    procOperations |= 0x01;
                    processCollector();
                  }
                }); // End check existing keyword references and putting all together
            } else {
              if (interests.length > sentInterests.new.length) {
                helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: ' +
                  'user #  Pre-middleware: parseProfileData | The specified new keywords array ' +
                  'for interests specifies positions out of the expected array length',
                  603,
                  req, interests));

                procOperations = -1;
                processCollector();
                return;
              }

              uProfile.persona.interests =
                iWAKeyword.unifyWords(interests, language.abbreviation);

              procOperations |= 0x01;
              processCollector();
            } // End non-specified existing keywords
          }
        }); // End create new keywords
      });
    } else if ((sentInterests.existing) &&
      (sentInterests.existing.length > 0)) {

      // there isn't new keywords
      KeywordModel.countFromKeywordsRefs(sentInterests.existing,
        language.abbreviation,
        function (err, numKeywords) {
          if (procOperations < 0) {
            return;
          }

          if (numKeywords !== sentInterests.existing.length) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: user # ' +
              'Pre-middleware: parseProfileData | Nonexistent keyword references', 602, req,
              sentInterests.existing), 602);

            procOperations = -1;
            processCollector();
            return;

          } else {

            uProfile.persona.interests =
              iWAKeyword.unifyWords(sentInterests.existing, language.abbreviation);

            procOperations |= 0x01;
            processCollector();
          }
        }); // End count keyword references
    } else {
      procOperations |= 0x01;
      uProfile.persona.interests = [];
      processCollector();
    }
  }; // End function interests computation

  var computeSkillsHave = function () {
    var counter = 0;
    var skillsHave = [];
    var sentSkillsHave = uProfile.persona.skills_have;

    if (!sentSkillsHave) {
      procOperations |= 0x02;
      processCollector();
      return;
    }

    if ((sentSkillsHave.new) && (sentSkillsHave.new.length > 0)) {

      sentSkillsHave.new.forEach(function (newWord) {
        counter++;

        KeywordModel.getKeywords(newWord.word, language.abbreviation, function (err, keyword) {
          if (procOperations < 0) {
            return;
          }

          if (err) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
              'Pre-middleware: parseProfileData | Error to create the new keywords specified ' +
              'like skills have', 524, err));

            procOperations = -1;
            processCollector();
            return;
          }

          if (keyword) {
            skillsHave[newWord.position] = keyword;
          }

          counter--;
          if (counter === 0) {
            if ((sentSkillsHave.existing) &&
              (sentSkillsHave.existing.length > 0)) {

              KeywordModel.countFromKeywordsRefs(sentSkillsHave.existing, language.abbreviation,
                function (err, numKeywords) {
                  if (procOperations < 0) {
                    return;
                  }

                  if (err) {
                    helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
                      'Pre-middleware: parseProfileData | Error to count the existing keywords ' +
                      'specified like skills have', 524, err));

                    procOperations = -1;
                    processCollector();
                    return;
                  }

                  if (numKeywords !== sentSkillsHave.existing.length) {
                    helperPreMiddlewares.traceErrors(req,
                      new iWAErrors.ClientAttack('Controller: ' +
                        'user # Pre-middleware: parseProfileData | Nonexistent keyword references',
                        602, req, sentSkillsHave.existing));

                    procOperations = -1;
                    processCollector();
                    return;
                  } else {

                    sentSkillsHave.existing.forEach(function (kWord) {
                      do {
                        if (skillsHave[counter] === undefined) {
                          skillsHave[counter] = kWord;
                          kWord = false;
                        }
                        counter++;
                      } while (kWord !== false);
                    });


                    uProfile.persona.skills_have =
                      iWAKeyword.unifyWords(skillsHave, language.abbreviation);

                    procOperations |= 0x02;
                    processCollector();
                  }
                }); // End check existing keyword references and putting all together
            } else {
              if (skillsHave.length > sentSkillsHave.new.length) {
                helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: ' +
                  'user #  Pre-middleware: parseProfileData | The specified new keywords array ' +
                  'for skills have specifies positions out of the expected array length', 603,
                  req, skillsHave));

                procOperations = -1;
                processCollector();
                return;
              }

              uProfile.persona.skills_have =
                iWAKeyword.unifyWords(skillsHave, language.abbreviation);

              procOperations |= 0x02;
              processCollector();
            } // End non-specified existing keywords
          }
        }); // End create new keywords
      });
    } else if ((sentSkillsHave.existing) &&
      (sentSkillsHave.existing.length > 0)) {

      // there isn't new keywords
      KeywordModel.countFromKeywordsRefs(sentSkillsHave.existing,
        language.abbreviation,
        function (err, numKeywords) {
          if (procOperations < 0) {
            return;
          }

          if (numKeywords !== sentSkillsHave.existing.length) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: user # ' +
              'Pre-middleware: parseProfileData | Nonexistent keyword references', 602, req,
              sentSkillsHave.existing), 602);

            procOperations = -1;
            processCollector();
            return;

          } else {

            uProfile.persona.skills_have =
              iWAKeyword.unifyWords(sentSkillsHave.existing, language.abbreviation);

            procOperations |= 0x02;
            processCollector();
          }
        }); // End count keyword references
    } else {
      procOperations |= 0x02;
      uProfile.persona.skills_have = [];
      processCollector();
    }
  }; // End function "skills have" computation

  var computeSkillsWant = function () {
    var counter = 0;
    var skillsWant = [];
    var sentSkillsWant = uProfile.persona.skills_want;

    if (!sentSkillsWant) {
      procOperations |= 0x04;
      processCollector();
      return;
    }

    if ((sentSkillsWant.new) && (sentSkillsWant.new.length > 0)) {

      sentSkillsWant.new.forEach(function (newWord) {
        counter++;

        KeywordModel.getKeywords(newWord.word, language.abbreviation, function (err, keyword) {
          if (procOperations < 0) {
            return;
          }

          if (err) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
              'Pre-middleware: parseProfileData | Error to create the new keywords specified ' +
              'like skills want', 524, err));

            procOperations = -1;
            processCollector();
            return;
          }

          if (keyword) {
            skillsWant[newWord.position] = keyword;
          }

          counter--;
          if (counter === 0) {
            if ((sentSkillsWant.existing) &&
              (sentSkillsWant.existing.length > 0)) {

              KeywordModel.countFromKeywordsRefs(sentSkillsWant.existing, language.abbreviation,
                function (err, numKeywords) {
                  if (procOperations < 0) {
                    return;
                  }

                  if (err) {
                    helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: user # ' +
                      'Pre-middleware: parseProfileData | Error to count the existing keywords ' +
                      'specified like skills want', 524, err));

                    procOperations = -1;
                    processCollector();
                    return;
                  }

                  if (numKeywords !== sentSkillsWant.existing.length) {
                    helperPreMiddlewares.traceErrors(req,
                      new iWAErrors.ClientAttack('Controller: ' +
                        'user # Pre-middleware: parseProfileData | Nonexistent keyword references',
                        602, req, sentSkillsWant.existing));

                    procOperations = -1;
                    processCollector();
                    return;
                  } else {

                    sentSkillsWant.existing.forEach(function (kWord) {
                      do {
                        if (skillsWant[counter] === undefined) {
                          skillsWant[counter] = kWord;
                          kWord = false;
                        }
                        counter++;
                      } while (kWord !== false);
                    });


                    uProfile.persona.skills_want =
                      iWAKeyword.unifyWords(skillsWant, language.abbreviation);

                    procOperations |= 0x04;
                    processCollector();
                  }
                }); // End check existing keyword references and putting all together
            } else {
              if (skillsWant.length > sentSkillsWant.new.length) {
                helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: ' +
                  'user #  Pre-middleware: parseProfileData | The specified new keywords array ' +
                  'for skills want specifies positions out of the expected array length', 603,
                  req, skillsWant));

                procOperations = -1;
                processCollector();
                return;
              }

              uProfile.persona.skills_want =
                iWAKeyword.unifyWords(skillsWant, language.abbreviation);

              procOperations |= 0x04;
              processCollector();
            } // End non-specified existing keywords
          }
        }); // End create new keywords
      });
    } else if ((sentSkillsWant.existing) &&
      (sentSkillsWant.existing.length > 0)) {

      // there isn't new keywords
      KeywordModel.countFromKeywordsRefs(sentSkillsWant.existing,
        language.abbreviation,
        function (err, numKeywords) {
          if (procOperations < 0) {
            return;
          }

          if (numKeywords !== sentSkillsWant.existing.length) {
            helperPreMiddlewares.traceErrors(req, new iWAErrors.ClientAttack('Controller: user # ' +
              'Pre-middleware: parseProfileData | Nonexistent keyword references', 602, req,
              sentSkillsWant.existing), 602);

            procOperations = -1;
            processCollector();
            return;

          } else {

            uProfile.persona.skills_want =
              iWAKeyword.unifyWords(sentSkillsWant.existing, language.abbreviation);

            procOperations |= 0x04;
            processCollector();
          }
        }); // End count keyword references
    } else {
      procOperations |= 0x04;
      uProfile.persona.skills_want = [];
      processCollector();
    }
  }; // End function "skills want" computation


  function processCollector() {

    var valiation;

    if (procOperations < 0) {
      helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');
      next();
      return;
    }

    if (procOperations === 0x07) {
      valiation = iWAUser.validateObject(uProfile);

      if (valiation !== true) {
        // Some attribute value is wrong
        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.HttpRequest('Controller: user # Pre-middleware: parseProfileData | ' +
            'Some of the sent user\'s profile field, has a wrong type or  value. Validations ' +
            'details: ' + valiation));
        helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');
        return;

      } else {
        // We don't need update req.processed.userProfile, because we got the reference and we've changed
        // the proper object instance
        next();
      }
    }
  }


  // Straight away operations & operations calls
  if (uProfile.persona) {

    computeInterests();
    computeSkillsHave();
    computeSkillsWant();


    if (uProfile.persona.emails) {
        // parse emails
        uProfile.persona.emails.forEach(function (email) {
          if (email.address) {
            if (!uProfile.emails) {
              uProfile.emails = [];

            }

            uProfile.emails.push({
              address: email.address,
              verified: false,
              is_default: false
            });

          }
        });
    }


    if (uProfile.persona.telephone_nums) {
      // parse telephone numbers
      uProfile.persona.telephone_nums.forEach(function (tel) {

        if (!tel._id) {

          if (!uProfile.telephone_nums) {
            uProfile.telephone_nums = [];
          }

          uProfile.telephone_nums.push({
            number: tel.number,
            label: tel.label
          });
        }
      });
    }

//    if (uProfile.persona.social_network_accounts) {
//      // parse social network accounts
//      uProfile.persona.social_network_accounts.forEach(function (acc) {
//
//        if (!acc._id) {
//
//          if (!uProfile.social_network_accounts) {
//            uProfile.social_network_accounts = [];
//          }
//
//          if (acc.type === 'Twitter') {
//            uProfile.social_network_accounts.push({
//              type: acc.type,
//              account_name: acc.account_name,
//              status: 'unauthenticated'
//            });
//          } else {
//            uProfile.social_network_accounts.push({
//              type: acc.type,
//              account_id: acc.account_id,
//              status: 'unauthenticated'
//            });
//          }
//
//        }
//      });
//    }
  }
};
