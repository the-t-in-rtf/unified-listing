function (doc) {
    "use strict";
    var id = doc.source + ":" + doc.sid;
    emit(id, id);
}