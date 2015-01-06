// API Support for GET /api/product/:source:/:id
"use strict";
module.exports=function(config){
    var fluid          = require("infusion");
    var namespace      = "gpii.ul.api.search";
    var search         = fluid.registerNamespace(namespace);

    var express        = require("express");
    search.router      = express.Router();
    search.queryHelper = require("../lib/query-helper")(config);

    // TODO: add support for versions
    // TODO: add support for paging
    // TODO: add support for mounting in "suggest" mode

    search.router.use("/",function(req, res) {
        var myRes = res;

        var params = {};

        var simpleFields  = ["q", "sort"];
        search.queryHelper.parseSimpleFields(params, req, simpleFields);

        var arrayFields  = ["status", "source"];
        search.queryHelper.parseArrayFields(params, req, arrayFields);

        var numberFields  = ["offset", "limit"];
        search.queryHelper.parseNumberFields(params, req, numberFields);

        var booleanFields = ["versions", "sources"];
        search.queryHelper.parseBooleanFields(params, req, booleanFields);

        if (!params.q) {
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
                myRes.status(500).send({ "ok": false, "message": body.error});
                return;
            }

            var data = JSON.parse(body);

            // TODO:  Get the list of full records, unified or otherwise
            myRes.status(200).send(data);
        });
    });

    return search;
};