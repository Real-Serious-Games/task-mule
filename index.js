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

	global.path = require('path');
	global.exec = require('./exec')(nconf, log);
	global.path = require('path');
	global.fs = require('fs-extra');
	global.quote = require('quote');
	
	var log = require('./log')(argv.verbose, argv.nocolors);

	var buildFilePath = path.join(process.cwd(), "build.js");
	var buildConfig = require(buildFilePath)({}, {}, {});

	var requestedTaskName = argv._[0];

	nconf.use('memory');

	nconf.argv();

	buildConfig.init(nconf, log, validate);
	
	var tasks = require('./auto-load.js')({}, log, validate, nconf);

	if (requestedTaskName) {
	    tasks.invoke(requestedTaskName)
	        .done(function () {
	            if (!argv.keepTmpDir) {
	                fs.deleteSync(tmpDir);
	            }
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

