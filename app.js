const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path');

// Globals
const PORT = process.env.PORT || 80;

// Models 
const User = require('./models/user.js');

// DB 
// const uri = "mongodb+srv://marcelmilosz:2MqNkwVIGAVF6yJX@cluster0.gpbuj84.mongodb.net/memes?retryWrites=true&w=majority"
var mongoDB = process.env.MONGO_URI;

// var mongoose = require('mongoose');

// mongoose.connect(mongoDB);

// // get reference to database
// var db = mongoose.connection;

// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function () {
//     console.log("Connection with Mongo DB Successful!");
// });


// Your website: https://hostapptest.herokuapp.com/

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => {
    res.render("index.ejs", { mongoKey: mongoDB })
})

/* Login */
app.get('/login', (req, res) => {
    res.render("login.ejs")
})

/* Sign In */
app.get('/signin', (req, res) => {
    res.render("signin.ejs")
})

app.post('/signin', (req, res) => {

    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    let newUser = {
        username: username,
        email: email,
        password: password
    }

    db.collection('users').insertOne(newUser)
        .then(() => {
            console.log("New user added!", newUser)
        })
        .catch((err) => {
            console.log("Something went wrong when adding new user! Error msg: ", err);
        })

    res.redirect('/');
})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})