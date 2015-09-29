// Unofficial API to pull the list of sources the user is allowed to see.  Used only to populate controls in the
// "updates" report.
//
// Users are allowed to see:
//
// 1. Any sources whose visibility options include the special role `*`.
// 2. Any sources whose visibility options include one of their roles.
// 3. A source that exactly matches their own user ID (used for contributions).
//
// TODO:  This module, /api/search, and /api/products should share the permissions logic that determines what sources someone is allowed to see
"use strict";
var fluid = fluid || require("infusion");
var gpii = fluid.registerNamespace("gpii");

var fs   = require("fs");
var path = require("path");

var sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, "sources.json"), { encoding: "utf8"}));

require("gpii-express");

fluid.registerNamespace("gpii.ul.api.sources");

fluid.registerNamespace("gpii.ul.api.sources.request");
gpii.ul.api.sources.request.handleRequest = function (that) {

    var user = that.request && that.request.session && that.request.session._gpii_user ? that.request.session._gpii_user : null;
    var visibleSources = gpii.ul.api.sources.request.listAllowedSources(that.options.sources, user);

    that.sendResponse(200, { sources: visibleSources });
};

gpii.ul.api.sources.request.listAllowedSources = function (sources, user) {
    var visibleSources = [];

    fluid.each(sources, function (sourceOptions, source) {
        // The special character `~` applies to the current username.  If it is found in the list of sources and the user
        // is logged in, they are given permission to add records whose source matches their username.  This is used to
        // power the "contribute" functionality for both manufacturer and general users.
        //
        if (source === "~" && user) {
            visibleSources.push(user.username);
        }
        else {
            var hasPermission = false;

            // Some sources (like the unified source) are visible to everyone. These have a virtual "wildcard" role (*).
            if (sourceOptions.view.indexOf("*") !== -1) {
                hasPermission = true;
            }
            // Everything else is based on the user's roles.
            else if (!hasPermission && user && user.roles) {
                fluid.each(sourceOptions.view, function (role) {
                    if (!hasPermission && user.roles.indexOf(role) !== -1) {
                        hasPermission = true;
                    }
                });
            }

            if (hasPermission) {
                visibleSources.push(source);
            }
        }
    });

    return visibleSources;
};

fluid.defaults("gpii.ul.api.sources.request", {
    invokers: {
        handleRequest: {
            funcName: "gpii.ul.api.sources.request.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ul.api.sources.router", {
    gradeNames:    ["gpii.express.requestAware.router"],
    path:          "/sources",
    handlerGrades: "gpii.ul.api.sources.request",
    sources:       sources,
    dynamicComponents: {
        requestHandler: {
            options: {
                sources: "{router}.options.sources"
            }
        }
    }
});
