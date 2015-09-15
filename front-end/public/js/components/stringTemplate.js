// A transform to handle converting string templates and values to final output.  It expects a `template` option that
// represents the final output with `%variable` identifiers for content to be replaced.  The `terms` option is a map
// of variable names and values.
//
// Here's an example of how this should be used in a transform spec:
//
// transform: {
//   type: "gpii.ul.stringTemplate",
//   template: "%baseUrl%source/%sid",
//   terms: {
//     baseUrl: "{that}.options.baseUrl",
//     source:  "{that}.options.req.query.source",
//     sid:     "{that}.options.req.query.sid"
//   }
// }
//
"use strict";
/* global fluid */
(function () {
    var gpii = fluid.registerNamespace("gpii");

    fluid.defaults("gpii.ul.stringTemplate", {
        gradeNames: ["fluid.transforms.standardOutputTransformFunction"]
    });

    gpii.ul.stringTemplate = function (value, transformSpec) {
        return fluid.stringTemplate(transformSpec.template, transformSpec.terms);
    };
})();
