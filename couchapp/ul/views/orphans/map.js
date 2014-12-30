function(doc) {
    if (!doc.uid && doc.source !== "unified") {
        emit([doc.source, doc.sid], doc);
    }
}