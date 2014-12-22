"use strict";

module.exports = function(config) {
    var fluid     = require('infusion');
    var namespace = "gpii.ul.unifier.scorer";
    var scorer    = fluid.registerNamespace(namespace);

    var tokenizer = require("../tokenizer")(config);
    var sanitizer = require("../sanitizer")(config);
    var resolver  = require("../resolver")(config);

    scorer.compareByToken = function (a, b, settings) {
        var field = settings.field;

        var aValue = resolver.resolve(a, field);
        var setA = sanitizer.toLowerCase(tokenizer.tokenize(aValue));
        setA = sanitizer.stripStopWords(setA);
        setA = sanitizer.stripDuplicates(setA);

        var bValue = resolver.resolve(b, field);
        var setB = sanitizer.toLowerCase(tokenizer.tokenize(bValue));
        setB = sanitizer.stripStopWords(setB);
        setB = sanitizer.stripDuplicates(setB);

        if (settings.includeField) {
            var aIncludeValue = resolver.resolve(a, settings.includeField);
            var includesA = sanitizer.toLowerCase(tokenizer.tokenize(aIncludeValue));
            includesA = sanitizer.stripStopWords(includesA);
            var setA = setA.concat(includesA);

            var bIncludeValue = resolver.resolve(b, settings.includeField);
            var includesB = sanitizer.toLowerCase(tokenizer.tokenize(bIncludeValue));
            includesB = sanitizer.stripStopWords(includesB);
            var setB = setB.concat(includesB);
        }

        // Exclude words that already in the excluded field
        if (settings.excludeField) {
            // TODO:  Move this series of actions to a separate function
            var aExcludeValue = resolver.resolve(a, settings.excludeField);
            var excludesA = sanitizer.toLowerCase(tokenizer.tokenize(aExcludeValue));
            excludesA = sanitizer.stripStopWords(excludesA);
            var prunedSetA = sanitizer.stripArray(setA, excludesA);

            var bExcludeValue = resolver.resolve(b, settings.excludeField);
            var excludesB = sanitizer.toLowerCase(tokenizer.tokenize(bExcludeValue));
            excludesB = sanitizer.stripStopWords(excludesB);
            var prunedSetB = sanitizer.stripArray(setB, excludesB);

            // We cannot prune away all possible matches.  If we've done so, then use the original
            if (prunedSetA.length > 0) setA = prunedSetA;
            if (prunedSetB.length > 0) setB = prunedSetB;
        }

        return scorer.compareBySet(setA, setB);
    };

    scorer.compareByValue = function(a, b, field) {
        if (a === undefined || a === null || b === undefined || b === null) return 0;

        var aValue = resolver.resolve(a, field);
        var bValue = resolver.resolve(b, field);
        return aValue && bValue && (aValue === bValue) ? 1 : 0;
    };

    scorer.compareByDate = function(a, b, field) {
        var millisPerYear = 1000 * 60 * 60 * 24 * 365.25;
        var aValue = resolver.resolve(a, field);
        var yearsA = Date.parse(aValue) / millisPerYear;
        var bValue = resolver.resolve(b, field);
        var yearsB = Date.parse(bValue) / millisPerYear;
        var diffYears = Math.abs(yearsA - yearsB);

        if (diffYears < 2) return 1;
        if (diffYears < 5) return 0.5;
        return 0;
    };

    scorer.compareBySetFields = function (a, b, fields) {
        var setA = scorer.setFromFields(a,fields);
        var setB = scorer.setFromFields(b,fields);

        return scorer.compareBySet(setA, setB);
    };

    scorer.setFromFields = function(data, fields, deepField) {
        var set = [];
        fields.forEach(function(field){
            if (data[field]) {
                if (deepField) {
                    if (data[field] instanceof Array) {
                        data[field].forEach(function(entry){
                            if (entry[deepField]) {
                                set.push(entry[deepField]);
                            }
                        });
                    }
                    else {
                        set.push(data[field][deepField]);
                    }
                }
                else {
                    set = set.concat(data[field]);
                }
            }
        });
        return set;
    };

    scorer.compareBySet = function(a, b) {
        var smallerSet = a.length <= b.length ? a : b;
        var largerSet  = b.length >= a.length ? b : a;

        var matchCount = 0;

        smallerSet.forEach(function (token) {
            if (largerSet.indexOf(token) !== -1) matchCount++;
        });

        return matchCount / smallerSet.length;
    };

    scorer.compareByIsoFields = function (a, b, fields) {
        var setA = scorer.setFromFields(a, fields, "Code");
        var setB = scorer.setFromFields(b, fields, "Code");

        return scorer.compareByIsoCodes(setA, setB);
    };

    scorer.compareByIsoCodes = function(a, b) {
        var score = 0;

        var smallerSet = a.length <= b.length ? a : b;
        var largerSet  = b.length >= a.length ? b : a;

        var isoRegexp = new RegExp(config.unifier.isoCodeRegex);

        smallerSet.forEach(function (smallerToken) {
            if (smallerToken && smallerToken.match(isoRegexp)) {
                if (largerSet.indexOf(smallerToken) !== -1) {
                    score = 1;
                }
                else {
                    // Partial matches are more complex
                    var smallerTokenParts = smallerToken.split(".");
                    for (var bpos = 0; bpos < largerSet.length; bpos++) {
                        var largerToken = largerSet[bpos];
                        if (largerToken && largerToken.match(isoRegexp)){
                            var largerTokenParts = largerToken.split(".");
                            var tokenScore = 0;
                            if (smallerTokenParts[0] === largerTokenParts[0]) {
                                tokenScore += 0.3;
                                if (smallerTokenParts[1] === largerTokenParts[1]) {
                                    tokenScore += 0.5;
                                }
                                score = Math.max(score, tokenScore);
                            }
                        }
                    }
                }
            }
        });

        return score;
    };

    return scorer;
}