// handle PUT /api/product
"use strict";

module.exports = function(config) {
    var fluid        = require("infusion");
    var namespace    = "gpii.ul.product.put";

    var put          = fluid.registerNamespace(namespace);
    put.error        = require("../../lib/error")(config);
    put.schemaHelper = require("../../../schema/lib/schema-helper")(config);

    var express      = require("express");
    var _            = require("underscore-node");

    put.router       = express.Router();
    var bodyParser   = require("body-parser");
    put.router.use(bodyParser.urlencoded());
    put.router.use(bodyParser.json());

    var handlePut = function(req, res){
        if (!req.session || !req.session.user) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(401).send(JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
        }

        var putRecord = req.body;
        // Make sure the current record has at least a uniqueId
        if (!putRecord) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(400).send(JSON.stringify({"ok": false, "message": "You must supply the JSON content for the product you wish to update." }));
        }

        if (putRecord.source === "unified" && putRecord.sid !== putRecord.uid) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(400).send(JSON.stringify({"ok": false, "message": "Unified records should always have their uid set to the same value as the sid."}));
        }

        // TODO:  Confirm that the "uid" value is set to a record that exists

        // Get the current couch document so that we can get the _id and _rev parameters required for the update
        var readRequest = require("request");

        var readOptions = {
            "url": config.express.baseUrl + config.express.apiPath + "product/" + putRecord.source + "/" + putRecord.sid
        };
        readRequest.get(readOptions, function(readError,readResponse,readBody) {
            if (readError) {
                console.log(readError);
                put.schemaHelper.setHeaders(res, "message");
                return res.status(500).send(JSON.stringify({"ok": false, "message": "There was an error retrieving the current product record..."}));
            }

            var jsonData = JSON.parse(readBody);

            var existingRecord = jsonData.record;

            // If we are trying to add a record that does not already exist, use a POST to upload to CouchDB
            if (!existingRecord || (readResponse.statusCode && readResponse.statusCode === 404) ) {
                var postHelper = require("../post/post-helper")(config);
                return postHelper(req, res);
            }

            var newRecord     = JSON.parse(JSON.stringify(putRecord));
            // TODO: This assumes that we are silently and privately passing around _id and _rev variables, which may need to be revisited...
            newRecord._id     = existingRecord._id;
            newRecord._rev    = existingRecord._rev;

            // If a status wasn't supplied, we will use the existing status
            if (!newRecord.status) {
                newRecord.status = existingRecord.status;
            }
            if (newRecord.sources) {
                delete newRecord.sources;
            }

            var errors = put.schemaHelper.validate("record", newRecord);
            if (errors) {
                put.schemaHelper.setHeaders(res, "message");
                return res.status(400).send(JSON.stringify({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors}));
            }

            // If the record has not changed, display an appropriate message and exit
            // TODO:  This may be confused by the "sources" option.  Construct a meaningful test.
            if (_.isEqual(newRecord, existingRecord)) {
                put.schemaHelper.setHeaders(res, "message");
                return res.status(200).send(JSON.stringify({"ok": true, "message": "The content you supplied is the same as the existing record, no changes needed to be made.", "record": existingRecord }));
            }

            // Preserve the supplied "updated" data if available.
            if (!newRecord.updated) {
                newRecord.updated = new Date().toISOString();
            }

            // TODO: Set the "author" field to the current user
            // TODO:  Add support for version control

            // Upload the combined record to CouchDB
            var writeRequest = require("request");
            var writeOptions = {
                url: config.couch.url + newRecord._id,
                body: JSON.stringify(newRecord)
            };

            writeRequest.put(writeOptions, function(writeError, writeResponse, writeBody){
                if (writeError) {
                    console.log(writeError);
                    return res.status(500).send(JSON.stringify({"ok": false, "message": "There was an error saving the product data..."}));
                }

                if (writeResponse.statusCode === 201) {
                    res.status(200).send(JSON.stringify({"ok":true,"message": "Product information updated.", "record": newRecord}));
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.status(writeResponse.statusCode).send(JSON.stringify({"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": jsonData.reason.errors }));
                }
            });
        });
    };

    put.router.put("/", handlePut);

    return put;
};
