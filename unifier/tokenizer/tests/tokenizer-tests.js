// Tests for the "unifier", which detects similarities between records.
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.unifier.scorer.tests";
var tokenizerTests = fluid.registerNamespace(namespace);

var loader = require("../../../config/lib/config-loader");
tokenizerTests.config = loader.loadConfig({});

var tokenizer = require("../../tokenizer")(tokenizerTests.config);

tokenizerTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Tokenizer tests...");

    jqUnit.test("Test basic tokenizing...", function() {
        var string = "one two three";
        var set = tokenizer.tokenize(string);

        jqUnit.assertDeepEq("The tokenized set should contain three items...", ["one","two","three"], set);
    });

    jqUnit.test("Test whitespace tokenizing...", function() {
        var string = " one   two three ";
        var set = tokenizer.tokenize(string);

        jqUnit.assertDeepEq("The tokenized set should contain three items...", ["one","two","three"], set);
    });

    jqUnit.test("Test object...", function() {
        var object = { "foo": "bar" };
        var set = tokenizer.tokenize(object);

        jqUnit.assertDeepEq("There should be no tokens returned for an object...", [], set);
    });

    jqUnit.test("Test undefined...", function() {
        var empty = undefined;
        var set = tokenizer.tokenize(undefined);

        jqUnit.assertDeepEq("There should be no tokens returned for an object...", [], set);
    });
};

tokenizerTests.runTests();