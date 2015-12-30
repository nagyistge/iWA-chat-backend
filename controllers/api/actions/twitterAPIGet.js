'use strict';

/**
 *
 *  Pre conditions:
 *    # req.processed.twitterQuery must exist and has the attributes: 'resource' and 'query'
 *
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

// Utils
var uInspect = require('util').inspect;

/**
 * Globals
 */
var twit;


// Initialization of non-straight away variables
(function initialize() {

  var twitterCnf = require(settings.configsPath + '/twitter');
  var configLoader = require(settings.libsPath + '/iwazat/util/config');
  var twitterAppCnf = configLoader.getConfiguration(twitterCnf, 'API_Wrapper');

  twit = new (require('twit'))({
    consumer_key: twitterAppCnf.consumer_key,
    consumer_secret: twitterAppCnf.consumer_secret,
    access_token: twitterAppCnf.access_token,
    access_token_secret: twitterAppCnf.access_token_secret
  });

}());


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }


  var twitterQuery = req.processed.twitterQuery;
  var twitterPath = twitterQuery.resource + '/' + twitterQuery.query;

  var twitCallback = function (err, reply) {
    if (err) {

      helperGlobal.addError(req, new iWAErrors.UnderlyingSystem('Controller: api # ' +
        'Action: twitterAPIGet | Twitter API error; query path: ' + twitterPath + ' #  params: ' +
        uInspect(twitterQuery.params), 533, err), 533);
      sendResponse(req, res, post);

    } else {
      sendResponse(req, res, post, reply);
    }
  };

  if (twitterQuery.params) {
    twit.get(twitterPath, twitterQuery.params, twitCallback);
  } else {
    twit.get(twitterPath, twitCallback);
  }
};

function sendResponse(req, res, post, twitterReply) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, twitterReply);
  post(null, req, res);
}
