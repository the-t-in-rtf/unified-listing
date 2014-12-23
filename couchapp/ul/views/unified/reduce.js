function(keys, values, rereduce) {
    "use strict";

    // Reduce all the records with the same "parent" ID to a single structure...
    function combine(existingRecord, newRecord) {
        var combinedRecord = existingRecord ? JSON.parse(JSON.stringify(existingRecord)) : {};

        if (existingRecord) {
            if (newRecord.source === "unified") {
                if (existingRecord.sources) {
                    newRecord.sources = JSON.parse(JSON.stringify(existingRecord.sources));
                }
                combinedRecord = JSON.parse(JSON.stringify(newRecord));
            }
            else if (newRecord.sources) {
                if (!combinedRecord.sources) { combinedRecord.sources = []; }
                newRecord.sources.forEach(function(record){
                    if (record) {
                        combinedRecord.sources.push(JSON.parse(JSON.stringify(record)));
                    }
                });
            }
            else {
                if (!combinedRecord.sources) { combinedRecord.sources = []; }
                combinedRecord.sources.push(JSON.parse(JSON.stringify(newRecord)));
            }
        }
        else {
            if (newRecord.source === "unified") {
                combinedRecord = JSON.parse(JSON.stringify(newRecord));
            }
            else if (newRecord.sources) {
                if (!combinedRecord.sources) { combinedRecord.sources = []; }
                newRecord.sources.forEach(function(record){
                    combinedRecord.sources.push(JSON.parse(JSON.stringify(record)));
                });
            }
            else {
                if (!combinedRecord.sources) { combinedRecord.sources = []; }
                combinedRecord.sources.push(JSON.parse(JSON.stringify(newRecord)));
            }
        }

        return combinedRecord;
    }

    if (rereduce) {
        // If we are rereducing, combine clusters with the same UID, making sure to:
        // 1. Preserve the unified record wrapper details
        // 2. Combine all partial "sources" arrays
        // 3. Preserve all unique records with no cluster data

        var rereduced = {};
        values.forEach(function(partial){
            Object.keys(partial).forEach(function(key){
                var record = partial[key];
                if (record.uid || record.sources) {
                    var combinedRecord = combine(rereduced[key], record);
                    rereduced[key] = combinedRecord;
                }
                else {
                    // If the record has no uid and is not a partial, it will stand alone as its own record.
                    rereduced[key] = record;
                }
            });
        });
        return rereduced;
    }
    else {
        var reduced = {};
        for (var a = 0; a < values.length; a++) {
            var record = values[a];
            var key = record.uid;

            if (record.uid) {
                var combinedRecord = combine(reduced[key], record);
                reduced[key] = combinedRecord;
            }
            else {
                // If the record has no uid, it will stand alone as its own record.
                reduced[record.source + ":" + record.sid] = record;
            }
        }

        return reduced;
    }
}
