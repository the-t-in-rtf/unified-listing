// TODO:  Add independent tests for this component.
// A component to toggle visibility of one or more elements when a toggle is clicked or has the right keydown event.
//
// The options you are expected to pass are:
//  1. `selectors.toggle`: the element which will toggle the container when clicked or when the right keydown event occurs.
//  2. `options.toggles`: A block of definitions that control what is toggled and how (see below).
//
//
// The component will try to wire itself up on startup.  You are expected to call the `refresh` invoker manually if
// there are markup changes.
//
// # Defining the set of elements to be toggled using `options.toggle`
//
// There are two notations for defining which elements are to be toggled.  In the short notation, a selector is used as
// the key, and the value is simply true, as in:
//
// toggles: {
//   selector1: true,
//   selector2: true
// }
//
// With the short notation, jQuery's `toggle` method is used, and the `display` attribute is updated.
//
// If you need to specify which class names are toggled (as you would with jQuery's `toggleClass` method, you can use
// the long notation, in which the `selector` and `className` are explicitly specified, as in:
//
// {
//   entry1: {
//     selector:  "selector1",
//     className: "class1 class2"
//   }
// }
//
// Note that the syntax for `className` is the same as jQuery, i.e. you pass a list of classnames separated by spaces.
//
// The two syntaxes can be mixed, and you should only really need to use the long form when you want to toggle a set of
// classes instead of modifying the `display` attribute.
//
// You must take great care to ensure that the binding only happens once for each piece of rendered markup.
// Otherwise, you may end up firing multiple times when an element is clicked or activated using the
// keyboard.  Best practice is to fire this component's `onRefresh` event when the markup it depends on is
// drawn or refreshed.  Components based on the `ajaxTemplate` grade have an `onMarkupRendered` event which
// is a natural place to wire this in, as in the following example:
//
// events: {
//   onRefresh: {
//     events: {
//       onParentMarkupRendered: "{parentGrade}.onMarkupRendered"
//     }
//   }
// }
//
// If your markup, etc. will already exist and is not likely to change, you can add a listeners block like the
// following to your options to take care of everything on startup:
//
// listeners: {
//   "onCreate.refresh": {
//      func: "{that}.events.onRefresh.fire",
//      args: ["{that}"]
//   }
// }

/* global fluid */
"use strict";
(function() {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.ul.toggle");

    gpii.ul.toggle.performToggle = function (that, event) {
        if (event) {
            event.preventDefault();
        }

        fluid.each(that.options.toggles, function(value, key){
            var valueIsObject = typeof value === "object";
            var selector = valueIsObject ? value.selector : key;
            var toToggle = that.locate(selector);

            if (valueIsObject && value.toggleClass) {
                toToggle.toggleClass(value.toggleClass);
            }
            else {
                toToggle.toggle();
            }
        });
    };

    gpii.ul.toggle.filterKeyPress = function (that, event) {
        if (event) {
            var handled = false;
            fluid.each(that.options.boundKeyCodes, function(value) {
                if (!handled && event.keyCode === value) {
                    that.performToggle(event);
                    handled = true;
                }
            });
        }
    };

    fluid.defaults("gpii.ul.toggle", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            toggle:    ".toggle-default"
        },
        boundKeyCodes: {
            enter: 13
        },
        invokers: {
            filterKeyPress: {
                funcName: "gpii.ul.toggle.filterKeyPress",
                args:     ["{that}", "{arguments}.0"]
            },
            performToggle: {
                funcName: "gpii.ul.toggle.performToggle",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        events: {
            onRefresh: null
        },
        listeners: {
            "onRefresh.wireControls": [
                {
                    "this": "{that}.dom.toggle",
                    method: "keydown",
                    args:   "{that}.filterKeyPress"
                },
                {
                    "this": "{that}.dom.toggle",
                    method: "click",
                    args:   "{that}.performToggle"
                }
            ]
        }
    });
})();