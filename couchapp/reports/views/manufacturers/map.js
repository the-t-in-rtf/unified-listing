function (doc) {
    function strip(rawString) {
        return rawString.toLowerCase().trim();
    }
    var addressFields = ["address", "postalCode", "cityTown"];
    if (doc.manufacturer && doc.manufacturer.name && doc.manufacturer.name.length > 0) {
        var address = "";
        for (var a=0; a < addressFields.length; a++) {
            var key = addressFields[a];
            var addressValue = doc.manufacturer[key];
            if (addressValue) {
                if (address.length > 0) {
                    address += " ";
                }
                address += addressValue;
            }
        }
        emit(strip(doc.manufacturer.name), { name: doc.manufacturer.name, address: address, country: doc.manufacturer.country, url: doc.manufacturer.url, phone: doc.manufacturer.phone, email: doc.manufacturer.email});
    }

}