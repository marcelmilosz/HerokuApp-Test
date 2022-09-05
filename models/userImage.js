var mongoose = require('mongoose');
const { Schema } = mongoose;

// User types:
// normal - normal user
// admin - admin (added from server)
// pro - soon when u can pay for that ;D 


const userImageSchema = new Schema({

    imageOwner: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    imageBuffer: {
        data: Buffer,
        contentType: String
    },
    imageMime: {
        type: String,
        required: true
    },
    imageSize: {
        type: Number,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    }
});

const UserImage = mongoose.model('UserImage', userImageSchema);

module.exports = UserImage;