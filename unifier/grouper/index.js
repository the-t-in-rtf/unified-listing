"use strict";

module.exports = function(config) {
    var fluid     = require('infusion');
    var namespace = "gpii.ul.unifier.grouper";
    var grouper   = fluid.registerNamespace(namespace);

    // Expects a hash of combinations and similarity data (values from 0-1)...
    //
    // Returns clusters by ID
    grouper.groupBySimilarityThreshold = function(allIds, similarityData, threshold) {
        // Go through and make one pass with all of the paired relationships to build a full map to lookup all relationships
        var pairs = {};
        Object.keys(similarityData).forEach(function(key) {
            var ids = key.split(config.unifier.fieldSeparator);
            var similarity = similarityData[key];
            if (similarity >= threshold) {
                if (!pairs[ids[0]]) { pairs[ids[0]] = {}; }
                if (!pairs[ids[1]]) { pairs[ids[1]] = {}; }
                pairs[ids[0]][ids[1]] = similarity;
                pairs[ids[1]][ids[0]] = similarity;
            }
        });

        // Go through and chain all records until there are no records we haven't seen
        var processedIds = [];
        var clusters = [];
        allIds.forEach(function(id) {
            if (processedIds.indexOf(id) === -1) {
                processedIds.push(id);
                if (pairs[id]) {
                   var childCluster = linkChildren(id, pairs, processedIds);
                    if (childCluster && childCluster.length > 0) {
                        clusters.push(childCluster);
                    }
                }
                else {
                    // Add all singletons to the results as individual records
                    clusters.push([id]);
                }
            }
        });

        // Now add all the isolated records as single-record clusters
        return clusters;
    };

    // build a chain by treeing through all previous not visited pairings between our children and other nodes
    //
    // Return an array that contains all the IDs of the nodes we've found
    function linkChildren(id, pairs, processedIds) {
        var clusters = [];
        clusters.push(id);
        processedIds.push(id);

        // If we are on the last node, add ourselves to the chain and bail out
        Object.keys(pairs[id]).forEach(function(childId){
            if (processedIds.indexOf(childId) === -1) {
                var childCluster = linkChildren(childId, pairs, processedIds);
                clusters = clusters.concat(childCluster);
            }
        });

        return clusters;
    }

    return grouper;
}