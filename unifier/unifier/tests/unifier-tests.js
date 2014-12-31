// Tests for the parts of the "unifier" not covered in other tests (grouper, etc.)
"use strict";
var fluid           = require("infusion");
var namespace       = "gpii.ul.unifier.tests";
var unifierTests    = fluid.registerNamespace(namespace);

var loader          = require("../../../config/lib/config-loader");
unifierTests.config = loader.loadConfig({});

var unifier         = require("../../unifier")(unifierTests.config);

unifierTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Unifier tests...");

    jqUnit.test("Test pulling the unified ID from a cluster of records with one member...", function() {
        var cluster = [{"source": "unified", "uid": "foo"}];
        var uid = unifier.getUnifiedId(cluster);
        jqUnit.assertEquals("The UID should be detected...", "foo", uid);
    });

    jqUnit.test("Test pulling the unified ID from a cluster of records with many members...", function() {
        var cluster = [{},{},{},{"source": "unified", "uid": "foo"}];
        var uid = unifier.getUnifiedId(cluster);
        jqUnit.assertEquals("The UID should be detected...", "foo", uid);
    });

    jqUnit.test("Test pulling the unified ID from a cluster of records with no UIDs...", function() {
        var cluster = [{},{},{},{}];
        var uid = unifier.getUnifiedId(cluster);
        jqUnit.assertNull("The UID should be null...", uid);
    });

    jqUnit.test("Test getting the date of last update (strings)...", function() {
        var cluster = [{"updated": "2014-12-26T15:55:29.057Z"}, {"updated": "2014-12-29T15:55:29.057Z"}, {"updated": "2014-12-28T15:55:29.057Z"}];
        var updated = unifier.getDateLastUpdated(cluster);

        jqUnit.assertDeepEq("The most recent update should be detected...", new Date("2014-12-29T15:55:29.057Z"), updated);
    });

    jqUnit.test("Test getting the date of last update (dates)...", function() {
        var cluster = [{"updated": new Date("2014-12-26T15:55:29.057Z")}, {"updated": new Date("2014-12-29T15:55:29.057Z")}, {"updated": new Date("2014-12-28T15:55:29.057Z")}];
        var updated = unifier.getDateLastUpdated(cluster);

        jqUnit.assertDeepEq("The most recent update should be detected...", new Date("2014-12-29T15:55:29.057Z"), updated);
    });

    jqUnit.test("Test getting the date of first update (strings)...", function() {
        var cluster = [{"updated": "2014-12-26T15:55:29.057Z"}, {"updated": "2014-12-29T15:55:29.057Z"}, {"updated": "2014-12-28T15:55:29.057Z"}];
        var updated = unifier.getDateFirstUpdated(cluster);

        jqUnit.assertDeepEq("The least recent update should be detected...", new Date("2014-12-26T15:55:29.057Z"), updated);
    });

    jqUnit.test("Test getting the date of first update (dates)...", function() {
        var cluster = [{"updated": new Date("2014-12-26T15:55:29.057Z")}, {"updated": new Date("2014-12-29T15:55:29.057Z")}, {"updated": new Date("2014-12-28T15:55:29.057Z")}];
        var updated = unifier.getDateFirstUpdated(cluster);

        jqUnit.assertDeepEq("The least recent update should be detected...", new Date("2014-12-26T15:55:29.057Z"), updated);
    });
};

unifierTests.runTests();