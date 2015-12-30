'use strict';


// Reference http://www.w3.org/Addressing/URL/url-spec.txt

/**
 * Constants
 */
//var URL_REGEXP = /((?:(https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?:\/[^\s]*)?)/gi;
//
//var URL_WITH_PORT_NUMBER = /((?:(https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?)/gi;
//
//var URL_WITH_PORT_NUMBER_WITH_LOCALHOST = /((?:(https?|ftp):\/\/)?(?:\S+(?::\S*)?@)(localhost|(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))))(?::\d{2,5})?(?:\/[^\s]*)?)/gi;


var URL_ELEMENTS = {
	HOSTNAME: '[a-zA-Z]+(?:[\\w\\-$@.&+!*"\'(),]|%[\\da-fA-F])*(?:\\.[a-zA-Z]+(?:[\\w\\-$@.&+!*"\'(),]|%[\\da-fA-F])*)*', // Add capture or non-capture group as required
	WWW_HOSTNAME: '[a-zA-Z]+[a-zA-Z0-9\\-"]*(?:\\.[a-zA-Z]{2,2}[a-zA-Z0-9\\-"]*)+', // Add capture or non-capture group as required
	WWW_HOST_DOMAIN_NAME: '[a-zA-Z]+[a-zA-Z0-9\\-"]*(?:\\.[a-zA-Z0-9\\-"]+)*(?:\\.[a-zA-Z]{2,})', // Add capture or non-capture group as required
	PORT: ':\\d{1,5}', // Add capture or non-capture group as required and ? if it is optional
	HOSTNUMBER_ONE_ELEMENT: '[1-9]|[1-9][\\d]|1[\\d]{2,2}|2[0-4][\\d]|25[0-4]', // x4 adding capture or non-capture group as required
	PATH: '/[\\w$\\-@.&+!*"\'(),]*|%[0-9a-fA-F]*', //Add capture or non-capture group and at the end add * or + depending if is required or not
	SEARCH_CAPTURE: '(?:\\?([\\w$\\-@.&+!*"\'(),]|%[0-9a-fA-F])+)', //Add ? if it is option
	SEARCH_NON_CAPTURE: '(?:\\?(?:[\\w$\\-@.&+!*"\'(),]|%[0-9a-fA-F])+)', //Add ? if it is option
	HASH_CAPTURE: '(?:#(.*))', //Add ? if it is option
	HASH_NON_CAPTURE: '(?:#(?:.*))' //Add ? if it is option
};

var WEB_HOST_DOMAIN_NAME_MATCH = {
	http: 'http://(?:{WWW_HOST_DOMAIN_NAME})(?:{PORT})?(?:{PATH})*{SEARCH_NON_CAPTURE}?{HASH_NON_CAPTURE}?',
	https: 'https://(?:{WWW_HOST_DOMAIN_NAME})(?:{PORT})?(?:{PATH})*{SEARCH_NON_CAPTURE}?{HASH_NON_CAPTURE}?',
	http_s: '(https?)://(?:{WWW_HOST_DOMAIN_NAME})(?:{PORT})?(?:{PATH})*{SEARCH_NON_CAPTURE}?{HASH_NON_CAPTURE}?'
};

//var twitter = /(?:https?:\/\/)?/;
// protocol: (?:https?:\/\/)?
// hostname: WWW_HOSTNAME
// port: PORT

var ELEMENT_REGEXP = /\{([\w]*)\}/g;

/**
 * Compile a pattern to produce a regular expression.
 *
 * @param pattern
 * @param regExpFlags The flags to set to the regular expression to create
 * @returns {RegExp}
 */
function compileRegExp(pattern, regExpFlags) {

	var compiledPattern = pattern;
	var element;

	while (null !== (element = ELEMENT_REGEXP.exec(pattern))) {
		compiledPattern = compiledPattern.replace(element[0], URL_ELEMENTS[element[1]]);
	}

	return new RegExp(compiledPattern, regExpFlags);
};

/**
 * Parse the text to search for urls that match with the provided url type regular expression
 * and return an array of object with information relate to each url
 *
 * @param {String} text
 * @param {RegExp} urlRegExp The regular expression to identify the url types to match. In the
 *    most cases the regular expression is create by #compileRegExp function
 * @returns {Array} one url info object per url matched, each object has the next attributes:
 *    # url: the url matched
 *    # indexes: Objects with the next indexes (positions) into the whole text
 *      - start: the index (position) where it starts
 *      - end: the index (position) where it ends
 */
function parseURLsInText(text, urlRegExp)  {

	var url;
	var urlsInfo = [];

	// check if global flag is set, otherwise it doesn't parse the text because the method
	// would fall out in an infinite group
	if (urlRegExp.global) {
		while (null !== (url = urlRegExp.exec(text))) {

			urlsInfo.push({
				url: url[0],
				indexes: {
					start: url.index,
					end: urlRegExp.lastIndex
				}
			});

		}
	}

	return urlsInfo;
}


/**
 * Parse the text to search for urls that match with the provided url type regular expression
 * and return an array of object with information relate to each url
 *
 * @param {String} text
 * @param {RegExp} urlRegExp The regular expression to identify the url types to match. In the
 *    most cases the regular expression is create by #compileRegExp function and it is expected
 *    that the regular expression has capture group arround the protocol matching
 * @returns {Array} one url info object per url matched, each object has the next attributes:
 *    # url: the url matched
 *    # protocol: the protocol used in the url
 *    # indexes: Objects with the next indexes (positions) into the whole text
 *      - start: the index (position) where it starts
 *      - end: the index (position) where it ends
 */
function parseURLsInTextWithProtocol(text, urlRegExp)  {

	var url;
	var urlsInfo = [];

	// check if global flag is set, otherwise it doesn't parse the text because the method
	// would fall out in an infinite group
	if (urlRegExp.global) {
		while (null !== (url = urlRegExp.exec(text))) {

			urlsInfo.push({
				url: url[0],
				protocol: url[1],
				indexes: {
					start: url.index,
					end: urlRegExp.lastIndex
				}
			});

		}
	}

	return urlsInfo;
}

/**
 * The functions provided by the script
 * @api public
 */
module.exports = {
	parseWebHostDomainNames: function (text) {
		return parseURLsInTextWithProtocol(text, compileRegExp(WEB_HOST_DOMAIN_NAME_MATCH.http_s, 'gi'));
	}
};
