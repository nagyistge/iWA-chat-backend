'use strict';

module.exports = exports;
var settings = require('../../../../settings');

/**
 * Dependencies
 */
// View libraries
var commentViewLib = require(settings.libsPath + '/iwazat/view/comments');

/**
 * Create a view representation of a message's timeline depending if the its type: iWazat text,
 * tweet and so on.
 *
 * @param {Object} iwaMessageDoc
 * @param {Object} ownerView The view object representation of the message's owner
 * @returns {Object}
 */
module.exports.iWazatMessageView = function (iwaMessageDoc, ownerView) {

  switch(iwaMessageDoc.type) {
    case 'tweet':
      return this.tweetMessageView(iwaMessageDoc, ownerView);
	  case 'iWazat_text_tweet':
		    return this.iWazatTextTweetMessageView(iwaMessageDoc, ownerView);
    case 'iWazat_text':
    default:
      return this.iWazatTextMessageView(iwaMessageDoc, ownerView);
  }
}

/**
 * Create a view representation of a message's timeline of iWazat text's type.
 *
 * @param {Object} iwaTextMessageDoc Mongoose#Document object
 * @param {Object} ownerView The view object representation of the message's owner
 * @returns {Object}
 */
module.exports.iWazatTextMessageView = function (iwaTextMessageDoc, ownerView) {

  var iWATextMsgView = iwaTextMessageDoc.toObject();
  iWATextMsgView.text = iWATextMsgView.message_object.text;
  delete iWATextMsgView.message_object;
  iWATextMsgView.owner = ownerView;

  return iWATextMsgView;

};

/**
 * Create a view representation of a message's timeline of iWazat text's type.
 *
 * @param {Object} iwaTweetMessageDoc Mongoose#Document object
 * @param {Object} ownerView The view object representation of the message's owner
 * @returns {Object}
 */
module.exports.tweetMessageView = function (iwaTweetMessageDoc, ownerView) {

  var iWATweetMsgView = iwaTweetMessageDoc.toObject();


  iWATweetMsgView.owner = ownerView;
  delete iWATweetMsgView.message_object;

	// Reuse the same local variable to access faster to the message_object's properties
  iwaTweetMessageDoc = iwaTweetMessageDoc.message_object;

	iWATweetMsgView.tweet_id = iwaTweetMessageDoc.id;

  if (iwaTweetMessageDoc.text) {
    iWATweetMsgView.text = iwaTweetMessageDoc.text;
  }

  if (iwaTweetMessageDoc.urls) {
    iWATweetMsgView.urls = iwaTweetMessageDoc.urls;
  }

  if (iwaTweetMessageDoc.medias) {
    iWATweetMsgView.medias = iwaTweetMessageDoc.medias;
  }


  return iWATweetMsgView;

};

/**
 * Create a view representation of a message's timeline of iWazat text tweet's type.
 *
 * @param {Object} iwaTweetMessageDoc Mongoose#Document object
 * @param {Object} ownerView The view object representation of the message's owner
 * @returns {Object}
 */
module.exports.iWazatTextTweetMessageView = function (iwaTweetMessageDoc, ownerView) {
	return this.tweetMessageView(iwaTweetMessageDoc, ownerView);
};

/**
 * Create a collection of comments of the specified message.
 * NOTE: The commentObjs and userOwnerObjs must be the same type and if they are arrays, then
 * they must have the same length and each element is bound to each other by its position into the
 * array.
 *
 * @param {String | Object} message The message id or object where the comments reference
 * @param {Array | Object} commentObjs The iWazat comment model or comment view object, or array of them
 * @param {Array | Object} userOwnerObjs The iWazat user model or user view object, or array of them
 * @param {Object} options
 *                  # commentToView: {Boolean} True, then the comments will be transformed
 *                      into comment view objects, otherwise the comments are used like they have
 *                      been provided. By default false.
 *                  # ownerToView: {Boolean} True, then the user owner will be transformed into user
 *                      owner view objects, otherwise the users owners are used like they have been
 *                      provided. By default false.
 * @return {Object} The object has the next attributes:
 *                  # message: {String | Object} the message id or object provided
 *                  # comments: {Array} The comments collection
 */
module.exports.messageCommentsCollection =
  function (message, commentObjs, userOwnerObjs, options) {

    var comments;
    var transforms = 0x00;
    var msgCommentsCol = {
      message: message
    };

    if (true === options.commentToView) {
      transforms = 0x01;
    }

    if (true === options.ownerToView) {
      transforms |= 0x02;
    }


    if (Array.isArray(commentObjs)) {
      comments = [];

      switch (transforms) {
        case 0x01:
          commentObjs.forEach(function (cmtObj, idx) {
            comments.push(
              commentViewLib.iWazaCommentView(cmtObj, userOwnerObjs[idx])
            );
          });
          break;

        case 0x02:
          commentObjs.forEach(function (cmtObj, idx) {
            cmtObj.owner = commentViewLib.ownerView(userOwnerObjs[idx]);
            comments.push(cmtObj);
          });
          break;

        case 0x03:
          commentObjs.forEach(function (cmtObj, idx) {
            comments.push(
              commentViewLib.iWazaCommentView(cmtObj, commentViewLib.ownerView(userOwnerObjs[idx]))
            );
          });
          break;
        default:
          commentObjs.forEach(function (cmtObj, idx) {
            cmtObj.owner = userOwnerObjs[idx];
            comments.push(cmtObj);
          });
      }

    } else {
      switch (transforms) {
        case 0x01:
          comments = [commentViewLib.iWazaCommentView(commentObjs, userOwnerObjs)];
          break;
        case 0x02:
          commentObjs.owner = commentViewLib.ownerView(userOwnerObjs);
          comments = [commentObjs];
          break;
        case 0x03:
          comments = [
            commentViewLib.iWazaCommentView(commentObjs, commentViewLib.ownerView(userOwnerObjs))
          ];
          break;
        default:
          commentObjs.owner = userOwnerObjs;
          comments = [commentObjs];
      }

    }

    msgCommentsCol.comments = comments;

    return msgCommentsCol;
  };

/**
 * Create a comment that reference to the specified message
 *
 * @param {String} messageId The message id which the comment references
 * @param {Object} commentObj The iWazat comment model or comment view object
 * @param {Object} userOwnerObj The iWazat user model or user view object
 * @param {Object} options
 *                  # commentToView: {Boolean} True, then the comment will be transformed into
 *                      comment view object otherwise the comment is used like it has been provided.
 *                      By default false.
 *                  # ownerToView: {Boolean} True, then the user owner will be transformed into user
 *                      owner view object otherwise the user owner is used like it has been provided.
 *                      By default false.
 * @return {Object} The object has the next attributes:
 *                  # message: {String | Object} the message id or object provided
 *                  # comment: {Object} The comment
 */
module.exports.messageComment =
  function (messageId, commentObj, userOwnerObj, options) {

    var transforms = 0x00;
    var msgComment = {
      msgId: messageId
    };

    if (true === options.commentToView) {
      transforms = 0x01;
    }

    if (true === options.ownerToView) {
      transforms |= 0x02;
    }

    switch (transforms) {
      case 0x01:
        msgComment.comment = commentViewLib.iWazaCommentView(commentObj, userOwnerObj);
        break;
      case 0x02:
        commentObj.owner = commentViewLib.ownerView(userOwnerObj);
        msgComment.comment = commentObj;
        break;
      case 0x03:
        msgComment.comment =
          commentViewLib.iWazaCommentView(commentObj, commentViewLib.ownerView(userOwnerObj));

        break;
      default:
        commentObj.owner = userOwnerObj;
        msgComment.comment = commentObj;
    }

    return msgComment;

  };
/**
 *  Returns an view object of an user who is owner of a message
 *  NOTE: The iWazat user document must contain only one persona into the personas array.
 *
 * @param {Object} userDoc Mongoose iWazat user document
 * @return {Object} The owner view representation. The object has this attributes:
 *  {
 *    _id: The user id
 *    _persona: the user persona id used in the event, if it is the default persona then it is 'default'
 *    name: His first name
 *    surname: His surname
 *    nickname: His nickname
 *    avatar: The avatar url
 *  }
 */
module.exports.ownerView = function (userDoc) {
  var persona = userDoc.personas[0];
  var snAccount;
	var snProfile;
  var sn;

  if ('unregistered' === userDoc.account_status) {

    snAccount = userDoc.social_network_accounts[0];

    sn = {
      source: {
        type: snAccount.type,
        account_id:snAccount.account_id,
        account_name: snAccount.account_name,
        profile_url: snAccount.profile_url
      },
	    _id: userDoc.id,
      name: persona.name,
      surname: persona.surname,
      nickname: persona.nickname,
      avatar: userDoc.personaAvatar()
    };

    switch(snAccount.type.toLowerCase()) {
      case 'twitter':
	      snProfile = snAccount.account_profile[snAccount.account_profile.length - 1];

	      sn.source.bio = persona.bio;
        sn.source.scren_name = snAccount.account_name;
	      sn.source.location = snProfile.location;
        break;
      default:
    }

    return sn;

  } else {

    return {
      _id: userDoc.id,
      persona: (persona.is_default === true) ? 'default' : persona.id,
      name: persona.name,
      surname: persona.surname,
      nickname: persona.nickname,
      avatar: userDoc.personaAvatar()
    };
  }

};