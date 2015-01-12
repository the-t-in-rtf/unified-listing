// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var updates   = fluid.registerNamespace("ul.components.updates");
    var templates = fluid.registerNamespace("ul.components.templates");

    updates.loadControls = function(that) {
        var controls = that.locate("controls");
        templates.replaceWith(controls, "updates-controls", { "sources": that.data.options.sources });
        that.events.markupLoaded.fire();
    };

    updates.applySettingsChanges = function(that) {
        var output = that.locate("output");
        output.html("Loading...");
        output.addClass("loading");

        var settings = {
            url:     that.options.baseUrl + "api/updates",
            success: that.displayResults,
            error:   that.displayError,
            data:    {
                source:  that.model.settings.sources
            }
        };

        var updated = moment(that.model.settings.updated).toDate();
        if (!isNaN(updated.getTime)) {
            settings.data.updated = updated;
        }

        // Update the browser location bar so that bookmarking and reloads will work as expected
        var queryString = "";
        if (that.model.settings.sources || !isNaN(updated)) {
            queryString += "?";
            if (that.model.settings.sources) {
                that.model.settings.sources.forEach(function(source){
                    queryString += "source=" + escape(source) + "&";
                });
            }

            if (!isNaN(updated)) {
                queryString += "updated=" + updated.toISOString();
            }
        }

        history.pushState(null, null, that.options.baseUrl + "updates" + queryString);

        $.ajax(settings);
    };

    // We use the foundation "accordion" control, which needs to be rebound when the markup is reloaded...
    updates.rebindFoundation = function(that) {
        $(document).foundation();
        $(document).foundation("accordion", "reflow");
    };

    updates.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var output = that.locate("output");
        output.removeClass("loading");

        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        templates.prepend(output,"common-error", message);
        that.events.markupLoaded.fire();
    };

    updates.loadQueryData = function(that) {
        // TODO:  Queue up changes and only fire one update...

        if (that.data.options.query) {
            var updated = that.data.options.query.updated;
            if (updated) {
                that.applier.change("settings.updated", updated);
            }

            var sources = Array.isArray(that.data.options.query.source) ? that.data.options.query.source : [that.data.options.query.source];
            if (sources) {
                that.applier.change("settings.sources", sources);
            }
        }
    };

    updates.displayResults = function(that, data, textStatus, jqXHR) {
        var output = that.locate("output");
        if (data && data.records && data.records.length > 0) {
            templates.replaceWith(output, "updates-records", data);
        }
        else {
            templates.replaceWith(output, "updates-norecord");
        }
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    updates.init = function(that) {
        updates.loadQueryData(that);
        templates.loadTemplates(function() { updates.loadControls(that); });
    };

    // TODO:  Simplify all self references to {updates} and test
    fluid.defaults("ul.components.updates", {
        gradeNames: ["fluid.viewRelayComponent", "baseUrlAware", "autoInit"],
        selectors: {
            "controls": ".ul-updates-controls",
            "updated":  ".ul-updates-updated-control",
            "source":   ".ul-updates-source-control",
            "output":   ".ul-updates-output"
        },
        bindings: [
            {
                selector:    "updated",
                path:        "settings.updated",
                elementType: "date"
            },
            {
                selector:    "source",
                path:        "settings.sources",
                elementType: "select"
            }
        ],
        components: {
            data:    {
                type: "ul.components.data",
                options: {
                    model: {
                        settings: {
                            updated: null,
                            sources: "{data}.options.sources"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        events: {
            "refresh":           "preventable",
            "markupLoaded":      "preventable"
        },
        invokers: {
            "init": {
                funcName: "ul.components.updates.init",
                args: ["{that}"]
            },
            "loadQueryData": {
                funcName: "ul.components.updates.loadQueryData",
                args: ["{that}"]
            },
            "rebindFoundation": {
                funcName: "ul.components.updates.rebindFoundation",
                args: ["{that}"]
            },
            "displayError": {
                funcName: "ul.components.updates.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayResults": {
                funcName: "ul.components.updates.displayResults",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        },
        modelListeners: {
            "settings.sources":    [
                {
                    funcName: "ul.components.updates.applySettingsChanges",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "settings.updated":    [
                {
                    funcName: "ul.components.updates.applySettingsChanges",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ]
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ul.components.updates.init",
                    "args":     "{that}"
                }
            ],
            markupLoaded: [
                {
                    "funcName": "ul.components.binder.applyBinding",
                    "args":     "{that}"
                },
                {
                    "funcName": "ul.components.updates.rebindFoundation",
                    "args":     "{that}"
                }
            ]
        }
    });
})(jQuery);