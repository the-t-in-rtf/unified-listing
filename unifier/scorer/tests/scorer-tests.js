// Tests for the "unifier", which detects similarities between records.
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ul.unifier.scorer.tests";
var scorerTests = fluid.registerNamespace(namespace);

var loader = require("../../../config/lib/config-loader");
scorerTests.config = loader.loadConfig({});

var scorer = require("../../scorer")(scorerTests.config);

scorerTests.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    jqUnit.module("Cluster scoring tests...");

    jqUnit.test("Test combining multiple sets into one using setFromFields() (no ISO codes)...", function() {
        var record = {foo: [1,2], bar: [3,4]};
        var set    = scorer.setFromFields(record, ["foo","bar"]);

        jqUnit.assertEquals("The combined set should have four items...", 4, set.length);

        jqUnit.assertDeepEq("The combined set should contain all of the original items...", [1,2,3,4], set);
    });

    jqUnit.test("Testing using setFromFields to pull ISO codes from EASTIN structure...", function(){
        var valid = {"foo": [{Code:"22.23.24"}], "bar": [{Code:"23.24.25"}]};
        jqUnit.assertDeepEq("setFromFields should correctly pull deep ISO values.", ["22.23.24","23.24.25"], scorer.setFromFields(valid,["foo","bar"], "Code"));

        var invalid = {};
        jqUnit.assertDeepEq("setFromFields should handle invalid data reasonably...", [], scorer.setFromFields(invalid,["foo","bar"], "Code"));
    });

    jqUnit.test("Test scoring records by date field...", function() {
        var date1  = new Date();
        var field1 = "foo";
        var a1     = { "foo": date1 };
        var b1     = { "foo": date1 };
        var score1 = scorer.compareByDate(a1, b1, field1);
        jqUnit.assertEquals("The same date should return 1", 1, score1);

        var date2  = new Date(0);
        var field2 = "foo";
        var a2     = { "foo": date1 };
        var b2     = { "foo": date2 };
        var score2 = scorer.compareByDate(a2, b2, field2);
        jqUnit.assertEquals("Today and the beginning of time should be different enough to return 0...", 0, score2);

        var score3 = scorer.compareByDate(b2, a2, field2);
        jqUnit.assertEquals("A -> B and B -> A should be equal...", score2, score3);
    });

    jqUnit.test("Test scoring records by value...", function() {
        var field = "foo";
        var a     = { "foo": "bar" };
        var b     = { "foo": "bar" };
        var c     = { "foo": "baz" };

        var score1 = scorer.compareByValue(a, b, field);
        jqUnit.assertEquals("Equal values should return 1", 1, score1);

        var score2 = scorer.compareByValue(a, c, field);
        jqUnit.assertEquals("Non-equal values should return 0", 0, score2);
    });

    jqUnit.test("Test scoring records by token...", function() {
        var field = "foo";

        // These two should return 1 when compared, only the order is different
        var a     = { "foo": "one two"};
        var b     = { "foo": "two one"};
        jqUnit.assertEquals("The same tokens in a different order should still return 1...", 1, scorer.compareByToken(a, b, field));

        // Should match a and b at 0.5
        var c     = { "foo": "one three"};
        jqUnit.assertEquals("2-item sets with 1 token in common should return 0.5...", 0.5, scorer.compareByToken(a, c, field));
        jqUnit.assertEquals("2-item sets with 1 token in common should return 0.5...", 0.5, scorer.compareByToken(b, c, field));

        // should match a and b at 0.5, and should return 0 for c
        var d     = { "foo": "two four"};
        jqUnit.assertEquals("Sets with no tokens in common should return 0...", 0, scorer.compareByToken(c, d, field));

        // Everything should match this, as its tokens are a superset of all records
        var e     = { "foo": "one two three four" };
        jqUnit.assertEquals("Comparing to a superset should return 1 (a->e)...", 1, scorer.compareByToken(a, e, field));
        jqUnit.assertEquals("Comparing to a superset should return 1 (b->e)...", 1, scorer.compareByToken(b, e, field));
        jqUnit.assertEquals("Comparing to a superset should return 1 (c->e)...", 1, scorer.compareByToken(c, e, field));
        jqUnit.assertEquals("Comparing to a superset should return 1 (d->e)...", 1, scorer.compareByToken(d, e, field));

        // TODO:  Make tests just for the tokenizer and move this kind of check there.
        // Check to make sure that extra white space is not a problem
        var f     = { "foo": " one  two "};
        jqUnit.assertEquals("Whitespace should be safely stripped...", 1, scorer.compareByToken(a, f, field));

        var g     = { "foo": "one  two two one"};
        jqUnit.assertEquals("Duplicate tokens should be counted correctly...", 1, scorer.compareByToken(a, g, field));
        jqUnit.assertEquals("Duplicate tokens should be counted correctly (reverse order)...", 1, scorer.compareByToken(g, a, field));
    });

    jqUnit.test("Test scoring records by set...", function() {
        var setA = ["one","two","three"];
        var setB = ["two", "one", "three"];
        jqUnit.assertEquals("Sets with a different order should return 1 ...", 1, scorer.compareBySet(setA, setB));

        var setC = ["one", "four", "three", "two"];
        jqUnit.assertEquals("A superset compared to a set should return 1 ...", 1, scorer.compareBySet(setA, setC));

        var setD = ["five", "six"];
        jqUnit.assertEquals("Sets with nothing in common should return 0 ...", 0, scorer.compareBySet(setA, setD));

        var setE = ["six", "seven"];
        jqUnit.assertEquals("Two two-item sets with one value in common should return 0.5 ...", 0.5, scorer.compareBySet(setD, setE));
    });

    jqUnit.test("Test combining fields using compareBySetFields (no ISO 9999 Codes)...", function() {
        var recordA = {"foo": ["one", "two"], "bar": ["three", "four"]};
        var recordB = {"foo": ["four", "three"], "bar": ["two", "one"]};

        jqUnit.assertEquals("Records with the same values in a set of fields should match (return 1)...", 1, scorer.compareBySetFields(recordA, recordB, ["foo", "bar"]))
    });

    jqUnit.test("Test comparing ISO Codes using compare compareByIsoCodes...", function() {
        jqUnit.assertEquals("Empty arrays should return 0 when compared to one another...", 0, scorer.compareByIsoCodes([],[]));

        jqUnit.assertEquals("Arrays that contain non-ISO 9999 codes should return 0 when compared to one another...", 0, scorer.compareByIsoCodes(["foo"],["foo"]));

        jqUnit.assertEquals("Records that only contain the same ISO 9999 code should return 1...", 1, scorer.compareByIsoCodes(["22.23.24"],["22.23.24"]));

        jqUnit.assertEquals("Records that contain one common ISO 9999 code should return 1...", 1, scorer.compareByIsoCodes(["22.23.24", "25.26.27"],["22.23.24"]));
    });

    jqUnit.test("Test combining fields using compareByIsoFields (ISO 9999 Codes)...", function() {
        var recordA = {"foo": [{Code:"22.23.24"}, {Code: "23.24.25"}], "bar": [{Code: "24.25.26"}, {Code: "26.27.28"}]};
        var recordB = {"foo": [{Code: "22.23.24"}, {Code: "23.24.25"}], "bar": [{Code: "24.25.26"}, {Code: "26.27.28"}]};

        jqUnit.assertEquals("Records with the same ISO 9999 codes in a set of fields should match (return 1)...", 1, scorer.compareByIsoFields(recordA, recordB, ["foo", "bar"]))

        var recordC = {"foo": [{Code: "22.23.24"}, {Code: "22.24.25"}], "bar": [{Code: "21.25.26"}, {Code: "21.27.28"}]};
        jqUnit.assertEquals("Records with one ISO code match and many mismatches should return 1...", 1, scorer.compareByIsoFields(recordA, recordC, ["foo", "bar"]))

        var recordD = {"foo": [{Code: "22.23.24"}, {Code: "23.24.23"}], "bar": [{Code: "24.25.24"}, {Code: "26.27.26"}]};
        jqUnit.assertEquals("Records with one ISO code match and many partial matches should return 1...", 1, scorer.compareByIsoFields(recordA, recordD, ["foo", "bar"]))

        var recordE = {"foo": [{Code: "22.23.25"}, {Code: "23.21.23"}], "bar": [{Code: "23.25.24"}, {Code: "25.27.26"}]};
        jqUnit.assertEquals("Records with a 2-part and many 1-part matches should return 0.8...", 0.8, scorer.compareByIsoFields(recordA, recordE, ["foo", "bar"]))

        var recordF = {"foo": [{Code: "22.20.24"}, {Code: "19.24.23"}], "bar": [{Code: "19.25.24"}, {Code: "19.27.26"}]};
        jqUnit.assertEquals("Records with a 1-part match should return 0.3 ...", 0.3, scorer.compareByIsoFields(recordA, recordF, ["foo", "bar"]));

        var recordF = {"foo": [{Code: "20.23.24"}, {Code: "19.24.23"}], "bar": [{Code: "19.25.26"}, {Code: "19.27.26"}]};
        jqUnit.assertEquals("Records with only a match in pair two or three should return 0...", 0, scorer.compareByIsoFields(recordA, recordF, ["foo", "bar"]));
    });
};

scorerTests.runTests();