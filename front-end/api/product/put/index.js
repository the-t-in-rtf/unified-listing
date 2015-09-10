/*

  Handles PUT requests to /api/product/, which update an existing record.

  See [the API documentation](https://ul.gpii.net/api/docs/) for details about the accepted format.

  Note:  The `uid` field is a special case.  If it is already set in the existing record, it will be preserved unless:

  1.  You set it to a new non-null value.
  2.  You set it explicitly to `null`.

 */
"use strict";
var fluid        = require("infusion");
var gpii         = fluid.registerNamespace("gpii");
var namespace    = "gpii.ul.product.put";
var put          = fluid.registerNamespace(namespace);
var request      = require("request");

var fs = require("fs");
var path = require("path");

require("../../sources");

// TODO:  Turn this into part of our options block.
var sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../sources/sources.json"), { encoding: "utf8"}));

gpii.ul.product.put.removeEmptyEntries = function (node) {
    var strippedNode = {};
    fluid.each(node, function (value, key) {
        if (typeof value === "object") {
            var strippedValue = gpii.ul.product.put.removeEmptyEntries(value);
            if (strippedValue !== null && strippedValue !== undefined) {
                strippedNode[key] = strippedValue;
            }
        }
        else if (value !== undefined && value !== null) {
            strippedNode[key] = value;
        }
    });

    return Object.keys(strippedNode).length > 0 ? strippedNode : null;
};

module.exports = function (config) {
    put.error        = require("../../lib/error")(config);
    put.schemaHelper = require("../../../schema/lib/schema-helper")(config);

    var express      = require("../../../../node_modules/gpii-express/node_modules/express");
    var _            = require("underscore-node");

    put.router       = express.Router();
    var bodyParser   = require("../../../../node_modules/gpii-express/node_modules/body-parser");
    put.router.use(bodyParser.urlencoded());
    put.router.use(bodyParser.json());

    var handlePut = function (req, res) {
        if (!req.session || !req.session.user) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(401).send(JSON.stringify({ok: false, message: "You must be logged in to use this function."}));
        }

        var putRecord = gpii.ul.product.put.removeEmptyEntries(req.body);

        // TODO:  Replace all sanity checks with JSON Schemas validation
        // Make sure the current record has at least a uniqueId
        if (!putRecord) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(400).send(JSON.stringify({"ok": false, "message": "You must supply the JSON content for the product you wish to update." }));
        }

        if (putRecord.source === "unified" && putRecord.sid !== putRecord.uid) {
            put.schemaHelper.setHeaders(res, "message");
            return res.status(400).send(JSON.stringify({"ok": false, "message": "Unified records should always have their uid set to the same value as the sid."}));
        }

        var allowedSources = gpii.ul.api.sources.request.listAllowedSources(sources, req.session.user);
        if (allowedSources.indexOf(putRecord.source) === -1) {
            return res.status(403).send(JSON.stringify({ok: false, message: "You are not allowed to edit records with the given source."}));
        }

        // Get the current couch document so that we can get the _id and _rev parameters required for the update
        var readOptions = {
            "url": config.express.baseUrl + config.express.apiPath + "/product/" + putRecord.source + "/" + encodeURIComponent(putRecord.sid)
        };
        request.get(readOptions, function (readError, readResponse, readBody) {
            if (readError) {
                console.log(readError);
                put.schemaHelper.setHeaders(res, "message");
                return res.status(500).send(JSON.stringify({"ok": false, "message": "There was an error retrieving the current product record..."}));
            }

            var jsonData = typeof readBody === "string" ? JSON.parse(readBody): readBody;

            var existingRecord = jsonData.record;

            // If we are trying to add a record that does not already exist, use a POST to upload to CouchDB
            if (!existingRecord || (readResponse.statusCode && readResponse.statusCode === 404)) {
                var postHelper = require("../post/post-helper")(config);
                return postHelper(req, res);
            }

            var newRecord     = JSON.parse(JSON.stringify(putRecord));
            // TODO: This assumes that we are silently and privately passing around _id and _rev variables, which may need to be revisited...
            newRecord._id     = existingRecord._id;
            newRecord._rev    = existingRecord._rev;

            // Preserve the UID field if we don't have a new one.
            // TODO:  Revisit this once https://issues.gpii.net/browse/GPII-1254 is resolved.
            if (newRecord.uid === undefined && existingRecord.uid) {
                newRecord.uid = existingRecord.uid;
            }

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
                return res.status(400).send(JSON.stringify({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors, "record": newRecord }));
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

            // TODO:  Add support for version control

            // Upload the combined record to CouchDB
            var writeOptions = {
                url:   config.couch.url + "/" + newRecord._id,
                json:  newRecord
            };

            request.put(writeOptions, function (writeError, writeResponse, writeBody) {
                if (writeError) {
                    console.log(writeError);
                    return res.status(500).send(JSON.stringify({"ok": false, "message": "There was an error saving the product data..."}));
                }

                if (writeResponse.statusCode === 201) {
                    // Although CouchDB tells us that an update has been "created" (status code 201), we choose to
                    // return a 200 status code to indicate that this is an update and not a new record.
                    res.status(200).send(JSON.stringify({"ok": true, "message": "Product information updated.", "record": newRecord}));
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.status(writeResponse.statusCode).send(JSON.stringify({"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": jsonData.reason.errors, "record": newRecord }));
                }
            });
        });
    };

    put.router.put("/", handlePut);

    return put;
};
