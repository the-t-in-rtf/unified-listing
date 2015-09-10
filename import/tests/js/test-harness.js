// The common test harness we will use for all tests as well as manual verification.
"use strict";
var fluid = fluid || require("infusion");

require("../../../node_modules/gpii-express/index");
require("gpii-pouch");
require("../../../node_modules/gpii-express-couchuser/src/js/server");
require("../../../front-end/api/index");

var path = require("path");
var sampleDataFile = path.resolve(__dirname, "../data/existing.json");
var userDataFile   = path.resolve(__dirname, "../data/users.json");

fluid.defaults("gpii.ul.imports.tests.harness", {
    gradeNames: ["fluid.component"],

    // These are the only two options you should need to directly change in configuration.  The rest will be updated
    // using string templates.
    ports: {
        apiPort:    "3579",
        pouchPort:  "9753"
    },

    apiUrl:     {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%apiPort"]
        }
    },
    pouchUrl:   {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%pouchPort"]
        }
    },
    dbUrl:      {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%pouchPort/ul"]
        }
    },
    users:      {
        expander: {
            func: "{that}.parseUrlTemplate",
            args: ["http://localhost:%pouchPort/_users"]
        }
    },

    events: {
        onPouchStarted: null,
        onPouchExpressStarted: null,
        onApiStarted: null,
        onStarted: {
            events: {
                onPouchStarted:        "onPouchStarted",
                onPouchExpressStarted: "onPouchExpressStarted",
                onApiStarted:          "onApiStarted"
            }
        }
    },
    listeners: {
        "onPouchStarted.log": { funcName: "fluid.log", args: ["Pouch database started..."]},
        "onPouchExpressStarted.log": { funcName: "fluid.log", args: ["Pouch express started..."]},
        "onApiStarted.log": { funcName: "fluid.log", args: ["API express instance started..."]}
    },
    components: {
        apiExpressInstance: {
            type: "gpii.express",
            options: {
                config: {
                    "safeUserFields": "name email displayName",
                    "adminRoles": [ "admin"],
                    "couch": {
                        "port":      "{harness}.options.ports.pouchPort",
                        "url":       "{harness}.options.dbUrl"
                    },
                    users: "{harness}.options.users",
                    express: {
                        port:    "{harness}.options.ports.apiPort",
                        baseUrl: "{harness}.options.apiUrl",
                        session: {
                            secret: "Printer, printer take a hint-ter."
                        },
                        apiPath: "/api"
                    },
                    app: {
                        name: "API Test Server",
                        url:  "{harness}.options.apiUrl"
                    },
                    "schemas": { "names": [ "record", "message", "records", "search" ] }
                },
                listeners: {
                    onStarted: "{harness}.events.onApiStarted.fire"
                },
                components: {
                    json: {
                        type: "gpii.express.middleware.bodyparser.json"
                    },
                    urlencoded: {
                        type: "gpii.express.middleware.bodyparser.urlencoded"
                    },
                    cookieparser: {
                        type: "gpii.express.middleware.cookieparser"
                    },
                    session: {
                        type: "gpii.express.middleware.session"
                    },
                    api: {
                        type: "gpii.ul.api",
                        options: {
                            path: "/api"
                        }
                    },
                    // User management portion of the API, must be loaded here for now
                    user: {
                        type: "gpii.express.couchuser.server",
                        options: {
                            config: "{apiExpressInstance}.options.config"
                        }
                    }
                }
            }
        },
        pouch: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        port:    "{harness}.options.ports.pouchPort",
                        baseUrl: "{harness}.options.pouchUrl"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "{harness}.options.pouchUrl"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.onPouchExpressStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                "ul":     { "data": sampleDataFile },
                                "_users": { "data": userDataFile }
                            },
                            listeners: {
                                "onStarted.notifyParent": {
                                    func: "{harness}.events.onPouchStarted.fire"
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    invokers: {
        parseUrlTemplate: {
            funcName: "fluid.stringTemplate",
            args:     ["{arguments}.0", "{that}.options.ports"]
        }
    }
});