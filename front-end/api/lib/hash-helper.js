// Library to add convenience functions when working with hashes.
"use strict";

var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.api.helpers.hash");

var _ = require("underscore-node");

// A wrapper for underscore's `omit` function, and supports the same syntax, as in:
//
// gpii.ul.helpers.hash.omit(map, key1, key2);
//
// This would return a copy of map without any values for `key1` or `key2`.
//
// As with underscore's `omit` function, array notation is also supported, as in:
//
// gpii.ul.helpers.hash.omit(map, [key1, key2]);
//
// This allows easier usage within invokers, as you are not required to pass a variable list of arguments.
gpii.ul.api.helpers.hash.omit = function () {
    return _.omit.apply(this, arguments);
};

// A convenience function to filter a whole array or object at once.  Unlike `gpii.ul.api.helpers.hash.omit` above, this only
// supports an array of exclusions, so that we can add a final argument to control whether this is a "deep" scrub.
//
// If the third argument is passed, any child objects will also be scrubbed.
gpii.ul.api.helpers.hash.omitFromObject = function (original, exclusions, deep) {
    if (deep) {
        if (typeof original === "object") {
            if (Array.isArray(original)) {
                return original.map(function (value) {
                    return gpii.ul.api.helpers.hash.omitFromObject(value, exclusions, deep);
                });
            }
            else {
                var scrubbedObject = {};
                Object.keys(original).forEach(function (key) {
                    if (exclusions.indexOf(key) === -1) {
                        scrubbedObject[key] = gpii.ul.api.helpers.hash.omitFromObject(original[key], exclusions, deep);
                    }
                });
                return scrubbedObject;
            }
        }
        else {
            return original;
        }
    } else {
        var scrubbedArray = original.map(function (value) {
            return gpii.ul.api.helpers.hash.omit(value, exclusions);
        });
        return scrubbedArray;
    }
};

