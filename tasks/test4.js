"use strict";

module.exports = function (log, validate) {
    
    return {
        
        description: "<description of your task>",
        
        dependsOn: [
            "test2", 
            {
                task: "test3",
                configure: function (config) {
                    return {
                        foo: 'bar',
                    };
                },
            },
            {
                task: "test3",
                configure: function (config) {
                    return {
                        foo: 5,
                    };
                },
            },            
        ], 

        //
        // Validate configuration for the task.
        // Throw an exception to fail the build.
        //
        validate: function (config) {
            console.log('Validate test4');
        },
        
        //
        // Invoke the task. Peform the operations required of the task.
        // Throw an exception to fail the build.
        // Return a promise for async tasks.
        //
        invoke: function (config) {
            console.log('Invoke test4');
        },
    };
};