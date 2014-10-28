/**
 *  Central starting point for the back-end/server part of the app.
 *  Highly rudimentary, and barely fit for human consumption.
 *  Started by Ben Peter, feel free to misuse this as you see fit.
 */

var express = require('express');
var fs      = require('fs');
var os      = require('os');
var config = require('./config');

var songdb, flareData, dbBummer;
try {
    songdb = require('./db')
    flareData = require('./flareData');
} catch (e) {
    // If the database isn't available at startup-time, make a note
    //   of the cause. We still want the Express server to start, regardless
    //   of the database's condition.
    dbBummer = { bummer: "The database appears to be unavailable.",
        error: e.message };
}


var app = express();

// simple sanity test
app.get('/health', function(req, res) {
    // just send back a simple response
    res.send('1');
});

// The "super secret" URL that prints the runtime environment so that we can
//   figure out what's messed up when deploying this app to new/different
//   cloud environments
app.get('/env', function(req, res) {
    var stuff = '';

    // Pull these properties from the "os" variable
    ['hostname', 'platform', 'type', 'arch', 'release', 'cpus'].forEach(
        function(key) {
            stuff += 'os.' + key +'=';
            var obj = os[key].call();
            if (typeof obj === 'object'){
                stuff += JSON.stringify(obj);
            } else {
                stuff += obj;
            }
            stuff += '<br>';
        }
    );

    // Then dump the ENV vars - except for the secret ones
    Object.keys(process.env).forEach(function(key) {
        if (key === 'DB_URL') {
            // yeah, this is a secret ENV var. Skip it.
            return;
        }
        stuff += key +'=';
        stuff += process.env[key];
        stuff += '<br>';
    });

    // Send everything back to the requester.
    res.send(stuff);
});

// Returns the current timestamp.
app.get('/now', function(req, res) {
    res.send('' + new Date().getTime());
});

// Handler that returns the Flare Graph data for the specified
//    station callsign (like WXYZ)
app.get("/flare/:callsign", function(req, res) {
    if (flareData) {
        flareData.service(req, res);
    } else {
        res.send(JSON.stringify(dbBummer));
    }
});

// Handler that returns the songs most recently played for the specified
//    station/callsign  (like WXYZ)
app.get("/db/:callsign", function(req, res) {
    if (songdb) {
        songdb.songHistory(req.params.callsign, res);
    } else {
        res.send(JSON.stringify(dbBummer));
    }
});

// Serve up all of the static assets 'n' such
app.use(express.static(__dirname + '/public'));

// Start listening on the IP Address / port
app.listen(config.listenPort, config.ipaddress, function() {
    console.log('%s: Node server started on %s:%d ...',
        Date(Date.now() ), config.ipaddress, config.listenPort);
    console.log(config.stringify());

    // Start the process of polling the various/defined station websites.
    if (songdb) {
        var curler = require('./curler');
        curler.pollForever();
    }

});



