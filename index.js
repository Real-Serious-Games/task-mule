'use strict';

module.exports = function (config) {
	
	var result = require("./build.js")({}, {}, {});
	console.log(result.test);
};

