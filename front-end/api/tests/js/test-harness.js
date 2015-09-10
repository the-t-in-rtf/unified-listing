// Common test harness for all Unified Listing API tests.  As these API modules are required to work together with each
// other and with gpii-express-couchuser, wiring them all together is more appropriate, even if we choose to test
// each module in isolation from its own file.
//
// This harness can be launched for manual QA using `node launch-test-harness.js`
//
"use strict";
var fluid      = fluid || require("infusion");
var path       = require("path");

require("gpii-express");
require("gpii-pouch");

require("../../../../node_modules/gpii-express-couchuser/src/js/server");

// TODO: once all API endpoints have been updated to use `gpii.express`, move to using a single `require` here.
require("../../sources");
require("../../updates");

var userDataFile = path.resolve(__dirname, "../data/users.json");
var ulDataFile   = path.resolve(__dirname, "../data/ul.json");

fluid.defaults("gpii.ul.api.tests.harness", {
    gradeNames: ["fluid.modelComponent"],
    expandable: {
        expressPort: "{that}.options.expressPort",
        pouchPort:   "{that}.options.pouchPort"
    },
    expressPort: 7633,
    // Additional express options are derived from `expressPort` using string templates.
    baseUrl:     {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%expressPort", "{harness}.options.expandable"]
        }
    },
    pouchPort:   7634,
    // Additional options are derived from `pouchPort` using string templates.
    pouchUrl:    {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%pouchPort", "{harness}.options.expandable"]
        }
    },
    dbUrl:    {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%pouchPort/ul", "{harness}.options.expandable"]
        }
    },
    usersUrl:    {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%pouchPort/_users", "{harness}.options.expandable"]
        }
    },
    members: {
        ready: false,
        onReady: false
    },
    // Report that we're ready when all our key components have started up.
    events: {
        expressStarted:  null,
        pouchStarted:    null,
        onReady: {
            events: {
                expressStarted: "expressStarted",
                pouchStarted:   "pouchStarted"
            }
        }
    },
    components: {
        express: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        port :   "{harness}.options.expressPort",
                        baseUrl: "{harness}.options.baseUrl",
                        session: { secret: "Printer, printer take a hint-ter."}
                    },
                    "couch": {
                        url: "{harness}.options.dbUrl"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.expressStarted.fire"
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

                    // The modules from the API that need testing.
                    // TODO: Migrate the remaining modules one by one and add their tests here
                    sources: {
                        type: "gpii.ul.api.sources.router",
                        options: {
                            path: "/api/sources",
                            config: {
                                sources: {
                                    "private": { view: ["admin"] },
                                    "public":  { view: ["*"] }
                                }
                            }
                        }
                    },

                    updates: {
                        type: "gpii.ul.api.updates.router",
                        options: {
                            path:   "/api/updates",
                            config: "{express}.options.config"
                        }
                    },

                    // For some reason, we need to load "user" relatively late so that all the middleware upstream (notably body parsing) is in place
                    user: {
                        type: "gpii.express.couchuser.server",
                        options: {
                            config: {
                                "verify":         true,
                                "safeUserFields": "name email displayName",
                                "adminRoles":     ["admin"],
                                users: "{harness}.options.usersUrl"
                            }
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
                        "port" : "{harness}.options.pouchPort",
                        baseUrl: "{harness}.options.pouchUrl"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "{harness}.options.pouchUrl"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.pouchStarted.fire"
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: {
                                _users: { data: userDataFile },
                                ul:     { data: ulDataFile }
                            }
                        }
                    }
                }
            }
        }
    }
});