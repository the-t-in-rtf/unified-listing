"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");

jqUnit.module("Reports map/reduce Unit Tests");

var reducer = require("./lib/reducer.js")(__dirname, "../views/manufacturers/reduce.js");

function keysFromValues (array) {
    return array.map(function(value){ return value.name; });
}

jqUnit.test("Testing reduce function (single reduce pass)...",function(){
    var data    = [{ name: "tocombine", "address": "set", country: "sampleCountry"}, { name: "tocombine", url: "set", country: "sampleCountry"}];
    var expectedOutput = {
        "sampleCountry": {
            "tocombine": {
                name: "tocombine",
                address: "set",
                country: "sampleCountry",
                url: "set"
            }
        }
    };
    var keys    = keysFromValues(data);
    var output  = reducer(keys, data, false);

    jqUnit.assertDeepEq("The output should be as expected...", expectedOutput, output);
});

jqUnit.test("Testing rereduce function...",function(){
    var data    = [
        {
            "narnia": {
                "tumnus": {
                    name: "Tumnus",
                    country: "narnia",
                    email: "tumnus@narnia.com"
                }
            }
        },
        {
            "narnia": {
                "tumnus": {
                    name: "Fawn Tumnus",
                    country: "narnia",
                    url: "http://www.disney.com/"
                }
            }

        }
    ];

    var expectedOutput = {
        "narnia": {
            "tumnus": {
                name: "Fawn Tumnus",
                email: "tumnus@narnia.com",
                country: "narnia",
                url: "http://www.disney.com/"
            }
        }
    };

    var output  = reducer(null, data, true);
    jqUnit.assertDeepEq("The output should be as expected...", expectedOutput, output);
});
