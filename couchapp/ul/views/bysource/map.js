function(doc) {
    if (doc.uid) {
        emit(doc.source, doc);
    }
}