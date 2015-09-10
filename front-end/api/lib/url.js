// Provides `gpii.ul.api.url.assembleUrl`, A static function to assemble a URL from component parts.  Makes use of
// the `url` module included with Node.js, and can take any number of string arguments you like.
//
// Leading slashes will override any existing path information in the URL.  So, for example:
//
// `gpii.ul.api.url.assembleUrl("http://base.com/path/", "/root", "subdir");`
//
// resolves to:
//
// `http://base.com/root/subdir`
//
// As does:
//
// `gpii.ul.api.url.assembleUrl("http://base.com/path/", "../root", "./subdir");`
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var url = require("url");

fluid.registerNamespace("gpii.ul.api.url");

gpii.ul.api.url.assembleUrl = function () {
    var assembledUrl = arguments[0];
    for (var a = 1; a < arguments.length; a++) {
        var newSegment = arguments[a];
        assembledUrl = url.resolve(assembledUrl, newSegment);
    }

    return assembledUrl;
};