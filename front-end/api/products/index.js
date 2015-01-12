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

    products.router.use("/",function(req, res) {
        var myRes = res;

        var params = {};

        var arrayFields  = ["source", "status"];
        products.queryHelper.parseArrayFields(params, req, arrayFields);

        var dateFields    = ["updated"];
        products.queryHelper.parseDateFields(params, req, dateFields);

        var booleanFields = ["versions"];
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
                    if (params.status && params.status.indexOf(record.status)) {
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

            // TODO:  Figure out how to limit the upstream results by multiple parameters (including date) and pass along offset and limit instead of getting everything, then filtering and slicing the results.
            //
            // One approach is to make a view per combination of fields, keyed by field and use the "keys" parameter to limit resutls.  If we have three fields, we would 7 views keyed by fields:
            //
            // * 1
            // * 1,2
            // * 1,3
            // * 1,2,3
            // * 2
            // * 2,3
            // * 3
            //
            // You would have to use multiple startKey and endKey ranges to accomplish this, as in:
            // https://issues.apache.org/jira/browse/COUCHDB-523?focusedCommentId=14060097&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-14060097
            var start  = 0;
            if (params.offset >=0 ) {
                start = params.offset;
            }

            var end = matchingProducts.length - start;

            if (params.limit > 0) {
                end = start + params.limit;
            }

            var records = matchingProducts.slice(start, end);

            products.schemaHelper.setHeaders(myRes, "records");
            myRes.status(200).send({ "ok": "true", "total_rows": matchingProducts.length, "params": params, "records": records});
        });


    });

    return products;
};