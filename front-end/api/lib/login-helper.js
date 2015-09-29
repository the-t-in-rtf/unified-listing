// Helper library to make query handling consistent
"use strict";
module.exports = function (config) {
    var fluid             = require("infusion");
    var namespace         = "gpii.ul.api.lib.loginHelper";
    var loginHelper       = fluid.registerNamespace(namespace);
    var _                 = require("underscore-node");

    loginHelper.config    = config;
    loginHelper.apiUrl    = loginHelper.config.express.baseUrl + loginHelper.config.express.apiPath;
    loginHelper.loginUrl  = loginHelper.apiUrl + "user/signin";
    loginHelper.logoutUrl = loginHelper.apiUrl + "user/signout";
    loginHelper.request   = require("request");
    loginHelper.jar       = loginHelper.request.jar();
    loginHelper.request.defaults({"jar": loginHelper.jar});

    loginHelper.defaults = {
        "login": {
            "url": loginHelper.loginUrl,
            "json": { "name": "admin", "password": "admin"},
            "jar": loginHelper.jar
        },
        "logout": {
            "url": loginHelper.loginUrl,
            "json": { "name": "admin", "password": "admin"},
            "jar": loginHelper.jar
        }
    };

    loginHelper.login = function (jqUnit, options, callback) {
        var myJqUnit = jqUnit;
        var loginOptions = _.defaults(options, loginHelper.defaults.login);
        loginHelper.request.post(loginOptions, function (e, r, b) {
            myJqUnit.start();
            myJqUnit.assertNull("There should be no login errors returned", e);
            myJqUnit.assertTrue("The login should have been successful.", b.ok);
            var cookieString = loginHelper.jar.getCookieString("http://localhost/connect.sid");
            myJqUnit.assertTrue("There should now be a session cookie:", cookieString && cookieString.indexOf("connect.sid") !== -1);
            myJqUnit.stop();

            if (callback) {
                callback(e, r, b);
            }
        });
    };

    loginHelper.logout = function (jqUnit, options, callback) {
        var myJqUnit = jqUnit;
        var logoutOptions = _.defaults(options, loginHelper.defaults.logout);
        loginHelper.request.post(logoutOptions, function (e, r, b) {
            myJqUnit.start();
            myJqUnit.assertNull("There should be no logout errors returned", e);
            if (callback) {
                callback(e, r, b);
            }
        });
    };

    return loginHelper;
};
