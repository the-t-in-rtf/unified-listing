// API Support for GET /api/products
"use strict";
module.exports=function(config){
    var fluid             = require("infusion");
    var namespace         = "gpii.ul.api.products";
    var products          = fluid.registerNamespace(namespace);

    var express           = require("express");
    products.router       = express.Router();
    products.queryHelper  = require("../lib/query-helper")(config);
    products.schemaHelper = require("../../schema/lib/schema-helper")(config);

    // TODO: default to filtering out new and deleted records once we have more data
    // TODO: add support for paging (offset, limit)
    // TODO: add support for versions
    // TODO: add support for comments/annotation

    products.applyLimits = function(array, params) {
        if (!Array.isArray(array)) {
            return array;
        }

        var start  = 0;
        if (params.offset >=0 ) {
            start = params.offset;
        }

        var end = array.length - start;

        if (params.limit > 0) {
            end = start + params.limit;
        }

        return array.slice(start, end);
    };

    products.router.use("/",function(req, res) {
        var myRes = res;

        var params = {};

        var arrayFields  = ["source", "status"];
        products.queryHelper.parseArrayFields(params, req, arrayFields);

        var dateFields    = ["updated"];
        products.queryHelper.parseDateFields(params, req, dateFields);

        var booleanFields = ["versions", "sources"];
        products.queryHelper.parseBooleanFields(params, req, booleanFields);

        var numberFields  = ["offset", "limit"];
        products.queryHelper.parseNumberFields(params, req, numberFields);

        var options = {
            url: config.couch.url + "_design/ul/_view/records"
        };

        var request = require("request");
        request(options, function(error, response, body){
            if (error) {
                products.schemaHelper.setHeaders(myRes, "message");
                res.status(500).send({ "ok": false, "message": body.error});
                return;
            }

            var matchingProducts = [];

            var data = JSON.parse(body);
            if (data.rows) {
                data.rows.forEach(function(row){
                    var record = row.value;
                    var includeRecord = true;

                    // Exclude anything that doesn't match the selected status(es)
                    if (params.status && params.status.indexOf(record.status) === -1) {
                        includeRecord = false;
                    }

                    // Exclude anything that doesn't match the selected source(es)
                    if (params.source && params.source.indexOf(record.source) === -1) {
                        includeRecord = false;
                    }

                    // Exclude anything that doesn't match the selected update date
                    if (params.updated && (new Date(record.updated) < params.updated)) {
                        includeRecord = false;
                    }

                    if (includeRecord) {
                        matchingProducts.push(record);
                    }
                });
            }

            if (params.sources) {
                var uniqueKeyMap = {};
                matchingProducts.map(function(entry){ uniqueKeyMap[entry.uid] = true; });
                var keys = Object.keys(uniqueKeyMap);

                // Since we are making a second upstream request to get the unified view, we can apply our offset and limits to the list of keys and use that for the total count
                var sourceRequestOptions = {
                    url:  config.couch.url + "_design/ul/_list/unified/unified",
                    qs: { "keys": JSON.stringify(products.applyLimits(keys, params)) }
                };

                var sourceRequest = require("request");
                sourceRequest(sourceRequestOptions, function(error2, response2, body2){
                    if (error2) {
                        myRes.status(500).send({ "ok": false, "message": body2.error});
                        return;
                    }
                    var records = JSON.parse(body2);
                    products.schemaHelper.setHeaders(myRes, "records");
                    myRes.status(200).send({ "ok": true, params: params, total_rows: keys.length, records: products.applyLimits(records, params) });
                });
            }
            else {
                products.schemaHelper.setHeaders(myRes, "records");
                myRes.status(200).send({ "ok": "true", "total_rows": matchingProducts.length, "params": params, "records": products.applyLimits(matchingProducts, params)});
            }
        });


    });

    return products;
};