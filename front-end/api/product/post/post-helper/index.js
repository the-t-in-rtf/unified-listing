"use strict";

var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var fs = require("fs");
var path = require("path");

require("../../../sources");

// TODO:  Turn this into part of our options block.
var sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../sources/sources.json"), { encoding: "utf8"}));

// TODO:  Convert to proper component
// TODO:  Back this with a couch handling library, including transform rules to strip _id and _rev fields
// TODO:  Write detailed tests for "contributed" records

// Helper method to handle all creation of new records using POSTs to CouchDB

// The PUT method also allows creating new records, so we expose the same functions for both.
module.exports = function (config) {
    var schemaHelper = require("../../../../schema/lib/schema-helper")(config);

    // A system generate SID for records that do not already have one (such as those created by end users). Returns a
    // string like "admin-10230942093842-875".  The random number added at the end should prevent collisions unless
    // there are a significant number of updates that occur in a single millisecond.
    function generateSid() {
        var timestamp = (new Date()).getTime();
        var random = Math.round(Math.random() * 1000);

        return [timestamp, random].join("-");
    }

    return function (req, res) {
        if (!req.session || !req.session.user) {
            schemaHelper.setHeaders(res, "message");
            return res.status(401).send(JSON.stringify({ok: false, message: "You must be logged in to use this function."}));
        }

        var postRecord = req.body;

        // This function is only called when working with new records, so we can set the status before validating.
        postRecord.status = "new";

        // TODO: Replace this with proper permission handling
        if (!postRecord.source) {
            postRecord.source = req.session.user.name;
        }

        var allowedSources = gpii.ul.api.sources.request.listAllowedSources(sources, req.session.user);
        if (allowedSources.indexOf(postRecord.source) === -1) {
            return res.status(403).send(JSON.stringify({ok: false, message: "You are not allowed to edit records with the given source."}));
        }

        // TODO: Review and sanitize this and the addition of the source (should be transform rules?)
        // Auto-generate an SID for records that do not already have one.
        if (!postRecord.sid) {
            postRecord.sid = generateSid();
        }

        var errors = schemaHelper.validate("record", postRecord);
        if (errors) {
            schemaHelper.setHeaders(res, "message");
            return res.status(400).send({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors, "record": postRecord });
        }


        if (postRecord.source === "unified" && postRecord.sid !== postRecord.uid) {
            schemaHelper.setHeaders(res, "message");
            return res.status(400).send({"ok": false, "message": "Unified records should always have their uid set to the same value as the sid."});
        }

        // TODO:  Confirm that the parent record exists when adding a child record.

        var checkRequest = require("request");
        var checkOptions = {
            "url": config.express.baseUrl + config.express.apiPath + "/product/" + postRecord.source + "/" + encodeURIComponent(postRecord.sid)
        };
        checkRequest.get(checkOptions, function (checkError, checkResponse, checkBody) {
            if (checkError && checkError !== null) {
                schemaHelper.setHeaders(res, "message");
                return res.status(500).send({"ok": false, "message": "error confirming whether the record already exists:" + JSON.stringify(checkError)});
            }

            var jsonData = JSON.parse(checkBody);
            if (jsonData.record) {
                schemaHelper.setHeaders(res, "message");
                return res.status(409).send({"ok": false, "message": "Could not post record because a record with the same source and sid already exists."});
            }

            var updatedRecord = JSON.parse(JSON.stringify(postRecord));
            // Preserve the supplied "updated" data if available.
            if (!updatedRecord.updated) {
                updatedRecord.updated = new Date().toISOString();
            }
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
            writeRequest.post(writeOptions, function (writeError, writeResponse, writeBody) {
                var jsonData = JSON.parse(writeBody);
                if (writeError) {
                    schemaHelper.setHeaders(res, "message");
                    return res.status(500).send({"ok": false, "message": "There was an error saving data to couch:" + JSON.stringify(writeError)});
                }

                if (writeResponse.statusCode === 201) {
                    schemaHelper.setHeaders(res, "message");

                    // Retrieve the full record so that we can return the data to the user.
                    var getNewRecordRequest = require("request");
                    var newRecordOptions = {
                        "url": config.couch.url + "/" + jsonData.id,
                        "headers": {"Content-Type": "application/json"}
                    };
                    getNewRecordRequest.get(newRecordOptions, function (getNewError, getNewResponse, getNewBody) {
                        if (getNewError) {
                            schemaHelper.setHeaders(res, "message");
                            return res.status(500).send({"ok": false, "message": "There was an error retrieving the saved record:" + JSON.stringify(writeError)});
                        }

                        var newRecord = JSON.parse(getNewBody);
                        res.status(201).send({"ok": true, "message": "Record added.", "record": newRecord});
                    });
                }
                else {
                    schemaHelper.setHeaders(res, "message");
                    var errors = [];
                    var writeBodyData = typeof writeBody === "string" ? JSON.parse(writeBody) : writeBody;
                    if (writeBodyData && writeBodyData.reason && writeBody.reason.summary) { errors.push(writeBody.reason.summary); }
                    if (jsonData.reason.errors) { errors.push(JSON.stringify(jsonData.reason.errors)); }
                    res.status(writeResponse.statusCode).send({"ok": false, "message": "There were one or more problems that prevented a new record from being created.", "errors": errors, "record": jsonData.record });
                }

                // TODO:  Add support for version control
            });
        });
    };
};