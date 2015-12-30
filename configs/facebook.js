/** Facebook credentials data * */

// TODO provide security: not put in plain text, provide some human readable
// format
module.exports = {
  iWazat_brain : {
    development : {
      iWazat_app : {
        client_id : '308440399268093',
        client_secret : 'dd6fc276ebe9d5b8c2971d57e6a3c00c',
        callback_url: 'http://localhost:8010/user/access/facebook/callback'
      }
    },
	  pubdev : {
		  iWazat_app : {
			  client_id : '???',
			  client_secret : '???',
			  callback_url: 'http://dev.iwaz.at:8020/user/access/facebook/callback'
		  }
	  },
    staging : {
      iWazat_app : {
        client_id : '210973399039452',
        client_secret : 'f75866f3249db4d4b34497468366efa7',
        callback_url: 'http://staging.iwaz.at/user/access/facebook/callback'
      }
    },
    beta : {
      iWazat_app : {
        client_id : '458138790941408',
        client_secret : 'bfe72562eb56e7603c60815aeec5f013',
        callback_url: 'http://beta.iwaz.at/user/access/facebook/callback'
      }
    }
  }
};
