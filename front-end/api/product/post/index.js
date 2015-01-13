// handle POST /api/product
"use strict";

module.exports = function(config) {
    var fluid = require("infusion");

    var namespace = "gpii.ul.product.post";

    var post = fluid.registerNamespace(namespace);
    post.error = require("../../lib/error")(config);

    var express = require("express");
    post.router = express.Router();

    var bodyParser = require("body-parser");
    post.router.use(bodyParser.urlencoded());
    post.router.use(bodyParser.json());

    var postHelper = require("./post-helper")(config);

    post.router.post("/", postHelper);

    return post;
};
