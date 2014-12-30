"use strict";
module.exports = function(config) {
    var express = require("express");
    var router = express.Router();

    var docs = require("./docs")(config);
    router.use("/docs",docs);

    return router;
};

