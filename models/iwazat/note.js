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

// iWazat Models
var iWazat = require('./abstract/iWazat');
var iWAUser = require('./user');
var iWAComment = require('./comment');
var iWAKeyword = require('./keyword');
var iWATimelineMessage = require('./timelineMessage');

// Mongoose plugins
var binAssessmentPlugin = require('./_plugins/binaryAssessment');
var accurateTsPlugin = require('./_plugins/accurateTimestamp');


/**
 * iWazat Note model schema constructor
 *
 * The exports of the this module is an sealed instance of this class.
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function Note(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition.status = {
    type: {
      type: String,
      enum: [ 'published', 'draft' ],
      required: true,
      'default': 'draft'
    },
    // Data parameter allows to setup some information related to the status, for example if
    // it is 'deferred', this attribute store the date of the note to do something
    data: mongoose.SchemaTypes.Mixed
  };

  this.schemaDefinition.content = {
    title: {
      type: String,
      match: /^[^\n\r\v\0\t]*$/
    },
    text: String,
    attachements: [ mongoose.SchemaTypes.Mixed ]
  };

  this.schemaDefinition.tags = [iWAKeyword.referenceSchema()];

  this.schemaDefinition.privacy = [
    {
      type: {
        type: String,
        enum: [ 'private', 'public', 'user', 'contacts', 'contact group'],
        'default': 'private'
      },
      data: mongoose.SchemaTypes.Mixed
    }
  ];


  this.schemaDefinition.metadata = {
    event_timeline_message: [iWATimelineMessage.referenceSchema()],
    user: [iWAUser.userRefSchema()]
  };

  this.schemaDefinition.comments = [ iWAComment ];

  if (!schemaOptions) {
    schemaOptions = {
      collection: 'notes',
      toObject: {
        transform: this.objJsonTranformation
      },
      toJSON: {
        transform: this.objJsonTranformation
      }
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'notes';
    }


    if (!schemaOptions.toObject) {
      schemaOptions.toObject = {
        transform: this.objJsonTranformation
      };
    } else if (!schemaOptions.toObject.transform) {
      schemaOptions.toObject.transform = this.objJsonTranformation;
    }

    if (!schemaOptions.toJSON) {
      schemaOptions.toJSON = {
        transform: this.objJsonTranformation
      };
    } else if (!schemaOptions.toJSON.transform) {
      schemaOptions.toJSON.transform = this.objJsonTranformation;
    }
  }


// Call parent constructor
//iWazat.call(this, this.schemaDefinition, schemaOptions);
  iWazat.call(this, schemaOptions);

  accurateTsPlugin(this);

  binAssessmentPlugin(this, {
    path: 'likes',
    methodName: 'assessNote',
    userModelName: iWAUser.mongooseModelName,
    userProfileFieldName: 'persona'
  });



// TODO: Next properties maybe are deprecated after iWazat schema has the method validateObject
// Validators definitions
//  var self = this;
//
//  Object.defineProperty(this.validators, 'statusesList', {
//    configurable: false,
//    enumerable: true,
//    get: function () {
//      return self.schemaDefinition.status.type.enum;
//    }
//  });
//
//  Object.defineProperty(this.validators, 'titleMatch', {
//    configurable: false,
//    enumerable: true,
//    get: function () {
//      return self.schemaDefinition.content.title.match;
//    }
//  });
//
//  Object.defineProperty(this.validators, 'metattachmentList', {
//    configurable: false,
//    enumerable: true,
//    get: function () {
//      return metattachmentsList;
//    }
//  });

}

Note.prototype.__proto__ = iWazat.prototype;

Note.prototype.mongooseModelOptions = function (user) {

  if (!user) {
    throw new Error('user parameter is required (string or Mogoose iWazat User document');
  }

  if ('object' === typeof user) {
    user = user.id;
  }

  return {
    modelName: 'Note',
    collection: this.options.collection + '_' + user,
    skipInit: {
      cache: false
    }
  };
};


Note.prototype.objJsonTranformation = function (doc, ret /*,options*/) {
  delete ret.__v;
};

var note = (function () {
  var note = new Note;
  note.Note = Note;

  return note;
}());

module.exports = exports = note; 

