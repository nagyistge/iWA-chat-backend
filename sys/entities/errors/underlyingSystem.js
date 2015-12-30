
module.exports = exports;

var iWazat = require('./iWazat');

function UnderlyingSystem (msg, iWazatErrCode, rawObj) {
  this.type = 'underlying system: ';

  switch (iWazatErrCode) {
    case 530:
      this.type += 'UNDERTERMINED underlying system';
    case 531:
      this.type += 'User session';
    break;
    case 532:
      this.type += 'File system';
      break;
    case 533:
      this.type += 'External system';
      break;
    default:
      this.type += ' !!!! ALERT: the provided code is not in the range of this type of error: ' +
        'prvided code = ' + iWazatErrCode + ' - The code was replaced by 530';
      iWazatErrCode = 530;
  }

  iWazat.call(this,{
    message : msg,
    code : iWazatErrCode
  }, rawObj);
}

UnderlyingSystem.prototype.__proto__ = iWazat.prototype;


module.exports = UnderlyingSystem;