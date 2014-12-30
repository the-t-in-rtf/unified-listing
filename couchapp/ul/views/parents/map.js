function(doc) {
    if (doc.source === "unified") {
        emit(doc.uid, doc);
    }
}