/* Tests for the "sources" API module */
"use strict";

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../../../node_modules/kettle");
require("../../../../node_modules/kettle/lib/test/KettleTestUtils");

var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");

require("./test-harness");

require("../lib/sequence");
require("../lib/assembleurl");
require("../lib/saneresponse");

// Each test has a request instance of `kettle.test.request.http` or `kettle.test.request.httpCookie`, and a test module that wires the request to the listener that handles its results.
fluid.defaults("gpii.ul.api.tests.sources.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    expected: {
        anonymous: {
            "sources": [
                "public"
            ]
        },
        loggedIn: {
            "sources": [
                "admin",
                "private",
                "public"
            ]
        }
    },
    mergePolicy: {
        rawModules:    "noexpand",
        sequenceStart: "noexpand"
    },
    moduleSource: {
        funcName: "gpii.ul.api.tests.addRequiredSequences",
        args:     ["{that}.options.sequenceStart", "{that}.options.rawModules"]
    },
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructServer.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onReady"
        }
    ],
    // Our raw test cases, that will have `sequenceStart` prepended before they are run.
    rawModules: [
        {
            tests: [
                {
                    name: "Testing anonymous sources request...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousRequest}.send"
                        },
                        {
                            listener: "gpii.ul.api.tests.isSaneResponse",
                            event:    "{anonymousRequest}.events.onComplete",
                            args:     ["{anonymousRequest}.nativeResponse", "{arguments}.0", 200, "{testEnvironment}.expected.anonymous"]
                        }
                    ]
                },
                {
                    name: "Testing logged in sources request...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginRequest}.send",
                            args: [{ name: "admin", password: "admin" }]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{loginRequest}.events.onComplete"
                        },
                        {
                            func: "{loggedInRequest}.send"
                        },
                        {
                            listener: "gpii.ul.api.tests.isSaneResponse",
                            event:    "{loggedInRequest}.events.onComplete",
                            args:     ["{loggedInRequest}.nativeResponse", "{arguments}.0", 200, "{testEnvironment}.expected.loggedIn"]
                        }
                    ]
                }
            ]
        }
    ],
    // Our request components
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        anonymousRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ul.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "api/sources", "{testEnvironment}"]
                    }
                },
                port: "{testEnvironment}.options.expressPort",
                method: "GET"
            }
        },
        loginRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ul.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "api/user/signin"]
                    }

                },
                port: "{testEnvironment}.options.expressPort",
                method: "POST"
            }
        },
        loggedInRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ul.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "api/sources"]
                    }
                },
                port: "{testEnvironment}.options.expressPort",
                method: "GET"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.tests.sources.environment", {
    gradeNames:  ["fluid.test.testEnvironment", "autoInit"],
    expressPort: 9786,
    baseUrl:     "http://localhost:9786",
    pouchPort:   6879,
    pouchUrl:    "http://localhost:6879",
    usersUrl:    "http://localhost:6879/_users",
    events: {
        constructServer: null,
        onReady:         null
    },
    components: {
        harness: {
            type:          "gpii.ul.api.tests.harness",
            createOnEvent: "constructServer",
            options: {
                expressPort: "{testEnvironment}.options.expressPort",
                pouchPort:   "{testEnvironment}.options.pouchPort",
                listeners: {
                    onReady: {
                        func: "{testEnvironment}.events.onReady.fire"
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.ul.api.tests.sources.caseHolder"
        }
    }
});

gpii.ul.api.tests.sources.environment();