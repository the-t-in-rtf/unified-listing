// tests for all read methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.api.product.getTests.tests";
var getTests = fluid.registerNamespace(namespace);

var loader = require("../../../../../config/lib/config-loader");
getTests.config = loader.loadConfig(require("../../../../../config/test-pouch.json"));
getTests.getUrl = getTests.config.express.baseUrl + getTests.config.express.apiPath + "product";

var testUtils = require("../../../tests/lib/testUtils")(getTests.config);

getTests.loadPouch = function() {
    getTests.pouch = require("../../../tests/lib/pouch")(getTests.config);

    getTests.pouch.start(function() {
        getTests.startExpress();
    });
};

// Spin up an express instance
getTests.startExpress = function() {
    getTests.express = require("../../../tests/lib/express")(getTests.config);

    getTests.express.start(function() {
        // Mount all modules to look for problems with the order in which they are loaded
        var product = require("../../index.js")(getTests.config);
        getTests.express.app.use(getTests.config.express.apiPath + "product", product.router);

        getTests.runTests();
    });
};

getTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var request = require("request");
    jqUnit.module("Tests for GET /api/product/:source/:sid");

    jqUnit.asyncTest("Call the interface with no parameters...", function() {
        request.get(getTests.getUrl, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Call the interface with only one parameter...", function() {
        request.get(getTests.getUrl + "/foo", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            try{
                var jsonData = JSON.parse(body);
                jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
            }
            catch(e) {
                jqUnit.assertUndefined("There should be no parsing errors:\n" + body, e);
            }
        });
    });

    jqUnit.asyncTest("Looking for a record that doesn't exist...", function() {
        request.get(getTests.getUrl + "/foo/bar", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertUndefined("A record should not have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Looking for a record that exists...", function() {
        request.get(getTests.getUrl + "/Vlibank/B812", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Looking for a unified record without sources ...", function() {
        request.get(getTests.getUrl + "/unified/1421059432812-144583330", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
            if (jsonData.record) {
              jqUnit.assertUndefined("There should not be 'sources' data for the record...", jsonData.record.sources);
            }
        });
    });

    jqUnit.asyncTest("Retrieving a unified record with sources=true ...", function() {
        request.get(getTests.getUrl + "/unified/1421059432812-144583330?sources=true", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            debugger;
            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
            if (jsonData.record) {
              jqUnit.assertNotUndefined("There should be 'sources' data for the record...", jsonData.record.sources);
            }
        });
    });

    jqUnit.asyncTest("Retrieving a source record with sources=true ...", function() {
        request.get(getTests.getUrl + "/Vlibank/B812?sources=true", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
            if (jsonData.record) {
                jqUnit.assertUndefined("There should not be any 'sources' data for the record...", jsonData.record.sources);
            }
        });
    });

    jqUnit.asyncTest("Retrieving a source record with a space in the source name ...", function() {
        request.get(getTests.getUrl + "/Dlf data/0110204", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A record should have been returned...", jsonData.record);
        });
    });
};

getTests.loadPouch();