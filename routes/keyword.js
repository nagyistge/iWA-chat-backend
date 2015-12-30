'use strict';

/**
 * Keyword routes
 */
var settings = require('../settings.js');
var app = settings.expressApp;

/**
 * Dependencies
 */
var helpers = require(settings.ctrlsPath + '/_helpers');
var keywordCtrl = require(settings.ctrlsPath + '/keyword');
var userCtrl = require(settings.ctrlsPath + '/user');


/**
 * User routes
 */
module.exports = [
  {
    path: '/keywords/match',
    method: 'get',
    action: keywordCtrl.actions.match,
    pre:  userCtrl.middlewares.pre.authUserChecker,
    post: helpers.middlewares.post.errorsManager
  }
];


/**
 * Routes Scott
 */
//app.get('/keyword/search/:searchTerm', keywordCtrl.searchAction);
//app.get('/keyword/add/:keyword', keywordCtrl.addAction);
//
//if (settings.env == 'development') {
//  console.log('### Loaded: routes/keyword.js');
//}