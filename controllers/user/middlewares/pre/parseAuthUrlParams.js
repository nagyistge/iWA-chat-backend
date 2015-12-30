'use strict';

/**
 * Populate the request with the parameters parse by the access url regular expression to named
 * parameters, for avoiding that changes in the route affect the next middlewares and actions
 * implementations, so this middleware must be called first.
 *
 *  Pre-Middleware type: frontline
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

module.exports = function (req, res, next) {

  var accessType = req.params[0];
  var eventOrCb = req.params[1];

  if (eventOrCb === 'callback') {
    helperPreMiddlewares.addProcessedData(req, 'authentication',
      {
        accessType: accessType,
        callback: true
      }, false);

  } else if (eventOrCb === 'data_collector') {

    helperPreMiddlewares.addProcessedData(req, 'authentication',
      {
        accessType: accessType,
        data_collector: true
      }, false);

  } else {
    helperPreMiddlewares.addProcessedData(req, 'authentication', {accessType: accessType}, false);

    if (eventOrCb) {
      helperPreMiddlewares.addProcessedData(req, 'event', { id: eventOrCb }, false);
    }
  }

  next();
};
