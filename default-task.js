"use strict";

module.exports = function (log, validate) {
    
    return {
        
        description: "<description of your task>",
        
        // Tasks that this one depends on (these tasks will run before this one).
        dependsOn: [], 

        //
        // Validate configuration for the task.
        // Throw an exception to fail the build.
        //
        validate: function (config) {
            //todo:
        },

        //
        // Configure prior to invoke dependencies for this task.
        //
        configure: function (config) {
            //todo:
        },
        
        //
        // Invoke the task. Peform the operations required of the task.
        // Throw an exception to fail the build.
        // Return a promise for async tasks.
        //
        invoke: function (config) {
            //todo:
        },
    };
};