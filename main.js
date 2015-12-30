'use strict';
/**
 * Exit codes base on: http://www.gsp.com/cgi-bin/man.cgi?section=3&topic=sysexits
 */

var settings = require('./settings');


/**
 * Dependencies
 */
var childProc = require('child_process');
var FileStoreSync = require('file-store-sync');
var configLoader = require(settings.libsPath + '/iwazat/util/config');
var serverCnf = require(settings.configsPath + '/iWazatServer');

var pidsFileStore = new FileStoreSync(settings.tempPath + '/subprocesses.pid');
var subsys;
var childs = {};
var nTotalChains = 0;
var ssChains = {};
var ssId;
var chainId;
var chainPos;
var tmpVar;

serverCnf = configLoader.getConfiguration(serverCnf);
subsys = serverCnf.subsystems;

// If there isn't any subsytem then launch app.js
if (!subsys) {
	childs = null;
	monitorize();
	return;
}

try {
	for (ssId in subsys) {
		if (subsys[ssId].chain) {
			chainId = subsys[ssId].chain.id;

			if (!chainId) {
				throw new Error('The subsystem ' + ssId + ' has been defined to run in another process ' +
					'but it doesn\'t have a chain id. It is required');
			}

			if (!ssChains[chainId]) {
				nTotalChains++;
				ssChains[chainId] = [];
			}

			chainPos = subsys[ssId].chain.pos;

			if (('number' !== typeof chainPos) || (chainPos < 0)) {
				throw new Error('The subsystem ' + ssId + ' has been defined to run in another process ' +
					'but it doesn\'t have or has a wrong position (pos) value');
			}

			tmpVar = pidsFileStore.get(ssId);

			if (tmpVar !== null) {
				ssChains[chainId][chainPos] = {
					id: ssId,
					pid: tmpVar,
					child: subsys[ssId].child
				};
			} else {
				ssChains[chainId][chainPos] = {
					id: ssId,
					child: subsys[ssId].child
				};
			}

			tmpVar = subsys[ssId].chain.restart;

			if (tmpVar) {
				if (('boolean' === typeof tmpVar) || (Array.isArray(tmpVar))) {
					ssChains[chainId][chainPos].restart = subsys[ssId].chain.restart;
				} else {
					throw new Error('The subsystem ' + ssId + ' has been defined to run in another process ' +
						'but it holds a wrong type value in the optional parameter restart of the chain ' +
						'definition object (Accepted boolean or array');
				}
			}
		}
	} // End loop to set up the process chains

	if (nTotalChains > 0) {
		for (ssId in ssChains) {
			executeChain(ssChains[ssId]);
		}
	} else {
		childs = null;
		monitorize();
	}

} catch (e) {
	abort(e);
}


function doneExecChain(err) {

	if (err) {
		abort(err);
		return;
	}

	nTotalChains--;

	if (nTotalChains === 0) {
		monitorize();
	}
}


function executeChain(ssChain) {

	var started = {};
	var nLink = 0;
	var link;

	try {
		executeNextLink();
	} catch (e) {
		doneExecChain(e);
	}

	function executeNextLink() {
		var it;

		if (nLink === ssChain.length) {
			doneExecChain();
			return;
		}

		link = ssChain[nLink];

		if (link.pid) {
			isProcessAlive(link.pid, function (err, confirmation) {

				if (err) {
					doneExecChain(err);
					return;
				}

				if (confirmation === true) {

					if (link.restart) {
						if (link.restart === true) {
							process.kill(link.pid, 'SIGTERM');
							it = 0;
						} else {

							for (it = 0; it < link.restart.length; it++) {
								if (started[link.restart[it]] === true) {
									process.kill(link.pid, 'SIGTERM');
									break;
								}
							}

							if (it === link.restart.length) {
								it = -1;
							}
						}
					} else {
						it = -1;
					}

					if (it === -1) {
						childs[link.id] = link.pid;
						nLink++;
						executeNextLink();
						return;
					}
				}

				// Restart the process if the pid doesn't exist or a dependent process has been restarted
				started[nLink] = true;
				childs[link.id] = execChild(link.child);
				pidsFileStore.set(link.id, childs[link.id].pid);
				nLink++;
				executeNextLink();
			});

		} else {
			started[nLink] = true;
			childs[link.id] = execChild(link.child);
			pidsFileStore.set(link.id, childs[link.id].pid);
			nLink++;
			executeNextLink();
		}

	}
}

function execChild(childDef) {

	var child;

	switch (childDef.method) {
		case 'fork':
			child = childProc.fork(childDef.exec, childDef.args, childDef.options);

			if (childDef.disconnect === true) {
				child.disconnect();
			}

			return child;
			break;
		default:
			throw new Error('Unrecognized method to create a child process');
	}
}

function isProcessAlive(pid, callback) {

	childProc.exec('ps -o pid= -p ' + pid, function (err, stdout, stderr) {

		if (err) {

			// The command returns these values if any process has been found with the specified id
			if ((err.killed === false) && (err.code === 1) && (err.signal === null)) {
				callback(null, false);
			} else {
				callback(err);
			}
			return;
		}

		callback(null, true);
	});
}

function abort(err) {
	console.error(err);
	process.exit(70);
}

function cleanOnSIGN() {
	console.log('Server is shutting down');

	if (childs) {
		for (var c in childs) {
			// If this process created the children, then they will receive the SIGINT or SIGTERM
			// automatically so we need to send the signal to the process which aren't children of it
			if ('number' === typeof childs[c]) {
				process.kill(childs[c], 'SIGTERM');
			}
		}

		childs = null;
	}

	process.exit(0);
};

function monitorize() {

	require('./app');

	process.on('exit', function () {

		if (childs) {
			for (var c in childs) {
				if ('number' === typeof childs[c]) {
					process.kill(childs[c], 'SIGTERM');
				} else {
					process.kill(childs[c].pid, 'SIGTERM');
				}
			}
		}

		console.log('Server shut down');
	});

	process.on('SIGINT', cleanOnSIGN);
	process.on('SIGTERM', cleanOnSIGN);

};

