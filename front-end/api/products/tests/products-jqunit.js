// tests for all read methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.api.products.tests";
var productsTests = fluid.registerNamespace(namespace);

var loader = require("../../../../config/lib/config-loader");
productsTests.config = loader.loadConfig(require("../../../../config/test-pouch.json"));

var testUtils = require("../../tests/lib/testUtils")(productsTests.config);

productsTests.loadPouch = function() {
    productsTests.pouch = require("../../tests/lib/pouch")(productsTests.config);

    productsTests.pouch.start(function() {
        productsTests.startExpress();
    });
};

// Spin up an express instance
productsTests.startExpress = function() {
    productsTests.express = require("../../tests/lib/express")(productsTests.config);

    productsTests.express.start(function() {
        // Mount the module being tested
        var products = require("../index.js")(productsTests.config);
        productsTests.express.app.use("/products", products.router);

        productsTests.runTests();
    });
};

productsTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var request = require("request");
    jqUnit.module("Tests for GET /api/products");

    jqUnit.asyncTest("Call the interface with no parameters...", function() {
        request.get(productsTests.config.express.baseUrl + "products", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
        });
    });

    jqUnit.asyncTest("Look for records updated after a very old date...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { updated: "1970-01-01T16:54:12.023Z" }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertTrue("The list should not be empty...", jsonData.records.length > 0);
            }
        });
    });

    jqUnit.asyncTest("Look for records updated after a distant future date...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { updated: "3000-01-01T16:54:12.023Z" }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertEquals("The list should be empty...", 0, jsonData.records.length);
            }
        });
    });

    jqUnit.asyncTest("Look for records, limiting by source...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { source: "unified" }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                var unifiedRecordCount = jsonData.records.length;
                jqUnit.assertTrue("The list of unified records should not be empty...", unifiedRecordCount > 0);

                jqUnit.stop();
                var options = {
                    "url": productsTests.config.express.baseUrl + "products",
                    "qs": { source: ["unified","Vlibank"] }
                };
                request.get(options, function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);
                    var jsonData = JSON.parse(body);

                    jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
                    if (jsonData.records) {
                        var combinedRecordCount = jsonData.records.length;
                        jqUnit.assertTrue("The list of combined records should not be empty...", combinedRecordCount > 0);
                        jqUnit.assertTrue("There should be more combined records than unified records...", combinedRecordCount > unifiedRecordCount);
                    }
                });


            }
        });
    });

    jqUnit.asyncTest("Look for records, limiting by status...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products"
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                var unlimitedRecordCount = jsonData.records.length;
                jqUnit.assertTrue("The list of records should not be empty...", unlimitedRecordCount > 0);

                jqUnit.stop();
                var options = {
                    "url": productsTests.config.express.baseUrl + "products",
                    "qs": { status: ["deleted"] }
                };
                request.get(options, function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);
                    var jsonData = JSON.parse(body);

                    jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
                    if (jsonData.records) {
                        var deletedRecordCount = jsonData.records.length;
                        jqUnit.assertTrue("There should be less 'deleted' records than total records...", deletedRecordCount < unlimitedRecordCount);
                    }
                });
            }
        });
    });

    jqUnit.asyncTest("Look for records, limiting by multiple statuses...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { status: ["deleted"] }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                var deletedRecordCount = jsonData.records.length;

                jqUnit.stop();
                var options = {
                    "url": productsTests.config.express.baseUrl + "products",
                    "qs": { status: ["deleted", "new", "active"] }
                };
                request.get(options, function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);
                    var jsonData = JSON.parse(body);

                    jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
                    if (jsonData.records) {
                        var combinedRecordCount = jsonData.records.length;
                        jqUnit.assertTrue("There should be more records from multiple statuses than from just one...", deletedRecordCount < combinedRecordCount);
                    }
                });
            }
        });
    });

    jqUnit.asyncTest("Present unified records from all sources...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { sources: true }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertTrue("The list of records should not be empty...", jsonData.records.length > 0);

                jsonData.records.forEach(function(record){
                    jqUnit.assertEquals("Only 'unified' records should be returned when sources=true", "unified", record.source);
                    jqUnit.assertNotUndefined("All records should include sources when sources=true", record.sources);
                    if (record.sources){
                        jqUnit.assertTrue("There should be at least one source record for each record when sources=true", record.sources.length >= 1);
                    }
                });
            }
        });
    });

    jqUnit.asyncTest("Present unified records limited by source...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { sources: true }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                var unlimitedRecordCount = jsonData.records.length;
                jqUnit.assertTrue("The list of records should not be empty...", unlimitedRecordCount > 0);

                jqUnit.stop();

                var limitedOptions = {
                    "url": productsTests.config.express.baseUrl + "products",
                    "qs": { sources: true, source: "Vlibank" }
                };
                request.get(limitedOptions, function(error, response, body) {
                    jqUnit.start();
                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var jsonData = JSON.parse(body);

                    jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
                    var limitedRecordCount = jsonData.records.length;
                    jqUnit.assertTrue("There should be fewer records return when we limit the results by source...", limitedRecordCount < unlimitedRecordCount);
                });
            }
        });
    });

    jqUnit.asyncTest("Test offset and limit parameters (get the same record as part of two overlapping sets)...", function() {
        var options = {
            "url": productsTests.config.express.baseUrl + "products",
            "qs": { offset: 0, limit: 3 }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertTrue("The list of records should not be empty...", jsonData.records.length > 0);
                var lastRecord = jsonData.records[2];

                jqUnit.stop();

                var limitedOptions = {
                    "url": productsTests.config.express.baseUrl + "products",
                    "qs": { offset: 2, limit: 1 }
                };
                request.get(limitedOptions, function(error, response, body) {
                    jqUnit.start();
                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var jsonData = JSON.parse(body);

                    jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
                    if (jsonData.records) {
                        jqUnit.assertTrue("The list of records should not be empty...", jsonData.records.length > 0);
                        var firstRecord = jsonData.records[0];
                        jqUnit.assertDeepEq("The last record of set 1-3 should equal the first record of set 3-3...", lastRecord, firstRecord);
                    }
                });
            }
        });
    });
};

productsTests.loadPouch();