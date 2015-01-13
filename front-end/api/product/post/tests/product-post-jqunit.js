// tests for POST /api/product
"use strict";
var fluid       = require("infusion");
var namespace   = "gpii.ul.product.post.tests";
var postTests    = fluid.registerNamespace(namespace);

postTests.loader = require("../../../../../config/lib/config-loader");
postTests.config = postTests.loader.loadConfig(require("../../../../../config/test-pouch.json"));

// TODO:  When we add support for version control, we should test it
// TODO:  When we add support for attribution, we should test it

postTests.loginHelper   = require("../../../lib/login-helper")(postTests.config);
postTests.schemaHelper  = require("../../../../schema/lib/schema-helper")(postTests.config);
postTests.testUtils     = require("../../../tests/lib/testUtils")(postTests.config);
postTests.request       = require("request");

postTests.validRecord   = require("../../../../../test/data/product/product-sample.json");

// We need to remove this to assist with deep comparisons, as "updated" will always be different.

// TODO: For now we use an empty record for our 'invalid' tests.  Eventually we should use a range of mistakes...
postTests.invalidRecord = {};
postTests.apiUrl        = postTests.config.express.baseUrl + postTests.config.express.apiPath;
postTests.productApiUrl = postTests.apiUrl + "product";

postTests.generalize = function(object) {
    var newObject = JSON.parse(JSON.stringify(object));
    var fieldsToRemove = ["_id","_rev","updated"];
    fieldsToRemove.forEach(function(field){
        if (newObject[field]){ delete newObject[field]; }
    });
    return newObject;
};

postTests.loadPouch = function() {
    postTests.pouch = require("../../../tests/lib/pouch")(postTests.config);

    postTests.pouch.start(function() {
        postTests.startExpress();
    });
};

// Spin up an express instance
postTests.startExpress = function() {
    postTests.express = require("../../../tests/lib/express")(postTests.config);

    postTests.express.start(function() {
        var bodyParser = require("body-parser");
        postTests.express.app.use(bodyParser.json());

        // /api/user, provided by express-couchuser
        var user = require("../../../user")(postTests.config);
        postTests.express.app.use("/", user.router);

        // Now load the POST code
        var post = require("../index.js")(postTests.config);
        postTests.express.app.use("/api/product", post.router);

        // We need GET /api/product/:source/:sid to be available.
        // This must be loaded after any other calls to avoid hijacking URLs
        var get = require("../../get")(postTests.config);
        postTests.express.app.use("/api/product", get.router);

        postTests.runTests();
    });
};

postTests.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("POST /api/product");

    jqUnit.asyncTest("Use POST to create a new record (not logged in)", function() {
        var options = {
            "url":  postTests.productApiUrl,
            "json": postTests.validRecord
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no raw errors returned.", e);
            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);

            jqUnit.assertNull("There should not be a record returned.", b.record);
        });
    });

    jqUnit.asyncTest("Use POST to update an existing record (should fail)", function() {
        postTests.loginHelper.login(jqUnit, {}, function(){
            var updatedRecord = JSON.parse(JSON.stringify(postTests.validRecord));
            updatedRecord.description = "This record has been updated.";
            var options = {
                "url":  postTests.productApiUrl,
                "json": updatedRecord,
                "jar":  postTests.loginHelper.jar
            };
            postTests.request.post(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertFalse("The response should not be 'ok'", b.ok);
                jqUnit.assertEquals("The status code should be 409", 409, r.statusCode);
                jqUnit.stop();

                postTests.loginHelper.logout(jqUnit, {});
            });
        });
    });

    jqUnit.asyncTest("Use POST to create a new record (logged in)", function() {
        postTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = JSON.parse(JSON.stringify(postTests.validRecord));
            newRecord.source = "unified";
            newRecord.uid    = "completelyNewRecord";
            newRecord.sid    = "completelyNewRecord";

            var options = {
                "url":  postTests.productApiUrl,
                "json": newRecord,
                "jar":  postTests.loginHelper.jar
            };
            postTests.request.post(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertNull("There should be no validation errors returned", b.errors);
                jqUnit.stop();

                // Make sure the record was actually created
                var checkOptions = {
                    "url": postTests.productApiUrl + "/" + newRecord.source + "/" + newRecord.sid
                };
                postTests.request.get(checkOptions, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);
                    var savedRecord = jsonData.record;
                    jqUnit.assertValue("There should be a record returned (" + JSON.stringify(b) + ").", savedRecord);

                    if (savedRecord) {
                        // Validate the outPOST for the process to confirm that what is delivered can be handed right back to the API...
                        var errors = postTests.schemaHelper.validate("record", savedRecord);
                        jqUnit.assertFalse("There should be no errors returned when validating the final results of the process...", errors);

                        jqUnit.assertDeepEq("The updated record should be the same (in general) as the POST content", postTests.generalize(newRecord), postTests.generalize(savedRecord));
                    }

                    jqUnit.stop();

                    postTests.loginHelper.logout(jqUnit, {});
                });
            });
        });
    });

    jqUnit.asyncTest("Use POST to attempt to create an invalid record (logged in)", function() {
        postTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = JSON.parse(JSON.stringify(postTests.invalidRecord));

            var options = {
                "url":  postTests.productApiUrl,
                "json": newRecord,
                "jar":  postTests.loginHelper.jar
            };
            postTests.request.post(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertTrue("There should be validation errors returned", b.errors && Object.keys(b.errors).length > 0);
                jqUnit.stop();

                postTests.loginHelper.logout(jqUnit, {});
            });
        });
    });

    jqUnit.asyncTest("Use POST to attempt to create a unified record whose sid does not match its uid", function() {
        postTests.loginHelper.login(jqUnit, {}, function(){
            var newRecord = postTests.generalize(JSON.parse(JSON.stringify(postTests.validRecord)));
            newRecord.source = "unified";
            newRecord.sid    = "newValue";
            newRecord.uid    = "anotherNewValue";

            var options = {
                "url":  postTests.productApiUrl,
                "json": newRecord,
                "jar":  postTests.loginHelper.jar
            };
            postTests.request.post(options, function(e,r) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertEquals("The status code should be '400'", 400, r.statusCode);
                jqUnit.stop();

                postTests.loginHelper.logout(jqUnit, {});
            });
        });
    });

    // TODO:  Test versioning on all successful adds and updates
};

postTests.loadPouch();
