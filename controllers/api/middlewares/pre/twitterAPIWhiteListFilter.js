'use strict';

/**
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.processed.twitterQuery must exist and has the attributes: 'resource' and 'query'
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
var uInspect = require('util').inspect;
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;
//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');


/**
 * Globals
 */
// Format --> Object whose attributes names are the twitter resource (i.e. users, timeline, ...) and
// their values the allowed queries in each scope (i.e. show, tweets, ...)
var twitterAPIWhileList = {
  users: {
    show: true
  }
};

module.exports = function (req, res, next) {

  var twitterQuery = req.processed.twitterQuery;

  if (twitterAPIWhileList[twitterQuery.resource] &&
    twitterAPIWhileList[twitterQuery.resource][twitterQuery.query]) {
    next();

  } else {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: api # Pre-middleware: twitterAPIWhiteListFilter | ' +
        'Non-allowed twitter API\'s query. Query\'s details: ' + uInspect(twitterQuery), 401, req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 401, 'api twitter');
  }

};
