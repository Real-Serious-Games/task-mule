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
	var S = require('string');

	var log = require('./log')(argv.verbose, argv.nocolors);

	global.path = require('path');
	global.exec = require('./exec')(nconf, log);
	global.path = require('path');
	global.fs = require('fs-extra');
	global.quote = require('quote');

	var buildFilePath = path.join(process.cwd(), "build.js");
	var tasksDirectory = path.join(process.cwd(), 'tasks');
	
	var requestedTaskName = argv._[0];
	if (requestedTaskName === 'init') {
		if (fs.existsSync(buildFilePath)) {
			log.error("Can't overwrite existing 'build.js'.");
			process.exit(1);
		}

		// Auto create build.js.
		var defaultBuildJs = path.join(__dirname, 'build.js');
		fs.copySync(defaultBuildJs, buildFilePath);
		log.info("Created new 'build.js' at " + buildFilePath);
		process.exit(0);
	}
	else if (requestedTaskName === 'create-task') {
		var newTaskName = argv._[1];
		if (!newTaskName) {
			log.error("Task name not specified.");
			process.exit(1);
		}

		if (!S(newTaskName.toLowerCase()).endsWith(".js")) {
			if (newTaskName[newTaskName.length-1] === '.') {
				// Trim final period.
				newTaskName = newTaskName.substring(0, newTaskName.length-1);
			}
			
			// Auto add extension.
			newTaskName += ".js";
		}

		var newTaskFilePath = path.join(tasksDirectory, newTaskName);
		if (fs.existsSync(newTaskFilePath)) {
			log.error("Can't create task, file already exists: " + newTaskFilePath);
			process.exit(1);
		}

		var defaultTaskFile = path.join(__dirname, 'default-task.js');
		fs.copySync(defaultTaskFile, newTaskFilePath);
		log.info("Created new task file at " + newTaskFilePath);

		process.exit(0);
	}

	if (!fs.existsSync(buildFilePath)) {
		log.error("'build.js' not found, please run task-mule in a directory that has this file.");
		log.info("Run 'task-mule init' to create a default 'build.js'.")
		process.exit(1);
	}

	if (!fs.existsSync(tasksDirectory)) {
		log.error("'tasks' directory doesn't exist.");
		log.info("Run 'task-mule create-task <task-name> to create your first task.");
		process.exit(1);
	}

	var buildConfig = require(buildFilePath)(nconf, log, validate);

	nconf.use('memory');

	nconf.argv();
	var tasks = require('./task-loader.js')({}, log, validate, nconf);

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
	    log.info("Usage: task-mule <task-name> [options]\n");

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

