// A set of additional transforms to assist in migrating data.
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.imports.transforms");

// TODO:  If I uncomment this, the function is run with the options instead of the value.  Talk with Antranig.
//fluid.defaults("gpii.ul.imports.transforms.toLowerCase", {
//    gradeNames: "fluid.standardOutputTransformFunction"
//});

gpii.ul.imports.transforms.toLowerCase = function (rawValue) {
    return (typeof rawValue === "string") ? rawValue.toLowerCase() : rawValue;
};

// TODO:  If I uncomment this, the function is run with the options instead of the value.  Talk with Antranig.
//fluid.defaults("gpii.ul.imports.transforms.trim", {
//    gradeNames: "fluid.standardOutputTransformFunction"
//});

gpii.ul.imports.transforms.trim = function (rawValue) {
    return (typeof rawValue === "string") ? rawValue.trim() : rawValue;
};

// TODO:  If I uncomment this, the function is run with the options instead of the value.  Talk with Antranig.
//fluid.defaults("gpii.ul.imports.transforms.dateToISOString", {
//    gradeNames: "fluid.standardOutputTransformFunction"
//});

// An transformation function to remap shorter date strings to ISO 8601 values
gpii.ul.imports.transforms.dateToISOString = function(rawValue) {
    var date = new Date(rawValue);
    return (!isNaN(date.getTime())) ? date.toISOString() : rawValue;
};

// TODO:  If I uncomment this, the function is run with the options instead of the value.  Talk with Antranig.
//fluid.defaults("gpii.ul.imports.transforms.extractSemver", {
//    gradeNames: "fluid.standardOutputTransformFunction"
//});

// A transformer to extract a semver where available.  Used with version strings in other formats.
gpii.ul.imports.transforms.extractSemver = function (string) {
    var regexp = new RegExp("([0-9]+(\\.[0-9]+){0,2})");
    var matches = string.match(regexp);

    // If we found a match, return it.  Otherwise, return the original string.
    return matches ? matches[0] : string;
};
