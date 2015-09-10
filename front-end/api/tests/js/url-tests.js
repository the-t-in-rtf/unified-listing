"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../lib/url");

var jqUnit = require("jqUnit");

fluid.registerNamespace("gpii.ul.api.tests.url");

gpii.ul.api.tests.url.runAllTests = function (that) {
    jqUnit.module("Testing URL assembly function...");

    fluid.each(that.options.tests, function (testDef) {
        gpii.ul.api.tests.url.runSingleTest(testDef.message, testDef.segments, testDef.expected);
    });
};

gpii.ul.api.tests.url.runSingleTest = function (message, segments, expected) {
    var output = gpii.ul.api.url.assembleUrl.apply(null, segments);
    jqUnit.test(message, function () {
        jqUnit.assertEquals("The output should be as expected...", expected, output);
    });
};

fluid.defaults("gpii.ul.api.tests.url", {
    gradeNames: ["fluid.component"],
    tests: {
        hostAndPath: {
            message: "A URL and an absolute path segment should resolve correctly...",
            segments: ["http://test.com/other", "/root"],
            expected: "http://test.com/root"

        },
        relative: {
            message: "A URL and a single relative path segment should resolve correctly...",
            segments: ["http://test.com/root/subdir1", "subdir2"],
            expected: "http://test.com/root/subdir2"
        },
        noLeader: {
            message: "A URL with no host or protocol should resolve correctly...",
            segments: ["root", "otherRoot"],
            expected: "otherRoot"
        },
        urlEncoded: {
            message: "URL encoded content should resolve correctly...",
            segments: ["http://test.com", "this%2Fthat"],
            expected: "http://test.com/this%2Fthat"
        },
        dotNotation: {
            message: "`.` and `..` as directory placeholders should resolve correctly...",
            segments: ["http://test.com/root/subdir", "../otherRoot/otherSubdir", "./yetAnotherSubdir"],
            expected: "http://test.com/otherRoot/yetAnotherSubdir"
        }
    },
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.ul.api.tests.url.runAllTests",
            args:     ["{that}"]
        }
    }
});

gpii.ul.api.tests.url();