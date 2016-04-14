'use strict';

var fs = require('fs');
var path = require('path');

//
// Helpers for validation.
//
module.exports = {
    config: function (config, name) {
        var value = config.get(name);
        if (!value) {
            throw new Error('Configuration option not set: ' + name);
        }
        return value;
    },

    directoryExists: function (path) {
        if (!fs.existsSync(path)) {
            throw new Error('Path not found: ' + path);
        }

        var stat = fs.lstatSync(path);
        if (!stat.isDirectory()) {
            throw new Error('Path is not a directory: ' + path);	
        }
    },

    fileExists: function (path) {
        if (!fs.existsSync(path)) {
            throw new Error('Path not found: ' + path);
        }

        var stat = fs.lstatSync(path);
        if (stat.isDirectory()) {
            throw new Error('Path is a directory: ' + path);	
        }
    },
};
