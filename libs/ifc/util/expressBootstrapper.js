'use strict';


module.exports = function (expressApp, expressOptions, middlewareChain) {

	var i;
	var exported;

	if (arguments.length === 2) {
		if (expressOptions instanceof Array) {
			middlewareChain = expressOptions;
			expressOptions = null;
		}
	}

	if (expressOptions) {
		for (i in expressOptions) {
			expressApp.set(i, expressOptions[i]);
		}
	}

	if (middlewareChain) {
		for (i = 0; i < middlewareChain.length; i++) {

			exported = middlewareChain[i];

			switch (typeof exported) {
				case 'function':
					expressApp.use(exported);
					break;

				case 'string':
					exported = require(exported);

					if ('function' === typeof exported) {
						exported(expressApp);
						break;
					}

				case 'object':
					exported.initialise(expressApp);
					break;

				default:
					throw new Error('Middleware is a function or a string with the path to the script ' +
						'which exports a function or an object with a function property named "initialise"' +
						'that receive express application as unique parameter, it also have an object with' +
						'the same precondition that the object exported by a script file');
			}
		}
	}
};
