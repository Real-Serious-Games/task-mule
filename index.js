'use strict';

module.exports = function (config) {
	
	var buildFilePath = __dirname + "/build.js";
	console.log(buildFilePath);
	var result = require(buildFilePath)({}, {}, {});
	console.log(result.test);
};

