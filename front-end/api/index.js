// The API that powers the Unified Listing
//
// TODO:  Transition this to use pure `gpii.express.router` components and gradually remove legacy content from `init`.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("./updates");
require("./sources");

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

gpii.ul.api.getRouter = function (that) {
    return that.router;
};

fluid.defaults("gpii.ul.api", {
    gradeNames: ["gpii.express.router", "autoInit"],
    router:     null,
    config:     "{expressConfigHolder}.options.config",
    invokers: {
        getHandler: {
            funcName: "gpii.ul.api.getRouter",
            args:     ["{that}"]
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
                path: "/updates"
            }
        }
    }
});