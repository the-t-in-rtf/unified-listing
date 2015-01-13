// Encapsulate the express-user-couchdb calls in their own module for cleaner testing and possible replacement with another solution
//
// NOTE: Because the API is hard-coded to use /api/user relative to the including context, this module should be included from the root of the express instance
"use strict";
module.exports=function(config){
    var fluid      = require("infusion");
    var namespace  = "gpii.ul.api.user";
    var user       = fluid.registerNamespace(namespace);
    var path       = require("path");

    config.email.templateDir = path.join(__dirname, "templates");

    var couchUser  = require("express-user-couchdb");
    user.router    = couchUser(config);

    return user;
};