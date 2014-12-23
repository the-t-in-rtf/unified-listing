function(doc) {
    "use strict";
    var key = doc.uid ? doc.uid : doc.source + ":" + doc.sid;
    emit(key, doc);
}