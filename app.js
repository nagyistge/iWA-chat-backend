'use strict';

// Module dependencies
var settings = require('./settings.js');
var http = require('http');
var express = require('express');

var configLoader = require(settings.libsPath + '/iwazat/util/config');
var expressBootstrapper = require(settings.libsPath + '/ifc/util/expressBootstrapper');
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');
//var iWASession = require(settings.servicesPath + '/iwazat/session');
var iWASocketIO = require(settings.servicesPath + '/iwazat/socket.io');
var userNotifications = require(settings.servicesPath + '/iwazat/users/notifications');

// Application objects
var expressApp = settings.expressApp = express();
var httpServer = http.createServer(expressApp);

// Configuration variables
var serverCnf = require(settings.configsPath + '/iWazatServer');
serverCnf = configLoader.getConfiguration(serverCnf);


// iWazat logger
settings.logger = iwaLogger.getWinstonLogger();


// Set the express configuration parameters and express middlewares specified in the app
// configuration file
if ((serverCnf.express) && (serverCnf.express_middlewares)) {
	expressBootstrapper(expressApp, serverCnf.express, serverCnf.express_middlewares);
} else {
	if (serverCnf.express) {
		expressBootstrapper(expressApp, serverCnf.express);
	} else if (serverCnf.express_middlewares){
		expressBootstrapper(expressApp, serverCnf.express_middlewares);
	}
}

// socket.io
iWASocketIO.initialise(httpServer, serverCnf.socketIO);

// Notifications require that iWASocket service has been initialized and iWASession as well, although
// it will be used in the socket authentication function listener, but it is safer to execute after
// the initialization of those services
userNotifications.initialise();

/** Authentication strategies **/
require(settings.libsPath + '/iwazat/auth/strategies');


require('./bootstrap')(function (err) {

	if (err) {
		settings.logger.error(err);

	  //Exit codes base on: http://www.gsp.com/cgi-bin/man.cgi?section=3&topic=sysexits
		process.exit(70);
	}

	/***** HTTP Server start *****/
	httpServer.listen(serverCnf.http.port);
	settings.logger.info('iWazat environment: ' + settings.env);
	settings.logger.info('Server listening on port ' + serverCnf.http.port);

});
