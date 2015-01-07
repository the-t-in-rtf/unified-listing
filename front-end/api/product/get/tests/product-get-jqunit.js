// tests for all read methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.api.product.get.tests";
var get = fluid.registerNamespace(namespace);

var loader = require("../../../../../config/lib/config-loader");
get.config = loader.loadConfig(require("../../../../../config/test-pouch.json"));

var testUtils = require("../../../tests/lib/testUtils")(get.config);

get.loadPouch = function() {
    get.pouch = require("../../../tests/lib/pouch")(get.config);

    get.pouch.start(function() {
        get.startExpress();
    });
};

// Spin up an express instance
get.startExpress = function() {
    get.express = require("../../../tests/lib/express")(get.config);

    get.express.start(function() {
        // Mount the module being tested
        var product = require("../index.js")(get.config);
        get.express.app.use("/product", product.router);

        get.runTests();
    });
};

get.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var request = require("request");
    jqUnit.module("Tests for GET /api/product");

    jqUnit.asyncTest("Call the interface with no parameters...", function() {
        request.get(get.config.express.baseUrl + "product", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Call the interface with only one parameter...", function() {
        request.get(get.config.express.baseUrl + "product/foo", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Looking for a record that doesn't exist...", function() {
        request.get(get.config.express.baseUrl + "product/foo/bar", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Looking for a record that exists...", function() {
        request.get(get.config.express.baseUrl + "product/Vlibank/B812", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Looking for a unified record without sources ...", function() {
        request.get(get.config.express.baseUrl + "product/unified/1420467546923-229", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
            jqUnit.assertUndefined("There should not be any 'sources' data for the record...", jsonData.record.sources);
        });
    });

    //jqUnit.asyncTest("Retrieving a unified record with sources=true ...", function() {
    //    request.get(get.config.express.baseUrl + "product/unified/1420467546923-229?sources=true", function(error, response, body) {
    //        jqUnit.start();
    //
    //        testUtils.isSaneResponse(jqUnit, error, response, body);
    //        var jsonData = JSON.parse(body);
    //
    //        debugger;
    //        jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
    //        jqUnit.assertNotUndefined("There should be 'sources' data for the record...", jsonData.record.sources);
    //    });
    //});

    //jqUnit.asyncTest("Retrieving a source record with sources=true ...", function() {
    //    request.get(get.config.express.baseUrl + "product/Vlibank/E31163?sources=true", function(error, response, body) {
    //        jqUnit.start();
    //
    //        testUtils.isSaneResponse(jqUnit, error, response, body);
    //        var jsonData = JSON.parse(body);
    //
    //        jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
    //        jqUnit.assertUndefined("There should not be any 'sources' data for the record...", jsonData.record.sources);
    //    });
    //});

    jqUnit.asyncTest("Retrieving a source record with a space in the source name ...", function() {
        request.get(get.config.express.baseUrl + "product/Dlf data/0110283", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
        });
    });
};

get.loadPouch();