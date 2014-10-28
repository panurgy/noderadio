/**
 * Contains all of the configuration info needed by this app.
 * Makes an attempts to work in the following environments:
 * - OpenShift (RHCloud)
 * - AppFog/CenturyLink (CloudFoundry)
 * - IBM BlueMix (CloudFoundry)
 * - Local UNIX
 * - Local Windows
 *
 */
var os = require('os');
var platform = os.platform();

var makeEnvVarExample = function(varname, sampleValue) {
    // note to self - it'd be even better if we could escape the sampleValue
    //   for the current platform

    if (hostingProvider==='rhcloud') {
        return "rhc env set " + varname +"=" + sampleValue + " " +
            process.env.OPENSHIFT_APP_NAME;
    } else if (hostingProvider==='appfog') {
        return "af env-add APPNAME " + varname +'=' + sampleValue;
    } else if (hostingProvider==='bluemix') {
        return "Use the app dashboard to define " + varname +'=' + sampleValue;
    } else if ("win32" === platform) {
        return "set " + varname +"=" + sampleValue;
    } else {
        // assume UNIX/bash
        return "export " + varname +"=" + sampleValue;
    }
}

var dbUrl = process.env.DB_URL;
if (!dbUrl) {
    throw new Error("The env var DB_URL is not set, it should be something like\n" + makeEnvVarExample('DB_URL', 'mongodb://dbuser:dbpasswd@aserver.mongolab.com:someport/instanceName'));
}

exports.dbUrl = dbUrl;

var hostname = os.hostname();
var pieces = hostname.split('.');
var hostingProvider = 'localhost';
if (pieces.length > 1) {
    // looks like a fully qualified domain name
    hostingProvider = pieces[pieces.length-2];
}
if (process.env.VCAP_APP_PORT && (hostingProvider !== 'bluemix') ){
    // looks like CloudFoundry, make a really bad guess that it's AppFog
    hostingProvider = 'appfog';
}

var isProd = false;
var ipaddress = '127.0.0.1';
var listenPort = 3000;

if (hostingProvider === 'rhcloud') {
    // looks like OPENSHIFT
    ipaddress = process.env.OPENSHIFT_NODEJS_IP || ipaddress;
    listenPort = process.env.OPENSHIFT_NODEJS_PORT || listenPort;
    isProd = true;
} else if (hostingProvider === 'appfog') {
    listenPort = process.env.VCAP_APP_PORT || listenPort;
    ipaddress = process.env.VCAP_APP_HOST || ipaddress;
    isProd = true;
} else if (hostingProvider === 'bluemix') {
    // looks like bluemix
    ipaddress = process.env.VCAP_APP_HOST || ipaddress;
    listenPort = process.env.VCAP_APP_PORT || listenPort;
    isProd = true;
}


exports.isProd = isProd;
exports.ipaddress = ipaddress;
exports.listenPort = listenPort;
exports.curlerInterval = (65 * 1000);

exports.stringify = function() {
    var info = '';
    info += 'Mode = ';
    if (isProd) info += 'Prod';
    else info += 'NOT prod';
    info +=', hosting = ' + hostingProvider;
    return info;
};
