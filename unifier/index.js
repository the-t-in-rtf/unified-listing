/*
    Go through a data set and find similar records as outlined in:
    http://wiki.gpii.net/w/Algorithm_for_product_similarity

 */
"use strict";
var fluid                 = require("infusion");
var unifier               = fluid.registerNamespace("gpii.ul.unifier");

// TODO:  Make this work with something other than EASTIN once we have multiple data sources
var loader                = require("../config/lib/config-loader");
unifier.config            = loader.loadConfig({});

var when = require("when");
var sequence = require("when/sequence");

unifier.scorer            = require("./scorer")(unifier.config);
unifier.sanitizer         = require("./sanitizer")(unifier.config);
unifier.tokenizer         = require("./tokenizer")(unifier.config);
unifier.grouper           = require("./grouper")(unifier.config);
unifier.resolver          = require("./resolver")(unifier.config);

// TODO:  Talk with Antranig about kettle-less server-side FLUID components and refactor to use those instead of this.


// Build a list of record combinations that share at least one word, so that we can exclude totally unique records up front.
// Checking the company and product names up front takes care of over 90% of the similarity matching and requires only 1% of the computing effort
unifier.generateOptimizedCombos = function() {
    var wordMap = {};
    Object.keys(unifier.config.eastin.compareFields.byTokens).forEach(function(key){
        var settings = unifier.config.eastin.compareFields.byTokens[key];
        if (wordMap[settings.field] === undefined) { wordMap[settings.field] = {};}

        Object.keys(unifier.dataById).forEach(function(id){
            var record = unifier.dataById[id];

            // Tokenize the field and convert to lower case
            var value  = unifier.resolver.resolve(record, settings.field);
            var tokens = unifier.sanitizer.toLowerCase(unifier.tokenizer.tokenize(value));

            // Iterate through and build a map of all records with common tokens
            tokens.forEach(function(token){
                if (wordMap[settings.field][token] === undefined) { wordMap[settings.field][token] = [];}
                if (wordMap[settings.field][token].indexOf(id) === -1 ) {
                    wordMap[settings.field][token].push(id);
                }
            });
        });
    });

    var comboMap = {};
    Object.keys(wordMap).forEach(function(field){
        var fieldMap = wordMap[field];
        Object.keys(fieldMap).forEach(function(token){
            var records = wordMap[field][token];
            if (records.length > 1) {
                for (var a = 0; a < records.length - 1; a++) {
                    for (var b = a +1; b < records.length; b++) {
                        comboMap[records[a] + unifier.config.unifier.fieldSeparator + records[b]] = true;
                    }
                }
            }
        });
    });

    unifier.optimizedCombos = Object.keys(comboMap);
};


// Evaluate the list of pairs individually and store the similarity score.
//
// Return a map of non-zero scores by combination, as in:
// results["idA;idB"] = 0.75;
unifier.scoreByPairs = function() {
    var resultsMap = {};

    unifier.optimizedCombos.forEach(function(combination){
        var fieldScore = {};
        // split the combination code into its parts
        var pair = combination.split(unifier.config.unifier.fieldSeparator);
        if (pair.length === 2) {
            var record1 = unifier.dataById[pair[0]];
            var record2 = unifier.dataById[pair[1]];

            // calculate each field value in config.{source}.compareFields.byTokens
            Object.keys(unifier.config.eastin.compareFields.byTokens).forEach(function(key){
                var settings = unifier.config.eastin.compareFields.byTokens[key];
                fieldScore[settings.field] = unifier.scorer.compareByToken(record1, record2, settings);
            });

            // calculate each field value in config.{source}.compareFields.byValue
            unifier.config.eastin.compareFields.byValue.forEach(function(field){
                fieldScore[field] = unifier.scorer.compareByValue(record1, record2, field);
            });


            // calculate each field value in config.{source}.compareFields.byDate
            unifier.config.eastin.compareFields.byDate.forEach(function(field){
                fieldScore[field] = unifier.scorer.compareByDate(record1, record2, field);
            });

            // calculate each field value in config.{source}.compareFields.bySet
            Object.keys(unifier.config.eastin.compareFields.bySet).forEach(function(setKey){

                // TODO:  Generalize this beyond ISO Codes and use the supplied funcName
                fieldScore[setKey] = unifier.scorer.compareByIsoFields(record1, record2, unifier.config.eastin.compareFields.bySet[setKey].fields);
            });

            // TODO:  Break this out into a "weighter" module
            var weightedTotal = 0;

            var tokenFields = [];
            Object.keys(unifier.config.eastin.compareFields.byTokens).forEach(function(key){
                tokenFields.push(unifier.config.eastin.compareFields.byTokens[key].field);
            });
            var singleFields = unifier.config.eastin.compareFields.byValue.concat(tokenFields, unifier.config.eastin.compareFields.byDate);

            singleFields.forEach(function(field){
                var weight = unifier.config.eastin.fieldWeights[field];
                if (isNaN(weight)) {
                    console.error("You have not entered a weight for field '" + field + "', cannot use this field in the overall weighted totals. Check your configuration.");
                    weight = 0;
                }
                if (fieldScore[field] > 0) {
                    weightedTotal += fieldScore[field] * weight;
                }
            });

            var setFieldKeys    = Object.keys(unifier.config.eastin.compareFields.bySet);
            setFieldKeys.forEach(function(setKey) {
                var weight = unifier.config.eastin.setWeights[setKey];
                if (fieldScore[setKey] > 0) {
                    weightedTotal += fieldScore[setKey] * weight;
                }
            });

            if (weightedTotal > 0) {
                resultsMap[combination] = weightedTotal;
            }
        }
        else {
            console.log("Invalid combination '" + combination + "', can't compare original records...");
        }
    });

    unifier.optimizedScores = resultsMap;
};

// Generate the full list of paired combinations
unifier.generateFullCombos = function() {
    var combinations = [];
    var keys = Object.keys(unifier.dataById);
    for (var a = 0; a < keys.length - 1; a++) {
        for (var b = a + 1; b < keys.length; b++) {
            combinations.push(keys[a] + unifier.config.unifier.fieldSeparator + keys[b]);
        }
    }
    return combinations;
};

unifier.loadData = function(results) {
    var deferred = when.defer();

    var options = { "url": unifier.config.couch.url + "_design/ul/_view/records"};
    var request = require("request");
    request(options,function(error, response, body){
        if (error) {
            console.error(error);
        }

        var jsonData = JSON.parse(body);
        unifier.dataById = {};
        jsonData.rows.forEach(function(row){
            var record = row.value;
            unifier.dataById[record.source + ":" + record.sid] = record;
        });

        deferred.resolve(results);
    });

    return deferred.promise;
};

unifier.buildComboMap = function() {
    return when.try(unifier.generateOptimizedCombos);
};

unifier.scorePairs    = function() {
    return when.try(unifier.scoreByPairs);
};

unifier.clusterByThreshold = function(results) {
    var deferred = when.defer();

    unifier.optimizedClusterIds = unifier.grouper.groupBySimilarityThreshold(Object.keys(unifier.dataById), unifier.optimizedScores, 0.75);
    unifier.optimizedClusters = [];
    unifier.optimizedClusterIds.forEach(function(clusterIds){
        var cluster = [];
        clusterIds.forEach(function(id){
            cluster.push(unifier.dataById[id]);
        });
        unifier.optimizedClusters.push(cluster);
    });

    deferred.resolve(results);
    return deferred.promise;
};

unifier.getUnifiedId = function(array) {
    var uid = null;
    array.forEach(function(entry){
        if (entry.source === "unified") {
            uid = entry.uid;
        }
    });

    return uid;
};

unifier.generateUpdateFunction = function(record) {
    return function() {
        var deferred = when.defer();
        var options = { "url": unifier.config.couch.url, "method": "PUT", "json": true, "body": record };
        var request = require("request");
        request(options,function (error, response, body){
            if (error) { console.error(error); }
            deferred.resolve(body);
        });

        return deferred.promise;
    };
};

unifier.saveUnifiedRecords = function(results) {
    var deferreds = [];

    unifier.optimizedClusters.forEach(function(cluster){
        if (cluster.length > 1) {
            var uid = unifier.getUnifiedId(cluster);
            if (!uid) {
                // Create a new unified record that we will update.
                var now = new Date();
                var tempUid = (now).getTime() + "-" + Math.round(Math.random() * 1000);

                // For now, just clone the first record to guarantee that this record will be part of the cluster if we rerun the analysis.
                // TODO:  Do a better job of combining source values for this record...
                var ulRecord = {
                    "source":       "unified",
                    "sid":          tempUid,
                    "uid":          tempUid,
                    "status":       "new",
                    "name":         cluster[0].name,
                    "description":  cluster[0].description,
                    "manufacturer": cluster[0].manufacturer,
                    "updated":      now
                };

                // Add the record to the stack for the next step (associations)...
                cluster.push(ulRecord);
                unifier.dataById["unified:" + tempUid] = ulRecord;

                deferreds.push(when(ulRecord, unifier.generateUpdateFunction));
            }
        }
    });

    return sequence(deferreds);
};

unifier.associateSourceRecords = function(results) {
    var deferreds = [];

    unifier.optimizedClusters.forEach(function(cluster){
        if (cluster.length > 1) {
            var uid = unifier.getUnifiedId(cluster);
            if (uid) {
                cluster.forEach(function(record){
                    // Only update source records that are not already clustered correctly...
                    if (record.source !== "unified" && record.uid !== uid) {
                        record.uid  = uid;

                        deferreds.push(when(record, unifier.generateUpdateFunction));
                    }
                });
            }
            else {
                console.error("Something is very wrong, I should always have a uid at this stage...");
            }
        }
    });

    return sequence(deferreds);
};

unifier.displayStats = function(results) {
    var deferred = when.defer();

    console.log("Started with " + Object.keys(unifier.dataById).length + " records...");
    console.log("Detected " + unifier.optimizedCombos.length + " optimized pairings to test...");
    console.log("Calculated " + Object.keys(unifier.optimizedScores).length + " scores...");
    console.log("Grouped records into " + unifier.optimizedClusterIds.length + " sets of clustered IDs...");
    console.log("Built " + unifier.optimizedClusters.length + " complete clusters from the list of IDs ...");

    deferred.resolve(results);
    return deferred.promise;
};

// Build the associations between similar records step-by-step:
//
// 1. Load existing record data from couch and build a data map keyed by source:sid to use in later lookups.
// 3. Build the list of optimized combos to test, based on having at least one non-stopword in commmon.
// 4. Score the list of optimized combos.
// 5. Build the list of optimized clusters based on a threshold.
// 6. Generate and save any new unified records that are required to complete a cluster.
// 7. Associate clusters of more than one record with a unified record.
// 8. Display stats.

unifier.loadData().then(unifier.buildComboMap).then(unifier.scorePairs).then(unifier.clusterByThreshold).then(unifier.saveUnifiedRecords).then(unifier.associateSourceRecords).done(unifier.displayStats);



