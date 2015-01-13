"use strict";

// Helper method to handle all creation of new records using POSTs to CouchDB

// The PUT method also allows creating new records, so we expose the same functions for both.
module.exports = function(config) {
    var schemaHelper = require("../../../../schema/lib/schema-helper")(config);

    return function(req, res){
        if (!req.session || !req.session.user) {
            schemaHelper.setHeaders(res, "message");
            return res.status(401).send(JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
        }

        var postRecord = req.body;

        var errors = schemaHelper.validate("record", postRecord);
        if (errors) {
            schemaHelper.setHeaders(res, "message");
            return res.status(400).send({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors});
        }


        if (postRecord.source === "unified" && postRecord.sid !== postRecord.uid) {
            schemaHelper.setHeaders(res, "message");
            return res.status(400).send({"ok": false, "message": "Unified records should always have their uid set to the same value as the sid."});
        }

        // TODO:  Confirm that the parent record exists when adding a child record.

        var checkRequest = require("request");
        var checkOptions = {
            "url": config.express.baseUrl + config.express.apiPath + "product/" + postRecord.source + "/" + postRecord.sid
        };
        checkRequest.get(checkOptions, function(checkError,checkResponse,checkBody) {
            if (checkError && checkError !== null) {
                schemaHelper.setHeaders(res, "message");
                return res.status(500).send({"ok":false, "message": "error confirming whether the record already exists:" + JSON.stringify(checkError)});
            }

            var jsonData = JSON.parse(checkBody);
            if (jsonData.record) {
                schemaHelper.setHeaders(res, "message");
                return res.status(409).send({"ok":false, "message": "Could not post record because a record with the same source and sid already exists."});
            }

            var updatedRecord = JSON.parse(JSON.stringify(postRecord));
            updatedRecord.updated = new Date().toISOString();
            if (updatedRecord.sources) {
                delete updatedRecord.sources;
            }

            // TODO: Set the "author" field to the current user (use req.session.user)

            var writeRequest = require("request");
            var writeOptions = {
                "url":     config.couch.url,
                "body":    JSON.stringify(updatedRecord),
                "headers": {"Content-Type": "application/json"}
            };
            writeRequest.post(writeOptions, function(writeError, writeResponse, writeBody) {
                debugger;
                var jsonData = JSON.parse(writeBody);
                if (writeError) {
                    schemaHelper.setHeaders(res, "message");
                    return res.status(500).send({"ok":false,"message": "There was an error saving data to couch:" + JSON.stringify(writeError)});
                }

                if (writeResponse.statusCode === 201) {
                    schemaHelper.setHeaders(res, "message");
                    res.status(200).send({"ok":true,"message": "Record added.", "record": jsonData.record});
                }
                else {
                    schemaHelper.setHeaders(res, "message");
                    res.status(writeResponse.statusCode).send({"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
                }

                // TODO:  Add support for version control
            });
        });
    };
};