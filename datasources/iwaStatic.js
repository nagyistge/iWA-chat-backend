'use strcit';

module.exports = exports;


var languages;
var langs;

(function initialize() {

  var l;

  languages = {
    en: {
      abbreviation: 'en',
      name: 'English'
    },
    es: {
      abbreviation: 'es',
      name: 'Spainish'
    }
  };

  langs = {
    english: languages.en,
    spanish: languages.es
  };


  module.exports.languages = languages;
  Object.freeze(module.exports.languages);

  for (l in languages) {
    Object.freeze(languages[l]);
  }

  Object.freeze(langs);

  module.exports.getLangByAbbreviation = getLangByAbbreviation;
  module.exports.getLangByName = getLangByName;

}());


function getLangByAbbreviation(abbr) {
  return languages[abbr];
}

function getLangByName(name) {
  return langs[name.toLowerCase()];
}





