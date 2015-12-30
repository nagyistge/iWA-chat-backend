'use strict';


var settings = require('../../../../settings.js');
var should = require('should');
var filters = require(settings.servicesPath + '/iwazat/twitter/dealer/filters/index');
var abstract = require(settings.servicesPath + '/iwazat/twitter/dealer/filters/abstract');
var iWazatTweet = require(settings.servicesPath + '/iwazat/twitter/dealer/filters/iWazatTweet');


describe('filters/index', function () {

	it('iWazatTweet should be an inherited class object instance of abstract filter', function () {

		filters.iWazatTweet.should.be.an.instanceOf(abstract);
		filters.iWazatTweet.should.be.an.instanceOf(iWazatTweet);

	});

});
