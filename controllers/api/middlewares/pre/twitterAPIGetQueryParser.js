'use strict';

/**
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # (Recommended) User should be authenticated
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

// Utils
var uInspect = require('util').inspect;


module.exports = function (req, res, next) {

	var twitterQuery = {};
	var tParams;
	var tParam;
	var pi;

	switch (req.params.length) {
		case 3:
			if (undefined !== req.params[2]) {
				tParams = req.params[2].split('&');
				twitterQuery.params = {};

				for (pi = 0; pi < tParams.length; pi++) {
					tParam = tParams[pi].split('=');

					if (2 === tParam.length) {
						twitterQuery.params[tParam[0]] = tParam[1];
					} else {
						helperPreMiddlewares.traceErrors(req,
							new iWAErrors.HttpRequest('Controller: api # Pre-middleware: ' +
								'twitterAPIGetQueryParser | Wrong parameters for a twitter query API\'s request; ' +
								'Received query\'s parameters: ', uInspect(req.params[2]), 400, req));

						helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'api twitter');
						return;
					}
				}
			}

		case 2:
			twitterQuery.resource = req.params[0];
			twitterQuery.query = req.params[1];
			helperPreMiddlewares.addProcessedData(req, 'twitterQuery', twitterQuery, false);
			next();

			break;
		default:
			helperPreMiddlewares.traceErrors(req,
				new iWAErrors.HttpRequest('Controller: api # Pre-middleware: twitterAPIGetQueryParser | ' +
					'Wrong twitter query API\'s request; required at least 2 and not more than 3 request ' +
					'parameters interpreted as , in the next exact order, \'twitter resource\', \'twitter ' +
					'query\', \'twitter query params\'. Receied request\'s parameters: ' +
					uInspect(req.params), 400, req));

			helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'api twitter');
	}
};
