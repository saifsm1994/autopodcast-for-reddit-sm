app.route('/shortenmeget/*')
    .get(function (req, res) {
        var requrl = req.url.split('/').slice(2).join('');
        // Verify that link is proper/valid
        if (requrl.indexOf('http:') != -1 && requrl.indexOf('.') != -1 || requrl.indexOf('https:') != -1 && requrl.indexOf('.') != -1) {
            if (requrl.indexOf('http:' != -1)) {
                requrl = requrl.replace('http:', 'http://');
            }
            if (requrl.indexOf('https:' != -1)) {
                requrl = requrl.replace('https:', 'https://');
            }
            var initialUrl = requrl;
            //generate mongodb key and assign value
            var shortenedUrl = crypto.randomBytes(4).toString('hex'); //should give us several thousand urls without duplicates - more isn't really needed
            var urlObject = {
                initialUrl: initialUrl,
                shortenedUrl: '/sh/' + shortenedUrl
            }
            URLShortener.create(urlObject, function (err, userCreationReturn) {
                if (err) {
                    console.log('An error occured');
                    res.send('An error occurred' + err)
                } else {
                    console.log('A new url has been shortened');
                    res.send(userCreationReturn);
                }
            });
        } else {
            console.log(requrl)
            res.send('<h1>Invalid URL:</h1><h3> Please ensure that there is a http or https included in your url</h3>')
        }
    })
