"use strict";

// All handlers for /api/record
module.exports = function(config) {
    var fluid           = require("infusion");
    var namespace       = "gpii.ul.api.product";
    var product         = fluid.registerNamespace(namespace);

    var express         = require("express");
    product.router      = express.Router();

    var get = require("./get")(config);
    product.router.use("/", get.router);

    // TODO:  Implement "write" functions

    //var put = require("./put")(config);
    //product.router.use("/", put.router);
    //
    //var post = require("./post")(config);
    //product.router.use("/", post.router);
    //
    //var del = require("./delete")(config);
    //product.router.use("/", del.router);

    return product;
};
