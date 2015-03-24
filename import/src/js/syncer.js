// This script is designed to synchronise data in the UL format with an existing CouchDb instance

"use strict";
var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.importers.syncer");

fluid.defaults("gpii.ul.importers.syncer", {
    gradeNames: ["fluid.littleComponent", "autoInit"]
});