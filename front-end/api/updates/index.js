// API support for "update" detection, where one or more sources are compared to the "unified" record.  Used to prepare
// a report of updates so that vendors can see new content from other sources.
//
// By default, returns the list of unified records that are newer than the source.  If the `sourceNewer` param is set to
// `true`, returns the list of unified records that are older than the source.
//
// Both sets can be optionally filtered to only return changes after a set point by adding the `updated` parameter,
// which should be a date in ISO 9660 format.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

// TODO: add support for filtering by statuses
// TODO: default to filtering out new and deleted records once we have more data

require("../lib/hash-helper");

fluid.registerNamespace("gpii.ul.api.updates.request");
gpii.ul.api.updates.request.handleRequest = function (that) {
    if (!that.request.query.source) {
        that.sendResponse(400, { "ok": false, "message": "Cannot continue with at least one &quot;source&quot; parameter.  Check the API documentation for full details."});
        return;
    }

    // We should be able to work with either a single or multiple "source" parameters
    var matchingSources = Array.isArray(that.request.query.source) ? that.request.query.source : [that.request.query.source];
    var updatedSince    = that.request.query.updated ? new Date(that.request.query.updated) : null;

    // "unified" is not a meaningful choice, return an error if it's included in the list
    if (matchingSources.indexOf("unified") !== -1) {
        that.sendResponse(400, { "ok": false, "message": "Cannot compare the &quot;unified&quot; source with itself."});
        return;
    }

    // TODO: Make this configurable when it's meaningful, i.e. when someone can reasonably change what is done with the records using the configuration
    var options = {
        url: that.options.config.couch.url + "/_design/ul/_list/unified/unified"
    };
    var request = require("request");
    request(options, function(error, response, body){
        if (error) {
            that.sendResponse(500, { "ok": false, "message": body.error});
            return;
        }

        // Filter by source first
        var records = JSON.parse(body);
        var recordsFilteredBySource = records.filter(function (cluster){
            var includeRecord = false;
            if (cluster.sources) {
                cluster.sources.forEach(function(sourceRecord){
                    if (matchingSources.indexOf(sourceRecord.source) !== -1) {
                        includeRecord = true;
                    }
                });
            }
            return includeRecord;
        });

        // Now filter by the date of update
        var recordsFilteredByDate = recordsFilteredBySource.filter(function (cluster){
            var includeCluster = false;
            cluster.sources.forEach(function (sourceRecord){
                // Only compare selected sources and not all available sources
                if (matchingSources.indexOf(sourceRecord.source) !== -1) {
                    // filter for clusters where the source data is newer (used to track suggested changes, for example)
                    if (that.request.query.sourceNewer) {
                        if (new Date(sourceRecord.updated) > new Date(cluster.updated) && new Date(sourceRecord.updated) > updatedSince) {
                            includeCluster = true;
                        }
                    }
                    // filter for clusters where the unified record is newer
                    else {
                        if (new Date(cluster.updated) > new Date(sourceRecord.updated) && new Date(cluster.updated) > updatedSince) {
                            includeCluster = true;
                        }
                    }
                }
            });

            return includeCluster;
        });

        // TODO:  Display the selected statuses in the params list
        var params = {
            "sources": matchingSources
        };
        if (updatedSince) {
            params.updated = updatedSince;
        }

        // TODO: The Couchdb data source should be responsible for this bit of cleanup.
        var recordsMinusCouchisms = gpii.ul.api.helpers.hash.omitFromObject(recordsFilteredByDate, ["_id", "_rev"], true);

        that.sendResponse(200, { "ok": "true", "total_rows": recordsMinusCouchisms.length, "params": params, "records": recordsMinusCouchisms });
    });
};

fluid.defaults("gpii.ul.api.updates.request", {
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.updates.request.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ul.api.updates.router", {
    gradeNames:    ["gpii.express.requestAware.router"],
    path:          "/updates",
    timeout:       30000, // TODO:  Profile this and figure out why the live version takes so long.
    handlerGrades: "gpii.ul.api.updates.request",
    dynamicComponents: {
        requestHandler: {
            options: {
                config: "{router}.options.config"
            }
        }
    }
});