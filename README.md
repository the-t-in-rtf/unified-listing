This directory contains code of the Unified Listing server including scripts to import data and generate exports.

To deploy the Unified Listing, you will need to have:

1. CouchDB
2. Node.js
3. Bower
4. Lucene-Couchdb
5. Couchapp


Once you have those, you will need to:

1.  Create a database (preferably called "ul") in your local Couch instance.
2.  Deploy the views in the ```couchapp``` directory (see the README.md file there).
3.  Run ``npm install`` in this directory.
4.  Install the required user management views by navigating to ```node_modules/express-user-couchdb``` and running a command like: ```node init http://username:password@localhost:5984/_users```.
4.  Navigate to the "front-end" directory and follow the instructions there to install the client-side dependencies and start the server.
