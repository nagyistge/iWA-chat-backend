'use strict';

/**
 * The middleware expects to receive under req.body an user object that only have one element
 * into the personas array.
 *
 *
 *  Pre-Middleware type: frontline
 *
 *  Expected user's profile (req.body):
 *  {
 *      personas: [
 *        {
 *          nickname: 'string',
 *          bio: 'string',
 *          website: 'string',
 *          skills_want: true,
 *          skills_have: true,
 *          interests: true,
 *          emails: true,
 *          telephone_nums: true,
 *          companies: true,
 *          social_network_accounts: true,
 *          avatars: true
 *        }
 *      ]
 *  }
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

// Datasources
var iWAStatic = require(settings.dataSourcesPath + '/iwaStatic');

// utils
var screen = require('screener').screen;


module.exports = function (req, res, next) {

  var uDataSent = req.body;
  var uDataFiltered;


  if ((!uDataSent) || ('object' !== typeof uDataSent) || (Array.isArray(uDataSent))) {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: user # Pre-middleware: filterProfileData | ' +
        'Wrong data type. Expected an object', 400, req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');

    next();
    return;
  }


  // Remove fields that are banned to update straight away from an user profile update request
  uDataFiltered = screen(uDataSent, {
    personas: [
      {
        _id: /[a-fA-F0-9]{24,24}/,
        nickname: 'string',
        bio: 'string',
        website: 'string',
        skills_want: true,
        skills_have: true,
        interests: true,
        emails: true,
        telephone_nums: true,
        companies: true,
        //social_network_accounts: true,
        avatar: true
      }
    ]
  });

  // In the current release the users always have one persona
  if (uDataFiltered.personas.length > 1) {
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: user # Pre-middleware: filterProfileData | Incorrect ' +
        'number of personas to update, only one is allowed'));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');
    return;
  }


  if (Object.keys(uDataFiltered.personas[0]).length === 0) {
    // Nothing updated
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: user # Pre-middleware: filterProfileData | Any data ' +
        'to update or sent wrong user profile data types or values'));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');
    return;
  }

  uDataFiltered.persona = uDataFiltered.personas[0];
  delete uDataFiltered.personas;

  if (!uDataFiltered.persona._id) {
    // Nothing updated
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: user # Pre-middleware: filterProfileData | Persona\'s ' +
        'id is required'));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'user profile');
    return;
  }


  helperPreMiddlewares.addProcessedData(req, 'userProfile', uDataFiltered, false);

  // TODO: Language force to english in the current release - We need the language to compute the
  // keywords references

  helperPreMiddlewares.addProcessedData(req, 'system.language',
    iWAStatic.getLangByAbbreviation('en'), false);
  next();
}
;
