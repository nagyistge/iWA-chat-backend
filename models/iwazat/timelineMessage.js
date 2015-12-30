/**
 * iWazat Message Timeline model
 *
 * This schema has fields that reference to other documents: The models names that reference, are:
 * User
 */
module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var iWAUser = require('./user');
var iWAEvent = require('./event');
var iWAActor = require('./abstract/partials/actor');
var iWazatMessage = require('./abstract/message');
var iWAComment = require('./comment');
var binAssessmentPlugin = require('./_plugins/binaryAssessment');
var iWAExpUserPersPlugin = require('./_plugins/expandUserPersona');

/**
 * iWazat Message model schema constructor.
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function TimelineMessage(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition.owner = iWAActor.schemaDefinition;

  this.schemaDefinition.type = {
    type: String,
    enum: [ 'tweet', 'iWazat_text', 'iWazat_text_tweet' ],
    required: true
  };

  this.schemaDefinition.message_object = mongoose.SchemaTypes.Mixed;
  //this.schemaDefinition.likes // this field is populate by binary assessment plugin
  this.schemaDefinition.comments = [ iWAComment ];

  // Call parent constructor
  iWazatMessage.call(this, schemaOptions);

  /** Model methods **/

  /**
   * Create a new iWazat text message
   *
   * @param {String} text
   * @param {Object} userOwnerId The owner user's id
   * @param {Object} personaOwnerId The users persona's id used by the owner
   * @param {Function} callback with the same parameters conventions of Mongoose#Model#create
   */
  this.static('createIWAText', function (text, userOwnerId, personaOwnerId, callback) {

    var ownerActor = iWAActor.createActor(userOwnerId, personaOwnerId);

    this.create({
        type: 'iWazat_text',
        message_object: {
          text: text
        },
        owner: ownerActor
      },
      callback);
  });


  /**
   * Create a new Tweet message
   *
   * @param {Object} collectedTweet
   * @param {Object} userOwnerId The owner user's id
   * @param {Object} personaOwnerId The users persona's id used by the owner
   * @param {Function} callback with the same parameters conventions of Mongoose#Model#create
   */
  this.static('createTweet', function (collectedTweet, userOwnerId, personaOwnerId, callback) {

    var ownerActor = iWAActor.createActor(userOwnerId, personaOwnerId);
    var msgObj = {
      raw: collectedTweet.source.raw,
	    id: collectedTweet.source.raw.id_str
    };


    if (collectedTweet.text) {
      msgObj.text = collectedTweet.text;
    }

    if (collectedTweet.urls) {
      msgObj.urls = collectedTweet.urls;
    }

    if (collectedTweet.medias) {
      msgObj.medias = collectedTweet.medias;
    }

    this.create({
      created_at: collectedTweet.created_at,
      type: 'tweet',
      message_object: msgObj,
      owner: ownerActor
    }, callback);
  });

	/**
	 * Create a iWazat Text Tweet message
	 *
	 * @param {String | Object} textOrTweet A string with the message's text or a tweet object, in
	 *      that case the text of the message will be the tweet text, otherwise the message
	 *      will be create without the tweet object, so it is expected an update of the message
	 *      to attach the tweet object when the application get it.
	 * @param {Object} userOwnerId The owner user's id
	 * @param {Object} personaOwnerId The users persona's id used by the owner
	 * @param {Function} callback with the same parameters conventions of Mongoose#Model#create
	 */
	this.static('createIWATextTweet', function (textOrTweet, userOwnerId, personaOwnerId, callback) {

		var ownerActor = iWAActor.createActor(userOwnerId, personaOwnerId);
		var msgObj = {};

		if ('string' === typeof textOrTweet) {
			msgObj.text = textOrTweet;

		} else {
			msgObj.raw = textOrTweet.source.raw;

			if (textOrTweet.text) {
				msgObj.text = textOrTweet.text;
			}

			if (textOrTweet.urls) {
				msgObj.urls = textOrTweet.urls;
			}

			if (textOrTweet.medias) {
				msgObj.medias = textOrTweet.medias;
			}
		}


		this.create({
			type: 'iWazat_text_tweet',
			message_object: msgObj,
			owner: ownerActor
		}, callback);
	});

  /**
   * Push a new comment into the specified timeline message's comments array
   *
   * @param {String | Object} cmtText ObjectId or its stringify version of the message id to push
   *                the new comment,
   * @param {String} cmtText
   * @param {Object} userOwnerId The owner user's id
   * @param {Object} personaOwnerId The users persona's id used by the owner
   * @param {Function} callback with the same parameters conventions of Mongoose#Model#findOneAndUpdate
   *  but the only the message's comments array field will be returned
   */
  this.static('addComment', function (msgId, cmtText, userOwnerId, personaOwnerId, callback) {

    var commentObj = iWAComment.createComment(cmtText, userOwnerId, personaOwnerId);

    this.findOneAndUpdate({
        _id: msgId
      }, {
        $push: {comments: commentObj}
      }, {
        upsert: false,
        select: {
          'comments._id': true,
          'comments.create_at': true,
          'comments.text': true,
          'comments.likes': true
        }
      },
      function (err, message) {
        callback(err, message.comments);
      });
  });

  /**
   *  Assess a comment, adding or removing it depending if the specified users is in the
   *  comments assessment
   *
   * @param {String | Object} msgId ObjectId or stringify version which is the id of the comment's
   *          owner
   * @param {String | Object} cmtId ObjectId or stringify version of the comment's id
   * @param {String | Object} userId ObjectId or stringify version of the user's id who assesed the
   *          comment
   * @param {Function} callback The callback. It is a node callback convention where the second
   *      parameter is a 1 if the assessment is added, -1 if it is removed or 0 if any document has
   *      been updated
   */
  this.static('assessComment', function (msgId, cmtId, userId, callback) {

    var self = this;

    this.findOne({
        _id: msgId
      }, {
        comments: {$elemMatch: {_id: cmtId}}
      },
      function (err, msgDoc) {
        if (err) {
          callback(err);
          return;
        }

        if ((!msgDoc) || ((msgDoc.comments) && (msgDoc.comments.length === 0))) {
          callback(null, 0);
          return;
        }


        self.findOne({
            _id: msgId,
            comments: {$elemMatch: {_id: cmtId, likes: userId}}
          },
          function (err, msgDoc) {
            if (err) {
              callback(err);
              return;
            }

            if (msgDoc) {
              // removeAssessment

              self.update({
                  _id: msgId,
                  comments: {$elemMatch: {_id: cmtId}}
                }, {
                  $pull: {'comments.$.likes': userId}
                },
                function (err, numAffected, raw) {
                  if (err) {
                    callback(err);
                    return;
                  }

                  if (numAffected !== 1) {
                    callback(new Error('Unexpected number of messages of the timeline has ' +
                      'been modified when the update removed the assessment of the comment',
                      numAffected));
                    return;
                  }

                  callback(null, -1);
                });

            } else {
              //Add assessment

              self.update({
                  _id: msgId,
                  comments: {$elemMatch: {_id: cmtId}}
                }, {
                  $push: {'comments.$.likes': userId}
                },
                function (err, numAffected, raw) {
                  if (err) {
                    callback(err);
                    return;
                  }

                  if (numAffected !== 1) {
                    callback(new Error('Unexpected number of messages of the timeline has ' +
                      'been modified when the update added the assessment of the comment',
                      numAffected));
                    return;
                  }

                  callback(null, 1);
                });
            }
          });
      });
  });

  /** Schema plugins applied **/

  binAssessmentPlugin(this, {
    path: 'likes',
    userModelName: iWAUser.mongooseModelName,
    methodName: 'assessMessage'
    //userProfileFieldName: 'persona' // Not used only with the user id is enough
  });


  this.plugin(iWAExpUserPersPlugin, {
    methodName: 'getExpOwner',
    path: 'owner',
    userModel: iWAUser.mongooseModelName,
    userFields: {
      _id: true,
      avatars: true,
      social_network_accounts: true,
      account_status: true,
      'personas._id': true,
      'personas.name': true,
      'personas.surname': true,
      'personas.nickname': true,
      'personas.is_default': true,
      'personas.avatar': true,
      'personas.social_network_accounts': true
    }
  });

  this.plugin(iWAExpUserPersPlugin, {
    methodName: 'getExpComments',
    path: 'comments.owner',
    userModel: iWAUser.mongooseModelName,
    userFields: {
      _id: true,
      avatars: true,
      social_network_accounts: true,
      'personas._id': true,
      'personas.name': true,
      'personas.surname': true,
      'personas.nickname': true,
      'personas.is_default': true,
      'personas.avatar': true
    }
  });
};

TimelineMessage.prototype.__proto__ = iWazatMessage.prototype;

/**
 * @param {Object | String } eventOrColName Object that specify the current message collection in these ways:
 *    # {String} : The name of collection
 *    # {Object#currentMessageCollection()}: Function that return the name of the collection
 *    # {Object#currentMessageCollection}: String with the name of the collection
 *    # {Object#message_collection}: String with the name of the collection
 */
TimelineMessage.prototype.mongooseModelOptions = function (eventOrColName) {

  if (!eventOrColName) {
    throw new Error('eventOrColName parameter is required (string or Mogoose iWazat Event document');
  }

  var msgCollection;

  if ('string' === typeof eventOrColName) {
    msgCollection = eventOrColName;
  } else if (eventOrColName.currentMessageCollection) {
    if (eventOrColName.currentMessageCollection instanceof Function) {
      msgCollection = eventOrColName.currentMessageCollection();
    } else {
      msgCollection = eventOrColName.currentMessageCollection;
    }
  } else if (eventOrColName.message_collection) {
    msgCollection = eventOrColName.message_collection;
  } else {
    throw new Error('It is not possible to inference the collection name from the eventOrColName ' +
	    'parameter. Received value: ' + eventOrColName);
  }

  return {
    modelName: 'TimelineMessage',
    collection: msgCollection,
    skipInit: {
      cache: false
    }
  };
};

/**
 * Return a new mongoose schema to attach to some fields of other schemas that crate documents
 * that need to reference to a timeline message document
 *
 * @returns {Object}
 */
TimelineMessage.prototype.referenceSchema = function () {

  return new mongoose.Schema({
      event_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
      },
      message_collection_num: {
        type: String,
        match: /\d{3}/,
        required: true
      },
      message_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
      },
      // This field is duplicate but allows to get some timeline's
      // notes between times rather than message id. It is a date but we check it manually on
      // create method
      message_created_at: {
        type: Date,
        required: true
      }
    },
    {
      _id: false,
      id: false
    });
};


var timelineMessage = (function () {
  var timelineMsg = new TimelineMessage;
  timelineMsg.TimelineMessage = TimelineMessage;

  return timelineMsg;
}());

module.exports = timelineMessage;


