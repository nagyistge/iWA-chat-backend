/**
 * iWazat Keyword model
 *
 *
 */
module.exports = exports;

/**
 * Dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var iWazat = require('./abstract/iWazat');


/**
 * iWazat Keyword model schema constructor.
 * The exports of the this module is an sealed instance of this class
 *
 * @constructor
 * @param {object} [schemaOptions] The options to pass to Mongoose Schema constructor
 *            (optional because for inheritance purposes maybe is required to change them: default
 *            is embedded into this constructor)
 * @api public
 */
function Keyword(schemaOptions) {

  if (!this.schemaDefinition) {
    this.schemaDefinition = {};
  }

  this.schemaDefinition.words_en =
    [
      {
        word: {
          type: String,
          required: true,
          lowercase: true
        },
        popularity: {
          type: Number,
          required: true,
          min: 0, // 0 means that the word was added from user that afterwards he replaced it
          // from another word of the same keyword or imported from database
          'default': 0
        }
      }
    ];

//  this.schemaDefinition.words_es =
//    [
//      {
//        word: {
//          type: String,
//          required: true,
//          lowercase: true
//        },
//        popularity: {
//          type: Number,
//          required: true,
//          min: 0, // 0 means that the word was added from user that afterwards he replaced it
//          // from another word of the same keyword or imported from database
//          'default': 0
//        }
//      }
//    ];

  this.schemaDefinition.revised = {
    type: Boolean,
    required: true,
    'default': false
  };

  if (!schemaOptions) {
    schemaOptions = {
      collection: 'keywords'
    };
  } else {
    if (!schemaOptions.collection) {
      schemaOptions.collection = 'keywords';
    }
  }

  // Call parent constructor
  iWazat.call(this, schemaOptions);

  Object.defineProperty(this, 'mongooseModelName', {
    get: function () {
      return 'Keyword';
    }
  });


  /** Model methods **/

  this.static('refer', function (word, lang, callback) {

    var self = this;
    var query = this.findOne();
    var wlang;

    if (lang instanceof Function) {
      callback = lang;
      lang = 'en';
      wlang = 'words_en';

    } else {
      wlang = 'words_' + lang;
    }

    query.select(wlang + '.word -' + wlang + '.popularity');
    query.where(wlang + '.word').equals(word);

    query.exec(function (err, keyword) {

      if (err) {
        callback(err, null);
        return;
      }

      if (!keyword) {
        var KeyObj = {};
        keyObj[wlang] = [
          {
            word: word
          }
        ];

        self.create(keyOjb, function (err, keyword) {
          if (err) {
            callback(err, keyword);
            return;
          }

          callback(null, {
            keyword_id: keyword._id,
            word_id: keyword[wlang][0]._id,
            word: word
          });
        }); // End create new one

      } else {
        callback(null, {
          _id: keyword._id,
          word_id: keyword[wlang][0]._id,
          word: word
        })
      }
    }); // End search
  }); // End static method

  // Model methods
  /**
   * Execute the next aggregation operations:
   * db.keywords.aggregate(
   *  { $match: {
   *    "words_en.word": /^firstLetters/i
   *  }},
   *  { $limit: limit },
   *  {$unwind: "$words_lang"},
   *  { $project : {
        _id: 0,
        keyword_id: "$_id",
        word_id: "$words_en._id",
        word: "$words_en.word"
   *  }}
   * );
   *
   * @param {String} firstLetters
   * @param {String} [lang]
   * @param {Number} [limit]
   * @param {Function} callback
   *
   */
  this.static('match', function (firstLetters, lang, limit, callback) {

    var aggQuery;
    var aggOp;
    var wlang;

    if (lang instanceof Function) {
      callback = lang;
      lang = 'en';
      wlang = 'words_en.word';
    } else {

      if ('number' === typeof lang) {
        limit = lang;
        lang = 'en';
        wlang = 'words_en.word';
      } else {
        wlang = 'words_' + lang + '.word';

        if (limit instanceof Function) {
          callback = limit;
          limit = undefined;
        }
      }
    }

    // Filter keywords to retrieve
    aggOp = {
      $match: {}
    };
    aggOp.$match[wlang] = new RegExp('^' + firstLetters, 'i');
    aggQuery = [aggOp];

    // Limit Keywords to retrieve
    if (limit) {
      aggQuery.push({$limit: limit});
    }

    // Unwind keywords list
    aggQuery.push({
      $unwind: '$' + 'words_' + lang
    });

    // Project unwound matched keywords
    aggQuery.push({
      $project: {
        _id: 0,
        keyword_id: '$_id',
        word_id: '$words_' + lang + '._id',
        word: '$' + wlang
      }
    });

    this.aggregate(aggQuery, callback);
  }); // End static method


  /**
   * The method get the reference word/s.
   * If the word/s don't exist then the method creates a new one and returns the reference of
   * it/them
   *
   * @param {String | Array} wordOrList word or list of words
   * @param {String} lang Language abbreviation of the word/s
   * @return Referenced word object or array of them according if a word or a list of words was
   *    provided
   *
   *    A referenced word object has the next attributes:
   *    {
   *      keyword_id: Keyword id
   *      word_id: Word id bound to the keyword
   *      word: The word (String)
   *    }
   */
  this.static('getKeywords', function (wordOrList, lang, callback) {

    var self = this;
    var wlang;
    var query;
    var criteria;
    var reqFields;
    var newWords;
    var lowerCaseWordList;

    if (lang instanceof Function) {
      callback = lang;
      lang = 'en';
      wlang = 'words_en.word';

    } else {
      wlang = 'words_' + lang + '.word';
    }


    // Words list
    if (Array.isArray(wordOrList)) { // A list of words has been requested
      newWords = {};
      lowerCaseWordList = [];

      wordOrList.forEach(function (word) {
        word = word.toLowerCase();
        lowerCaseWordList.push(word);
        newWords[word] = true;
      });

      // Filter keywords to retrieve
      aggOp = {
        $match: {}
      };
      aggOp.$match[wlang] = {$in: lowerCaseWordList};
      aggQuery = [aggOp];

      // Unwind keywords list
      aggQuery.push({
        $unwind: '$' + 'words_' + lang
      });

      // Project unwound matched keywords
      aggQuery.push({
        $project: {
          _id: 0,
          keyword_id: '$_id',
          word_id: '$words_' + lang + '._id',
          word: '$' + wlang
        }
      });

      this.aggregate(aggQuery, function (err, keywords) {
        if (err) {
          callback(err, null);
          return;
        }


        if (keywords) {
          keywords.forEach(function (kWord) {
            delete newWords[kWord.word];
          });
        } else {
          keywords = [];
        }

        newWords = Object.keys(newWords);

        if (newWords.length === 0) {
          callback(null, keywords);
          return;
        }

        var newKeywords = [];
        var newKeyword;
        wlang = 'words_' + lang;

        newWords.forEach(function (word) {
          newKeyword = {};
          newKeyword[wlang] = [
            {
              word: word
            }
          ];

          newKeywords.push(newKeyword);
        });

        self.create(newKeywords, function (err) {

          if (err) {
            callback(err, null);
            return;
          }

          // Return the array
          for (var nki = 1; nki < arguments.length; nki++) {
            keywords.push({
              keyword_id: arguments[nki]._id,
              word_id: arguments[nki][wlang][0]._id,
              word: arguments[nki][wlang][0].word
            });
          }

          callback(null, keywords);
        });
      });

    } else { // Only one word has been requested
      wordOrList = wordOrList.toLowerCase();
      criteria = {};
      criteria[wlang] = wordOrList;

      query = this.findOne(criteria);

      reqFields = {};
      reqFields['words_' + lang + '.popularity'] = 0;
      reqFields['words_' + lang] = {
        $elemMatch: {
          word: wordOrList
        }
      };

      query.select(reqFields);
      query.exec(function (err, keyword) {

        if (err) {
          callback(err, null);
          return;
        }

        wlang = 'words_' + lang;

        if (keyword) {
          callback(null, {
            keyword_id: keyword._id,
            word_id: keyword[wlang][0]._id,
            word: wordOrList
          });

          return;
        }

        var newKeyword = {};
        newKeyword[wlang] = [
          {
            word: wordOrList
          }
        ];

        self.create(newKeyword, function (err, keyword) {
          if (err) {
            callback(err, null);
            return;
          }

          if (keyword) {
            callback(null, {
              keyword_id: keyword._id,
              word_id: keyword[wlang][0]._id,
              word: wordOrList
            });
          } else {
            // Why has it happened?
            callback(null, keyword);
          }
        }); // End create new keyword
      });// End search
    } // End requesting one word
  }); // End static method


  /**
   * Count the number of keywords that match the keywords references.
   * It is a handy method to check that the keywords reference received from untrusted source (for
   * example from frontend app) exist in the database, just comparing the number returned from this
   * method and the number of provided keywords' references
   *
   * @param {Object | Array(Object)} keywordRefs is a keyword's reference object or an array of those
   *    objects. Keyword reference object must the next attributes:
   *    {
   *      keyword_id: Keyword id
   *      word_id: Word id bound to the keyword
   *      [lang]: The language of the word is (abbreviated)
   *    }
   * @param {String} [defLang] Default language's abbreviation to use with keywords that don't
   *      specify its language
   */
  this.static('countFromKeywordsRefs', function (keywordRefs, defLang, callback) {

    var self = this;
    var conditionsList;
    var conditions;
    var langsList;
    var langs;
    var lPath;
    var lang;
    var totalCallbacksCalls;
    var totalKeywords;
    var listIdx;
    var keywordWordAssocs = {};
    var it;


    function keywordsRefsArrayCb(err, numKeywords) {
      // An error happened in other callback call executed before this
      if (totalCallbacksCalls < 0) {
        return;
      }

      if (err) {
        callback(err, null);
        totalCallbacksCalls = -1;
      } else {
        totalCallbacksCalls--;
        totalKeywords += numKeywords;

        if (totalCallbacksCalls === 0) {
          callback(null, totalKeywords);
        }
      }
    }

    if (defLang instanceof Function) {
      callback = defLang;
      defLang = false;
    }

    if (Array.isArray(keywordRefs)) {
      conditionsList = [
        {
          _id: {
            $in: []
          }
        }
      ];

      langsList = [
        {}
      ];


      for (it = 0; it < keywordRefs.length; it++) {
        listIdx = keywordWordAssocs[keywordRefs[it].keyword_id];

        // If the keyword has been added before then we have the next index of the conditionsList
        if (listIdx === undefined) {
          keywordWordAssocs[keywordRefs[it].keyword_id] = 1;
          listIdx = 0;
        } else {
          keywordWordAssocs[keywordRefs[it].keyword_id] = listIdx + 1;

          if (conditionsList.length === listIdx) {
            conditionsList[listIdx] = {
              _id: {
                $in: []
              }
            };
            langsList[listIdx] = {};
          }
        }

        conditions = conditionsList[listIdx];
        conditions._id.$in.push(keywordRefs[it].keyword_id);

        if (keywordRefs[it].lang) {
          lPath = 'words_' + keywordRefs[it].lang + '._id';
        } else {
          if (!defLang) {
            callback(new Error('One keyword doesn\'t specify its language and the default ' +
              'language hasn\'t been specified. Keyword_id: ' + keywordRefs[it].keyword_id +
              ', word_id: ' + keywordRefs[it].word_id));
            return;
          }

          lPath = 'words_' + defLang + '._id';
        }

        langs = langsList[listIdx];

        if (!langs[lPath]) {
          langs[lPath] = {
            $in: [keywordRefs[it].word_id]
          }
        } else {
          langs[lPath].$in.push(keywordRefs[it].word_id);
        }
      }

      // Compute the conditions for each count query
      langsList.forEach(function (langs, idx) {
        conditions = conditionsList[idx];

        if (langs.length > 1) {
          conditions.$or = [];

          for (lang in langs) {
            conditions.$or.push(lang);
          }
        } else {
          lPath = Object.keys(langs)[0];
          conditions[lPath] = langs[lPath];
        }
      });

      totalCallbacksCalls = conditionsList.length;
      totalKeywords = 0;

      conditionsList.forEach(function (conditions) {
        self.count(conditions, keywordsRefsArrayCb);
      });

    } else {
      conditions = {
        _id: keywordRefs.keyword_id
      };

      conditions['words_' + keywordRefs.lang + '._id'] = keywordRefs.word_id;
      this.count(conditions, callback);
    }
  });
};

Keyword.prototype.__proto__ = iWazat.prototype;

/**
 * Return a new mongoose schema to attach to some fields of other schemas that crate documents
 * that need to reference to a keyword
 *
 * @returns {Object}
 */
Keyword.prototype.referenceSchema = function () {

  return new mongoose.Schema({
      _id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: this.mongooseModelName
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
    },
    {
      _id: false,
      id: true
    });
};

/**
 * The method take a list of keywords' references and return the same list but unifying the
 * the words under an array attached to one object that reference to their keyword by id.
 *
 * @param {Array} keywordRef Array of objects
 *  {
 *      keyword_id: Keyword id
 *      word_id: Word id bound to the keyword
 *      [lang]: The language of the word is (abbreviated)
 *    }
 * @param {String} [defLang] Default language's abbreviation to use with keywords that don't
 *      specify its language
 * @return {Array} Collection of keywords and their words. Each object has the next attributes:
 *    {
 *      _id: The keyword id,
  *     used_words: [
  *       {
  *         _id: The word id,
  *         lang: The language abbreviation of the word
  *       }
  *     ]
  *    }
 */
Keyword.prototype.unifyWords = function (keywordRef, defLang) {

  var keywordSet = {}; // Hold the index where the keyword is in the collection
  var keywordCol = [];
  var idx;

  keywordRef.forEach(function(kWord) {
    idx = keywordSet[kWord.keyword_id];

    if (idx !== undefined) {
      keywordCol[idx].used_words.push({
        _id: kWord.word_id,
        lang: (kWord.lang !== undefined) ? kWord.lang : defLang
      });
    } else {
      keywordSet[kWord.keyword_id] = keywordCol.length;
      keywordCol.push({
        _id: kWord.keyword_id,
        used_words: [
          {
            _id: kWord.word_id,
            lang: (kWord.lang !== undefined) ? kWord.lang : defLang
          }
        ]
      });
    }
  });

  return keywordCol;
};

var keyword = (function () {
  var keyword = new Keyword;
  keyword.Keyword = Keyword;

  return keyword;
}());


module.exports = exports = keyword; 