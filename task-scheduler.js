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

					taskRunner.runTask(jobSpec.task, conf);	
			    }, 
			    start: true,
			});			
		});
	};
};

module.exports = TaskScheduler;