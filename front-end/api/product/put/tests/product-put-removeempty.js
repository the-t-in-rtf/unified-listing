// Unit tests for the function that removes empty entries (`null` or `undefined`).
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

// TODO: Update this once the refactor of the PUT api is complete
var loader = require("../../../../../config/lib/config-loader");
var config = loader.loadConfig(require("../../../../../config/test-pouch.json"));

require("../index.js")(config);

jqUnit.test("An object with no empty entries should be preserved...", function() {
    var start    = { foo: "bar", baz: { qux: "quux"} };

    // We make a copy to ensure that the array has not been mangled (which we will test later).
    var expected = fluid.copy(start);

    var stripped = gpii.ul.product.put.removeEmptyEntries(start);

    jqUnit.assertDeepEq("The stripped object should still contain all entries...", expected, stripped);
});

jqUnit.test("An object with empty entries should be stripped...", function() {
    var start    = { foo: "bar", bar: null, baz: { qux: "quux", quux: null} };
    var copy     = fluid.copy(start);
    var expected = { foo: "bar", baz: { qux: "quux"} };

    var stripped = gpii.ul.product.put.removeEmptyEntries(start);

    jqUnit.assertDeepEq("The stripped object should still match the expected results...", expected, stripped);

    jqUnit.assertDeepEq("The original object should not have been modified...", copy, start);
});