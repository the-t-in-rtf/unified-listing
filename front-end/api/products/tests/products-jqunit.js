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
                jqUnit.assertTrue("The list of records should not be empty...", deletedRecordCount > 0);

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
                        debugger;
                        jqUnit.assertTrue("There should be more records from multiple statuses than from just one...", deletedRecordCount < combinedRecordCount);
                    }
                });
            }
        });
    });
    // TODO: Test the remaining query parameters
    /*
     status (optional, string) ... The product statuses to return (defaults to everything but 'deleted' records). Can be repeated to include multiple statuses.
     offset (optional, string) ... The number of records to skip in the list of results. Used for pagination.
     limit (optional, string) ... The number of records to return. Used for pagination.
     */
};

productsTests.loadPouch();