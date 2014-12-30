function(doc) {
    if (doc.uid && doc.source !== "unified") {
        emit(doc.uid, doc);
    }
}