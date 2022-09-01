const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path')

// Globals
const PORT = process.env.PORT || 80;



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.get('/', (req, res) => {
    res.render("index.ejs")
})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})