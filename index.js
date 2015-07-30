'use strict';

module.exports = function (config) {

	var argv = require('yargs').argv;
	var nconf = require('nconf');
	var path = require('path');
	var fs = require('fs-extra');
	var globby = require('globby');
	var chalk = require('chalk');
	var AsciiTable = require('ascii-table');
	var validate = require('./validate');

	var log = require('./log')(argv.verbose, argv.nocolors);

	global.path = require('path');
	global.exec = require('./exec')(nconf, log);
	global.path = require('path');
	global.fs = require('fs-extra');
	global.quote = require('quote');

	var buildFilePath = path.join(process.cwd(), "build.js");
	
	var requestedTaskName = argv._[0];
	if (requestedTaskName === 'init') {
		if (fs.exists(buildFilePath)) {
			log.error("Can't overwrite existing 'build.js'.");
			process.exit(1);
		}

		// Auto create build.js.
		var defaultBuildJs = path.join(__dirname, 'build.js');
		fs.copySync(defaultBuildJs, buildFilePath);
		log.info("Created new 'build.js' at " + buildFilePath);
		process.exit(0);
	}

	if (!fs.exists(buildFilePath)) {
		log.error("'build.js' not found, please run task-mule in a directory that has this file.");
		log.info("Run 'task-mule init' to create a default 'build.js'.")
		process.exit(1);
	}

	var buildConfig = require(buildFilePath)(nconf, log, validate);

	nconf.use('memory');

	nconf.argv();
	var tasks = require('./auto-load.js')({}, log, validate, nconf);

	if (requestedTaskName) {
		buildConfig.init();

	    tasks.invoke(requestedTaskName)
	        .done(function () {
        		buildConfig.done();
	        });
	}
	else if (argv.tasks) {
	    tasks.listTasks();
	    process.exit(1);
	} 
	else { 
	    log.warn("Usage: task-mule <task-name> [options]\n");

	    var optionsTable = new AsciiTable('Options');
	    optionsTable
	      .setHeading('Options', 'Description');

	    buildConfig.options.forEach(function (option) {
	        optionsTable.addRow(option[0], option[1]);
	    });

	    console.log(chalk.bold.green(optionsTable.toString()));

	    var examplesTable = new AsciiTable('Examples');
	    examplesTable.setHeading('What?', 'Command Line');

	     buildConfig.examples.forEach(function (example) {
	     	examplesTable.addRow(example[0], example[1]);
	     });

	    console.log(chalk.bold.green(examplesTable.toString()));

	    process.exit(1);
	}
};

