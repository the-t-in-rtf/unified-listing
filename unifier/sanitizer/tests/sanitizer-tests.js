// Tests for the "unifier", which detects similarities between records.
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.unifier.sanitizer.tests";
var sanitizerTests = fluid.registerNamespace(namespace);

var loader = require("../../../config/lib/config-loader");
sanitizerTests.config = loader.loadConfig({});

var sanitizer = require("../../sanitizer")(sanitizerTests.config);

sanitizerTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Sanitizer tests...");

    // TODO:  test sanitizer.stripStopWords(array, stopWordSets)
    jqUnit.test("Test stripping stop words from an array...", function() {
        var raw = ["gmbh", "and", "pro"];

        var clean = sanitizer.stripStopWords(raw);
        jqUnit.assertDeepNeq("If we are using stop word sets, the results should not be equal to the original...", raw, clean);

        jqUnit.assertEquals("There should be nothing left after all the stop words are removed...", 0, clean.length);

        var unclean = sanitizer.stripStopWords(raw, []);
        jqUnit.assertDeepEq("If we don't pick any stop word sets, the results should be equal to the original...", raw, unclean);
    });

    // TODO: test sanitizer.stripArray(array, stripWords) {
    jqUnit.test("Test stripping words from array...", function() {
        var raw = ["this","really","works"];
        var toStrip = ["works", "really"];

        var stripped = sanitizer.stripArray(raw, toStrip);
        jqUnit.assertDeepEq("There should be only one element left after the stripping...", ["this"], stripped);
    });

    // TODO: test sanitizer.toLowerCase(array) {
    jqUnit.test("Test converting an array to lower case...", function() {
        var raw = ["ALPHA","Bravo","ChArLiE"];
        var lc  = sanitizer.toLowerCase(raw);
        jqUnit.assertDeepEq("The array should end up being lower case...", ["alpha","bravo","charlie"], lc);
    });


    // TODO:  test sanitizer.stripDuplicates(array)
    jqUnit.test("Test stripping of array duplicates...", function() {
        var duped = ["this","this","this"];
        var deduped = sanitizer.stripDuplicates(duped);

        jqUnit.assertEquals("There should only be one non-duplicate...", 1, deduped.length);
    });
};

sanitizerTests.runTests();