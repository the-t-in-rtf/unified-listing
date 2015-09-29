// The API that powers the Unified Listing
//
// TODO:  Transition this to use pure `gpii.express.router` components and gradually remove legacy content from `init`.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("./updates");
require("./sources");
require("gpii-express-user");

var express = require("../../node_modules/gpii-express/node_modules/express");

fluid.registerNamespace("gpii.ul.api");
gpii.ul.api.init = function (that) {
    that.router = express.Router();

    var products = require("./products")(that.options.config);
    that.router.use("/products", products.router);

    var product = require("./product")(that.options.config);
    that.router.use("/product", product.router);

    var search = require("./search")(that.options.config);
    that.router.use("/search", search.router);

    var suggest = require("./search")(that.options.config, true);
    that.router.use("/suggest", suggest.router);

    var docs = require("./docs")(that.options.config);
    that.router.use("/docs", docs.router);
};

gpii.ul.api.route = function (that, req, res) {
    that.router(req, res);
};

fluid.defaults("gpii.ul.api", {
    gradeNames: ["gpii.express.router"],
    router:     null,
    config:     "{expressConfigHolder}.options.config",
    distributeOptions: {
        source: "{that}.options.config.express.views",
        target: "{that gpii.handlebars.standaloneRenderer}.options.templateDir"
    },
    invokers: {
        route: {
            funcName: "gpii.ul.api.route",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    },
    listeners: {
        "onCreate.init": {
            funcName: "gpii.ul.api.init",
            args:     ["{that}"]
        }
    },
    components: {
        sources: {
            type: "gpii.ul.api.sources.router",
            options: {
                path: "/sources"
            }
        },
        updates: {
            type: "gpii.ul.api.updates.router",
            options: {
                path: "/updates",
                couch: "{gpii.express}.options.config.couch"
            }
        },
        user: {
            type: "gpii.express.user.api",
            options: {
                couch: "{gpii.express}.options.config.couch",
                app:   "{gpii.express}.options.config.app"
            }
        }
    }
});