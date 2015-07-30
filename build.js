
'use strict';

module.exports = function (config, log, validate) {
	return {
		//
		// Describes options to the system.
		//
		options: [
			['--some-option', 'description of the option'],
		],

		//
		// Examples of use.
		//
		examples: [
			['What it is', 'example command line'],
		],

		//
		// Initialse configuration.
		//
		init: function () {
			//todo: Pre-build initialisation.
		},

		//
		// Invoked when tasks have completed.
		//
		done: function () {
			//todo: Post-build cleanup.
		},
	};
};