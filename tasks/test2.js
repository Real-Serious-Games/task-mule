"use strict";

module.exports = function (log, validate) {
    
    return {
        
        description: "test2",
        
        // Tasks that this one depends on (these tasks will run before this one).
        dependsOn: [
            {
                task: 'test1',
                configure: function (config) {
                    console.log("Configuring for dependency test1");
                    return {};
                },
            },
        ], 

        //
        // Validate configuration for the task.
        // Throw an exception to fail the build.
        //
        validate: function (config) {
            console.log('Validate test2');
        },
        
        //
        // Invoke the task. Peform the operations required of the task.
        // Throw an exception to fail the build.
        // Return a promise for async tasks.
        //
        invoke: function (config) {
            console.log('Invoke test2');
        },
    };
};