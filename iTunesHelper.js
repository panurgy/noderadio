"use strict";

var https = require("https");
var Q = require('q');

/**
 * This module makes API calls into iTunes.
 * Yeah, there's a bunch of iTunes search things out in npm.
 */


/**
 * Calls over to iTunes to get a bunch of results for a song.
 * The response is a big array of stuff sent directly from iTunes.
 */
exports.searchForSong = function(artistName, songTitle) {
    var url = "https://itunes.apple.com/search?media=music&term=" +
        artistName + '+' + songTitle.split(' ').join('+');

    var deferred = Q.defer();
    var accumulatedStuff = '';
    https.get(url, function(res) {
        //console.log("statusCode: ", res.statusCode);
        //console.log("headers: ", res.headers);

        res.on('data', function(d) {
            accumulatedStuff += d;
        });

        res.on('end', function(d) {
            deferred.resolve(accumulatedStuff);
        });

    }).on('error', function(e) {
        deferred.reject(e);
    });

    return deferred.promise;
};

/**
 * Searches for the given song, and if found, returns the
 * year of the oldest entry.  Returns 0 if the song was not
 * found at iTunes.  Could have opted to reject if the song wasn't
 * found, but decided to use zero to delinate between a problem
 * connecting/communicating with iTunes.
 */
exports.findYearSongReleased = function(artistName, songTitle) {
    var deferred = Q.defer();
    exports.searchForSong(artistName, songTitle)
    .then(function(stuff) {
        var array = JSON.parse(stuff);
        var releaseDate = 3000;  // seed this with a number larger than the current year
        if (Array.isArray(array.results)) {
            var upperArtist = artistName.toUpperCase();
            var upperTrack = songTitle.toUpperCase();
            var matches = array.results.filter(function(item) {
                if (item.kind !=="song") {
                    return false;
                }

                if ((item.artistName.toUpperCase() === upperArtist) &&
                (item.trackName.toUpperCase() === upperTrack) ) {
                    return true;
                }
            });

            var releaseDate = matches.reduce(function(prev, item) {
                var currDate = item.releaseDate.split('-')[0];
                if (currDate < prev) {
                    return currDate;
                }
                return prev;
            }, releaseDate);

        }
        if (releaseDate === 3000) {
            releaseDate = 0;
        }
        return releaseDate;
    })
    .then(function(releaseDate) {
        deferred.resolve(releaseDate);
    })
    .catch(deferred.reject)
    .done();

    return deferred.promise;
};


