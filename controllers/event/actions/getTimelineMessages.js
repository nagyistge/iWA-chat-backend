'use strict';

/**
 * The action response with the timeline messages of the event with their comments in expanded
 * form (basic information of the messages and comments' owner).
 * NOTE: The messages are sorted from the newest to the oldest.
 *
 *  Pre conditions:
 *    # req.session must exist
 *    # user is authorized to manage this event
 *    # req.processed must exist
 *    # req.processed.event  must exist and it must be an object with the next attributes
 *    {
 *      timeline:
 *        {
 *          message_collection: The message collection from the messages will be retrieved
 *          num_max_messages: The maximum messages to get
 *          [newest_message_created_at]: The top date of the last message to get, so the action return
 *            the required number of message when the first has the create at date equals or older
 *            than it and the following older messages. If it doesn't specified then the first
  *           message will be the newest of the collection.
 *        }
 *    }
 */

module.exports = exports;
var settings = require('../../../settings.js');

/**
 * Dependencies
 */
//Controller helpers
var helperGlobal = require(settings.ctrlsPath + '/_helpers').global;
var helperActions = require(settings.ctrlsPath + '/_helpers').actions;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

// System tools (Logger)
var iwaLogger = require(settings.sysPath + '/tools/iwaLogger');


// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWATimelineMsg = require(settings.modelsPath + '/iwazat/timelineMessage');

// View lib
var tmMessagesView = require(settings.libsPath + '/iwazat/view/timeline/messages');


module.exports = function (req, res, next, post) {

  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  var tmSettings = req.processed.event.timeline;
  var MsgTimelineModel = iWAMongo.model(iWATimelineMsg,
    iWATimelineMsg.mongooseModelOptions(tmSettings.message_collection));

  var query;

  if (tmSettings.newest_message_created_at) {
    query = MsgTimelineModel.find({
      created_at: {$lte: tmSettings.newest_message_created_at}
    });
  } else {
    query = MsgTimelineModel.find();
  }

  query.select({
    _id: true,
    created_at: true,
    owner: true,
    type: true,
    message_object: true,
    likes: true,
    comments: true
  });
  query.sort({created_at: -1});
  query.limit(tmSettings.num_max_messages);

  query.exec(function (err, messageDocs) {
      var msgsAndCmts;

      if (err) {
        helperGlobal.addError(req, new iWAErrors.Db('Controller: event # Action: ' +
          ' getTimelineMessages | Error when retrieving the timeline messages from the collection: ' +
          tmSettings.message_collection, 520, err), 520);
        sendResponse(req, res, post);
        return;
      }

      if ((!messageDocs) || (messageDocs.length === 0)) {
        sendResponse(req, res, post, []);
        return;
      }

      msgsAndCmts = [];
      var opCounter = messageDocs.length * 2;

      // Expand the owner and comments of each message
      messageDocs.forEach(function (msgDoc, idx) {

        msgDoc.getExpOwner(function (err, ownerDoc) {
          // One error has happened and response has been sent
          if (opCounter < 0) {
            return;
          }

          if (err) {
            helperGlobal.addError(req,
              new iWAErrors.Db('Controller: event # Action: getTimelineMessages | Error when trying '
                + 'to populate the message\'s owner, message collection: ' +
                tmSettings.message_collection + ' message id: ' + msgDoc.id, 520, err), 520);
            opCounter = -1;
            sendResponse(req, res, post);
            return;
          }

          if (!ownerDoc) {
            helperGlobal.addError(req,
              new iWAErrors.Db('Controller: event # Action: getTimelineMessages | Nonexistent user. ' +
                'Any user was found for the reference of the message\'s owner, message collection: ' +
                tmSettings.message_collection + ' message id: ' + msgDoc.id, 522, err), 522);
            opCounter = -1;
            sendResponse(req, res, post);
            return;
          }

          opCounter--;
//          msgsAndCmts[idx] = {
//            message: tmMessagesView.iWazatTextMessageView(
//              msgDoc,
//              tmMessagesView.ownerView(ownerDoc)
//            )
//          };

          msgsAndCmts[idx] =
            tmMessagesView.iWazatMessageView(msgDoc,tmMessagesView.ownerView(ownerDoc));


          if (msgDoc.comments.length === 0) {
            opCounter--;

            if (opCounter === 0) {
              sendResponse(req, res, post, msgsAndCmts);
            }

          } else {
            // Expand message's comments
            msgDoc.getExpComments(function (err, cmtsOwners) {
              var commentsView;
              // One error has happened and response has been sent
              if (opCounter < 0) {
                return;
              }

              if (err) {
                helperGlobal.addError(req,
                  new iWAErrors.Db('Controller: event # Action: getTimelineMessages | Error when trying '
                    + 'to populate the owner of the message\'s comments, message collection: ' +
                    tmSettings.message_collection + ' message id: ' + msgDoc.id, 520, err), 520);
                opCounter = -1;
                sendResponse(req, res, post);
                return;
              }

              if (!cmtsOwners) {
                helperGlobal.addError(req,
                  new iWAErrors.Db('Controller: event # Action: getTimelineMessages | Nonexistent user. ' +
                    'Any user was found for the owner reference of the message\'s comments, message ' +
                    'collection: ' + tmSettings.message_collection + ' message id: ' +
                    msgDoc.id, 522, err), 522);
                opCounter = -1;
                sendResponse(req, res, post);
                return;
              }

              opCounter--;

              if (cmtsOwners.length > 0) {
                commentsView = tmMessagesView.messageCommentsCollection('',
                  msgDoc.comments,
                  cmtsOwners,
                  {
                    commentToView: true,
                    ownerToView: true
                  }
                );

                msgsAndCmts[idx].comments = commentsView.comments;
              } else {
                msgsAndCmts[idx].comments = [];
              }

              if (opCounter === 0) {
                sendResponse(req, res, post, msgsAndCmts);
              }
            });
          }
        });
      });
    }
  ); // End query exec
};

function sendResponse(req, res, post, msgsAndCmts) {
  // is there errors the helper will send the response
  if (helperActions.respAllIssues(req, res, post)) {
    return;
  }

  res.json(200, msgsAndCmts);
  post(null, req, res);
}