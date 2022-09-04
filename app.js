const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path');
const url = require('url');

const bcryptjs = require("bcryptjs");

const validator = require("email-validator");

const saltRounds = 10;

const passwordValidator = require('password-validator');

// Your website: https://hostapptest.herokuapp.com/

// TO DO 
// Zrobiłeś walidacje rejestracji, dodaj zeby sprawdzalo czy w bazie są juz takie dane 
// ^ Sprawdz czy podany email to taki email

// Globals
const PORT = process.env.PORT || 80;

// Models 
const User = require('./models/user.js');

// DB 
var mongoose = require('mongoose');

var mongoDB = process.env.MONGO_URI || require('./secrets').secretDB.uri;

mongoose.connect(mongoDB);

// // get reference to database
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connection with Mongo DB Successful!");
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => {

    let queries = req.query;
    console.log("Recived queries: ", queries);

    res.render("index.ejs")
})

/* Login */
app.get('/login', (req, res) => {
    let queries = req.query;

    console.log("Recived queries: ", queries);

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
                        res.redirect(url.format({ pathname: "/", query: { isValid: true } }));
                    } else {
                        // Password not match
                        possibleErrors['passwordOk'] = false
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