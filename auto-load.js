var fs = require("fs");
var path = require('path');
var E = require('linq');
var S = require('string');
var Promise = require('promise');
var sugar = require('sugar');
var metrics = require('statman');

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
    var tasksDir = autoLoadConfig.tasksDir || path.join(__dirname, "tasks");
    var depsMap = {};
    
    var stripExt = function (fileName) {
        if (S(fileName).endsWith('.js')) {
            return fileName.slice(0, -3); // Hacky: Specific for .js files.
        }
        else {
            return fileName;
        }
    };

    //
    // Class that represents a task loaded from a file.
    //
    function Task (fileName, relativeFilePath, fullFilePath, parentTask) {

        var self = this;
        self.fileName = fileName;
        self.relativeFilePath = relativeFilePath;
        self.fullFilePath = fullFilePath;

        self.taskName = stripExt(fileName);
        self.children = [];
        self.childrenMap = {};

        if (S(fullFilePath).endsWith(".js")) {
            var loaded = require(fullFilePath);
            if (loaded && Object.isFunction(loaded)) {
                self.module = loaded(log, validate, config);
            }
        }

        //
        // The name of this task.
        //
        self.name = function () {
            return self.taskName;
        };

        //
        // Full name of the task including parent tasks.
        //
        self.fullName = function () {
            if (parentTask) {
                return parentTask.fullName() + "/" + self.name();
            }
            else {
                return self.name();
            }
        };

        //
        // Add a child task.
        //
        self.addChild = function (childTask) {
            self.children.push(childTask);
            self.childrenMap[childTask.name()] = childTask;
        };

        //
        // Get the names of tasks that a particular task is dependent on.
        //
        self.getDepTaskNames = function () {

            if (!self.module) {
                return [];
            }

            if (!self.module.dependsOn) {
                return [];
            }
            
            var depNames;
            
            if (Object.isFunction(self.module.dependsOn)) {
                depNames = self.module.dependsOn();
            }
            else {
                depNames = self.module.dependsOn;
            }
            
            return depNames;
        };

        //
        // Resolve a single named task.
        //    
        var resolveDep = function (taskName) {
            var resolvedTask = taskMap[taskName];
            if (!resolvedTask) {
                throw new Error("Task not found: " + taskName);
            }

            depsMap[taskName] = resolvedTask;
            
            return resolvedTask;
        };

        //
        // Resolve dependencies for the task.
        //       
        self.resolveDependencies = function () {
            try
            {
                self.dependencies = self.getDepTaskNames().map(resolveDep);
            }
            catch (e)
            {
                log.error('Exception while resolving dependencies for task: ' + self.fullName());
                throw e;
            }
        };

        //
        // Validate the task.
        //
        self.validate = function () {

            var taskName = self.fullName();

            //
            // Run sequential dependencies.
            //
            return E.from(self.dependencies)
                .aggregate(
                    Promise.resolve(), // Starting promise.
                    function (prevPromise, depTask) {
                        return prevPromise
                            .then(function () { 
                                return depTask.validate(); 
                            });
                    }
                )
                .then(function () {
                    if (tasksValidated[taskName]) {
                        // Skip tasks that have already been satisfied.
                        return Promise.resolve();
                    }

                    tasksValidated[taskName] = true; // Make that the task has been invoked.

                    //log.info("Validating " + taskName);

                    if (!self.module) {
                        //log.warn("Task not implemented: " + taskName);
                        return;
                    }
                    else if (!self.module.validate) {
                        return;   
                    }

                    try {                        
                        var resultingPromise = self.module.validate.apply(this);
                        if (resultingPromise) {
                            return resultingPromise.then(function (result) {
                                //log.info("Validated " + taskName);
                                return result;
                            })
                        }
                        else {
                            //log.info("Validated " + taskName);
                        }
                    }
                    catch (e) {
                        log.error("Exception while validating task: " + taskName);
                        throw e;
                    }
                });  
        },
        
        //
        // Invoke the task.
        //
        self.invoke = function () {

            var taskName = self.fullName();

            //
            // Run sequential dependencies.
            //
            return E.from(self.dependencies)
                .aggregate(
                    Promise.resolve(), // Starting promise.
                    function (prevPromise, depTask) {
                        return prevPromise
                            .then(function () { 
                                return depTask.invoke(); 
                            });
                    }
                )
                .then(function () {
                    if (tasksInvoked[taskName]) {
                        // Skip tasks that have already been satisfied.
                        return Promise.resolve();
                    }

                    tasksInvoked[taskName] = true; // Make that the task has been invoked.

                    if (config.get('verbose')) {
                        log.info("Running " + taskName);
                    }

                    if (!self.module) {
                        log.warn("Task not implemented: " + taskName);
                        return;
                    }
                    else if (!self.module.invoke) {
                        return;   
                    }

                    try {
                    var stopWatch = new metrics.Stopwatch();
                    
                    if (config.get('timed')) {
                        stopWatch.start();
                    }

                        var resultingPromise = self.module.invoke.apply(this);
                        if (resultingPromise) {
                            return resultingPromise.then(function (result) {
                                var ouputMessage = taskName;

                                if (config.get('timed')) {
                                    stopWatch.stop();
                                    ouputMessage += ": " + (stopWatch.read() * 0.001).toFixed(2) + " seconds";
                                }

                                if (config.get('verbose')) {
                                    log.info("Completed " + ouputMessage);
                                }
                                else {
                                    log.task(ouputMessage);
                                }
                                return result;
                            })
                        }
                        else {
                            var ouputMessage = taskName;
                        
                            if (config.get('timed')) {
                                stopWatch.stop();
                                ouputMessage += ": " + (stopWatch.read() * 0.001).toFixed(2) + " seconds";
                            }

                            if (config.get('verbose')) {
                                log.info("Completed " + ouputMessage);
                            }
                            else {
                                log.task(ouputMessage);
                            }
                        }
                    }
                    catch (e) {
                        log.error("Exception while invoking task: " + taskName);
                        throw e;
                    }
                });            
        };

        var makeIndent = function (indentLevel) {
            var output = "";
            while (indentLevel-- > 0) {
                output += "#";
            }

            return output;
        };

        self.genTree = function (indentLevel) {
            var output = makeIndent(indentLevel);
            output += self.fullName();
            output += "\n";

            self.dependencies.forEach(function (depTask) {
                output += depTask.genTree(indentLevel+1);
            });

            return output;
        };
    };

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
            var task = new Task(itemName, relativeItemPath, fullItemPath, parentTask);
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