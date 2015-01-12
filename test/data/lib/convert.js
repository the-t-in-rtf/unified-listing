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
        var clusterIds = [
            "1421059432806-826608318",
            "1421059432806-826608318",
            "1421059432806-826608318",
            "1421059432806-826608318",
            "1421059432806-826608318",
            "1421059432812-405818962",
            "1421059432812-223498558",
            "1421059432812-144583330",
            "1421059432813-866596636",
            "1421059432806-826608318",
            "1421059432814-622816753",
            "1421059432814-552781295",
            "1421059432814-124551522",
            "1421059432806-826608318",
            "1421059432814-712184219",
            "1421059432806-764399908",
            "1421059432814-622816753",
            "1421059432814-622816753",
            "1421059432814-552781295",
            "1421059432814-124551522",
            "1421059432814-712184219",
            "1421059432813-866596636",
            "1421059432812-405818962",
            "1421059432812-223498558",
            "1421059432812-144583330"
        ];
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

