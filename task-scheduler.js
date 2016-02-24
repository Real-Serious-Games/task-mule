'use strict';

var cron = require('cron');
var assert = require('chai').assert;
var conf = require('confucious');

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

			    	if (callbacks.jobStarted) {
			    		callbacks.jobStarted(jobSpec);
			    	}

					taskRunner.runTask(jobSpec.task, conf)
						.then(function () {
							if (callbacks.jobSucceeded) {
								callbacks.jobSucceeded(jobSpec);
							}
							else {
								log.info('Scheduled job completed: ' + jobSpec.name);
							}
						})
			            .catch(function (err) {		                
			            	if (callbacks.jobFailed) {
			            		callbacks.jobFailed(jobSpec, err);
			            	} 
			            	else {
			                	log.error('Scheduled job failed: ' + jobSpec.name);
			                
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