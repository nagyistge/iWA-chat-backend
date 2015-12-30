'use strict';

/**
 * Dependencies
 */
var settings = require('../settings');
var express = require('express');
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');


module.exports = {
	iWazat_brain: {
		development: {
			http: {
				port: 8010,
				hostname: 'localhost',
				publicBaseUrl: 'localhost:8010'
			},
			subsystems: {
				twitterFarmer: {
					child: {
						method: 'fork',
						exec: settings.servicesPath + '/iwazat/twitter/farmerRunner',
						args: [],
						options: {
							cwd: settings.servicesPath + '/iwazat/twitter',
							env: process.env
							//execPath: '/home/ifraixedes/Apps/node_0.8/bin/node'
						},
						disconnect: true
					},
					chain: {
						id: 'main',
						pos: 0
					}
				},
				twitterDealer: {
					child: {
						method:'fork',
						exec: settings.servicesPath + '/iwazat/twitter/dealer/runner',
						args: [],
						options: {
							cwd: settings.servicesPath + '/iwazat/twitter/dealer',
							env: process.env
							//execPath: '/home/ifraixedes/Apps/node_0.8/bin/node'
						},
						disconnect: true
					},
					chain: {
						id: 'main',
						pos: 1
					}
				}
			},
			express_middlewares: [
				function () {
					var stylus = require('stylus');
					var nib = require('nib');

					return stylus.middleware({
						serve: false,
						force: true,
						src: settings.uiPath,
						dest: settings.publicPath,
						compile: function (str, path) {
							return stylus(str)
								.set('compress', false)
								//.set('firebug', true)
								.set('linenos', true)
								.set('filename', path)
								.use(nib())
								.define('url', stylus.url({
									paths: [settings.publicPath + '/img'],
									limit: 30000 // 30 Kb
								}));
						}
					});

				}(),
				express.static(settings.publicPath),
				express.bodyParser(),
				settings.servicesPath + '/iwazat/session',
				iwaLogger.getExpressWinston('logger'), // Request logger
				settings.routesPath,
				iwaLogger.getExpressWinston('errorLogger') // Error logger
			]
		},
		pubdev: {
			http: {
				port: 8020,
				hostname: 'localhost',
				publicBaseUrl:'localhost:8020'
			},
			subsystems: {
				twitterFarmer: {
					child: {
						method:'fork',
						exec: settings.servicesPath + '/iwazat/twitter/farmerRunner',
						args: [],
						options: {
							cwd: settings.servicesPath + '/iwazat/twitter',
							env: process.env
							//execPath: '/home/ifraixedes/Apps/node_0.8/bin/node'
						},
						disconnect: true
					},
					chain: {
						id: 'main',
						pos: 0
					}
				},
				twitterDealer: {
					child: {
						method:'fork',
						exec: settings.servicesPath + '/iwazat/twitter/dealer/runner',
						args: [],
						options: {
							cwd: settings.servicesPath + '/iwazat/twitter/dealer',
							env: process.env
							//execPath: '/home/ifraixedes/Apps/node_0.8/bin/node'
						},
						disconnect: true
					},
					chain: {
						id: 'main',
						pos: 1
					}
				}
			},
			express_middlewares: [
				function () {
					var stylus = require('stylus');
					var nib = require('nib');

					return stylus.middleware({
						serve: false,
						force: true,
						src: settings.uiPath,
						dest: settings.publicPath,
						compile: function (str, path) {
							return stylus(str)
								.set('compress', false)
								//.set('firebug', true)
								.set('linenos', true)
								.set('filename', path)
								.use(nib())
								.define('url', stylus.url({
									paths: [settings.publicPath + '/img'],
									limit: 30000 // 30 Kb
								}));
						}
					});
				}(),
				express.static(settings.publicPath),
				express.bodyParser(),
				settings.servicesPath + '/iwazat/session',
				iwaLogger.getExpressWinston('logger'), // Request logger
				settings.routesPath,
				iwaLogger.getExpressWinston('errorLogger') // Error logger
			]
		},
		staging: {
			http: {
				port: 8010,
				hostname: 'staging.iwaz.at',
				publicBaseUrl:'staging.iwaz.at'
			},
			express_middlewares: [
				express.compress({
					windowBits: 15,
					level: 9,
					memLevel: 9,
					strategy: require('zlib').Z_FILTERED
				}),
				express.static(settings.publicPath),
				express.bodyParser(),
				settings.servicesPath + '/iwazat/session',
				iwaLogger.getExpressWinston('logger'), // Request logger
				settings.routesPath,
				iwaLogger.getExpressWinston('errorLogger') // Error logger
			],
			socketIO: {
				'browser client gzip': true
			}
		},
		beta: {
			http: {
				port: 8010,
			hostname: 'beta.iwaz.at',
			publicBaseUrl:'beta.iwaz.at'
			},
			express_middlewares: [
				express.compress({
					windowBits: 15,
					level: 9,
					memLevel: 9,
					strategy: require('zlib').Z_FILTERED
				}),
				express.static(settings.publicPath),
				express.bodyParser(),
				settings.servicesPath + '/iwazat/session',
				iwaLogger.getExpressWinston('logger'), // Request logger
				settings.routesPath,
				iwaLogger.getExpressWinston('errorLogger') // Error logger
			],
			socketIO: {
				'browser client gzip': true
			}
		}
	}
};