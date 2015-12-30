'use strict';

/**
 * Dependencies
 */
var path = require('path');
var rootPath = __dirname;

module.exports.rootPath = rootPath;
module.exports.routesPath = path.join(rootPath, 'routes');
module.exports.ctrlsPath = path.join(rootPath, 'controllers');
module.exports.servicesPath = path.join(rootPath, 'services');
module.exports.dataSourcesPath = path.join(rootPath, 'datasources');
module.exports.modelsPath = path.join(rootPath, 'models');
module.exports.configsPath = path.join(rootPath, 'configs');
module.exports.libsPath = path.join(rootPath, 'libs');
module.exports.sysPath = path.join(rootPath, 'sys');
module.exports.uiPath = path.join(rootPath, 'ui');
module.exports.publicPath = path.join(rootPath, '../webapp');
module.exports.tempPath = path.join(rootPath, 'tmp');
module.exports.srvTestsPath = path.join(rootPath, 'tests');


module.exports.app = {
  id: 'iWazat_brain',
	release: {
		num: '0.0.3',
		name: 'Startup Propellant'
	}
};

module.exports.env = (process.env.IWAZAT_ENV) ? process.env.IWAZAT_ENV : 'development';


/*
 * Objects instances and variables to share in the application; this values
 * should be populated by the application if they are required; they put here to
 * know which are used by this application.
 */

// Express App instance
module.exports.expressApp = null;
// WireXRoutes
module.exports.wireXRoutes = null;

// Winston Logger
module.exports.logger = null;

// directories
module.exports.directories = {
  temp: {
    images: path.join(module.exports.tempPath, 'upload', 'images')
  }
};


// Entities settings bounds and defaults values
module.exports.entities = {
  events: {
    timeline: {
      num_max_messages: 20,
      num_max_messages_allowed: 50
    }
  },
  user: {
    chat: {
      num_max_chats: 500,
      num_max_chats_allowed: 500,
      num_max_messages: 500,
      num_max_messages_allowed: 500,
      sort: -1
    },
    notes: {
      num_max_allowed: 500
    }
  }
};
