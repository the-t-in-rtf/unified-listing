// Display the API docs for the Unified Listing
"use strict";
module.exports = function(config) {
    var fluid = require("infusion");
    var namespace    = "gpii.ul.docs";
    var docs         = fluid.registerNamespace(namespace);

    var express = require("../../../node_modules/gpii-express/node_modules/express");
    docs.router = express.Router();

    docs.router.use("/",function(req, res) {
        if (req.path === "/") {
            var marked = require("marked");
            var markdown = "";
            var fs = require("fs");
            var BUF_LENGTH = 64*1024;
            var buffer = new Buffer(BUF_LENGTH);
            var mdFile = fs.openSync(__dirname + "/ul.md", "r");
            var bytesRead = 1;
            var pos = 0;
            while (bytesRead > 0) {
                bytesRead = fs.readSync(mdFile, buffer, 0, BUF_LENGTH, pos);
                markdown += buffer.toString("utf8", 0, bytesRead);
                pos += bytesRead;
            }
            fs.closeSync(mdFile);

            res.render("pages/page", { "title": "API Documentation", "body": marked(markdown)});
        }
        else {
            res.status(404).render("pages/error", {message: "The page you requested was not found."});
        }
    });

    return docs;
};
