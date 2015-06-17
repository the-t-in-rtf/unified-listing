// Basic search component for the Unified Listing
/* global fluid */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.search.query");

    // We need to reset our offset whenever a new search term is entered, so we intercept the form submission temporarily
    gpii.ul.search.query.clearOffsetAndSubmitForm = function(that, event) {
        that.applier.change("offset", 0);
        gpii.templates.hb.client.templateFormControl.submitForm(that, event);
    };

    fluid.defaults("gpii.ul.search.query", {
        gradeNames: ["gpii.templates.hb.client.templateFormControl", "autoInit"],
        ajaxOptions: {
            url:    "/api/search",
            method: "GET"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        model: {
            q:        "",
            source:   [],
            status:   [],
            sort:     "",
            offset:   0,
            limit:    5,
            versions: false,
            sources:  false,
            records:  []
        },
        rules: {
            submission: {
                "":       "notfound",
                q:        "q",
                source:   "source",
                status:   "status",
                sort:     "sort",
                versions: "versions",
                sources:  "sources"
            },
            model: {
                "":      "notfound",
                records: "responseJSON.records" // The "records" component will handle displaying records.
            },
            success: {
                "": "notfound" // We are not going to refresh anything on "success", so make sure there is nothing to work with.
            }
        },
        selectors: {
            initial: "",
            form:    ".search-query-form",
            success: ".search-query-success",
            error:   ".search-query-error",
            q:       ".search-query-string",
            submit:  ".search-query-submit"
        },
        templates: {
            initial: "search-query",
            success: "common-success",
            error:   "common-error"
        },
        bindings: {
            q: "q"
        },
        invokers: {
            submitForm: {
                funcName: "gpii.ul.search.query.clearOffsetAndSubmitForm",
                args:     ["{that}", "{arguments}.0"]
            }
        }
    });

    fluid.registerNamespace("gpii.ul.search.records");

    // TODO:  Replace this with a common paging component
    // Return `limit` records from `array`, starting at `offset`
    gpii.ul.search.records.pageResults = function (array, offset, limit) {
        if (!array) { return; }

        // Set sensible defaults if we are not passed anything.
        var start = offset ? offset : 0;
        var end   = limit ? start + limit : array.length - offset;
        return array.slice(start, end);
    };

    gpii.ul.search.records.pageAndRender = function (that) {
        that.model.pagedRecords = gpii.ul.search.records.pageResults(that.model.records, that.model.offset, that.model.limit);
        that.renderInitialMarkup();
    };


    fluid.defaults("gpii.ul.search.records", {
        gradeNames: ["gpii.templates.hb.client.templateAware", "autoInit"],
        model: {
            records:  [],
            // These should be wired into another component that controls their values.
            offset:   0,
            limit:    25
        },
        selectors: {
            results: ""
        },
        template: "search-records",
        invokers: {
            renderInitialMarkup: {
                funcName: "gpii.templates.hb.client.templateAware.renderMarkup",
                args:      [
                    "{that}",
                    "results",
                    "{that}.options.template",
                    "{that}.model",
                    "html"
                ]
            },
            pageAndRender: {
                funcName: "gpii.ul.search.records.pageAndRender",
                args:     ["{that}"]
            }
        },
        modelListeners: {
            records: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            },
            offset: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            },
            limit: {
                func:          "{that}.pageAndRender",
                excludeSource: "init"
            }
        }
    });

    // The wrapper component that wires together all controls.
    fluid.defaults("gpii.ul.search", {
        gradeNames: ["gpii.templates.hb.client.templateAware", "autoInit"],
        components: {
            query: {
                type:          "gpii.ul.search.query",
                createOnEvent: "{search}.events.onMarkupRendered",
                container:     "{search}.dom.form"
            },
            records: {
                type:          "gpii.ul.search.records",
                createOnEvent: "{search}.events.onMarkupRendered",
                container:     "{search}.dom.records",
                options: {
                    model: {
                        records: "{query}.model.records",
                        offset:  "{query}.model.offset",
                        limit:   "{query}.model.limit"
                    }
                }
            },
            topnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{search}.events.onMarkupRendered",
                container:     "{search}.dom.topnav",
                options: {
                    model: {
                        records: "{query}.model.records",
                        offset:  "{query}.model.offset",
                        limit:   "{query}.model.limit"
                    }
                }
            },
            bottomnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{search}.events.onMarkupRendered",
                container:     "{search}.dom.bottomnav",
                options: {
                    template: "search-bottomnav",
                    model: {
                        records: "{query}.model.records",
                        offset:  "{query}.model.offset",
                        limit:   "{query}.model.limit"
                    }
                }
            }
            // TODO:  Create components which manage each separate part of our model
            /*
             source:   "source",
             status:   "status",
             sort:     "sort",
             offset:   "offset",
             limit:    "limit",
             versions: "versions",
             sources:  "sources"
             */
            // TODO: Add full component for paging (numbered pages, etc.)
            // TODO: Add previous/next footer paging component
            // TODO: Add status limiting component
            // TODO: Add source limiting component
            // TODO: Add version limiting component
        },
        selectors: {
            initial:   "",
            success:   ".search-success",
            error:     ".search-error",
            form:      ".search-query",
            topnav:    ".search-topnav",
            records:   ".search-records",
            bottomnav: ".search-bottomnav"
        },
        templates: {
            "initial": "search-viewport"
        },
        invokers: {
            renderInitialMarkup: {
                funcName: "gpii.templates.hb.client.templateAware.renderMarkup",
                args: [
                    "{that}", "initial", "{that}.options.templates.initial", "{that}.model", "html"
                ]
            }
        }
    });
})();