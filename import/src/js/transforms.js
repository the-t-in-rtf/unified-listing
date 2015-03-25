// A set of additional transforms to assist in migrating data.
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.imports.transforms");

// These functions have no configuration available, so we are fine with the implied `fluid.standardTransformFunction` grade

gpii.ul.imports.transforms.toLowerCase = function (rawValue) {
    return (typeof rawValue === "string") ? rawValue.toLowerCase() : rawValue;
};

gpii.ul.imports.transforms.trim = function (rawValue) {
    return (typeof rawValue === "string") ? rawValue.trim() : rawValue;
};

// An transformation function to remap shorter date strings to ISO 8601 values
gpii.ul.imports.transforms.dateToISOString = function(rawValue) {
    var date = new Date(rawValue);
    return (!isNaN(date.getTime())) ? date.toISOString() : rawValue;
};

// A generic transformer to extract matches for a given regexp.  Expects to be configured with `options.regexp`
fluid.registerNamespace("gpii.ul.imports.transforms.regexp");

gpii.ul.imports.transforms.regexp = function (value, transformSpec) {
    if (!transformSpec.regexp) {
        fluid.fail("You must pass a regexp option to use the regexp transformer");
    }

    var regexp = new RegExp(transformSpec.regexp);
    if (value) {
        var matches = value.match(regexp);

        if (matches) {
            // Returns the first (greediest) match
            return matches[0];
        }
    }

    // If we find no matches, return the original content
    return value;
};