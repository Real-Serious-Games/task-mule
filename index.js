'use strict';

module.exports = function (config) {

	var argv = require('yargs').argv;
	var conf = require('confucious');
	var path = require('path');
	var fs = require('fs-extra');
	var globby = require('globby');
	var chalk = require('chalk');
	var validate = require('./validate');
	var S = require('string');
	var AsciiTable = require('ascii-table');

	config = config || {};

	var log = config.log || require('./log')(argv.verbose, argv.nocolors);

	global.runCmd = require('./run-cmd')(log);
	global.path = require('path');
	global.fs = require('fs-extra');
	global.quote = require('quote');

	var workingDirectory = process.cwd();
	var buildFilePath = path.join(workingDirectory, "build.js");
	var tasksDirectory = path.join(workingDirectory, 'tasks');
	
	var requestedTaskName = config.requestedTaskName || argv._[0];
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
	else if (requestedTaskName === 'schedule') {

		if (!fs.existsSync('schedule.json')) {
			log.error('Expected scehdule.json to specify the schedule of tasks.');
			process.exit(1);
		}

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

		var taskRunner = require('./task-loader.js')({}, log, validate, conf);

	    taskRunner.resolveDependencies(conf)
	    	.then(function () {
				var cron = require('cron');

				var schedule = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));

				log.info('Starting task scheduler:');

				schedule.jobs.forEach(function (jobSpec) {
					log.info("\t" + jobSpec.task + " - " + jobSpec.cron);

					var cronJob = new cron.CronJob({
					    cronTime: jobSpec.cron,
					    onTick: function() { 

					    	log.info("Running task " + jobSpec.task + " at " + (new Date()));

					    	if (config.jobStarted) {
					    		config.jobStarted(jobSpec.task);
					    	}

							taskRunner.runTask(jobSpec.task, conf)
								.then(function () {
									if (config.jobSucceeded) {
										config.jobSucceeded(jobSpec.task);
									}
								})
					            .catch(function (err) {
					            	if (config.jobFailed) {
					            		config.jobFailed(jobSpec.task, err);
					            	} 
					            	else {
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
					            	}
					            })
						        .done(function () {
					        		buildConfig.done();
						        });			    	
					    }, 
					    start: true,
					});			
				});
	    	});

		return;
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

	var taskRunner = require('./task-loader.js')({}, log, validate, conf);

	if (requestedTaskName) {
	    return taskRunner.resolveDependencies(conf)
	    	.then(function () {
	    		return taskRunner.runTask(requestedTaskName, conf);
	    	})
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
	    return taskRunner.resolveDependencies(conf)
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

