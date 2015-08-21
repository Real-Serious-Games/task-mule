"use strict";

module.exports = function (log, validate) {
    
    return {
        
        description: "<description of your task>",
        
        // Tasks that this one depends on (these tasks will run before this one).
        dependsOn: [
            "test1",
            "test2",
        ], 

        //
        // Validate configuration for the task.
        // Throw an exception to fail the build.
        //
        validate: function (config) {
            console.log('Validate test3');
        },
        
        //
        // Invoke the task. Peform the operations required of the task.
        // Throw an exception to fail the build.
        // Return a promise for async tasks.
        //
        invoke: function (config) {
            console.log('Invoke test3');

            console.log('foo: ' + config.get('foo'));
        },
    };
};