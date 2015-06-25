// A generic component that controls and updates a single drop-down field based on a single model variable.
"use strict";
/* global fluid */
(function () {
    fluid.defaults("gpii.ul.select", {
        gradeNames: ["gpii.templates.hb.client.templateAware", "autoInit"],
        selectors:  {
            initial: ""
        },
        bindings: {
            select:  "select"
        },
        invokers: {
            renderInitialMarkup: {
                funcName: "gpii.templates.hb.client.templateAware.renderMarkup",
                args: [
                    "{that}",
                    "initial",
                    "{that}.options.template",
                    "{that}.options.select",
                    "html"
                ]
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
