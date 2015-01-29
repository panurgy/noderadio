Panurgy NodeRadio
=========

A mostly-useless demo app that collects the songs played by various radio stations.

Setup
----
The following back-end services are needed to get things up and running:

  - A MongoDB server. This works with MongoLab or a Local MongoDB install.  
  - Before running the Node app, make sure your shell/environment has the variable **DB_URL** assigned to the MongoDB URL. Such as:
```sh
DB_URL=mongodb://dbuser:dbpasswd@aserver.mongolab.com:someport/instanceName
```

  - The database needs two collections: __stations__ and __songHistory__.

  - Since this is a lame demo, there isn't an interactive Station Definition editor (yet). Thus, in that Mongo Database, create a **collection** named **stations**, and manually add a JSON document/record like this:
```js
{
    "active": "prod",  // only 'prod' records are polled
    "callsign": "KQRS",
    "currentSong": {
        "curl": {
            "url": "http://www.92kqrs.com/common/nowplaying/get_nowplaying_json.php?callback=x&calls=KQRSFM&now_playing=true&_=1393385576460",
            "headers": {
                "Pragma": " no-cache",
                "Host": " www.92kqrs.com",
                "Accept-Language": " en-US,en;q=0.8",
                "User-Agent": " Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36",
                "Accept": " text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
                "Referer": " http://www.92kqrs.com/",
                "X-Requested-With": " XMLHttpRequest",
                "Cookie": " PHPSESSID=34dkiusesjbsg3b17psoh6s2g2; nlbi_51075=BL81H1fxJS87Evv8i0Na8wAAAABjXmBnaEUtY2Cvmq2rwx7I; visid_incap_51075=YjiTQZTMSryemVZQDblU2VhnslIAAAAAQUIPAAAAAACc3ybvUVfBdM2dwnhjkk29; incap_ses_104_51075=a36qCA3X1UapD4is8HtxAVlnslIAAAAA3vuK5m/9koIZYPxn61lo6w==; _trp_hit_6647/10259_160x600=3; _trp_hit_6647/10259_300x250=2; __gads=ID=8e1306178e63dba6:T=1387423584:S=ALNI_MbGrQBaujvFL6hJ94FMxuNQpHoinQ; _trp_hit_6647/10259_728x90=3; __utma=110782170.1658551907.1387423591.1387423591.1387423591.1; __utmb=110782170.1.10.1387423591; __utmc=110782170; __utmz=110782170.1387423591.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)",
                "Connection": " keep-alive",
                "Cache-Control": " no-cache"
            }
        },
        "songName": "nowplaying.title",
        "artist": "nowplaying.artist"
    }
}
```
  - The property **currentSong** contains the information used to poll the station's website for the currently playing song information.
  - The **curl** property contains all of the client/browser headers to send (to make the request look like a "legit" browser - some stations use API gateway software to block automated requests)
  - The **songName** property defines the properties to traverse in the response in order to obtain the current song name/title.
  - The **artist** property defines the properties to traverse in the response in order to obtain the current artist.

For more info
----
Check out [my blog](http://panurgynet.blogspot.com/2013/12/which-radio-station-really-has-best.html) for more (or less) useful info about this app/demo.

