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

//Get all words from file system
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

//Filter words into easy, normal and hard arrays
const easyWords = words.filter(word => word.length >= 4 && word.length <= 6);
const normalWords = words.filter(word => word.length >= 6 && word.length <= 8);
const hardWords = words.filter(word => word.length >= 8);

//Get a random number in range to call on word arrays.
//found on: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Grab a random word from array
const easyWord = easyWords[getRandomInt(0, easyWords.length)];
const normalWord = normalWords[getRandomInt(0, normalWords.length)];
const hardWord = hardWords[getRandomInt(0, hardWords.length)];

// gameWord is the current word to be guessed
let gameWord;
app.get('/easy', (request, response) => {
  gameWord = easyWord;
  console.log({gameWord})
})

app.get('/normal', (request, response) => {
  gameWord = normalWord;
  console.log({gameWord})
})

app.get('/hard', (request, response) => {
  gameWord = hardWord;
  console.log({gameWord})
})

app.listen(3000, () => {
  console.log('Listening on port 3000');
})
