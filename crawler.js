// class to crawler a specific page and perform analysis
// notification is yielded base on analysis

// properties
var config = require("./config")()
// End properties


// imports -----------
var http = require('http')
var https = require('https')
var zlib = require('zlib')
// End imports -----------

const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken)

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
    //    console.log("=====================" + html)

    var i = html.indexOf(target.keyword)
    if (i == -1) { // skip unrelated html body chunks
        return
    }

    var excerpt = html.substring(i, i + target.padding)
    //    console.log(excerpt)
    var available = false
    if (target.contains) {
        available = (excerpt.indexOf(target.matcher) != -1) ? true : false
    } else {
        available = (excerpt.indexOf(target.matcher) == -1) ? true : false
    }

    if (available) {
        notify(target)
        console.log('notified with sms...')
    }
}

function handleGzippedHttpResponseStream(res, target) {
    var gunzip = zlib.createGunzip()
    var buffer = []

    res.pipe(gunzip)
    gunzip.on('data', function(data) {
        // decompression chunk ready, add it to the buffer
        buffer.push(data.toString())

    }).on("end", function() {
        // response and decompression complete, join the buffer and return
        analyze(buffer.join(""), target)

    }).on("error", function(e) {
        console.error(`${target.name}, error: ${error}`)
    })
}

function handleHttpResponseStream(res, target) {
    var body = ''

    res.on('data', function(chunk) {
        body += chunk
    })
    res.on('end', function() {
        analyze(body, target)
    })
}

function asyncRequest(target) {
    var options = {
        host: target.url,
        path: target.path,
        method: 'GET',
    }

    options['headers'] = target.headers

    var req = https.request(options, (res) => {
        console.log(`${target.name}, statusCode: ${res.statusCode}`)

        if ('gzip' == res.headers['content-encoding']) {
            handleGzippedHttpResponseStream(res, target)
        } else {
            handleHttpResponseStream(res, target)
        }

    })
    req.on('error', (e) => {
        console.error(`${target.name}, error: ${e}`)
    })

    req.write('data')
    req.end()

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function main() {
    console.log('Start crawler......')

    config.targets.forEach(function(target) {
        asyncRequest(target)
    })
    console.log('End')
}

// ======= Run it
main()