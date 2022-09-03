var mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: String, // String is shorthand for {type: String}
    email: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;