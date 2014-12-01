// TODO:  Is it useful to wrap this in the normal boilerplate and require fluid?

/* TODO: Only look up records newer than the cache using the new lastUpdateMin parameter
    and the maximum LastUpdateDate value stored in the cache */
// http://webservices.eastin.eu/cloud4all/searches/products/listsimilarity?isoCodes=22.24.24&lastUpdateMin=2014-01-01T12:00
// The date format is yyyy-mm-ddThh:ss

var loader = require("../../config/lib/config-loader");
var config = loader.loadConfig({});

var when     = require("when");
var sequence = require("when/sequence");
var moment   = require("moment");

function retrieveData() {
    var deffereds = [];
    config.eastin.isoCodes.forEach(function(code) {
        deffereds.push(retrieveRecordsByIsoCode(code));
    });
    return when.all(deffereds);
}

function retrieveRecordsByIsoCode(isoCode) {
    var defer = when.defer();
    var request = require("request");

    var options = {
        "url": config.eastin.urls.listSimilar,
        "qs": {
            "isoCodes": isoCode
        }
    };

    //console.log("Starting to retrieve isoCode '" + isoCode + "'...");
    request(options, function (error, response, body) {
        if (error) { defer.reject(error); }
        else {
            try {
                var data = JSON.parse(body);

                // If we receive an "ExceptionMessage" object, display its contents in the console.
                if (data.ExceptionMessages) {
                    console.log("There were errors returned when retrieving records:\n" + JSON.stringify(data.ExceptionMessages, null, 2));
                }

                defer.resolve(JSON.stringify(data.Records));
            }
            catch (e) {
                console.log("Error retrieving records from '" + response.request.uri.href + "':\n");
                defer.resolve();
            }
        }
    });

    return defer.promise;
};

function allDone() {
    console.log("Finished import run.");
}

function showErrors(error) {
    console.error("Error:" + error.stack ? error.stack : error);
}

retrieveData().then(getIndividualRecords).then(processRecords).then(storeRecords).then(displayStats).catch(showErrors).done(allDone);

function getIndividualRecords(recordSets) {
    var deffereds = [];

    var uniqueIds = [];

    recordSets.forEach(function(recordSetString){
        var records = JSON.parse(recordSetString);
        records.forEach(function(record){
            var id = record.Database + record.ProductCode;
            if (uniqueIds.indexOf(id) === -1) {
                uniqueIds.push(id);
                var defer = when.defer();
                deffereds.push(defer.promise);

                var options = {
                    "url": config.eastin.urls.detail + "?database=" + record.Database + "&productCode=" + record.ProductCode
                };

                //console.log("Starting to retrieve detailed record '" + record.Database + record.ProductCode + "'...");

                var request = require("request");
                request(options, function(error, response, body){
                    // We have to make sure we are being given JSON data because EASTIN returns HTML errors at the moment.
                    try {
                        var data = JSON.parse(body);
                        // If we receive an "ExceptionMessage" object, display its contents in the console.
                        if (data.ExceptionMessages) {
                            console.log("There were errors returned when retrieving records:\n" + JSON.stringify(data.ExceptionMessages, null, 2));
                        }

                        if (error) { defer.reject(error); }
                        else { defer.resolve(JSON.stringify(data.Record)); }
                    }
                    catch (e) {
                        console.log("Error retrieving record from '" + response.request.uri.href + "':\n");
                        defer.resolve();
                    }
                });
            }
        });
    });

    return when.all(deffereds);
};

function processRecords(results) {
    console.log("processRecords:" + results.length);
    var deffereds = [];
    results.forEach(function(result) {
        var defer = when.defer();
        deffereds.push(defer.promise);

        try {
            var record   = JSON.parse(result);

            // TODO:  Once we have data, we have to see if we have the record already

            // TODO:  Check for similarity with existing records and combine as needed

            // TODO:  Create a placeholder record for anything we don't have (which is everything at the moment)

            // TODO:  Convert the .NET dates to ISO 8601
            //       "LastUpdateDate" : "/Date(1414623600000+0100)/",
            //       "InsertDate" :     "/Date(1070233200000+0100)/",
            var dateFields = ["LastUpdateDate","InsertDate"];
            dateFields.forEach(function(field){
                record[field] = moment(record[field]).format();
            });

            // TODO:  Pass along the modified record from this point on instead of what we were sent.
            defer.resolve(JSON.stringify(record));
        } catch (e) {
            console.log("Can't retrieve details for invalid record '" + result + "'...\n");
            defer.resolve();
        }
    });
    return when.all(deffereds);
};

function storeRecords(results) {
    console.log("storeRecords:" + results.length);
    var deferreds = [];
    var records = [];

    results.forEach(function(result) {
        var defer = when.defer();
        deferreds.push(defer.promise);


        try {
            var record = JSON.parse(result);
            records.push(record);

            defer.resolve(JSON.stringify(record));
        } catch (e) {
            console.log("Can't store invalid record '" + result + "'...\n");
            defer.resolve();
        }
    });


    var fs = require("fs");
    var fd = fs.openSync(config.eastin.cacheFile, "w");
    var stringData = JSON.stringify(records, null, 2);
    var buffer = new Buffer(stringData)
    fs.writeSync(fd, buffer, 0, buffer.length);
    fs.closeSync(fd);

    return when.all(deferreds);
};

// TODO:  Display statistics on what has been gathered, for sanity checking purposes
function displayStats(results) {
    // Pass what we received through in case we want to chain the function later...
    var defer = when.defer();
    defer.resolve(results);

    console.log("displayStats:" + results.length);

    var uniqueIds        = {};
    var recordsByDb      = {};
    var recordsByIsoCode = {};

    results.forEach(function(result){
        // TODO:  Figure out a better way to avoid undefined records.
        if (result) {
            try {
                var record = JSON.parse(result);

                // Track distinct IDs versus total records
                var id = record.Database + record.ProductCode;
                if (!uniqueIds[id] || uniqueIds[id] === undefined) {
                    uniqueIds[id] = true;
                    recordsByDb[record.Database] ? recordsByDb[record.Database]++ : recordsByDb[record.Database] = 1;
                }

                debugger;
                // Track the number of records by primary and optional isoCode
                if (record.IsoCodePrimary) {
                    var code = standardizeIsoCode(record.IsoCodePrimary.Code);
                    // Only track canonical codes for now
                    if (config.eastin.isoCodes.indexOf(code) !== -1) {
                        if (!recordsByIsoCode[code]) { recordsByIsoCode[code] = {};}
                        recordsByIsoCode[code][id] = true;
                    }
                }
                if (record.IsoCodesOptional && record.IsoCodesOptional.length > 0) {
                    // Only track canonical codes for now
                    record.IsoCodesOptional.forEach(function(isoCode) {
                        if (isoCode.Code) {
                            var code = standardizeIsoCode(isoCode.Code);
                            if (config.eastin.isoCodes.indexOf(code) !== -1) {
                                if (!recordsByIsoCode[code]) { recordsByIsoCode[code] = {};}
                                recordsByIsoCode[code][id] = true;
                            }
                        }
                    });
                }
            } catch (e) {
                debugger;
                console.log("Error processing stats:" + e.stack);
            }
        }
    });

    // Compare the total number of records to the number of unique IDs (database + product code)
    console.log("Found " + results.length + " records (" + Object.keys(uniqueIds).length + " unique and non-null)...");

    // Display the number of unique records by database
    console.log("Unique record count, by database:");
    Object.keys(recordsByDb).forEach(function(db) {
        console.log("\t" + db + ": " + recordsByDb[db]);
    });

    console.log("Records, by ISO 9999 Code:");
    Object.keys(recordsByIsoCode).forEach(function(isoCode) {
        console.log("\t" + isoCode + ": " + Object.keys(recordsByIsoCode[isoCode]).length);
    });

    return defer.promise;
};

function standardizeIsoCode(code) {
    if (!code) return code;

    return code.match(/\./) ? code : code.replace(/(\d\d)(\d\d)(\d\d)/,"$1.$2.$3");
}