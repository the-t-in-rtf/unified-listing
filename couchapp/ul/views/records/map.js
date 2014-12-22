function(doc) {
    if (doc.source && doc.sid) {
        emit([doc.source, doc.sid],doc);
    }
}