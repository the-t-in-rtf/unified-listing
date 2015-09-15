// Javascript to evolve a "skip nav link" into something that both scrolls and changes the tab focus to the element
// with the aria "main" role.  According to the W3C, there should be only one of these, so it should be safe to focus
// on it:
//
// http://www.w3.org/TR/wai-aria/roles#main
//
// This grade can only meaningfully be added to an existing `templateAware` component.  You will also need to ensure
// that your markup contains a link matching the `link` selector, and a piece of content tagged with `role="main"`.
//
// Your main element should be focusable (i.e. have a `tabindex` property set).
//
"use strict";
/* global fluid */
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ul.hasSkipNavLink");

    // TODO:  This pattern is used here and in `toggle.js`.  Harden it up and make a common grade.
    gpii.ul.hasSkipNavLink.handleKeyPress = function (that, event) {
        if (event) {
            var handled = false;
            fluid.each(that.options.boundKeyCodes, function (value) {
                if (!handled && event.keyCode === value) {
                    that.focusOnMain(event);
                    handled = true;
                }
            });
        }
    };

    gpii.ul.hasSkipNavLink.focusOnMain = function (that, event) {
        if (event) {
            event.preventDefault();
        }
        var mainElement = that.locate("main");
        mainElement.focus();

        fluid.each(mainElement.get(), function (element) { element.scrollIntoView(); });
    };

    fluid.defaults("gpii.ul.hasSkipNavLink", {
        selectors: {
            link: ".topbar-skip-link",
            main: "[role='main']"
        },
        boundKeyCodes: {
            enter: 13
        },
        invokers: {
            handleKeyPress: {
                funcName: "gpii.ul.hasSkipNavLink.handleKeyPress",
                args:     ["{that}", "{arguments}.0"]
            },
            focusOnMain: {
                funcName: "gpii.ul.hasSkipNavLink.focusOnMain",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "onMarkupRendered.wireSkipNav": [
                {
                    "this": "{that}.dom.link",
                    method: "keydown",
                    args:   "{that}.handleKeyPress"
                },
                {
                    "this": "{that}.dom.link",
                    method: "click",
                    args:   "{that}.focusOnMain"
                }
            ]
        }
    });

    // A shim to make `gpii.ul.hasSkipNavLink` work for plain old templates (non `templateAware`).
    fluid.defaults("gpii.ul.hasSkipNavLink.nonTemplateAware", {
        gradeNames: ["gpii.ul.hasSkipNavLink"],
        events: {
            onMarkupRendered: {
                events: {
                    onCreate: "onCreate"
                }
            }
        }
    });

})();
