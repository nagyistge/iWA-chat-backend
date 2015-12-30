'use strict';

/**
 * iWazat Event model
 *
 * This schema has fields that reference to other documents: The models names that reference, are:
 * User, Message
 */
module.exports = exports;
var settings = require('../../settings.js');

/**
 * Dependencies
 */
// Database
var mongoose = require('mongoose');
//var mongooseAttachments = require('mongoose-attachments');
var mongooseAttachments = require(settings.libsPath + '/mongoose-attachments');

var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWazat = require('./abstract/iWazat');
var iWAUser = require('./user');
var iWAActor = require('./abstract/partials/actor');
var iWAKeyword = require('./keyword');
var iWAExpUserPersPlugin = require('./_plugins/expandUserPersona');

// System entities
var iWADbErr = require(settings.sysPath + '/entities/errors').Db;

// Utils
var configLoader = require(settings.libsPath + '/iwazat/util/config');

/**
 * Constants
 */
var URL_REGEXP = /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?:\/[^\s]*)?$/i;

/**
 * iWazat Event model schema constructor.
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Event(schemaOptions) {

  var me = this;
  var usersEventRelationSchema = new UserEventRelation();

  this.schemaDefinition = {
    status: { // Status determines if the event is accessible by users or not
      type: String,
      enum: [ 'live', 'draft' ],
      'default': 'draft',
      required: true
    },
    title: {
      type: String,
      'default': 'Untitled Event',
      required: true
    },
    slug: {
      type: String,
      match: /^[a-z0-9\-_]{3,20}$/,
      required: true,
      unique: true
    },
    description: {
      short: {
        type: String
      },
      long: {
        type: String
      }
    },
    //organiser_avatar: //This field will be created and populated by mongoose-attachments plugin but
    // we take the uploaded image's url, if the user uploaded one, and assign
    // to the organiser_details.avatar filed
    organiser_details: {
      avatar: {
        type: String,
        match: URL_REGEXP
      },
      name: {
        type: String
      },
      bio: {
        type: String
      },
      website: {
        type: String,
        match: URL_REGEXP
      }
    },
    location: {
      venue_name: String,
      name: String,
      address: String,
      town: String,
      postcode: String,
      country: String,
      google_places_reference: String,
      coords: {
        latitude: Number,
        longitude: Number
      }
    },
    language: {
      type: String,
      'default': 'English',
      required: true
    },
    created_at: {
      type: Date,
      'default': Date.now
    },
    start_date: Date,

    end_date: Date,
    dates_timezone: {
      name: {
        type: String,
        required: true,
        'default': 'UTC'
      },
      offset: {
        type: Number,
        required: true,
        'default': 0
      }
    },
    timeline_status: {
    // it determines if the timeline can receive messages or not
    // (whatever messages internal or external)
      type: String,
      enum: [ 'open', 'close' ],
      'default': 'close',
      required: true
    },
    social_accounts: {
      twitter: {
        account: {
          type: String,
          match: /^[\w_]+$/
        },
        hashtags: [
          {
            type: String,
            match: /^[\w_]+$/
          }
        ],
        mentions: [
          {
            type: String,
            match: /^[\w_]+$/
          }
        ]
      }
    },
    // design_background_image: // This field is populate by mongoose_attachment plugin
    // design_banner_image: // This field is populate by mongoose_attachment plugin
    design: { // TODO refactor remove
      background: {
        color: String,
        visualization: {
          type: String,
          enum: [ 'expanded', 'tiled', 'normal' ]
        },
        position: {
          horizontal: {
            type: String,
            enum: [ 'right, left, center' ]
          },
          vertical: {
            type: String,
            enum: [ 'top', 'bottom', 'middle' ]
          }
        }
      },
      banner: {
        color: String,
        visualization: {
          type: String,
          enum: [ 'expanded', 'tiled', 'normal' ]
        },
        position: {
          type: String,
          enum: [ 'right, left, center' ]
        }
      },
      text: {
        color: String,
        type: String,
        size: Number,
        unit: String
      }
    },
    tags: [iWAKeyword.referenceSchema()],
    skills_suggestions: [iWAKeyword.referenceSchema()],
    interests_involved: [
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: iWAKeyword.mongooseModelName
        },
        used_words: {
          /*****
           *  This object has the next attributes structure to ease the document update in one
           *  update command without need the manage the document out of MongoDB.
           *  Each attribute name of this object represents a stringify id of an used word of the
           *  specified keyword _id field in the object's parent, concatenated with '_' and the
           *  language (lang field of the keyword-word); the attribute value is an object that at
           *  least contains one attribute named 'participants' that contains attributes whose names
           *  are stringify id of an user id (participant) that has used this word and whose values
           *  are the assessment of the word related to the user for this event.
           *
           *  Example object:
           *
           *  51290222c9d710c113000012_en: {
           *    participants: {
           *      512befe3f1e04c3d7000001f: 10
           *    }
           *  }
           ****/
        }
      }
    ],
    skills_have_involved: [
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: iWAKeyword.mongooseModelName
        },
        used_words: {
          /* This object use the same structure of interests_involved field, read it in its comment*/
        }
      }
    ],
    skills_want_involved: [
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: iWAKeyword.mongooseModelName
        },
        used_words: {
          /* This object use the same structure of interests_involved field, read it in its comment*/
        }
      }
    ],
    /*
     organisers: {
     owner: iWAActor.schemaDefinition,
     managers: [ iWAActor ],
     contributors: [ iWAActor ]
     },*/
    // Arrays that define the users related with the event organisation attach to root level
    owner: iWAActor.schemaDefinition,
    managers: [ iWAActor ],
    contributors: [ iWAActor ],
    sponsors: mongoose.SchemaTypes.Mixed,
    access: {
      type: String,
      enum: [ 'public', 'private' ],
      'default': 'public',
      required: true
    },
    guests: [
      // Embedded document of one field, rather an single value array, to be able to add
      // add additional information to this field if we need it in the future
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: iWAUser.mongooseModelName
        }
      }
    ],
    unaccepted: [
      // Embedded document of one field, rather an single value array, to be able to add
      // add additional information to this field if we need it in the future
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: iWAUser.mongooseModelName
        }
      }
    ],
    requesters: [ usersEventRelationSchema ],
    participants: [ usersEventRelationSchema ],

    message_collection_count: {
      type: String,
      'default': '001', // collection 000 is reserved for future use, for admin / favourites / etc
      match: /^\d{3}$/
    }
  };

  if (!schemaOptions) {
    schemaOptions = {
      collection: 'events'
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'events';
    }
  }

  // Call parent constructor
  iWazat.call(this, schemaOptions);

  Object.defineProperty(this, 'mongooseModelName', {
    get: function () {
      return 'Event';
    }
  });


	/**
	 * Variables used in middlewares, methods and so on to avoid to load the values each call
	 * because they always load the same object -- Enhance de performance
	 */
	var UserModel = iWAMongo.model(iWAUser);
	var KeywordModel = iWAMongo.model(iWAKeyword);


	/** Document virtual types **/

  this.virtual('currentMessageCollection').get(function () {
    return me.resolveMessageCollectionName(this.id, this.message_collection_count);
  });

  this.virtual('owner.id').get(function () {
    if ((this.owner._id) && ('object' === typeof this.owner._id)) {
      return  this.owner._id.toString();
    } else {
      return this.owner._id;
    }
  });

  /** Model methods **/

    // COMMENTED BECAUSE IT IS NOT USED, AND AVOID TO OVERLOAD THE MODEL CREATIONG OBJECT
//  this.static('registerParticipant', function (eventId, user, callback) {
//
//    var self = this;
//
//    UserModel.findByIdAndUpdate(user.id, {$push: {
//      events_access_allowed: {
//        _id: eventId,
//        persona: user.persona.id
//      }
//    }}, {multi: false}, function (err, updatedUser) {
//      if (err) {
//        if (callback) {
//          callback(err);
//        }
//        return;
//      }
//
//      if (!updatedUser) {
//        err = new iWADbErr('Detected inconsistent data, update\'s operation aborted | User ' +
//          user.id + 'with id: doesn\'t exist', 523);
//
//        if (callback) {
//          callback(err);
//        }
//        return;
//      }
//
//      var entityObj = iWAActor.createActorFromObject(user);
//      entityObj.timestamp = new Date();
//
//      self.update({_id: eventId}, {
//        $push: {participants: entityObj}
//      }, function (err, numAffected, raw) {
//
//        if (callback) {
//          if (err) {
//            callback(err);
//            return;
//          }
//
//          if (numAffected !== 1) {
//            callback(new Error('This method should be modified one document but, any document was modified'));
//            return;
//          }
//
//          callback();
//        }
//      }); // End event update
//    });// End the user update
//  });

  this.static('currentMessageCollection', function (eventId, callback) {

    this.findById(eventId, {
      message_collection_count: true
    }, {
      lean: true
    }, function (err, event) {

      if (err) {
        callback(err);
        return;
      }

      if (!event) {
        callback(null, null);
        return;
      }

      callback(null, me.resolveMessageCollectionName(eventId, event.message_collection_count));
    });

  });

  this.static('registerInvolvedInterest',
    function (eventId, userId, assessment, keywordId, wordId, wordLang, callback) {

      var self = this;

      this.findOne({
        _id: eventId,
        'interests_involved._id': keywordId
      }, function (err, event) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        var keywordRef;
        var attrName;

        if (!event) {
          keywordRef = {
            _id: keywordId,
            used_words: {}
          };

          attrName = wordId + '_' + wordLang;

          keywordRef.used_words[attrName] = {participants: {}};
          keywordRef.used_words[attrName].participants[userId] = assessment;

          self.update({_id: eventId}, {
            $push: {
              'interests_involved': keywordRef
            }
          }, callback);

          return;
        }


        keywordRef = {
          $set: {}
        };

        attrName = 'interests_involved.$.used_words.' + wordId + '_' + wordLang + '.participants.' +
          userId;

        keywordRef.$set[attrName] = assessment;

        self.update({
            _id: eventId,
            'interests_involved._id': keywordId
          },
          keywordRef, callback);


      }); // End findOne
    }); // End static method definition


  this.static('registerInvolvedSkillHave',
    function (eventId, userId, assessment, keywordId, wordId, wordLang, callback) {

      var self = this;

      this.findOne({
        _id: eventId,
        'skills_have_involved._id': keywordId
      }, function (err, event) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        var keywordRef;
        var attrName;

        if (!event) {
          keywordRef = {
            _id: keywordId,
            used_words: {}
          };

          attrName = wordId + '_' + wordLang;

          keywordRef.used_words[attrName] = {participants: {}};
          keywordRef.used_words[attrName].participants[userId] = assessment;

          self.update({_id: eventId}, {
            $push: {
              'skills_have_involved': keywordRef
            }
          }, callback);

          return;
        }


        keywordRef = {
          $set: {}
        };

        attrName =
          'skills_have_involved.$.used_words.' + wordId + '_' + wordLang + '.participants.' +
            userId;

        keywordRef.$set[attrName] = assessment;

        self.update({
            _id: eventId,
            'skills_have_involved._id': keywordId
          },
          keywordRef, callback);


      }); // End findOne
    }); // End static method definition

  this.static('registerInvolvedSkillWant',
    function (eventId, userId, assessment, keywordId, wordId, wordLang, callback) {

      var self = this;

      this.findOne({
        _id: eventId,
        'skills_want_involved._id': keywordId
      }, function (err, event) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        var keywordRef;
        var attrName;

        if (!event) {
          keywordRef = {
            _id: keywordId,
            used_words: {}
          };

          attrName = wordId + '_' + wordLang;

          keywordRef.used_words[attrName] = {participants: {}};
          keywordRef.used_words[attrName].participants[userId] = assessment;

          self.update({_id: eventId}, {
            $push: {
              'skills_want_involved': keywordRef
            }
          }, callback);

          return;
        }


        keywordRef = {
          $set: {}
        };

        attrName =
          'skills_want_involved.$.used_words.' + wordId + '_' + wordLang + '.participants.' +
            userId;

        keywordRef.$set[attrName] = assessment;

        self.update({
            _id: eventId,
            'skills_want_involved._id': keywordId
          },
          keywordRef, callback);


      }); // End findOne
    }); // End static method definition

  this.static('unregisterInvolvedInterest',
    function (eventId, userId, keywordId, wordId, wordLang, callback) {

      var keywordRef = {
        $unset: {}
      };

      var attrName = 'interests_involved.$.used_words.' + wordId + '_' + wordLang +
        '.participants.' +
        userId;

      keywordRef.$unset[attrName] = true;

      this.update({
        _id: eventId,
        'interests_involved._id': keywordId
      }, keywordRef, callback);

    }); // End static method definition

  this.static('unregisterInvolvedSkillHave',
    function (eventId, userId, keywordId, wordId, wordLang, callback) {

      var keywordRef = {
        $unset: {}
      };

      var attrName = 'skills_have_involved.$.used_words.' + wordId + '_' + wordLang +
        '.participants.' +
        userId;

      keywordRef.$unset[attrName] = true;

      this.update({
        _id: eventId,
        'skills_have_involved._id': keywordId
      }, keywordRef, callback);

    }); // End static method definition

  this.static('unregisterInvolvedSkillWant',
    function (eventId, userId, keywordId, wordId, wordLang, callback) {

      var keywordRef = {
        $unset: {}
      };

      var attrName = 'skills_want_involved.$.used_words.' + wordId + '_' + wordLang +
        '.participants.' +
        userId;

      keywordRef.$unset[attrName] = true;

      this.update({
        _id: eventId,
        'skills_want_involved._id': keywordId
      }, keywordRef, callback);

    }); // End static method definition


  /**
   * @param {Array | Null} kwRefToAdd
   * @param {Array | Null} kwRefToRemove
   * @param {Function} callback
   *
   *  These two parameters are required, so if one of them doesn't apply then Null must be used.
   *  They are an array of keyword references object, whose have the next attributes:
   *    {
   *      keyword_id: Keyword id
   *      word_id: Word id bound to the keyword
   *      lang: The language of the word is
   *      [assessment]: The integer number to assess the keyword to the user, if it doesn't provided
   *        0 is used
   *    }
   */
  this.static('updateInvolvedInterests',
    function (eventId, userId, kwRefToAdd, kwRefToRemove, callback) {

      var self = this;
      var addCbCounter = 0;
      var removeCbCounter = 0;
      var errors = [];
      var numTotalAffected = 0;


      function addCallback(err, numAffected, raw) {
        addCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected add interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End addCallback

      function removeCallback(err, numAffected, raw) {
        removeCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected remove interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End removeCallback

      if (kwRefToRemove) {
        removeCbCounter = kwRefToRemove.length;

        kwRefToRemove.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.unregisterInvolvedInterest(eventId, userId, kwRef.keyword_id, kwRef.word_id,
            kwRef.lang, removeCallback);

        });
      }

      if (kwRefToAdd) {
        addCbCounter = kwRefToAdd.length;

        kwRefToAdd.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.registerInvolvedInterest(eventId, userId, assessment, kwRef.keyword_id,
            kwRef.word_id,
            kwRef.lang, addCallback);

        });
      }


    }); // End static method definition

  /**
   * @param {Array | Null} kwRefToAdd
   * @param {Array | Null} kwRefToRemove
   * @param {Function} callback
   *
   *  These two parameters are required, so if one of them doesn't apply then Null must be used.
   *  They are an array of keyword references object, whose have the next attributes:
   *    {
   *      keyword_id: Keyword id
   *      word_id: Word id bound to the keyword
   *      lang: The language of the word is
   *      [assessment]: The integer number to assess the keyword to the user, if it doesn't provided
   *        0 is used
   *    }
   */
  this.static('updateInvolvedSkillsHave',
    function (eventId, userId, kwRefToAdd, kwRefToRemove, callback) {

      var self = this;
      var addCbCounter = 0;
      var removeCbCounter = 0;
      var errors = [];
      var numTotalAffected = 0;


      function addCallback(err, numAffected, raw) {
        addCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected add interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End addCallback

      function removeCallback(err, numAffected, raw) {
        removeCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected remove interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End removeCallback

      if (kwRefToRemove) {
        removeCbCounter = kwRefToRemove.length;

        kwRefToRemove.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.unregisterInvolvedSkillHave(eventId, userId, kwRef.keyword_id, kwRef.word_id,
            kwRef.lang, removeCallback);

        });
      }

      if (kwRefToAdd) {
        addCbCounter = kwRefToAdd.length;

        kwRefToAdd.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.registerInvolvedSkillHave(eventId, userId, assessment, kwRef.keyword_id,
            kwRef.word_id,
            kwRef.lang, addCallback);

        });
      }

    }); // End static method definition

  /**
   * @param {Array | Null} kwRefToAdd
   * @param {Array | Null} kwRefToRemove
   * @param {Function} callback
   *
   *  These two parameters are required, so if one of them doesn't apply then Null must be used.
   *  They are an array of keyword references object, whose have the next attributes:
   *    {
   *      keyword_id: Keyword id
   *      word_id: Word id bound to the keyword
   *      lang: The language of the word is
   *      [assessment]: The integer number to assess the keyword to the user, if it doesn't provided
   *        0 is used
   *    }
   */
  this.static('updateInvolvedSkillsWant',
    function (eventId, userId, kwRefToAdd, kwRefToRemove, callback) {

      var self = this;
      var addCbCounter = 0;
      var removeCbCounter = 0;
      var errors = [];
      var numTotalAffected = 0;


      function addCallback(err, numAffected, raw) {
        addCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected add interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End addCallback

      function removeCallback(err, numAffected, raw) {
        removeCbCounter--;

        if (err) {
          errors.push({
            error: err,
            raw: raw
          });
          return;
        }

        if (numAffected !== 1) {
          errors.push({
            error: new Error('Unexpected remove interests update because zero or more than ' +
              +'one event were updated')
          });
          return;
        }

        numTotalAffected++;

        if ((removeCbCounter === 0) && (addCbCounter === 0)) {
          if (errors.length > 0) {
            callback(new Error({
              message: 'multiple operation errors',
              errors: errors
            }), numTotalAffected);
          } else {
            callback(null, numTotalAffected);
          }
        }
      } // End removeCallback

      if (kwRefToRemove) {
        removeCbCounter = kwRefToRemove.length;

        kwRefToRemove.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.unregisterInvolvedSkillWant(eventId, userId, kwRef.keyword_id, kwRef.word_id,
            kwRef.lang, removeCallback);

        });
      }

      if (kwRefToAdd) {
        addCbCounter = kwRefToAdd.length;

        kwRefToAdd.forEach(function (kwRef) {
          var assessment;

          if (kwRef.assessment) {
            assessment = kwRef.assesment;
          } else {
            assessment = 0;
          }

          self.registerInvolvedSkillWant(eventId, userId, assessment, kwRef.keyword_id,
            kwRef.word_id,
            kwRef.lang, addCallback);

        });
      }

    }); // End static method definition


  /** Document methods **/
  /**
   * Add the specified user to the appropriated user registration array for the specified user's
   * role and update the user's events array.
   *
   * Pre-conditions:
   *    # The provided user doesn't exist into the participants array
   *    # The user object has the next attributes :
   *      id: User id
   *      persona: { // The current persona that the user is using in the current login
   *        id: User persona id
   *      }
   *
   * NOTE: This method, for performance's reasons, uses push rather than addToSet, see
   * preconditions above.
   *
   * @param {Object} user
   * @param {String} role Accepted roles are: manager, contributor and participant
   * @param {Function} callback
   */
    //this.methods.registerParticipant = function (user, callback) {
  this.methods.registerUser = function (user, role, callback) {

    var self = this;

    UserModel.findByIdAndUpdate(user.id, {$push: {
      events_access_allowed: {
        _id: this.id,
        persona: user.persona.id,
        role: role
      }
    }}, {multi: false}, function (err, updatedUser) {
      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      }

      if (!updatedUser) {
        if (callback) {
          callback(new iWADbErr('Detected inconsistent data, update\'s operation aborted | User ' +
            user.id + 'with id: doesn\'t exist', 523));
        }
        return;
      }

      var entityObj = iWAActor.createActorFromObject(user);
      var updateObj = {
        $push: {}
      };

      switch (role) {
        case 'manager':
          updateObj.$push.managers = entityObj;
          break;
        case 'contributor':
          updateObj.$push.contributors = entityObj;
          break;
        case 'participant':
          entityObj.timestamp = new Date();
          updateObj.$push.participants = entityObj;
          break;
        default:
          callback(new Error('Unsupported event user\'s role: ' + role));
          return;
      }

      self.update(updateObj, callback);

    });// End if the user update
  };

  /**
   * Add the specified user to requesters array and update the user's request events access.
   * This method call to update document's operation, appending the new user into
   * participants array
   *
   * Pre-conditions:
   *    # The provided user doesn't exist into the participants array
   *    # The user object has the next attributes :
   *      id: User id
   *      persona: { // The current persona that the user is using in the current login
   *        id: User persona identityObj
   *      }
   *
   * NOTE: This method, for performance's reasons, uses push rather than addToSet, see
   * preconditions above.
   *
   * @param {Object} user
   * @param {Function} callback
   */
  this.methods.registerRequester = function (user, callback) {

    var self = this;
    var User = iWAMongo.model(iWAUser);

    User.findByIdAndUpdate(user.id, {$push: {
      events_access_requests: {
        _id: this.id,
        persona: user.persona.id
      }
    }}, {multi: false}, function (err, updatedUser) {
      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      }

      if (!updatedUser) {
        if (callback) {
          callback(new iWADbErr('Detected inconsistent data, update\'s operation aborted | User ' +
            'with id: ' + user.id + ' doesn\'t exist', 523));
        }
        return;
      }

      var entityObj = iWAActor.createActorFromObject(user);
      entityObj.timestamp = new Date();

      self.update({
        $push: {requesters: entityObj}
      }, callback);

    });// End if the user update
  };

	/**
	 * Dereference the event tags
	 *
	 * @param {Function} callback
	 * @return {*}
	 */
	this.methods.dereferenceTags = function (callback) {

		var langsIdxs;
		var lIdx;
		var lPath;
		var lIdxToAddKeyword;
		var pKeywords;
		var aggPipelineCmds;
		var keywordId;
		var wordId;
		var tags;


		if ((!this.tags) || (0 === this.tags.length)) {
			callback(null, []);
			return;
		}

		langsIdxs = {};
		pKeywords = {};
		aggPipelineCmds = [];

		this.tags.forEach(function (tag) {

			keywordId = tag.id
			pKeywords[keywordId] = {};
			lIdxToAddKeyword = {};

			tag.used_words.forEach(function (word) {

				if (pKeywords[keywordId][word.lang] === undefined) {
					pKeywords[keywordId][word.lang] = {};
				}

				pKeywords[keywordId][word.lang][word.id] = true;

				lIdx = langsIdxs[word.lang];

				if (lIdx === undefined) {
					langsIdxs[word.lang] = aggPipelineCmds.length;
					lIdxToAddKeyword[aggPipelineCmds.length] = word.lang;
				} else {
					lIdxToAddKeyword[lIdx] = word.lang;
				}
			}); // End loop words

			for (lIdx in lIdxToAddKeyword) {
				lPath = 'words_' + lIdxToAddKeyword[lIdx];

				if (aggPipelineCmds[lIdx] === undefined) {
					aggPipelineCmds[lIdx] = [
						{
							lang: lIdxToAddKeyword[lIdx] // This field will be removed before launching the query
						},
						{
							$match: {
								_id: {$in: [tag._id]}
							}
						},
						{$sort: {_id: 1}}
					];

					aggPipelineCmds[lIdx][2].$sort[lPath + '._id'] = 1;
					aggPipelineCmds[lIdx][3] = {
						$unwind: '$' + lPath
					};
					aggPipelineCmds[lIdx][4] = {
						$project: {
							_id: 0,
							keyword_id: '$_id',
							word_id: '$' + lPath + '._id',
							word: '$' + lPath + '.word'
						}
					};
				} else {
					aggPipelineCmds[lIdx][1].$match._id.$in.push(tag._id);
				}
			}
		}); // End loop tags


		tags = [];

		function joinQueries(err, lang, keywordRefs) {
			if (err) {
				callback(err);
			}

			keywordRefs.forEach(function (keywordRef) {
				keywordId = keywordRef.keyword_id.toString();
				wordId = keywordRef.word_id.toString();

				if (pKeywords[keywordId][lang][wordId] === true) {
					tags.push({
						keyword_id: keywordId,
						word_id: wordId,
						word: keywordRef.word,
						lang: lang
					});
				}
			});

			if (lIdx === 0) {
				callback(null, tags);
			}
		}


		lIdx = aggPipelineCmds.length;

		aggPipelineCmds.forEach(function (aggCmdQuery) {

				lPath = aggCmdQuery.shift();
				KeywordModel.aggregate(aggCmdQuery, (function (lang) {
					return function (err, keywordRefs) {
						// An error happened in other callback call executed before this
						if (lIdx < 0) {
							return;
						}

						if (err) {
							lIdx = -1;
							joinQueries(err, lang);
							return;
						}

						lIdx--;
						joinQueries(null, lang, keywordRefs);
					};
				}(lPath.lang))
				);
			}
		);
	}; // End dereferenceTags

  /** Schema plugins applied **/

  this.plugin(iWAExpUserPersPlugin, {
    methodName: 'getParticipantsList',
    path: 'participants',
    userModel: iWAUser.mongooseModelName,
    userFields: {
      _id: true,
      avatars: true,
      'personas._id': true,
      'personas.nickname': true,
      'personas.name': true,
      'personas.surname': true,
      'personas.avatar': true,
      'personas.is_default': true
    }
  });

  var awsConfig = configLoader.getConfiguration(require(settings.configsPath + '/amazon'),
    'users_images_storage');

  this.plugin(mongooseAttachments, {
    directory: 'events',
    storage: {
      providerName: 's3',
      options: {
        key: awsConfig.key,
        secret: awsConfig.secret,
        bucket: awsConfig.bucket
      }
    },
    properties: {
      design_background_image: {
        styles: {
          original: {
            //keep the original file
          },
          //macbook_retina_15: { resize: '2880x1800' },
          //hd: { resize: '1920x1080' },
          //ipad_retina_landscape: { resize: '2048x1536' },
          //ipad_retina_portrait: { resize: '1536x2048' },
          ipad_2_landscape: {
            resize: '1024x768>',
            blur: '3x3'
          },
          ipad_2_portrait: {
            resize: '768x1024>',
            blur: '3x3'
          },
          iphone_retina_landscape: {
            resize: '960x640>',
            blur: '3x3'
          },
          iphone_retina_portrait: {
            resize: '640x960>',
            blur: '3x3'
          },
          iphone_3_landscape: {
            resize: '480x320>',
            blur: '3x3'
          },
          iphone_3_portrait: {
            resize: '320x480>',
            blur: '3x3'
          },
          thumb: {
            thumbnail: '100x100^',
            gravity: 'Center',
            extent: '100x100'
          }
        }
      },
      design_banner_image: {
        styles: {
          original: {
            // keep the original file
          },
          //macbook_retina_15: { resize: '2880x1800', blur: '3x3' },
          //hd: { resize: '1920x1080', blur: '3x3' },
          //ipad_retina_landscape: { resize: '2048x1536', blur: '3x3' },
          //ipad_retina_portrait: { resize: '1536x2048', blur: '3x3' },
          ipad_2_landscape: {
            resize: '1024x768>'
          },
          ipad_2_portrait: {
            resize: '768x1024>'
          },
          iphone_retina_landscape: {
            resize: '960x640>'
          },
          iphone_retina_portrait: {
            resize: '640x960>'
          },
          iphone_3_landscape: {
            resize: '480x320>'
          },
          iphone_3_portrait: {
            resize: '320x480>'
          },
          thumb: {
            thumbnail: '100x100^',
            gravity: 'Center',
            extent: '100x100'
          }
        }
      },
      'organiser_avatar': {
        styles: {
          original: {
            // keep the original file
          }
        }
      }
    }
  });

};

Event.prototype.__proto__ = iWazat.prototype;

Event.prototype.resolveMessageCollectionName = function (eventId, collectionNum) {
  //return 'messages_' + eventId + '_' + collectionNum;
  return 'timeline_messages_' + eventId + '_' + collectionNum;
}

/**
 * Constructor to create a new inherited Actor iWazat model to apply to store some user roles
 * relation with the sceham and avoid hard code the Actor schema to inherit future changes in it
 *
 * @constructor
 */
function UserEventRelation() {

  this.schemaDefinition = {
    timestamp: {
      type: Date,
      required: true
    }
  };

  iWAActor.Actor.call(this);
}

UserEventRelation.prototype.__proto__ = iWAActor.Actor.prototype;


var event = (function () {
  var event = new Event;
  event.Event = Event;

  return event;
}());


module.exports = exports = event;


