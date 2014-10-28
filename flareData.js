var curl = require('curlrequest');
var dbdriver = require('./db');
var dateFormat = require('dateformat');
    
 
/*
 * Given some query/search params, find the matching records.
 */
exports.fetch = function(incomingCallsign, incomingLowDate, incomingHighDate, res) {
    if (!incomingCallsign) {
        throw new Error("Gimme a callsign");
    }

    var lowDate = incomingLowDate || 0;
    var highDate = incomingHighDate || new Date().getTime();

    var query = {
        callsign: incomingCallsign,
        when: { $gte: lowDate.getTime(), $lte: highDate.getTime()}
    };

    dbdriver.db.collection('songHistory').find(query).toArray(function(err, docs) {

        if (err) {
            res.status(500).send(err);
        }

        var result = exports.reduceData(docs);
        var flareResult = exports.convertToFlare(incomingCallsign, result);
        flareResult.range = lowDate + " to " + highDate;
        res.send(JSON.stringify(flareResult));

    });
};

/** 
 *  Takes an array of songHistory records (usually from the DB)
 *  and recudes them into a single object:
 * {
 *      "AN ARTIST NAME": {
 *          artist: 'An Artist Name',
 *          SOME_SONG_NAME : {
 *              title: "Some Song Name",
 *              whenPlayed : [1234567890100, 1234567890400]
 *          },
 *          YET_ANOTHER_SONG : {
 *              title: "Yet Another Song"
 *              whenPlayed : [1234567890500]
 *          }
 *      },
 *      "REALLY KEWL ARTIST" {
 *          ...
 *      }
 * }
 */
exports.reduceData = function(array) {
    "use strict";
    return array.reduce(function(everything, currentThing) {
        "use strict";
        var when = currentThing.when;
        var songTitle = currentThing.songTitle;
        var artist = currentThing.artist;
        if ( ! artist) {
            // skip it
            return everything;
        }

        var artistKey = artist.toUpperCase();
        if (!everything[artistKey]) {
            everything[artistKey] = {
                artist: artist
            }
        };

        var currentArtistStuff = everything[artistKey];
        var songKey = songTitle.toUpperCase();
        if (!currentArtistStuff[songKey]) {
            currentArtistStuff[songKey] = {
                title: songTitle,
                whenPlayed: []
            }
        }

        var currentSongStuff = currentArtistStuff[songKey];
        currentSongStuff.whenPlayed.push(when);
        return everything;

    }, {});
};

/*
 *  Takes a reduced form of the data and converts it into
 *  the name/children array structure for the flare graph.
 */
exports.convertToFlare = function(callsign, obj) {
    var flare = {
        name: callsign,
        children: []
    }

    var currentArtist;

    for (var artistKey in obj) {
        if (!obj.hasOwnProperty(artistKey)) {
            continue;
        }

        var artistObj = obj[artistKey];
        currentArtist = {
            name: artistObj.artist,
            children: []
        }

        for (var songKey in artistObj) {
            if (!artistObj.hasOwnProperty(songKey) ||
                 songKey === "artist") {
                continue;
            }
 
            var songObj = artistObj[songKey];
            currentArtist.children.push( {
                name: songObj.title + ' (' +
                          songObj.whenPlayed.length +')',
                children: exports.convertTimesToChildren(songObj.whenPlayed)
            } );
        }

        flare.children.push(currentArtist);
    }
    return flare;
}

/*
 * given an array of when a song was played (long numbers), 
 * return an array of nicely formatted timestamps.
 */
exports.convertTimesToChildren = function(array) {
    var children = [];
    var len = array.length;
    var when;
    var DAY_OF_WEEK = ['Sun', 'Mon', 'Tue','Wed', 'Thu', 'Fri', 'Sat'];

    for (var i = 0; i < len; i ++) {
        when = new Date(array[i]);
        children.push( {
            name: DAY_OF_WEEK[when.getDay()] +' '+dateFormat(when, "HH:MM:ss")
        });
    }
    return children;
}

// main entry point from Express (http clients)
exports.service = function(req, res) {
    var callsign = req.params.callsign;

    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var startOfYesterday = new Date(startOfToday.getTime() - (24*60*60*1000));
    var fortyeightHoursAgo = new Date(now - (48*60*60*1000));

    var sinceWhen = fortyeightHoursAgo;
    if (req.query.sinceWhen) {
        sinceWhen = parseInt(req.query.sinceWhen, 10);
    }
    var toWhen = sinceWhen + (48*60*60*1000);
    exports.fetch(callsign, new Date(sinceWhen), new Date(toWhen), res);


};
