"use strict";
var path = require("path");
module.exports = function (startDir, reduceSourcePath) {

    // We have to load our reduce function manually because couch does not support modules that can be used with "require".
    var fs = require("fs");
    var resolvedPath  = path.resolve(startDir, reduceSourcePath);
    var reduceContent = fs.readFileSync(resolvedPath, { "encoding": "utf-8"});
    var reducer;
    eval("reducer = " + reduceContent);
    return reducer;
};