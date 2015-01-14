"use strict";

// All handlers for /api/record
module.exports = function(config) {
    var fluid           = require("infusion");
    var namespace       = "gpii.ul.api.product";
    var product         = fluid.registerNamespace(namespace);

    var express         = require("express");
    product.router      = express.Router();

    var put = require("./put")(config);
    product.router.use("/", put.router);

    var post = require("./post")(config);
    product.router.use("/", post.router);

    // FIXME:  GET must come first, otherwise GET and DELETE cannot coexist
    var get = require("./get")(config);
    product.router.use("/", get.router);

    // FIXME:  This appears to match requests overly broadly and delete when PUT requests are made.  Test locally and fix.
    //var del = require("./delete")(config);
    //product.router.use("/", del.router);

    return product;
};
