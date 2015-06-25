/*

# Introduction

This is a simple component to update the browser's history state when the model changes and vice versa.  It can:

  1. Publish model changes to the query string portion of the location bar.   This completely replaces the current query data in the location bar, so you should preserve any variables you care about as part of your model and rules.

  2. Parse the initial query string and publish data to the model (see below for rules).

  3. Publish model data to the browser history `state` object (see below for rules).

  4. Publish state data from the browser history to the model when the state changes (such as when the back and forward button are hit).  See below for rules.

## Disabling or enabling

All of these mechanisms are enabled by default, but each can be disabled individually, using the following options:

   `options.modelToQuery`: If this is `true`, publish the model to the location bar (see below for rules).

   `options.queryToModel`: If this is `true`, parse the query on startup and update the model (see below for rules).

   `options.modelToState`: If this is `true`, save the model to the state when creating history entries (see below for rules).

   `options.stateToModel`: If this is `true`, listen for history changes and update the model (see below for rules).

In addition, the following option controls how state changes are reflected in the browser's history:

   `options.addNewHistoryEntry`:  If this is `true`, add a new history entry for each model change.  If this is `false`, update
   the current history entry instead.  Set to `false` by default.  The `stateToModel` option is intended to be used in
   this mode.

## Rules

  Each type of data transmission is governed by rules, which are applied using `fluid.model.transformWithRules`.

  All are stored in `options.rules`, which can contain any of the following:

  `options.rules.modelToQuery`:  Rules to control how model data is converted into query data. The final output is
  a JSON object keyed by the query parameter name.  Each key's contents will be converted to a string using
  `JSON.stringify()` and URL encoded.

  `options.rules.queryToModel`: Rules to control how query data is converted into model data.  This process only takes
  place when the component is created.  If you have multiple components that are modifying query data, you should
  probably refactor to make them aware of each other's model variables instead.

  `options.rules.modelToState`: Rules to control how model data is converted into state data.

  `options.rules.stateToModel`: Rules to control how state data is converted into model data.

# Usage

If you want to sync all model changes with the state and the location bar, you should probably use the
`gpii.location.allSynced` grade and simply supply your model.  If you want fuller control, you should start with
the `gpii.location` grade and add your own `options.modelListener` definitions for the variables you want to sync.

# More Information

For examples of this component in action, check out the tests included with this package.

*/

// TODO:  Add support for IE using https://github.com/devote/HTML5-History-API or similar polyfill.
"use strict";
/* global fluid, window, history, document */

(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.locationBar");

    // Parse a JSON object and return a query string (no leading question mark)
    gpii.locationBar.jsonToQuery = function (data) {
        var queryParts = [];

        fluid.each(data, function (value, key) {
            // If we are passed a literal string, we cannot continue.
            if (!key) { return; }

            // Strip null and undefined values to keep the query string short, while preserving `false` values.
            if (value === undefined || value === null) { return; }

            var valueToEncode = typeof value === "string" ? value : JSON.stringify(value);
            var encodedKey   = encodeURIComponent(key);
            var encodedValue = encodeURIComponent(valueToEncode);
            queryParts.push(encodedKey + "=" + encodedValue);
        });

        return queryParts.join("&");
    };

    // Parse a query string and return a JSON object.
    gpii.locationBar.queryToJson = function (queryString) {
        var queryData = {};

        // Remove the leading question mark if found.
        if (queryString.indexOf("?") === 0) {
            queryString = queryString.substring(1);
        }

        // Split by ampersands
        var queryParts = queryString.split("&");
        queryParts.forEach(function (queryPart){
            var matches = queryPart.match(/^([^=]+)=(.+)$/);
            if (matches) {
                var key   = matches[1];

                var stringValue = decodeURIComponent(matches[2]);
                var value = stringValue;
                try {
                    var jsonData = JSON.parse(stringValue);
                    value        = jsonData;
                }
                catch (e) {
                    // Do nothing
                }

                queryData[key] = value;
            }
        });

        return queryData;
    };

    // Load model data from the query string and apply it to the model.
    gpii.locationBar.queryToModel = function (that) {
        if (that.options.queryToModel) {
            var queryData = gpii.locationBar.queryToJson(window.location.search);
            var newModelData = fluid.model.transformWithRules(queryData, that.options.rules.queryToModel);

            gpii.locationBar.batchChanges(that, newModelData, false);

            that.events.queryDataLoaded.fire(that);
        }
    };

    // Listen for any model changes and update the query string to include the current model state.
    gpii.locationBar.update = function (that) {
        var queryData = fluid.model.transformWithRules(that.model, that.options.rules.modelToQuery);
        var queryString = gpii.locationBar.jsonToQuery(queryData);

        var updatedURL = window.location.pathname + "?" + queryString;

        var stateData = that.options.modelToState ? fluid.model.transformWithRules(that.model, that.options.rules.modelToState) : {};

        // Add a new history entry
        if (window.history) {
            if (that.options.addNewHistoryEntry) {
                if (window.history.pushState) {
                    window.history.pushState(stateData, document.title, updatedURL);
                }
            }
            // Update the existing location
            else if (window.history.replaceState) {
                window.history.replaceState(stateData, document.title, updatedURL);
            }
        }
    };

    // Apply all changes in a single transaction.  Also ensures that values flagged with `null` are deleted from the model.
    gpii.locationBar.batchChanges = function (that, changeSet, deleteExisting) {
        var myTransaction = that.applier.initiate();

        if (deleteExisting) {
            // If we are loading the entire model from the state, we must clear out existing values to avoid revealing
            // data from the future (Spoilers!)
            myTransaction.fireChangeRequest({ path: "", type: "DELETE"});
        }

        fluid.each(changeSet, function(value, key) {
            var change = { path: key };
            if (value === undefined || value === null) {
                change.type = "DELETE";
            }
            else {
                change.value = value;
            }
            myTransaction.fireChangeRequest(change);
        });

        myTransaction.commit();
    };

    // Enable our browser back/forward listener.
    gpii.locationBar.bindStateToModel = function(that) {
        if (that.options.stateToModel) {
            window.onpopstate = that.handleStateChange;
        }
    };

    // Update the model using the recorded history when the back/forward button is pressed.
    gpii.locationBar.handleStateChange = function (that, event) {
        var newModelData = fluid.model.transformWithRules(event.state, that.options.rules.stateToModel);

        gpii.locationBar.batchChanges(that, newModelData, true);
    };

    // The base component for `locationBar` grades, without the default wiring.
    fluid.defaults("gpii.locationBar", {
        gradeNames: ["fluid.standardRelayComponent", "autoInit"],
        addNewHistoryEntry: false,
        modelToQuery:       true,
        queryToModel:       false,
        modelToState:       false,
        stateToModel:       false,
        invokers: {
            handleStateChange: {
                funcName: "gpii.locationBar.handleStateChange",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "onCreate.queryToModel": {
                funcName: "gpii.locationBar.queryToModel",
                args:     ["{that}"]
            },
            "onCreate.bindStateToModel": {
                funcName: "gpii.locationBar.bindStateToModel",
                args:     ["{that}"]
            }
        }
    });

    fluid.registerNamespace("gpii.locationBar.syncAll");
    // A preconfigured instance of `gpii.locationBar` that syncs all data possible.
    fluid.defaults("gpii.locationBar.syncAll", {
        gradeNames: ["gpii.locationBar", "autoInit"],
        addNewHistoryEntry: true,
        modelToQuery:       true,
        queryToModel:       true,
        modelToState:       true,
        stateToModel:       true,
        events: {
            queryDataLoaded: null
        },
        rules: {
            modelToQuery: { "": "" },
            queryToModel: { "": "" },
            modelToState: { "": "" },
            stateToModel: { "": "" }
        },
        modelListeners: {
            "*": {
                funcName:      "gpii.locationBar.update",
                args:          ["{syncAll}"],
                excludeSource: "init"
            }
        }
    });
})();

