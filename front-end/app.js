// The main `gpii.express` instance that provides the front end and API for the Unified Listing.
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var path   = require("path");
var config = {};

require("gpii-express");
require("gpii-handlebars");
require("./api");

var loader = require("../config/lib/config-loader");
fluid.setLogging(true);
if ("development" === process.env.NODE_ENV) {
    config = loader.loadConfig(require("../config/dev.json"));
}
else {
    config = loader.loadConfig(require("../config/prod.json"));
}

config.express.views = path.join(__dirname, "views");

var schemaDir           = path.resolve(__dirname, "./schema/schemas");
var publicDir           = path.resolve(__dirname, "./public");
var infusionDir         = path.resolve(__dirname, "../node_modules/infusion/src");
var gpiiHandlebarsDir   = path.resolve(__dirname, "../node_modules/gpii-handlebars/src/js");
var expressUserDir      = path.resolve(__dirname, "../node_modules/gpii-express-user/src");

fluid.defaults("gpii.ptd.frontend.express", {
    config:     config,
    gradeNames: ["gpii.express"],
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
        // Server side handlebars
        handlebars: {
            type: "gpii.express.hb",
            options: {
                components: {
                    initBlock: {
                        options: {
                            contextToOptionsRules: {
                                req: "req",
                                model: {
                                    user: "user"
                                }
                            }
                        }
                    }
                }
            }
        },
        // Mount the JSON schemas for client-side verification and as a form of documentation.
        schemas: {
            type: "gpii.express.router.static",
            options: {
                path:    "/schema",
                content: schemaDir
            }
        },
        // The infusion client-side libraries
        infusion: {
            type: "gpii.express.router.static",
            options: {
                path:    "/infusion",
                content: infusionDir
            }
        },
        inline: {
            type: "gpii.express.hb.inline",
            options: {
                path: "/hbs"
            }
        },
        // Expose the client-side user management components from the installed package
        expressUserContent: {
            type: "gpii.express.router.static",
            options: {
                path:    "/gpii-eu",
                content: expressUserDir
            }
        },
        // Expose the client-side handlebars components from the installed package
        gpiiHandlebars: {
            type: "gpii.express.router.static",
            options: {
                path:    "/gpii-handlebars",
                content: gpiiHandlebarsDir
            }
        },
        // The API component that acts as the back end for most client interactions
        api: {
            type: "gpii.ul.api",
            options: {
                path: "/api",
                config: config // TODO:  Sanitize this when we convert this to a launcher.
            }
        },
        // Our root includes all static content, including bower components.
        root: {
            type: "gpii.express.router.static",
            options: {
                path:    "/",
                content: publicDir
            }
        },
        // Paths like /login, /verify, /search are handled using a handlebars template
        dispatcher: {
            type: "gpii.express.dispatcher",
            options: {
                path: ["/:template", "/"],
                rules: {
                    contextToExpose: {
                        // All of our `initBlock` generated components care about the user.
                        user: "req.session._gpii_user",
                        req:   { params: "req.params", query: "req.query"}
                    }
                }
            }
        }
    }
});
gpii.ptd.frontend.express();
