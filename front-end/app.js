// TODO:  Fix all paths so that this script can be run from any directory (currently  must be launched from this directory).
"use strict";

var express      = require("express");
var http         = require("http");
var path         = require("path");
var exphbs       = require("express-handlebars");
var logger       = require("morgan");
var app          = express();

var config = {};

var loader = require("../config/lib/config-loader");
if ("development" === app.get("env")) {
    config = loader.loadConfig(require("../config/dev.json"));
    app.use(logger("dev"));
}
else {
    config = loader.loadConfig(require("../config/prod.json"));
    app.use(logger("dev"));
}

config.viewTemplateDir   = path.join(__dirname, "views");

var data     = require("./lib/data-helper")(config);
var hbHelper = require("./lib/hb-helper")(config);

app.engine("handlebars", exphbs({defaultLayout: "main", helpers: hbHelper.getHelpers()}));
app.set("view engine", "handlebars");
app.set("port", config.express.port || process.env.PORT || 4896);
app.set("views", path.join(__dirname, "views"));

// Mount the JSON schemas separately so that we have the option to decompose them into a separate module later, and so that the doc links and web links match
app.use("/schema",express.static(__dirname + "/schema/schemas")); // jshint ignore:line

// REST APIs
var api = require("./api")(config);
app.use("/api",api);


app.use(express.static(path.join(__dirname, "public")));  // jshint ignore:line

// The infusion client-side libraries
app.use("/infusion", express.static(__dirname + "/../node_modules/infusion/src")); // jshint ignore:line

// Mount the handlebars templates as a single dynamically generated source file
app.use("/hbs",require("./views/client.js")(config));

// Most static content including root page
app.use(express.static(__dirname + "/public")); // jshint ignore:line

// Many templates simply require user information.  Those can all be loaded by a common function that:
// 1. Uses views/layouts/PATH.handlebars as the layout if it exists, "page" if it doesn"t.
// 2. Uses views/pages/PATH.handlebars for the body if it exists
// 3. Displays an error if a nonsense path is passed in.
app.use("/",function(req,res) {
    var fs = require("fs");

    var options = { config: { "baseUrl": config.express.baseUrl, "sources": config.sources}};
    data.exposeRequestData(req,options);

    var path = req.path === "/" ? "index" : req.path.substring(1);
    if (fs.existsSync(__dirname + "/views/pages/" + path + ".handlebars")) {
        options.layout = fs.existsSync(__dirname + "/views/layouts/" + path + ".handlebars") ? path : "main";
        res.render("pages/" + path, options);
    }
    else {
        res.status(404).render("pages/error", {message: "The page you requested was not found."});
    }
});

// Error handling has to be added last
function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

app.use(logErrors);

http.createServer(app).listen(app.get("port"), function(){
    console.log("Express server listening on port " + app.get("port"));
});