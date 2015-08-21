'use strict';

var assert = require('chai').assert;
var AsciiTable = require('ascii-table');
var metrics = require('statman');

// 
// Responsible for finding and running tasks.
//

var TaskRunner = function (log) {

	var self = this;

	assert.isObject(log);

	//
	// All tasks.
	//
    var tasks = [];

    //
    // Root tasks in the task hierarchy.
    //
    var rootTasks = [];

    //
    // Map of tasks for look up by name.
    //
    var taskMap = {};

    //
    // Add a task and wire it up to the parent task.
    //
	self.addTask = function (task, parentTask) {

		assert.isObject(task);

		if (parentTask) {
			assert.isObject(parentTask);
		}

        tasks.push(task);
        taskMap[task.fullName()] = task;                

        if (parentTask) {
            parentTask.addChild(task);
        }
        else {
            rootTasks.push(task);
        }
	};

	//
	// Get a task by name, throws exception if task doesn't exist.
	//
	self.getTask = function (requestedTaskName) {

		assert.isString(requestedTaskName);

        var task = taskMap[requestedTaskName];
        if (!task) {
            throw new Error("Task not found: " + requestedTaskName);
        }

        return task;
	};

	//
	// Run a named task with a particular config.
	//
	self.runTask = function (requestedTaskName, config) {

		assert.isString(requestedTaskName);
		assert.isObject(config);

        var requestedTask = taskMap[requestedTaskName];
        if (!requestedTask) {
            throw new Error("Failed to find task: " + requestedTaskName);
        }
        
        var stopWatch = new metrics.Stopwatch();
        
        if (config.get('timed')) {
            stopWatch.start();
        }

	    //
	    // Tasks that have been validated.
	    //
	    var tasksValidated = {};

	    //
	    // Tasks that have been invoked.
	    //
	    var taskInvoked = {};

        return requestedTask.validate({}, config, tasksValidated)
            .then(function () {
                return requestedTask.invoke({}, config, taskInvoked);
            })
            .then(function () {
            
                var ouputMessage = 'Build completed';

                if (config.get('timed')) {
                    stopWatch.stop();
                    ouputMessage += ": " + (stopWatch.read() * 0.001).toFixed(2) + " seconds";
                }

                log.info(ouputMessage);
            });
	};


    //
    // List registered tasks.
    //
    self.listTasks = function () {

        var treeOutput = "#tasks\n";

        rootTasks.forEach(function (task) {
            treeOutput += task.genTree(2);
        });

        var asciitree = require('ascii-tree');
        console.log(asciitree.generate(treeOutput));
    };

    //
    // Resolve dependencies between tasks.
    //
    self.resolveDependencies = function (config) {

    	assert.isObject(config);
	    
	    tasks.forEach(function (task) {
        	task.resolveDependencies(config);
    	});
    };


};

module.exports = TaskRunner;