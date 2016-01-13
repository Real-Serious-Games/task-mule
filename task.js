var assert = require('chai').assert;
var E = require('linq');
var S = require('string');
var metrics = require('statman');
var Promise = require('promise');
var sugar = require('sugar');
var Q = require('q');
var util = require('util');
var hash = require('./es-hash');

//
// Class that represents a task loaded from a file.
//
function Task(taskName, relativeFilePath, fullFilePath, log, validate, taskRunner) {

    assert.isString(taskName);
    assert.isString(relativeFilePath);
    assert.isString(fullFilePath);
    assert.isFunction(log.info);
    assert.isFunction(log.error);
    assert.isFunction(log.warn);
    assert.isFunction(log.verbose);
    assert.isFunction(log.task);
    assert.isObject(validate);
    assert.isObject(taskRunner);    
    assert.isFunction(taskRunner.getTask);

    var self = this;
    self.taskName = taskName;
    self.relativeFilePath = relativeFilePath;
    self.fullFilePath = fullFilePath;

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
    // Gets the tasks that this task depends on.
    // Returns a promise, just in case the task needs some time to figure out it's dependencies.
    //
    var establishDependencies = function (config) {
        assert.isObject(config);

        if (!self.module) {
            return Promise.resolve([]);
        }

        if (!self.module.dependsOn) {
            return Promise.resolve([]);
        }
        
        var dependencies;
        
        if (Object.isFunction(self.module.dependsOn)) {
            dependencies = self.module.dependsOn(config);
        }
        else {
            dependencies = self.module.dependsOn;
        }

        //
        // Normalize dependencies.
        //
        var normalizeDependencies = function (dependencies) {
            assert.isArray(dependencies);

            // Normalize dependencies.
            return E.from(dependencies)
                .select(function (dependency) {                
                    
                    if (util.isObject(dependency)) {
                        if (!dependency.configure) {
                            // Auto-supply a configure function.
                            dependency.configure = function () {
                                return [];
                            };
                        }
                        return dependency;
                    }
                    else {
                        assert.isString(dependency);

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

        if (util.isFunction(dependencies.then)) {
            // Assume dependencies is a promise.
            return dependencies
                .then(function (deps) {
                    return normalizeDependencies(deps);
                });
        }
        else {
            return Promise.resolve(normalizeDependencies(dependencies));
        }
    };

    //
    // Resolve dependencies for the task.
    //       
    self.resolveDependencies = function (config) {

        assert.isObject(config);
        assert.isObject(taskRunner);
        assert.isFunction(taskRunner.getTask);

        try {
            return establishDependencies(config)
                .then(function (deps) {
                    resolvedDependencies = deps;

                    resolvedDependencies.forEach(function (dependency) {
                            dependency.resolvedTask = taskRunner.getTask(dependency.task);
                        });
                });
        }
        catch (err) {
            log.error('Exception while resolving dependencies for task: ' + self.name() + "\r\n" + err.stack);
            throw err;
        }
    };

    //
    // Validate the task.
    //
    self.validate = function (configOverride, config, tasksValidated) {

        assert.isObject(configOverride);
        assert.isObject(config);
        assert.isObject(tasksValidated);

        var taskName = self.name();
        var taskKey = taskName + '_' + hash(configOverride);
        if (tasksValidated[taskKey]) { //todo: include the hash code here for the task and it's configuration.
            // Skip tasks that have already been satisfied.
            return Promise.resolve();
        }

        config.push(configOverride);

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
                                    return dependency.configure(config);
                                })
                                .then(function (configOverride) { 
                                    assert.isObject(configOverride);

                                    return dependency.resolvedTask.validate(configOverride, config, tasksValidated);
                                });
                        }
                    );
            })
            .then(function () {
                tasksValidated[taskKey] = true; // Make that the task has been invoked.

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
            })
            .then(function () {
                config.pop(); // Restore previous config.
            })
            .catch(function (e) {
                config.pop();  // Restore previous config.
                throw e; // Propagate error.
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
    self.invoke = function (configOverride, config, tasksInvoked) {

        assert.isObject(configOverride);
        assert.isObject(config);
        assert.isObject(tasksInvoked);

        var taskName = self.name();
        var taskKey = taskName + '_' + hash(configOverride);
        if (tasksInvoked[taskKey]) {
            // Skip tasks that have already been satisfied.
            return Promise.resolve();
        }

        config.push(configOverride);

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
                                .then(function (configOverride) { 
                                    assert.isObject(configOverride);

                                    return dependency.resolvedTask.invoke(configOverride, config, tasksInvoked); 
                                });
                        }
                    );
            })
            .then(function () {
                tasksInvoked[taskKey] = true; // Make that the task has been invoked.

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
            })
            .then(function () {
                config.pop(); // Restore previous config.
            })
            .catch(function (e) {
                config.pop();  // Restore previous config.
                throw e; // Propagate error.
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
        output += self.name();
        output += "\n";

        resolvedDependencies.forEach(function (dependency) {
                output += dependency.resolvedTask.genTree(indentLevel+1);
            });

        return output;
    };
};

module.exports = Task;
