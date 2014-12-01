/*
    Go through a data set and find similar records as outlined in:
    http://wiki.gpii.net/w/Algorithm_for_product_similarity

 */

// TODO:  Make this work with something other than EASTIN once we have multiple data sources
var loader            = require("../config/lib/config-loader");
var config            = loader.loadConfig({});

// We are not currently using stemming, but here is the library we use
//var stemmer           = require("stemmer");
var fs                = require('fs');

var scorer            = require("./scorer")(config);
var sanitizer         = require("./sanitizer")(config);
var tokenizer         = require("./tokenizer")(config);
var grouper           = require("./grouper")(config);

// TODO: Throw a meaningful error message if the cache doesn't exist
var data              = require(config.eastin.cacheFile);
var dataById          = mapDataById(data);

var timestamp         = new Date().getTime();

var optimizedCombos   = generateOptimizedCombos(dataById);
saveOutput("unifier_" + timestamp + "_pairs.json", optimizedCombos);

var optimizedScores   = scoreByPairs(optimizedCombos, dataById);
saveOutput("unifier_" + timestamp + "_scores.json", optimizedScores);

var optimizedClusters = grouper.groupBySimilarityThreshold(Object.keys(dataById), optimizedScores, 0.75);
saveOutput("unifier_" + timestamp + "_optimized.json", optimizedClusters);

var clusteredData = [];
optimizedClusters.forEach(function(cluster){
    var singleClusterData = [];

    cluster.forEach(function(id){
        singleClusterData.push(dataById[id]);
    });

    clusteredData.push(singleClusterData);
});

saveOutput("unifier-" + timestamp + "-clusters.json", clusteredData);

// TODO: Currently we string anything above the threshold together with anything else.  A second pass may be needed to get rid of oddballs.

// Visualize the clustered data to assist in evaluating quality
var clusterCountBySize = {};
var clustersBySize     = {};
var minSize            = 100;
var maxSize            = 0;

optimizedClusters.forEach(function(cluster){
    clusterCountBySize[cluster.length] ? clusterCountBySize[cluster.length]++ : clusterCountBySize[cluster.length] = 1;
    minSize = Math.min(minSize, cluster.length);
    maxSize = Math.max(maxSize, cluster.length);
    clustersBySize[cluster.length] ? clustersBySize[cluster.length].push(cluster) : clustersBySize[cluster.length] = [cluster];
});

for (var a = maxSize; a >= minSize; a--) {
    var count = clusterCountBySize[a] ? clusterCountBySize[a] : 0;
    console.log(a + ": " + count);
}

console.log("The biggest single clusters are:");
for (var a = maxSize; a >= minSize; a--) {
    if (clustersBySize[a] && clustersBySize[a].length === 1) {
        var cluster = clustersBySize[a][0];
        console.log("(" + a + " members)...");
        console.log(JSON.stringify(cluster, null, 2));
    }
}

function saveOutput(filename, data) {
    fs.writeFileSync(config.unifier.outputDir + "/" + filename, JSON.stringify(data, null, 2));
};

// Build a list of record combinations that share at least one word, so that we can exclude totally unique records up front.
// Checking the company and product names up front takes care of over 90% of the similarity matching and requires only 1% of the computing effort
function generateOptimizedCombos(dataMap) {
    var wordMap = {};
    Object.keys(config.eastin.compareFields.byTokens).forEach(function(key){
        var settings = config.eastin.compareFields.byTokens[key];
        if (wordMap[settings.field] === undefined) { wordMap[settings.field] = {};}

        Object.keys(dataMap).forEach(function(key){
            var record = dataMap[key];

            // Tokenize the field and convert to lower case
            var tokens = sanitizer.toLowerCase(tokenizer.tokenize(record[settings.field]));

            // Iterate through and build a map of all records with common tokens
            tokens.forEach(function(token){
                if (wordMap[settings.field][token] === undefined) { wordMap[settings.field][token] = [];}
                if (wordMap[settings.field][token].indexOf(key) === -1 ) {
                    wordMap[settings.field][token].push(key);
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
                        comboMap[records[a] + config.unifier.fieldSeparator + records[b]] = true;
                    }
                }
            }
        });
    });

    return Object.keys(comboMap);
};


// Evaluate the list of pairs individually and store the similarity score.
//
// Return a map of non-zero scores by combination, as in:
// results["idA;idB"] = 0.75;
function scoreByPairs(comboArray, dataMap) {
    var resultsMap = {};

    comboArray.forEach(function(combination){
        var fieldScore = {};
        // split the combination code into its parts
        var pair = combination.split(config.unifier.fieldSeparator);
        if (pair.length == 2) {
            var record1 = dataMap[pair[0]];
            var record2 = dataMap[pair[1]];

            // calculate each field value in config.{source}.compareFields.byTokens
            Object.keys(config.eastin.compareFields.byTokens).forEach(function(key){
                var settings = config.eastin.compareFields.byTokens[key];
                fieldScore[settings.field] = scorer.compareByToken(record1, record2, settings);
            });

            // calculate each field value in config.{source}.compareFields.byValue
            config.eastin.compareFields.byValue.forEach(function(field){
                fieldScore[field] = scorer.compareByValue(record1, record2, field);
            });


            // calculate each field value in config.{source}.compareFields.byDate
            config.eastin.compareFields.byDate.forEach(function(field){
                fieldScore[field] = scorer.compareByDate(record1, record2, field);
            });

            // calculate each field value in config.{source}.compareFields.bySet
            Object.keys(config.eastin.compareFields.bySet).forEach(function(setKey){

                // TODO:  Generalize this beyond ISO Codes and use the supplied funcName
                fieldScore[setKey] = scorer.compareByIsoFields(record1, record2, config.eastin.compareFields.bySet[setKey].fields);
            });

            // TODO:  Break this out into a "weighter" module
            var weightedTotal = 0;

            var tokenFields = [];
            Object.keys(config.eastin.compareFields.byTokens).forEach(function(key){
                tokenFields.push(config.eastin.compareFields.byTokens[key].field);
            });
            var singleFields = config.eastin.compareFields.byValue.concat(tokenFields, config.eastin.compareFields.byDate);

            singleFields.forEach(function(field){
                var weight = config.eastin.fieldWeights[field];
                if (fieldScore[field] > 0) {
                    weightedTotal += fieldScore[field] * weight;
                }
            });

            var setFieldKeys    = Object.keys(config.eastin.compareFields.bySet);
            setFieldKeys.forEach(function(setKey) {
                var weight = config.eastin.setWeights[setKey];
                if (fieldScore[setKey] > 0) {
                    weightedTotal += fieldScore[setKey] * weight;
                }
            });

            if (weightedTotal > 0) resultsMap[combination] = weightedTotal;
        }
        else {
            console.log("Invalid combination '" + combination + "', can't compare original records...");
        }
    });

    return resultsMap;
}

function mapDataById(data) {
    var mappedData = {};
    data.forEach(function(record) {
        var id = "eastin-" + record.Database + record.ProductCode;
        mappedData[id] = record;
    });

    return mappedData;
}

// Generate the full list of paired combinations
function generateFullCombos(dataMap) {
    var combinations = [];
    var keys = Object.keys(dataMap);
    for (var a = 0; a < keys.length - 1; a++) {
        for (var b = a + 1; b < keys.length; b++) {
            combinations.push(keys[a] + config.unifier.fieldSeparator + keys[b]);
        }
    }
    return combinations;
};