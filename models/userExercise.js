var mongoose = require('mongoose');


var UserSchemaExercise = new mongoose.Schema({
    username: {
        type: String,
        unique: false,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    duration: {
        type: Number,
    },
    dateUnix: {
        type: Number
    },
    date: {
        type: String
    }
});




var UserExercise = mongoose.model('UserExercise', UserSchemaExercise);



module.exports = UserExercise;
// module.exports = mongoose.model('polls', pollsSchema);