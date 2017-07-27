const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const appHelper = require('./app');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (request, response) => {
  response.render('index');
})

app.get('/easy', (request, response) => {
  let gameWord = easyWord;
})

app.get('/normal', (request, response) => {
  let gameWord = normalWord;
})

app.get('/hard', (request, response) => {
  let gameWord = hardWord;
})

//Create logic for easy route
//Create normal for easy route
//Create hard for easy route

app.listen(3000, () => {
  console.log('Listening on port 3000');
})
