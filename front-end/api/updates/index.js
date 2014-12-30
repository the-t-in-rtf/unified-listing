// API support for "update" detection, where one or more sources are compared to the "unified" record.
"use strict";
module.exports=function(config){
    var express = require("express");
    var router = express.Router();

    // TODO: add support for filtering by statuses
    // TODO: default to filtering out new and deleted records once we have more data

    router.use("/",function(req, res) {
        var myRes = res;
        if (!req.query.source) {
            res.status(400).send({ "ok": false, "message": "Cannot continue with at least one &quot;source&quot; parameter.  Check the API documentation for full details."});
            return;
        }

        // We should be able to work with either a single or multiple "source" parameters
        var matchingSources = Array.isArray(req.query.source) ? req.query.source : [req.query.source];
        var updatedSince    = req.query.updated ? new Date(req.query.updated) : null;

        // "unified" is not a meaningful choice, return an error if it's included in the list
        if (matchingSources.indexOf("unified") !== -1) {
            res.status(400).send({ "ok": false, "message": "Cannot compare the &quot;unified&quot; source with itself."});
            return;
        }

        // TODO: Make this configurable when it's meaningful, i.e. when someone can reasonably change what is done with the records using the configuration
        var options = {
            url: config.couch.url + "/_design/ul/_list/unified/unified-clustered"
        };
        var request = require("request");
        request(options, function(error, response, body){
            if (error) {
                res.status(500).send({ "ok": false, "message": body.error});
                return;
            }

            var matchingClusters = [];

            var records = JSON.parse(body);
            records.forEach(function(cluster){
                if (cluster.sources) {
                    var unifiedUpdated = new Date(cluster.updated);
                    if (!updatedSince || unifiedUpdated >= updatedSince) {
                        var includeCluster = false;
                        cluster.sources.forEach(function(sourceRecord){
                            if (!includeCluster) {
                                if (matchingSources.indexOf(sourceRecord.source) !== -1 && new Date(sourceRecord.updated) < unifiedUpdated ) {
                                    includeCluster = true;
                                }
                            }
                        });

                        if (includeCluster) {
                            matchingClusters.push(cluster);
                        }
                    }
                }
            });

            // TODO:  Add support for paging
            myRes.status(200).send({ "ok": "true", "records": matchingClusters});
        });


    });
    return router;
};