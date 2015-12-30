/** LinkedIn credentials data * */

// TODO provide security: not put in plain text, provide some human readable
// format
module.exports = {
  iWazat_brain : {
    development : {
      iWazat_app : {
        consumer_key : 'fhji4tpwtgpk',
        consumer_secret : '1gVv169msHepdCM4',
        access_token : '903759186-nZQGRzyMd0zSFApYW4iXNHYxarmYwUXhWVR8FS4J',
        access_token_secret : 'ea0541b0-8f00-456e-b71f-310df335588d',
        callback_url: 'http://localhost:8010/user/access/linkedin/callback'
      }
    },
	  pubdev : {
		  iWazat_app : {
			  consumer_key : '???',
			  consumer_secret : '???',
			  access_token : '???',
			  access_token_secret : '???',
			  callback_url: 'http://dev.iwaz.at:8020/user/access/linkedin/callback'
		  }
	  },
	  staging : {
      iWazat_app : {
        consumer_key : 'fhji4tpwtgpk',
        consumer_secret : '1gVv169msHepdCM4',
        access_token : '903759186-nZQGRzyMd0zSFApYW4iXNHYxarmYwUXhWVR8FS4J',
        access_token_secret : 'ea0541b0-8f00-456e-b71f-310df335588d',
        callback_url: 'http://staging.iwaz.at/user/access/linkedin/callback'
      }
    },
    beta : {
      iWazat_app : {
        consumer_key : 'fhji4tpwtgpk',
        consumer_secret : '1gVv169msHepdCM4',
        access_token : '903759186-nZQGRzyMd0zSFApYW4iXNHYxarmYwUXhWVR8FS4J',
        access_token_secret : 'ea0541b0-8f00-456e-b71f-310df335588d',
        callback_url: 'http://beta.iwaz.at/user/access/linkedin/callback'
      }
    }
  }
};
