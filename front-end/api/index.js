"use strict";
module.exports = function(config) {
    var fluid = require("infusion");
    var namespace    = "gpii.ul.api";
    var api         = fluid.registerNamespace(namespace);

    var express = require("express");
    api.router = express.Router();

    var updates = require("./updates")(config);
    api.router.use("/updates", updates.router);

    var products = require("./products")(config);
    api.router.use("/products", products.router);

    var docs = require("./docs")(config);
    api.router.use("/docs", docs.router);

    return api;
};

