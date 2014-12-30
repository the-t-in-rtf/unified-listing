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

        // TODO:  Update to pull from the "updates" API
        var settings = {
            url:     that.options.baseUrl + "/",
            success: that.displayResults,
            error:   that.displayError,
            data:    {
                updated: that.model.settings.updated,
                source:  that.model.settings.source
            }
        };

        $.ajax(settings);
    };

    updates.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }


        var output = that.locate("output");
        output.show();
        templates.prepend(output,"common-error", message);
        that.events.markupLoaded.fire();
    };

    updates.displayResults = function(that, data, textStatus, jqXHR) {
        var output = that.locate("output");
        output.show();
        if (data && data.records && data.records.length > 0) {
            // TODO:  Update the template to work with the output of the "update" API and load the content here.
            output.html("do something!");
        }
        else {
            templates.replaceWith(output, "updates-norecord");
        }
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    updates.init = function(that) {
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
                }
            ]
        }
    });
})(jQuery);