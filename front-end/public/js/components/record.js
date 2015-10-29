// TODO: Migrate this to a "content aware" part of the API when this feature is complete:  https://github.com/GPII/gpii-express/pull/6
// Component to display the view/edit interface for a single record.

/* global fluid */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    // TODO:  Fix this to enable reviewer editing of the "status" field.
    // The sub-component that handles editing the "status" field.
    fluid.defaults("gpii.ul.record.edit.status", {
        gradeNames: ["gpii.ul.status"],
        template: "record-edit-status",
        selectors:  {
            select:  ""
        }
    });

    // The component that handles the binding, etc. for the "Edit" form.
    fluid.defaults("gpii.ul.record.edit", {
        gradeNames: ["gpii.templates.templateFormControl"],
        ajaxOptions: {
            url:         "/api/product",
            method:      "PUT",
            dataType:    "json",
            json:        true
        },
        rules: {
            modelToRequestPayload: {
                "": "record"
            },
            successResponseToModel: {
                "":      "notfound",
                message: "Your changes have been saved."
            }
        },
        templates: {
            initial: "record-edit"
        },
        selectors: {
            status:           ".record-edit-status",
            name:             ".record-edit-name",
            description:      ".record-edit-description",
            source:           ".record-edit-source",
            sid:              ".record-edit-sid",
            uid:              ".record-edit-uid",
            manufacturerName: ".manufacturer-name",
            address:          ".manufacturer-address",
            cityTown:         ".manufacturer-citytown",
            provinceRegion:   ".manufacturer-provinceregion",
            postalCode:       ".manufacturer-postalcode",
            country:          ".manufacturer-country",
            email:            ".manufacturer-email",
            phone:            ".manufacturer-phone",
            url:              ".manufacturer-url",
            error:            ".record-edit-error",
            success:          ".record-edit-success",
            submit:           ".record-edit-submit"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        // TODO:  on success, somehow let our parent know to toggle itself again.
        bindings: {
            name:             "record.name",
            description:      "record.description",
            // "status" is handled by a subcomponent (see below)
            // status: "record.status",
            source:           "record.source",
            sid:              "record.sid",
            uid:              "record.uid",
            manufacturerName: "record.manufacturer.name",
            address:          "record.manufacturer.address",
            cityTown:         "record.manufacturer.cityTown",
            provinceRegion:   "record.manufacturer.provinceRegion",
            postalCode:       "record.manufacturer.postalCode",
            country:          "record.manufacturer.country",
            email:            "record.manufacturer.email",
            phone:            "record.manufacturer.phone",
            url:              "record.manufacturer.url"
        },
        components: {
            // This component is not responsible for displaying success or error messages on its own, so we replace
            // the built-in success and error components from the base grade with dummy `fluid.identity` components.
            //success: { type: "fluid.identity" },
            //error:   { type: "fluid.identity" },
            // The "status" controls.
            status: {
                type:          "gpii.ul.record.edit.status",
                createOnEvent: "{edit}.events.onMarkupRendered",
                container:     "{edit}.dom.status",
                options: {
                    model: {
                        select:   "{edit}.model.record.status"
                    }
                }
            }
        }
    });

    fluid.registerNamespace("gpii.ul.record");

    // Defer to the parent success handler, but fire an event to instantiate the toggle and edit components if appropriate.
    // TODO: Migrate to using permissions to check whether editing should be allowed.
    // TODO: Delegate handling of the "edit" panel to a subcomponent
    gpii.ul.record.checkReadyToEdit = function (that) {
        var editControls    = that.locate("editControls");
        var suggestControls = that.locate("suggestControls");

        if (that.model.record && that.model.record.source === "unified" && that.model.user && that.model.user.roles && that.model.user.roles.indexOf("reviewers") !== -1) {
            editControls.show();
            suggestControls.hide();
            that.events.onReadyForEdit.fire(that);
        }
        else {
            editControls.hide();
            suggestControls.show();
        }
    };

    // Convenience grade to avoid repeating the common toggle options for all three toggles (see below).
    fluid.defaults("gpii.ul.record.toggle", {
        gradeNames: ["gpii.ul.toggle"],
        selectors: {
            editForm: ".record-edit",
            viewForm: ".record-view"
        },
        toggles: {
            editForm: true,
            viewForm: true
        }
    });

    // Grade to handle the special case of hiding the edit form when the record is saved successfully
    fluid.registerNamespace("gpii.ul.record.toggle.onSave");
    gpii.ul.record.toggle.onSave.hideOnSuccess = function (that, success) {
        if (success) {
            that.performToggle();
        }
    };

    fluid.defaults("gpii.ul.record.toggle.onSave", {
        gradeNames: ["gpii.ul.record.toggle"],
        invokers: {
            hideOnSuccess: {
                funcName: "gpii.ul.record.toggle.onSave.hideOnSuccess",
                args:     ["{that}", "{arguments}"]
            }
        }
    });

    // The component that loads the record content and controls the initial rendering.  Subcomponents
    // listen for this component to give the go ahead, and then take over parts of the interface.
    var rebind = {

    };fluid.defaults("gpii.ul.record", {
        gradeNames: ["gpii.templates.ajaxCapable", "gpii.templates.templateAware"],
        baseUrl:    "/api/product/",
        selectors: {
            viewport:        ".record-viewport",
            editControls:    ".record-edit-control-panel",
            suggestControls: ".record-suggest-control-panel"
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
            record:         false,
            user:           false
        },
        rules: {
            modelToRequestPayload: {
                "":      "notfound",
                sources: { literalValue: true }
            },
            successResponseToModel: {
                "":     "notfound",
                record: "responseJSON.record"
            },
            ajaxOptions: {
                url: {
                    transform: {
                        type: "gpii.ul.stringTemplate",
                        template: "%baseUrl%source/%sid",
                        terms: {
                            baseUrl: "{that}.options.baseUrl",
                            source:  "{that}.options.req.query.source",
                            sid:     "{that}.options.req.query.sid"
                        },
                        value: "https://issues.fluidproject.org/browse/FLUID-5703" // <--- The bug that requires this unused block.
                    }
                }
            }
        },
        template: "record-viewport",
        events: {
            onReadyForEdit: null,
            onRenderedAndReadyForEdit: {
                events: {
                    onReadyForEdit:   "onReadyForEdit",
                    onMarkupRendered: "onMarkupRendered"
                }
            },
            onEditRendered: null
        },
        modelListeners: {
            record: {
                func: "{that}.checkReadyToEdit"
            },
            user: {
                func: "{that}.checkReadyToEdit"
            }
        },
        components: {
            view: {
                type:          "gpii.templates.templateMessage",
                container:     ".record-view",
                createOnEvent: "{record}.events.onMarkupRendered",
                options: {
                    template: "record-view",
                    model:    "{record}.model",
                    listeners: {
                        // Check to see if our "edit" button should be visible on render
                        "onMarkupRendered.checkReadyToEdit": {
                            func: "{record}.checkReadyToEdit"
                        }
                    }
                }
            },
            edit: {
                type:          "gpii.ul.record.edit",
                createOnEvent: "{record}.events.onRenderedAndReadyForEdit",
                container:     ".record-edit",
                options: {
                    model: "{record}.model"
                }
            },
            // Toggles must exist at this level so that they can be aware of both the view and edit form, thus we have
            // two very similar toggle controls that are instantiated if we're editing, and which are rebound as needed.
            toggleFromView: {
                type:          "gpii.ul.record.toggle",
                createOnEvent: "{record}.events.onRenderedAndReadyForEdit",
                container:     "{record}.container",
                options: {
                    selectors: {
                        toggle: ".record-view .record-toggle"
                    },
                    events: {
                        // Our view may be redrawn over and over again, and we have to make sure our bindings work each time.
                        onRefresh: {
                            events: {
                                parentReady: "{view}.events.onMarkupRendered"
                            }
                        }
                    },
                    // We need to refresh on startup because the view may already have been rendered.
                    listeners: {
                        "onCreate.refresh": {
                            func: "{that}.events.onRefresh.fire"
                        }
                    }
                }
            },
            toggleFromEdit: {
                type:          "gpii.ul.record.toggle",
                createOnEvent: "{record}.events.onRenderedAndReadyForEdit",
                container:     "{record}.container",
                options: {
                    selectors: {
                        toggle: ".record-edit .record-toggle"
                    },
                    // The edit form is only rendered once, and before us, so we can just apply our bindings on creation.
                    listeners: {
                        "onCreate.applyBindings": {
                            func: "{that}.events.onRefresh.fire"
                        }
                    }
                }
            },
            // The last toggle has no controls, and is used to hide the editing interface when the record is saved successfully.
            toggleAfterSave: {
                type:          "gpii.ul.record.toggle.onSave",
                createOnEvent: "{record}.events.onRenderedAndReadyForEdit",
                container:     "{record}.container",
                options: {
                    listeners: {
                        "{edit}.events.requestReceived": {
                            func: "{that}.hideOnSuccess"
                        }
                    }
                }
            },
            // We don't need the rest of the baggage from `templateFormControl`, but we do need a similar pattern to
            // display common "success" and "error" messages.
            success: {
                type:          "gpii.templates.templateMessage",
                createOnEvent: "{record}.events.onMarkupRendered",
                container:     ".record-success",
                options: {
                    template: "common-success",
                    model: {
                        message: "{record}.model.successMessage"
                    }
                }
            },
            error: {
                type:          "gpii.templates.templateMessage",
                createOnEvent: "{record}.events.onMarkupRendered",
                container:     ".record-error",
                options: {
                    template: "common-error",
                    model: {
                        message: "{record}.model.errorMessage"
                    }
                }
            }
        },
        invokers: {
            checkReadyToEdit: {
                funcName: "gpii.ul.record.checkReadyToEdit",
                args:     ["{that}", "{arguments}.2"]
            },
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["viewport", "{that}.options.template", "{that}.model"]
            }
        },
        listeners: {
            "onCreate.makeRequest": {
                func: "{that}.makeRequest"
            }
        }
    });
})();