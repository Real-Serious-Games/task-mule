//
// Modified version of es-hash.
// https://www.npmjs.com/package/es-hash
// https://bitbucket.org/tehrengruber/es-js-hash
// 
// The original code destroys the input object. This updated version preserves it.
//

var extend = require('extend');

// <platform.node>
var crypto = function (algorithm, data) {
    return require('crypto').createHash(algorithm).update(data).digest("hex");
};
// <platform.node>

var algorithms = {
    djb2: function (str) {
        var hash = 5381,
            char;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
        }
        return hash;
    },
    sdbm: function(str){
        var hash = 0;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = char + (hash << 6) + (hash << 16) - hash;
        }
        return hash;
    },
    javaHashCode: function(str){
        var hash = 0,
            char;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    },
    crc32: function (str) {
        //str = String(s);
        var c=0, i=0, j=0;
        var polynomial = arguments.length < 2 ? 0x04C11DB7 : arguments[1],
            initialValue = arguments.length < 3 ? 0xFFFFFFFF : arguments[2],
            finalXORValue = arguments.length < 4 ? 0xFFFFFFFF : arguments[3],
            crc = initialValue,
            table = [], i, j, c;

        function reverse(x, n) {
            var b = 0;
            while (n) {
                b = b * 2 + x % 2;
                x /= 2;
                x -= x % 1;
                n--;
            }
            return b;
        }

        var range = 255, c=0;
        for (i = 0; i < str.length; i++){
            c = str.charCodeAt(i);
            if(c>range){ range=c; }
        }

        for (i = range; i >= 0; i--) {
            c = reverse(i, 32);

            for (j = 0; j < 8; j++) {
                c = ((c * 2) ^ (((c >>> 31) % 2) * polynomial)) >>> 0;
            }

            table[i] = reverse(c, 32);
        }

        for (i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            if (c > range) {
                throw new RangeError();
            }
            j = (crc % 256) ^ c;
            crc = ((crc / 256) ^ table[j]) >>> 0;
        }

        return (crc ^ finalXORValue) >>> 0;
    },
    // <platform.node>
    sha1: function (str) {
        return crypto('sha1', str);
    },
    md5: function (str) {
        return crypto('md5', str);
    },
    sha256: function (str) {
        return crypto('sha256', str);
    },
    sha512: function (str) {
        return crypto('sha512', str);
    },
    ripemd160: function (str) {
        return crypto('ripemd160', str);
    }
    // <platform.node>
};

// @exports
module.exports = function (object, algorithm, sort) {
    var hashs = [];

    for (var key in object) {
        var value = object[key];

        // Hash objects recursiv
        if (typeof(value) == "object") {
            value = module.exports(value);
        }

        // Add hash
        hashs.push(key + value + key.length + (typeof(value) == "string" ? value.length : 0));
    }

    // Sort hash by keys
    if (typeof(sort) == "undefined" || !sort)
        hashs.sort();

    // Parse algorithm
    if (typeof(algorithm) == "undefined")
        algorithm = 'djb2';

    // Test that algorithm is defined
    // <debug>
    if (typeof(algorithms[algorithm]) == "undefined") {
        throw "Undefined algorithm " + algorithm;
    }
    // </debug>

    return algorithms[algorithm](hashs.join('|'));
};