'use strict';

/**
 * The pre-middleware checks if the data object received in the request's body fits to the iWazat
 * note's structure and applies a XSS filter to the content.title and content.text if they exist.
 *
 * The middleware report an error to the next middleware/action of the chain if the structure is
 * wrong otherwise populate req.processed.note object, which has the note's attributes sent
 * @see models/iwazat/note
 *
 *  Pre-Middleware type: frontline
 *
 *  Pre conditions:
 *    # req.body must exist
 *
 */

module.exports = exports;
var settings = require('../../../../settings.js');

/**
 * Dependencies
 */
//Action helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Database (MongoDB)
var iWANote = require(settings.modelsPath + '/iwazat/note');

// Input validations and sanitizations
var sanitizer = require('validator').sanitize;



module.exports = function (req, res, next) {

  var accepted = false;
  var note = req.body;


  if ((note) && ('object' === typeof note)) {

    // TODO #20 #21
    if ((!note.created_at) && (!note.updated_at) && (!note.comments) && (!note.likes) &&
      (!note.tags) && (!note.privacy)) {
      if (iWANote.validateObject(note) === true) {

        if (note.content) {

          // TODO #22
          if (!note.content.attachments) {
            if (note.content.title) {
              note.content.title = sanitizer(note.content.title).entityDecode();
              note.content.title = sanitizer(note.content.title).xss();
            }

            if (note.content.text) {
              note.content.text = sanitizer(note.content.text).entityDecode();
              note.content.text = sanitizer(note.content.text).xss();
            }
            accepted = true;
          } // End check that the note doesn't carry content.attachments information

        } else {
          accepted = true;
        }
      }
    }
  }

  if (accepted === true) {
    helperPreMiddlewares.addProcessedData(req, 'note', note, false);
    next();
  } else {
    // Non-accepted chat message
    helperPreMiddlewares.traceErrors(req,
      new iWAErrors.HttpRequest('Controller: note # Pre-middleware: parseNoteData | Notes\'s ' +
        'data object has not been sent or it doesn\'t have the right structure', 400, req));
    helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'Note');
  }

};