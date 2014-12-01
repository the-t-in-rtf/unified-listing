"use strict";

module.exports = function(config) {
    var fluid     = require('infusion');
    var namespace = "gpii.ul.unifier.tokenizer";
    var tokenizer = fluid.registerNamespace(namespace);

    tokenizer.tokenize = function(string) {
        return string ? string.split(new RegExp(config.unifier.tokenizeRegex)) : [];
    };

    return tokenizer;
};