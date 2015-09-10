/*
  Pagination controls.  These are only displayed if `model.totalRows` is longer than `limit`.

  There are two grades.  The smaller control only supports "next" and "previous" controls.  The long form adds
  individual controls for all pages.  The only difference is the template.

*/
"use strict";
/* global fluid */
(function () {
    var gpii = fluid.registerNamespace("gpii");
    var jQuery = fluid.registerNamespace("jQuery");

    fluid.registerNamespace("gpii.ul.search.navbar");

    gpii.ul.search.navbar.changeOffset = function (that, event) {
        that.oldFocus = event.target;

        event.preventDefault();
        var newOffset = Number.parseInt(event.target.getAttribute("offset"));
        that.applier.change("offset", newOffset);
    };

    gpii.ul.search.navbar.checkKey = function (that, event) {
        if (event.keyCode === 13) {
            that.changeOffset(event);
        }
    };

    // Preserve focus on a redraw
    gpii.ul.search.navbar.focusAfterRender = function (that) {
        if (that.oldFocus) {
            // The "next" and "previous" links may have the same offset as a numbered link.  We go through this to
            // determine which one should receive focus.

            // We are working with our own "previous" link
            var classList = fluid.makeArray(that.oldFocus.classList);
            if (classList.indexOf("search-nav-prev-link") !== -1) {
                that.locate("navPrevLink").focus();
            }

            // We are working with our own "next" link
            else if (classList.indexOf("search-nav-next-link") !== -1) {
                that.locate("navNextLink").focus();
            }

            // We are working with one of our numbered navigation links
            else if (classList.indexOf("search-nav-num-link") !== -1) {
                var focused = false;
                fluid.each (that.locate("navNumLink"), function (link) {
                    var linkOffset = parseInt(link.getAttribute("offset"),10);
                    if (!focused && linkOffset === that.model.offset) {
                        link.focus();
                        focused = true;
                    }
                });
            }
        }

        // Remove the previous focus placeholder to avoid mistakenly changing the focus when someone else changes our
        // model (for example when a new search is performed).
        delete that.oldFocus;
    };

    // Start with `totalRows` and generate the data we need to create a navigation bar.
    gpii.ul.search.navbar.generatePagingData = function (that) {
        var newPagingData = [];
        var showNavBar     = false;
        var hasPrevious    = false;
        var hasNext        = false;
        var previousOffset = that.model.offset > that.model.limit ? that.model.offset - that.model.limit : 0;
        var nextOffsetCandidate = that.model.offset + that.model.limit;
        var nextOffset =  nextOffsetCandidate <= that.model.totalRows ? nextOffsetCandidate : that.model.offset;

        if (that.model.totalRows > 0) {
            var numPages = Math.ceil(that.model.totalRows  / that.model.limit);
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
                hasNext     = that.model.offset < that.model.totalRows;
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
        gradeNames: ["gpii.templates.templateAware", "autoInit"],
        template:   "search-topnav",
        members: {
            oldFocus: undefined
        },
        model: {
            offset:      0,
            limit:       25,
            totalRows:   0,
            showNavBar:  false,
            hasPrevious: false,
            hasNext:     false,
            pages:       {}
        },
        selectors: {
            initial:     "",
            focused:     ":focus",
            navLink:     ".search-nav-link",
            navPrevLink: ".search-nav-link.search-nav-prev-link",
            navNumLink:  ".search-nav-link.search-nav-num-link",
            navNextLink: ".search-nav-link.search-nav-next-link"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.template", "{that}.model"]
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
            ],
            "onMarkupRendered.focusAfterRender": {
                funcName: "gpii.ul.search.navbar.focusAfterRender",
                args:     ["{that}"]
            }
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
            totalRows: {
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