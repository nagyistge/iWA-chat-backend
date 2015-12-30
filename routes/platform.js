'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var platformCtrl = require(settings.ctrlsPath + '/platform');
var userCtrl = require(settings.ctrlsPath + '/user');
var usersCtrl = require(settings.ctrlsPath + '/users');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * User routes
 */
module.exports = [
  {
    path: '/platform/invite/unreguser',
    method: 'post',
    action: platformCtrl.actions.updateTwitterStatus,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
	    platformCtrl.middlewares.pre.parseUnregUserInvitation,
	    usersCtrl.middlewares.pre.checkInvitationUnregTwitterUser,
	    platformCtrl.middlewares.pre.composeUnregUserInvitationTweet
    ],
    post: helpers.middlewares.post.errorsManager
  }
];
