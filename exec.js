'use strict';

//
// Wrapper for exec for running tasks.
//

module.exports = function (config, log) {

	return function (cmd, options) {

		var exec = require('promised-exec');
		var opts = options || {};

		log.verbose("Running command: " + cmd);

		return exec(cmd, opts)
			.then(function (output) {
				if (config.get('verbose')) {
					log.verbose("== Stdout == ");
					log.verbose(output.stdout);
					log.verbose("== Stderr == ");
					log.verbose(output.stderr);
				}
				return output.stdout;
			})
			.catch(function (err) {
				if (!opts.dontFailOnError) {
					log.error("Build failed due to error in command. ");
					log.warn("Command: " + cmd);
					log.warn("Error code: " + err.code);
					log.warn("== Stdout == ");
					log.warn(err.stdout);
					log.warn("== Stderr == ");
					log.warn(err.stderr);
					throw err;
				}
				else {
					return {
						stdout: err.stdout,
						stderr: err.stderr,
					};
				}
			});
	};
};