"use strict";

module.exports = function (log, validate) {
    
    return {
        
        description: "<description of your task>",
        
        // Tasks that this one depends on (these tasks will run before this one).
        dependsOn: [
            // ... list of dependencies ...
        ], 

        //
        // Validate configuration for the task.
        // Throw an exception to fail the task.
        //
        validate: function (config) {
            // ... validate input to the task ...
        },

        //
        // Configure prior to invoke dependencies for this task.
        //
        configure: function (config) {
            // ... modify configuration prior to invoking dependencies ...
        },
        
        //
        // Invoke the task. Peform the operations required of the task.
        // Return a promise for async tasks.
        // Throw an exception or return a rejected promise to fail the task.
        //
        invoke: function (config) {
            // ... do the action of the task ...

            // ... return a promise for asynchronous tasks ...
        },
    };
};