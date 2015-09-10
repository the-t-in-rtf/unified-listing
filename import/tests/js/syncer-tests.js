// Test the scripts that compare federated database member data to our current holdings.
"use strict";
var fluid = fluid || require("infusion");
fluid.setLogging(true);

var gpii = fluid.registerNamespace("gpii");

require("../../src/js/syncer");

var request = require("request");

fluid.registerNamespace("gpii.ul.imports.tests.syncer");

gpii.ul.imports.tests.syncer.runTests = function (that) {
    var jqUnit = require("jqUnit");
    jqUnit.module("Testing synchronization mechanism...");

    jqUnit.asyncTest("Confirming that new records are created as expected...", function () {
        var options = {
            url: that.options.productUrl + "/admin/new",
            method: "GET"
        };

        request(options, function (error, response, body) {
            jqUnit.start();
            jqUnit.assertTrue("There should be no errors...", error === undefined || error === null);

            jqUnit.assertEquals("The new record should be found", 200, response.statusCode);

            var data = typeof body === "string" ? JSON.parse(body) : body;

            fluid.each(["status", "updated"], function (field) {
                jqUnit.assertTrue("The '" + field + "' field should be set...", data.record[field] !== undefined && data.record[field] !== null);
            });
        });
    });

    jqUnit.asyncTest("Confirm that existing records are updated as expected...", function () {
        var options = {
            url: that.options.productUrl + "/admin/existing"
        };

        request(options, function (error, response, body) {
            jqUnit.start();
            jqUnit.assertTrue("There should be no errors...", error === undefined || error === null);

            jqUnit.assertEquals("The existing record should be found", 200, response.statusCode);

            var data = typeof body === "string" ? JSON.parse(body) : body;

            jqUnit.assertEquals("The record should have been updated", "existing with updates", data.record.name);

            fluid.each(["uid", "updated"], function (field) {
                jqUnit.assertTrue("The '" + field + "' field should be set...", data.record[field] !== undefined && data.record[field] !== null);
            });
        });
    });

    jqUnit.asyncTest("Confirm that slashes in SIDs are handled correctly...", function () {
        var options = {
            url: that.options.productsUrl
        };

        request(options, function (error, response, body) {
            jqUnit.start();
            jqUnit.assertTrue("There should be no errors...", error === undefined || error === null);
            var data = typeof body === "string" ? JSON.parse(body) : body;
            jqUnit.assertEquals("There should be three total records...", 3, data.records.length);
        });
    });
};
gpii.ul.imports.syncer.launch = function (that) {
    that.syncer.applier.change("data", that.options.testData);
};

require("./test-harness");

gpii.ul.imports.tests.harness({
    ports: {
        apiPort:    "3598",
        pouchPort:  "9998"
    },
    loginUrl: {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%apiPort/api/user/signin"]
        }
    },
    productUrl: {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%apiPort/api/product"]
        }
    },
    productsUrl: {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%apiPort/api/products"]
        }
    },
    testData:  [
        { "name": "existing with updates", "description": "existing record with updates", "status": "active", "source": "admin", "sid": "existing", "manufacturer": { "name": "Acme Inc."} },
        { "name": "new", "description": "new record", "source": "admin", "sid": "new", "manufacturer": { "name": "Acme Inc."} }
    ],
    components: {
        syncer: {
            type: "gpii.ul.imports.syncer",
            options: {
                loginUrl:  "{harness}.options.loginUrl",
                putApiUrl: "{harness}.options.productUrl",
                listeners: {
                    "onSyncComplete": {
                        funcName: "gpii.ul.imports.tests.syncer.runTests",
                        args:     ["{harness}"]
                    }
                }
            }
        }
    },
    listeners: {
        "onStarted.launchSyncer": {
            funcName: "gpii.ul.imports.syncer.launch",
            args:     ["{that}"]
        }
    }
});