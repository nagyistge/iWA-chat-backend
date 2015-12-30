/** Google credentials data * */
// TODO provide security: not put in plain text, provide some human readable

//apikey : 'AIzaSyDNGCBlCY6LjoNJT8SehuG3ivBwcrTmzCI',

module.exports = {
  iWazat_brain : {
    development : {
      iWazat_app : {
        client_id : '458645768175-e65b1liiseltvbv8sm7fh8kqn7a5kplr.apps.googleusercontent.com',
        client_secret : 'iXtz5a190du_7uzQIULBrqry',
        callback_url : 'http://localhost:8010/user/access/google/callback'
      }
    },
	  pubdev : {
		  iWazat_app : {
			  client_id : '???',
			  client_secret : '???',
			  callback_url : 'http://dev.iwaz.at:8020/user/access/google/callback'
		  }
	  },
    staging : {
      iWazat_app : {
        client_id : '458645768175-dqvcjoj45tk4vog2qhr1150i6e6nu4jr.apps.googleusercontent.com',
        client_secret : 'Imx5gRo6igYI3BRzvPwPOKHA',
        callback_url : 'http://staging.iwaz.at/user/access/google/callback'
      }
    },
    beta : {
      iWazat_app : {
        client_id : '458645768175.apps.googleusercontent.com',
        client_secret : 'xEDasvJdHgESosuQNBYjuxzk',
        callback_url : 'http://beta.iwaz.at/user/access/google/callback'
      }
    }
  }
};