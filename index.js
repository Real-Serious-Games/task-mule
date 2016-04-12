'use strict';

var argv = require('yargs').argv;
var conf = require('confucious');
var path = require('path');
var fs = require('fs-extra');
var globby = require('globby');
var chalk = require('chalk');
var validate = require('./validate');
var S = require('string');
var AsciiTable = require('ascii-table');
var assert = require('chai').assert;

var workingDirectory = process.cwd();
var buildFilePath = path.join(workingDirectory, "mule.js");
var tasksDirectory = path.join(workingDirectory, 'tasks');

//
// task-mule init
//
var commandInit = function (config, log) {

	if (fs.existsSync(buildFilePath)) {
		log.error("Can't overwrite existing 'mule.js'.");
		process.exit(1);
	}

	// Auto create mule.js.
	var defaultBuildJs = path.join(__dirname, 'template', 'mule.js');
	fs.copySync(defaultBuildJs, buildFilePath);
	log.info("Created new 'mule.js' at " + buildFilePath);
	process.exit(0);
};

//
// task-mule create-task <task-name>
//
var commandCreateTask = function (config, log) {

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

	var defaultTaskFile = path.join(__dirname, 'template', 'task.js');
	fs.copySync(defaultTaskFile, newTaskFilePath);
	log.info("Created new task file at " + newTaskFilePath);
};

//
// Init config prior to running or listing tasks.
//
var initConfig = function (config, log) {

	var buildConfig = require(buildFilePath)(conf, log, validate);

	var defaultConfigFilePath = path.join(workingDirectory, 'config.json');
	if (fs.existsSync(defaultConfigFilePath)) {

		log.verbose("Loading config from file: " + defaultConfigFilePath);

		conf.pushJsonFile(defaultConfigFilePath);
	}

	conf.pushEnv();
	conf.pushArgv();

	if (config.defaultConfig) {
		conf.push(config.defaultConfig)
	}

	buildConfig.init();

	return buildConfig;
};

//
// task-mule schedule
//
var commandSchedule = function (config, log) {

	if (!fs.existsSync('schedule.json')) {
		log.error('Expected schedule.json to specify the schedule of tasks.');
		process.exit(1);
	}

	var buildConfig = initConfig(config, log);

	var taskRunner = require('./task-loader.js')({}, log, validate, conf);

	var schedule = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));

	var TaskScheduler = require('./task-scheduler');
	var taskScheduler = new TaskScheduler(taskRunner, config, log);
	taskScheduler.start(schedule, buildConfig);
};

//
// task-mule <task-name>
//
var commandRunTask = function (config, log, requestedTaskName) {

	if (!fs.existsSync(buildFilePath)) {
		log.error("'mule.js' not found, please run task-mule in a directory that has this file.");
		log.info("Run 'task-mule init' to create a default 'mule.js'.")
		process.exit(1);
	}

	if (!fs.existsSync(tasksDirectory)) {
		log.error("'tasks' directory doesn't exist.");
		log.info("Run 'task-mule create-task <task-name> to create your first task.");
		process.exit(1);
	}

	var buildConfig = initConfig(config, log);

	var unhandledExceptionCallback = buildConfig.unhandledException || function (err) {
			console.error("Unhandled exception occurred.");
			console.error(err);
		};

	var taskRunner = require('./task-loader.js')({}, log, validate, conf, unhandledExceptionCallback);

	if (requestedTaskName) {
	    return taskRunner.runTask(requestedTaskName, conf, {})
            .catch(function (err) {
                
                log.error('Build failed.');
                
                if (err.message) {
                    log.warn(err.message);
                }

                if (err.stack) {
                    log.warn(err.stack);
                }
                else {
                    log.warn('no stack');
                }
                if (!config.noExit) {
                	process.exit(1);
                }

                buildConfig.done();

                throw err;
            })
	        .then(function () {
        		buildConfig.done();
	        });
	}
	else if (argv.tasks) {
	    return taskRunner.resolveAllDependencies(conf)
	    	.then(function () {
			    taskRunner.listTasks();
			    process.exit(1);
			});
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

module.exports = function (config) {

	config = config || {};

	var log = config.log || require('./log')(argv.verbose, argv.nocolors);

	global.runCmd = require('./run-cmd')(log);

	var requestedTaskName = config.requestedTaskName || argv._[0];
	if (requestedTaskName === 'init') {
		commandInit(config, log);
		process.exit(0);
	}
	else if (requestedTaskName === 'create-task') {
		commandCreateTask(config, log);
		process.exit(0);
	}
	else if (requestedTaskName === 'schedule') {
		commandSchedule(config, log);
		return;
	}

	return commandRunTask(config, log, requestedTaskName);
};

