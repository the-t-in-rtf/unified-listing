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

jqUnit.test("Testing rereduce function, one record split between two sets...",function(){
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


jqUnit.test("Testing reduce with JAWS records...",function(){
    var data    = require("./data/jaws.json");
    var reduced = reducer(null,data,false);
    jqUnit.assertEquals("There should be one record in the reduced output...", 1, Object.keys(reduced).length);
    jqUnit.assertEquals("There should be seven records in the reduced 'sources' list...", 7, reduced[Object.keys(reduced)[0]].sources.length);
});

jqUnit.test("Testing rereduce with JAWS records...",function(){
    var data    = require("./data/jaws.json");

    var slice1    = data.slice(0,2);
    var reduced1  = reducer(null, slice1, false);
    var slice2    = data.slice(2,4);
    var reduced2  = reducer(null, slice2, false);
    var slice3    = data.slice(4,5);
    var reduced3  = reducer(null, slice3, false);
    var slice4    = data.slice(5,8);
    var reduced4  = reducer(null, slice4, false);

    var rereduced  = reducer(null, [reduced1, reduced2, reduced3 ,reduced4], true);

    jqUnit.assertEquals("There should be one record in the rereduced output...", 1, Object.keys(rereduced).length);
    jqUnit.assertEquals("There should be seven records in the rereduced 'sources' list...", 7, rereduced[Object.keys(rereduced)[0]].sources.length);
});
