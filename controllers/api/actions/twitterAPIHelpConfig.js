'use strict';

/**
 *
 *  Pre conditions:
 *    # req.processed.twitterQuery must exist and has the attributes: 'resource' and 'query'
 *
 */


module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
// Action helpers
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;

// Services
var ttConfigManager = require(settings.servicesPath + '/iwazat/twitter/assistant/configManager');

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// Utils
var uInspect = require('util').inspect;


module.exports = function (req, res, next, post) {

	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}


	function getConfigCallback(err, value) {
		if (err) {
			helperGlobal.addError(req,
				new iWAErrors.HttpRequest('Controller: api # Action: twitterAPIHelpConfig | No ' +
					'configuration value returned. Error details: ' + err.message, 404, req), 404);
			sendResponse(req, res, post);
		}

		sendResponse(req, res, post, value);
	}

	var configKey = req.params.configKey;

	if (configKey) {
		ttConfigManager.getConfigValue(configKey, getConfigCallback);
	} else {
		ttConfigManager.getConfigValue(getConfigCallback);
	}

};

function sendResponse(req, res, post, configValues) {
	// is there errors the helper will send the response
	if (helperActions.respAllIssues(req, res, post)) {
		return;
	}

	res.json(200, configValues);
	post(null, req, res);
}
