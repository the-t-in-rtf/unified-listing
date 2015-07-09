"use strict";
var fluid  = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var eastin = fluid.registerNamespace("gpii.ul.imports.eastin");

// This is the component we are moving everything into over time.
require("./runner");

/* TODO: Only look up records newer than the cache using the new lastUpdateMin parameter
 and the maximum LastUpdateDate value stored in the cache */
// http://webservices.eastin.eu/cloud4all/searches/products/listsimilarity?isoCodes=22.24.24&lastUpdateMin=2014-01-01T12:00
// The date format is yyyy-mm-ddThh:ss

eastin.loader           = require("../../../../config/lib/config-loader");
eastin.config           = eastin.loader.loadConfig({});
eastin.existingRecords  = {};

function getRetrieveRecordListByIsoCodeFunction(isoCode) {
    var myIsoCode = isoCode;
    return function retrieveRecordListByIsoCode() {
        var promise = fluid.promise();
        var request = require("request");

        var options = {
            "url": eastin.config.eastin.urls.listSimilar,
            "qs": {
                "isoCodes": myIsoCode
            }
        };

        //console.log("Starting to retrieve isoCode '" + isoCode + "'...");
        request(options, function (error, response, body) {
            if (error) {
                promise.reject(error);
            }
            else {
                try {
                    var data = JSON.parse(body);

                    // If we receive an "ExceptionMessage" object, display its contents in the console.
                    if (!data.Ok && data.ExceptionMessages) {
                        console.log("There were errors returned when retrieving records:\n" + JSON.stringify(data.ExceptionMessages, null, 2));
                    }

                    promise.resolve(JSON.stringify(data.Records));
                }
                catch (e) {
                    console.log("Error retrieving records from '" + response.request.uri.href + "':\n");
                    // TODO:  This exactly why we end up with blank records when there is an error.  Find a better way.
                    promise.resolve();
                }
            }
        });

        return promise;
    };
}

function getRetrieveAllRecordsByIsoCodeFunction() {
    return function getIsoCodeRecordLists() {
        var deferrals = [];
        eastin.config.eastin.isoCodes.forEach(function (code) {
            deferrals.push(getRetrieveRecordListByIsoCodeFunction(code));
        });
        return fluid.promise.sequence(deferrals);
    };
}

function getRetrieveIndividualRecordsFunction() {
    return function retrieveIndividualRecords(results) {
        var deferrals = [];

        var uniqueIds = [];

        results.forEach(function (recordSetString) {
            var records = JSON.parse(recordSetString);
            records.forEach(function (record) {
                var id = record.Database + record.ProductCode;
                if (uniqueIds.indexOf(id) === -1) {
                    uniqueIds.push(id);

                    var promise = fluid.promise();
                    deferrals.push(promise);

                    var options = {
                        "url": eastin.config.eastin.urls.detail + "?database=" + record.Database + "&productCode=" + record.ProductCode
                    };

                    //console.log("Starting to retrieve detailed record '" + record.Database + record.ProductCode + "'...");

                    var request = require("request");
                    request(options, function (error, response, body) {
                        // We have to make sure we are being given JSON data because EASTIN returns HTML errors at the moment.
                        try {
                            var data = JSON.parse(body);
                            // If we receive an "ExceptionMessage" object, display its contents in the console.
                            if (data.ExceptionMessages) {
                                console.log("There were errors returned when retrieving records:\n" + JSON.stringify(data.ExceptionMessages, null, 2));
                            }

                            if (error) {
                                promise.reject(error);
                            }
                            else {
                                promise.resolve(JSON.stringify(data.Record));
                            }
                        }
                        catch (e) {
                            console.log("Error retrieving record from '" + response.request.uri.href + "':\n");
                            promise.resolve();
                        }
                    });
                }
            });
        });

        return fluid.promise.sequence(deferrals);
    };
}

// TODO:  I am gradually replacing the existing functions with fluid components.  When all are replaced, we will collapse these into a single component with sub-components and wire together all events.
function getTransformAndSyncFunction() {
    return function transformAndSync (results) {
        var promise = fluid.promise();

        var runner = gpii.ul.imports.eastin.runner({
            members: {
                promise: promise
            },
            listeners: {
                "{syncer}.events.onSyncComplete": {
                    funcName: "{that}.promise.resolve",
                    args: ["{that}.model.processedData"]
                }
            }
        });

        runner.applier.change("rawData", results);

        return promise;
    };
}

function getCacheSaveFunction() {
    return function saveCache (results) {
        var promise = fluid.promise();
        var records = [];

        results.forEach(function(result) {
            try {
                var record = JSON.parse(result);
                records.push(record);
            } catch (e) {
                console.log("Can't save invalid record to file '" + result + "'...\n");
            }
        });

        // TODO:  Clean this up upstream
        // A safety check to clean up null "records" that are actually failed communication attempts.
        var nonNullRecords = records.filter(function(entry){ return entry !== null; });

        var fs = require("fs");
        var fd = fs.openSync(eastin.config.eastin.cacheFile, "w");
        var stringData = JSON.stringify(nonNullRecords, null, 2);
        var buffer = new Buffer(stringData);
        fs.writeSync(fd, buffer, 0, buffer.length);
        fs.closeSync(fd);

        promise.resolve(nonNullRecords);

        return promise;
    };
}

function cacheExists() {
    var fs = require("fs");
    return fs.existsSync(eastin.config.eastin.cacheFile);
}

function getCacheLoadFunction() {
    return function loadCache () {
        var promise = fluid.promise();

        console.log("Working from cache, remove cache to retrieve records from EASTIN...");

        var data = require(eastin.config.eastin.cacheFile);
        promise.resolve(data);
        return promise;
    };
}

// We must manually chain these, as fluid.promise.sequence does not send results from one promise to the next.
// TODO:  We should be able to get rid of this entirely once we have a complete component driven by events and modelListeners
if (cacheExists()) {
    // TODO: As none of these functions are variable, collapse them down one level
    getCacheLoadFunction()()
        .then(getTransformAndSyncFunction());
}
else {
    // TODO: As none of these functions are variable, collapse them down one level
    var retrieveIdsByIso = getRetrieveAllRecordsByIsoCodeFunction();
    var retrieveIndividualRecords = getRetrieveIndividualRecordsFunction();
    var cacheAndSave = getCacheSaveFunction();
    var transformAndSync = getTransformAndSyncFunction();
    retrieveIdsByIso()
        .then(retrieveIndividualRecords)
        .then(cacheAndSave)
        .then(transformAndSync);
}

