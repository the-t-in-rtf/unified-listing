/* A script to show us the character of the tokens we have in our data set... */

var loader = require("../../config/lib/config-loader");
var config = loader.loadConfig({});

var tokenizer       = require("./index.js")(config);

var data            = require(config.eastin.cacheFile);

var totalTokens     = {
    "CommercialName":               0,
    "ManufacturerOriginalFullName": 0
};

var rawHitsByToken  =
{
    "CommercialName":               {},
    "ManufacturerOriginalFullName": {}
};

var lcHitsByToken  = JSON.parse(JSON.stringify(rawHitsByToken));

data.forEach(function(record){
    Object.keys(rawHitsByToken).forEach(function(field){
        var tokens = tokenizer.tokenize(record[field]);
        tokens.forEach(function(token){
            totalTokens[field]++;
            rawHitsByToken[field][token] ? rawHitsByToken[field][token]++ : rawHitsByToken[field][token] = 1;

            var lcToken = token.toLowerCase();
            lcHitsByToken[field][lcToken] ? lcHitsByToken[field][lcToken]++ : lcHitsByToken[field][lcToken] = 1;
        });
    });
});

var stopWordsKeys = ["generalStopWords", "companyStopWords", "productStopWords"];
var sanitizer     = require("../sanitizer")(config);

Object.keys(rawHitsByToken).forEach(function(field) {
    console.log("Total tokens in all records (" + field + "): " + totalTokens[field]);
    console.log("Unique raw tokens (" + field + ")          :" + Object.keys(rawHitsByToken[field]).length);
    console.log("Unique lowercase tokens (" + field + ")    :" + Object.keys(lcHitsByToken[field]).length);

    var keysMinusStopWords = sanitizer.stripStopWords(Object.keys(lcHitsByToken[field]));
    console.log("Unique stopworded tokens (" + field + ")   :" + keysMinusStopWords.length);

    var invertedHash = {};
    keysMinusStopWords.forEach(function(token){
        var count = parseInt(lcHitsByToken[field][token]);
        invertedHash[count] = invertedHash[count] ? invertedHash[count].concat(token): [token];
    });

    console.log("Token frequency for field '" + field + "'...");
    Object.keys(invertedHash).sort().reverse().forEach(function(count){
        console.log(count + ":" + invertedHash[count].join(","));
    });

    console.log("Token length frequency for field '" + field + "'...");
    var lengths = {};
    sanitizer.stripStopWords(Object.keys(lcHitsByToken[field])).forEach(function(token){
        var length = token.length;
        lengths[length] = (lengths[length] ? lengths[length] + 1 : 1);
    });

    console.log(JSON.stringify(lengths, null, 2));
});


