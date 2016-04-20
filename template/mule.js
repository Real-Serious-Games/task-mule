
'use strict';

module.exports = function (config, validate) {

	// ... load npm modules here ...

	return {
		//
		// Describes options to the system.
		// Fill this out to provide custom help when 'task-mule --help' is executed on the command line.
		//
		options: [
			['--some-option', 'description of the option'],
		],

		//
		// Examples of use.
		// Fill this out to provide custom help when 'task-mule --help' is executed on the command line.
		//
		examples: [
			['What it is', 'example command line'],
		],

		/* Uncomment this to provide your own custom logger.

		initLog: function () {

			var myLogger = {
				verbose: function (msg) {
					console.log(msg);					
				},

				info: function (msg) {
					console.log(msg);					
				},

				warn: function (msg) {
					console.log(msg);
	
				},

				error: function (msg) {
					console.error(msg);
				},
			}

			return myLogger;
		},
		*/

		initConfig: function () {
			// ... setup default config here ...
		},

		init: function () {
			// ... custom initialisation code here ... 
		},

		unhandledException: function (err) {
			// ... callback for unhandled exceptions thrown by your tasks ...
		},

		taskStarted: function (taskInfo) {
			// ... callback for when a task has started (not called for dependencies) ...
		},

		taskSuccess: function (taskInfo) {
			// ... callback for when a task has succeeed (not called for dependencies) ...
		},

		taskFailure: function (taskInfo) {
			// ... callback for when a task has failed (not called for dependencies) ...
		},

		taskDone: function (taskInfo) {
			// ... callback for when a task has completed, either failed or succeeed (not called for dependencies) ...
		},

	};
};