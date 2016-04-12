'use strict';

var assert = require('chai').assert;
var AsciiTable = require('ascii-table');
var E = require('linq');

// 
// Responsible for finding and running tasks.
//

var TaskRunner = function (log) {

	var self = this;

    assert.isFunction(log.info);

	//
	// All tasks.
	//
    var tasks = [];

    //
    // Map of tasks for look up by name.
    //
    var taskMap = {};

    //
    // Add a task.
    //
	self.addTask = function (task) {

		assert.isObject(task);

        tasks.push(task);
        taskMap[task.name()] = task;                
	};

	//
	// Get a task by name, throws exception if task doesn't exist.
	//
	self.getTask = function (taskName) {

		assert.isString(taskName);

        var task = taskMap[taskName];
        if (!task) {
            throw new Error("Task not found: " + taskName);
        }

        return task;
	};

	//
	// Run a named task with a particular config.
	//
	self.runTask = function (taskName, config, configOverride) {

		assert.isString(taskName);
		assert.isObject(config);
        assert.isObject(configOverride);

        var requestedTask = taskMap[taskName];
        if (!requestedTask) {
            throw new Error("Failed to find task: " + taskName);
        }

        return self.resolveDependencies(taskName, config)
            .then(function () {        
                var tasksValidated = {}; // Tasks that have been validated.
                return requestedTask.validate(configOverride, config, tasksValidated);
            })
            .then(function () {
                var taskInvoked = {}; // Tasks that have been invoked.
                return requestedTask.invoke(configOverride, config, taskInvoked);
            })
            ;
	};


    //
    // List registered tasks.
    //
    self.listTasks = function () {

        var treeOutput = "#tasks\n";

        tasks.forEach(function (task) {
            treeOutput += task.genTree(2);
        });

        var asciitree = require('ascii-tree');
        console.log(asciitree.generate(treeOutput));
    };

    //
    // Resolve dependencies for all tasks.
    //
    self.resolveAllDependencies = function (config) {

        assert.isObject(config);

        return E.from(tasks)
            .aggregate(Promise.resolve(), function (prevPromise, task) {
                return prevPromise.then(function () {
                    return task.resolveDependencies(config);
                });
            });
    };
    
    //
    // Resolve dependencies for a particular task.
    //
    self.resolveDependencies = function (taskName, config) {

        assert.isString(taskName);
    	assert.isObject(config);

        var task = taskMap[taskName];
        if (!task) {
            throw new Error("Failed to find task: " + taskName);
        }        

        return task.resolveDependencies(config);
    };
};

module.exports = TaskRunner;