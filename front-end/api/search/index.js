// API Support for GET /api/product/:source:/:id
"use strict";
module.exports=function(config, quick){
    var fluid           = require("infusion");
    var mode            = quick ? "suggest" : "search";
    var namespace       = "gpii.ul.api." + mode;
    var search          = fluid.registerNamespace(namespace);

    var express         = require("express");
    search.arrayHelper  = require("../lib/array-helper")(config);
    search.queryHelper  = require("../lib/query-helper")(config);
    search.router       = express.Router();
    search.schemaHelper = require("../../schema/lib/schema-helper")(config);

    // TODO: add support for versions
    // TODO: test and fix sorting for "sources=true"

    search.router.use("/",function(req, res) {
        var myRes = res;

        var params = {};

        var simpleFields  = ["q", "sort"];
        search.queryHelper.parseSimpleFields(params, req, simpleFields);

        var arrayFields  = ["status", "source"];
        search.queryHelper.parseArrayFields(params, req, arrayFields);

        if (quick) {
            params.offset = 0;
            params.limit  = 5;
        }
        else {
            var numberFields  = ["offset", "limit"];
            search.queryHelper.parseNumberFields(params, req, numberFields);
        }
        debugger;
        var booleanFields = ["versions", "sources"];
        search.queryHelper.parseBooleanFields(params, req, booleanFields);

        if (!params.q) {
            search.schemaHelper.setHeaders(res, "message");
            res.status(403).send({ "ok": false, "message": "You must provide a query string to use this interface."});
            return;
        }


        var query = "("+params.q+")";
        if (params.source) {
            query += " AND (source:" + params.source.join(" OR source:") + ") ";
        }
        if (params.status) {
            query += " AND (status:" + params.status.join(" OR status:") + ") ";
        }

        var queryParams = {
            "q": query
        };

        if (params.sort) {
            queryParams.sort = params.sort;
        }

        var options = {
            url: config.couch.luceneUrl,
            qs:  queryParams
        };

        var request = require("request");
        request(options, function(error, response, body){
            if (error) {
                search.schemaHelper.setHeaders(myRes, "message");
                myRes.status(500).send({ "ok": false, "message": (body && body.error) ? body.error : error });
                return;
            }

            var data = JSON.parse(body);

            if (params.sources) {
                var uids = data.rows.map(function(value){
                    return value.fields.uid;
                });
                var keys = search.arrayHelper.applyLimits(uids, params);
                var sourcesOptions =  {
                    url:  config.couch.url + "_design/ul/_list/unified/unified",
                    qs: { "keys": JSON.stringify(keys) }
                };
                var sourceRequest = require("request");
                sourceRequest(sourcesOptions, function(error, response, body){
                    if (error) {
                        search.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(500).send({ "ok": false, "message": body.error});
                        return;
                    }
                    var records = JSON.parse(body);
                    search.schemaHelper.setHeaders(myRes, "search");
                    myRes.status(200).send({ "ok": true, params: params, total_rows: records.length, records: records });
                });
            }
            else {
                var keys = data.rows.map(function(value){
                    return [value.fields.source, value.fields.sid];
                });
                var limitedKeys = search.arrayHelper.applyLimits(keys, params);
                debugger;
                var recordOptions =  {
                    url:  config.couch.url + "_design/ul/_view/records",
                    qs: { "keys": JSON.stringify(limitedKeys) }
                };
                var recordRequest = require("request");
                recordRequest(recordOptions, function(error, response, body){
                    if (error) {
                        search.schemaHelper.setHeaders(myRes, "message");
                        myRes.status(500).send({ "ok": false, "message": body.error});
                        return;
                    }
                    var data = JSON.parse(body);
                    var records = (data && data.rows) ? data.rows.map(function(row){ return row.value; }) : [];
                    search.schemaHelper.setHeaders(myRes, "search");
                    myRes.status(200).send({ "ok": true, params: params, total_rows: records.length, records: records });
                });
            }
        });
    });

    return search;
};