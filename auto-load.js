var fs = require("fs");
var path = require('path');
var E = require('linq');
var S = require('string');
var metrics = require('statman');
var Task = require('./task');
var sugar = require('sugar');

//
// Automatic loading of Grunt tasks from a collection of files.
//
module.exports = function (autoLoadConfig, log, validate, config) {

    // 
    // Load in all tasks from files.
    //
    var tasks = [];
    var rootTasks = [];
    var taskMap = {};
    var tasksValidated = {}; // Remembers tasks that have been validated, so they aren't validated again.
    var tasksInvoked = {}; // Remembers tasks that have been invoked, so they aren't invoked again.
    var tasksDir = autoLoadConfig.tasksDir || path.join(process.cwd(), "tasks");
    var depsMap = {};
    
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
            var task = new Task(itemName, relativeItemPath, fullItemPath, parentTask, log, validate, config, taskMap);
            tasks.push(task);
            taskMap[task.fullName()] = task;                

            if (parentTask) {
                parentTask.addChild(task);
            }
            else {
                rootTasks.push(task);
            }

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
    
    tasks.forEach(function (task) {
        task.resolveDependencies();
    });

    return {
        //
        // Invoke the requested task.
        //
        invoke: function (requestedTaskName)  {

            var requestedTask = taskMap[requestedTaskName];
            if (!requestedTask) {
                throw new Error("Failed to find task: " + requestedTaskName);
            }
            
            var stopWatch = new metrics.Stopwatch();
            
            if (config.get('timed')) {
                stopWatch.start();
            }

            return requestedTask.validate()
                .then(function () {
                    return requestedTask.invoke();
                })
                .then(function () {
                
                    var ouputMessage = 'Build completed';

                    if (config.get('timed')) {
                        stopWatch.stop();
                        ouputMessage += ": " + (stopWatch.read() * 0.001).toFixed(2) + " seconds";
                    }

                    log.info(ouputMessage);
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
                    process.exit(1);
                });
        },

        //
        // List registered tasks.
        //
        listTasks: function () {
            var rootTasks = [];
            tasks.forEach(function (task) {
                if (!depsMap[task.fullName()]) {
                    rootTasks.push(task);
                }
            });

            var treeOutput = "#tasks\n";

            rootTasks.forEach(function (task) {
                treeOutput += task.genTree(2);
            });

            var asciitree = require('ascii-tree');
            console.log(asciitree.generate(treeOutput));
        },
    };
};