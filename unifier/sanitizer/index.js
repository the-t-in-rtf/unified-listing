"use strict";

module.exports = function(config) {
    var fluid     = require('infusion');
    var namespace = "gpii.ul.unifier.sanitizer";
    var sanitizer = fluid.registerNamespace(namespace);

    sanitizer.buildStopWords = function(stopWordSets) {
        if (!stopWordSets) {
            stopWordSets = Object.keys(config.unifier.stopWords);
        }

        var stopWords = [];
        stopWordSets.forEach(function(key){
            if (config.unifier.stopWords[key]) {
                 stopWords = stopWords.concat(config.unifier.stopWords[key]);
            }
        })
        return stopWords;
    };

    sanitizer.toLowerCase = function (array) {
        var newArray = [];
        array.forEach(function(entry){
            newArray.push(entry.toLowerCase());
        });
        return newArray;
    };

    sanitizer.stripStopWords = function(array, stopWordSets) {
        var stopWords = sanitizer.buildStopWords(stopWordSets);

        return sanitizer.stripArray(array, stopWords);
    };

    sanitizer.stripArray = function (array, stripWords) {
        var newArray = [];
        if (array !== undefined) {
            array.forEach(function (value) {
                if (stripWords.indexOf(value) === -1) newArray.push(value);
            });
        }
        return newArray;
    };

    sanitizer.stripDuplicates = function(array) {
        var newHash = {};
        array.forEach(function(entry){
           newHash[entry] = true;
        });

        return Object.keys(newHash);
    };

    return sanitizer;
}