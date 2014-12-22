// Temporary library to resolve deep map references, for example foo.bar.baz given the variable foo and the key "bar.baz"
"use strict";

// TODO:  Refactor to use server-side FLUID components instead...
module.exports = function(config) {
    var fluid     = require("infusion");
    var namespace = "gpii.ul.unifier.resolver";
    var resolver   = fluid.registerNamespace(namespace);


    resolver.resolve = function(map, path) {
        var value = map;

        if (path && path.split !== undefined) {
            var parts = path.split(".");
            parts.forEach(function(part){
                value = value[part];
            });
        }

        return value;
    };

    return resolver;
}