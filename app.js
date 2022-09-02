const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path')

// Globals
const PORT = process.env.PORT || 80;

// Your website: https://limitless-plateau-28047.herokuapp.com/

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/public'));

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

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})