var mongoose = require('mongoose');


var URLShortenerSchema = new mongoose.Schema({
     initial_URL: {
         type: String,
         unique: false,
     },
     shortenedUrl: {
         type: String,   
     }
 });




var URLShortener = mongoose.model('URLShortener', URLShortenerSchema);



module.exports = URLShortener;
// module.exports = mongoose.model('polls', pollsSchema);