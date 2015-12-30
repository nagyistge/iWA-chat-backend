'use strict';

/**
 * The action update three involved questions in the specified event about of authenticated user
 * tha launch the request.
 *
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authorized to access to this event
 *    # req.processed must exist
 *    # req.processed.event  must exist and it must be an object with the next attributes
 *    {
 *      id: Event id to update
 *    }
 *
 *    # req.body object may have the next attributes
 *    {
 *      [new] : {
 *          [interests]: {
 *            [lang]: {Array} The new words (words which aren't registered in any keyword)
 *          },
 *          [skills_have]: {
 *            [lang]: {Array} The new words (words which aren't registered in any keyword)
 *          },
 *          [skills_want]: {
 *            [lang]: {Array} The new words (words which aren't registered in any keyword)
 *          }
 *      },
 *      [add]: {
 *          [interests]: {Array} The involved interests that the user requests to add
 *          [skills_have]: {Array} Then involved skills have that the user requests to add
 *          [skills_want]: {Array} Then involved skills want that the user requests to add
 *      },
 *      [remove]: {
 *          [interests]: {Array} The involved interests that the user requests to remove
 *          [skills_have]: {Array} Then involved skills have that the user requests to remove
 *          [skills_want]: {Array} Then involved skills want that the user requests to remove
 *      },
 *    }
 *
 *    The 'new' attribute of req.body is optional because if one of them doesn't exist then means that
 *    the user has not requested that action for any of the 3Q. Moreover 3Q attributes are optional
 *    because it has the same meaning of this.
 *
 *    Each array into req.body.new have to specify one attribute for each language where some new
 *    word is requested to add and its value is an array with the words to add. A new word is an
 *    object that has the next attributes:
 *    {
 *      word: The string with the word to add
 *      position: The number of the position of the word into the array (of the same question) created
 *        but the union of the new and add keywords. So when the two arrays are merged and this array
 *        keeps the position of the update array elements shifting the elements one position when one
 *        new word is requested in its position.
 *        For example:
 *          update: ['a', 'b', 'z']
 *          new: [ {word: 'y', position: 1}, {word: 'w', position: 2}]
 *
 *          result: ['a', 'y', 'w', 'b', 'z']
 *    }
 *
 *    The two other attributes of req.body (add & remove) are optional because if one of them doesn't
 *    exist then means that the user has not requested that action for any of the 3Q. Moreover 3Q
 *    attributes are optional because it has the same meaning of the commented actions (add & remove)
 *
 *    The structure of each object into each 3Q arrays is:
 *    {
 *      keyword_id: Keyword id
 *      word_id: Word id bound to the keyword
 *      lang: The language of the word
 *    }
 */

// TODO it need testing because after the test of the first implementation I added the new keywords
// to add

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
var iWAEvent = require(settings.modelsPath + '/iwazat/event');
var iWAKeyword = require(settings.modelsPath + '/iwazat/keyword');


/**
 * Globals
 */
// Models
var EventModel;
var KeywordModel;

//Initialize the non straight away global variables
(function initialize() {

  EventModel = iWAMongo.model(iWAEvent);
  KeywordModel = iWAMongo.model(iWAKeyword);

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }


  var eventId = req.processed.event.id;
  var userId = iWASession.getAuthUser(req.session).id;
  var counter; // Variable used for several purposes, i.e. counter the number of callback executed
  var totalAffected = 0;
  var numAffectedExpected = 0;
  var interestsUpdate = {
    add: null,
    update: false
  };
  var skillsHaveUpdate = {
    add: null,
    update: false
  };
  var skillsWantUpdate = {
    add: null,
    update: false
  };
  var keywordRefsList = [];


  if (req.body.new) {
    newKeywords();
  } else {
    processKeywords();
  }

  /**************** Functions used to process the request ********************/

    // Callback function to use in each update of the 3Q array
  function updateCbsCollector(err, numAffected) {

    if (counter < 0) {
      return;
    }

    counter--;

    if (err) {
      counter = -1;
      helperGlobal.addError(req, new iWAErrors.Db('Controller: event # Action: ' +
        'threeInvolvedQ | some of the multiples database operations failed', 524, req), 524);
      sendResponse(req, res, next, post);
      return;
    }

    totalAffected += numAffected;

    if (counter === 0) {
      if (totalAffected === numAffectedExpected) {
        sendResponse(req, res, next, post, totalAffected + ' keywords involved');
      } else {
        helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # Action: ' +
          'threeInvolvedQ | the total of keyword references update is different of the total expected',
          602, req), 602);
        sendResponse(req, res, next, post);
      }
    }
  }

  // Function to update the 3Q arrays of the event
  function update3Qs() {
    counter = 0;

    if (interestsUpdate.update === true) {
      counter++;
      EventModel.updateInvolvedInterests(eventId, userId, interestsUpdate.add,
        interestsUpdate.remove, updateCbsCollector);
    }

    if (skillsHaveUpdate.update === true) {
      counter++;
      EventModel.updateInvolvedSkillsHave(eventId, userId, skillsHaveUpdate.add,
        skillsHaveUpdate.remove, updateCbsCollector);
    }

    if (skillsWantUpdate.update === true) {
      counter++;
      EventModel.updateInvolvedSkillsWant(eventId, userId, skillsWantUpdate.add,
        skillsWantUpdate.remove, updateCbsCollector);
    }
  }

  // Function to register the non-existing keywords
  function newKeywords() {
    var lang;
    counter = 0;


    if (req.body.new.interests) {
      for (lang in req.body.new.interests) {
        if (req.body.new.interests[lang].length > 0) {
          interestsUpdate.add = [];

          req.body.new.interests[lang].forEach(function (newWord) {
            var currentLang = lang;
            counter++;

            KeywordModel.getKeywords(newWord.word, currentLang, function (err, keyword) {
              if (counter < 0) {
                return;
              }

              if (err) {
                counter = -1;
                helperGlobal.addError(req, new iWAErrors.Db(
                  'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
                  ' for interests with the language:' + currentLang, 524, err), 524);
                sendResponse(req, res, next, post);
                return;
              }

              if (keyword) {
                interestsUpdate.add[newWord.position] = {
                  keyword_id: keyword.keyword_id,
                  word_id: keyword.word_id,
                  lang: currentLang
                };
              }

              counter--;

              if (counter === 0) {
                processKeywords();
              }
            });
          });
        } // End check new interests words non-empty

//        KeywordModel.getKeywords(req.body.new.interests[lang], lang, function (err, keywords) {
//          if (counter < 0) {
//            return;
//          }
//
//          if (err) {
//            counter = -1;
//            helperGlobal.addError(req, new iWAErrors.Db(
//              'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
//              ' for interests with the language:' + lang, 524, err), 524);
//            sendResponse(req, res, next, post);
//            return;
//          }
//
//          if ((keywords) && (keywords.length > 0)) {
//            interestsUpdate.add = [];
//
//            keywords.forEach(function (kword) {
//              interestsUpdate.add.push({
//                keyword_id: kword.keyword_id,
//                word_id: kword.word_id,
//                lang: lang
//              });
//            });
//          }
//
//          counter--;
//
//          if (counter === 0) {
//            processKeywords();
//          }
//        });
      }
    } // End to figure out the new interests keywords

    if (req.body.new.skills_have) {
      for (lang in req.body.new.skills_have) {
        if (req.body.new.skills_have[lang].length > 0) {
          skillsHaveUpdate.add = [];

          req.body.new.skills_have[lang].forEach(function (newWord) {
            var currentLang = lang;
            counter++;

            KeywordModel.getKeywords(newWord.word, currentLang, function (err, keyword) {
              if (counter < 0) {
                return;
              }

              if (err) {
                counter = -1;
                helperGlobal.addError(req, new iWAErrors.Db(
                  'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
                  ' for interests with the language:' + currentLang, 524, err), 524);
                sendResponse(req, res, next, post);
                return;
              }

              if (keyword) {
                skillsHaveUpdate.add[newWord.position] = {
                  keyword_id: keyword.keyword_id,
                  word_id: keyword.word_id,
                  lang: currentLang
                };
              }

              counter--;

              if (counter === 0) {
                processKeywords();
              }
            });
          });
        } // End check new skills_have words non-empty

//        counter++;
//        KeywordModel.getKeywords(req.body.new.skills_have[lang], lang, function (err, keywords) {
//          if (counter < 0) {
//            return;
//          }
//
//          if (err) {
//            counter = -1;
//            helperGlobal.addError(req, new iWAErrors.Db(
//              'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
//              ' for skills have with the language:' + lang, 524, err), 524);
//            sendResponse(req, res, next, post);
//            return;
//          }
//
//          if ((keywords) && (keywords.length > 0)) {
//            skillsHaveUpdate.add = [];
//
//            keywords.forEach(function (kword) {
//              skillsHaveUpdate.add.push({
//                keyword_id: kword.keyword_id,
//                word_id: kword.word_id,
//                lang: lang
//              });
//            });
//          }
//
//          counter--;
//
//          if (counter === 0) {
//            processKeywords();
//          }
//        });
      }
    } // End to figure out the new skills have keywords

    if (req.body.new.skills_want) {
      for (lang in req.body.new.skills_want) {
        if (req.body.new.skills_want[lang].length > 0) {

          skillsWantUpdate.add = [];

          req.body.new.skills_want[lang].forEach(function (newWord) {
            var currentLang = lang;
            counter++;

            KeywordModel.getKeywords(newWord.word, currentLang, function (err, keyword) {
              if (counter < 0) {
                return;
              }

              if (err) {
                counter = -1;
                helperGlobal.addError(req, new iWAErrors.Db(
                  'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
                  ' for interests with the language:' + currentLang, 524, err), 524);
                sendResponse(req, res, next, post);
                return;
              }

              if (keyword) {
                skillsWantUpdate.add[newWord.position] = {
                  keyword_id: keyword.keyword_id,
                  word_id: keyword.word_id,
                  lang: currentLang
                };
              }

              counter--;

              if (counter === 0) {
                processKeywords();
              }
            });
          });
        } // End check new skills_have words non-empty

//        counter++;
//        KeywordModel.getKeywords(req.body.new.skills_want[lang], lang, function (err, keywords) {
//          if (counter < 0) {
//            return;
//          }
//
//          if (err) {
//            counter = -1;
//            helperGlobal.addError(req, new iWAErrors.Db(
//              'Controller: event # Pre-middleware: threeInvolvedQ | Error to create the new keywords',
//              ' for skills want with the language:' + lang, 524, err), 524);
//            sendResponse(req, res, next, post);
//            return;
//          }
//
//          if ((keywords) && (keywords.length > 0)) {
//            skillsWantUpdate.add = [];
//
//            keywords.forEach(function (kword) {
//              skillsWantUpdate.add.push({
//                keyword_id: kword.keyword_id,
//                word_id: kword.word_id,
//                lang: lang
//              });
//            });
//          }
//
//          counter--;
//
//          if (counter === 0) {
//            processKeywords();
//          }
//        });
      }
    } // End to figure out the new skills want keywords

  } // End function newKeywords

  // Function to process all the keywords
  function processKeywords() {
    var it;
    counter = 0;

    if (req.body.add) {

      if ((Array.isArray(req.body.add.interests)) && (req.body.add.interests.length > 0)) {
        counter++;

        if (interestsUpdate.add) {
          it = 0;

          req.body.add.interests.forEach(function(kWord) {
            do {
              if (interestsUpdate.add[it] === undefined) {
                interestsUpdate.add[it] = kWord;
                kWord = false;
              }

              it++;
            } while(kWord !== false);
          });

        } else {
          interestsUpdate.add = req.body.add.interests;
        }

        keywordRefsList.push.apply(keywordRefsList, req.body.add.interests);
        numAffectedExpected += req.body.add.interests.length;
        interestsUpdate.update = true;
      }

      if ((Array.isArray(req.body.add.skills_have)) && (req.body.add.skills_have.length > 0)) {
        counter++;

        if (skillsHaveUpdate.add) {
          it = 0;

          req.body.add.skills_have.forEach(function(kWord) {
            do {
              if (skillsHaveUpdate.add[it] === undefined) {
                skillsHaveUpdate.add[it] = kWord;
                kWord = false;
              }

              it++;
            } while(kWord !== false);
          });

        } else {
          skillsHaveUpdate.add = req.body.add.skills_have;
        }

        keywordRefsList.push.apply(keywordRefsList, req.body.add.skills_have);
        numAffectedExpected += req.body.add.skills_have.length;
        skillsHaveUpdate.update = true;
      }

      if ((Array.isArray(req.body.add.skills_want)) && (req.body.add.skills_want.length > 0)) {
        counter++;

        if (skillsHaveUpdate.add) {
          it = 0;

          req.body.add.skills_want.forEach(function(kWord) {
            do {
              if (skillsWantUpdate.add[it] === undefined) {
                skillsWantUpdate.add[it] = kWord;
                kWord = false;
              }

              it++;
            } while(kWord !== false);
          });

        } else {
          skillsWantUpdate.add = req.body.add.skills_want;
        }

        keywordRefsList.push.apply(keywordRefsList, req.body.add.skills_want);
        numAffectedExpected += req.body.add.skills_want.length;
        skillsWantUpdate.update = true;
      }

      if (counter > 0) {
        KeywordModel.countFromKeywordsRefs(keywordRefsList, function (err, numKeywords) {

          if (numKeywords !== keywordRefsList.length) {
            helperGlobal.addError(req, new iWAErrors.ClientAttack('Controller: event # Action: ' +
              'threeInvolvedQ | Nonexistent keyword references', 602, req, keywordRefsList), 602);
            sendResponse(req, res, next, post);
          } else {
            update3Qs();
          }
        }); // End count keyword references
      } // End check existing keywords
    } else {
      interestsUpdate.add = null;
      skillsHaveUpdate.add = null;
      skillsWantUpdate.add = null;
    }


    if (req.body.remove) {
      if (counter > 0) {
        counter = -4;
      }

      if ((Array.isArray(req.body.remove.interests)) && (req.body.remove.interests.length > 0)) {
        counter++;
        interestsUpdate.remove = req.body.remove.interests;
        numAffectedExpected += interestsUpdate.remove.length;
        interestsUpdate.update = true;
      } else {
        interestsUpdate.remove = null;
      }

      if ((Array.isArray(req.body.remove.skills_have)) &&
        (req.body.remove.skills_have.length > 0)) {
        counter++;
        skillsHaveUpdate.remove = req.body.remove.skills_have;
        numAffectedExpected += skillsHaveUpdate.remove.length;
        skillsHaveUpdate.update = true;
      } else {
        skillsHaveUpdate.remove = null;
      }

      if ((Array.isArray(req.body.remove.skills_want)) &&
        (req.body.remove.skills_want.length > 0)) {
        counter++;
        skillsWantUpdate.remove = req.body.remove.skills_want;
        numAffectedExpected += skillsWantUpdate.remove.length;
        skillsWantUpdate.update = true;
      } else {
        skillsWantUpdate.remove = null;
      }

      if (counter > 0) {
        update3Qs();
        return;
      }

    } else {
      interestsUpdate.remove = null;
      skillsHaveUpdate.remove = null;
      skillsWantUpdate.remove = null;
    }


    if (counter === 0) {
      sendResponse(req, res, next, post, 'nothing updated');
    }
  }
};


/**
 *  Function to unify the response
 */
function sendResponse(req, res, next, post, message) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.send(200, message);
  post(null, req, res);
}