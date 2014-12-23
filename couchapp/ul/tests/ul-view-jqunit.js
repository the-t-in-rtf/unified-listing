"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");

jqUnit.module("UL Couch View Unit Tests");

// We have to load our reduce function manually because couch does not support modules that can be used with "require".
var fs = require("fs");
var reduceContent = fs.readFileSync(__dirname + "/../views/unified/reduce.js", { "encoding": "utf-8"});
var reducer;
eval("reducer = " + reduceContent);

jqUnit.test("Testing reduce function (single reduce pass, tree <- leaf)...",function(){
    var data    = [{"uid": "foo", "source": "unified", "sid": "foo"},{"uid":"foo", "source":"child", "sid": "bar"}];
    var output  = reducer(["foo","foo"], data, false);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uid": "foo", "source": "unified", "sid": "foo", "sources": [ {"uid": "foo", "source": "child", "sid": "bar"} ] }}, output);
});

jqUnit.test("Testing reduce function (single reduce pass, leaf <- tree)...",function(){
    var data    = [{"uid":"foo", "source":"child", "sid": "bar"}, {"uid": "foo", "source": "unified", "sid": "foo"}];
    var output  = reducer(["foo","foo"], data, false);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uid": "foo", "source": "unified", "sid": "foo", "sources": [ {"uid": "foo", "source": "child", "sid": "bar"} ] }}, output);
});

jqUnit.test("Testing reduce function (no clusters)...",function(){
    var data    = [{"source":"child", "sid": "bar"}, {"source": "child2", "sid": "baz"}];
    var output  = reducer(["foo","foo"], data, false);

    jqUnit.assertDeepEq("There should be two records...", {"child:bar": { "source": "child", "sid": "bar" }, "child2:baz": { "source": "child2", "sid": "baz"}}, output);
});

jqUnit.test("Testing rereduce function, one record split between sets...",function(){
    var data    = [
        {"foo": { "uid": "foo", "source": "unified", "sid": "foo"}},
        {"foo": { "sources": [ {"sid": "bar", "source": "child", "uid": "foo"} ] }}
    ];

    var output  = reducer(null, data, true);

    jqUnit.assertDeepEq("There should be one merged record...", {"foo": { "uid": "foo", "source": "unified", "sid": "foo", "sources": [ {"uid": "foo", "source": "child", "sid": "bar"} ] }}, output);
});

jqUnit.test("Testing rereduce function, no clusters...",function(){
    var data    = [{"child:bar": { "source": "child", "sid": "bar" }},{"child2:baz": { "source": "child2", "sid": "baz"}}];

    var output  = reducer(null, data, true);

    jqUnit.assertDeepEq("There should be two records...", {"child:bar": { "source": "child", "sid": "bar" }, "child2:baz": { "source": "child2", "sid": "baz"}}, output);
});

