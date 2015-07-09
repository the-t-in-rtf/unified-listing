// A generic component that controls and updates a single drop-down field based on a single model variable.
"use strict";
/* global fluid */
(function () {
    fluid.defaults("gpii.ul.select", {
        gradeNames: ["gpii.templates.templateAware", "autoInit"],
        selectors:  {
            initial: ""
        },
        bindings: {
            select:  "select"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.template", "{that}.options.select"]
            }
        },
        modelListeners: {
            select: {
                func:          "{that}.renderInitialMarkup",
                excludeSource: "init"
            }
        }
    });
})();
