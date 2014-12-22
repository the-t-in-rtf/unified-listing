// Tests for the "grouper", which builds clusters based on similarity data
"use strict";
var fluid            = require("infusion");
var namespace        = "gpii.ul.unifier.resolver.tests";
var resolverTests    = fluid.registerNamespace(namespace);

var loader           = require("../../../config/lib/config-loader");
resolverTests.config = loader.loadConfig({});

var resolver          = require("../../resolver")(resolverTests.config);

resolverTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Grouping tests...");

    jqUnit.test("Test resolving shallow reference...", function() {
        var map = {"foo": "shallow value" };
        var value = resolver.resolve(map, "foo");

        jqUnit.assertEquals("The shallow value should be retrieved...", "shallow value", value);
    });

    jqUnit.test("Test resolving deep reference...", function() {
        var map = {"foo": {"bar": {"baz": "deep value" } } };
        var value = resolver.resolve(map, "foo.bar.baz");

        jqUnit.assertEquals("The deep value should be retrieved...", "deep value", value);
    });
};

resolverTests.runTests();