'use strict';


module.exports = exports;


/**
 * Create a view representation of a comment
 *
 * @param {Object} commentDoc
 * @param {Object} ownerView The view object representation of the comment's owner
 * @returns {Object}
 */
module.exports.iWazaCommentView = function (commentDoc, ownerView) {

  var commentView = commentDoc.toObject();
  commentView.owner = ownerView;

  return commentView;
};



/**
 *  Returns an view object of an user who is owner of a comment.
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

  return {
    _id: userDoc.id,
    persona: (persona.is_default === true) ? 'default' : persona.id,
    name: persona.name,
    surname: persona.surname,
    nickname: persona.nickname,
    avatar: userDoc.personaAvatar()
  };

};