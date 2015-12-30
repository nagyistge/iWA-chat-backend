var util = require('util');

var twit = require('twit');

/**
 * Accepted parameters:
 *
 * consumer_key
 * consumer_secret
 * access_token
 * access_token_secret
 * user_image_url: 'http://api.twitter.com/1/users/profile_image?screen_name={0}&size=normal'
 * attachment_image_size: 'thumb'
 * ignore_retweet: true
 * ignore_if_not_event: true
 * store_original_object: true
 * cache_global: false
 * default_event_id: 'unknown'
 * default_user: 'unknown'
 * verbose: false
 * filters: []
 * filtersToEvent: []
 * err: function (obj) ...
 * log: function (obj) ...
 * verboseLog: function (obj) ...
 * users: []
 * bulk_process: true
 * bulk_process_seconds: 10
 * bulk_process_cache: []
 * bulk_process_cache_id: -1
 * bulk_process_ran: new Date()
 * on_user: function (user_name, default_user, users, self) ...
 * pre_tweet: function (twt, self) ... ---> Called when tweet arrive and before converting the tweet to the common message's structure
 * post_tweet: function (twt, self) ... ---> Called when tweet arrive and post converting the tweet to the common message's structure
 * on_tweet: function (twt, self) ... ---> Callect after execute post_tweet
 *
 * remove_empty_fields: true (remove the empty fields of common message's structure if they are empty)
 *
 *
 * Common message's structure
 *  event_ids: [],
 *  created_at: Date
 *  text: String
 *  is_public: Boolean. In twitter it is always true
 *  keywords: TwitterServer.tweetToKeywords(tweet)
 *  source: {
 *    id: Stringigy version of original id of the messages, i.e. Tweet.id_str
 *    name: The name of the message's source, i.e. 'twitter'
 *    raw: The original object received from the source if the parameter store_original_object is set to true
 *   }
 *   from: {
 *    user_id: The value returned by the function defined by parameter on_user
 *    source_id: Strinigify version of the user's id from the source, i.e. tweet.user.id_str
 *    name: The user's name from the source, i.e. tweet.user.name
 *    screen_name: The user's nickname from the source, i.e. tweet.user.screen_name
 *    thumb: The user's avatar. It is computed by a function, i.e.  TwitterServer.getUserToThumbnail(o.user_image_url, tweet.user.screen_name)
 *   },
 *   to: Array of objects with the same attributes that "from" with the users where the message was targeted, i.e. In twitter replies and mentions
 *   urls: Array of object with this parameters:
 *   {
 *      url: The used url,
 *      expanded: The expanded url,
 *      display: How the url was displayed
 *    }
 *   medias: {
 *      type: The string that identify the type (In twitter, now, only report 'photo')
 *      used_url: The original url used when the message was written
 *      url: The url of the media,
 *      expanded: The expanded url of the media
 *      display: The text displayed to refer to the media content
 *    }
 *
 *  Public object's methods:
 *  # stop()
 *  # start()
 *  # restart()
 *  # getOptions()
 *  # setOptions(obj)
 *  # addFilter = function (filter)
 *  # deleteFilter = function (event_id)
 *  # getFilters = function ()
 *  # setFilters = function (tweetFilters)
 *  # addUser = function (user_id, twitter_display_name, twitter_id)
 *  # deleteUser = function (user_id)
 *  # getUsers = function ()
 *  # setUsers = function (users)
 *
 *  Filters:
 *  {
 *    event_id: String
 *    keywords:[]
 *    ignore: []
 *  }
 *
 *  ## keywords and ignore accept #: hashtag, @: mention, *: at the beginning and the end of the "word"
 *  ## Words can be sentences
 */

var settings = require('../../../settings');
var configLoader = require(settings.libsPath + '/iwazat/util/config');
var twitterCnf = require(settings.configsPath + '/twitter');


function TwitterServer(params) {

  if (!(this instanceof TwitterServer)) {
    new TwitterServer(params);
    return;
  }

  var twitterAppCnf = configLoader.getConfiguration(twitterCnf, 'twitter_Farmer');

  this.o = {
    consumer_key : twitterAppCnf.consumer_key,
    consumer_secret : twitterAppCnf.consumer_secret,
    access_token : twitterAppCnf.access_token,
    access_token_secret : twitterAppCnf.access_token_secret,
    user_image_url: 'http://api.twitter.com/1/users/profile_image?screen_name={0}&size=normal',
    attachment_image_size: 'thumb',
    ignore_retweet: true,
    ignore_if_not_event: true,
    store_original_object: true,
    remove_empty_fields: true,
    cache_global: false,
    default_event_id: 'unknown',
    default_user: 'unknown',
    verbose: false,
    filters: [],
    filtersToEvent: [],
    err: function (obj) {
      if (typeof (obj) == 'object') {
        console.error('Twitter Server Error - ');
        console.error(obj);
      } else {
        console.error('Twitter Server Error - ' + obj);
      }
    },
    log: function (obj) {
      if (typeof (obj) == 'object') {
        console.log('Twitter Server - ');
        console.log(obj);
      } else {
        console.log('Twitter Server - ' + obj);
      }
    },
    verboseLog: function (obj) {
      if (this.verbose) {
        this.log(obj);
      }
    },
    users: [],
    bulk_process: true,
    bulk_process_seconds: 10,
    bulk_process_cache: [],
    bulk_process_cache_id: -1,
    bulk_process_ran: new Date(),
    on_user: function (user_name, default_user, users, self) {
      var user_name = user_name.toLowerCase();
      for (var i = 0; i < users.length; i++) {
        if (users[i].twitter_display_name == user_name) {
          return users[i].user_id;
        }
      }
      return default_user;
    },
    pre_tweet: function (twt, self) {
      return twt;
    },
    post_tweet: function (twt, self) {
      return twt;
    },
    on_tweet: function (twt, self) {
      switch (typeof (twt)) {
        case 'undefined':
          break;
        case 'array':
          this.log(twt.length + ' bulk on_tweet handler');
          break;
        case 'object':
          if (twt == null) {
            return twt;
          }
          if (twt.length > 0) {
            this.log('bulk on_tweet handler ' + twt.length);
          } else {
            this.log('single on_tweet handler');
          }
          break;
        default:
          this.log('on_tweet handler failed - ' + typeof (twt));
      }

      if (this.verbose === true) {
        console.log(util.inspect(twt));
      }

      return twt;

    }
  };
  var options = TwitterServer.mergeTwitterOptions(params, this.o);
  this.o = options;
}
TwitterServer.prototype.stop = function () {
  if (typeof (this.stream) != 'undefined' && this.stream != null) {
    this.stream.stop();
    this.stream = null;
    if (this.o.bulk_process) {
      this.stopHandler();
    }
  }
};
TwitterServer.prototype.restart = function () {
  this.stop();
  this.start();
};
TwitterServer.prototype.start = function () {
  var options = this.o;
  if (TwitterServer.isEmpty(options.filters) || options.filters.length === 0) {
    options.err('No filter terms provided');
    return;
  }
  if (typeof (options.on_tweet) != 'function') {
    options.err('No on_tweet function passed');
    return;
  }
  if (options.bulk_process) {
    if (options.bulk_process_seconds < 1) {
      options.err('Bulk processing was turned on but an invalid processing time was given, server will now run per tweet');
      options.bulk_process = false;
    }
    if (options.bulk_process_seconds > 600) {
      options.err('Bulk processing time is long and could likely cause issues with memory and/or information could be lost');
    }
  }
  var cleanFilters = TwitterServer.cleanFilters(options.filters);
  var filter = TwitterServer.getFiltersAsArray(cleanFilters);
  this.o.filtersToEvent = TwitterServer.getFilters(cleanFilters);
  var filter_count = filter.length;
  if (filter_count === 0) {
    options.err('No filter terms to query by');
    return;
  } else if (filter.length > 400) {
    options.err('Twitter limits the number of tracked keywords to 400, we are currently monitoring ' +
      filter_count);
  } else if (filter_count > 350) {
    options.log('Warning Twitter limits the number of tracked keywords to 400, we are currently monitoring ' +
      filter_count);
  }
  if (TwitterServer.isEmpty(this.o.filtersToEvent)) {
    if (options.ignore_if_not_event) {
      options.err('Need filters has no value and will never return a tweet');
      return;
    } else {
      options.log('All tweets will be assigned to the default event');
    }
  }
  options.verboseLog('Starting');
  options.verboseLog('Filters: ' + filter.length);
  options.verboseLog('Options');
  options.verboseLog(this.o);
  this.stop();
  var T = this.getTwitter();
  var stream = T.stream('statuses/filter', {
    track: filter.join(',')
  });


  if (options.bulk_process) {
    stream.on('connect', (function (self) {
      return function () {
        self.startHandler();
      };
    })(this));
  }
  stream.on('tweet', (function (self) {
    return function (tweet) {
      if (self.o.ignore_retweet === true &&
        (tweet.retweeted === true || /^rt @[\w\d_]+/i.test(tweet.text) === true)) {
        self.o.verboseLog('Received retweet and ignored');
        return;
      }
      if (!self.o.bulk_process) {
        self.o.verboseLog('Received tweet and processing');
        self.o.on_tweet(self.processTweet(tweet, self.o.filtersToEvent));
        return;
      }
      if (typeof (self.o.bulk_process_cache) == 'undefined') {
        self.o.bulk_process_cache = [];
      }
      self.o.bulk_process_cache.push(tweet);
    };
  })(this));
  stream.on('end', function (response) {
    options.err('twitter ended');
  });
  stream.on('disconnect', function (response) {
    options.err('twitter disconnected. ' + util.inspect(response, {depth: null}));
  });
  stream.on('limit', function (response) {
    options.err('twitter limit reached');
  });
  stream.on('destroy', function (response) {
    options.err('twitter disconnected');
  });
  this.stream = stream;
};
TwitterServer.prototype.processTweets = function (tweets, filter) {
  filter = typeof (filter) == 'undefined' ? this.o.filtersToEvent : filter;
  var rtn = [];
  for (var i = 0; i < tweets.length; i++) {
    var tmp = this.processTweet(tweets[i], filter);
    if (tmp != null) {
      rtn.push(tmp);
    }
  }
  return rtn;
};
TwitterServer.prototype.processTweet = function (tweet, filter) {
  filter = typeof (filter) == 'undefined' ? this.o.filtersToEvent : filter;
  tweet = this.o.pre_tweet(tweet, this);
  if (TwitterServer.isEmpty(tweet)) {
    return null;
  }
  var twt = this.tweetToMessage(tweet, filter);
  if (this.o.ignore_if_not_event) {
    if (twt.event_ids.length == 0 && twt.event_ids[0] == this.o.default_event_id) {
      this.o.verboseLog('Tweet has no event associated to it\n' + twt.keywords.join(', ') + ' - ' +
        twt.text);
      return null;
    }
  }
  if (!TwitterServer.isEmpty(this.o.post_tweet)) {
    twt = this.o.post_tweet(twt, this);
    if (TwitterServer.isEmpty(twt)) {
      return null;
    }
  }
  return twt;
};
TwitterServer.prototype.tweetsFromFilter = function (filter, maxNumberOfResults) {
  maxNumberOfResults = (
    (typeof (maxNumberOfResults) == 'undefined' || maxNumberOfResults < 1) ? 100 :
      maxNumberOfResults);
  var cleanFilters = TwitterServer.cleanFilters([
    filter
  ]);
  filter = cleanFilters[0];
  filter.keywords = TwitterServer.cleanArray(cleanFilters[0].keywords);
  var filtersToEvent = TwitterServer.getFilters(cleanFilters);
  filter.ignore = TwitterServer.cleanArray(cleanFilters[0].ignore);
  this.o.verboseLog(filter.keywords);
  if (TwitterServer.isEmpty(filter.keywords)) {
    this.o.err('tweetsFromFilter must be sent keywords');
    return;
  }

  //TODO what is it? TypeScript is huge shit
  if (maxNumberOfResults > 1500) {
    this.o.err('tweetsFromFilter can return a maximum of 1500 tweets');
    maxNumberOfResults = 1500;
    return;
  }
  this.tweetsFromFilterProcess(filter, filtersToEvent, maxNumberOfResults, -1, []);
};
TwitterServer.prototype.getOptions = function () {
  return this.o;
};
TwitterServer.prototype.setOptions = function (options) {
  TwitterServer.mergeTwitterOptions(options, this.o);
};
TwitterServer.prototype.addFilter = function (filter) {
  this.o.filters.push(filter);
};
TwitterServer.prototype.deleteFilter = function (event_id) {
  var filters = this.o.filters;
  for (var i = 0; i < filters.length; i++) {
    if (filters[i].event_id == event_id) {
      //filters = //TwitterServer.arrayRemove(this.o.filters, i, i);
	    filters.splice(i, 1);
      break;
    }
  }

};
TwitterServer.prototype.getFilters = function () {
  return this.o.filters;
};
TwitterServer.prototype.setFilters = function (tweetFilters) {
  this.o.filters = tweetFilters;
};
TwitterServer.prototype.addUser = function (user_id, twitter_display_name, twitter_id) {
  this.deleteUser(user_id);
  this.o.users.push({
    user_id: user_id.toLowerCase(),
    twitter_display_name: twitter_display_name.toLowerCase(),
    twitter_id: twitter_id.toLowerCase()
  });
};
TwitterServer.prototype.deleteUser = function (user_id) {
  user_id = user_id.toLowerCase();
  var users = this.o.users;
  for (var i = users.length - 1; i >= 0; i--) {
    if (users[i].user_id == user_id) {
      //users = TwitterServer.arrayRemove(users, i, i);
	    user.splice(i, 1);
      break;
    }
  }
  //this.o.users = users;
};
TwitterServer.prototype.getUsers = function () {
  return this.o.users;
};
TwitterServer.prototype.setUsers = function (users) {
  this.o.users = users;
};
TwitterServer.prototype.getTwitter = function () {
  return new twit({
    consumer_key: this.o.consumer_key,
    consumer_secret: this.o.consumer_secret,
    access_token: this.o.access_token,
    access_token_secret: this.o.access_token_secret
  });
};
TwitterServer.prototype.startHandler = function () {
  if (this.o.bulk_process) {
    if (!TwitterServer.isEmpty(this.o.bulk_process_cache_id)) {
      clearTimeout(this.o.bulk_process_cache_id);
    }
    this.o.bulk_process_cache_id = setTimeout((function (self) {
      return function () {
        self.onTweetHandler();
      };
    })(this), (this.o.bulk_process_seconds * 1000));
  }
};
TwitterServer.prototype.stopHandler = function () {
  if (!TwitterServer.isEmpty(this.o.bulk_process_cache_id)) {
    clearTimeout(this.o.bulk_process_cache_id);
  }
};
TwitterServer.prototype.onTweetHandler = function () {
  var cache = this.o.bulk_process_cache;
  this.o.bulk_process_cache = [];
  if (typeof (cache) != 'undefined' && cache.length > 0) {
    this.o.verboseLog('Tweet Handler running, has ' + cache.length + ' tweets to process');
    this.o.on_tweet(this.processTweets(cache, null));
  } else {
    this.o.verboseLog('Tweet Handler running, has no tweets to process');
  }
  this.startHandler();
};
TwitterServer.prototype.tweetsFromFilterProcess =
  function (filter, filterToEvent, maxNumberOfResults, maxTwitterId, tweets) {
    var count = (
      maxNumberOfResults > 100 ? maxNumberOfResults - tweets.length : maxNumberOfResults);
    if (count > 100) {
      count = 100;
    }
    maxTwitterId =
      ((typeof (maxTwitterId) == 'undefined' || maxTwitterId < -1) ? -1 : maxTwitterId);
    var T = this.getTwitter();
    if (filter.keywords.length > 0) {
      T.get('search/tweets', {
        q: '"' + filter.keywords.join('" OR "') + '"',
        result_type: 'recent',
        count: count,
        max_id: maxTwitterId
      }, (function (self) {
        return function (err, reply) {
          for (var i = 0; i < reply.statuses.length; i++) {
            tweets.push(reply.statuses[i]);
          }
          if (tweets.length < count || tweets.length == 0 || tweets.length >= maxNumberOfResults) {
            self.o.on_tweet(self.processTweets(tweets, filterToEvent));
          } else {
            maxTwitterId = reply.statuses[0];
            self.tweetsFromFilterProcess(filter, filterToEvent, maxNumberOfResults, maxTwitterId,
              tweets);
          }
        };
      })(this));
    }
  };
TwitterServer.prototype.tweetToUsers = function (tweet) {
  var o = this.o;
  var rtn = [];
  var entities = tweet.entities;
  if (typeof (tweet.in_reply_to_screen_name) != 'undefined' &&
    tweet.in_reply_to_screen_name != null) {
    rtn.push({
      user_id: o.on_user(tweet.in_reply_to_screen_name, o.default_user, o.users),
      source_id: tweet.in_reply_to_user_id_str,
      name: tweet.in_reply_to_screen_name,
      screen_name: tweet.in_reply_to_screen_name,
      thumb: TwitterServer.getUserToThumbnail(o.user_image_url, tweet.in_reply_to_screen_name)
    });
  }
  if (!TwitterServer.isEmpty(entities.user_mentions)) {
    var user_mentions = entities.user_mentions;
    for (var i = 0; i < user_mentions.length; i++) {
      if (user_mentions[i].id_str != tweet.in_reply_to_user_id_str) {
        rtn.push({
          user_id: o.on_user(user_mentions[i].screen_name, o.default_user, o.users),
          source_id: user_mentions[i].id_str,
          name: user_mentions[i].name,
          screen_name: user_mentions[i].screen_name,
          thumb: TwitterServer.getUserToThumbnail(o.user_image_url, user_mentions[i].screen_name)
        });
      }
    }
  }
  return rtn;
};
TwitterServer.prototype.tweetsToMessages = function (tweets, customFilters) {
  customFilters = typeof (customFilters) == 'undefined' ? this.o.filtersToEvent : customFilters;
  var rtn = [];
  for (var i = 0; i < tweets.length; i++) {
    rtn.push(this.tweetToMessage(tweets[i], customFilters));
  }
  return rtn;
};
TwitterServer.prototype.tweetToMessage = function (tweet, customFilters) {
  customFilters = typeof (customFilters) == 'undefined' ? this.o.filtersToEvent : customFilters;
  var o = this.o;
  var twt = {
    event_ids: [],
    created_at: tweet.created_at,
    //text: tweet.text,
    is_public: true,
    keywords: TwitterServer.tweetToKeywords(tweet),
    source: {
      id: tweet.id_str,
      name: 'twitter'
      //raw: (o.store_original_object == true ? tweet : null)
    },
    from: {
      user_id: o.on_user(tweet.user.screen_name, o.default_user, o.users),
      source_id: tweet.user.id_str,
      name: tweet.user.name,
      screen_name: tweet.user.screen_name,
      thumb: TwitterServer.getUserToThumbnail(o.user_image_url, tweet.user.screen_name)
    },
    to: this.tweetToUsers(tweet),
    urls: TwitterServer.tweetToUrls(tweet.entities.urls),
    medias: TwitterServer.tweetToMedias(tweet.entities.media, this.o.attachment_image_size)
  };

  if (o.store_original_object === true) {
    twt.source.raw = tweet;
  }


  if (o.remove_empty_fields === true) {


    if (twt.to.length === 0) {
      delete twt.to;
    }

    if (twt.urls.length === 0) {
      delete twt.urls;
    }

    if (twt.medias.length === 0) {
      delete twt.medias;
    }

    if (twt.keywords.length === 0) {
      delete twt.keywords;
    }


    if (tweet.text.trim().length > 0) {
      twt.text = tweet.text;

      if (twt.keywords) {
        twt.event_ids = TwitterServer.textToEvent(twt.text + ' ' + '@' + tweet.user.screen_name +
          ' ' + twt.keywords.join(' '), o.default_event_id, customFilters);
      } else {
        twt.event_ids = TwitterServer.textToEvent(twt.text + ' ' + '@' + tweet.user.screen_name,
          o.default_event_id, customFilters);
      }
    } else {
      if (twt.keywords) {
        twt.event_ids = TwitterServer.textToEvent(+'@' + tweet.user.screen_name + ' ' +
          twt.keywords.join(' '), o.default_event_id, customFilters);
      } else {
        twt.event_ids = TwitterServer.textToEvent(+'@' + tweet.user.screen_name + ' ',
          o.default_event_id, customFilters);
      }
    }

  } else {
    twt.text = tweet.text;
    twt.event_ids = TwitterServer.textToEvent(twt.text + ' ' + '@' + tweet.user.screen_name +
      ' ' + twt.keywords.join(' '), o.default_event_id, customFilters);
  }


  return twt;
};
TwitterServer.tweetToKeywords = function tweetToKeywords(tweet) {
  var rtn = [];

  //rtn.push('@' + tweet.user.screen_name);

  if (typeof (tweet.in_reply_to_screen_name) != 'undefined' &&
    tweet.in_reply_to_screen_name != null) {
    rtn.push('@' + tweet.in_reply_to_screen_name);
  }
  if (!TwitterServer.isEmpty(tweet.entities.hashtags)) {
    var hashtags = tweet.entities.hashtags;
    for (var i = 0; i < hashtags.length; i++) {
      rtn.push('#' + hashtags[i].text);
    }
  }
  if (!TwitterServer.isEmpty(tweet.entities.user_mentions)) {
    var user_mentions = tweet.entities.user_mentions;
    for (var i = 0; i < user_mentions.length; i++) {
      if (user_mentions[i].id_str != tweet.in_reply_to_user_id_str) {
        rtn.push('@' + user_mentions[i].screen_name);
      }
    }
  }
  return rtn;
};
TwitterServer.tweetToUrls = function tweetToUrls(urls) {
  var urlsArray = [];
  if (!TwitterServer.isEmpty(urls)) {
    for (var i = 0; i < urls.length; i++) {
      urlsArray.push({
        url: urls[i].url,
        expanded: urls[i].expanded_url,
        display: urls[i].display_url
      });
    }
  }

  return urlsArray;
};
TwitterServer.tweetToMedias = function tweetToMedias(medias, attachment_image_size) {

  var mediasArray = [];

  if (!TwitterServer.isEmpty(medias)) {

    for (var i = 0; i < medias.length; i++) {
      mediasArray.push({
        type: medias[i].type,
        used_url: medias[i].url,
        url: medias[i].media_url,
        expanded: medias[i].expanded_url,
        display: medias[i].display_url
      });
    }
  }
  return mediasArray;
};
TwitterServer.textToEvent = function textToEvent(text, defaultEventId, tweetFilters) {
  var rtn = [];
  if (!TwitterServer.isEmpty(tweetFilters)) {
    for (var i = 0; i < tweetFilters.length; i++) {
      if (text.search(tweetFilters[i].keywords_regexp) > -1) {
        if (tweetFilters[i].ignore_regexp === null ||
          (text.search(tweetFilters[i].ignore_regexp) === -1)) {
          rtn.push(tweetFilters[i].event_id);
        }
      }
    }
  }
  if (rtn.length == 0) {
    rtn.push(defaultEventId);
  }
  return rtn;
};
TwitterServer.mergeTwitterOptions = function mergeTwitterOptions(params, default_options) {
  if (typeof (params) == 'undefined' || params == null) {
    return default_options;
  }
  return {
    consumer_key: (!TwitterServer.isEmpty(params.consumer_key) ? params.consumer_key :
      default_options.consumer_key),
    consumer_secret: (!TwitterServer.isEmpty(params.consumer_secret) ? params.consumer_secret :
      default_options.consumer_secret),
    access_token: (!TwitterServer.isEmpty(params.access_token) ? params.access_token :
      default_options.access_token),
    access_token_secret: (
      !TwitterServer.isEmpty(params.access_token_secret) ? params.access_token_secret :
        default_options.access_token_secret),
    user_image_url: (!TwitterServer.isEmpty(params.user_image_url) ? params.user_image_url :
      default_options.user_image_url),
    ignore_retweet: (!TwitterServer.isEmpty(params.ignore_retweet) ? params.ignore_retweet :
      default_options.ignore_retweet),
    filters: (!TwitterServer.isEmpty(params.filters) ? params.filters : default_options.filters),
    on_tweet: (
      !TwitterServer.isEmpty(params.on_tweet) ? params.on_tweet : default_options.on_tweet),
    err: (!TwitterServer.isEmpty(params.err) ? params.err : default_options.err),
    log: (!TwitterServer.isEmpty(params.log) ? params.log : default_options.log),
    verbose: (!TwitterServer.isEmpty(params.verbose) ? params.verbose : default_options.verbose),
    ignore_if_not_event: (
      !TwitterServer.isEmpty(params.ignore_if_not_event) ? params.ignore_if_not_event :
        default_options.ignore_if_not_event),
    default_event_id: (!TwitterServer.isEmpty(params.default_event_id) ? params.default_event_id :
      default_options.default_event_id),
    default_user: (!TwitterServer.isEmpty(params.default_event_id) ? params.default_event_id :
      default_options.default_event_id),
    attachment_image_size: (!TwitterServer.isEmpty(params.default_user) ? params.default_user :
      default_options.default_user),
    bulk_process: (!TwitterServer.isEmpty(params.bulk_process) ? params.bulk_process :
      default_options.bulk_process),
    bulk_process_seconds: (
      !TwitterServer.isEmpty(params.bulk_process_seconds) ? params.bulk_process_seconds :
        default_options.bulk_process_seconds),
    bulk_process_cache: (
      !TwitterServer.isEmpty(params.bulk_process_cache) ? params.bulk_process_cache :
        default_options.bulk_process_cache),
    bulk_process_cache_id: (
      !TwitterServer.isEmpty(params.bulk_process_cache_id) ? params.bulk_process_cache_id :
        default_options.bulk_process_cache_id),
    bulk_process_ran: (!TwitterServer.isEmpty(params.bulk_process_ran) ? params.bulk_process_ran :
      default_options.bulk_process_ran),
    verboseLog: (
      !TwitterServer.isEmpty(params.verboseLog) ? params.verboseLog : default_options.verboseLog),
    on_user: (!TwitterServer.isEmpty(params.on_user) ? params.on_user : default_options.on_user),
    users: (!TwitterServer.isEmpty(params.users) ? params.users : default_options.users),
    store_original_object: (
      !TwitterServer.isEmpty(params.store_original_object) ? params.store_original_object :
        default_options.store_original_object),
    remove_empty_fields: (
      !TwitterServer.isEmpty(params.remove_empty_fields) ? params.remove_empty_fields :
        default_options.remove_empty_fields),
    pre_tweet: (
      !TwitterServer.isEmpty(params.pre_tweet) ? params.pre_tweet : default_options.pre_tweet),
    post_tweet: (
      !TwitterServer.isEmpty(params.post_tweet) ? params.post_tweet : default_options.post_tweet),
    filtersToEvent: (!TwitterServer.isEmpty(params.filtersToEvent) ? params.filtersToEvent :
      default_options.filtersToEvent),
    cache_global: (!TwitterServer.isEmpty(params.cache_global) ? params.cache_global :
      default_options.cache_global)
  };
};
TwitterServer.isEmpty = function isEmpty(obj) {
  if (typeof obj == 'undefined' || obj === null || obj === '') {
    return true;
  }
  if (Array.isArray(obj)) {
    return (obj.length === 0);
  }
  if (typeof obj == 'number') {
    return isNaN(obj);
  }
  if (obj instanceof Date) {
    return isNaN(Number(obj));
  }
  return false;
};
TwitterServer.getUserToThumbnail = function getUserToThumbnail(image_url, screen_name) {
  return image_url.replace('{0}', screen_name);
};
TwitterServer.getFiltersAsArray = function getFiltersAsArray(filters) {
  var rtn = [], tmpFilter = [];
  for (var i = 0; i < filters.length; i++) {
    tmpFilter = tmpFilter.concat(filters[i].keywords);
  }
  tmpFilter = tmpFilter.sort();
  var lastFilter = '';
  for (var i = 0; i < tmpFilter.length; i++) {
    if (!TwitterServer.isEmpty(tmpFilter[i]) && tmpFilter[i] != lastFilter) {
      lastFilter = tmpFilter[i];
      rtn.push(lastFilter);
    }
  }
  return rtn;
};
TwitterServer.getFilters = function getFilters(filters) {
  var rtn = [];
  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    rtn.push({
      event_id: filter.event_id,
      keywords_regexp: TwitterServer.arrayToRegExp(filter.keywords),
      ignore_regexp: TwitterServer.arrayToRegExp(filter.ignore)
    });
  }
  return rtn;
};
TwitterServer.arrayToRegExp = function arrayToRegExp(arr) {
  if (TwitterServer.isEmpty(arr)) {
    return null;
  }
  var rtn = [];
  for (var i = 0; i < arr.length; i++) {
    rtn.push(TwitterServer.regExpText(arr[i]));
  }


  console.log('arrayToRegExp - ' + arr.join(',') + ' - (' + rtn.join('|') + ')');
  return new RegExp('(' + rtn.join('|') + ')', 'i');
};
TwitterServer.regExpText = function regExpText(str) {
  if (TwitterServer.isEmpty(str)) {
    return '';
  }
  switch (str.substring(0, 1)) {
    case '@':
      return '@\\b' + TwitterServer.regExpEscape(str.slice(1)) + '\\b';
      break;
    case '#':
      return '#\\b' + TwitterServer.regExpEscape(str.slice(1)) + '\\b';
      break;
    default:
      return ('\\b' + TwitterServer.regExpEscape(str) + '\\b').replace(/\\b\\\*/,
        '').replace(/\\\*\\b/, '');
      break;
  }
};
TwitterServer.regExpEscape = function regExpEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
};
TwitterServer.cleanArray = function cleanArray(arr) {
  if (typeof (arr) == 'undefined' || arr.length === 0) {
    return [];
  }
  for (var j = 0; j < arr.length; j++) {
    arr[j] = TwitterServer.cleanTweetFilter(arr[j]);
  }
  return arr.filter(function (e) {
    return (typeof (e) != 'undefined' && e.length > 0);
  });
};
TwitterServer.cleanFilters = function cleanFilters(filters) {
  for (var i = 0; i < filters.length; i++) {
    filters[i].keywords = TwitterServer.cleanArray(filters[i].keywords);
    filters[i].ignore = TwitterServer.cleanArray(filters[i].ignore);
  }
  return filters;
};
//TwitterServer.arrayRemove = function arrayRemove(arr, from, to) {
//  var rest = arr.slice((to || from) + 1 || this.length);
//
//  this.length = from < 0 ? this.length + from : from;
//  return this.push.apply(this, rest);
//};

TwitterServer.cleanTweetFilter = function cleanTweetFilter(tweetFilter) {
  if (typeof (tweetFilter) == 'undefined') {
    return '';
  }
  if (tweetFilter.length > 0) {
    return tweetFilter.replace(/^\s*/, '').replace(/\s*$/, '');
  }
  return '';
};


//exports.CreateTwitterServer = TwitterServer;
module.exports = TwitterServer;
