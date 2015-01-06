// API Support for GET /api/product/:source:/:id
"use strict";
module.exports=function(config){
    var fluid       = require("infusion");
    var namespace   = "gpii.ul.api.products.get";
    var get         = fluid.registerNamespace(namespace);

    var express     = require("express");
    get.router      = express.Router();
    get.queryHelper = require("../../lib/query-helper")(config);

    // TODO: add support for versions
    get.router.use("/",function(req, res) {
        var myRes = res;

        var params = {};

        var simpleFields  = ["q", "sort"];
        get.queryHelper.parseSimpleFields(params, req, simpleFields);

        if (!params.source && !params.sid) {
            res.status(403).send({ "ok": false, "message": "You must provide both a source (database) and source id to use this interface."});
            return;
        }

        var booleanFields = ["versions", "sources"];
        get.queryHelper.parseBooleanFields(params, req, booleanFields);

        var options = {
            url: config.couch.url + "/_design/ul/_view/records",
            qs: { "key": JSON.stringify([ params.source, params.sid]) }
        };

        var request = require("request");
        request(options, function(error, response, body){
            if (error) {
                myRes.status(500).send({ "ok": false, "message": body.error});
                return;
            }

            var data = JSON.parse(body);
            if (!data.rows || data.rows.length === 0) {
                myRes.status(404).send({ "ok": false, "message": "No record found for source '" + params.source + "' and sid '" + params.sid + "'..."});
                return;
            }
            else if (data.rows.length > 1) {
                myRes.status(500).send({ "ok": false, "message": "More than one record found for source '" + params.source + "' and sid '" + params.sid + "'..."});
                return;
            }


            var record = data.rows[0].value;
            if (params.sources && record.source === "unified") {
                if (!record.sid) {
                    myRes.status(500).send({ "ok": false, "message": "Cannot group records by source without a UID value."});
                    return;
                }

                var sourceRequest = require("request");
                // http://localhost:5984/ul/_design/ul/_list/unified/unified?key=%221420467546922-336%22
                var sourceOptions = {
                    url: config.couch.url + "/_design/ul/_list/unified/unified",
                    qs: { "key": JSON.stringify(record.uid) }
                };
                sourceRequest(sourceOptions, function(error, response, body) {
                    if (error) {
                        myRes.status(500).send({ "ok": false, "message": body.error});
                        return;
                    }

                    var data = JSON.parse(body);
                    if (!data || data.length === 0) {
                        myRes.status(404).send({ "ok": false, "message": "No unified record found for uid '" + record.uid+ "'..."});
                        return;
                    }

                    myRes.status(200).send({ "ok": "true", "record": data[0]});
                });
            }
            else {
                myRes.status(200).send({ "ok": "true", "record": record});
            }
        });
    });

    return get;
};