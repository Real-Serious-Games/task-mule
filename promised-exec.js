//
// This code orginally from here, but modified to fit my needs.
//
// https://www.npmjs.com/package/promised-exec
//

'use strict';

var exec, getBufferContents;

exec = require('child_process').exec;

module.exports = function (command, options) {

    function ExecError(message, stdout, stderr, code, origError) {
        this.name = "ExecError";
        this.message = (message || "");
        this.stdout = stdout;
        this.stderr = stderr;
        this.code = code;
        this.origError = origError;
    }
    ExecError.prototype = Error.prototype;

    var q, deferred;

    q = require('q');

    if (!command || typeof command !== 'string') {
        throw {
            message: 'Command must be a string.'
        };
    }

    deferred = q.defer();

    var child = exec(command, options || {}, function (error, stdout, stderr) {

        if (error) {
            return deferred.reject(new ExecError('Error running cmd ' + command, stdout, stderr, error.code, error));
        }

        deferred.resolve({
            stdout: stdout.toString('utf8'),
            stderr: stderr.toString('utf8')
        });
    });

    if (child && options && options.stdin) {
        child.stdin.write(options.stdin, 'utf8');
        child.stdin.end();
    }

    return deferred.promise;

};

