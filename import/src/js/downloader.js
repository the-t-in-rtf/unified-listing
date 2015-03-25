// Download a single url and save it to the configured cacheFile
"use strict";
var fs      = require("fs");
var request = require("request");
var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.importers.downloader");

var os    = require("os");
var path  = require("path");

gpii.ul.importers.downloader.retrieveData = function(that) {
    if (!fs.existsSync(that.options.cacheFile) || that.options.forceLoad) {
        var options = {};
        if (that.options.url) {
            request.get(that.options.url, options, that.saveData);
        }
        else {
            fluid.fail("You must configure a URL in this component's options for it to download and cache content.");
        }
    }
    else {
        // The cache is already ready
        that.events.onCacheReady.fire(that);
    }
};

gpii.ul.importers.downloader.saveData = function(that, error, response, body) {
    fs.writeFileSync(that.options.cacheFile, body);
    that.events.onCacheReady.fire(that);
};

var cacheFile = path.join(os.tmpdir(), "downloaderCache");
fluid.defaults("gpii.ul.importers.downloader", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    url:         undefined,
    cacheFile:   cacheFile,
    forceLoad:   false,
    events: {
        onCacheReady: null
    },
    invokers: {
        retrieveData: {
            funcName: "gpii.ul.importers.downloader.retrieveData",
            args: ["{that}"]
        },
        saveData: {
            funcName: "gpii.ul.importers.downloader.saveData",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});