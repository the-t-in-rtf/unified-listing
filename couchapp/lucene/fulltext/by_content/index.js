function(doc) { 
    if (!doc._id.match(/^_design/)) {
        var ret=new Document();

        var defs = "";

        // We have to store values we wish to use in field:value queries
        // We also include them in the value of the defaults field (used when no qualifiers are added)
        var keysToStore = ["uid","source","sid", "status", "name", "description", "language"];
        for (var i in keysToStore) {
            var field = keysToStore[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"yes"});
                defs += " " + doc[field] + " ";
            }
        }

        if (doc.manufacturer && doc.manufacturer.name) {
            ret.add(doc.manufacturer.name,{"field": "manufacturer", "store":"yes"});
            defs += " " + doc.manufacturer.name + " ";
        }

        // All of the data is added to the default field so that unqualified searches match any data found in the record.
        ret.add(defs,{"field":"default", "store": "no"});

        //log.debug("indexed document '" + doc.uniqueId + "'...");

        return ret;
    }
    else {
        //log.debug("skipping indexing of design document '" + doc._id + "'...");
    }

    return null;
}
