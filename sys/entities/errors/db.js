
module.exports = exports;

var iWazat = require('./iWazat');

function Db (msg, iWazatErrCode, dbRawObj) {
  this.type = 'database';
   
  iWazat.call(this,{
    message : msg,
    code : iWazatErrCode
  }, dbRawObj);
}

Db.prototype.__proto__ = iWazat.prototype;


module.exports = Db;