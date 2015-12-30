'use strict';

var settings = require('../../../settings.js');
var should = require('should');
var utilUrls = require(settings.libsPath + '/ifc/util/urls');

describe('libs/util/urls', function () {

	describe('parse web host names url in text', function () {
		it('should an array empty array if no input text is provided', function () {

			var urlsInfo = utilUrls.parseWebHostDomainNames();

			urlsInfo.should.be.empty;
		});

		it('should an array with one url information object when only there is one url in the input ' +
			'text',
			function () {
				var urlsInfo = utilUrls.parseWebHostDomainNames('I wrote a blog post regarding streaming audio in' +
					' real time with NodeJS, it might have exactly the information you\'re looking for to get ' +
					'started: http://pedromtavares.wordpress.com/2012/12/28/streaming-audio-on-the-web-with' +
					'-nodejs/');

				urlsInfo.length.should.be.eql(1);

				urlsInfo[0].should.be.eql({
					url: 'http://pedromtavares.wordpress.com/2012/12/28/streaming-audio-on-the-web-with-nodejs/',
					protocol: 'http',
					indexes: {
						start: 145,
						end: 230
					}
				});
			});

		it('should an array with two url information object when only there is one url in the input ' +
			'text',
			function () {
				var urlsInfo = utilUrls.parseWebHostDomainNames('Take a look to my post: http://pedromtavares' +
					'.wordpress.com/2012/12/28/streaming-audio-on-the-web-with-nodejs/ and if you don\'t ' +
					'like, search in https://www.google.com and enjoy it.');

				urlsInfo.length.should.be.eql(2);

				urlsInfo[0].should.be.eql({
					url: 'http://pedromtavares.wordpress.com/2012/12/28/streaming-audio-on-the-web-with-nodejs/',
					protocol: 'http',
					indexes: {
						start: 24,
						end: 109
					}
				});

				urlsInfo[1].should.be.eql({
					url: 'https://www.google.com',
					protocol: 'https',
					indexes: {
						start: 143,
						end: 165
					}
				});

			});

	}) // pattern compilation
});
