'use strict';

/**
 * The action returns the values needed to restore the session status in the single web application.
 * This action is useful to restore the frontend status when it was lost for example because a
 * refresh was launched or jumped out of the single web app context.
 *
 *
 * NOTE:
 * This action mustn't call next('route'), for security reasons
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');


module.exports = function (req, res, next, post) {

  var sessStatusDataObj;
  var sessData;

  if (!req.session) {
    sendResponse(req, res, post, 200);
    return;
  }


  sessData = iWASession.getAuthUser(req.session);

  if (!sessData) {
    sendResponse(req, res, post, 200);
    return;
  }

  sessStatusDataObj = {
    auth_user: {
      id: sessData.id,
      persona: {
        id: sessData.persona.id
      }
    }
  };

  sessData = iWASession.getEvents(req.session);

  if (sessData.length > 0) {
    sessStatusDataObj.events_auth = sessData;
  }

  sendResponse(req, res, post, 200, sessStatusDataObj);

};

function sendResponse(req, res, post, statusCode, dataObj) {

  if (dataObj) {
    res.json(statusCode, dataObj);
  } else {
    res.send(statusCode);
  }

  post(null, req, res);
}
