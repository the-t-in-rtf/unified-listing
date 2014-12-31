/* Library to add key helper functions to express handlebars */
module.exports = function(config) {
    "use strict";
    var fluid = require("infusion");
    var helper = fluid.registerNamespace("gpii.ul.lib.hbHelper");
    var moment = require("moment");

    // TODO:  We need a clean way to include these from both the client and server side, they are duplicated for now...

    // Output the equivalent of JSON.stringify (used to generate inline code blocks defining data
    helper.jsonify = function(context) { return JSON.stringify(context); };

    // Output a date or date-like string using a particular format
    helper.format  = function(context, format) {
        return moment(context).format(format);
    };

    helper.getHelpers = function() {
        return {
            jsonify: helper.jsonify,
            format:  helper.format
        };
    };

    return helper;
};

