const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path');

// Your website: https://hostapptest.herokuapp.com/

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
    res.render("index.ejs")
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
            res.redirect('/');
        })
        .catch((err) => {
            console.log("Something went wrong when adding new user! Error msg: ", err);
            res.redirect('/signin');
        })


})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})