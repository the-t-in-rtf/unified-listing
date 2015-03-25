// This script is designed to (optionally) download data from GARI and get it ready to import into the Unified Listing.
//
// For full details, see the README.md file in this directory

"use strict";
var fs      = require("fs");
var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");

require("../../../../node_modules/universal/gpii/node_modules/settingsHandlers/index");
require("./../transforms");

fluid.registerNamespace("gpii.ul.importers.gari.transformer");

// Load and return the text content of a named file.
gpii.ul.importers.gari.transformer.loadData = function(that) {
    that.applier.change("xml", fs.readFileSync(that.options.cacheFile, { encoding: "utf8" }));
};

// Parse the XML data we already have
gpii.ul.importers.gari.transformer.parseXml = function(that) {
    that.applier.change("rawJson", gpii.settingsHandlers.XMLHandler.parser.parse(that.model.xml, that.options.xmlParserRules));
};

// Remap the data
gpii.ul.importers.gari.transformer.remapData = function(that) {
    that.applier.change("remappedJson", fluid.transform(that.model.rawJson.products, that.transformData));
};

fluid.defaults("gpii.ul.importers.gari.transformer", {
    gradeNames: ["fluid.modelRelayComponent", "autoInit"],
    cacheFile:   "/tmp/gari.xml",
    semverRegexp: "([0-9]+(\\.[0-9]+){0,2})",
    xmlParserRules: {
        rules: {
            products: "rss.channel.product" // Drill down to only the objects we care about to simplify the transform paths
        }
    },
    mapRules: {
        source: {
            literalValue: "{that}.options.defaults.source"
        },
        sid: "objectid.$t",
        name: "Model.$t",
        description: {
            literalValue: "{that}.options.defaults.description"
        },
        manufacturer: {
            name:    "ProductBrand.$t",
            url:     "Website.$t",
            country: "Countries.$t"
        },
        language: {
            literalValue: "{that}.options.defaults.language"
        },
        updated: {
            transform: {
                type: "gpii.ul.imports.transforms.dateToISOString",
                value: {
                    transform: {
                        type: "fluid.transforms.value",
                        inputPath: "DateCompleted.$t"
                    }
                }
            }
        },
        ontologies: {
            context: {
                id: {
                    transform: {
                        type: "gpii.ul.imports.transforms.toLowerCase",
                        value: {
                            transform: {
                                type: "fluid.transforms.value",
                                inputPath: "Platform.$t"
                            }
                        }
                    }
                },
                version: {
                    transform: {
                        type: "gpii.ul.imports.transforms.regexp",
                        inputPath: "PlatformVersion.$t",
                        regexp: "{that}.options.semverRegexp"
                    }
                }
            }
        }
    },
    defaults: {
        description: "No description available.", // There is no description data, but the field is required, so we set it to a predefined string.
        language:    "en_us", // Their data only contains English language content
        source:      "gari"
    },
    model: {
        xml:          {},
        rawJson:      {},
        remappedJson: {}
    },
    invokers: {
        loadData: {
            funcName: "gpii.ul.importers.gari.transformer.loadData",
            args: ["{that}"]
        },
        parseXml: {
            funcName: "gpii.ul.importers.gari.transformer.parseXml",
            args: ["{that}"]
        },
        remapData: {
            funcName: "gpii.ul.importers.gari.transformer.remapData",
            args: ["{that}"]
        },
        transformData: {
            funcName: "fluid.model.transformWithRules",
            args: ["{arguments}.0", "{that}.options.mapRules"]
        }
    },
    modelListeners: {
        xml: {
            func: "{that}.parseXml"
        },
        rawJson: {
            func: "{that}.remapData"
        }
    }
});