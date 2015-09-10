// A common function to confirm that the response sent by the server meets our standards.
"use strict";
var fluid  = fluid || require("infusion");
var jqUnit = jqUnit || require("jqUnit");
var gpii   = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.api.tests");
gpii.ul.api.tests.isSaneResponse = function (response, body, statusCode, expected, comparison) {
    statusCode = statusCode ? statusCode : 200;

    jqUnit.assertEquals("The response should have a reasonable status code", statusCode, response.statusCode);

    jqUnit.assertValue("There should be a body.", body);

    if (expected) {
        var compFn = comparison ? jqUnit[comparison] : jqUnit.assertDeepEq;
        var jsonData = typeof body === "string" ? JSON.parse(body) : body;
        compFn("The response should be as expected...", expected, jsonData);
    }
};