const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path')

// Globals
const port = 8000;



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.get('/', (req, res) => {
    res.render("index.ejs")
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})