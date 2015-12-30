'use strict';

/**
 * Load the mongoose default instance configuration to create a MongooseConnManager wrapper of it
 *
 */

var settings = require('../settings.js');

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var configLoader = require(settings.libsPath + '/iwazat/util/config');
var MongooseConnManager = require(settings.libsPath + '/iwazat/util/mongooseConnManager');


/**
 * Load the mongoose settings for the default instance and wrap them into a MongooseConnManager
 * @api public
 */
function iwaMongo() {
	var mongoosesCnf = require(settings.configsPath + '/mongodb');
	mongoosesCnf = configLoader.getConfiguration(mongoosesCnf);
	return new MongooseConnManager('_default', mongoosesCnf._default);
};

module.exports = iwaMongo();