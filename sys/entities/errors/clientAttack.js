module.exports = exports;

var iWazat = require('./iWazat');

function ClientAttack(msg, iWazatErrCode, reqObj, details) {
  this.type = 'Client Attack';

  var dataObj = {
    message : msg,
    code : iWazatErrCode
  };

  if (details) {
    dataObj.details = details;
  }

  iWazat.call(this, dataObj, reqObj);
}

ClientAttack.prototype.__proto__ = iWazat.prototype;

module.exports = ClientAttack;