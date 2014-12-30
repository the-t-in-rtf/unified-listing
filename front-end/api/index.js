"use strict";
module.exports = function(config) {
    var express = require("express");
    var router = express.Router();

    router.use("/updates", require("./updates")(config));
    router.use("/docs",    require("./docs")(config));

    return router;
};

