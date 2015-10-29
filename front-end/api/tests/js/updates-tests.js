/* Tests for the "updates" API module */
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
fluid.defaults("gpii.ul.api.tests.updates.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    expected: {
        unifiedNewer: {
            "ok": "true",
            "total_rows": 1,
            "params": {
                "sources": [
                    "admin"
                ]
            },
            "records": [
                {
                    "uid": "unifiedNewer",
                    "source": "unified",
                    "sid": "unifiedNewer",
                    "name": "sample product 1",
                    "description": "sample description 1",
                    "updated": "2015-01-01",
                    "manufacturer": {
                        "name": "sample manufacturer 1"
                    },
                    "sources": [
                        {
                            "uid": "unifiedNewer",
                            "source": "admin",
                            "sid": "admin1",
                            "name": "sample product 1",
                            "description": "sample description 1",
                            "updated": "2014-01-01",
                            "manufacturer": {
                                "name": "sample manufacturer 1"
                            }
                        }
                    ]
                }
            ]
        },
        sourceNewer: {
            "ok": "true",
            "total_rows": 1,
            "params": {
                "sources": [
                    "admin"
                ]
            },
            "records": [
                {
                    "uid": "unifiedOlder",
                    "source": "unified",
                    "sid": "unifiedOlder",
                    "name": "sample product 2",
                    "description": "sample description 2",
                    "updated": "2013-01-01",
                    "manufacturer": {
                        "name": "sample manufacturer 2"
                    },
                    "sources": [
                        {
                            "uid": "unifiedOlder",
                            "source": "admin",
                            "sid": "admin2",
                            "name": "sample product 2",
                            "description": "sample description 2",
                            "updated": "2014-01-01",
                            "manufacturer": {
                                "name": "sample manufacturer 2"
                            }
                        }
                    ]
                }
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
                    name: "Looking for records where the source is newer than the unified record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{sourceNewerLoginRequest}.send",
                            args: [{name: "admin", password: "admin"}]
                        },
                        {
                            listener: "fluid.identity",
                            event: "{sourceNewerLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{sourceNewerRequest}.send"
                        },
                        {
                            listener: "gpii.ul.api.tests.isSaneResponse",
                            event: "{sourceNewerRequest}.events.onComplete",
                            args: ["{sourceNewerRequest}.nativeResponse", "{arguments}.0", 200, "{that}.options.expected.sourceNewer"]
                        }
                    ]
                }
            ]
        },
        {
            tests: [
                {
                    name: "Looking for records where the unified record is newer than the source record...",
                    type: "test",
                    sequence: [
                        {
                            func: "{unifiedNewerLoginRequest}.send",
                            args: [{ name: "admin", password: "admin" }]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{unifiedNewerLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{unifiedNewerRequest}.send"
                        },
                        {
                            listener: "gpii.ul.api.tests.isSaneResponse",
                            event:    "{unifiedNewerRequest}.events.onComplete",
                            args:     ["{unifiedNewerRequest}.nativeResponse", "{arguments}.0", 200, "{that}.options.expected.unifiedNewer"]
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
        sourceNewerLoginRequest: {
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
        sourceNewerRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ul.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "api/updates?source=admin&sourceNewer=true"]
                    }
                },
                port: "{testEnvironment}.options.expressPort",
                method: "GET"
            }
        },
        unifiedNewerLoginRequest: {
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
        unifiedNewerRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ul.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "api/updates?source=admin"]
                    }
                },
                port: "{testEnvironment}.options.expressPort",
                method: "GET"
            }
        }
    }
});

fluid.defaults("gpii.ul.api.tests.updates.environment", {
    gradeNames:  ["fluid.test.testEnvironment"],
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
            type: "gpii.ul.api.tests.updates.caseHolder"
        }
    }
});

gpii.ul.api.tests.updates.environment();