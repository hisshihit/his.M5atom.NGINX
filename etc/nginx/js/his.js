function getUri(r) {
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, r.uri);
}

function postStab(r) {
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, "ok!\n");
}

function getArgs(r) {
    var a, s;

    s = "{ \"Method\" : \"" + r.method + "\" , ";
    s += "\"RemoteAddress\" : \"" + r.remoteAddress + "\" , ";
    s += "\"URI\" : \"" + r.uri + "\" , ";

    s += "\"UserAgent\" : \"" + r.headersIn['User-Agent'] + "\"";

    for (a in r.args) {
        s += " , \"" + a + "\" : " + r.args[a] ;
    }
    s += "}\n";

    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, s);
}

var fs = require('fs');
var STORAGE = "/tmp/njs_storage";

function getArgs2Fs(r) {
    var a, s;

    s = "{ \"Method\" : \"" + r.method + "\" , ";
    s += "\"RemoteAddress\" : \"" + r.remoteAddress + "\" , ";
    s += "\"URI\" : \"" + r.uri + "\" , ";

    s += "\"UserAgent\" : \"" + r.headersIn['User-Agent'] + "\"";

    for (a in r.args) {
        s += " , \"" + a + "\" : " + r.args[a] ;
    }
    s += "}\n";

//    fs.appendFileSync(STORAGE, r.requestBody);
    fs.appendFileSync(STORAGE, s);
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, s);
}

function postBody2Fs(r) {

    fs.appendFileSync(STORAGE, r.requestBody);
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200);
}

// function flush(r) {
//	fs.writeFileSync(STORAGE, "");
//	r.return(200);
// }

function readFs(r) {
	var data = "";
	try {
		data = fs.readFileSync(STORAGE);
	} catch (e) {
	}

	r.return(200, data);
}

// export default {getUri, postStab, getArgs, getArgs2Fs, postBody2Fs, flush, readFs};
export default {getUri, postStab, getArgs, getArgs2Fs, postBody2Fs, readFs};
