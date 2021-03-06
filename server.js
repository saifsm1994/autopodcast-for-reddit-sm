const express = require('express');
var dotenv = require('dotenv').config();
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

const url = require("url");
const cors = require('cors');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');
var request = require('request');
var lexrank = require('lexrank');

let linkarray = [];



const client = new textToSpeech.TextToSpeechClient();
let outputFile = "./tempDownloads/download_" + Math.floor(Math.random() * 1000000000) + ".mp3";
const introTextOrigin = "For the subreddit of /r/ ";
let introText = introTextOrigin;
const dataError = {
    "message": "Subreddit Not Found",
    "error": 404
    };


process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

app.set('view engine', 'ejs');

if (!process.env.DISABLE_XORIGIN) {
    app.use(function (req, res, next) {
        var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
        var origin = req.headers.origin || '*';
        if (!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
            console.log(origin);
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        }
        next();
    });
}

app.use(cors())

app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(bodyParser.json())

app.use(express.static('public'))
app.use('/static', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));



// Section 1 AutoPodcast APIS HERE


//API SUBSECTION
app.route('/api/redditApi/requestText')
.post(function (req, res) {
    console.log("called reddit text")
    let subreddit = "worldnews";
    let postCount = 19;
    let sortBy = "hot";
    let timeLimit = "day";


    if(req.body.subreddit){subreddit = req.body.subreddit;}
    if (req.body.postCount){postCount = req.body.postCount }
    if (req.body.postCount > 39){postCount = 39}
    if (req.body.sortBy){sortBy = req.body.sortBy}
    if (req.body.timeLimit){timeLimit = req.body.timeLimit}

    introText = introTextOrigin + subreddit;

    console.log(req.body.subreddit)

    setTimeout(() => {
        let apiCall = "https://www.reddit.com/r/" + subreddit + "/" + sortBy + "/.json?count=20&limit=" + postCount + "&t=" + timeLimit;
        request.get({
            url: apiCall,
            json: true
          },(error, response, data) => {
              //to catch all errors - error / 404 / subreddit search
            if(error || data.error || data.data.dist == 0){
            if(error){
                console.log('error', error);
                res.send(error)
                }else{
                    if(data.error){
                    console.log('data.error', data.error);
                    res.send(dataError)
                }else{
                    if(data.data.dist ==0){
                console.log('data.dist ==0');
                res.send(dataError)   
                    }
                 }
                }
            }else{
              let topPosts = [];
              let urlsArray = [];
              if(data.data && data.data.children){
            data.data.children.forEach(element => {
              topPosts.push(element.data.title);
              if(element.data.url){urlsArray.push(element.data.url)}
            });
            let answerJSON={untemplatedText: topPosts, urlsArray: urlsArray}
            res.send(answerJSON);
          }
          }
        })
        console.log("requestText apiCall   ==   "   + apiCall)

    }, 100);



})

app.route('/api/redditApi/formatText')
.post(function (req, res) {

    let subreddit = "worldnews";
    let postCount = 19;
    let sortBy = "hot";
    let timeLimit = "day";

    if(req.body.subreddit){subreddit = req.body.subreddit;} 
    if (req.body.postCount){postCount = req.body.postCount}
    if (req.body.postCount > 39){postCount = 39}
    if (req.body.sortBy){sortBy = req.body.sortBy}
    if (req.body.timeLimit){timeLimit = req.body.timeLimit}

    request.post({
        url: 'http://localhost/api/redditApi/requestText',
        form: {subreddit:subreddit, postCount: postCount, sortBy: sortBy, timeLimit: timeLimit}
      },(error, response, data) => {
        if(data){ data = JSON.parse(data);}
        if(error || data.error ){
            if(error){
                console.log('error', error);
                res.send(error)
                }else{
                    if(data.error){
                    console.log('data.error', data.error);
                    res.send(dataError)
                }
            }
        }else{
        if(data){
            console.log("formatText has retreived the data");
            response = JSON.parse(response.body);
            let untemplatedText = response.untemplatedText
            let templatedText = applyTemplate(untemplatedText);
            console.log("format text has templated the data")
            res.send(templatedText);}    
      }
    })
})


app.route('/api/redditApi/autoPodcast')
.post(function (req, res) {

    outputFile = "./tempDownloads/download_" + Math.floor(Math.random() * 1000000000) + ".mp3"
    let subreddit = "worldnews";
    let postCount = 19;
    let sortBy = "hot";
    let timeLimit = "day";
    if(req.body.subreddit){subreddit = req.body.subreddit;} 
    if (req.body.postCount){postCount = req.body.postCount}
    if (req.body.postCount > 39){postCount = 39}
    if (req.body.sortBy){sortBy = req.body.sortBy}
    if (req.body.timeLimit){timeLimit = req.body.timeLimit}

    request.post({
        url: 'http://localhost/api/redditApi/formatText',
        form: {subreddit:subreddit, postCount: postCount, sortBy: sortBy, timeLimit: timeLimit}
      },(error, response, data) => {
        console.log("retreived templated text")
        // if(data && !data.untemplatedText || data && !data.error ){ data = JSON.parse(data);}
        if(error || data.error ){
        console.log("templated text invalid - shortcast")
            if(error){
                console.log('error', error);
                res.send(error)
                }else{
                    if(data.error){
                    console.log('data.error', data.error);
                    res.send(dataError)
                }
            }
        }else{


        if(data){
            console.log("templated data valid and ready for audio process");
            setTimeout(() => {
               getAudio(data);
               res.render('download.ejs', {
                link: outputFile.slice(1)
            })}, 600);

        }    
      }
    })
})

//This function gets a list of articles, then gets the text, then gets a summary - called by a function which turns these into podcasts

app.route('/api/redditApi/obtainArticles')
.post(function (req, res) {

    let subreddit = "worldnews";
    let postCount = 19;
    let sortBy = "hot";
    let timeLimit = "day";
    
    if(req.body.subreddit){subreddit = req.body.subreddit;} 
    if (req.body.postCount){postCount = req.body.postCount}
    if (req.body.postCount > 39){postCount = 39}
    if (req.body.sortBy){sortBy = req.body.sortBy}
    if (req.body.timeLimit){timeLimit = req.body.timeLimit}

    request.post({
        url: 'http://localhost/api/redditApi/requestText',
        form: {subreddit:subreddit, postCount: postCount, sortBy: sortBy, timeLimit: timeLimit}
      },(error, response, data) => {
        if(data){ data = JSON.parse(data);}
        if(error || data.error ){
            if(error){
                console.log('error', error);
                res.send(error)
                }else{
                    if(data.error){
                    console.log('data.error', data.error);
                    res.send(dataError)
                }
            }
        }else{
        if(data){
            console.log("obtainArticles has retreived the URLS" );
            response = JSON.parse(response.body);
            // console.log("incoming data for obtainArticles = " + response)
            let titlesArray = response.untemplatedText;
            let urlsArray = response.urlsArray;
            let articleDataArray = Array(titlesArray.length).fill(null)
            console.log("urls array - " + urlsArray[0])
            if(urlsArray[0]){

                urlsArray.forEach((element,index) => {

                    var topLines = lexrank.summarizePage(element, 7, function (err, toplines, text) {
                        if (err) {
                          console.log(err);
                          articleDataArray[index] = "Unable to parse the " + stringifyNumber(index) + " article. Sorry about that. This article was titled: " + titlesArray[index];
                        }
                        // console.log(toplines); retuns more detailed values with weights                      
                        // console.log(text); returns only summary text
                        articleDataArray[index] =  text;
                      });
                  });

                  //increase delay based on article count
                  let delayVal = postCount * 120;
                  if (delayVal < 2000){delayVal = 2000}
                  let delayVal2 = delayVal + 200;

                  //Delay to allow articles to arrive - increasing this will allow for more captures
                    setTimeout(() => {
                        articleDataArray.forEach((element, index) => {
                            if(element == null){
                                articleDataArray[index] =  "Unable to parse the " + stringifyNumber(index) + " article. Sorry about that. This article was titled: " + titlesArray[index];
                            }else{
                            articleDataArray[index] = "The " + stringifyNumber(index)    + " article today is " + titlesArray[index] + " and it says that:  " + articleDataArray[index];
                            }
                        })
                    }, delayVal);  

                    //wait before sending the article list
                    setTimeout(() => {
                        res.send(articleDataArray)
                    }, delayVal2);
                    // console.log(articleDataArray)
                    // var smmry = "https://api.smmry.com/?SM_API_KEY="KEYHERE"&SM_LENGTH=1&SM_URL=" + articleDataArray 
                    //For better summaries
                }
    }} })
})

app.route('/api/redditApi/autoPodcastComplete')
.post(function (req, res) {

    outputFile = "./tempDownloads/download_" + Math.floor(Math.random() * 1000000000) + ".mp3"
    let subreddit = "worldnews";
    let postCount = 19;
    let sortBy = "hot";
    let timeLimit = "day";
    linkarray = [];
    if(req.body.subreddit){subreddit = req.body.subreddit;} 
    if (req.body.postCount){postCount = req.body.postCount}
    if (req.body.postCount > 39){postCount = 39}
    if (req.body.sortBy){sortBy = req.body.sortBy}
    if (req.body.timeLimit){timeLimit = req.body.timeLimit}

    request.post({
        url: 'http://localhost/api/redditApi/obtainArticles',
        form: {subreddit:subreddit, postCount: postCount, sortBy: sortBy, timeLimit: timeLimit}
      },(error, response, data) => {
        if(data){ data = JSON.parse(data);}
        if(error || data.error ){
            if(error){
                console.log('error', error);
                res.send(error)
                }else{
                    if(data.error){
                    console.log('data.error', data.error);
                    res.send(dataError)
                }
            }
        }else{


        if(data){
            console.log("templated data ready for audio process = " + data);
           
            // data = JSON.parse(data);
            // console.log(data);

            data.forEach((element, index) => {
                setTimeout(() => {
                    getAudioSplit(element, index);
                    
                   }, 600);

                setTimeout(() => {
                    res.render('downloadArray.ejs', {
                        link: linkarray
                        })
                }, 6000)
           
            })
        }    
      }
    })
})






//Routing Subsection

app.get('/tempDownloads/:downloadFile', function(req, res){
    var file = __dirname + '/tempDownloads/' + req.params.downloadFile;
    res.download(file); // Set disposition and send it.
  });

app.get('/download/:downloadFile', function(req, res){
    let tempLink =  './download/' + req.params.downloadFile;
    res.render('download.ejs', {
        link: tempLink.slice(1)
    })
  });

app.get('/redditApi/', (req, res) => {
    console.log("reddit regular api running")
    res.render(__dirname + '/views/redditText.ejs')

  });

app.get('/autopodcast/', (req, res) => {
    console.log("reddit autopodcast api running")
    res.render(__dirname + '/views/autoPodcast.ejs')

  });

  app.get('/formatText/', (req, res) => {
    console.log("reddit formatText api running")
    res.render(__dirname + '/views/formatText.ejs')

  });


  
app.get('/obtainArticles/', (req, res) => {
    console.log("reddit formatText api running")
    res.render(__dirname + '/views/obtainArticles.ejs')

  });






// Section 1.5 Voice Tester Google
app.route('/api/redditApi/voiceTestMe')
.post(function (req, res) {

    outputFile = "./tempDownloads/download_" + Math.floor(Math.random() * 1000000000) + ".mp3"
    let textToMp3 = "She sells sea shells down by the sea shore... The reindeer in spain was hit mainly by the plane...";
    let voiceChoice = "en-AU-Standard-A";
    let Gender = "FEMALE";
    let Lang = "en-AU";
    linkarray = [];
    if(req.body.voiceChoiceFemale && req.body.voiceChoiceFemale != "Blank"){voiceChoice = req.body.voiceChoiceFemale; Gender = "FEMALE"; Lang = voiceChoice.slice(0,5);} 
    if ((req.body.voiceChoiceFemale == "Blank" || !req.body.voiceChoiceFemale) && req.body.voiceChoiceMale && req.body.voiceChoiceMale != "Blank"){voiceChoice = req.body.voiceChoiceMale; Gender = "MALE"; Lang = voiceChoice.slice(0,5);}
    // if (req.body.voiceChoice && req.body.voiceChoice != "en-AU-Standard-A" ){Lang = voiceChoice.slice(0,5);}
    if (req.body.textToMp3){textToMp3 = req.body.textToMp3}


    setTimeout(() => {
        getAudioCustomVoice(textToMp3,voiceChoice,Lang,Gender)
        console.log(textToMp3,voiceChoice,Lang,Gender)
    }, 200);

    setTimeout(() => {
        res.render('download.ejs', {
         link: outputFile.slice(1)
     })}, 600);



})


//This route gets all voice samples in a given folder.
app.route('/voiceSamples')
.get(function (req, res) {
    let fileArray = [];
    fs.readdirSync(sampleFolder).forEach(file => {
    console.log(file);
    console.log("called")
    fileArray.push(file);
    })
    setTimeout(() => {
        res.render('playSampleArray.ejs', {fileMp3: fileArray, voiceTitle: fileArray  })
    }, 1000);

   
})

app.get('/voiceSamples/:downloadFile', function(req, res){
    var file = __dirname + '/voiceSamples/' + req.params.downloadFile;
    res.download(file); // Set disposition and send it.
  });



  












app.get('/', (req, res) => {
    // var route = req.params.route;
    // if(route == null){route = '/views/index.ejs'}
    res.render(process.cwd() + '/views/index.ejs');
});


app.route('/:page')
    .get(function (req, res) {
        if (req.params.page.indexOf('.html') != -1) {
            res.sendFile(process.cwd() + '/views/' + req.params.page + '.html');
        } else {
            // req.params.page = req.params.page.substring(0, req.params.page.length - 5);
            // } else {
            if (true // req.params.page.indexOf('.ejs') != -1
            ) {
                res.render(req.params.page);
            }
        }
    })


app.get('/', (req, res) => {
    res.render(__dirname + '/views/index.ejs')
});


// Not found middleware
app.use((req, res, next) => {
    return next({
        status: 404,
        message: 'not found'
    })
})

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage

    if (err.errors) {
        // mongoose validation error
        errCode = 400 // bad request
        const keys = Object.keys(err.errors)
        // report the first validation error
        errMessage = err.errors[keys[0]].message
    } else {
        // generic or custom error
        errCode = err.status || 500
        errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode).type('txt')
        .send(errMessage)
})

const listener = app.listen(process.env.PORT || 80, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})





// FUNCTIONs

function datenow() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var dt = year + "/" + month + "/" + day;
    return dt
}

function getUnixTime(inp) {
    var validDate = [];
    var Answered = {};

    if (chrono.parse(inp).length !== 0) {
        var url_parts = chrono.parse(inp);
        // res.send(url_parts )


        var abra = []; // holds the array for year month day
        abra[0] = url_parts[0]['start']['knownValues']['day'];
        abra[1] = url_parts[0]['start']['knownValues']['month'];
        abra[2] = url_parts[0]['start']['knownValues']['year']
        for (var i = 0; i < abra.length; i++) {
            // abra[i] = n(abra[i]);
        }

        // fills blanks
        var abraString = String(abra[2]) + '-' + String(abra[1]) + '-' + String(abra[0]); //fixes format


        var Alakazam = abraString

        var unixTimestamp = moment(Alakazam, "YYYY-MM-DD").unix(); // VALID UNIX CONVERSION DONE
        Alakazam = moment.unix(unixTimestamp).format("DD/MMM/YYYY");

        Answered = {
            "unixTime": unixTimestamp,
            "naturalTime": Alakazam
        };





        return Answered;
    } else {
        if (true) {
            // if unix date rather than natural date
            var Alakazam = moment.unix(inp).format("DD/MMM/YYYY");
            Answered = {
                "unixTime": inp,
                "naturalTime": Alakazam
            };

            return Answered;
        }
    }

}

function applyTemplate(a){
    // let initialArray = a;
    // return a;
    let myPosts = [];
    myPosts.push(introText);
    
    a.forEach((element,index) => {
      let indCount = index + 1;
      myPosts.push("the " + stringifyNumber(indCount) + " post today is " + element + ".")
    });

    myPosts = myPosts.join(" ").split("..").join(".");

    return myPosts

}

//Function copied from a post by Andrea Ritz on stack overflow
const special = ['zeroth','first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
const deca = ['twent', 'thirt', 'fort', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];

function stringifyNumber(n) {
  if (n < 20) return special[n];
  if (n%10 === 0) return deca[Math.floor(n/10)-2] + 'ieth';
  return deca[Math.floor(n/10)-2] + 'y-' + special[n%10];
}


function getAudio(templatedData){
//   console.log("getAudio   =  "  +  templatedData);

    //check to fit 5000 character limit:
    if(templatedData.length > 4999){templatedData = templatedData.slice(0,4950) + ". END. Word limit reached.Rest of file omitted."}



    // Construct the request
  const request = {
    input: {text: templatedData},
    // Select the language and SSML Voice Gender (optional) en-US-Wavenet-A
    voice: {name: "en-GB-Wavenet-C", languageCode: 'en-GB', ssmlGender: 'FEMALE'},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };


    // Performs the Text-to-Speech request
  client.synthesizeSpeech(request, (err, response) => {
    if (err) {
      console.error('ERROR:', err);
      console.log("error at fs client.synthesizeSpeech")

      return;
    }

    // Write the binary audio content to a local file
  fs.writeFile(outputFile,  response.audioContent, 'binary', err => {
    if (err) {
     console.log("error at fs writefile")
      console.error('ERROR:', err);

      return;
    }
    console.log('Audio content written to file: ' + outputFile);
  });
});

    // response.audioContent, 'binary'


}

function getAudioSplit(templatedData, index){
    //   console.log("getAudio   =  "  +  templatedData);
    
    //check to fit 5000 character limit:
    if(templatedData.length > 4999){templatedData = templatedData.slice(0,4950) + ". END. Word limit reached.Rest of file omitted."}

    let newEnd = "_" + index + ".mp3";
    let outputFileSplit = outputFile.replace(".mp3", newEnd)
    //tracks files to serve
    linkarray.push(outputFileSplit.slice(1))

    // Construct the request
      const request = {
        input: {text: templatedData},
        // Select the language and SSML Voice Gender (optional) en-US-Wavenet-A
        voice: {name: "en-GB-Wavenet-C", languageCode: 'en-GB', ssmlGender: 'FEMALE'},
        // Select the type of audio encoding
        audioConfig: {audioEncoding: 'MP3'},
      };
    
    
    // Performs the Text-to-Speech request
      client.synthesizeSpeech(request, (err, response) => {
        if (err) {
          console.error('ERROR:', err);
          console.log("error at fs client.synthesizeSpeech")
    
          return;
        }




    // Write the binary audio content to a local file
      fs.writeFile(outputFileSplit,  response.audioContent, 'binary', err => {
        if (err) {
         console.log("error at fs writefile")
          console.error('ERROR:', err);
    
          return;
        }
        console.log('Audio content written to file: ' + outputFileSplit);
      });
    });
    
    // response.audioContent, 'binary'
    
    
}
    
    


