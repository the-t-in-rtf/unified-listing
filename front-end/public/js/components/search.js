// Basic search component for the Unified Listing
/* global fluid */
"use strict";
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.search.query");

    gpii.ul.search.query.refreshOnUpdateIfHasQuery = function (that) {
        if (that.model.q) {
            that.applier.change("offset", 0);
            gpii.ul.search.query.refreshIfHasQuery(that);
        }
    };

    gpii.ul.search.query.refreshIfHasQuery = function (that) {
        if (that.model.q) {
            that.submitForm();
        }
    };

    fluid.defaults("gpii.ul.search.query", {
        gradeNames: ["gpii.templates.templateFormControl"],
        ajaxOptions: {
            url:      "/api/search",
            method:   "GET",
            dataType: "json"
        },
        hideOnSuccess: false,
        hideOnError:   false,
        rules: {
            successResponseToModel: {
                "":           "notfound",
                records:      "responseJSON.records", // The "records" component will handle displaying records.
                totalRows:    "responseJSON.total_rows",
                errorMessage: { literalValue: null }
            },
            errorResponseToModel: {
                successMessage: { literalValue: null }
            },
            modelToRequestPayload: {
                "":       "notfound",
                q:        "q",
                source:   "source",
                status:   "status",
                sort:     "sort",
                versions: "versions",
                sources:  "sources"
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
                funcName: "gpii.templates.templateFormControl.submitForm",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        modelListeners: {
            q: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            sort: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            status: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            },
            limit: {
                funcName:      "gpii.ul.search.query.refreshOnUpdateIfHasQuery",
                excludeSource: "init",
                args:          ["{that}"]
            }
        },
        listeners: {
            "onCreate.fireIfReady": {
                funcName:      "gpii.ul.search.query.refreshIfHasQuery",
                args:          ["{that}"]
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
        gradeNames: ["gpii.templates.templateAware"],
        model: {
            records:  []
        },
        selectors: {
            results: ""
        },
        template: "search-records",
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["results", "{that}.options.template", "{that}.model"]
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

    // The "sort" control that updates the sort values based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.sort", {
        gradeNames: ["gpii.ul.select"],
        template:   "search-sort",
        selectors:  {
            initial: "",
            select:  ".search-sort-select"
        },
        select: {
            options: {
                nameAsc: {
                    label: "by name, A-Z",
                    value: "/name"
                },
                nameDesc: {
                    label: "by name, Z-A",
                    value: "\\name"
                }
            }
        }
    });

    // The "status" control that updates the sort values based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.status", {
        gradeNames: ["gpii.ul.status"],
        selectors:  {
            select:  ".search-status-option"
        }
    });

    // The "limit" control that updates the number of records per page based on a predefined list of possible settings.
    fluid.defaults("gpii.ul.search.limit", {
        gradeNames: ["gpii.ul.select"],
        template:   "search-limit",
        selectors:  {
            initial: "",
            select:  ".search-limit-select"
        },
        select: {
            options: {
                twentyFive: {
                    label: "25 records per page",
                    value: "25"
                },
                fifty: {
                    label: "50 records per page",
                    value: "50"
                },
                hundred: {
                    label: "100 records per page",
                    value: "100"

                }
            }
        }
    });

    // The wrapper component that wires together all controls.
    fluid.defaults("gpii.ul.search", {
        gradeNames: ["gpii.templates.templateAware"],
        model: {
            q:         "",
            source:    [],
            status:    [ "new", "active", "discontinued"],
            sort:      "/name",
            offset:    0,
            limit:     25,
            totalRows: 0,
            versions:  false,
            sources:   true,
            records:   []
        },
        components: {
            // Sync our search settings with the queryString and history, so that bookmarking and back/forward buttons
            // work as expected.  Must be a child of query so that it is created at the right time to take
            // advantage of its bindings.
            locationBar: {
                type:          "gpii.locationBar.syncAll",
                options: {
                    events: {
                        onReady: {
                            events: {
                                queryDataLoaded:  "queryDataLoaded",
                                onMarkupRendered: "{search}.events.onMarkupRendered"
                            }
                        }
                    },
                    // TODO:  Add detailed tests to prevent this component from blowing away the existing model data.
                    //model: {
                    //    offset:  "{search}.model.offset",
                    //    limit:   "{search}.model.limit",
                    //    q:       "{search}.model.q",
                    //    sort:    "{search}.model.sort",
                    //    source:  "{search}.model.source",
                    //    status:  "{search}.model.status"
                    //}
                }
            },
            // The main query form
            query: {
                type:          "gpii.ul.search.query",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.form",
                options: {
                    model: "{search}.model"
                }
            },
            // The search results, if any
            records: {
                type:          "gpii.ul.search.records",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.records",
                options: {
                    model: {
                        records: "{search}.model.records",
                        offset:  "{search}.model.offset",
                        limit:   "{search}.model.limit"
                    }
                }
            },
            // The top pagination bar.
            topnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.topnav",
                options: {
                    model: {
                        totalRows: "{search}.model.totalRows",
                        offset:    "{search}.model.offset",
                        limit:     "{search}.model.limit"
                    }
                }
            },
            // TODO:  Try drawing both controls with a single selector and component
            // The bottom pagination bar
            bottomnav: {
                type:          "gpii.ul.search.navbar",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.bottomnav",
                options: {
                    model: {
                        totalRows: "{search}.model.totalRows",
                        offset:    "{search}.model.offset",
                        limit:     "{search}.model.limit"
                    }
                }
            },
            // The sorting controls
            sort: {
                type:          "gpii.ul.search.sort",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.sort",
                options: {
                    model: {
                        select:   "{search}.model.sort"
                    }
                }
            },
            // The status filtering controls
            status: {
                type:          "gpii.ul.search.status",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.status",
                options: {
                    model: {
                        select: "{search}.model.status"
                    }
                }
            },
            // The "records per page" controls
            limit: {
                type:          "gpii.ul.search.limit",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.dom.limit",
                options: {
                    model: {
                        select:   "{search}.model.limit"
                    }
                }
            },
            // A toggle to show/hide the search options
            optionsToggle: {
                type: "gpii.ul.toggle",
                createOnEvent: "{locationBar}.events.onReady",
                container:     "{search}.container",
                options: {
                    selectors: {
                        toggle:    ".search-options-toggle",
                        container: ".search-options"
                    },
                    toggles: {
                        container: true
                    },
                    listeners: {
                        "onCreate.applyBindings": "{that}.events.onRefresh"
                    }
                }
            }
        },
        selectors: {
            initial:   ".search-viewport",
            success:   ".search-success",
            error:     ".search-error",
            form:      ".search-query",
            topnav:    ".search-topnav",
            records:   ".search-records",
            sort:      ".search-sort",
            status:    ".search-status",
            limit:     ".search-limit",
            bottomnav: ".search-bottomnav"
        },
        templates: {
            "initial": "search-viewport"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: [ "initial", "{that}.options.templates.initial", "{that}.model"]
            }
        }
    });

    fluid.defaults("gpii.ul.search.hasUserControls", {
        gradeNames: ["gpii.ul.search", "gpii.ul.hasUserControls"]
    });
})();