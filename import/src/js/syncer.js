// This script is designed to synchronise data in the UL format with an existing CouchDb instance

"use strict";
var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");

var request = require("request");

fluid.registerNamespace("gpii.ul.importers.syncer");

gpii.ul.importers.syncer.LoginAndStartSync = function(that) {
    var options = {
        jar: true,
        json: true,
        body: {
            name:     that.options.loginUsername,
            password: that.options.loginPassword
        }
    };
    request.post(that.options.loginUrl, options, function(error, response, body) {
        if (error) {
            console.log("Login returned an error:" + error);
        }
        else if (response.statusCode !== 200) {
            console.log("Login returned an error message:\n" + JSON.stringify(body, null, 2));
        }
        else {
            console.log("Logged in, starting synchronization...");
            that.syncViaREST();
        }
    });
};

gpii.ul.importers.syncer.syncViaREST = function (that) {
    var checkTasks = [];

    // Iterate through each record
    for (var a = 0; a < that.model.data.length; a++) {
        // Add our task to the stack
        checkTasks.push(that.getRecordUpdatePromise(that.model.data[a]));
    }

    // Process the stack of tasks
    fluid.promise.sequence(checkTasks).then(function(){
        console.log("Finished synchronizing data...");

        // Fire an event so that we can chain in the "unifier" and other services
        that.events.onSyncComplete.fire(that);
    });
};

// generate a response parser for an individual record
gpii.ul.importers.syncer.getRecordUpdatePromise = function(that, updatedRecord) {
    return function() {
        var promise = fluid.promise();

        var requestOptions = {
            json:   true,
            jar:    true,
            body:   updatedRecord
        };

        request.put(that.options.putApiUrl, requestOptions, function(error, response, body) {
            if (error) {
                console.log("Record update returned an error:\n" + error);
                promise.reject(error);
            }
            // There was an error processing our request
            else if (response.statusCode !== 200 && response.statusCode !== 201) {
                console.log("Record update returned an error message:\n" + JSON.stringify(body, null, 2));
                promise.reject(body);
            }
            else {
                promise.resolve(body.record);
            }
        });

        return promise;
    };
};

fluid.defaults("gpii.ul.importers.syncer", {
    loginUsername: "admin",
    loginPassword: "admin",
    loginUrl:      "http://localhost:4896/api/user/signin",
    putApiUrl:     "http://localhost:4896/api/product/",
    gradeNames:    ["fluid.modelRelayComponent", "autoInit"],
    invokers: {
        getRecordUpdatePromise: {
            funcName: "gpii.ul.importers.syncer.getRecordUpdatePromise",
            args: ["{that}", "{arguments}.0"]
        },
        syncViaREST: {
            funcName: "gpii.ul.importers.syncer.syncViaREST",
            args: ["{that}"]
        }
    },
    model: {
        data: []
    },
    events: {
        onSyncComplete: null
    },
    modelListeners: {
        "data": {
            funcName:      "gpii.ul.importers.syncer.LoginAndStartSync",
            args:          ["{that}"],
            excludeSource: "init"
        }
    }
});