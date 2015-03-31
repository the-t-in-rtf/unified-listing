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
            type: "gpii.ul.imports.downloader",
            options: {
                url: "http://mobileaccessibility.info/xml/mobile-accessibility-phones.xml",
                cacheFile: cacheFile
            }
        },
        transformer: {
            type: "gpii.ul.imports.gari.transformer",
            options: {
                cacheFile: cacheFile,
                listeners: {
                    "{downloader}.events.onCacheReady": "{transformer}.loadData"
                }
            }
        },
        syncer: {
            type: "gpii.ul.imports.syncer",
            options: {
                model: {
                    data: "{transformer}.model.remappedJson"
                }
            }
        }
    },
    listeners: {
        "onCreate.retrieveData": {
            funcName: "{downloader}.retrieveData"
        }
    }
});

var runner = gpii.ul.imports.gari.runner();
