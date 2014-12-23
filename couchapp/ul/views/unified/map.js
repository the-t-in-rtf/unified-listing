function(doc) {
    "use strict";
    if (doc.name.toLowerCase().indexOf("speech") !== -1) {
        var key = doc.uid ? doc.uid : doc.source + ":" + doc.sid;
        emit(key, doc);
    }
}