# Unified Listing API

This is some text

```
This is some code
this is another line of code
```

The Unified Listing is a federated database of products, including those focused on Assistive Technology users as well as mainstream products

This API allows developers to read, create, and update records stored in the Unified Listing.

This document describes the REST API, including the syntax required to use all commands, and the format of all data to be passed into and returned from the API.

# Data Objects
This section describes the data objects which are accepted by and returned by the Unified Listing API.

## Product Records

A product is a distinct piece of software or equipment.  Products may have more than one version or edition, which may provide different features.  For more information about editions (versions or models of a product), see the ["Instances"](#instances) section.

All products in the Unified Listing have the following common fields:

|Field|Description|Required?|
| --- | --- | --- |
|source|The source of this record.  If the record is provided by a source database, this field will be set to a unique string identifying the source.  If this record is unique to the Unified Listing, this field will be set to "ul".|Y|
|sid|The unique identifier to identify this record in the source database.|Y|
|uid|The Universal ID ("uid") is an id that is unique in the Unified listing and which is constant for different editions of a product (see ["editions"](#editions)).  "Source" records use this field to indicate which "unified" record they are associated with (if any).|N|
|name|The name of the product.|Y|
|description|A description of the product.|Y|
|manufacturer|A JSON object describing the manufacturer (see ["Manufacturer"](#manufacturers) below).|Y|
|status|The status of this record.  Current supported values are listed below under ["Statuses"](#statuses).|Y|
|language|The language used in the text of this record, expressed using a two letter language, code, an underscore, and a two letter country code, as in `en_us` or `it_it`.  If this is not specified, `en_us` is assumed.|N|
|updated|The date at which the record was last updated.|Y|

[View JSON Schema for all products](../../schema/product.json)

## Source Records

The Unified Listing contains source records pulled from sources such as [EASTIN](http://www.eastin.eu/) and [GARI](http://www.gari.info/), represented as JSON objects.

In addition to the fields described in ["Product Records"](#product-records), a source record includes the following additional fields:

|Field|Description|Required?|
| --- | --- | --- |
|sourceData|The original source record represented as a JSON object.  As a source database may have any fields they like, so there are no other restrictions on this field.|Y|


A JSON representation of a source record with all fields looks as follows:

    {
        "source":         "siva",
        "sid":            "19449",
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
|editions| A hash containing one or more "editions" of the product (see ["Editions"](#editions) below).  At least one instance named "default" is required.|Y|
|ontologies| A hash containing one or more "ontologies", or ways of classifying the product (see ["Ontologies"](#ontologies) below.)|

A full "unified" record in JSON format looks something like:

    {
        "source":           "ul",
        "uid":              "com.maker.win7.sample",
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
        "editions": {
            "default": {
                "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                "settingsHandlers": [],
                "lifeCycleManager": {}
            }
        },
        "ontologies": {
            "iso9999": {
                "primaryCode": "22.39.12",
                "secondaryCodes": [ "22.39.07" ]
            }
        },
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

## Ontologies

There are many ways of classifying products and product features.  In the Unified Listing, we provide support for multiple ontologies without proscribing a set format.  The only thing that is required is that the ontology itself have a key which is unique within the given record.

Here is an example of the ontologies section of a product represented in JSON format (based on the data we have from EASTIN):

    "ontologies": {
        "iso9999": {
            "primaryCode": "22.39.12",
            "secondaryCodes": [ "22.39.07" ]
        }
    }

## Instances

A software product may have various versions or editions that operate on different platforms.  A physical device may have multiple editions that provide different features.

Each variation on the product that has different features is an "instance" of the product.  Variations that are only cosmetically different (such as different colors) should not need to have more than one instance.

An instance is required to have a unique key.  There must be at least one instance, called "default" which is used when the version or variation is otherwise unknown.

The simplest set of editions represented in JSON format looks something like the following:

    editions: {
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

[View JSON Schema for editions](../../schema/instance.json)


# API REST endpoints

## POST /api/product
Creates a new product record.  Regardless of the information provided, all records default to the "new" status until they are reviewed and flagged as "active".

+ Request (application/json}

    ```
    {
        "source":         "mydb",
        "sid":            "1234",
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
        + Content-Type: application/message+json; profile=https://registry.gpii.net/schema/record.json#
        + Link: <https://registry.gpii.net/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"New product submitted."
            "record": {
                "source":         "mydb",
                "sid":            "1234",
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

Update an existing product.  You must provide a complete record in JSON format.  Returns the updated product record.

Note: If you do not submit an "updated" field, the current date will be used.

+ Request (application/json)

    ```
    {
        "source":         "mydb",
        "sid":            "1234",
        "name":           "My Product",
        "description":    "This existing record needs to be updated.",
        "manufacturer":     {
            "name":       "Me, Inc."
        },
        "status":         "new",
        "sourceData":     {
            "price":  "$20.00"
        }
     }
    ```

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/message.json#
        + Link: <https://registry.gpii.net/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok":true,
            "message":"Product record updated."
            "record": {
                "source":         "mydb",
                "sid":            "1234",
                "name":           "My Product",
                "description":    "This existing record needs to be updated.",
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

## DELETE /api/product/{source}/{sid}
Flags the record with `source` and `sid` as deleted.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Parameters
    + uid (required, string) ... The unified identifier of a single record.

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/message+json; profile=https://registry.gpii.net/schema/message.json#
        + Link: <https://registry.gpii.net/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "message": "Record flagged as deleted."
        }
        ```

## GET /api/product/{source}/{sid}{?versions,sources}
Returns a single product identified by its `source` and `sid`.  Only the latest published version is displayed by default.  For ["unified" records](#unified-records), full source records are not included by default.

+ Parameters
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".
    + sources (optional, boolean) ... If this is a "unified" record, you have the option to retrieve and display the source data rather than simply displaying a list of source IDs.  Defaults to "false".

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/record.json#
        + Link: <https://registry.gpii.net/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            {
                "source":           "ul",
                "uid":              "com.maker.win7.sample",
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
                "editions": {
                    "default": {
                        "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                        "settingsHandlers": [],
                        "lifeCycleManager": {}
                    }
                },
                "ontologies": {
                    "iso9999": {
                        "primaryCode": "22.39.12",
                        "secondaryCodes": [ "22.39.07" ]
                    }
                },
                "updated":          "2014-11-30T22:04:15Z"
            }
        }
        ```


## GET /api/products{?source,status,updated,offset,limit,versions}

Return the list of products, optionally filtered by source, status, or date of last update.

+ Parameters
    + source (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.
    + status (optional, string) ... The product statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for this record (including any unpublished drafts).  Defaults to "false".

+ Response 200 (application/headers+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/records.json#
        + Link: <https://registry.gpii.net/schema/records.json#>; rel="describedBy"
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "params": {
                "offset": 0,
                "limit": 1
            },
            "records": [
                {
                    "source":           "ul",
                    "uid":              "com.maker.win7.sample",
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
                    "editions": {
                        "default": {
                            "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated":          "2014-11-30T22:04:15Z"
                }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## GET /api/search{?q,source,status,sort,offset,limit,versions}
 Performs a full text search of all data, returns matching products.

 + Parameters
    + q (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
    + source (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + sort (optional,string) ... The sort order to use when displaying records.  Conforms to [lucene's query syntax][1].
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.
    + versions (optional, boolean) ... Whether or not to display the full version history for each record (including any unpublished drafts).  Defaults to "false".

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/search.json#
         + Link: <https://registry.gpii.net/schema/search.json#>; rel="describedBy"
     + Body

         ```
         {
             "ok": true,
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "offset": 0,
                  "limit": 100,
                  "updated": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "sort": "uid ASC",
             "records": [
                {
                    "source":           "ul",
                    "uid":              "com.maker.win7.sample",
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
                    "editions": {
                        "default": {
                            "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated":          "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ## GET /api/suggest/{?q,source,status,sort,versions}
 Suggest a short list of related records.  Performs a search as in /api/search, but only returns 5 results and does not support paging.  Equivalent to `/api/search?q=search&results=5`.  Used to suggest related records when building a "unified" record.

 + Parameters
     + q (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
     + source (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.  A record can be excluded by prepending an exclamation point in front of its name, as in ```source=!ul```.
     + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
     + sort (optional,string) ... The sort order to use when displaying records.  Conforms to [lucene's query syntax][1].
     + versions (optional, boolean) ... Whether or not to display the full version history for each record (including any unpublished drafts).  Defaults to "false".

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/search.json#
         + Link: <https://registry.gpii.net/schema/search.json#>; rel="describedBy"
     + Body

         ```
         {
             "ok": true,
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "updated": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "records": [
                {
                    "source":           "ul",
                    "uid":              "com.maker.win7.sample",
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
                    "editions": {
                        "default": {
                            "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated":          "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ## GET /api/updates/{?source,updated,status,offset,limit}
Return a list of unified records that contain newer information than the record provided by the given source.

 + Parameters
     + source (required, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.  A record can be excluded by prepending an exclamation point in front of its name, as in ```source=!ul```.
     + updated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only updates at or after this time are included in the comparison.
     + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
     + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
     + limit (optional, string) ... The number of records to return.  Used for pagination.  Set to `-1` to return all records.  Defaults to `-1`

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/updates.json#
         + Link: <https://registry.gpii.net/schema/updates.json#>; rel="describedBy"
     + Body

         ```
         {
             "ok": true,
             "total_rows": 1,
             "params": {
                  "sources": ["Vlibank"]
                  "updated": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "records": [
                {
                    "source":           "ul",
                    "uid":              "com.maker.win7.sample",
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
                    "editions": {
                        "default": {
                            "contexts":         { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated":          "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

