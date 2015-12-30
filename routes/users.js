'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var userCtrl =  require(settings.ctrlsPath + '/user');
var usersCtrl = require(settings.ctrlsPath + '/users');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * User routes
 */
module.exports = [
  {
    path: '/users',
    pre: [
      userCtrl.middlewares.pre.authUserChecker
    ],
    post: helpers.middlewares.post.errorsManager,
    routes: [
      {
        path: 'info',
        method: 'post',
        action: usersCtrl.actions.getInfoFrom,
        pre: usersCtrl.middlewares.pre.parseUsersReqParams
      }
    ]
  }
];
