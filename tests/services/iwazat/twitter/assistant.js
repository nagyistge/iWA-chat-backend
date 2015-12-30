'use strict';


var settings = require('../../../../settings.js');
var should = require('should');
var configManagerPath = settings.servicesPath + '/iwazat/twitter/assistant/configManager';
var configManager = require(configManagerPath);

describe('assistant/configManager', function () {
	describe('update', function () {
		it('should create/update the twitter configuration information into redis and ' +
			'return the twitter configuration object',
			function (done) {

				configManager.update(function (err, tweetConfig) {

					if (err) {
						done(err);
						return;
					}

					if (tweetConfig !== null) {
						done();
					} else {
						done(new Error('The twitter configuration returned is not an object'));
					}

				});
			});
	});

});
