# Unified Listing API

The Unified Listing is a federated database of products, including those focused on Assistive Technology users as well as mainstream products

This API allows developers to read, create, and update records stored in the Unified Listing.

This document describes the REST API, including the syntax required to use all commands, and the format of all data to be passed into and returned from the API.

# Data Objects
This section describes the data objects which are accepted by and returned by the Unified Listing API.

## Product Records

All products in the Unified Listing have the following common fields:

|Field|Description|Required?|
| --- | --- | --- |
|source|The source of this record.  If the record is provided by a database vendor, this field will be set to a unique string identifying the vendor.  If this record is unique to the Unified Listing, this field will be set to "ul".|Y|
|sid|The unique identifier used by the vendor to identify this record.|Y|
|uid|The unique identifier of this record in the Unified Listing.  For source records (see below), this is set to "source:sid".|Y|
|name|The name of the product.|Y|
|description|A description of the product.|Y|
|manufacturer|A JSON object describing the manufacturer (see ["Manufacturer"](#manufacturers) below).|Y|
|status|The status of this record.  Current supported values are listed below under ["Statuses"](#statuses).|Y|
|language|The language used in the text of this record.  If this is not specified, US English is assumed.|N|
|updated|The date at which the record was last updated.|Y|

[View JSON Schema for all products](../../schema/product.json)

## Source Records

The Unified Listing contains source records pulled from vendors such as [EASTIN](http://www.eastin.eu/) and [GARI](http://www.gari.info/), represented as JSON objects.

In addition to the fields described in ["Product Records"](#product-records), a source record includes the following additional fields:

|Field|Description|Required?|
| --- | --- | --- |
|sourceData|The original vendor record represented as a JSON object.  As a vendor may have any fields they like, so there are no other restrictions on this field.|Y|


A JSON representation of a source record with all fields looks as follows:

    {
        "source":         "siva",
        "sid":            "19449",
        "uid":            "siva:19449",
        "name":           "ANS - SET PUNTATORI ANS",
        "description":    "",

        "manufacturer":     {
            "name":       "ASSOCIAZIONE NAZIONALE SUBVEDENTI",
            "address":    "Via Clericetti, 22",
            "postalCode": "20133",
            "cityTown":   "Milano",
            "country":    "ITALY",
            "phone":      "+39-0270632850",
            "email":      "info@subvedenti.it",
            "url":        "http://www.subvedenti.it/"
        },
        "status":         "discontinued",
        "language:        "it_it",
        "sourceData":     {
            "ManufacturerAddress": "Via Clericetti, 22",
            "ManufacturerPostalCode": "20133",
            "ManufacturerTown": "Milano",
            "ManufacturerCountry": "ITALY",
            "ManufacturerPhone": "+39-0270632850",
            "ManufacturerEmail": "info@subvedenti.it",
            "ManufacturerWebSiteUrl": "http://www.subvedenti.it/",
            "ImageUrl": "http://portale.siva.it/files/images/product/full/19449_b.jpg",
            "EnglishDescription": "",
            "OriginalUrl": "http://portale.siva.it/it-IT/databases/products/detail/id-19449",
            "EnglishUrl": "http://portale.siva.it/en-GB/databases/products/detail/id-19449",
            "Features": [
              {
                "FeatureId": 295,
                "FeatureName": "Italian",
                "FeatureParentName": "Languages",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 316,
                "FeatureName": "Windows",
                "FeatureParentName": "Operating systems",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 161,
                "FeatureName": "Free of charge",
                "FeatureParentName": "Software price policy",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 281,
                "FeatureName": "Software to modify the pointer appearance",
                "FeatureParentName": "Subdivision",
                "ValueMin": 0,
                "ValueMax": 0
              }
            ],
            "Database": "Siva",
            "ProductCode": "19449",
            "IsoCodePrimary": {
              "Code": "22.39.12",
              "Name": "Special output software"
            },
            "IsoCodesOptional": [],
            "CommercialName": "ANS - SET PUNTATORI ANS",
            "ManufacturerOriginalFullName": "ASSOCIAZIONE NAZIONALE SUBVEDENTI",
            "InsertDate": "2012-10-02T15:21:00+02:00",
            "LastUpdateDate": "2012-10-02T15:24:00+02:00",
            "ThumbnailImageUrl": "http://portale.siva.it/files/images/product/thumbs/19449_s.jpg",
            "SimilarityLevel": 0
            }
        },
        "updated":        "2012-10-02T15:24:00+02:00"
    }

[View JSON Schema for "source" products](../../schema/sourceProduct.json)


## Unified Listing Records

The Unified Listing also contains "unified" records, which are a summary in US English of one or more source records.  In addition to the fields mentioned in ["Product Records"](#product-records), a "unified" record supports the following additional fields:

|Field|Description|Required?|
| --- | --- | --- |
|sources| An array containing a list of "source" records (see ["Source Records"](#source-records) above).|Y|
|instances| A hash containing one or more "instances" of the product (see ["Instances"](#instances) below).  At least one instance named "default" is required.|Y|

A full "unified" record in JSON format looks something like:

    {
        "source":           "ul",
        "uid":              "ul:com.maker.win7.sample",
        "sid":              "com.maker.win7.sample",
        "name":             "A Sample Unified Listing Record",
        "description":      "A record that combines 2-3 additional records' worth of information."
        "manufacturer":     {
            "name":             "Maker Software",
            "address":          "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
            "postalCode":       "27707",
            "cityTown":         "Durham",
            "provinceRegion":   "North Carolina",
            "country":          "United States",
            "phone":            "(704) 555-1212",
            "email":            "maker@maker.com",
            "url":              "http://www.maker.com/"
        },
        "status":           "active",
        "language:          "en_us",
        "sources":          [ "siva:2345" ],
        "instances": {
            "default": {
                "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                "settingsHandlers": [],
                "lifeCycleManager": {}
            }
        }
        "updated":          "2014-11-30T22:04:15Z"
    }

[View JSON Schema for "unified" products](../../schema/unifiedProduct.json)

## Statuses

The Unified Listing has a simple workflow to manage the lifecycle of all products.  The status field indicates which step in the workflow the product is currently at.

The following table describes the allowed statutes and when they are to be used.

|Status|Description|
| --- | --- |
|new|A product that has just been added and which has not been reviewed.|
|active|A product that has been reviewed and which is currently available.|
|discontinued|A product which is no longer being produced (but which may still be available on the used market).|
|deleted|A product record which was has been deleted for administrative reasons.  Should only be used for duplicates or mistakenly-created records.  For products that are no longer available, use "discontinued" instead.|

[View JSON Schema for statuses](../../schema/status.json)

## Manufacturers

The company or individual that produces a product is called a "manufacturer" in the Unified Listing.  The following table describes the available fields and how they are to be used.

|Field|Description|Required?|
| --- | --- | --- |
|name           | The name of the manufacturer.|Y|
|address        | The street address of the manufacturer (may also be used for the complete address).|N|
|postalCode     | The postal code (ZIP code, etc.) of the manufacturer.|N|
|cityTown       | The city/town in which the manufacturer is located.|N|
|provinceRegion | The province/region in which the manufacturer is located.|N|
|country        | The country in which the manufacturer is located.|N|
|phone          | The phone number of the manufacturer.|N|
|email          | An email address at which the manufacturer can be contacted.|N|
|url            | The manufacturer's web site.|N|

 A JSON representation of a manufacturer with all fields looks as follows:

    "manufacturer":     {
        "name":             "Maker Software",
        "address":          "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
        "postalCode":       "27707",
        "cityTown":         "Durham",
        "provinceRegion":   "North Carolina",
        "country":          "United States",
        "phone":            "(704) 555-1212",
        "email":            "maker@maker.com",
        "url":              "http://www.maker.com/"
    }

[View JSON Schema for manufacturers](../../schema/manufacturer.json)


## Instances

A software product may have various versions or editions that operate on different platforms.  A physical device may have multiple editions that provide different features.

Each variation on the product that has different features is an "instance" of the product.  Variations that are only cosmetically different (such as different colors) should not need to have more than one instance.

An instance is required to have a unique key.  There must be at least one instance, called "default" which is used when the version or variation is otherwise unknown.

The simplest set of instances represented in JSON format looks something like the following:

    instances: {
        "default": {
            "contexts": {
                "OS": [{
                        "id": "android",
                        "version": ">=0.1"
                    }]
            },
            "settingsHandlers": [
                {
                    "type": "gpii.settingsHandlers.noSettings",
                    "capabilities": [
                        "display.screenReader",
                        "applications.com\\.android\\.freespeech.id",
                        "display.screenReader.applications.com\\.android\\.freespeech.name"
                    ]
                }
            ],
            "lifecycleManager": {
                "start": [
                    {
                        "type": "gpii.androidActivityManager.startFreespeech"
                    }
                ],
                "stop": [
                    {
                    }
                ]
            }
        }
    }

[View JSON Schema for instances](../../schema/instance.json)


# API REST endpoints

## POST /api/product
Creates a new product record.  Regardless of the information provided, all records default to the "new" status until they are reviewed and flagged as "active".

+ Request (application/json}

    ```
    {
        "source":         "mydb",
        "sid":            "1234",
        "uid":            "mydb:1234",
        "name":           "My Product",
        "description":    "My Description",
        "manufacturer":     {
            "name":       "Me, Inc."
        },
        "sourceData":     {
            "price":  "free"
        },
        "updated":        "2012-10-02T15:24:00+02:00"
    }
    ```
+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/message+json; profile=https://registry.raisingthefloor.org/schema/record.json#
        + Link: <https://registry.raisingthefloor.org/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"New product submitted."
            "product": {
                "source":         "mydb",
                "sid":            "1234",
                "uid":            "mydb:1234",
                "name":           "My Product",
                "description":    "My Description",
                "manufacturer":     {
                    "name":       "Me, Inc."
                },
                "status":         "new",
                "sourceData":     {
                    "price":  "free"
                },
                "updated":        "2012-10-02T15:24:00+02:00"
            }
        }
        ```

## PUT /api/product
Update an existing product. Partial records are allowed, but at a minimum you must provide a uniqueId and at least one other field.  If a partial record is submitted, only the supplied fields will be updated.  To clear the value for a field, you must explicitly pass "null" as the value.  Returns the updated product record.

Note: If you do not submit an "updated" field, the current date will be used.

+ Request (application/json}

    {
        "uid":        "ul:12345",
        "definition": "This existing record needs to be updated.",
        "sourceData": {
            "price": "$20.00"
        }
     }

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.raisingthefloor.org/schema/message.json#
        + Link: <https://registry.raisingthefloor.org/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"Product record updated."
            "product": {
                "source":         "mydb",
                "sid":            "1234",
                "uid":            "mydb:1234",
                "name":           "My Product",
                "description":    "My Description",
                "manufacturer":     {
                    "name":       "Me, Inc."
                },
                "status":         "new",
                "sourceData":     {
                    "price":  "$20.00"
                },
                "updated":        "2014-12-02T15:24:00+02:00"
            }
        }
        ```

## DELETE /api/product/{uid}
Flags a record as deleted.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Parameters
    + uid (required, string) ... The unique identifier of a single record.

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/message+json; profile=https://registry.raisingthefloor.org/schema/message.json#
        + Link: <https://registry.raisingthefloor.org/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "message": "Record flagged as deleted."
        }
        ```

## GET /api/product/{uid}{?versions,children}
Returns a single product identified by its uid.  Only the latest published version is displayed by default.  For terms, child record data (aliases, etc.) is included by default.

+ Parameters
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".
    + sources (optional, boolean) ... If this is a "unified" record, you have the option to retrieve and display the source data rather than simply displaying a list of source IDs.  Defaults to "false".

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.raisingthefloor.org/schema/record.json#
        + Link: <https://registry.raisingthefloor.org/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "source":           "ul",
            "uid":              "ul:com.maker.win7.sample",
            "sid":              "com.maker.win7.sample",
            "name":             "A Sample Unified Listing Record",
            "description":      "A record that combines 2-3 additional records' worth of information."
            "manufacturer":     {
                "name":             "Maker Software",
                "address":          "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                "postalCode":       "27707",
                "cityTown":         "Durham",
                "provinceRegion":   "North Carolina",
                "country":          "United States",
                "phone":            "(704) 555-1212",
                "email":            "maker@maker.com",
                "url":              "http://www.maker.com/"
            },
            "status":           "active",
            "language:          "en_us",
            "sources":          [ "siva:2345" ],
            "instances": {
                "default": {
                    "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                    "settingsHandlers": [],
                    "lifeCycleManager": {}
                }
            }
            "updated":          "2014-11-30T22:04:15Z"
        }
        ```


## GET /api/products{?source,status,updatedAfter,updatedBefore}

Return the list of products, optionally filtered by source, status, or date of last update.

## GET /api/search{?q,status,updatedAfter,updatedBefore}

Perform a full-text search on the list of records, and return the list of matching records.

## GET /api/unified{?status,updatedAfter,updatedBefore,sources}

Return the list of "unified" records, optionally including all source records.