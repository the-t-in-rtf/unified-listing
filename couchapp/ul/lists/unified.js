// Reduce all the records with the same "parent" ID to a single structure using a list function...
function(head, req) {
    function combine(existingRecord, newRecord) {
        var combinedRecord = existingRecord ? JSON.parse(JSON.stringify(existingRecord)) : {};

        if (existingRecord) {
            if (newRecord.source === "unified") {
                combinedRecord = JSON.parse(JSON.stringify(newRecord));
                if (!combinedRecord.sources) {
                    combinedRecord.sources = [];
                }

                if (existingRecord.sources) {
                    existingRecord.sources.forEach(function(source){
                        combinedRecord.sources.push(JSON.parse(JSON.stringify(source)));
                    });
                }
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

    // Build the full map of records and then return them
    var dataMap = {};

    var row;
    while (row = getRow()) {
        var record = row.value;
        if (record.uid) {
            dataMap[record.uid] = combine(dataMap[record.uid], record);
        }
        else {
            dataMap[record.source + ":" + record.sid] = record;
        }
    }

    send(JSON.stringify(Object.keys(dataMap).map(function(key){ return dataMap[key]; }), null, 2));
}