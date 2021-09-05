// class to crawler a specific page and perform analysis
// notification is yielded base on analysis

// properties
var config = require("./config")()
// End properties


// imports -----------
var http = require('http')
var https = require('https')
// End imports -----------

const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

function notify(target) {
    var options = {
        body: `Botifier - ${target.name}: In Stock, ${target.url}${target.path}`,
        messagingServiceSid: config.twilio.messagingServiceSid,
        to: config.twilio.to
    }

    client.messages
        .create(options)
        .then(message => console.log(message.sid))
        .done()
}

function analyze(html, target) {

    var i = html.indexOf(target.phrase)
    if (i == -1) { // skip unrelated html body chunks
        return
    }

    var keywords = html.substring(i, i + target.length);
    var available = (keywords.indexOf(target.match) == -1) ? true : false
    if (available) {
        notify(target)
        console.log('notified with sms...')
    }
}

function makeResponseHandler(target) {

    return function(response) {
        analyze(response, target)
    }
}

function asyncRequest(target) {
    var options = {
        host: target.url,
        path: target.path,
        method: 'GET',
        headers: { // pretend to be a browser to avoid bot detection
            'content-type': 'text/html charset=utf-8',
            'user-agent': 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'
        },
    }

    var req = https.request(options, (res) => {
        console.log(`${target.name}, statusCode: ${res.statusCode}`)
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            analyze(body, target)
        });
    })

    req.on('error', (error) => {
        console.error(`${target.name}, error: ${error}`)
    })

    req.write('data')
    req.end()

}


function main() {
    console.log(`Start crawler......\nTargets: ${JSON.stringify(config.targets, null, 4)}`)

    config.targets.forEach(function(target) {
        asyncRequest(target)
    })

}

// ======= Run it
main()