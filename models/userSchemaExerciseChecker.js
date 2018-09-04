var mongoose = require('mongoose');


var userSchemaExerciseChecker = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    }
});




var userSchemaExerciseChecker = mongoose.model('userSchemaExerciseChecker', userSchemaExerciseChecker);



module.exports = userSchemaExerciseChecker;
// module.exports = mongoose.model('polls', pollsSchema);
