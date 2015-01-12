// Helper library to make array slicing consistent across APIs that support it
"use strict";
module.exports=function(config) {
    var fluid       = require("infusion");
    var namespace   = "gpii.ul.api.lib.arrayHelper";
    var arrayHelper = fluid.registerNamespace(namespace);
    var moment      = require("moment");

    arrayHelper.applyLimits = function(array, params) {
        if (!Array.isArray(array)) {
            return array;
        }

        var start  = 0;
        if (params.offset >=0 ) {
            start = params.offset;
        }

        var end = array.length - start;

        if (params.limit > 0) {
            end = start + params.limit;
        }

        return array.slice(start, end);
    };

    return arrayHelper;
};
