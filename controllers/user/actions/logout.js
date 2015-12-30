
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

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

module.exports = function(req, res, next, post) {

  iWASession.userLogOut(req.session, function(err) {
    if (err) {
      helperGlobal.addError(req, new iWAErrors.UnderlyingSystem(
        'Controller: user # Action: logout | Error when trying to invalidating the user\'s ' +
          'session', 531, err), 531);

      helperActions.respAllIssues(req, res, post);
      return;
    }

    res.send(200);
    post(null, req, res);
  });
};
