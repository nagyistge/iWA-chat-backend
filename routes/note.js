'use strict';

var settings = require('../settings.js');

/**
 * Dependencies
 */
var noteCtrl = require(settings.ctrlsPath + '/note');
var userCtrl = require(settings.ctrlsPath + '/user');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * Event routes
 */
module.exports = [
  {
    path: '/note',
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
    ],
    post: helpers.middlewares.post.errorsManager,
    routes: [
      {
        path: '/get',
        method: 'post',
        action: noteCtrl.actions.getNotes,
        pre: [
          helpers.middlewares.pre.parseStandardQuery,
          noteCtrl.middlewares.pre.createQueryUserNotes
        ]
      },
      {
        path: '/new',
        method: 'post',
        action: noteCtrl.actions.newNote,
        pre: noteCtrl.middlewares.pre.parseNoteData
      }
    ]
  }
];
