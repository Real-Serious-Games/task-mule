//
// This code orginally from here, but modified to fit my needs.
//
// https://www.npmjs.com/package/promised-exec
//

'use strict';

var spawn = require('child_process').spawn
var Q = require('q');
var assert = require('chai').assert;

module.exports = function (log) {
    return function (command, args, options) {

        assert.isString(command);
        if (args) {
            assert.isArray(args);
        }
        else {
            args = [];
        }
        
        if (options) {
            assert.isObject(options);
        }

        options = options || {};

        log.verbose("Running cmd: " + command + " " + args.join(' '));

        return Q.Promise(function (resolve, reject) {

            var stdout = '';
            var stderr = ''

            var cp = spawn(command, args, options);

            cp.stdout.on('data', function (data) {
                var str = data.toString();
                log.verbose(command + ':out: ' + str);
                stdout += str;
            });

            cp.stderr.on('data', function (data) {
                var str = data.toString();
                log.verbose(command + ':err: ' + str);
                stderr += str;
            });

            cp.on('error', function (err) {
                log.verbose("Command failed: " + err.message);

                reject(err);
            });

            cp.on('exit', function (code) {
                log.verbose('Command exited with code ' + code);

                if (code === 0 || options.dontFailOnError) {
                    resolve({
                        code: code,
                        stdout: stdout,
                        stderr: stderr,                        
                    });
                    return;
                }

                var err = new Error('Command failed with code ' + code);
                err.code = code;
                reject(err);
            });

        });    
    };
};
