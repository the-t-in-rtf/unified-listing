function (doc) {
    if (!doc.manufacturer || !doc.manufacturer.country || doc.manufacturer.country.length === 0 || doc.manufacturer.country === "UNKNOWN") {
        emit(null, doc);
    }
}