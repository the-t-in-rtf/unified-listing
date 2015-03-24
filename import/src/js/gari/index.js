// This script is designed to (optionally) download data from GARI and get it ready to importer into the Unified Listing.
//
// For full details, see the README.md file in this directory
//
// To see the list of default options, look at `./src/js/importer`

"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var os    = require("os");
var path  = require("path");

require("../downloader");
require("../syncer");

require("./transformer");

var cacheFile = path.join(os.tmpdir(), "gari.xml");

fluid.registerNamespace("gpii.ul.imports.gari.runner");
fluid.defaults("gpii.ul.imports.gari.runner", {
    gradeNames: ["fluid.modelRelayComponent", "autoInit"],
    model: {
        gariData: "{transformer}.model.remappedJson"
    },
    components: {
        downloader: {
            type: "gpii.ul.importers.downloader",
            options: {
                url: "http://mobileaccessibility.info/xml/mobile-accessibility-phones.xml",
                cacheFile: cacheFile
            }
        },
        transformer: {
            type: "gpii.ul.importers.gari.transformer",
            options: {
                cacheFile: cacheFile,
                listeners: {
                    "{downloader}.events.onCacheReady": "{transformer}.loadData"
                }
            }
        }
    },
    listeners: {
        "onCreate": {
            funcName: "{downloader}.retrieveData"
        }
    }
});

var runner = gpii.ul.imports.gari.runner();
console.log("Data loaded, see sample record:\n" + JSON.stringify(runner.model.gariData[0], null, 2));

// TODO: Write the component that does the syncing and wire it in

// Then attempt to sync the data with CouchDb and report on the results
//gpii.ul.importers.gari.syncer();
