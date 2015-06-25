/*
  Pagination controls.  These are only displayed if `model.records` has content.

  There are two grades.  The smaller control only supports "next" and "previous" controls.  The long form adds
  individual controls for all pages.  The only difference is the template.

*/
"use strict";
/* global fluid */
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.search.navbar");

    gpii.ul.search.navbar.changeOffset = function (that, event) {
        event.preventDefault();
        var newOffset = Number.parseInt(event.target.getAttribute("offset"));
        that.applier.change("offset", newOffset);
    };

    gpii.ul.search.navbar.checkKey = function (that, event) {
        if (event.keyCode === 13) {
            that.changeOffset(event);
        }
    };

    // Start with the number of records and generate the data we need to create a navigation bar.
    gpii.ul.search.navbar.generatePagingData = function (that) {
        var newPagingData = [];
        var showNavBar     = false;
        var hasPrevious    = false;
        var hasNext        = false;
        var previousOffset = that.model.offset > that.model.limit ? that.model.offset - that.model.limit : 0;
        var nextOffsetCandidate = that.model.offset + that.model.limit;
        var nextOffset =  nextOffsetCandidate <= that.model.records.length ? nextOffsetCandidate : that.model.offset;

        if (that.model.records && that.model.records.length > 0) {
            var numPages = Math.ceil(that.model.records.length / that.model.limit);
            if (numPages > 1) {
                showNavBar = true;

                for (var a=0; a< numPages; a++) {
                    var offset = a * that.model.limit;
                    var current = offset === that.model.offset;
                    newPagingData.push({
                        label:   a+1,
                        offset:  offset,
                        current: current
                    });
                }

                hasPrevious = that.model.offset > 0;
                hasNext = that.model.records && that.model.offset < that.model.records.length;
            }
        }

        that.applier.change("showNavBar",     showNavBar);
        that.applier.change("hasPrevious",    hasPrevious);
        that.applier.change("hasNext",        hasNext);
        that.applier.change("previousOffset", previousOffset);
        that.applier.change("nextOffset",     nextOffset);
        that.applier.change("pages",          newPagingData);
    };

    fluid.defaults("gpii.ul.search.navbar", {
        gradeNames: ["gpii.templates.hb.client.templateAware", "autoInit"],
        template:   "search-topnav",
        model: {
            offset:      0,
            limit:       25,
            records:     [],
            showNavBar:  false,
            hasPrevious: false,
            hasNext:     false,
            pages:       {}
        },
        selectors: {
            initial: "",
            navLink: ".search-nav-link"
        },
        invokers: {
            renderInitialMarkup: {
                funcName: "gpii.templates.hb.client.templateAware.renderMarkup",
                args:     ["{that}", "initial", "{that}.options.template", "{that}.model", "html"]
            },
            generatePagingData: {
                funcName: "gpii.ul.search.navbar.generatePagingData",
                args:     ["{that}"]
            },
            changeOffset: {
                funcName: "gpii.ul.search.navbar.changeOffset",
                args:     ["{that}", "{arguments}.0"]
            },
            checkKey: {
                funcName: "gpii.ul.search.navbar.checkKey",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "onDomBind.wireControls": [
                {
                    "this": "{that}.dom.navLink",
                    method: "keydown",
                    args:   "{that}.checkKey"
                },
                {
                    "this": "{that}.dom.navLink",
                    method: "click",
                    args:   "{that}.changeOffset"
                }
            ]
        },
        modelListeners: {
            offset: {
                func:          "{that}.generatePagingData",
                excludeSource: "init"
            },
            limit: {
                func:          "{that}.generatePagingData",
                excludeSource: "init"
            },
            records: {
                func:          "{that}.generatePagingData",
                excludeSource: "init"
            },
            pages: {
                func:           "{that}.renderInitialMarkup",
                excludeSource:  "init"
            }
        }
    });
})();