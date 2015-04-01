// The combined "runner" component for EASTIN imports.  Wires together the common components and chains their data
"use strict";
var fluid  = require("infusion");
var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ul.imports.eastin.runner");

require("../syncer");
require("./transformer");
require("./stats");

// A runner that processes incoming data and then syncs it.
//
// For now, to start the chain, just apply a change to "rawData"
fluid.defaults("gpii.ul.imports.eastin.runner", {
    gradeNames: [ "fluid.modelRelayComponent", "autoInit"],
    model: {
        rawData:       "{transformer}.model.rawJson",
        processedData: "{transformer}.model.remappedJson"
    },
    components: {
        transformer: {
            type: "gpii.ul.imports.eastin.transformer"
        },
        syncer: {
            type: "gpii.ul.imports.syncer",
            options: {
                model: {
                    data: "{transformer}.model.remappedJson"
                }
            }
        },
        stats: {
            type: "gpii.ul.imports.eastin.stats",
            options: {
                model: {
                    data: "{transformer}.model.remappedJson"
                }
            }
        }
    }
});