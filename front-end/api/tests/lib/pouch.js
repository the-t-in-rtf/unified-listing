// Utility functions to spin up pouch.
"use strict";

module.exports = function(config) {
    var fluid = require("infusion");
    var pouch = fluid.registerNamespace("gpii.ul.api.tests.pouch");

    pouch.start = function(callback) {
        var PouchDB    = require("pouchdb");

        var MemPouchDB = PouchDB.defaults({db: require("memdown")});
        var ul         = new MemPouchDB("ul");
        var _users     = new MemPouchDB("_users");

        var express    = require("express");
        var app        = express();


        var sessionator = require("../lib/sessionator")(config);
        app.use("/_session",sessionator);

        // Add PouchDB with simulated CouchDb REST endpoints
        app.use("/", require("express-pouchdb")(MemPouchDB));
        app.set("port", config.couch.port);

        var http = require("http");
        http.createServer(app).listen(config.couch.port, function(){
            console.log("Pouch express server listening on port " + config.express.port);

            console.log("Pouch express started...");

            // Give express-pouch a bit of time to start up.  I gravy hate myself.
            setTimeout(function() { loadViews(callback); },500);
        });
    };

    function loadViews(callback) {
        var couchappUtils = require("../lib/pouchapp")(config);

        var path = __dirname + "/../../../../couchapp/ul/";
        var viewContent = couchappUtils.loadCouchappViews(path);

        var options = {
            "url": config.couch.url + "/_design/ul",
            "json": viewContent
        };

        var request = require("request");
        request.put(options,function(e,r,b) {
            if (e && e !== null) {
                return console.log("Error loading views into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading views into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Views loaded...");
            loadData(callback);
        });
    }

    function loadData(callback) {
        var data = require("../../../../test/data/products/products-bulk.json");

        // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
        var options = {
            "url":  config.couch.url + "_bulk_docs",
            "json": data
        };
        var request = require("request");
        request.post(options,function(e,r,b) {
            if (e && e !== null) {
                return console.log("Error loading data into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading data into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Data loaded...");

            loadUsers(callback);
        });
    }

    function loadUsers(callback) {
        var data = require("../../../../test/data/users/users.json");

        var options = {
            "url": config.couch.users + "_bulk_docs",
            "json": data
        };

        var request = require("request");
        request.post(options,function(e,r,b) {
            if (e && e !== null) {
                return console.log("Error loading users into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading users into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Users loaded...");

            if (callback) {
                callback();
            }
        });
    }

    return pouch;
};


