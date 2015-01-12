// tests for all read methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.api.search.tests";
var searchTests = fluid.registerNamespace(namespace);

// We use "Nock" in place of CouchDb and Lucene integration
var nock      = require("nock");

var loader = require("../../../../config/lib/config-loader");
searchTests.config = loader.loadConfig(require("../../../../config/test-pouch.json"));


// Now we can initialize things that require a "config" setting

// We do not allow nock to contact any external servers other than ourselves...
nock.disableNetConnect();
nock.enableNetConnect("localhost");

searchTests.testTerms = ["jaws", "nvda", "bogus"];
searchTests.testTerms.forEach(function(term){
    var termData = JSON.stringify(require("./data/" + term + ".json"), null, 2);
    nock(searchTests.config.couch.luceneUrl).persist().get("?q=(" + term + ")").reply(200, termData);
});

var testUtils = require("../../tests/lib/testUtils")(searchTests.config);

searchTests.loadPouch = function() {
    searchTests.pouch = require("../../tests/lib/pouch")(searchTests.config);

    searchTests.pouch.start(function() {
        searchTests.startExpress();
    });
};

// Spin up an express instance
searchTests.startExpress = function() {
    searchTests.express = require("../../tests/lib/express")(searchTests.config);

    searchTests.express.start(function() {
        var search = require("../index.js")(searchTests.config);
        searchTests.express.app.use("/search", search.router);

        var suggest = require("../index.js")(searchTests.config, true);
        searchTests.express.app.use("/suggest", suggest.router);

        searchTests.runTests();
    });
};

searchTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var request = require("request");
    jqUnit.module("Tests for /api/search and /api/suggest");

    jqUnit.asyncTest("Confirm that nock is working...", function() {
        var options = {
            "url": searchTests.config.couch.luceneUrl,
            "qs": { "q": "(jaws)" }
        };

        var cannedData = require("./data/jaws.json");
        request.get(options, function(error, response, body) {
            jqUnit.start();

            var jsonData = JSON.parse(body);
            jqUnit.assertDeepEq("Nock should return the equivalent of the data stored in the file...", cannedData, jsonData);
        });
    });

    jqUnit.asyncTest("Confirm that a normal search works...", function() {
        var options = {
            "url": searchTests.config.express.baseUrl + "search",
            "qs": { "q": "jaws" }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertTrue("There should be search results...", jsonData.records.length > 0);
            }
        });
    });

    jqUnit.asyncTest("Confirm that a normal search works with sources=true...", function() {
        var options = {
            "url": searchTests.config.express.baseUrl + "search",
            "qs": { "q": "jaws", "sources": true }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertTrue("There should be search results...", jsonData.records.length > 0);
                jsonData.records.forEach(function(record) {
                    jqUnit.assertEquals("All records should be 'unified'", "unified", record.source);
                });
            }
        });
    });

    jqUnit.asyncTest("Confirm that a 'suggest' search works...", function() {
        var options = {
            "url": searchTests.config.express.baseUrl + "suggest",
            "qs": { "q": "jaws" }
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertNotUndefined("A list of records should have been returned...", jsonData.records);
            if (jsonData.records) {
                jqUnit.assertEquals("There should be exactly 5 search results...", 5, jsonData.records.length);
            }
        });
    });

    jqUnit.asyncTest("Confirm that a search returns an error if no query is passed...", function() {
        var options = {
            "url": searchTests.config.express.baseUrl + "search"
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertEquals("The response should not be 'OK'...", false, jsonData.ok);
            jqUnit.assertUndefined("No records should have been returned...", jsonData.records);
        });
    });

    jqUnit.asyncTest("Confirm that a 'suggest' search returns an error if no query is passed...", function() {
        var options = {
            "url": searchTests.config.express.baseUrl + "suggest"
        };
        request.get(options, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertEquals("The response should not be 'OK'...", false, jsonData.ok);
            jqUnit.assertUndefined("No records should have been returned...", jsonData.records);
        });
    });

    // TODO:  Find a meaningful test of these parameters. For example, source and status are handled exclusively by lucene, so we'd only be testing our ability to work with the output...
    /*
     source (optional, string) ... Only display products from a particular source. Can be repeated to return products from multiple sources.
     status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records). Can be repeated to include multiple statuses.
     sort (optional,string) ... The sort order to use when displaying records. Conforms to [lucene's query syntax][1].
     versions (optional, boolean) ... Whether or not to display the full version history for each record (including any unpublished drafts). Defaults to "false".
     */
};

searchTests.loadPouch();