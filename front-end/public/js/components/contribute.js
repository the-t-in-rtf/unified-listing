// TODO: Migrate this to a "content aware" part of the API when this feature is complete:  https://github.com/GPII/gpii-express/pull/6
// TODO:  Figure out what happens when a user contributes changes to the same record a second time.
// Component to allow end users to contribute changes, which can be reviewed and incorporated into the unified record.
/* global fluid */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    // The component that handles data entry, including saving changes.
    fluid.defaults("gpii.ul.contribute.form", {
        gradeNames:    ["gpii.templates.templateFormControl"],
        hideOnSuccess: false,
        hideOnError:   false,
        ajaxOptions: {
            method:   "PUT",
            url:      "/api/product/",
            dataType: "json",
            json:     true
        },
        rules: {
            modelToRequestPayload: {
                "": "record"
            },
            successResponseToModel: {
                "":             "notfound",
                record:         "responseJSON.record",
                successMessage: { literalValue: "Your submission has been saved.  You may continue revising this or close the window."},
                errorMessage:   { literalValue: null }
            },
            errorResponseToModel: {
                successMessage: { literalValue: null }
            }
        },
        selectors: {
            initial:          "",
            name:             ".contribute-form-name",
            description:      ".contribute-form-description",
            manufacturerName: ".contribute-form-manufacturer-name",
            address:          ".contribute-form-manufacturer-address",
            cityTown:         ".contribute-form-manufacturer-citytown",
            provinceRegion:   ".contribute-form-manufacturer-provinceregion",
            postalCode:       ".contribute-form-manufacturer-postalcode",
            country:          ".contribute-form-manufacturer-country",
            email:            ".contribute-form-manufacturer-email",
            phone:            ".contribute-form-manufacturer-phone",
            url:              ".contribute-form-manufacturer-url",
            source:           ".contribute-form-source",
            submit:           ".contribute-form-submit",
            settingsDesc:     ".contribute-form-settings-description",
            pricing:          ".contribute-form-pricing",
            settingsStorage:  ".contribute-form-settings-storage",
            settingsRestart:  ".contribute-form-settings-restart"
        },
        bindings: {
            source:           "user.name",
            name:             "record.name",
            description:      "record.description",
            manufacturerName: "record.manufacturer.name",
            address:          "record.manufacturer.address",
            cityTown:         "record.manufacturer.cityTown",
            provinceRegion:   "record.manufacturer.provinceRegion",
            postalCode:       "record.manufacturer.postalCode",
            country:          "record.manufacturer.country",
            email:            "record.manufacturer.email",
            phone:            "record.manufacturer.phone",
            url:              "record.manufacturer.url",
            settingsDesc:     "record.sourceData.settings.description",
            pricing:          "record.sourceData.pricing",
            settingsStorage:  "record.sourceData.settings.storage",
            settingsRestart:  "record.sourceData.settings.restart"
        },
        templates: {
            initial: "contribute-form"
        },
        components: {
            // We defer to the parent's feedback components and disable those included in `templateFormControl` by default.
            error:   { type: "fluid.identity"},
            success: { type: "fluid.identity"}
        }
    });

    // The main container that handles the initial load and is a gatekeeper for rendering and displaying the data entry form.
    fluid.registerNamespace("gpii.ul.contribute");

    // We can only retrieve existing record data if we have a uid.
    gpii.ul.contribute.makeRequestIfNeeded = function (that) {
        if (that.options.req.query.uid) {
            that.makeRequest();
        }
    };

    gpii.ul.contribute.onlyDrawFormIfLoggedIn = function (that) {
        var form = that.locate("form");
        if (that.model.user && that.model.user.name) {
            form.show();

            // The form will be created the first time this is fired and will be ignored after that.
            that.events.onReadyToEdit.fire(that);
        }
        else {
            form.hide();
            that.applier.change("errorMessage", that.options.messages.loginRequired);
        }
    };

    // The component that loads the record content and controls the initial rendering.  Subcomponents
    // listen for this component to give the go ahead, and then take over parts of the interface.
    fluid.defaults("gpii.ul.contribute", {
        gradeNames: ["gpii.templates.templateAware", "gpii.templates.ajaxCapable"],
        baseUrl:    "/api/product/",
        messages: {
            loginRequired: "You must log in to contribute to the Unified Listing."
        },
        selectors: {
            viewport: ".contribute-viewport",
            form:     ".contribute-form"
        },
        mergePolicy: {
            rules: "noexpand"
        },
        ajaxOptions: {
            method:   "GET",
            dataType: "json"
        },
        model: {
            successMessage: false,
            errorMessage:   false,
            record: {
                uid:    "{that}.options.req.query.uid",
                status: "new"
            }
        },
        rules: {
            modelToRequestPayload: {
                "":      "notfound"
            },
            successResponseToModel: {
                "":     "notfound",
                // Only update the model with select data, rather than inappropriately clobbering the source, sid, etc.
                record: {
                    name:         "responseJSON.record.name",
                    description:  "responseJSON.record.description",
                    manufacturer: "responseJSON.record.manufacturer"
                },
                errorMessage:   { literalValue: null }
            },
            errorResponseToModel: {
                "":             "notfound",
                errorMessage:   "message",
                successMessage: { literalValue: null }
            },
            ajaxOptions: {
                url: {
                    transform: {
                        type: "gpii.ul.stringTemplate",
                        template: "%baseUrl/unified/%uid",
                        terms: {
                            baseUrl: "{that}.options.baseUrl",
                            uid:     "{that}.options.req.query.uid"
                        },
                        value: "https://issues.fluidproject.org/browse/FLUID-5703" // <--- The bug that requires this unused block.
                    }
                }
            }
        },
        template: "contribute-viewport",
        events: {
            onReadyToEdit: null,
            onRenderedAndReadyToEdit: {
                events: {
                    onMarkupRendered: "onMarkupRendered",
                    onReadyToEdit:    "onReadyToEdit"
                }
            }
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["viewport", "{that}.options.template", "{that}.model"]
            },
            onlyDrawFormIfLoggedIn: {
                funcName: "gpii.ul.contribute.onlyDrawFormIfLoggedIn",
                args:     ["{that}"]
            }
        },
        listeners: {
            "onCreate.makeRequestIfNeeded": {
                funcName: "gpii.ul.contribute.makeRequestIfNeeded",
                args:     ["{that}"]
            },
            "onCreate.drawFormIfNeeded": {
                func: "{that}.onlyDrawFormIfLoggedIn"
            }
        },
        modelListeners: {
            user: [
                {
                    func: "{that}.onlyDrawFormIfLoggedIn"
                },
                {
                    func: "{that}.applier.change",
                    args: ["record.source", "{change}.value.name"]
                }
            ]
        },
        components: {
            // The common component for positive feedback.
            success: {
                type:          "gpii.templates.templateMessage",
                createOnEvent: "{contribute}.events.onMarkupRendered",
                container:     ".contribute-success",
                options: {
                    template: "common-success",
                    model: {
                        message: "{contribute}.model.successMessage"
                    }
                }
            },
            // The common component for negative feedback (errors, etc).
            error: {
                type:          "gpii.templates.templateMessage",
                createOnEvent: "{contribute}.events.onMarkupRendered",
                container:     ".contribute-error",
                options: {
                    template: "common-error",
                    model: {
                        message: "{contribute}.model.errorMessage"
                    }
                }
            },
            // The data entry form.
            form: {
                type:          "gpii.ul.contribute.form",
                createOnEvent: "{contribute}.events.onRenderedAndReadyToEdit",
                container:     "{contribute}.options.selectors.form",
                options: {
                    model: "{contribute}.model"
                }
            }
        }
    });
})();