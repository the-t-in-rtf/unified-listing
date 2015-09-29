// Helper library to make query handling consistent
"use strict";
module.exports = function () {
    var fluid       = require("infusion");
    var namespace   = "gpii.ul.api.lib.queryHelper";
    var queryHelper = fluid.registerNamespace(namespace);
    var moment      = require("moment");

    var fieldTypes  = ["Date", "Number", "Simple", "Array", "Boolean"];
    fieldTypes.forEach(function (key) {
        queryHelper["parse" + key + "Fields"] = function(hash, req, fields) {
            fields.forEach(function (field) { queryHelper["parse" + key + "Field"](hash, req, field); });
        };
    });

    queryHelper.parseDateField = function (hash, req, field) {
        var value = queryHelper.getFieldValue(req, field);
        if (value) {
            var myMoment = moment(value);
            hash[field] = myMoment.toDate();
        }
    };

    queryHelper.parseSimpleField = function (hash, req, field) {
        var value = queryHelper.getFieldValue(req, field);
        if (value) {
            hash[field] = value;
        }
    };

    queryHelper.parseNumberField = function (hash, req, field) {
        var value = queryHelper.getFieldValue(req, field);
        if (value) {
            var intValue = parseInt(value, 10);
            if (!isNaN(intValue)) {
                hash[field] = intValue;
            }
        }
    };

    queryHelper.parseArrayField = function (hash, req, field) {
        var value = queryHelper.getFieldArrayValue(req, field);
        if (value) {
            hash[field] = value;
        }
    };

    queryHelper.parseBooleanField = function (hash, req, field) {
        var value = queryHelper.getFieldArrayValue(req, field);
        if (value) {
            hash[field] = true;
        }
    };

    queryHelper.getFieldArrayValue = function (req, field) {
        var value = queryHelper.getFieldValue(req, field);
        if (value) {
            return Array.isArray(value) ? value : [value];
        }

        return null;
    };

    queryHelper.getFieldValue = function (req, field) {
        if (req.params[field]) {
            return req.params[field];
        }
        else if (req.query[field]) {
            return req.query[field];
        }

        return null;
    };

    return queryHelper;
};
