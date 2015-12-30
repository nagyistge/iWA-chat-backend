'use strict';

/**
 * Respond with a list of the matched keywords whose words start with the sent characters
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user has been authenticated
 *    # req.query should have:
 *      word: The first letters used to match keywords' words
 *                (Required, if it was not sent return http status 400)
 *      lang: language to use to match the words (Optional)
 *      limit: limit of matched words to return (Optional)
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');
// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAKeywords = require(settings.modelsPath + '/iwazat/keyword');


/**
 * Globals
 */
// Models
var KeywordModel;

//Initialize the non straight away global variables
(function initialize() {

  KeywordModel = iWAMongo.model(iWAKeywords);

}());

module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var matchCallback = function (err, keywords) {
    if (err) {
      helperGlobal.addError(req,
        new iWAErrors.Db('Controller: keyword # Action: match | Error when ' +
          'trying to get list of the keywords which match: ' + wordToMatch, 520, err), 520);
      sendResponse(req, res, next, post);
      return;
    }

    if (!keywords) {
      helperGlobal.addError(req, new iWAErrors.HttpRequest('Controller: keyword # Action: match |' +
        'Any keyword has been retrieved from the database witch match: ' + wordToMatch, 404, req),
        404);
      sendResponse(req, res, next, post);
      return;
    }

    sendResponse(req, res, next, post, keywords);
  };

  var wordToMatch = req.query.word;
  if (!wordToMatch) {
    helperGlobal.addError(req,
      new iWAErrors.HttpRequest('Controller: keyword # Action: match | The word parameter has not '
        + 'been sent', 400, req), 400);
    sendResponse(req, res, next, post);
  }

  if ((req.query.lang) && (req.query.limit)) {
    KeywordModel.match(wordToMatch, req.query.lang, parseInt(req.query.limit), matchCallback);
  } else {
    if (req.query.lang) {
      KeywordModel.match(wordToMatch, req.query.lang, matchCallback);
    } else if (req.query.limit) {
      KeywordModel.match(wordToMatch, parseInt(req.query.limit), matchCallback);
    } else {
      KeywordModel.match(wordToMatch, matchCallback);
    }
  }
};

function sendResponse(req, res, next, post, keywordsList) {
  // if there are errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, keywordsList);
  post(null, req, res);
}
