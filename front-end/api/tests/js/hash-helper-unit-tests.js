// Tests for the "hash helper"...
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("jqUnit");

// The code we are testing
require("../../lib/hash-helper");

jqUnit.module("Testing hash helper function(s)...");

jqUnit.test("Testing filtering using a single key...", function () {
    var original = { foo: "bar", baz: "qux"};
    var expected = { foo: "bar"};

    var filtered = gpii.ul.api.helpers.hash.omit(original, "baz");

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});

jqUnit.test("Testing filtering using multiple keys (as individual arguments)...", function () {
    var original = { foo: "bar", baz: "qux", quux: "corge"};
    var expected = { foo: "bar"};

    var filtered = gpii.ul.api.helpers.hash.omit(original, "quux", "baz");

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});

jqUnit.test("Testing filtering using multiple keys (as an array)...", function () {
    var original = { foo: "bar", baz: "qux", quux: "corge"};
    var expected = { foo: "bar"};

    var filtered = gpii.ul.api.helpers.hash.omit(original, ["quux", "baz"]);

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});

jqUnit.test("Testing filtering with a key that doesn't exist in the map...", function(){
    var original = { foo: "bar", baz: "qux"};
    var filtered = gpii.ul.api.helpers.hash.omit(original, "nonexistant");


    jqUnit.assertDeepEq("The results should not have been filtered at all...", original, filtered);
});

jqUnit.test("Testing filtering an array of objects...", function(){
    var original = [{ foo: "bar", baz: "qux"}, { foo: "oof", baz: "zab"}];
    var expected = [{foo: "bar"}, {foo: "oof"}];

    var filtered = gpii.ul.api.helpers.hash.omitFromObject(original, ["baz"]);

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});

jqUnit.test("Testing deep filtering an object...", function(){
    var original = { foo: "bar", baz: "qux", quux: [{ baz: "zab", corge: "egroc", second: "choice"}, {baz: "bazman", lur: "lurman", second: "cousin"}]};
    var expected = {foo: "bar", quux: [{ corge: "egroc"}, { lur: "lurman"}]};

    var filtered = gpii.ul.api.helpers.hash.omitFromObject(original, ["baz", "second"], true);

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});

jqUnit.test("Testing deep filtering an array of objects...", function(){
    var original = [{ good: "one", bad: "one"}, { good: "two", sub: { good: "three", bad: "two"}}, {good: "four", array: [ { good: "five", bad: "three"}, { good: "six", bad: "four"}]}];
    var expected = [{good: "one"}, { good: "two", sub: { good: "three"}}, {good: "four", array: [{ good: "five"}, { good: "six"}]}];
    var filtered = gpii.ul.api.helpers.hash.omitFromObject(original, ["bad"], true);

    jqUnit.assertDeepEq("The results should have been filtered as expected...", expected, filtered);
});
