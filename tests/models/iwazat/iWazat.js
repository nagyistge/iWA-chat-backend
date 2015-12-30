'use strict';

var settings = require('../../../settings.js');
settings.logger = console;


var should = require('should');
var iWazatSchema = require(settings.modelsPath + '/iwazat/abstract/iWazat');
var userSchema = require(settings.modelsPath + '/iwazat/user');
var createUserFromSNWK = require(settings.modelsPath + '/iwazat/helpers/createUserFromSNWK');

describe('models/iwazat', function () {

  describe('createUserFromSNWK helper function', function () {

//    describe('createUserFromSNWK user from Facebook accounts', function () {
//
//      it('Valid Facebook profile',
//        function () {
//
//          var fbProfile = {
//            "updated_time": "2013-06-12T15:46:20+0000",
//            "verified": true,
//            "locale": "en_GB",
//            "timezone": 1,
//            "website": "www.jewpro.co.uk\nwww.jewpro.net\nwww.jewpro.co.il\nwww.jewpro.org",
//            "email": "spencer_shaw@yahoo.co.uk",
//            "gender": "male",
//            "quotes": "\"one act of kindness (chessed) is equivalent do perfroming all 613 mitzvot\"\n\"How can we expect our enemies to love us when we dont love each other. If we love each other and do acts of kindness and love to each other then maybe, just maybe our enemiies will like us too?\"\n\"KNOW THAT YOU DONT KNOW\" - BAAL SHEM TOV\n\"THINK GOOD AND IT WILL BE GOOD\" - The Lubavitcher Rebbe\n\"I AM NOT MY EMOTIONS...I AM NOT MY THOUGHTS\" - Dr Eddy Levin\n\"The world isnt doing so badly otherwise it would have been destroyed\" -  Reb Moishe \nCarlebach \"the world it so holy, the people are so beautiful and one day, we might all just know this\"\nRebmoishe: \"look at all the possibilities in the world, not what you should do\"\nRebmoishe: \"learn to shine your own light, not someone elses. If anyone tells you what you should be doing, walk away. You need to shine your light not theirs othewise hashem would have made you them\"\n",
//            "bio": "The one thing that I want to learn is the only thing that cannot be taught - WISDOM\nTrying to be in the now and without expectation just for this moment.\nThe only thing stopping me is FEAR and PLANNING.",
//            "location": {
//            "name": "London, United Kingdom",
//              "id": "106078429431815"
//          },
//            "hometown": {
//            "name": "London, United Kingdom",
//              "id": "106078429431815"
//          },
//            "birthday": "05/22/1979",
//            "username": "spencerjshaw",
//            "link": "http://www.facebook.com/spencerjshaw",
//            "last_name": "Shaw",
//            "first_name": "Spencer",
//            "name": "Spencer Shaw",
//            "id": "502159777"
//          };
//
//
//          createUserFromSNWK('initial', 'facebook', fbProfile,
//            function (err, user) {
//
//              should.not.exist(err);
//
//          });
//
//        });
//
//    });

    describe('createUserFromSNWK user from Facebook accounts', function () {

      it('Valid Facebook profile',
        function () {

          var fbProfile = {
            "updated_time": "2013-06-12T15:46:20+0000",
            "verified": true,
            "locale": "en_GB",
            "timezone": 1,
            "website": "www.jewpro.co.uk\nwww.jewpro.net\nwww.jewpro.co.il\nwww.jewpro.org",
            "email": "spencer_shaw@yahoo.co.uk",
            "gender": "male",
            "quotes": "\"one act of kindness (chessed) is equivalent do perfroming all 613 mitzvot\"\n\"How can we expect our enemies to love us when we dont love each other. If we love each other and do acts of kindness and love to each other then maybe, just maybe our enemiies will like us too?\"\n\"KNOW THAT YOU DONT KNOW\" - BAAL SHEM TOV\n\"THINK GOOD AND IT WILL BE GOOD\" - The Lubavitcher Rebbe\n\"I AM NOT MY EMOTIONS...I AM NOT MY THOUGHTS\" - Dr Eddy Levin\n\"The world isnt doing so badly otherwise it would have been destroyed\" -  Reb Moishe \nCarlebach \"the world it so holy, the people are so beautiful and one day, we might all just know this\"\nRebmoishe: \"look at all the possibilities in the world, not what you should do\"\nRebmoishe: \"learn to shine your own light, not someone elses. If anyone tells you what you should be doing, walk away. You need to shine your light not theirs othewise hashem would have made you them\"\n",
            "bio": "The one thing that I want to learn is the only thing that cannot be taught - WISDOM\nTrying to be in the now and without expectation just for this moment.\nThe only thing stopping me is FEAR and PLANNING.",
            "location": {
            "name": "London, United Kingdom",
              "id": "106078429431815"
          },
            "hometown": {
            "name": "London, United Kingdom",
              "id": "106078429431815"
          },
            "birthday": "05/22/1979",
            "username": "spencerjshaw",
            "link": "http://www.facebook.com/spencerjshaw",
            "last_name": "Shaw",
            "first_name": "Spencer",
            "name": "Spencer Shaw",
            "id": "502159777"
          };


          createUserFromSNWK('initial', 'facebook', fbProfile,
            function (err, user) {

              should.not.exist(err);

          });

        });
    });
  });
});
