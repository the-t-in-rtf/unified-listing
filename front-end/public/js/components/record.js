// Component to display the view/edit interface for a single record.

/* global fluid */
"use strict";
(function () {
    //var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.record");


    // TODO: Migrate this to a "content aware" part of the API when this feature is complete:  https://github.com/GPII/gpii-express/pull/6


    // TODO:  Create a sub-component for the form and bind it to a reasonable event.
    fluid.defaults("gpii.ul.record", {
        gradeNames: ["gpii.templates.hb.client.templateFormControl", "autoInit"],
        ajaxOptions: {
            method:   "GET",
            dataType: "json"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        model: {
            sources: true
        },
        rules: {
            success: {
                "": "notfound"
            },
            model: {
                record: "responseJSON.record",
                // TODO:  Review with Antranig and discuss alternatives if this is still needed after the "content aware" refactor
                isLoaded: {
                    literalValue: true
                }
            }
        },
        selectors: {
            initial: ".record-viewport",
            form:    ".record-form",
            success: ".record-success",
            error:   ".record-error"
        },
        templates: {
            initial: "record-viewport",
            success: "common-success",
            error:   "common-error"
        },
        listeners: {
            "onCreate.loadRecord": {
                func: "{that}.submitForm",
                args: [null]
            }
        },
        modelListeners: {
            isLoaded: {
                func: "{that}.renderInitialMarkup"
            }
        }
    });
})();