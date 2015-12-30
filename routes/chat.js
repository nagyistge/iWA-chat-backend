'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var chatCtrl = require(settings.ctrlsPath + '/chat');
var userCtrl = require(settings.ctrlsPath + '/user');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * User routes
 */
module.exports= [
  {
    path: '/chats/user/list',
    method: 'get',
    action: chatCtrl.actions.getUserChats,
    pre: [
      userCtrl.middlewares.pre.authUserChecker
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/chat/msg/send',
    method: 'post',
    action: chatCtrl.actions.newMessage,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      chatCtrl.middlewares.pre.parseMessageData,
      chatCtrl.middlewares.pre.authorization,
      chatCtrl.middlewares.pre.retrieveReceivers
    ],
    post: [
      chatCtrl.middlewares.post.updatesPostNewMessage,
      helpers.middlewares.post.errorsManager
    ]
  },
  {
    path: '/chat/msg/last/:chatId',
    method: 'get',
    action: chatCtrl.actions.getMessages,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      chatCtrl.middlewares.pre.getLastMessage,
      chatCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/chat/msg/read',
    method: 'post',
    action: chatCtrl.actions.getMessages,
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      chatCtrl.middlewares.pre.parseMessageQuery,
      chatCtrl.middlewares.pre.authorization
    ],
    post: [
      chatCtrl.middlewares.post.updatesPostReadMessage,
      helpers.middlewares.post.errorsManager
    ]
  }
];
