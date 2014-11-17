var Q = require('q');  // Q for simplicity, bluebird when it really matters.

/**
 *  Module that provides access to the song history.
 *  This implementation is tied to MongoDB, but any ol'
 *  persistence mechanism will sufffice.
 */

// Grab info about the config, would be more ideal to pass this in...
var config = require('./config');
// Yeah, using a really old Mongo client lib. Eventually want/need to update.
var mongoskin = require('mongoskin');

var db = mongoskin.db(config.dbUrl, {safe:true});
if (!db) {
    throw new Error("Unable to connect to the DB. Please check the DB_URL env var.");
}

exports.db = db;

/**
 * API that returns a promise which eventually receives a listing
 * (up to 1000) of the most recently played
 * songs for the specified callsign (like WXYZ)
 */
exports.songHistory = function(callsign) {
    var deferred = Q.defer();

    // enforce a hard limit of 1000 records returned to avoid returning the
    // entire database.
    callsign = callsign.toUpperCase();
    db.collection('songHistory').find({callsign:callsign}, {sort:{when:-1}, limit:1000}).toArray(function(e, stuff) {
        if (e) {
            deferred.reject(e);
        } else {
            deferred.resolve(stuff);
        }
    });
    return deferred.promise;
};


/**
 * Returns a promise that contains the response of the database search from
 * the "songHistory" collection.
 */
exports.findSong = function(artist, songTitle) {
    var deferred = Q.defer();

    db.collection('songHistory').find({artist: artist, songTitle: songTitle}, {limit: 5}).toArray(function(err, array) {
        // yeah, need to use bluebird's promisify routine ...
        console.log("found", array);
        if (err) { deferred.reject(err); }
        else deferred.resolve(array);
    });
    return deferred.promise;
}
    
