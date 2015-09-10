// Launch the test harness as a standalone server to assist in browser debugging.
var fluid = fluid || require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("./test-harness");

gpii.ul.api.tests.harness({
    "expressPort": 6914,
    "pouchPort":   6915
});