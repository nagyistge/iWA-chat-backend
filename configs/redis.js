/**
 * Redis client connection parameters are:
 * port
 * host
 * options:
 *      * parser
 *      * return_buffers
 *      * detect_buffers
 *      * socket_nodelay
 *      * no_ready_check
 *      * enable_offline_queue *
 * @See [@link https://github.com/mranney/node_redis#rediscreateclientport-host-options]
 *
 * As we also (in the time being only) use Redis for some internal Stores like Connect/Express
 * session, socket.io, and so on, the options of each scope don't have to be strictly the same that
 * Redis client requires
 */


module.exports = {
	iWazat_brain: {
		development: {
			expressSession: { // options to pass to connect-redis node module
				port: null,
				host: null,
				db: 0,
				options: {
					detect_buffers: true
				}
			},
			socketIO: {
				// Socket redis store use the host and port and the entire object is passed as options
				// parameter for each redis client
				redisPub: {
					port: 6379,
					host: '127.0.0.1',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisSub: {
					port: 6379,
					host: '127.0.0.1',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisClient: {
					port: 6379,
					host: '127.0.0.1',
					database: 1,
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				}
			},
			timelines: {
				port: 6379,
				host: '127.0.0.1',
				database: 2,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			},
			cache: {
				port: 6379,
				host: '127.0.0.1',
				database: 29,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			}
		},
		pubdev: {
			expressSession: { // options to pass to connect-redis node module
				port: 6391,
				host: '10.179.135.80',
				db: 6,
				options: {
					detect_buffers: true
				}
			},
			socketIO: {
				// Socket redis store use the host and port and the entire object is passed as options
				// parameter for each redis client
				redisPub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisSub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisClient: {
					port: 6391,
					host: '10.179.135.80',
					database: 7,
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}

				}
			},
			timelines: {
				port: 6391,
				host: '10.179.135.80',
				database: 8,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			},
			cache: {
				port: 6391,
				host: '10.179.135.80',
				database: 29,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			}
		},
		staging: {
			expressSession: { // options to pass to connect-redis node module
				port: 6391,
				host: '10.179.135.80',
				db: 11,
				options: {
					detect_buffers: true
				}
			},
			socketIO: {
				// Socket redis store use the host and port and the entire object is passed as options
				// parameter for each redis client
				redisPub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisSub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisClient: {
					port: 6391,
					host: '10.179.135.80',
					database: 12,
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				}
			},
			timelines: {
				port: 6391,
				host: '10.179.135.80',
				database: 13,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			},
			cache: {
				port: 6391,
				host: '10.179.135.80',
				database: 29,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			}
		},
		beta: {
			expressSession: { // options to pass to connect-redis node module
				port: 6391,
				host: '10.179.135.80',
				db: 1,
				options: {
					detect_buffers: true
				}
			},
			socketIO: {
				// Socket redis store use the host and port and the entire object is passed as options
				// parameter for each redis client
				redisPub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisSub: {
					port: 6391,
					host: '10.179.135.80',
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}
				},
				redisClient: {
					port: 6391,
					host: '10.179.135.80',
					database: 2,
					options: {
						parser: 'hiredis',
						return_buffers: false,
						detect_buffers: true,
						socket_nodelay: true,
						no_ready_check: false,
						enable_offline_queue: true
					}

				}
			},
			timelines: {
				port: 6391,
				host: '10.179.135.80',
				database: 3,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			},
			cache: {
				port: 6391,
				host: '10.179.135.80',
				database: 29,
				options: {
					parser: 'hiredis',
					return_buffers: false,
					detect_buffers: true,
					socket_nodelay: true,
					no_ready_check: false,
					enable_offline_queue: true
				}
			}
		}
	}
};