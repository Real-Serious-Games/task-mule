'use strict';

module.exports = function (enableVerbose, noColors) {
	var chalk = require('chalk');

	return {
		error: function (msg) {
			if (noColors) {
				console.error(msg);
			}
			else {
				console.error(chalk.bold.red(msg));
			}
		},
		warn: function (msg) {
			if (noColors) {
				console.log(msg);
			}
			else {
				console.log(chalk.yellow(msg));	
			}
		},
		info: function (msg) {
			if (noColors) {
				console.log(msg);
			}
			else {
				if (enableVerbose) {
					console.log(chalk.bold.green(msg));
				}
				else {
					console.log(chalk.green(msg));
				}
			}
		},
		verbose: function (msg) {
			if (enableVerbose) {
				if (noColors) {
					console.log(msg);
				}
				else {
					console.log(chalk.green(msg));	
				}
			}
		},
		task: function (taskName) {
			console.log(chalk.cyan(taskName));
		}
	};
};