'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var userCtrl = require(settings.ctrlsPath + '/user');
var eventCtrl = require(settings.ctrlsPath + '/event');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * User routes
 */
module.exports = [
  {
    path: '/user/logout',
    method: 'get',
    action: userCtrl.actions.logout,
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/user/mysession',
    method: 'get',
    action: userCtrl.actions.currentSessionStatus,
    post: helpers.middlewares.post.errorsManager
  },
  {
    // This action allows to check if the user has a valid authenticated session, allowing to
    // the frontend knows about it
    path: '/user/isLoggedIn',
    method: 'get',
    action: userCtrl.actions.authEndPoint,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      userCtrl.middlewares.pre.authentication
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: /^\/user\/access\/(twitter|linkedin|facebook|google)(?:\/event\/([\da-f]{24,24}))?$/,
    method: 'get',
    action: userCtrl.actions.authEndPoint,
    pre: [
      userCtrl.middlewares.pre.parseAuthUrlParams,
      userCtrl.middlewares.pre.authentication,
      // Next pre-middlewares and action only will be called if the session contains an authenticated
      // user,s o user has been authenticated before and this request shouldn't have been sent
      userCtrl.middlewares.pre.registration,
      eventCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  { // This route manage the use case: Add new social network account the logged user
    path: /^\/user\/access\/(twitter|linkedin|facebook|google)\/(callback)/,
    method: 'get',
    action: userCtrl.actions.addSocialNetwork,
    pre: userCtrl.middlewares.pre.setAddSocialNetworkAcc,
    post: helpers.middlewares.post.errorsManager
  },
  { // This route manage the authentication process from the social network accounts
    path: /^\/user\/access\/(twitter|linkedin|facebook|google)\/(callback)/,
    method: 'get',
    action: userCtrl.actions.authEndPoint,
    pre: [
      userCtrl.middlewares.pre.parseAuthUrlParams,
      userCtrl.middlewares.pre.authentication,
      userCtrl.middlewares.pre.registration,
      eventCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: /^\/user\/access\/(twitter|linkedin|facebook|google)\/(data_collector)/,
    method: 'get',
    action: userCtrl.actions.authEndPoint,
    pre: [
      userCtrl.middlewares.pre.parseAuthUrlParams,
      userCtrl.middlewares.pre.authentication,
      userCtrl.middlewares.pre.registration,
      eventCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: /^\/user\/access\/(local)(?:\/event\/([\da-f]{24,24}))?$/,
    method: 'post',
    action: userCtrl.actions.authEndPoint,
    pre: [
      userCtrl.middlewares.pre.parseAuthUrlParams,
      userCtrl.middlewares.pre.authentication,
      userCtrl.middlewares.pre.registration,
      eventCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: /^\/user\/socialnetwork\/(twitter|linkedin|facebook|google)\/(add)$/,
    method: 'get',
    action: userCtrl.actions.addSocialNetwork,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      userCtrl.middlewares.pre.setAddSocialNetworkAcc

    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/user', //This route accepts user document attributes name to setup a mongoose.find
    // filter and only get some user attributes
    method: 'get',
    action: userCtrl.actions.retrieve,
    pre: userCtrl.middlewares.pre.authUserChecker,
    post: helpers.middlewares.post.errorsManager,
    routes: [
      {
        path: 'events',
        method: 'get',
        action: userCtrl.actions.myEvents
      },
      {
        path: 'favouriteusers',
        method: 'get',
        action: userCtrl.actions.favouriteUsers
      }
    ]
  },
  {
    path: '/user',
    method: 'put',
    action: userCtrl.actions.update,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      userCtrl.middlewares.pre.filterProfileData,
      userCtrl.middlewares.pre.parseProfileData
    ],
    post: helpers.middlewares.post.errorsManager
  }
];
