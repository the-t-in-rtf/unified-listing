function(doc) {
    "use strict";
    if (doc.uid) {
        emit(doc.uid, doc);
    }
}