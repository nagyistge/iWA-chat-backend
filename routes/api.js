'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var apiCtrl = require(settings.ctrlsPath + '/api');
var userCtrl = require(settings.ctrlsPath + '/user');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * User routes
 */
module.exports = [
	{
		path: '/api/twitter/get/help/configuration/:configKey?',
		method: 'get',
		action: apiCtrl.actions.twitterAPIHelpConfig,
		pre:userCtrl.middlewares.pre.authUserChecker,
		post: helpers.middlewares.post.errorsManager
	},
  { // Important this route use regular expressions, so of above routes fall out in this
	  // if they call next or they are moved below
    path: /api\/twitter\/get\/([a-z]+)\/([a-z]+)(?:\/([\w=&]+))*/,
    method: 'get',
    action: apiCtrl.actions.twitterAPIGet,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      apiCtrl.middlewares.pre.twitterAPIGetQueryParser,
      apiCtrl.middlewares.pre.twitterAPIWhiteListFilter
    ],
    post: helpers.middlewares.post.errorsManager
  }
];
