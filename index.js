'use strict';

module.exports = function (config) {

	var buildFilePath = path.join(process.cwd(), "build.js");
	console.log(buildFilePath);
	
	var result = require(buildFilePath)({}, {}, {});
	console.log(result.test);
};

