// Helper library to make array slicing consistent across APIs that support it
"use strict";
module.exports = function () {
    var fluid       = require("infusion");
    var namespace   = "gpii.ul.api.lib.arrayHelper";
    var arrayHelper = fluid.registerNamespace(namespace);

    arrayHelper.applyLimits = function (array, params) {
        if (!Array.isArray(array)) {
            return array;
        }

        var start  = 0;
        if (params.offset >= 0) {
            start = params.offset;
        }

        var end = array.length - start;

        if (params.limit && start + params.limit < array.length) {
            end = start + params.limit;
        }

        return array.slice(start, end);
    };

    arrayHelper.getDistinctEntries = function (array) {
        var map = {};
        for (var a = 0; a < array.length; a++) {
            map[array[a]] = true;
        }

        return Object.keys(map).map(function (key) { return key.indexOf(",") === -1 ? key : key.split(","); });
    };

    return arrayHelper;
};
