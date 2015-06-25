// A simple component to toggle visibility of one element when another is clicked or has the right keydown event.
//
// The options you are expected to pass are:
//
//  1. `selectors.toggle`: the element which will toggle the container when clicked or when the right keydown event occurs.
//  2. `selectors.container`: the element which will be shown or hidden.
//
// The component will try to wire itself up on startup.  You are expected to call the `refresh` invoker manually if
// there are markup changes.
//
/* global fluid */
"use strict";
(function() {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.ul.toggle");

    gpii.ul.toggle.toggleContainer = function (that, event) {
        if (event) {
            event.preventDefault();
        }
        that.locate("container").toggle();
    };

    gpii.ul.toggle.filterKeyPress = function (that, event) {
        if (event) {
            var handled = false;
            fluid.each(that.options.boundKeyCodes, function(value) {
                if (!handled && event.keyCode === value) {
                    that.toggleContainer(event);
                    handled = true;
                }
            });
        }
    };

    fluid.defaults("gpii.ul.toggle", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            toggle:    ".toggle-default",
            container: ".toggle-container-default"
        },
        boundKeyCodes: {
            enter: 13
        },
        invokers: {
            filterKeyPress: {
                funcName: "gpii.ul.toggle.filterKeyPress",
                args:     ["{that}", "{arguments}.0"]
            },
            toggleContainer: {
                funcName: "gpii.ul.toggle.toggleContainer",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "onCreate.wireControls": [
                {
                    "this": "{that}.dom.toggle",
                    method: "keydown",
                    args:   "{that}.filterKeyPress"
                },
                {
                    "this": "{that}.dom.toggle",
                    method: "click",
                    args:   "{that}.toggleContainer"
                }
            ]
        }
    });
})();