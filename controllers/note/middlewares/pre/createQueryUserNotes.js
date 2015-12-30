'use strict';

/**
 * Take the mongoose specification query object from req.processed.query and create a new
 * mongoose query object applying the requirements and restrictions to query the notes' collection
 * of the authenticated user and replace req.processed.query with it.
 *
 *
 * Pre-conditions:
 *    # user has been authenticated
 *    # req.processed.query must exist and contains an mongoose specification query object format
 *      (@see /lib/iwazat/util/mongooseQueryParser#(querySpec)
 */

module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

// Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWANote = require(settings.modelsPath + '/iwazat/note');

// Utils
var iWAMQueryParser = require(settings.libsPath + '/iwazat/util/mongooseQueryParser');

/**
 * Globals
 */
var notesDefaults;

//Initialize the non straight away global variables
(function initialize() {
  notesDefaults = settings.entities.user.notes;
}());


module.exports = function (req, res, next) {

  var reqQuery = req.processed.query;
  var userId = iWASession.getAuthUser(req.session).id;
  var NoteModel = iWAMongo.model(iWANote, iWANote.mongooseModelOptions(userId));


  reqQuery = iWAMQueryParser(NoteModel.find(), reqQuery, {
    limitMax: notesDefaults.num_max_allowed
  });


  helperPreMiddlewares.addProcessedData(req, 'query', reqQuery, true);
  next();

};