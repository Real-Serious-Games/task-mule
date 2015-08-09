var assert = require('chai').assert;
var fs = require("fs");
var path = require('path');
var E = require('linq');
var S = require('string');
var Task = require('./task');
var sugar = require('sugar');
var TaskRunner = require('./task-runner.js');

//
// Automatic loading of Grunt tasks from a collection of files.
//
module.exports = function (autoLoadConfig, log, validate, config) {

    assert.isObject(autoLoadConfig);
    assert.isObject(log);
    assert.isObject(validate);
    assert.isObject(config);

    // 
    // Load in all tasks from files.
    //
    var tasksValidated = {}; // Remembers tasks that have been validated, so they aren't validated again.
    var tasksInvoked = {}; // Remembers tasks that have been invoked, so they aren't invoked again.
    var tasksDir = autoLoadConfig.tasksDir || path.join(process.cwd(), "tasks");

    var taskRunner = new TaskRunner(log);
    
    //
    // Sync walk a directory structure and call the callback for each file.
    //
    var walkDirsInternal = function (rootPath, subDirPath, parentTask) {
        
        var dirPath = path.join(rootPath, subDirPath);
        var items = fs.readdirSync(dirPath);

            for (var i = 0; i < items.length; ++i) {
            
            var itemName = items[i];
            var relativeItemPath = path.join(subDirPath, itemName);
            var fullItemPath = path.join(dirPath, itemName);
            var task = new Task(itemName, relativeItemPath, fullItemPath, parentTask, log, validate, taskRunner);
            taskRunner.addTask(task, parentTask);

            var stat = fs.statSync(fullItemPath);            
            if (stat.isDirectory()) {
                walkDirsInternal(rootPath, relativeItemPath, task);
            }
        }
    };

    var walkDirs = function (dirPath) {
        walkDirsInternal(dirPath, "./");
    };    
    
    walkDirs(tasksDir);

    taskRunner.resolveDependencies(config);

    return taskRunner;
};