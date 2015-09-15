/* Browser tests for `gpii.locationBar` component */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

var Browser = require("zombie");
var jqUnit  = require("jqUnit");

var path        = require("path");
var harnessPath = path.resolve(__dirname, "../../html/tests-locationBar.html");
var harnessUrl  = "file://" + harnessPath + "?setFromQuery=true";

// Convenience function to wrap retrieving the test harness and executing tests.

fluid.registerNamespace("gpii.tests.locationBar");

// We don't use a full testEnvironment and test cases because Zombie lacks events for us to listen to. Instead, here is
// a convenience method that at least provides some structure.
gpii.tests.locationBar.runTest = function (that, message, callback) {
    jqUnit.asyncTest(message, function() {
        var browser = Browser.create();
        browser.on("error", function (error) {
            jqUnit.start();
            jqUnit.fail("There should be no errors:" + error);
        });

        browser.visit(that.options.harnessUrl, function() {
            jqUnit.start();
            callback(that, browser);
        });
    });
};

gpii.tests.locationBar.runTests = function (that) {
    jqUnit.module(that.options.moduleMessage);
    fluid.each(that.options.testCases, function(testCase){
        gpii.tests.locationBar.runTest(that, testCase.message, testCase.callback);
    });
};

// Test loading initial data from query variable
gpii.tests.locationBar.testQueryData = function (that, browser) {
    var component = browser.window[that.options.componentName];
    jqUnit.assertEquals("The model should contain the query variable...", true, component.model.setFromQuery);
};

// Confirm that model changes appear in the location bar
gpii.tests.locationBar.testModelToQuery = function (that, browser) {
    var component = browser.window[that.options.componentName];
    component.applier.change("setFromModel", true);

    jqUnit.assertTrue("The browser location should contain the model data...", browser.window.location.toString().indexOf("setFromModel=true") !== -1);
};

// Apply several changes and confirm that the model is preserved as expected at each transition.  Must go all the way back.
gpii.tests.locationBar.testForthAndBack = function (that, browser) {
    // The baseline data should match the defaults
    var baseExpected      = fluid.copy(that.options.expectedBaseModel);

    var firstStepExpected = fluid.copy(baseExpected);
    firstStepExpected.firstStep = true;

    var secondStepExpected = fluid.copy(firstStepExpected);
    secondStepExpected.secondStep = true;

    var component = browser.window[that.options.componentName];
    component.applier.change("firstStep", true);
    component.applier.change("secondStep", true);
    component.applier.change("thirdStep", true);

    jqUnit.stop();
    browser.back(function(){
        jqUnit.start();

        var secondStepComponent = browser.window[that.options.componentName];
        jqUnit.assertDeepEq("We should be back at the second step...", secondStepExpected, secondStepComponent.model);

        jqUnit.stop();
        browser.back(function(){
            jqUnit.start();

            var firstStepComponent = browser.window[that.options.componentName];
            jqUnit.assertDeepEq("We should be back at the first step...", firstStepExpected, firstStepComponent.model);

            jqUnit.stop();
            browser.window.history.forward();
            browser.wait(function(){
                // Yes, my friend, I know this is unreasonable nesting.  Help me find a better way.
                jqUnit.start();
                var secondStepDejaVuComponent = browser.window[that.options.componentName];
                jqUnit.assertDeepEq("We should have moved forward to the second step again...", secondStepExpected, secondStepDejaVuComponent.model);
            });
        });
    });
};

gpii.tests.locationBar.testUnicode = function (that, browser) {
    // The baseline data should match the defaults
    var baseExpected      = fluid.copy(that.options.expectedBaseModel);

    var firstStepExpected = fluid.copy(baseExpected);
    var iCanEatUnicode = "and it doesn't hurt me...";
    firstStepExpected.iCanEatUnicode = iCanEatUnicode;

    var component = browser.window[that.options.componentName];
    component.applier.change("iCanEatUnicode", iCanEatUnicode);

    jqUnit.assertDeepEq("The model changes should have taken effect...", firstStepExpected, component.model);

    jqUnit.stop();
    browser.back(function(){
        jqUnit.start();

        var baseComponent = browser.window[that.options.componentName];
        jqUnit.assertDeepEq("We should be back at the baseline...", baseExpected, baseComponent.model);
    });
};

gpii.tests.locationBar.testSpecials = function (that, browser) {
    // The baseline data should match the defaults
    var baseExpected      = fluid.copy(that.options.expectedBaseModel);

    var firstStepExpected = fluid.copy(baseExpected);
    var iCanEatSpecials   = "and it doesn't hurt me...";
    firstStepExpected.iCanEatSpecials = iCanEatSpecials;

    var component = browser.window[that.options.componentName];
    component.applier.change("iCanEatSpecials", iCanEatSpecials);

    jqUnit.assertDeepEq("The model changes should have taken effect...", firstStepExpected, component.model);

    jqUnit.stop();
    browser.back(function(){
        jqUnit.start();

        var baseComponent = browser.window[that.options.componentName];
        jqUnit.assertDeepEq("We should be back at the baseline...", baseExpected, baseComponent.model);
    });
};

fluid.defaults("gpii.tests.locationBar", {
    gradeNames:    ["fluid.eventedComponent"],
    moduleMessage: "Testing location bar using Zombie.js...",
    harnessUrl:     harnessUrl,
    componentName:  "locationBar",
    expectedBaseModel: {
        setInModel:      true,
        setFromModel:    false,
        setFromQuery:    true,
        setFromState:    false,
        iCanEatUnicode:  "\u6211\u80FD\u541E\u4E0B\u73BB\u7483\u800C\u4E0D\u50B7\u8EAB\u9AD4",
        iCanEatSpecials: "[(?:+&=])"
    },
    testCases: {
        queryData: {
            message:  "Confirm that initial query data is added to the model...",
            callback: gpii.tests.locationBar.testQueryData
        },
        modelToQuery: {
            message:  "Confirm that model changes are passed to the query string...",
            callback: gpii.tests.locationBar.testModelToQuery
        },
        forthAndBack: {
            message:  "Confirm that multiple model changes are preserved in sequence...",
            callback: gpii.tests.locationBar.testForthAndBack
        },
        unicode: {
            message:  "Confirm that unicode characters are correctly encoded and decoded...",
            callback: gpii.tests.locationBar.testUnicode
        },
        specials: {
            message:  "Confirm that special characters are correctly encoded and decoded...",
            callback: gpii.tests.locationBar.testSpecials
        }
    },
    listeners: {
        "onCreate.runTests" : {
            funcName: "gpii.tests.locationBar.runTests",
            args:     ["{that}"]
        }
    }
});

gpii.tests.locationBar();