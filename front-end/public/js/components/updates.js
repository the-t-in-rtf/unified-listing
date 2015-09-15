// The "updates" report for database vendors
/* global fluid, document, jQuery */
"use strict";
(function ($) {
    var gpii = fluid.registerNamespace("gpii");

    // Transform function to strip "unified" from the list, as we cannot compare unified to itself.
    fluid.registerNamespace("gpii.ul.updates.controls");
    gpii.ul.updates.controls.excludeUnifiedSource = function (sources) {
        return sources.filter(function (value) { if (value !== "unified") { return true; }});
    };

    // The "source picker", which is also responsible for getting the list of valid sources.
    fluid.defaults("gpii.ul.updates.controls", {
        gradeNames: ["gpii.templates.templateAware", "gpii.templates.ajaxCapable"],
        template:   "updates-controls",
        ajaxOptions: {
            method: "GET",
            url:    "/api/sources"
        },
        rules: {
            successResponseToModel: {
                "sources": {
                    transform: {
                        type:      "gpii.ul.updates.controls.excludeUnifiedSource",
                        inputPath: "responseJSON.sources"
                    }
                }
            },
            errorResponseToModel: {
                "":             "notfound",
                "errorMessage": { literalValue: "Error loading the list of allowed sources." }
            },
            modelToRequestPayload: {
                "": "notfound"
            }
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["{that}.container", "{that}.options.template", "{that}.model"]
            }
        },
        listeners: {
            "onCreate.getAvailableSources": {
                func: "{that}.makeRequest"
            },
            "requestReceived.refresh": {
                func: "{that}.renderInitialMarkup"
            }
        },
        modelListeners: {
            user: {
                func: "{that}.makeRequest"
            }
        },
        selectors: {
            "updated":  ".ul-updates-updated-control",
            "sources":  ".ul-updates-sources-control"
        },
        bindings: [
            {
                selector:    "updated",
                path:        "updated",
                elementType: "date"
            },
            {
                selector:    "sources",
                path:        "sources",
                elementType: "select"
            }
        ]
    });

    fluid.registerNamespace("gpii.ul.updates");

    // We use the foundation "accordion" control, which needs to be rebound when the markup is reloaded...
    gpii.ul.updates.rebindFoundation = function () {
        $(document).foundation();
        $(document).foundation("accordion", "reflow");
    };

    fluid.defaults("gpii.ul.updates", {
        gradeNames: ["gpii.templates.templateFormControl"],
        hideOnSuccess: false,
        hideOnError:   false,
        ajaxOptions: {
            method:      "GET",
            url:         "/api/updates",
            traditional: true // We are passing array data, whose variable name jQuery will mangle without this option.
        },
        templates: {
            "initial": "updates-viewport"
        },
        rules: {
            // Rules to control how a successful response is applied to the model.
            successResponseToModel: {
                "":           "notfound",
                records:      "responseJSON.records",
                errorMessage: { literalValue: null }
            },

            // Rules to control how an error is applied to the model
            errorResponseToModel: {
                "":             "notfound",
                errorMessage:   "responseJSON.message",
                successMessage: { literalValue: null },
                records:        { literalValue: null }
            },

            // Rules to control how our model is parsed before making a request
            modelToRequestPayload: {
                "":      "notfound",
                source:  "sources",
                updated: "updated"
            }
        },
        selectors: {
            "initial":  ".ul-updates-viewport",
            "error":    ".ul-updates-error",
            "controls": ".ul-updates-controls",
            "output":   ".ul-updates-output"
        },
        components: {
            // Disable the built-in success message, as we only ever display errors.
            success: {
                type: "fluid.identity"
            },
            fieldControls: {
                type:          "gpii.ul.updates.controls",
                container:     "{updates}.dom.controls",
                createOnEvent: "{updates}.events.onMarkupRendered",
                options: {
                    model: {
                        sources:      "{updates}.model.sources",
                        updated:      "{updates}.model.updated",
                        user:         "{updates}.model.user",
                        errorMessage: "{updates}.model.errorMessage"  // Allow this component to display error messages if there are problems.
                    }
                }
            },
            output: {
                type: "gpii.templates.templateMessage",
                container: "{updates}.options.selectors.output",
                createOnEvent: "{updates}.events.onMarkupRendered",
                options: {
                    template: "updates-records",
                    model: {
                        message: "{updates}.dom.records"
                    }
                }
            }
        },
        model: {
            sources:      [],
            errorMessage: null
        },
        listeners: {
            "onMarkupRendered.rebindFoundation": {
                "funcName": "gpii.ul.updates.rebindFoundation",
                "args":     "{that}"
            }
        },
        modelListeners: {
            sources: {
                func:          "{that}.makeRequest",
                excludeSource: "init"
            },
            updated: {
                func:          "{that}.makeRequest",
                excludeSource: "init"
            }
        }
    });
})(jQuery);