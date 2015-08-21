var assert = require('chai').assert;
var E = require('linq');
var S = require('string');
var metrics = require('statman');
var Promise = require('promise');
var sugar = require('sugar');
var Q = require('q');
var util = require('util');

//
// Strips an extension from a filename.
//
var stripExt = function (fileName) {
    assert.isString(fileName);

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
function Task(fileName, relativeFilePath, fullFilePath, parentTask, log, validate, taskRunner) {

    assert.isString(fileName);
    assert.isString(relativeFilePath);
    assert.isString(fullFilePath);
    if (parentTask) {
        assert.isObject(parentTask);
    }
    assert.isObject(log);
    assert.isObject(validate);
    assert.isObject(taskRunner);    
    assert.isFunction(taskRunner.getTask);

    var self = this;
    self.fileName = fileName;
    self.relativeFilePath = relativeFilePath;
    self.fullFilePath = fullFilePath;

    self.taskName = stripExt(fileName);
    self.children = [];
    self.childrenMap = {};
    var resolvedDependencies = [];

    if (S(fullFilePath).endsWith(".js")) {
        var moduleLoadFunction = require(fullFilePath);
        if (!moduleLoadFunction || 
            !Object.isFunction(moduleLoadFunction)) {

            throw new Error('Task module ' + fullFilePath + ' should export a function.');
        }
        else {
            self.module = moduleLoadFunction(log, validate, taskRunner);
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
        assert.isObject(childTask);

        self.children.push(childTask);
        self.childrenMap[childTask.name()] = childTask;
    };

    //
    // Gets the tasks that this task depends on.
    //
    var establishDependencies = function (config) {
        assert.isObject(config);

        if (!self.module) {
            return [];
        }

        if (!self.module.dependsOn) {
            return [];
        }
        
        var dependencies;
        
        if (Object.isFunction(self.module.dependsOn)) {
            dependencies = self.module.dependsOn(config);
        }
        else {
            dependencies = self.module.dependsOn;
        }

        // Normalize dependencies.
        return E.from(dependencies)
            .select(function (dependency) {                
                
                if (util.isObject) {
                    if (!dependency.configure) {
                        // Auto-supply a configure function.
                        dependency.configure = function () {
                            return [];
                        };
                    }
                    return dependency;
                }
                else {
                    return { 
                        task: dependency,
                        configure: function () {
                            return {}; // No effect.
                        },
                    };
                }
            })
            .toArray();
    };

    //
    // Resolve dependencies for the task.
    //       
    self.resolveDependencies = function (config) {

        assert.isObject(config);
        assert.isObject(taskRunner);
        assert.isFunction(taskRunner.getTask);

        try {
            resolvedDependencies = establishDependencies(config);
            resolvedDependencies.forEach(function (dependency) {
                    dependency.task = taskRunner.getTask(dependency.task);
                });
        }
        catch (e) {
            log.error('Exception while resolving dependencies for task: ' + self.fullName());
            throw e;
        }
    };

    //
    // Validate the task.
    //
    self.validate = function (config, tasksValidated) {

        assert.isObject(config);
        assert.isObject(tasksValidated);

        var taskName = self.fullName();

        //
        // Run sequential dependencies.
        //
        return self.configure(config) //todo: rename this to 'setup', but probably will want a cleanup as well!!
            .then(function () {
                return E.from(resolvedDependencies)
                    .aggregate(
                        Promise.resolve(), // Starting promise.
                        function (prevPromise, dependency) {
                            return prevPromise
                                .then(function () {
                                    return dependency.configure(config); //todo: this must be able to return a promise, this changes things!!!
                                })
                                .then(function () { 
                                    return dependency.task.validate(config, tasksValidated);  //todo: define task-specific configuration before validation.
                                });
                        }
                    );
            })
            .then(function () {
                if (tasksValidated[taskName]) { //todo: include the hash code here for the task and it's configuration.
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
                    var resultingPromise = self.module.validate.apply(this, [config]);
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
    };

    //
    // Configure the task.
    //
    self.configure = function (config) {

        assert.isObject(config);

        if (self.module.configure) {
            var promise = self.module.configure.apply(this, [config])
            if (promise) {
                return promise;
            }
        }

        return Q();
    };

    //
    // Invoke the task.
    //
    self.invoke = function (config, tasksInvoked) {

        assert.isObject(config);
        assert.isObject(tasksInvoked);

        var taskName = self.fullName();

        //
        // Run sequential dependencies.
        //
        return self.configure(config) //todo: rename this to 'setup'
            .then(function () {
                return E.from(resolvedDependencies)
                    .aggregate(
                        Promise.resolve(), // Starting promise.
                        function (prevPromise, dependency) {
                            return prevPromise
                                .then(function () { 
                                    return dependency.configure(config); 
                                })
                                .then(function () { 
                                    return dependency.task.invoke(config, tasksInvoked); 
                                });
                        }
                    );
            })
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

                    var resultingPromise = self.module.invoke.apply(this, [config]);
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

        resolvedDependencies.forEach(function (dependency) {
                output += dependency.task.genTree(indentLevel+1);
            });

        return output;
    };
};

module.exports = Task;
