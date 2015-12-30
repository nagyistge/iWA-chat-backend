/**
 * iWazat Message model
 * 
 * This schema has fields that reference to other documents: The models names that reference, are:
 * User
 */
module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var iWazat = require('./abstract/iWazat');
var iWAUser = require('./user');
var iWAActor = require('./abstract/partials/actor');

var binAssessmentPlugin = require('./_plugins/binaryAssessment');


/**
 * iWazat Comment model schema constructor.
 * The exports of the this module is an sealed instance of this class
 * 
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 * 
 * @api public
 */
function Comment(schemaOptions) {

  this.schemaDefinition = {
    created_at : {
      type : Date,
      'default' : Date.now
    },
    owner : iWAActor.schemaDefinition,
    text : {
      type : String,
      match : /[\w\b\d]/,
      required : true
    }
    //likes: Array // this field is populate by binary assessment plugin
  };

  // Call parent constructor
  iWazat.call(this, schemaOptions);

  binAssessmentPlugin(this, {
    path: 'likes',
    userModelName: iWAUser.mongooseModelName
    //userProfileFieldName: 'persona' // Not used only with the user id is enough
  });

};

Comment.prototype.__proto__ = iWazat.prototype;


Comment.prototype.createComment = function(cmtText, userOwnerId, personaOwnerId) {

  var ownerActor = iWAActor.createActor(userOwnerId, personaOwnerId);

  return {
    text: cmtText,
    owner: ownerActor
  };
};

var comment = (function() {
  var comment = new Comment;
  comment.Comment = Comment;
  
  return comment;
}());

module.exports = exports = comment;


module.exports = exports = new Comment;
var comment = module.exports;

