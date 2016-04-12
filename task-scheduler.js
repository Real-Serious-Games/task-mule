'use strict';

var cron = require('cron');
var assert = require('chai').assert;
var conf = require('confucious');
var Stopwatch = require('statman-stopwatch');

var TaskScheduler = function (taskRunner, config, log) {
	
	var self = this;

	assert.isObject(taskRunner);
	assert.isObject(config);
	assert.isFunction(log.info);
	assert.isFunction(log.error);
	assert.isFunction(log.warn);

	self.start = function (schedule, callbacks) {

		assert.isObject(schedule);

		callbacks = callbacks || {};

		log.info('Starting task scheduler:');

		schedule.jobs.forEach(function (jobSpec) {
			
			assert.isString(jobSpec.name, "Expected 'jobSpec' to have a name field.");

			log.info("\t" + jobSpec.name + " - " + jobSpec.cron);

			var cronJob = new cron.CronJob({
			    cronTime: jobSpec.cron,
			    onTick: function() { 

			    	log.info("Running job " + jobSpec.name + " at " + (new Date()));

					var stopwatch = new Stopwatch();
					stopwatch.start();

			    	if (callbacks.taskStarted) {
			    		callbacks.taskStarted(jobSpec);
			    	}

					taskRunner.runTask(jobSpec.task, conf)
						.then(function () {
							stopwatch.stop();
							var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 

							if (callbacks.taskSuccess) {
								callbacks.taskSuccess(jobSpec, elapsedTimeMins);
							}
							else {
								log.info('Scheduled job "' + jobSpec.name + '" completed in ' + elapsedTimeMins + ' minutes.');
							}
						})
			            .catch(function (err) {		                
							stopwatch.stop();
							var elapsedTimeMins = stopwatch.read()/1000.0/60.0; 

			            	if (callbacks.taskFailure) {
			            		callbacks.taskFailure(jobSpec, elapsedTimeMins, err);
			            	} 
			            	else {
			                	log.error('Scheduled job "' + jobSpec.name + '"" failed after ' + elapsedTimeMins + ' minutes.');
			                
				                if (err.message) {
				                    log.warn(err.message);
				                }

				                if (err.stack) {
				                    log.warn(err.stack);
				                }
				                else {
				                    log.warn('no stack');
				                }					            		
			                }
			            })
				        .done();			    	
			    }, 
			    start: true,
			});			
		});
	};
};

module.exports = TaskScheduler;