/**
 *  Compopnent that provides access to the song history. 
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
 * API that returns a listing (up to 1000) of the most recently played 
 * songs for the specified callsign (like WXYZ)
 */
exports.songHistory = function(callsign, res) {
    // enforce a hard limit of 1000 records returned to avoid returning the
    // entire database.
    db.collection('songHistory').find({callsign:callsign}, {sort:{when:-1}, limit:1000}).toArray(function(e, stuff) {
        if (e) {
            res.status(500).send(e);
        } else {
            res.send(stuff);
        }
    });
};

