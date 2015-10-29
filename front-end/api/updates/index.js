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
var fluid   = fluid || require("infusion");
var gpii    = fluid.registerNamespace("gpii");

var request = require("request");
var when    = require("when");

// TODO: add support for filtering by statuses
// TODO: default to filtering out new and deleted records once we have more data

fluid.registerNamespace("gpii.ul.api.updates.handler");
gpii.ul.api.updates.handler.minDate = function (dates) {
    return new Date(Math.min.apply(null, dates));
};

gpii.ul.api.updates.handler.maxDate = function (dates) {
    return new Date(Math.max.apply(null, dates));
};


gpii.ul.api.updates.handler.stringToDate = function (dateAsString) {
    return new Date(dateAsString);
};

gpii.ul.api.updates.handler.makeRecordLookupPromise = function (that, uids) {
    return when.promise(function (resolve, reject) {
        var urlWithKeys = fluid.stringTemplate(that.options.unifiedView, { keys: JSON.stringify(uids)});
        var options = {
            url: urlWithKeys
        };
        request(options, function (error2, response2, body2) {
            if (error2 || (body2 && body2.error)) {
                reject(body2 && body2.error ? body2.error : error2);
            }

            var data = JSON.parse(body2);
            resolve(data.rows);
        });
    });
};

gpii.ul.api.updates.handler.makeErrorPromise = function (that) {
    return function (error) {
        that.sendResponse(500, { ok: false, message: error});
    };
};

gpii.ul.api.updates.handler.combineArrays = function (arrayOfArrays) {
    var combined = [];
    for (var a = 0; a < arrayOfArrays.length; a++) {
        var arrayToCombine = arrayOfArrays[a];
        combined = combined.concat(arrayToCombine);
    }
    return combined;
};

gpii.ul.api.updates.handler.makeDeliverResultsPromise = function (that) {
    return function (results) {
        var records = gpii.ul.api.updates.handler.combineArrays(results);

        // TODO:  Reconcile this with the unification approach used in /api/products and /api/search
        var unifiedRecords = {};
        var sourceRecords = {};
        fluid.each(records, function (rawRecord) {
            var record = fluid.model.transformWithRules(rawRecord, that.options.rules.couchToRecord);
            if (!sourceRecords[record.uid]) {
                sourceRecords[record.uid] = [];
            }

            if (record.source === "unified") {
                record.sources = sourceRecords[record.uid];
                unifiedRecords[record.uid] = record;
            }
            else {
                sourceRecords[record.uid].push(record);
            }
        });

        // Filter by date
        var recordsFilteredByDate = [];
        fluid.each(unifiedRecords, function (cluster) {
            var includeCluster = false;
            cluster.sources.forEach(function (sourceRecord) {
                // Only compare selected sources and not all available sources
                if (that.request.matchingSources.indexOf(sourceRecord.source) !== -1) {
                    // If neither record is new enough to meet our filter criteria, we don't need to make a further comparison.
                    var maxDate = gpii.ul.api.updates.handler.maxDate([cluster.updated, sourceRecord.updated]);
                    if (!that.request.updatedSince || maxDate >= that.request.updatedSince) {
                        // filter for clusters where the source data is newer (used to track suggested changes, for example)
                        if (that.request.sourceNewer) {
                            if (sourceRecord.updated > cluster.updated) {
                                includeCluster = true;
                            }
                        }
                        // filter for clusters where the unified record is newer
                        else {
                            if (cluster.updated > sourceRecord.updated) {
                                includeCluster = true;
                            }
                        }
                    }
                }
            });

            if (includeCluster) {
                recordsFilteredByDate.push(cluster);
            }
        });

        // TODO:  Display the selected statuses in the params list
        var params = {
            "sources": that.request.matchingSources
        };
        if (that.request.updatedSince) {
            params.updated = that.request.updatedSince;
        }

        that.sendResponse(200, {
            "ok": "true",
            "total_rows": recordsFilteredByDate.length,
            "params":     params,
            "records":    recordsFilteredByDate
        });
    };
};

gpii.ul.api.updates.handler.handleRequest = function (that) {
    if (!that.request.query.source) {
        that.sendResponse(400, { "ok": false, "message": "Cannot continue with at least one &quot;source&quot; parameter.  Check the API documentation for full details."});
        return;
    }

    // We should be able to work with either a single or multiple "source" parameters
    that.request.matchingSources = Array.isArray(that.request.query.source) ? that.request.query.source : [that.request.query.source];
    that.request.updatedSince    = that.request.query.updated ? new Date(that.request.query.updated) : null;
    that.request.sourceNewer     = that.request.query.sourceNewer && that.request.query.sourceNewer === "true" ? true : false;

    // "unified" is not a meaningful choice, return an error if it's included in the list
    if (that.request.matchingSources.indexOf("unified") !== -1) {
        that.sendResponse(400, { "ok": false, "message": "Cannot compare the &quot;unified&quot; source with itself."});
        return;
    }

    // Retrieve all records for the specified source that have their "uid" field set.
    var urlWithKeys = fluid.stringTemplate(that.options.sourceView, { keys: JSON.stringify(that.request.matchingSources)});
    var options = {
        url: urlWithKeys
    };
    request(options, function (error, response, body) {
        if (error || (body && body.error)) {
            that.sendResponse(500, { "ok": false, "message": body && body.error ? body.error : error});
            return;
        }

        var data = JSON.parse(body);
        var distinctUidMap = {};
        fluid.each(data.rows, function (record) {
            distinctUidMap[record.value.uid] = true;
        });
        var distinctUids = Object.keys(distinctUidMap);

        // Get the list of unified records based on the list of UIDs.  This must be done in batches to work around the
        // 7000 character limit in query strings, which we would hit with more than ~300 keys.
        var promises = [];
        for (var a = 0; a < distinctUids.length; a += 250) {
            var batchUids = distinctUids.slice(a, a + 250);
            var promise   = gpii.ul.api.updates.handler.makeRecordLookupPromise(that, batchUids);
            promises.push(promise);
        }

        when.all(promises)
            .then(gpii.ul.api.updates.handler.makeDeliverResultsPromise(that))["catch"](gpii.ul.api.updates.handler.makeErrorPromise(that));
    });
};

fluid.defaults("gpii.ul.api.updates.request", {
    rules: {
        couchToRecord: {
            "" : "value",
            "updated": {
                transform: {
                    type:      "gpii.ul.api.updates.handler.stringToDate",
                    inputPath: "value.updated"
                }
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.updates.handler.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ul.api.updates.router", {
    gradeNames:    ["gpii.express.requestAware.router"],
    path:          "/updates",
    handlerGrades: "gpii.ul.api.updates.request",
    sourceView: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/%dbName/_design/ul/_view/bysource?keys=%keys", "{that}.options.couch"]
        }
    },
    unifiedView: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/%dbName/_design/ul/_view/unified?keys=%keys", "{that}.options.couch"]
        }
    },
    distributeOptions: [
        {
            "source": "{that}.options.sourceView",
            "target": "{that gpii.express.handler}.options.sourceView"
        },
        {
            "source": "{that}.options.unifiedView",
            "target": "{that gpii.express.handler}.options.unifiedView"
        }
    ]
});