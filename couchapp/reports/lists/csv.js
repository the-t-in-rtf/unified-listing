function () { // jshint ignore:line
    var csvOutput = "Manufacturer Name, Address, Country, URL, Phone, Email\n";
    var row;
    while (row = getRow()) { // jshint ignore: line
        var countryKeys = Object.keys(row.value);
        for (var countryIndex = 0; countryIndex < countryKeys.length; countryIndex++) {
            var countryKey = countryKeys[countryIndex];
            var countryMap = row.value[countryKey];

            var manufacturerKeys = Object.keys(countryMap);
            for (var manufacturerIndex = 0; manufacturerIndex < manufacturerKeys.length; manufacturerIndex++ ) {
                var manufacturerKey = manufacturerKeys[manufacturerIndex];
                var record = countryMap[manufacturerKey];

                var rowString = "";
                var keys = Object.keys(record);
                for (var a = 0; a < keys.length; a++) {
                    var key = keys[a];
                    var value = record[key] ? record[key] : "";
                    var stringValue = typeof value === "string" ? value : JSON.stringify(value);
                    if (rowString.length > 0) { rowString += ","; }
                    rowString += "\"" + stringValue + "\"";
                }

                csvOutput += rowString;
                csvOutput += "\n";
            }
        }

    }

    send(csvOutput); // jshint ignore:line
}