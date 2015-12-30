'use strict';

/**
 * Dependencies
 */
var mongoose = require('mongoose');

/**
 *  Create a wrapper for a Mongoose instance to track the existent connections and provide some
 *  shortcut helpers to interact with the connections
 *
 * @param id
 * @param config
 * @constructor
 */
var MongooseConnManager = function MongooseConnManager(id, config) {

	var it;
	this.id = id;
	this.connections = {};

	if (this.id === '_default') {
		this.mongoose = mongoose;
	} else {
		this.mongoose = new mongoose.Mongoose();
	}

	if (config.connections) {
		for (it in config.connections) {
			this.registerConnection(it, config.connections[it]);
		}
	}

	// Load options
	for (it in config) {
		if (it === 'connections') {
			continue;
		}

		this.mongoose.set(it, config[it]);
	}


};

MongooseConnManager.prototype.getMongoose = function getMongoose() {
	return this.mongoose;
};

/**
 * Register, under the specified id,  the new created mongoose connections with the provided
 * parameters
 *
 * @param {String} id The id of the connection
 * @param {Object | String} mConnArgs The mongoose connection parameters specified by name arguments.
 *    If object then the attributes names should be the same that Mongoose#Connection#Open, otherwise
 *    the parameters will be considered a connection string
 * @see Mongoose#Connection#open
 * @api public
 */
MongooseConnManager.prototype.registerConnection =
	function registerConnection(id, mConnArgs) {

		//var connParams = [].slice.call(arguments, 1);
		var connParams = [];

		if ('string' === typeof mConnArgs) {
			connParams[0] = mConnArgs;
		} else {
			if (mConnArgs.host) {
				connParams.push(mConnArgs.host);
			}

			if (mConnArgs.database) {
				connParams.push(mConnArgs.database);
			}

			if (mConnArgs.port) {
				connParams.push(mConnArgs.port);
			}

			if (mConnArgs.options) {
				connParams.push(mConnArgs.options);
			}

			if (mConnArgs.callback) {
				connParams.push(mConnArgs.callback);
			}
		}


		if (id === '_default') {
			mongoose.connect.apply(this.mongoose, connParams);
		} else {
			this.connections[id] = this.mongoose.createConnection.apply(this.mongoose, connParams);
		}

	};

/**
 * Close and unregister the specified mongoose connection.
 *
 * @param {String} id The id of the connection to unregister (default connection has not been
 *  unregistered), so '_default' id is ignored.
 * @param {Function } [callback] Callback function to pass to Mongoose#Connection#close
 * @see Mongoose#Connection#close
 * @api public
 */
MongooseConnManager.prototype.unregisterConnection = function unregisterConnection(id, callback) {
	if (this.connections[id]) {
		this.connections[id].close(callback);
		delete this.connections[id];
	}
};


MongooseConnManager.prototype.getConnection = function getConnection(id) {

	if (id === '_default') {
		return this.mongoose.connection;
	} else {
		return this.connections[id];
	}
};

/**
 * Create a mongoose model from a Mongoose Schema instance.
 * The Schema may be prototyped with a mongooseModelName that keep the model name to use, but
 * it must be provided by the modelParams argument under the property modeName
 *
 * @param {String} [connId] Optional, it it is not specified the default mongoose connection will
 *          be used, otherwise the connection registered under the provided id
 * @param {Object} schema An instance of an iWazat model (inherited class instance)
 * @param {Object} [modelParams] Additional parameters to provide to Mongoose#model. The object
 *          may contain the next optional attributes:
 *          # {String} modelName: The model's name to use; if the Schema holds the model name,
 *            it will take more preference that it
 *          # {String} collection: The collection's name
 *          # {Object} skipInit: The skipInit options
 * @returns The Mongoose model instance bounded to the Schema specified by iWazat model
 * @api public
 * @see Mongoose#model
 */
MongooseConnManager.prototype.model = function model(connId, schema, modelParams) {

	var conn;
	var modelName = false;
	var collection = undefined;
	var skipInit = undefined;

	if (arguments.length === 0) throw new Error('No model has been specified to get');


	if ('object' === typeof connId) {
		modelParams = schema;
		schema = connId;
		connId = '_default';
	}

	conn = this.getConnection(connId);

	if (modelParams) {
		modelName = modelParams.modelName;
		collection = modelParams.collection;
		skipInit = modelParams.skipInit;
	}


	return (!modelName) ? conn.model(schema.mongooseModelName, schema, collection,
		skipInit) : conn.model(modelName, schema, collection, skipInit);
};


module.exports = MongooseConnManager;