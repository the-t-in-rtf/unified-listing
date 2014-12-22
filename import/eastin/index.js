"use strict";
var fluid  = require("infusion");
var eastin = fluid.registerNamespace("gpii.ul.importers.eastin");

/* TODO: Only look up records newer than the cache using the new lastUpdateMin parameter
 and the maximum LastUpdateDate value stored in the cache */
// http://webservices.eastin.eu/cloud4all/searches/products/listsimilarity?isoCodes=22.24.24&lastUpdateMin=2014-01-01T12:00
// The date format is yyyy-mm-ddThh:ss

eastin.loader           = require("../../config/lib/config-loader");
eastin.config           = eastin.loader.loadConfig({});
eastin.existingRecords  = {};

var when = require("when");
var sequence = require("when/sequence");
var moment = require("moment");

function standardizeIsoCode(code) {
    if (!code) {
        return code;
    }

    return code.match(/\./) ? code : code.replace(/(\d\d)(\d\d)(\d\d)/, "$1.$2.$3");
}

function retrieveRecordsByIsoCode(isoCode) {
    var defer = when.defer();
    var request = require("request");

    var options = {
        "url": eastin.config.eastin.urls.listSimilar,
        "qs": {
            "isoCodes": isoCode
        }
    };

    //console.log("Starting to retrieve isoCode '" + isoCode + "'...");
    request(options, function (error, response, body) {
        if (error) {
            defer.reject(error);
        }
        else {
            try {
                var data = JSON.parse(body);

                // If we receive an "ExceptionMessage" object, display its contents in the console.
                if (!data.Ok && data.ExceptionMessages) {
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
}

function retrieveData() {
    var defereds = [];
    eastin.config.eastin.isoCodes.forEach(function (code) {
        defereds.push(retrieveRecordsByIsoCode(code));
    });
    return when.all(defereds);
}

function allDone() {
    console.log("Finished import run.");
}

function showErrors(error) {
    console.error("Error:" + error.stack ? error.stack : error);
}

function getIndividualRecords(recordSets) {
    var deferrals = [];

    var uniqueIds = [];

    recordSets.forEach(function (recordSetString) {
        var records = JSON.parse(recordSetString);
        records.forEach(function (record) {
            var id = record.Database + record.ProductCode;
            if (uniqueIds.indexOf(id) === -1) {
                uniqueIds.push(id);
                var defer = when.defer();
                deferrals.push(defer.promise);

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
                            defer.reject(error);
                        }
                        else {
                            defer.resolve(JSON.stringify(data.Record));
                        }
                    }
                    catch (e) {
                        console.log("Error retrieving record from '" + response.request.uri.href + "':\n");
                        defer.resolve();
                    }
                });
            }
        });
    });

    return when.all(deferrals);
}

function processRecords(results) {
    console.log("processRecords:" + results.length);
    var deferrals = [];
    results.forEach(function (result) {
        var defer = when.defer();
        deferrals.push(defer.promise);

        try {
            var record = JSON.parse(result);

            // TODO:  Once we have data, we have to see if we have the record already

            // TODO:  Check for similarity with existing records and combine as needed

            // TODO:  Create a placeholder record for anything we don't have (which is everything at the moment)

            // Convert the .NET dates to ISO 8601
            //       "LastUpdateDate" : "/Date(1414623600000+0100)/",
            //       "InsertDate" :     "/Date(1070233200000+0100)/",
            var dateFields = ["LastUpdateDate", "InsertDate"];
            dateFields.forEach(function (field) {
                record[field] = moment(record[field]).format();
            });


            // Transform the format EASTIN give us into the local storage format.
            // TODO:  Investigate using a FLUID transformer to do this
            // UL, EASTIN
            // name, CommercialName
            // description, EnglishDescription
            // source, Database
            // sid, ProductCode
            // manufacturer.name, ManufacturerOriginalFullName
            // manufacturer.address, ManufacturerAddress
            // manufacturer.postalCode, ManufacturerPostalCode
            // manufacturer.cityTown, ManufacturerTown
            // manufacturer.country, ManufacturerCountry
            // manufacturer.phone, ManufacturerPhone
            // manufacturer.email, ManufacturerEmail
            // manufacturer.url, ManufacturerWebSiteUrl
            // ontologies.iso9999.IsoCodePrimary, IsoCodePrimary
            // ontologies.iso9999.IsoCodesSecondary, IsoCodesSecondary
            // updated, LastUpdateDate

            var ulRecord = {
                "status": "new",
                "language": eastin.config.eastin.databases[record.Database].language,
                "name": record.CommercialName,
                "description": record.EnglishDescription,
                "source": record.Database,
                "sid": record.ProductCode,
                "manufacturer": {
                    "name": record.ManufacturerOriginalFullName,
                    "address": record.ManufacturerAddress,
                    "postalCode": record.ManufacturerPostalCode,
                    "cityTown": record.ManufacturerTown,
                    "country": record.ManufacturerCountry,
                    "phone": record.ManufacturerPhone,
                    "email": record.ManufacturerEmail,
                    "url": record.ManufacturerWebSiteUrl
                },
                "ontologies": {
                    "iso9999": {
                        "IsoCodePrimary": record.IsoCodePrimary,
                        "IsoCodesOptional": record.IsoCodesOptional
                    }
                },
                "sourceData": record,
                "updated": record.LastUpdateDate
            };

            // Pass along the unified record from this point on instead of what we were sent.
            defer.resolve(JSON.stringify(ulRecord));
        } catch (e) {
            console.log("Can't retrieve details for invalid record '" + result + "'...\n");
            defer.resolve();
        }
    });
    return when.all(deferrals);
}

function generateStoreRecordFunction(recordString) {
    return function() {
        var defer = when.defer();

        try {
            var record = JSON.parse(recordString);

            var options = { url: eastin.config.couch.url, "json": true, "body": record };

            // record exists, update it...
            var existingRecord = eastin.existingRecords[record.source + ":" + record.sid];
            if (existingRecord) {
                // TODO:  Check to see if there are any differences between the records using the sourceRecord field
                options.method = "PUT";

                // Clone the system-managed fields
                record._id    = existingRecord._id;
                record._rev   = existingRecord._rev;
                record.status = existingRecord.status;
                record.uid    = existingRecord.uid;
            }
            // record doesn't exist, create it...
            else {
                options.method = "POST";
                record.status  = "new";
            }

            // TODO:  Convert to using our API once it exists
            // Store the record in CouchDB
            var request = require("request");
            request(options, function(error, response, body) {
                if (error) {
                    console.error(error);
                }

                // TODO:  Pass back the record we get from the API instead of the original
                defer.resolve(JSON.stringify(record));
            });

        } catch (e) {
            console.log("Can't store invalid record '" + recordString + "...'...\n");
            console.error(e);
            defer.resolve();
        }

        return defer.promise;
    };
}

function storeRecords(results) {
    console.log("storeRecords:" + results.length);
    var deferrals = [];

    results.forEach(function (result) {
        deferrals.push(when(result, generateStoreRecordFunction));
    });

    return sequence(deferrals);
}

function storeRecordFile(results) {
    var defer = when.defer();
    var records = [];

    results.forEach(function(result) {
        try {
            var record = JSON.parse(result);
            records.push(record);
        } catch (e) {
            console.log("Can't save invalid record to file '" + result + "'...\n");
        }
    });

    var fs = require("fs");
    var fd = fs.openSync(eastin.config.eastin.cacheFile, "w");
    var stringData = JSON.stringify(records, null, 2);
    var buffer = new Buffer(stringData);
    fs.writeSync(fd, buffer, 0, buffer.length);
    fs.closeSync(fd);

    // Pass through the data we received
    defer.resolve(results);

    return defer.promise;
}

function loadExistingRecords(results) {
    var defer = when.defer();

    var request = require("request");
    var options = { url: eastin.config.couch.url + "_design/ul/_view/records", method: "GET" };
    request(options, function(error, response, body) {
        if (error) {
            console.error(error);
        }

        var jsonData = JSON.parse(body);
        jsonData.rows.forEach(function(row){
            var record = row.value;
            if (record && record.source && record.sid) {
                eastin.existingRecords[record.source + ":" + record.sid] = record;
            }
        });

        // Pass what we received through in case we want to chain the function later...
        defer.resolve(results);
    });

    return defer.promise;
}

//  Display statistics on what has been gathered, for sanity checking purposes
function displayStats(results) {
    // Pass what we received through in case we want to chain the function later...
    var defer = when.defer();
    defer.resolve(results);

    console.log("displayStats:" + results.length);

    var uniqueIds = {};
    var recordsByDb = {};
    var recordsByIsoCode = {};

    results.forEach(function (result) {
        // TODO:  Figure out a better way to avoid undefined records.
        if (result) {
            try {
                var record = JSON.parse(result);

                // Track distinct IDs versus total records
                var id = record.source + record.sid;
                if (!uniqueIds[id] || uniqueIds[id] === undefined) {
                    uniqueIds[id] = true;
                    if (recordsByDb[record.source]) {
                        recordsByDb[record.source]++;
                    } else {
                        recordsByDb[record.source] = 1;
                    }
                }

                // Track the number of records by primary and optional isoCode
                if (record.ontologies.iso9999.IsoCodePrimary) {
                    var code = standardizeIsoCode(record.ontologies.iso9999.IsoCodePrimary.Code);
                    // Only track canonical codes for now
                    if (eastin.config.eastin.isoCodes.indexOf(code) !== -1) {
                        if (!recordsByIsoCode[code]) {
                            recordsByIsoCode[code] = {};
                        }
                        recordsByIsoCode[code][id] = true;
                    }
                }
                if (record.ontologies.iso9999.IsoCodesOptional && record.ontologies.iso9999.IsoCodesOptional.length > 0) {
                    // Only track canonical codes for now
                    record.ontologies.iso9999.IsoCodesOptional.forEach(function (isoCode) {
                        if (isoCode.Code) {
                            var code = standardizeIsoCode(isoCode.Code);
                            if (eastin.config.eastin.isoCodes.indexOf(code) !== -1) {
                                if (!recordsByIsoCode[code]) {
                                    recordsByIsoCode[code] = {};
                                }
                                recordsByIsoCode[code][id] = true;
                            }
                        }
                    });
                }
            } catch (e) {
                console.log("Error processing stats:" + e.stack);
            }
        }
    });

    // Compare the total number of records to the number of unique IDs (database + product code)
    console.log("Found " + results.length + " records (" + Object.keys(uniqueIds).length + " unique and non-null)...");

    // Display the number of unique records by database
    console.log("Unique record count, by database:");
    Object.keys(recordsByDb).forEach(function (db) {
        console.log("\t" + db + ": " + recordsByDb[db]);
    });

    console.log("Records, by ISO 9999 Code:");
    Object.keys(recordsByIsoCode).forEach(function (isoCode) {
        console.log("\t" + isoCode + ": " + Object.keys(recordsByIsoCode[isoCode]).length);
    });

    return defer.promise;
}

function cacheExists() {
    var fs = require("fs");
    return fs.existsSync(eastin.config.eastin.cacheFile);
}

function loadDataFromCache() {
    var data = require(eastin.config.eastin.cacheFile);

    // Return the records as individual promises so that the chain matches the live EASTIN import...
    var deferrals = [];
    data.forEach(function (record) {
        deferrals.push(JSON.stringify(record));
    });

    return when.all(deferrals);
}

if (cacheExists()) {
    console.log("Working from cache, remove cache to retrieve records from EASTIN...");
    loadDataFromCache().then(loadExistingRecords).then(storeRecords).then(displayStats).catch(showErrors).done(allDone);
}
else {
    /* jshint -W024 */
    retrieveData().then(getIndividualRecords).then(processRecords).then(loadExistingRecords).then(storeRecords).then(storeRecordFile).then(displayStats).catch(showErrors).done(allDone);
}
