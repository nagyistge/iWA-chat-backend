'use strict';

/**
 * Operations:
 *
 * Depending of the parameters received the pre-middleware checks if the chat's id is registered in
 * the user's session, or check if "receivers" of a chat's message exist and the sender of the
 * message is authorized to reach all of them.
 *
 * Current version only doesn't check if one user can chat with others, so it only checks if
 * the chat collection exist regarding the members (users' id) of the chat and if not, then
 * it create a new chat for them (#15)
 *
 * The client (frontend) never have to send the chat's id if in the current session it has never
 * requested the chat through the chat members (#16)
 *
 * In the present time, the action only populate the session with the last existent messages'
 * collection of the user; basically it takes the current counter value
 * (chat#message_collection_count) (#23)
 *
 * The message middleware report an error to the next pre-middleware/action if the some checking
 * fails, otherwise call to the next pre-middleware/action providing an object in
 * req.processed.chatMessage.chat with the next attributes:
 *    {
 *      _id: The chat message id
 *      msgColNum: The chat message collection number (String with 3 digit characters),
 *      [receivers]: The parameter exist if it was sent by the frontend (@see CAVEATS paragraph)
 *    }
 *
 *  The pre-middleware check the parameters under req.processed.chatMessage.chat and it expects to
 *  find one or both of the next parameters, to call the next route chain pre-middleware/action:
 *    {
 *      [id]: A stringify version of ObjectId of the chat's id.
 *      [receivers]: An array with the striginfy version of the user's ObjectId involved in the chat
 *         without the user who sent the request (the session's user)
 *    }
 *
 *  CAVEATS:
 *    The next elements of the route chain which perform write DB's operations which involve the
 *    chat's receivers users' list MUST check if that list fits to the chat id, because this
 *    pre-middleware only checks that list when the chat's id has not been provided. This decision
 *    allows to enhance the performance of this pre-middleware, so it delegates that responsibility
 *    to the next elements of the route's chain if some of them need that, however it pass that
 *    parameter because next pre-middlewares/action can be a double check in any search or update
 *    operation using the chat's 'id' and 'members' (receivers + the session's user) straight away
 *    and perform some operations if that update succeeded rather than always got that list from
 *    the DB to perform the operations, so regarding that the user used the application in the
 *    right way, the application can send tha list if it has the list stored in local to
 *    enhance the performance of the server, but if the list is provided but wrong, a response
 *    with some error must be sent.
 *
 *
 *
 *  Pre conditions:
 *    # User has been authenticated
 *    # req.session must exist
 *    # req.processed.chatMessage
 *
 *     The pre-middleware doesn't check the excluding existence of "id" and "receivers", first
 *     checks "chat" attribute and if it exists then it ignores if "receivers" exists and if "chat"
 *     doesn't exist then it assumes that "receivers" exists, so if any of them exist then the route
 *     chain stop sending an error response
 */


module.exports = exports;
var settings = require('../../../../settings.js');


/**
 * Dependencies
 */
//Controller helpers
var helperPreMiddlewares = require(settings.ctrlsPath + '/_helpers/').middlewares.pre;

//System Entities
var iWAErrors = require(settings.sysPath + '/entities/errors');

//Services
var iWASession = require(settings.servicesPath + '/iwazat/session');

// Database (MongoDB)
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWAUser = require(settings.modelsPath + '/iwazat/user');
var iWAChat = require(settings.modelsPath + '/iwazat/chat');

/**
 * Globals
 */
var UserModel;
var ChatModel;

// Initialization of non-straight away variables
(function initialize() {
  UserModel = iWAMongo.model(iWAUser);
  ChatModel = iWAMongo.model(iWAChat);
}());


module.exports = function (req, res, next) {

  if (helperPreMiddlewares.jumpIfErrors(req, res, next)) {
    return;
  }

  var chatRef = req.processed.chatMessage.chat;
  var chatObj;

  if (chatRef) {
    if (chatRef._id) {
      // Chat id has been specified
      chatObj = iWASession.getChat(req.session, chatRef._id);

      if (chatObj) {

        if (chatRef.receivers) {
          chatObj = {
            id: chatRef._id,
            msgColNum: chatObj,
            receivers: chatRef.receivers
          };
        } else {
          chatObj = {
            id: chatRef._id,
            msgColNum: chatObj
          };
        }

        helperPreMiddlewares.addProcessedData(req, 'chatMessage.chat', chatObj, true);
        next();
        return;

      } else {
        helperPreMiddlewares.traceErrors(req,
          new iWAErrors.ClientAttack('Controller: chat # Pre-middleware: authorization ' +
            '| A chat id has been sent but the user\'s session doesn\'t have registered it', 603,
            req,
            chatRef._id));
        helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message');
        return;
      }

    } else if (chatRef.receivers) {
      // Find chat id from receivers

      chatRef = chatRef.receivers;

      if ('string' === typeof chatRef) {
        chatRef = [chatRef]
      }

      UserModel.find({
          _id: {$in: chatRef}
        }, {
          _id: true
        }, {
          lean: true
        },
        function (err, users) {
          if (err) {
            helperPreMiddlewares.traceErrors(req,
              new iWAErrors.Db('Controller: chat # pre-middleware: authorization | Error ' +
                'trying to check if the receivers exist in the users collection', 520, err));
            helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'chat\'s message');
            return;
          }

          if (users.length !== chatRef.length) {
            helperPreMiddlewares.traceErrors(req,
              new iWAErrors.HttpRequest('Controller: chat # Pre-middleware: authorization ' +
                '| Some chat\'s message receivers don\'t exist into the DB users collection. Found ' +
                users.length + ' from ' + chatRef.length, 400, req));
            helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message');

          } else {

            // Adding the sender to the receivers array to retrieve the chat that involve all of them
            chatRef.push(iWASession.getAuthUser(req.session).id);

            ChatModel.getChat(chatRef, function (err, chat) {
              if (err) {
                helperPreMiddlewares.traceErrors(req, new iWAErrors.Db('Controller: chat # ' +
                  '# Pre-middleware: authorization | Error when trying to retrieve or ' +
                  'create the chat entity that involve the users: ' + chatRef, 524, err), 524);
                helperPreMiddlewares.sendRespOfIssue(req, res, 500, 'chat\'s message');
                return;
              }

              // Remove the user who sent the request (the user in the session request), he was
              // added before the call to the function tha call this callback
              chatRef.pop();
              iWASession.registerChat(req.session, chat.id, chat.message_collection_count);


              helperPreMiddlewares.addProcessedData(req, 'chatMessage.chat', {
                id: chat.id,
                msgColNum: chat.message_collection_count,
                receivers: chatRef
              }, true);

              next();
            });

          }
        });

      return;
    }
  } // End checking that req.processed.chatMessage.chat exists

  helperPreMiddlewares.traceErrors(req,
    new iWAErrors.ClientAttack('Controller: chat # Pre-middleware: authorization | Any chat ' +
      'parameter allows to know the chat message\'s collection to fulfill the request', 603, req,
      chatRef));
  helperPreMiddlewares.sendRespOfIssue(req, res, 400, 'chat\'s message');

};
