const express = require('express');
const app = express();
const aws = require("aws-sdk");

const ejs = require('ejs');
const path = require('path');
const url = require('url');

const bcryptjs = require("bcryptjs");

const validator = require("email-validator");

const saltRounds = 10;

const passwordValidator = require('password-validator');

// Your website: https://hostapptest.herokuapp.com/

// TO DO 
// Zeby sprawdzalo czy image jest z dobrym ext 
// Jezeli user ma juz image to zamiast dodawac nowe zmien obecne i usun z aws ten record

// Images
const fileupload = require("express-fileupload");
const UserImage = require('./models/userImage.js'); // User profile image
const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

const region = "us-east-1";
const bucketName = "direct-user-avatar-upload";
const accessKeyId = require('./secrets').secretS3.accessKey;
const secretAccessKey = require('./secrets').secretS3.secretAccessKey;


const SESSION = require("express-session");
const MongoStore = require("connect-mongo");

// Globals
const PORT = process.env.PORT || 80;

// Models 
const User = require('./models/user.js');

// DB 
var mongoose = require('mongoose');
const { get } = require('http');
var mongoDB = process.env.MONGO_URI || require('./secrets').secretDB.uri;
mongoose.connect(mongoDB);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connection with Mongo DB Successful!");
});

const sessionStore = MongoStore.create({
    mongoUrl: mongoDB,
    ttl: 20000
})

const sessionOptions = {
    secret: "Some secret",
    cookie: {
        maxAge: 60 * 60 * 24 * 1000 * 7, // One week cookie
        httpOnly: true,
        signed: true
    },
    saveUninitialized: true,
    resave: false,
    store: sessionStore
}


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

app.use(SESSION(sessionOptions));
app.use(fileupload());

let userAvatarUrl;

app.use(async (req, res, next) => {

    if (req.session.username) {
        userAvatarUrl = await getUserUrlImageProfile(req.session.username);
    }

    next();
});

app.get('/', async (req, res) => {

    if (req.session.username) {

        res.render("index.ejs", { loggedUser: req.session.username, userAvatarUrl: userAvatarUrl })
    }
    else {
        res.render("index.ejs")
    }
})

async function getUserUrlImageProfile(username) {
    console.log("looking for: ", username);

    const userAvatarUrl = await UserImage.findOne({ imageOwner: username }).exec();
    return userAvatarUrl.imagePath

}

/* Settings */
app.get('/settings', (req, res) => {

    // Getting Profile Image

    if (req.session.username) {
        res.render("settings.ejs", { loggedUser: req.session.username, userAvatarUrl: userAvatarUrl })
    }
    else {
        res.redirect('/');
    }
})

const s3 = new aws.S3({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: 'v4'
})

// Generates URL to then be send to aws 
async function generateUploadURL(filename) {
    const imageName = filename;

    const params = ({
        Bucket: bucketName,
        Key: imageName,
        Expires: 60
    })

    const uploadURL = await s3.getSignedUrlPromise('putObject', params)
    return uploadURL
}

// Sends file to aws 
async function sendImageToAws(fileBody, filename) {
    await s3.putObject({
        Body: fileBody,
        Bucket: bucketName,
        Key: filename
    }).promise()
}

// Gets image , generates url and sends it to AWS
app.post('/settings/uploadAvatarImage', async (req, res) => {

    try {
        const file = req.files;
        const fileName = Date.now() + "--" + file["avatarImage"].name;
        const fileBody = file["avatarImage"].data;

        const url = await generateUploadURL(fileName);

        await sendImageToAws(fileBody, fileName);

        const actualUrl = "https://direct-user-avatar-upload.s3.amazonaws.com/" + fileName;

        // Here we add all info about our image to DB ! (we have URL rdy!)
        const newAvatarImage = new UserImage({
            imageOwner: req.session.username,
            fileName: fileName,
            imageMime: file["avatarImage"].mimetype,
            imageSize: file["avatarImage"].size,
            imagePath: actualUrl
        });

        newAvatarImage.save();
        console.log("Image added!")

        res.redirect('/settings');

    }
    catch (err) {
        console.log("Something went wrong when uploading an image!", err);

        res.redirect('/settings', { error: "Something is wrong with image" });
    }







})

// Uploading users avatar image
app.post('/settings/uploadUserImage', (req, res) => {


    uploadUserAvatar(req, res, (err) => {
        if (err) {
            console.log("Some error when uploading an avatar image: ", err)
        }
        else {
            console.log(req.file);
            if (imageMimeTypes.includes(req.file.mimetype)) {
                // If image is PNG JPEG OR GIF
                const newImage = new UserImage({
                    imageOwner: req.session.username,
                    fileName: req.file.originalname,
                    imageBuffer: {
                        data: req.file.filename,
                        contentType: req.file.mimetype
                    },
                    imageMime: req.file.mimetype,
                    imageSize: req.file.size,
                    imagePath: req.file.path
                })


                console.log(newImage)
                newImage.save()
                    .then(() => {
                        console.log("Successfully uploaded an image!")
                    })
                    .catch((err) => {
                        console.log("Error when uploading an avatar image!\n", err)
                    })

            } else {
                // Image has wrong extenstion
                console.log("Image has wrong extenstion!", req.file.mimetype);
            }

        }
    })

    res.redirect('/')

});

/* Login */
app.get('/login', (req, res) => {
    let queries = req.query;

    console.log("Login / Recived queries: ", queries);

    res.render("login.ejs", { queries: queries });

})

app.post('/login', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    let possibleErrors = {};

    possibleErrors["username"] = username; // For returning when user typed this


    User.findOne({ $or: [{ username: username }, { email: username }] })
        .then((user) => {
            if (user !== null) {

                // User exists (Thats good)
                bcryptjs.compare(password, user.password, function (err, response) {
                    if (err) {
                        // handle error
                    }
                    if (response) {
                        // Password matches (He can login now)
                        req.session.username = username;

                        res.redirect(url.format({ pathname: "/" }));
                    } else {
                        // Password not match

                        possibleErrors['passwordOk'] = false;
                        res.redirect(url.format({ pathname: "/login", query: possibleErrors }));
                    }
                });
            }
            else {
                // User not exists
                possibleErrors["userExists"] = false;
                res.redirect(url.format({ pathname: "/login", query: possibleErrors }));
            }
        })
})

app.get('/logout', (req, res) => {

    // If someone was actually logged in
    if (req.session.username) {
        req.session.destroy((err) => {
            if (err) {
                console.log("Something went wrong with session destroy!", err)
            }

            res.clearCookie("connect.sid");
            res.redirect("/");
        })
    } else {
        res.redirect("/");
    }

})



/* Sign In */
app.get('/signin', (req, res) => {

    let queries = req.query;
    queries.amount = (Object.keys(queries)).length;

    if (queries.amount > 0) {
        // User did something wrong with password
        console.log("Recived queries: ", queries);
        res.render("signin.ejs", { queries: queries })
    }
    else {
        // User is OK!
        res.render("signin.ejs")
    }


})

/* Sign in verification */
app.post('/signin', (req, res) => {

    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;


    // * USERNAME VALIDATION *
    var usernameValidationSchema = new passwordValidator();
    usernameValidationSchema
        .is().min(4, 'Username should have a minimum length of 8 characters')                   // Minimum length 8
        .is().max(20, 'Username should have a maximum length of 100 characters')               // Maximum length 100
        .has().not().spaces(1, "Username cannot have spaces")                                   // Should not have spaces

    let usernameValidation = usernameValidationSchema.validate(username, { list: true });

    // * PASSWORD VALIDATION *
    var passwordValidationSchema = new passwordValidator();
    passwordValidationSchema
        .is().min(8, 'Password should have a minimum length of 8 characters')                   // Minimum length 8
        .is().max(100, 'Password should have a maximum length of 100 characters')               // Maximum length 100
        .has().uppercase(1, 'Password should have 1 or more uppercase characters')              // Must have uppercase letters
        .has().lowercase(1, 'Password should have 1 or more lowercase characters')              // Must have lowercase letters
        .has().digits(2, 'Password should have 2 or more digits')                               // Must have at least 2 digits
        .has().not().spaces(1, "Password cannot have spaces")                                   // Should not have spaces

    let passwordValidation = passwordValidationSchema.validate(password, { list: true });

    // * Email validator *
    let emailValidation = validator.validate(email); // true

    let inputValidation = {}; // All errors are added here 

    let someErrorFound = false; // Helper 

    inputValidation["username"] = username;
    inputValidation["email"] = email;

    console.log("Username validation: ", usernameValidation);
    console.log("Password validation: ", passwordValidation);
    console.log("Email validation: ", emailValidation);

    if (passwordValidation.length > 0) {
        for (let i = 0; i < passwordValidation.length; i++) {
            inputValidation[passwordValidation[i]] = true;
        }

        someErrorFound = true;
    }

    if (!emailValidation) {
        inputValidation["emailNotValid"] = true;

        someErrorFound = true;
    }

    if (usernameValidation.length > 0) {
        for (let i = 0; i < usernameValidation.length; i++) {
            inputValidation["u" + usernameValidation[i]] = true;
        }
        someErrorFound = true;
    }


    let newUser = {
        username: username,
        email: email,
        password: password,
    }

    User.find({ username: username })
        .then((users) => {
            if (Object.keys(users).length > 0) {
                // Username Exists!
                inputValidation['usernameExists'] = true;
            }

            User.find({ email: email })
                .then((emails) => {
                    if (Object.keys(emails).length > 0) {
                        // Email Exists
                        inputValidation['emailExists'] = true;
                    }

                    if (someErrorFound) {
                        // Something is taken
                        res.redirect(url.format({ pathname: "/signin", query: inputValidation }));
                    }
                    else {
                        // U can sign in!
                        bcryptjs.hash(password, saltRounds)
                            .then((hashedPassword) => {
                                newUser['password'] = hashedPassword;
                                User.create(newUser, function (err, response) {
                                    if (err) {
                                        res.redirect('/signin')
                                        return handleError("Problem when adding user! ", err);
                                    }
                                    console.log("User added!", response)
                                    res.redirect('/login?accountCreated=true');
                                });
                            })

                    }
                })


        })
        .catch((error) => {
            console.log("Something went wrong when searching for users!\n", error);
        })


})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})