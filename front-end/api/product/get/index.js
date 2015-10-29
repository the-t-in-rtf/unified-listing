// Respond to requests like GET /api/product/:source:/:sid based on the requested content type.
//
// If the request content-type is "application/json", respond with the JSON source of the record.
//
// Otherwise, serve up an HTML version of the content.
"use strict";
var fluid = fluid || require("infusion");

module.exports = function (config) {
    var fluid        = require("infusion");
    var namespace    = "gpii.ul.api.products.get";
    var get          = fluid.registerNamespace(namespace);

    var express = require("../../../../node_modules/gpii-express/node_modules/express");
    get.router       = express.Router();

    get.queryHelper  = require("../../lib/query-helper")(config);
    get.schemaHelper = require("../../../schema/lib/schema-helper")(config);

    // TODO: add support for versions
    get.router.get("/:source/:sid", function (req, res) {
        var myRes = res;

        var params = {};

        var simpleFields  = ["source", "sid"];
        get.queryHelper.parseSimpleFields(params, req, simpleFields);

        if (!params.source && !params.sid) {
            get.schemaHelper.setHeaders(myRes, "message");
            myRes.status(403).send(JSON.stringify({ "ok": false, "message": "You must provide both a source (database) and source id to use this interface."}));
            return;
        }

        var booleanFields = ["versions", "sources"];
        get.queryHelper.parseBooleanFields(params, req, booleanFields);

        var options = {
            url: config.couch.url + "/_design/ul/_view/records",
            qs: { "key": JSON.stringify([ params.source, params.sid]) }
        };
        var request = require("request");
        request(options, function (error, response, body) {
            if (error) {
                get.schemaHelper.setHeaders(myRes, "message");
                myRes.status(500).send(JSON.stringify({ "ok": false, "message": body.error}));
                return;
            }

            var data = JSON.parse(body);
            if (!data.rows || data.rows.length === 0) {
                get.schemaHelper.setHeaders(myRes, "message");
                myRes.status(404).send(JSON.stringify({ "ok": false, "message": "No record found for source '" + params.source + "' and sid '" + params.sid + "'..."}));
                return;
            }
            else if (data.rows.length > 1) {
                get.schemaHelper.setHeaders(myRes, "message");
                myRes.status(500).send(JSON.stringify({ "ok": false, "message": "More than one record found for source '" + params.source + "' and sid '" + params.sid + "'..."}));
                return;
            }


            var record = data.rows[0].value;
            if (params.sources && record.source === "unified") {
                if (!record.sid) {
                    get.schemaHelper.setHeaders(myRes, "message");
                    myRes.status(500).send(JSON.stringify({ "ok": false, "message": "Cannot group records by source without a UID value."}));
                    return;
                }

                var sourceRequest = require("request");
                var sourceOptions = {
                    url: config.couch.url + "_design/ul/_list/unified/unified",
                    qs: { "key": JSON.stringify(record.uid) }
                };
                sourceRequest(sourceOptions, function (error, response, body) {
                    if (error) {
                        get.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(500).send(JSON.stringify({ "ok": false, "message": body.error}));
                        return;
                    }

                    var data = JSON.parse(body);
                    if (!data || data.length === 0) {
                        get.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(404).send(JSON.stringify({ "ok": false, "message": "No unified record found for uid '" + record.uid + "'..."}));
                        return;
                    }

                    get.schemaHelper.setHeaders(myRes, "product");
                    myRes.status(200).send(JSON.stringify({ "ok": "true", "record": data[0]}));
                });
            }
            else {
                get.schemaHelper.setHeaders(myRes, "product");
                //myRes.type("application/json+foo");
                //myRes.set("Link", "http://www.foobar.com/");
                myRes.status(200).send(JSON.stringify({ "ok": "true", "record": record}));
            }
        });
    });

    get.router.get("/*", function (req, res) {
        get.schemaHelper.setHeaders(res, "message");
        res.status(403).send(JSON.stringify({ "ok": false, "message": "You must provide both a source (database) and source id to use this interface."}));
    });

    return get;
};