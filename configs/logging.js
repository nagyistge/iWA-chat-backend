var winston = require('winston');
var settings = require('../settings.js');

/**
 * The path to the flat files is absolute and it will be prepended to the
 * winston filename option parameter of the File transport type
 */

module.exports = {
	iWazat_brain: {
		development: {
			iWazat_system: {
				winstons: {
					_default: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'main.log'
								}
							}
						]
					},
//          exceptionHandler: {
//            options: {
//              exitOnError: false
//            },
//            global: {
//              flatFiles: {
//                rootPath: settings.rootPath
//                  + '/tmp/logs'
//              }
//            },
//            transports: [
//              {
//                transport: winston.transports.Console,
//                options: {
//                  json: true,
//                  colorize: true,
//                  handleExceptions: true
//                }
//              },
//              {
//                transport: winston.transports.File,
//                options: {
//                  filename: 'uncaught_exceptions.log',
//                  json: true,
//                  handleExceptions: true
//                }
//              }
//            ]
//          },
					twitter: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs/providers'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									level: 'warn',
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'twitter.log'
								}
							}
						]
					},
					eventsStream: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									level: 'warn',
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'events_stream.log'
								}
							}
						]
					},
					usersNotifications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'users_notifications.log'
								}
							}
						]
					},
					userAuthentications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_auth_dev.log'
								}
							}
						]
					},
					userRegistrations: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_regs_dev.log'
								}
							}
						]
					},
					securityIssues: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues_dev.log'
								}
							}
						]
					},
					systemActivityInfo: {
						global: {
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							}
						]
					},
					criticalIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues_dev.log'
								}
							}
						]
					},
					globalDBSysIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'global_db_sys_issues_dev.log'
								}
							}
						]
					}
				},
				expressWinston: {
					errorLogger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston_error_dev.log'
								}
							}
						]
					},
					logger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
//							{
//								transport: winston.transports.Console,
//								options: {
//									json: true,
//									colorize: true
//								}
//							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'expressWinston_logger_dev.log'
								}
							}
						]
					}
				}
			}
		},
		pubdev: {
			iWazat_system: {
				winstons: {
					_default: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'main.log'
								}
							}
						]
					},
//          exceptionHandler: {
//            options: {
//              exitOnError: false
//            },
//            global: {
//              flatFiles: {
//                rootPath: settings.rootPath
//                  + '/tmp/logs'
//              }
//            },
//            transports: [
//              {
//                transport: winston.transports.Console,
//                options: {
//                  json: true,
//                  colorize: true,
//                  handleExceptions: true
//                }
//              },
//              {
//                transport: winston.transports.File,
//                options: {
//                  filename: 'uncaught_exceptions.log',
//                  json: true,
//                  handleExceptions: true
//                }
//              }
//            ]
//          },
					twitter: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs/providers'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									level: 'warn',
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'twitter.log'
								}
							}
						]
					},
					eventsStream: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									level: 'warn',
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'events_stream.log'
								}
							}
						]
					},
					usersNotifications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'users_notifications.log'
								}
							}
						]
					},
					userAuthentications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_auth_dev.log'
								}
							}
						]
					},
					userRegistrations: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_regs_dev.log'
								}
							}
						]
					},
					securityIssues: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues_dev.log'
								}
							}
						]
					},
					systemActivityInfo: {
						global: {
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							}
						]
					},
					criticalIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues_pubdev.log'
								}
							}
						]
					},
					globalDBSysIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'global_db_sys_issues_dev.log'
								}
							}
						]
					}
				},
				expressWinston: {
					errorLogger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston_error_dev.log'
								}
							}
						]
					},
					logger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston_logger_dev.log'
								}
							}
						]
					}
				}
			}
		},
		staging: {
			iWazat_system: {
				winstons: {
					_default: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'main.log'
								}
							}
						]
					},
					exceptionHandler: {
						options: {
							exitOnError: false
						},
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'uncaught_exceptions.log',
									json: true,
									handleExceptions: true
								}
							}
						]
					},
					twitter: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs/providers'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'twitter.log'
								}
							}
						]
					},
					eventsStream: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'events_stream.log'
								}
							}
						]
					},
					usersNotifications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'users_notifications.log'
								}
							}
						]
					},
					userAuthentications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_auth.log'
								}
							}
						]
					},
					userRegistrations: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_regs.log'
								}
							}
						]
					},
					securityIssues: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues.log'
								}
							}
						]
					},
					systemActivityInfo: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'system_activity.log'
								}
							}
						]
					},
					criticalIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						// TODO add another transport, for example email
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues.log'
								}
							}
						]
					},
					globalDBSysIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'warn',
									filename: 'global_db_sys_issues.log'
								}
							}
						]
					}
				},
				expressWinston: {
					errorLogger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston_error.log'
								}
							}
						]
					},
					logger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston.log'
								}
							}
						]
					}
				}
			}
		},
		beta: {
			iWazat_system: {
				winstons: {
					_default: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'main.log'
								}
							}
						]
					},
					exceptionHandler: {
						options: {
							exitOnError: false
						},
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'uncaught_exceptions.log',
									json: true,
									handleExceptions: true
								}
							}
						]
					},
					twitter: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs/providers'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'twitter.log'
								}
							}
						]
					},
					eventsStream: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'info',
									filename: 'events_stream.log'
								}
							}
						]
					},
					usersNotifications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'users_notifications.log'
								}
							}
						]
					},
					userAuthentications: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_auth.log'
								}
							}
						]
					},
					userRegistrations: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'user_regs.log'
								}
							}
						]
					},
					securityIssues: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues.log'
								}
							}
						]
					},
					systemActivityInfo: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'system_activity.log'
								}
							}
						]
					},
					criticalIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						// TODO add another transport, for example email
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.Console,
								options: {
									json: true,
									colorize: true
								}
							},
							{
								transport: winston.transports.File,
								options: {
									filename: 'security_issues.log'
								}
							}
						]
					},
					globalDBSysIssues: { // This log should register events that are critical to solve and they
						// could not be solved by the application itself and require some external action
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									level: 'warn',
									filename: 'global_db_sys_issues.log'
								}
							}
						]
					}
				},
				expressWinston: {
					errorLogger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston_error.log'
								}
							}
						]
					},
					logger: {
						global: {
							flatFiles: {
								rootPath: settings.rootPath
									+ '/tmp/logs'
							}
						},
						transports: [
							{
								transport: winston.transports.File,
								options: {
									filename: 'expressWinston.log'
								}
							}
						]
					}
				}
			}
		}
	}
};