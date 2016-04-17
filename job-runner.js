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

    var taskStarted = function (taskName) {
        var promise;

        if (callbacks.taskStarted) {
            promise = callbacks.taskStarted({
                name: taskName 
            });
        }

        if (!promise) {
            promise = Promise.resolve();
        }

        return promise;
    };

    var taskSuccess = function (taskName, stopwatch) {
        var promise;

        if (callbacks.taskSuccess) {
            var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 
            promise = callbacks.taskSuccess({ name: taskName }, elapsedTimeMins);
        }

        if (!promise) {
            promise = Promise.resolve();
        }

        return promise;
    };

    var taskFailed = function (taskName, err, stopwatch) {
        var promise;

        if (callbacks.taskFailure) {
            var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 
            promise = callbacks.taskFailure({ name: taskName }, elapsedTimeMins, err);
        }         

        if (!promise) {
            promise = Promise.resolve();
        }

        return promise;
    };

    var taskDone = function (taskName) {
        var promise;

        if (callbacks.taskDone) {
            promise = callbacks.taskDone({ name: taskName });
        }         

        if (!promise) {
            promise = Promise.resolve();
        }

        return promise;
    };

	//
	// Run a named task with a particular config.
	//
	self.runTask = function (taskName, config, configOverride) {

        configOverride = configOverride || {};

		assert.isString(taskName);
		assert.isObject(config);
        assert.isObject(configOverride);

        var stopwatch = new Stopwatch();
        stopwatch.start();

        var uncaughtExceptionCount = 0;
        var uncaughtExceptionHandler = function (err) {
            ++uncaughtExceptionCount;

            if (callbacks.unhandledException) {
                callbacks.unhandledException(err);
            }
            else {
                log.error("Unhandled exception occurred.");
                log.error(err && err.stack || err);
            }            
        };

        process.on('uncaughtException', uncaughtExceptionHandler);

        return taskStarted(taskName)
            .then(function () {
                return taskRunner.runTask(taskName, config, configOverride);
            })
            .then(function () {
                if (uncaughtExceptionCount > 0) {
                    throw new Error(' Unhandled exceptions (' + uncaughtExceptionCount + ') occurred while running task ' + taskName);
                };
            })
            .then(function () {
                stopwatch.stop();
                process.removeListener('uncaughtException', uncaughtExceptionHandler);
                return taskSuccess(taskName, stopwatch);
            })
            .then(function () {
                return taskDone(taskName);
            })
            .catch(function (err) {
                stopwatch.stop();
                process.removeListener('uncaughtException', uncaughtExceptionHandler);

                return taskFailed(taskName, err, stopwatch)
                    .then(function () {
                        throw err;
                    });
            })
            .catch(function (err) {
                return taskDone(taskName)
                    .then(function () {
                        throw err;                        
                    })
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