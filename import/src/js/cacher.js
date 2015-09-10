/*

  Static functions to standardize the handling of cached record data.  The cache is mainly used during development
  to avoid stressing our partner servers from build scripts, etc. while updating and debugging our code.  The cache is
  also used as a mechanism for providing test data from a file.

  To use these functions, your component should have an `options.cacheFile` setting that points to the full path to
  the cache file.  All of these static functions will call `fluid.fail` if this setting cannot be found.

 */
"use strict";
var fluid  = fluid || require("infusion");
var gpii   = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ul.imports.cacher");

var fs = require("fs");

// All of our functions should fail if `options.cacheFile` is not set.
gpii.ul.imports.cacher.failOnMissingOption = function (that) {
    if (!that.options.cacheFile) {
        fluid.fail("You must set options.cacheFile to use this function.");
    }
};

// Check to see if the file referenced in `options.cacheFile` exists.
gpii.ul.imports.cacher.cacheFileExists = function (that) {
    gpii.ul.imports.cacher.failOnMissingOption(that);

    return fs.existsSync(that.options.cacheFile);
};

// Save `dataToSave` to the file referenced in `options.cacheFile`.  Does not check to see if the file already exists.
gpii.ul.imports.cacher.saveToCache = function (that, dataToSave) {
    gpii.ul.imports.cacher.failOnMissingOption(that);

    fluid.log("Caching data to '" + that.options.cacheFile + "'...");

    var fd = fs.openSync(that.options.cacheFile, "w");
    var stringData = JSON.stringify(dataToSave, null, 2);
    var buffer = new Buffer(stringData);
    fs.writeSync(fd, buffer, 0, buffer.length);
    fs.closeSync(fd);
};

// Load the data contained in `options.cacheFile` using `require`.
gpii.ul.imports.cacher.loadFromCache = function (that) {
    gpii.ul.imports.cacher.failOnMissingOption(that);

    if (gpii.ul.imports.cacher.cacheFileExists(that)) {
        fluid.log("Loading cached data...");

        return JSON.parse(fs.readFileSync(that.options.cacheFile, { encoding: "utf8"}));
    }
    else {
        fluid.fail("Cannot load cached data, file does not exist...");
    }
};

gpii.ul.imports.cacher.clearCache = function (that) {
    gpii.ul.imports.cacher.failOnMissingOption(that);

    fluid.log("Clearing cache...");

    if (gpii.ul.imports.cacher.cacheFileExists(that)) {
        fs.unlinkSync(that.options.cacheFile);
    }
};
