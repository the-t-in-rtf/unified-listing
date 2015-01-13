// tests for PUT /api/product
"use strict";
var fluid       = require("infusion");
var namespace   = "gpii.ul.product.put.tests";
var putTests    = fluid.registerNamespace(namespace);


putTests.loader = require("../../../../../config/lib/config-loader");
putTests.config = putTests.loader.loadConfig(require("../../../../../config/test-pouch.json"));

// TODO:  When we add support for version control, we should test it
// TODO:  When we add support for attribution, we should test it

putTests.loginHelper   = require("../../../lib/login-helper")(putTests.config);
putTests.schemaHelper  = require("../../../../schema/lib/schema-helper")(putTests.config);
putTests.testUtils     = require("../../../tests/lib/testUtils")(putTests.config);
putTests.request       = require("request");

putTests.validRecord   = require("../../../../../test/data/product/product-sample.json");

putTests.validRecordGeneric = JSON.parse(JSON.stringify(putTests.validRecord));
delete putTests.validRecord._id;
delete putTests.validRecord.updated;
delete putTests.validRecord._rev;

// We need to remove this to assist with deep comparisons, as "updated" will always be different.

// TODO: For now we use an empty record for our 'invalid' tests.  Eventually we should use a range of mistakes...
putTests.invalidRecord = {};
putTests.apiUrl        = putTests.config.express.baseUrl + putTests.config.express.apiPath;
putTests.productApiUrl = putTests.apiUrl + "product";

putTests.generalize = function(object) {
    var newObject = JSON.parse(JSON.stringify(object));
    var fieldsToRemove = ["_id","_rev","updated"];
    fieldsToRemove.forEach(function(field){
        if (newObject[field]){ delete newObject[field]; }
    });
    return newObject;
};

putTests.loadPouch = function() {
    putTests.pouch = require("../../../tests/lib/pouch")(putTests.config);

    putTests.pouch.start(function() {
        putTests.startExpress();
    });
};

// Spin up an express instance
putTests.startExpress = function() {
    putTests.express = require("../../../tests/lib/express")(putTests.config);

    putTests.express.start(function() {
        var bodyParser = require("body-parser");
        putTests.express.app.use(bodyParser.json());

        // /api/user, provided by express-couchuser
        var user = require("../../../user")(putTests.config);
        putTests.express.app.use("/", user.router);

        // Now load the PUT code
        var put = require("../index.js")(putTests.config);
        putTests.express.app.use("/api/product", put.router);

        // We need GET /api/product/:source/:sid to be available.
        // This must be loaded after any other calls to avoid hijacking URLs
        var get = require("../../get")(putTests.config);
        putTests.express.app.use("/api/product", get.router);

        putTests.runTests();
    });
};

putTests.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("PUT /api/product");

    jqUnit.asyncTest("Use PUT to create a new record (not logged in)", function() {
        var options = {
            "url":  putTests.productApiUrl,
            "json": putTests.validRecord
        };

        var request = require("request");
        request.put(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no raw errors returned.", e);
            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);

            jqUnit.assertNull("There should not be a record returned.", b.record);
        });
    });

    jqUnit.asyncTest("Use PUT to update an existing record (logged in)", function() {
        putTests.loginHelper.login(jqUnit, {}, function(){
            var updatedRecord = JSON.parse(JSON.stringify(putTests.validRecord));
            updatedRecord.description = "This record has been updated.";
            var options = {
                "url":  putTests.productApiUrl,
                "json": updatedRecord,
                "jar":  putTests.loginHelper.jar
            };
            putTests.request.put(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertNull("There should be no validation errors returned", b.errors);
                jqUnit.stop();

                // Make sure the record was actually created
                var checkOptions = {
                    "url": putTests.productApiUrl + "/" + updatedRecord.source + "/" + updatedRecord.sid
                };
                putTests.request.get(checkOptions, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);
                    var savedRecord = jsonData.record;
                    jqUnit.assertValue("There should be a record returned (" + JSON.stringify(b) + ").", savedRecord);

                    if (savedRecord) {
                        // Validate the output for the process to confirm that what is delivered can be handed right back to the API...
                        var errors = putTests.schemaHelper.validate("record", jsonData.record);
                        jqUnit.assertFalse("There should be no errors returned when validating the final results of the process...", errors);

                        jqUnit.assertNotEquals("The 'updated' field should not be the same in the new record", putTests.validRecord.updated, savedRecord.updated);

                        jqUnit.assertTrue("The 'description' field should be updated:", savedRecord.description.indexOf("updated") !== -1);
                        jqUnit.assertDeepEq("The updated record should be the same (in general) as the PUT content", putTests.generalize(updatedRecord), putTests.generalize(savedRecord));
                    }

                    jqUnit.stop();

                    putTests.loginHelper.logout(jqUnit, {});
                });
            });
        });
    });

    jqUnit.asyncTest("Use PUT to create a new record (logged in)", function() {
        putTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = JSON.parse(JSON.stringify(putTests.validRecord));
            newRecord.source = "unified";
            newRecord.uid    = "completelyNewRecord";
            newRecord.sid    = "completelyNewRecord";

            var options = {
                "url":  putTests.productApiUrl,
                "json": newRecord,
                "jar":  putTests.loginHelper.jar
            };
            putTests.request.put(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertNull("There should be no validation errors returned", b.errors);
                jqUnit.stop();

                // Make sure the record was actually created
                var checkOptions = {
                    "url": putTests.productApiUrl + "/" + newRecord.source + "/" + newRecord.sid
                };
                putTests.request.get(checkOptions, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);
                    var savedRecord = jsonData.record;
                    jqUnit.assertValue("There should be a record returned (" + JSON.stringify(b) + ").", savedRecord);

                    if (savedRecord) {
                        // Validate the output for the process to confirm that what is delivered can be handed right back to the API...
                        var errors = putTests.schemaHelper.validate("record", savedRecord);
                        jqUnit.assertFalse("There should be no errors returned when validating the final results of the process...", errors);

                        jqUnit.assertDeepEq("The updated record should be the same (in general) as the PUT content", putTests.generalize(newRecord), putTests.generalize(savedRecord));
                    }

                    jqUnit.stop();

                    putTests.loginHelper.logout(jqUnit, {});
                });
            });
        });
    });

    jqUnit.asyncTest("Use PUT to attempt to create an invalid record (logged in)", function() {
        putTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = JSON.parse(JSON.stringify(putTests.invalidRecord));

            var options = {
                "url":  putTests.productApiUrl,
                "json": newRecord,
                "jar":  putTests.loginHelper.jar
            };
            putTests.request.put(options, function(e,r,b) {
                debugger;
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertTrue("There should be validation errors returned", b.errors && Object.keys(b.errors).length > 0);
                jqUnit.stop();

                putTests.loginHelper.logout(jqUnit, {});
            });
        });
    });

    jqUnit.asyncTest("Use PUT to attempt to create a unified record whose sid does not match its uid", function() {
        putTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = putTests.generalize(JSON.parse(JSON.stringify(putTests.validRecord)));
            newRecord.source = "unified";
            newRecord.sid    = "newValue";
            newRecord.uid    = "anotherNewValue";

            var options = {
                "url":  putTests.productApiUrl,
                "json": newRecord,
                "jar":  putTests.loginHelper.jar
            };
            putTests.request.put(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertEquals("The status code should be '400'", 400, r.statusCode);
                jqUnit.stop();

                putTests.loginHelper.logout(jqUnit, {});
            });
        });
    });

    // TODO:  Test versioning on all successful adds and updates
};

putTests.loadPouch();
