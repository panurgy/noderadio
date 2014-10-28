/**
 *  Runs through the list of defined stations and fetches the currently
 *  playing song information.
 *  Created by Ben Peter way back on Fri Nov 22 23:03:39 CST 2013
 */

var curl = require('curlrequest');
var config = require('./config');
var dbdriver = require('./db');

var DEBUG = false;

// given an OBJECT, find the value contained by the PATH (like "this.and.that")
exports.grabPathValue = function(object, path) {
    //console.log("finding  " + path +" in object " + JSON.stringify(object));
    var pieces = path.split(/\./);
    var aField = object;
    for (var i = 0; i < pieces.length; i ++) {
        aField = aField[pieces[i]];
    }
    return aField;
}

// given  bunch of curl OPTIONS, fetch it, parse it, convert into JSON
// object, grab  whatever is specified by the PATH, and pass it into the
// CALLBACK.
exports.fetch = function(callsign, stationCurrentSongInfo, callback) {
    var options = stationCurrentSongInfo.curl;
    curl.request(options, function(err, result) {
        if (err) {
            console.log("Kaboom!");
            console.log(err);
        } else {
            var openBrace = result.indexOf('{');
            if (openBrace > -1) {
                result = result.substring(openBrace);
            }
            var closeBrace = result.lastIndexOf('}');
            if (closeBrace > -1) {
                result = result.substring(0, closeBrace+1);
            }
            var data;
            try {
                data = JSON.parse(result);
            } catch (e) {
                console.log("Unable to parse JSON for " + callsign 
                    +": " + result);
                return;
            }
            if (DEBUG) {
                console.log("Parsed response for " + callsign+": " + result);
            }
            var songName, artist;
            if (stationCurrentSongInfo.songName) {
                songName = exports.grabPathValue(data, stationCurrentSongInfo.songName);
            }
            if (stationCurrentSongInfo.artist) {
                artist = exports.grabPathValue(data, stationCurrentSongInfo.artist);
            }

            var now = new Date();
            console.log(now.getTime() + ": " +callsign+" = " + songName + " (by) " + artist);

            var entry = {
                when: now.getTime(),
                callsign: callsign,
                songTitle: songName,
                artist: artist
            };
            exports.persistCurrent(entry);
        }
    });
};

exports.persistCurrent = function(entry) {
    // Yup, double-edged-sword here. We could cache the "currently playing"
    //    song within an object, but that's not scalable. Ideally, we'd
    //    ask a REDIS cluster what's currently playing for a given station.
    // Since we don't have that, we'll ask the database.
    dbdriver.db.collection('songHistory').find({callsign:entry.callsign}, 
            {sort: {when:-1}, limit:5}).toArray(function(err, array) {
        if (err) {
            // umm, bummer?
            console.log("Unable to fetch current song for " + entry.callsign);
            console.log(err);
            return;
        }

        var saveit = false;
        if (!array) {
            saveit = true;
        } else {
            var i = 0;
            var len = array.length;
            while (i < len) {
                if (DEBUG) {
                    console.log(entry.callsign +": Comparing currrent song " + 
                    entry.songTitle + " to previous song " + array[i].songTitle);
                }
                if ( array[i].songTitle === entry.songTitle &&
                    array[i].artist === entry.artist ) {
                   // this song has been recently played
                   return;
               }
               i++;
            }
            // looks like this song is new to us!
            saveit = true;
        }

        if (saveit) {
            if (!config.isProd) {
                console.log(entry.callsign  +": PRETENDING to save song "
                        + entry.songTitle +' (by) ' 
                        + entry.artist);
                return;
            }

            if (DEBUG) {
                console.log(entry.callsign  +": Saving song "
                        + entry.songTitle +' (by) ' 
                        + entry.artist);
            }

            // this station is playing a new song!
            dbdriver.db.collection('songHistory').insert(entry,
                {journal:true}, function(err) {
                if (err) {
                    console.log("Seems like we were unable to save a new song entry.");
                    console.log(err);
                }
            });
        }

    });

};


exports.poll = function() {

    dbdriver.db.collection('stations').find().toArray(function(err, array) {
        if (!array) {
            // DB hiccup, which happens ocasionally.
            console.log("Database hiccup retrieving defined stations");
            console.log(err);
            return;
        }
        array.forEach(function(record) {
            if (record.active && (record.active === "prod") ) {
                if (record.currentSong && record.currentSong.curl) {
                    exports.fetch( record.callsign, record.currentSong);
                }
                else {
                    console.log("Skipping station " + record.callsign
                        +", no 'curl' info.");
                }
            }

        });
    });
};

exports.pollForever = function() {
    exports.poll();
    setTimeout(exports.pollForever, config.curlerInterval);
};




