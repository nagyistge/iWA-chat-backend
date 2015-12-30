'use strict';

var settings = require('../settings.js');
var app = settings.expressApp;

/**
 * Dependencies
 */
var eventCtrl = require(settings.ctrlsPath + '/event');
var userCtrl = require(settings.ctrlsPath + '/user');
var helpers = require(settings.ctrlsPath + '/_helpers');

/**
 * Event routes
 */

module.exports = [
  {
    path: '/event/checks',
    pre: userCtrl.middlewares.pre.authUserChecker,
    post: helpers.middlewares.post.errorsManager,
    routes: [
      {
        path: 'newslug',
        method: 'post',
        action: eventCtrl.actions.checkNewSlug
      }
    ]
  },
  {
    path: '/event/create',
    method: 'post',
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      eventCtrl.middlewares.pre.filterEventData
    ],
    post: helpers.middlewares.post.errorsManager,
    action: eventCtrl.actions.newEvent
  },
	{
		path: '/event/update',
		method: 'put',
		pre: [
			userCtrl.middlewares.pre.authUserChecker,
			eventCtrl.middlewares.pre.filterEventData,
			// This middleware extract the event's id, it is required for the next one
			eventCtrl.middlewares.pre.filterEventUpdatableData,
			eventCtrl.middlewares.pre.authManagerChecker
		],
		post: helpers.middlewares.post.errorsManager,
		action: eventCtrl.actions.updateEvent
	},
  {
    path: '/event/:eventId',
    pre: [
      userCtrl.middlewares.pre.authUserChecker,
      eventCtrl.middlewares.pre.parseUrlParams,
      eventCtrl.middlewares.pre.authAccessChecker
    ],
    post: helpers.middlewares.post.errorsManager,
    routes: [
      {
        path: 'info',
        method: 'get',
        action: eventCtrl.actions.authorisedInfo,
        pre: eventCtrl.middlewares.pre.parseSpecAccessRight
      },
      {
        path: 'involved3q',
        method: 'put',
        action: eventCtrl.actions.threeInvolvedQ
      },
      {
        path: 'participantsranking',
        method: 'get',
        action: eventCtrl.actions.participantsRanking
      },
      { // Stream is timeline of the current collection of the event
        path: 'stream',
        method: 'get',
        action: eventCtrl.actions.getTimelineMessages,
        pre: [
          eventCtrl.middlewares.pre.setCurrentTimelineCol,
          eventCtrl.middlewares.pre.parseTimelineQuery
        ]
      },
      {
        path: 'timeline/:msgCollectionNum?',
        method: 'get',
        action: eventCtrl.actions.getTimelineMessages,
        pre: eventCtrl.middlewares.pre.parseTimelineQuery
      }
    ]
  },
//  {
//    path: '/event/:eventId/management',
//    pre: [
//      userCtrl.middlewares.pre.authUserChecker,
//      eventCtrl.middlewares.pre.parseUrlParams,
//      eventCtrl.middlewares.pre.authManagerChecker
//    ],
//    post: helpers.middlewares.post.errorsManager,
//    routes: [
//      {
//        path: 'stream',
//        routes: [
//          {
//            path: 'open',
//            method: 'put',
//            action: eventCtrl.actions.switchOnTimelineStream
//          },
//          {
//            path: 'close',
//            method: 'put',
//            action: eventCtrl.actions.switchOffTimelineStream
//          }
//        ]
//      }
//    ]
//  },
  {
    path: '/event/authorization/:eventId',
    method: 'get',
    action: eventCtrl.actions.authorisationStatus,
    pre:[
      userCtrl.middlewares.pre.authUserChecker,
      eventCtrl.middlewares.pre.parseUrlParams,
      eventCtrl.middlewares.pre.authorization
    ],
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/event/:eventRef',
    method: 'get',
    action: eventCtrl.actions.publicInfo,
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: '/events',
    method: 'get',
    action: eventCtrl.actions.list,
    post: helpers.middlewares.post.errorsManager
  },
  {
    path: /^\/(?:([\w\d.\-_]+)\/?)$/,
    method: 'get',
    action: eventCtrl.actions.publicHome,
    post: helpers.middlewares.post.errorsManager
  }
];