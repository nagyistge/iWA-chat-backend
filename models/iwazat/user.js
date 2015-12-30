'use strict';

/**
 * iWazat User model
 *
 * About the user's fields:
 *    # account_status: Hold the status of the user's account; following there are a brief
 *      description about some weird status:
 *        - unregistered: Used when the account has been created because the user interacted
 *            externally with iWazat, for instance the user post a status in a social network and
 *            the system got it when was collecting information from a topic
 *
 * This schema has fields that reference to other documents: The models names that reference, are:
 * Event
 */
module.exports = exports;
var settings = require('../../settings.js');

/**
 * Dependencies
 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var iWAMongo = require(settings.dataSourcesPath + '/iwaMongo');
var iWazat = require('./abstract/iWazat');
var iWAKeyword = require('./keyword');
var iWAExpUserDefPersPlugin = require('./_plugins/expandUserDefaultPersona');

/**
 * Constants
 */
var URL_REGEXP = /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?:\/[^\s]*)?$/i;

/**
 * iWazat User model schema constructor.
 *
 * The exports of the this module is an sealed instance of this class
 *
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor (optional
 *          because for inheritance purposes maybe is required to change them: default is embedded
 *          into this constructor)
 *
 * @api public
 */
function User(schemaOptions) {

  var self = this;

  // Var to avoid hard code the model name in schema reflexion fields
  var modelName = 'User';

  // Var to avoid hard code the event model name, it is not possible to use directly the Event model
  // instance due to cyclic dependencies
  var eventModelName = 'Event';

  // TODO review the regular expressions of the 'text' field
  this.schemaDefinition = {
    created_at: {
      type: Date,
      'default': Date.now
    },
    activated_at: {
      type: Date
    },
    local_auth: {
      hash: {
        type: String,
        get: function () {
          /* Avoid that this field be modified externally */
          throw new Error(
            'This attribute is private and only it is managed internally for the object');
        },
        set: function (hash) {
          /* Avoid that this field be modified externally */
          throw new Error('This attribute cannot be changed externally');
        }
      },
      salt: {
        type: String,
        get: function () {
          /* Avoid that this field be modified externally */
          throw new Error(
            'This attribute is private and only it is managed internally for the object');
        },
        set: function (hash) {
          /* Avoid that this field be modified externally */
          throw new Error('This attribute cannot be changed externally');
        }
      }
    },
    account_status: {
      type: String,
      'enum': [ 'active', 'initial', 'unconfirmed', 'disabled', 'blocked', 'unregistered' ],
      'default': 'unregistered',
      required: true
    },
    birth_date: {
      type: Date
    },
    gender: {
      type: String,
      enum: [ 'male', 'female', 'undisclosed'],
      'default': 'undisclosed',
      required: true
    },
    avatars: [
      {
        url: {
          type: String,
          match: /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i
        },
        description: String
      }
    ],
    emails: [
      { // Use _id rather than address field name to use the capabilities of mongoose embedded documents type
        address: {
          type: String,
          match: /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/
        },
        verified: {
          type: Boolean,
          required: true,
          'default': false
        },
        is_default: {
          type: Boolean,
          require: true,
          'default': false
        }
      }
    ],
    telephone_nums: [
      {
        label: {
          type: String
        },
        number: {
          type: String,
          required: true
        }
      }
    ],
    social_network_accounts: [
      {
        type: {
          type: String,
          enum: [ 'Twitter', 'LinkedIn', 'Facebook', 'Google' ],
          required: true
        },
        account_id: {
          type: String,
          required: true
        },
        account_name: {
          type: String
          //required: true
        },
        profile_url: {
          type: String
        },
        status: {
          type: String,
          enum: ['authenticated', 'unauthenticated'],
          required: true
        },
        account_auth: mongoose.SchemaTypes.Mixed,
        account_profile: [ mongoose.SchemaTypes.Mixed ]
      }
    ],
    events_externally_interacted: [mongoose.SchemaTypes.ObjectId],
    events_access_allowed: [
      {
        _id: { // Event Id
          type: mongoose.SchemaTypes.ObjectId,
          ref: eventModelName
        },
        persona: { // Persona id that the user is using for the event
          type: mongoose.SchemaTypes.ObjectId
        },
        role: {
          type: String,
          enum: ['owner', 'manager', 'contributor', 'participant'],
          require: true
        }
      }
    ],
    events_access_requests: [
      {
        _id: { // Event Id
          type: mongoose.SchemaTypes.ObjectId,
          ref: eventModelName
        },
        persona: { // Persona id that the user is using for the event
          type: mongoose.SchemaTypes.ObjectId
        },
        resolution: {
          type: String,
          enum: ['pending', 'ok', 'no'],
          required: true,
          'default': 'pending'
        },
        timestamp: {
          type: Date,
          'default': Date.now
        }
      }
    ],
    // Arrays that define the relations with other users attach to root schema level to be
    // able to use $elemMatch
    contacts: [
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: modelName,
          required: true
        },
        persona: {
          type: mongoose.SchemaTypes.ObjectId,
          required: true
        },
        groups: [
          {
            type: String,
            match: /^[\w\d]+/
          }
        ]
      }
    ],
    favourite_users: [
      // This field only keep reference to the user's id and not to persona's id because
      // they are always showed with their current default persona
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: modelName
        },
        added_at: {
          type: Date,
          'defaul': Date.now
        }
      }
    ],
    following: [
      // This field only keep reference to the user's id and not to persona's id because
      // they are always showed with their current default persona
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: modelName
        },
        added_at: {
          type: Date,
          'defaul': Date.now
        }
      }
    ],
    followers: [
      // This field only keep reference to the user's id and not to persona's id because
      // they are always showed with their current default persona
      {
        _id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: modelName
        },
        started_at: {
          type: Date,
          'defaul': Date.now
        }
      }
    ],
    user_status: {
      type: String,
      required: true,
      enum: [ 'online', 'offline', 'busy' ],
      'default': 'offline'
    },
    unread_chats: {
      // This field store the chat's id like object property's name and the value
      // of it, it is and object that has the next two attributes:
      //  # last_message_at: The newest unread message created_at date value
      //  # counter: The number of unread messages
    },
    personas: [
      {
        persona_name: {
          type: String,
          'default': '_default'
        },
        created_at: {
          type: Date,
          'default': Date.now
        },
        nickname: {
          type: String,
          'default': ''
        },
        name: {
          type: String,
          'default': ''
        },
        surname: {
          type: String,
          'default': ''
        },
        avatar: mongoose.SchemaTypes.ObjectId, // Reference to one element of avatars user document root field
        is_default: {
          type: Boolean,
          'default': false,
          required: true
        },
        bio: String,
        show_birth_date: {
          type: Boolean,
          'default': false,
          required: true
        },
        location: String,
        languages: [ String
        ], // TODO migrate the values to an individual collection and populate with the ids
        show_gender: {
          type: Boolean,
          'default': false,
          required: true
        },
        visibility_status: {
          type: String,
          enum: [ 'private', 'public' ], // TODO we will need more  levels for following
          'default': 'private',
          required: true
        },
        emails: [
          {
            // Embedded document of one field, rather an single value array, to be able to add
            // add additional information to this field if we need it in the future
            // Reference to one element of emails user document root field
            _id: mongoose.SchemaTypes.ObjectId

          }
        ],
        show_emails: {
          type: Boolean,
          'default': false,
          required: true
        },
        telephone_nums: [
          {
            // Reference to one element of telephone_nums user document root field
            _id: mongoose.SchemaTypes.ObjectId,
            additional_info: String
          }
        ],
        im_accounts: [
          {
            type: {
              type: String,
              enum: [ 'AIM', 'Skype', 'Yahoo! messenger', 'GTalk', 'ICQ' ],
              required: true
            },
            account_id: {
              type: String,
              required: true
            }
          }
        ],
        website: {
          type: String,
          match: URL_REGEXP
        },
        companies: [ new mongoose.Schema(
          {
            name: String,
            position: String,
            start_date: Date,
            end_date: Date,
            description: String,
            location: String,
            website: {
              type: String,
              match: URL_REGEXP
            }
          }, {_id: false, id: false})
        ],
        // reference to the social_network_accounts property (array of subdocuments) attached to
        // this schema root
        social_network_accounts: [
          {
            // Embedded document of one field, rather an single value array, to be able to add
            // add additional information to this field if we need it in the future
            // Reference to one element of social_network_accounts user document root field
            _id: mongoose.SchemaTypes.ObjectId
          }
        ],
        skills_want: [
          {
            _id: {
              type: mongoose.SchemaTypes.ObjectId,
              ref: iWAKeyword.mongooseModelName
            },
            used_words: [
              {
                _id: mongoose.SchemaTypes.ObjectId, // This is the id that the word has in the keyword document
                lang: {
                  type: String,
                  required: true
                }
              }
            ]
          }
        ],
        skills_have: [
          {
            _id: {
              type: mongoose.SchemaTypes.ObjectId,
              ref: iWAKeyword.mongooseModelName
            },
            used_words: [
              {
                _id: mongoose.SchemaTypes.ObjectId, // This is the id that the word has in the keyword document
                lang: {
                  type: String,
                  required: true
                }
              }
            ]
          }
        ],
        interests: [
          {
            _id: {
              type: mongoose.SchemaTypes.ObjectId,
              ref: iWAKeyword.mongooseModelName
            },
            used_words: [
              {
                _id: mongoose.SchemaTypes.ObjectId, // This is the id that the word has in the keyword document
                lang: {
                  type: String,
                  required: true
                }
              }
            ]
          }
        ]
      }
    ]
  };

  if (!schemaOptions) {
    schemaOptions = {
      collection: 'users',
      toObject: {
        transform: this.objJsonTranformation
      },
      toJSON: {
        transform: this.objJsonTranformation
      }
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'users';
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
  iWazat.call(this, schemaOptions);

  Object.defineProperty(this, 'mongooseModelName', {
    enumerable: true,
    writable: false,
    value: modelName
  });

  /**
   * Variables used in middlewares, methods and so on to avoid to load the values each call
   * because they always load the same object -- Enhance de performance
   */
  var UserModel;
  var EventModel;
  var KeywordModel = iWAMongo.model(iWAKeyword);

  // Middlewares

  // Checks fields that contain reference to other users
  this.pre('save', true, function (next, done) {

    if (!UserModel) {
      UserModel = iWAMongo.model(self);
    }

    var userRefToCheck = [];

    // Allow to execute the next pre-middlewares
    next();

    if (this.isDirectModified('following')) {
      this.following.forEach(function (followUser) {

        if ((followUser.isNew) || (followUser.isDirectModified('_id'))) {
          userRefToCheck.push(followUser._id);
        }
      });
    }

    if (this.isDirectModified('followers')) {
      this.followers.forEach(function (follower) {

        if ((follower.isNew) || (follower.isDirectModified('_id'))) {
          userRefToCheck.push(follower._id);
        }
      });
    }

    if (userRefToCheck.length === 0) {
      done();
      return
    }

    UserModel.find({
        _id: {$in: userRefToCheck}
      },
      {_id: true},
      {lean: true},
      function (err, users) {

        if (err) {
          done(err);
          return;
        }

        if ((!users) || (users.length !== userRefToCheck.length)) {
          done(new Error('Some specified users doesn\'t exist'));
          return;
        }

        done();
      });
  });

  // Checks contact attribute modifications
  this.pre('save', true, function (next, done) {

    if (!UserModel) {
      UserModel = iWAMongo.model(self);
    }

    var contactsToCheck = {};
    var contactUserIds;

    // Allow to execute the next pre-middlewares
    next();

    if (this.isModified('contacts')) {
      this.contacts.forEach(function (contact) {

        if ((contact.isNew) || (contact.isDirectModified('_id'))
          || (contact.isDirectModified('persona'))) {

          contactsToCheck[contact._id.toString()] = contact.persona.toString();
        }
      });
    }

    contactUserIds = Object.keys(contactsToCheck);

    if (contactUserIds.length === 0) {
      done();
      return
    }

    UserModel.find({
        _id: {$in: contactUserIds}
      },
      {
        _id: true,
        'personas._id': true
      },
      {lean: true},
      function (err, users) {

        if (err) {
          done(err);
          return;
        }

        if ((!users) || (users.length !== contactUserIds.length)) {
          done(new Error('Some specified users doesn\'t exist'));
          return;
        }


        var personas;
        var pExist;

        for (var uIdx = 0; uIdx < users.length; uIdx++) {
          personas = users[uIdx];
          pExist = false;

          for (var pIdx = 0; pIdx < personas.length; pIdx++) {
            if (contactsToCheck[users[uIdx]._id.toString()] === personas[pIdx]._id.toString()) {
              pExist = true;
              break;
            }
          } // End loop personas

          if (!pExist) {
            done(new Error('A contact has been specified with an existent user but that user doesn\'t ' +
              'have a persona with the specified id'));
            return;
          }

        } // End loop users

        done();
      });
  });

  // Checks fields that contain events' references
  this.pre('save', true, function (next, done) {

    var self = this;

    if (!EventModel) {
      EventModel = iWAMongo.model(require('./event'));
    }

    var eventRefToCheck = [];
    var personasTocheck = {};

    // Allow to execute the next pre-middlewares
    next();

    if (this.isModified('events_access_requests')) {
      this.events_access_requests.forEach(function (event) {

        if ((event.isNew) || (event.isDirectModified('_id')) ||
          (event.isDirectModified('persona'))) {
          eventRefToCheck.push(event._id);
          personasTocheck[event.persona] = true;
        }
      });
    }

    if (this.isModified('events_access_allowed')) {
      this.events_access_allowed.forEach(function (event) {

        if ((event.isNew) || (event.isDirectModified('_id')) ||
          (event.isDirectModified('persona'))) {
          eventRefToCheck.push(event._id);
          personasTocheck[event.persona] = true;
        }
      });
    }

    if (eventRefToCheck.length === 0) {
      done();
      return
    }

    EventModel.find({
        _id: {$in: eventRefToCheck}
      },
      {_id: true},
      {lean: true},
      function (err, events) {

        if (err) {
          done(err);
          return;
        }

        if ((!events) || (events.length !== eventRefToCheck.length)) {
          done(new Error('Some specified event doesn\'t exist'));
          return;
        }

        if (!UserModel) {
          UserModel = iWAMongo.model(self);
        }

        personasTocheck = Object.keys(personasTocheck);

        UserModel.find({
          _id: self._id,
          'personas._id': { $all: personasTocheck}
        }, {
          _id: true
        }, {
          lean: true
        }, function (err, users) {
          if (err) {
            done(err);
            return;
          }

          if ((!users) || (users.length !== 1)) {
            done(new Error('A reference to some event has been added with an nonexistent user\'s ' +
              'persona id'));
            return;
          }

          done();
        });

      });
  });


  // Check personas modifications consistency
  this.pre('save', function (next) {
    var pIt;
    var idx;
    var persona;

    // Check persona references consistency
    if (this.isModified('personas')) {
      for (pIt = 0; pIt < this.personas.length; pIt++) {
        persona = this.personas[pIt];

        // Persona has been modified so check if some of its attributes, which contain reference to
        // itself user's attributes are consistent
        if (persona.isModified()) {

          // Telephone numbers modifications checks
          if (persona.isModified('telephone_nums')) {

            for (idx = 0; idx < persona.telephone_nums.length; idx++) {
              // check the consistency if it is new or the _id has been modified, else it isn't needed
              if ((persona.telephone_nums[idx].isNew) ||
                (persona.telephone_nums[idx].isDirectModified('_id'))) {

                if (!this.telephone_nums) {
                  next(new Error('Adding/modifying telephone numbers in personas requires ' +
                    'the telephone_nums attribute of the root of the user\'s document'));
                  return;
                }

                if (this.telephone_nums.id(persona.telephone_nums[idx]._id) === null) {
                  next(new Error('The telephone number added to persona: ' + persona._id +
                    ' with id: ' + persona.telephone_nums[idx]._id + ' is not valid because it ' +
                    'doesn\'t exist in the telephone_nums attribute of the root of the users\'s ' +
                    'document'));
                  return;
                }
              }
            }
          } // End telephone numbers modification checks

          // Emails modifications checks
          if (persona.isModified('emails')) {
            for (idx = 0; idx < persona.emails.length; idx++) {
              // check the consistency if it is new or the _id has been modified, else it isn't needed
              if ((persona.emails[idx].isNew) ||
                (persona.emails[idx].isModified())) {

                if (!this.emails) {
                  next(new Error('Adding/modifying emails in personas requires the ' +
                    'emails attribute of the root of the user\'s document'));
                  return;
                }

                if (this.emails.id(persona.emails[idx]._id) === null) {
                  next(new Error('The email added to persona: ' + persona._id +
                    ' with id: ' + persona.emails[idx]._id + ' is not valid because it doesn\'t ' +
                    'exist in the emails attribute of the root of the users\'s document'));
                  return;
                }
              }
            }
          } // End emails modification checks

          // Avatars modifications checks
          if (persona.isModified('avatar')) {
            if (!this.avatars) {
              next(new Error('Adding/modifying the avatar in personas requires the ' +
                'avatars attribute of the root of the user\'s document'));
              return;
            }

            if (this.avatars.id(persona.avatar) === null) {
              next(new Error('The avatar added to persona: ' + persona._id +
                ' with id: ' + persona.avatar + ' is not valid because it doesn\'t ' +
                'exist in the avatars attribute of the root of the users\'s document'));
              return;
            }
          } // End avatar modification
        }// End persona modifications checks
      } // End personas loop
    } // End personas modifications checks

    next();

  }); // End save pre-middleware


  /**
   * Retrieve the user data but only with the specified persona id.
   *
   * @param {String | Object} userId The user id. Stringify version of the ObjectId or the ObjectId
   * @param {String | Object} personaId The user's persona id. Stringify version of the ObjectId or
   *                          the ObjectId
   * @param {Array} [userFields] The fields' name of the user to retrieve. By default all the fields
   *                  are retrieved less the 'local_auth' field.
   * @param {Array} [personaFields] The fields' name  of the user's persona to retrieve. By default
   *                  all. The names of the fields must be without 'personas.' prefix.
   * @param {Function} the callback function to return the user document
   */
  this.static('getUserPersona', function (userId, personaId, userFields, personaFields, callback) {

    var fields;

    if ('function' === typeof userFields) {
      callback = userFields;

      fields = {
        _id: true,
        created_at: true,
        activated_at: true,
        //local_auth: false,
        account_status: true,
        birth_date: true,
        gender: true,
        avatars: true,
        emails: true,
        telephone_nums: true,
        social_network_accounts: true,
        events_access_allowed: true,
        events_access_requests: true,
        contacts: true,
        favourite_users: true,
        following: true,
        followers: true,
        user_status: true,
        unread_chats: true
      };
    }

    if ('function' === typeof personaFields) {

      fields = {};

      userFields.forEach(function (fieldName) {
        fields[fieldName] = true;
      });


      callback = personaFields;
      personaFields = null;
    } else {
      fields = {};

      userFields.forEach(function (fieldName) {
        fields[fieldName] = true;
      });
    }

    if (personaFields) {
      personaFields.forEach(function (fieldName) {
        fields['personas.' + fieldName] = true;
      });
    }

    fields.personas = {$elemMatch: {_id: personaId}};

    this.find({
        _id: userId,
        personas: {$elemMatch: {_id: personaId}}
      },
      fields,
      function (err, users) {
        if (err) {
          callback(err);
          return;
        }

        if (users.length === 0) {
          callback(new Error('It doesn\'t exist any user with the id: ' + userId + ' or that user' +
            ' doesn\'t have a persona with the id: ' + personaId));
        } else {
          callback(null, users[0]);
        }
      });
  }); // End getPersonaAvatar model method

//  this.static('getPersonaAvatar', function (userId, personaId, callback) {
//
//    this.find({
//      _id: userId,
//      personas: {$elemMatch: {_id: personaId}}
//    }, {
//      avatars: true,
//      personas: {$elemMatch: {_id: personaId}}
//    }, function (err, users) {
//      if (err) {
//        callback(err);
//        return;
//      }
//
//      if (!users) {
//        callback(new Error('It doesn\'t exist any user with the id: ' + userId + ' or that user ' +
//          'doesn\'t have a persona with the id: ' + personaId));
//        return;
//      }
//
//      var personaAvatar = users[0].personas[0].avatar;
//
//      if (personaAvatar) {
//        personaAvatar = users[0].avatars.id(personaAvatar);
//      }
//
//      callback(null, personaAvatar);
//    });
//  }); // End getPersonaAvatar model method

  // Model methods
  this.static('addUnreadChatMessage', function (userId, msgCollection, msgId, callback) {

    var pathMsgCol = 'unread_chats.messages.' + msgCollection;


    return this.findByIdAndUpdate(userId, {
      $inc: {'unread_chats.counter': 1},
      $addToSet: { pathMsgCol: msgId}
    }, callback);

  });

  this.static('markLikeReadChatMessage', function (userId, msgCollection, msgId, callback) {

    var self = this;

    this.findById(userId, function (err, user) {
      if ((err) || (!user)) {
        callback(err, user);
      } else {
        if ((user.unread_chats.messages) && (user.unread_chats.messages[msgCollection])) {

          // delete message collection attribute if it was the last unread message
          if (user.unread_chats.messages[msgCollection] <= 1) {
            delete user.unread_chats.messages[msgCollection];
          } else {
            // delete the specified message from the unread messages array
            if ('string' === typeof msgId) {
              msgId = mongoose.Types.ObjectId.fromString(msgId);
            }

            user.unread_chats.messages[msgCollection].remove(msgId);
          }

          // save changes
          user.save(callback);
        } else {
          if (callback) {
            // No Error, no document, so message collection didn't exist
            callback();
          }
        }
      }
    });
  });

  /** Create document methods **/
  //@see Mongoose#Document#methods
  /* Authentication */
  var cryptoOptions = {
    saltlen: 32,
    iterations: 25000,
    keylen: 512
  };

  /** Document methods **/
    // Local authentication password setter
  this.methods.setPassword = function (password, callback) {

    debugger;
    if (!callback) callback = function () {};

    if (!password) {
      return callback(new Error("Password argument not set!"));
    }

    var self = this;

    crypto.randomBytes(cryptoOptions.saltlen, function (err, buf) {
      if (err) {
        return callback(err);
      }

      var salt = buf.toString('hex');

      crypto.pbkdf2(password, salt, cryptoOptions.iterations, cryptoOptions.keylen, function (
        err, hashRaw) {
        if (err) {
          return callback(err);
        }

        self._doc.local_auth.hash = new Buffer(hashRaw).toString('hex');
        self._doc.local_auth.salt = salt;

        callback(null, self);
      });
    });
  }; // End setPassword

  //Local authentication password verifier
  this.methods.authenticate = function (password, callback) {
    var self = this;

    crypto.pbkdf2(password, this._doc.local_auth.salt, cryptoOptions.iterations,
      cryptoOptions.keylen, function (err, hashRaw) {
        if (err) {
          return callback(err);
        }

        var hash = new Buffer(hashRaw).toString('hex');

        if (hash === self._doc.local_auth.hash) {
          return callback(null, self);
        } else {
          return callback(null, false, {
            message: 'Incorrect password'
          });
        }
      });
  }; // End authenticate

  this.methods.personaAvatar = function (personaId) {

    if ((!this.personas) || (this.personas.length === 0) || (!this.avatars)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty ' +
        'and/or the avatars field');
    }

    var pi = 0;
    var persona;

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or math the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    return (persona.avatar) ? this.avatars.id(persona.avatar).url : null;
  }; // End personaAvatar

  this.methods.personaEmails = function (personaId) {

    if ((!this.personas) || (this.personas.length === 0) || (!this.emails)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty ' +
        'and/or the emails field');
    }

    var self = this;
    var pi = 0;
    var persona;
    var emailAddrs;

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or math the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if ((persona.show_emails !== true) || (!persona.emails)) {
      return null;
    } else {
      emailAddrs = [];

      persona.emails.forEach(function (uEmailAddr) {
        uEmailAddr = self.emails.id(uEmailAddr._id);

        emailAddrs.push({
          address: uEmailAddr.address,
          verified: uEmailAddr.verified
        })
      });

      return emailAddrs;
    }
  }; // End personaEmails

  this.methods.personaTelephones = function (personaId) {

    if ((!this.personas) || (this.personas.length === 0) || (!this.telephone_nums)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty ' +
        'and/or the telephone_nums field');
    }

    var self = this;
    var pi = 0;
    var persona;
    var telNums;
    var uTelNum;

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or math the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if (!persona.telephone_nums) {
      return null;
    } else {
      telNums = [];

      persona.telephone_nums.forEach(function (pTelNum) {
        uTelNum = self.telephone_nums.id(pTelNum._id);

        telNums.push({
          label: uTelNum.label,
          number: uTelNum.number,
          additional_info: pTelNum.additional_info
        })
      });

      return telNums;
    }
  }; // End personaTelephones

  this.methods.personaSocialNetworks = function (personaId) {

    if ((!this.personas) || (this.personas.length === 0) || (!this.social_network_accounts)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty' +
        'and/or the social_network_accounts field');
    }

    var self = this;
    var pi = 0;
    var persona;
    var snAccounts;

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or math the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if (!persona.social_network_accounts) {
      return null;
    } else {
      snAccounts = [];

      persona.social_network_accounts.forEach(function (snAccount) {

        snAccount = self.social_network_accounts.id(snAccount._id)

        snAccounts.push({
          type: snAccount.type,
          reference: {
            id: snAccount.account_id,
            name: snAccount.account_name,
            profile_url: snAccount.profile_url
          }
        });
      });

      return snAccounts;
    }
  }; // End personaSocialNetworks

  /**
   *
   * @param {String} [personaId]
   * @param {Function} callback
   * @return {*}
   */
  this.methods.personaInterests = function (personaId, callback) {
    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var pi = 0;
    var persona;
    var langsIdxs;
    var lIdx;
    var lPath;
    var lIdxToAddKeyword;
    var pKeywords;
    var aggPipelineCmds;
    var keywordId;
    var wordId;
    var interests;


    if ('function' === typeof personaId) {
      callback = personaId;
      personaId = false;
    }

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or match the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if (!persona.interests) {
      callback(null, null);
      return;
    }

    if (persona.interests.length === 0) {
      callback(null, []);
      return;
    }

    langsIdxs = {};
    pKeywords = {};
    aggPipelineCmds = [];

    persona.interests.forEach(function (interest) {

      keywordId = interest.id
      pKeywords[keywordId] = {};
      lIdxToAddKeyword = {};

      interest.used_words.forEach(function (word) {

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
                _id: {$in: [interest._id]}
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
          aggPipelineCmds[lIdx][1].$match._id.$in.push(interest._id);
        }
      }
    }); // End loop persona interests


    interests = [];

    function joinQueries(err, lang, keywordRefs) {
      if (err) {
        callback(err);
      }

      keywordRefs.forEach(function (keywordRef) {
        keywordId = keywordRef.keyword_id.toString();
        wordId = keywordRef.word_id.toString();

        if (pKeywords[keywordId][lang][wordId] === true) {
          interests.push({
            keyword_id: keywordId,
            word_id: wordId,
            word: keywordRef.word,
            lang: lang
          });
        }
      });

      if (lIdx === 0) {
        callback(null, interests);
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
  }; // End personaInterests

  /**
   *
   * @param {String} [personaId]
   * @param {Function} callback
   * @return {*}
   */
  this.methods.personaSkillsHave = function (personaId, callback) {
    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var pi = 0;
    var persona;
    var langsIdxs;
    var lIdx;
    var lPath;
    var lIdxToAddKeyword;
    var pKeywords;
    var aggPipelineCmds;
    var keywordId;
    var wordId;
    var skillsHave;


    if ('function' === typeof personaId) {
      callback = personaId;
      personaId = false;
    }

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or match the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if (!persona.skills_have) {
      callback(null, null);
      return;
    }

    if (persona.skills_have.length === 0) {
      callback(null, []);
      return;
    }

    langsIdxs = {};
    pKeywords = {};
    aggPipelineCmds = [];

    persona.skills_have.forEach(function (skill) {

      keywordId = skill.id
      pKeywords[keywordId] = {};
      lIdxToAddKeyword = {};

      skill.used_words.forEach(function (word) {

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
                _id: {$in: [skill._id]}
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
          aggPipelineCmds[lIdx][1].$match._id.$in.push(skill._id);
        }
      }
    }); // End loop persona skills


    skillsHave = [];

    function joinQueries(err, lang, keywordRefs) {
      if (err) {
        callback(err);
      }

      keywordRefs.forEach(function (keywordRef) {
        keywordId = keywordRef.keyword_id.toString();
        wordId = keywordRef.word_id.toString();

        if (pKeywords[keywordId][lang][wordId] === true) {
          skillsHave.push({
            keyword_id: keywordId,
            word_id: wordId,
            word: keywordRef.word,
            lang: lang
          });
        }
      });

      if (lIdx === 0) {
        callback(null, skillsHave);
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
  }; // End personaSkillsHave


  /**
   *
   * @param {String} [personaId]
   * @param {Function} callback
   * @return {*}
   */
  this.methods.personaSkillsWant = function (personaId, callback) {
    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var pi = 0;
    var persona;
    var langsIdxs;
    var lIdx;
    var lPath;
    var lIdxToAddKeyword;
    var pKeywords;
    var aggPipelineCmds;
    var keywordId;
    var wordId;
    var skillsWant;


    if ('function' === typeof personaId) {
      callback = personaId;
      personaId = false;
    }

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }
    }

    if (!persona) {
      throw new Error('Any persona was specified or match the provided id, and the user\'s ' +
        'document personas array have more than one document and any of them is the default persona');
    }

    if (!persona.skills_want) {
      callback(null, null);
      return;
    }

    if (persona.skills_want.length === 0) {
      callback(null, []);
      return;
    }

    langsIdxs = {};
    pKeywords = {};
    aggPipelineCmds = [];

    persona.skills_want.forEach(function (skill) {

      keywordId = skill.id
      pKeywords[keywordId] = {};
      lIdxToAddKeyword = {};

      skill.used_words.forEach(function (word) {

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
                _id: {$in: [skill._id]}
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
          aggPipelineCmds[lIdx][1].$match._id.$in.push(skill._id);
        }
      }
    }); // End loop persona skills


    skillsWant = [];

    function joinQueries(err, lang, keywordRefs) {
      if (err) {
        callback(err);
      }

      keywordRefs.forEach(function (keywordRef) {
        keywordId = keywordRef.keyword_id.toString();
        wordId = keywordRef.word_id.toString();

        if (pKeywords[keywordId][lang][wordId] === true) {
          skillsWant.push({
            keyword_id: keywordId,
            word_id: wordId,
            word: keywordRef.word,
            lang: lang
          });
        }
      });

      if (lIdx === 0) {
        callback(null, skillsWant);
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
  }; // End personaskillsWant

  this.methods.iWazatContact = function (personaId, callback) {

    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var self = this;
    var pi = 0;
    var persona;
    var iWAContact;
    var callbackCallsLeft = 3;

    if ('function' === typeof personaId) {
      callback = personaId;
      personaId = false;
    }

    if (this.personas.length === 1) {
      persona = this.personas[0];
    } else {
      for (pi = 0; this.personas.length; pi++) {
        if (!personaId) {
          if (this.personas[pi].is_default === true) {
            persona = this.personas[pi];
            break;
          }
        } else {
          if (this.personas[pi].id === personaId) {
            persona = this.personas[pi];
            break;
          }
        }
      }

      if (!persona) {
        throw new Error('Any persona was specified or match the provided id, and the user\'s ' +
          'document personas array have more than one document and any of them is the default persona');
      }
    }


    iWAContact = {
      _id: self.id,
      persona: (persona.is_default === true) ? 'default' : persona.id,
      name: persona.name,
      surname: persona.surname,
      nickname: persona.nickname,
      avatar: this.personaAvatar(personaId),
      bio: persona.bio,
      languages: persona.languages,
      gender: (persona.show_gender === true) ? this.gender : 'undisclosed',
      emails: this.personaEmails(personaId),
      telephone_nums: this.personaTelephones(personaId),
      im_accounts: persona.im_accounts,
      social_network_accounts: this.personaSocialNetworks(personaId),
      website: (persona.show_gender) ? persona.website : '',
      companies: persona.companies
    };

    function keywordsCbsCollector(err, field, keywordRefs) {

      // One error has happened in a previous call
      if (callbackCallsLeft < 0) {
        return;
      }

      callbackCallsLeft--;

      if (err) {
        callbackCallsLeft = -1;
        callback(err, null);
        return;
      }

      iWAContact[field] = keywordRefs;

      if (callbackCallsLeft === 0) {
        callback(null, iWAContact);
      }
    }

    this.personaInterests(personaId, (function () {
      return  function (err, keywordRefs) {
        keywordsCbsCollector(err, 'interests', keywordRefs);
      };
    }()));

    this.personaSkillsHave(personaId, (function () {
      return  function (err, keywordRefs) {
        keywordsCbsCollector(err, 'skills_have', keywordRefs);
      };
    }()));

    this.personaSkillsWant(personaId, (function () {
      return  function (err, keywordRefs) {
        keywordsCbsCollector(err, 'skills_want', keywordRefs);
      };
    }()));

  };

  //TODO continue here!!
  this.methods.dereferenceKeywords = function (personaId, callback) {

    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var self = this;
    var pi = 0;
    var personas;
    var pKeyWordsMap = {};
    var callbackCallsLeft = 3;

    if ('function' === typeof personaId) {
      callback = personaId;
      personas = this.personas;
    } else {
      personas = this.personas.id(personaId);

      if (!personas) {
        throw new Error('Any user\'s persona in this current document exist with the id: ' +
          personaId);
      }
      personas = [personas];
    }

    callbackCallsLeft *= personas.length;

    function keywordsCbsCollector(err, personaId, field, keywordRefs) {

      // One error has happened in a previous call
      if (callbackCallsLeft < 0) {
        return;
      }

      callbackCallsLeft--;

      if (err) {
        callbackCallsLeft = -1;
        callback(err, null);
        return;
      }

      if (!pKeyWordsMap[personaId]) {
        pKeyWordsMap[personaId] = {}
      }

      pKeyWordsMap[personaId][field] = keywordRefs;


      if (callbackCallsLeft === 0) {
        callback(null, pKeyWordsMap);
      }
    }

    personas.forEach(function (persona) {

      var personaId = persona.id;

      self.personaInterests(personaId, (function () {
        return  function (err, keywordRefs) {
          keywordsCbsCollector(err, personaId, 'interests', keywordRefs);
        };
      }()));

      self.personaSkillsHave(personaId, (function () {
        return  function (err, keywordRefs) {
          keywordsCbsCollector(err, personaId, 'skills_have', keywordRefs);
        };
      }()));

      self.personaSkillsWant(personaId, (function () {
        return  function (err, keywordRefs) {
          keywordsCbsCollector(err, personaId, 'skills_want', keywordRefs);
        };
      }()));
    });
  };

  /** Document virtual types **/
  /**
   * Return the default persona or the first persona into the personas array
   * if the document doesn't contains the default persona
   */
  this.virtual('persona').get(function () {

    if ((!this.personas) || (this.personas.length === 0)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty');
    }

    var persona = this.personas[0];
    var pi;


    for (pi = 0; this.personas.length; pi++) {
      if (this.personas[pi].is_default === true) {
        persona = this.personas[pi];
        break;
      }
    }

    return persona;
  }); // End persona virtual path

  /**
   * Return the avatar of the default persona or the first persona into the personas array
   * if the document doesn't contains the default persona
   */
  this.virtual('persona.avatar').get(function () {

    if ((!this.personas) || (this.personas.length === 0) || (!this.avatars)) {
      throw new Error('User\'s document doesn\'t have the personas field or the array is empty or' +
        ' doesn\'t have the avatars field');
    }

    var pi = 0;
    var pAvatar = this.personas[0].avatar;

    if (this.personas.length === 1) {
      if (!pAvatar) {
        return null;
      } else {
        return this.avatars.id(pAvatar).url;
      }
    }


    for (pi = 0; this.personas.length; pi++) {
      if (this.personas[pi].is_default === true) {
        pAvatar = this.personas[pi].avatar;
        break;
      }
    }

    if (!pAvatar) {
      return null;
    } else {
      return this.avatars.id(pAvatar).url;
    }
  }); // End persona.avatar virtual path


  // Schema plugins applied
  this.plugin(iWAExpUserDefPersPlugin, {
    methodName: 'getFavouriteUsersList',
    path: 'favourite_users',
    userModel: this.mongooseModelName,
    userFields: {
      _id: true,
      avatars: true,
      'personas.name': true,
      'personas.surname': true,
      'personas.avatar': true
    }
  });

};

User.prototype.__proto__ = iWazat.prototype;

User.prototype.objJsonTranformation = function (doc, ret /*,options*/) {

  if (!ret) {
    return;
  }

  delete ret.__v;
  // Delete local authentication data if it exists
  delete ret.local_auth;

  // Delete account_auth social_network_accounts object's attribute if it was not filtered
  if (ret.social_network_accounts) {
    ret.social_network_accounts.forEach(function (sa) {
       delete sa.account_auth;
      delete sa.account_profile;
    });
  }
};

/**
 * Return a new mongoose schema to attach to some fields of other schemas that crate documents
 * that need to reference to public persona of an user
 *
 * @returns {Object}
 */
User.prototype.publicPersonaRefSchema = function () {

  return new mongoose.Schema({
      user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
      }
    },
    {
      _id: false,
      id: false
    });
};

/**
 * Return a new mongoose schema to attach to some fields of other schemas that crate documents
 * that need to reference to a  user's persona.
 * The persona_id field should only be populated if the reference to the user to store is for a
 * non-default persona
 *
 * @returns {Object}
 */
User.prototype.userRefSchema = function () {

  return new mongoose.Schema({
      user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
      },
      persona_id: {
        type: mongoose.SchemaTypes.ObjectId
      }
    },
    {
      _id: false,
      id: false
    });
};

var user = (function () {
  var user = new User;
  user.User = User;

  //return Object.seal(user);
  return user;
}());

module.exports = exports = user;
