/*
    Go through a data set and find similar records as outlined in:
    http://wiki.gpii.net/w/Algorithm_for_product_similarity

 */
"use strict";
var loader  = require("../config/lib/config-loader");
var config  = loader.loadConfig({});
var unifier = require("./unifier")(config);

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



