// A script to generate data that can be easily used with the bulk docs API in Couch/Pouch.
//
// Takes 100 records (not counting design documents) from the current data via the all_docs interface and outputs data that can be immediately imported via bulk_docs
//
// Used in keeping test scenarios up to date.
"use strict";
var fluid       = require("infusion");
var namespace   = "gpii.ul.test.data.lib.convert";
var convert     = fluid.registerNamespace(namespace);

var loader      = require("../../../config/lib/config-loader");
convert.config  = loader.loadConfig(require("../../../config/dev.json"));

var request      = require("request");
var options      = {
    url: convert.config.couch.url + "_all_docs?include_docs=true"
};
request(options, function(error, response, body){
    if (error) {
        console.error(error);
        return;
    }

    var data = JSON.parse(body);
    var converted = [];
    data.rows.forEach(function(row) {
        // TODO:  This will need to be updated once we have real UIDs.
        var clusterIds = ["1420467546923-229", "1420467546927-366", "1420467546930-288", "1420467546924-851"];
        if (row.id.indexOf("_") === -1 && clusterIds.indexOf(row.doc.uid) !== -1) {
            converted.push(row.doc);
        }
    });

    var fs        = require("fs");
    var timestamp = (new Date()).getTime();
    var filename  = "/tmp/output-" + timestamp + ".json";

    fs.writeFile(filename, JSON.stringify({ "docs": converted }, null, 2), function(err){
        if (err) {
            console.error("Error saving file '" + filename + "': " + err);
            return;
        }

        console.log("Saved output to file '" + filename + "'...");
    });
});

