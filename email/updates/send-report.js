"use strict";
var fluid      = require("infusion");
var updates    = fluid.registerNamespace("gpii.ul.email.updates");
updates.loader = require("../../config/lib/config-loader");
updates.config = updates.loader.loadConfig(require("../../config/local.json"));

var path             = require("path");
var emailTemplates   = require("email-templates");
updates.templatesDir = path.join(__dirname, "templates");

var when             = require("when");
var moment           = require("moment");

// TODO:  Add support for command line arguments regarding frequency, etc.

// TODO:  Add groups of databases and people to send reports to

// TODO:  Convert to a single combined handlebars helper for email, express, and client-side
updates.helpers = {
    "jsonify": function(context) { return JSON.stringify(context); },
    "format":  function(context, format) { return moment(context).format(format);}
};

// Poll the "updates" API for relevant updates (run for all vendors at the moment)
updates.getUpdates = function(){
    var defer = when.defer();

    var myMoment = moment();
    var lastWeek = myMoment.subtract(1, 'week').toDate();

    var getOptions = {
        url:     updates.config.express.baseUrl + "/api/updates",
        method: "GET",
        qs:    {
            source:  updates.config.sources,
            updated: lastWeek
        }
    };

    var request = require("request");
    request(getOptions, function(error, response, body){
        if (error) { defer.reject(error); }

        defer.resolve(body);
    });

    return defer.promise;
};


// TODO:  Prepare a summary from the email template
updates.generateReport = function(apiDataString) {
    var defer = when.defer();
    var data = JSON.parse(apiDataString);
    debugger;
    emailTemplates(updates.templatesDir, { "helpers": updates.helpers}, function(err, template){
        template("updates", data, function(err, html, text){
            if (err) {
                defer.reject(err);
            }
            else {
                defer.resolve(JSON.stringify({"html": html, "text": text}));
            }
        });
    });

    return defer.promise;
};

// TODO:  Send the email
updates.sendEmail = function(templateOutput) {
    var data = JSON.parse(templateOutput);
    console.log(data.text);

    return when("Promise not implemented.");
};

updates.getUpdates().then(updates.generateReport).then(updates.sendEmail);