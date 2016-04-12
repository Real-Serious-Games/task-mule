'use strict';

var assert = require('chai').assert;
var Stopwatch = require('statman-stopwatch');
var E = require('linq');

// 
// A higher level manager for tasks. Runs tasks and coordinates error handling and logging.
//

var JobRunner = function (taskRunner, log, callbacks) {

	var self = this;

    assert.isObject(taskRunner);
    assert.isFunction(log.info);
    assert.isObject(callbacks);
    if (callbacks.unhandledExceptionCallback) {
        assert.isFunction(callbacks.unhandledException);
    }

    //
    // Add a task.
    //
	self.addTask = function (task) {

		assert.isObject(task);

        taskrunner.addTask(task);
	};

	//
	// Get a task by name, throws exception if task doesn't exist.
	//
	self.getTask = function (taskName) {

		assert.isString(taskName);

        return taskRunner.getTask(taskName);
	};

	//
	// Run a named task with a particular config.
	//
	self.runTask = function (taskName, config, configOverride) {

		assert.isString(taskName);
		assert.isObject(config);
        assert.isObject(configOverride);

        var stopwatch = new Stopwatch();
        stopwatch.start();

        if (callbacks.taskStarted) {
            callbacks.taskStarted({
                name: taskName 
            });
        }

        var uncaughtExceptionCount = 0;
        var uncaughtExceptionHandler = function (err) {
            ++uncaughtExceptionCount;

            if (callbacks.unhandledException) {
                callbacks.unhandledException(err);
            }
            else {
                log.error("Unhandled exception occurred.");
                log.error(err.message);
                log.info(err.stack);
            }            
        };

        process.on('uncaughtException', uncaughtExceptionHandler);

        return taskRunner.runTask(taskName, config, configOverride)
            .then(function () {
                stopwatch.stop();

                if (callbacks.taskSuccess) {
                    var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 
                    callbacks.taskSuccess({ name: taskName }, elapsedTimeMins);
                }
            })
            .catch(function (err) {
                stopwatch.stop();

                if (callbacks.taskFailure) {
                    var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 
                    callbacks.taskFailure({ name: taskName }, elapsedTimeMins, err);
                } 

                process.removeListener('uncaughtException', uncaughtExceptionHandler);
                throw err;
            })
            .then(function () {
                if (uncaughtExceptionCount > 0) {
                    throw new Error(' Unhandled exceptions (' + uncaughtExceptionCount + ') occurred while running task ' + taskName);
                };

                process.removeListener('uncaughtException', uncaughtExceptionHandler);
            })
            ;
	};


    //
    // List registered tasks.
    //
    self.listTasks = function () {

        taskRunner.listTasks();
    };

    //
    // Resolve dependencies for all tasks.
    //
    self.resolveAllDependencies = function (config) {

        assert.isObject(config);

        return taskRunner.resolveAllDependencies(config);
    };
    
    //
    // Resolve dependencies for a particular task.
    //
    self.resolveDependencies = function (taskName, config) {

        assert.isString(taskName);
    	assert.isObject(config);

        return taskRunner.resolveDependencies(taskName, config);
    };
};

module.exports = JobRunner;