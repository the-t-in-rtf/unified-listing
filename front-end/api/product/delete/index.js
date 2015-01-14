// API Support for DELETE /api/product/:source:/:sid
"use strict";
module.exports=function(config){
    var fluid         = require("infusion");
    var namespace     = "gpii.ul.api.products.delete";
    var del           = fluid.registerNamespace(namespace);

    var express       = require("express");
    del.router        = express.Router();

    del.queryHelper   = require("../../lib/query-helper")(config);
    del.schemaHelper  = require("../../../schema/lib/schema-helper")(config);

    del.config        = config;

    // TODO: add support for versions
    del.router.use("/:source/:sid",function(req, res) {
        var myRes = res;

        if (!req.session || !req.session.user) {
            del.schemaHelper.setHeaders(res, "message");
            myRes.status(401).send(JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
            return;
        }

        var params = {};

        var simpleFields  = ["source", "sid"];
        del.queryHelper.parseSimpleFields(params, req, simpleFields);

        if (!params.source && !params.sid) {
            del.schemaHelper.setHeaders(myRes, "message");
            myRes.status(403).send(JSON.stringify({ "ok": false, "message": "You must provide both a source (database) and source id to use this interface."}));
            return;
        }

        // Get the current version of the record from couch
        // TODO:  Improve this. We have to use similar code in GET /product/:source/:sid, but we can't call that API without picking apart the user's cookies and resending them.
        var options = {
            url: config.couch.url + "_design/ul/_view/records",
            qs: { "key": JSON.stringify([ params.source, params.sid]) }
        };
        var request = require("request");
        request.get(options, function(error, response, body){
            if (error) {
                del.schemaHelper.setHeaders(myRes, "message");
                myRes.status(500).send(JSON.stringify({ "ok": false, "message": body.error}));
                return;
            }

            try {
                var data = JSON.parse(body);
                if (!data.rows || data.rows.length === 0) {
                    del.schemaHelper.setHeaders(myRes, "message");
                    myRes.status(404).send(JSON.stringify({ "ok": false, "message": "No record found for source '" + params.source + "' and sid '" + params.sid + "'..."}));
                    return;
                }
                var record = data.rows[0].value;

                if (record.status === "deleted") {
                    del.schemaHelper.setHeaders(myRes, "message");
                    myRes.status(403).send(JSON.stringify({ "ok": false, "message": "This record has already been deleted, cannot delete it again..."}));
                    return;
                }

                // Change the record's status to "deleted" and update it using the PUT API
                var updatedRecord = JSON.parse(JSON.stringify(record));
                updatedRecord.status = "deleted";

                var deleteOptions = {
                    "url":  del.config.couch.url + updatedRecord._id,
                    "json": updatedRecord
                };

                var deleteRequest = require("request");
                deleteRequest.put(deleteOptions, function(error, response, body){
                    if (error) {
                        del.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(500).send(JSON.stringify({ "ok": false, "message": body.error}));
                        return;
                    }

                    if (response.statusCode === 201) {
                        del.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(200).send(JSON.stringify({ "ok": true, "message": "Record deleted."}));
                    }
                    else {
                        del.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(500).send(JSON.stringify({ "ok": false, "message": body }));
                    }
                });

            }
            catch (e) {
                del.schemaHelper.setHeaders(myRes, "message");
                myRes.status(500).send(JSON.stringify({ "ok": false, "message": body }));
            }
        });
    });

    //// TODO:  Investigate why this hijacks GET calls if it's loaded before the GET module
    //del.router.delete("/*",function(req, res) { // jshint ignore:line
    //    if (!req.session || !req.session.user) {
    //        del.schemaHelper.setHeaders(res, "message");
    //        res.status(401).send(JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
    //        return;
    //    }
    //
    //    del.schemaHelper.setHeaders(res, "message");
    //    res.status(403).send(JSON.stringify({ "ok": false, "message": "You must provide both a source (database) and source id to use this interface."}));
    //});

    return del;
};