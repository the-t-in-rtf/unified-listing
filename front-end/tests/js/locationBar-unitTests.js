// Unit tests for the static functions included with the `gpii.locationBar` component.
//
// For tests of the full component, see the `zombie` directory.
//
"use strict";
var fluid  = fluid || require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

require("../../public/js/components/locationBar");

jqUnit.module("Unit tests for gpii.locationBar static components...");

// Tests for jsonToQuery
jqUnit.test("Testing `jsonToQuery` and `queryToJson` static functions...", function() {
    // String data
    var stringData        = "simple test";
    var stringObject      = { myString: stringData };
    var stringQueryString = gpii.locationBar.jsonToQuery(stringObject);
    jqUnit.assertEquals("A string should be correctly encoded...", "myString=simple%20test", stringQueryString);

    var parsedStringData = gpii.locationBar.queryToJson(stringQueryString);
    jqUnit.assertDeepEq("The reconstituted string data should be the same as the original...", stringObject, parsedStringData);

    // Array data
    var arrayData        =  ["one potato", "two potatoes"];
    var arrayObject      = {myArray: arrayData};
    var arrayQueryString = gpii.locationBar.jsonToQuery(arrayObject);
    var parsedArrayData  = gpii.locationBar.queryToJson(arrayQueryString);
    jqUnit.assertDeepEq("The reconstituted array data should be the same as the original...", arrayObject, parsedArrayData);

    // Object data
    var objectData        = { foo: { bar: "baz" } };
    var objectObject      = {myObject: objectData};
    var objectQueryString = gpii.locationBar.jsonToQuery(objectObject);
    var parsedObjectData  = gpii.locationBar.queryToJson(objectQueryString);

    jqUnit.assertDeepEq("The reconstituted object data should be the same as the original...", objectObject, parsedObjectData);

    // Mixed data with all types
    var mixedData = {
        myString: stringData,
        myArray:  arrayData,
        myObject: objectData
    };
    var mixedQueryString = gpii.locationBar.jsonToQuery(mixedData);
    var parsedMixedData  = gpii.locationBar.queryToJson(mixedQueryString);

    jqUnit.assertDeepEq("The reconstituted mixed data should be the same as the original...", mixedData, parsedMixedData);

    var withQuestion          = "?foo=bar";
    var parsedWithQuestion    = gpii.locationBar.queryToJson(withQuestion);
    var withoutQuestion       = "foo=bar";
    var parsedWithoutQuestion = gpii.locationBar.queryToJson(withoutQuestion);
    jqUnit.assertDeepEq("A query string should be parsed the same whether or not it has a question mark...", parsedWithQuestion, parsedWithoutQuestion);
});


