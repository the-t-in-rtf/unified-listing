// Tests for the "grouper", which builds clusters based on similarity data
"use strict";
var fluid           = require("infusion");
var namespace       = "gpii.ul.unifier.grouper.tests";
var grouperTests    = fluid.registerNamespace(namespace);

var loader          = require("../../../config/lib/config-loader");
grouperTests.config = loader.loadConfig({});

var grouper         = require("../../grouper")(grouperTests.config);

grouperTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Grouping tests...");

    jqUnit.test("Test generating cluster sets from sample data...", function() {
        var allIds         = ["a", "b", "c", "d"];
        var similarityData = {"a;b": 0.75, "b;c": 0.75, "c;d": 0.25};

        var cluster1 = grouper.groupBySimilarityThreshold(allIds, similarityData, 0.5);
        jqUnit.assertDeepEq("The clustered results should contain one three node cluster and one singleton...", [["a","b","c"],["d"]], cluster1);

        var cluster2 = grouper.groupBySimilarityThreshold(allIds, similarityData, 0.8);
        jqUnit.assertDeepEq("The clustered results should contain four singletons...", [["a"],["b"],["c"],["d"]], cluster2);

        var cluster3 = grouper.groupBySimilarityThreshold(allIds, similarityData, 0.25);
        jqUnit.assertDeepEq("The clustered results should contain a single four-node cluster...", [["a", "b", "c", "d"]], cluster3);
    });
};

grouperTests.runTests();