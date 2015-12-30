/**
 * Mongoose connection parameters are:
 *
 * ##  {String} connection_string mongodb://uri or the host to which you are connecting
 *  -- or --
 * ## {String} host
 * ## {String} database name
 * ## {Number} port The port number to connect
 * ## {Object} [options] options:
 *    # db - passed to the connection db instance
 *    # server - passed to the connection server instance(s)
 *    # replset - passed to the connection ReplSet instance
 *    # user - username for authentication
 *    # pass - password for authentication
 * ## {Function} [callback] Callback to call for the connect or open connection method
 *
 * @See [@link http://mongoosejs.com/docs/api.html#connection_Connection-open]
 */



module.exports = {
	iWazat_brain: {
		development: {
			_default: {
				connections: {
					_default: {
						host: 'localhost',
						database: 'iWazatApp_dev'
					}
				}
			}
		},
		pubdev: {
			_default: {
				connections: {
					_default: {
						host: '10.179.132.164',
						port: 27029,
						database: 'iWazatApp_dev'
					}
				}
			}
		},
		staging: {
			_default: {
				connections: {
					_default: {
						host: '10.179.132.164',
						port: 27029,
						database: 'iWazatApp_staging'
					}
				}
			}
		},
		beta: {
			_default: {
				connections: {
					_default: {
						host: '10.179.132.164',
						port: 27029,
						database: 'iWazatApp_beta'
					}
				}
			}
		}

	}
};