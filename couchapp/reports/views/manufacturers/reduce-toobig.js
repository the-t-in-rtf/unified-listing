function (keys, values, rereduce) {
    "use strict";
    var manufacturersByCountry = {};

    function longest(first, second) {
        if (!first)  { return second; }
        if (!second) { return first; }

        return first.length >= second.length ? first : second;
    }

    function combineEntries(existingEntry, newEntry) {
        if (existingEntry) {
            var combinedEntry = JSON.parse(JSON.stringify(existingEntry));

            var keys = Object.keys(newEntry);

            // Make sure each country/manufacturer record has only the longest value found.
            for (var b = 0; b < keys.length; b++) {
                var field = keys[b];
                var longestValue = longest(existingEntry[field], newEntry[field]);
                if (longestValue !== null && longestValue !== undefined) {
                    combinedEntry[field] = longestValue;
                }
            }

            return combinedEntry;
        }
        else {
            return JSON.parse(JSON.stringify(newEntry));
        }

    }

    if (rereduce) {
        for (var c = 0; c < values.length; c++) {
            var partialMap = values[c];
            var countries = Object.keys(partialMap);
            for (var d = 0; d < countries.length; d++) {
                var newCountry    = countries[d];
                var newCountryMap = partialMap[newCountry];

                if (manufacturersByCountry[newCountry]) {
                    var manufacturers = Object.keys(newCountryMap);

                    for (var e=0; e < manufacturers.length; e++) {
                        var newManufacturer      = manufacturers[e];
                        var newManufacturerEntry = newCountryMap[newManufacturer];
                        manufacturersByCountry[newCountry][newManufacturer] = combineEntries(manufacturersByCountry[newCountry][newManufacturer], newManufacturerEntry);
                    }
                }
                else {
                    manufacturersByCountry[newCountry] = newCountryMap;
                }
            }
        }
    }
    else {
        for (var a = 0; a < values.length; a++) {
            var record = values[a];

            var country = record.country ? record.country.toUpperCase() : "UNKNOWN";
            if (!manufacturersByCountry[country]) {
                manufacturersByCountry[country] = {};
            }

            var manufacturer = record.name.toLowerCase().trim();
            var existingEntry = manufacturersByCountry[country][manufacturer];
            manufacturersByCountry[country][manufacturer] = combineEntries(existingEntry, record);
        }
    }

    return manufacturersByCountry;
}
