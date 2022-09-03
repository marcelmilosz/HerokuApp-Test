var mongoose = require('mongoose');
const { Schema } = mongoose;

// User types:
// normal - normal user
// admin - admin (added from server)
// pro - soon when u can pay for that ;D 


const userSchema = new Schema({
    username: String, // String is shorthand for {type: String}
    email: String,
    password: String,
    whenCreated: {
        type: Date,
        default: Date.now
    },
    userType: {
        type: String,
        default: "normal"
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;