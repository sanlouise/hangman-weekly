const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const appHelper = require('./app');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

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

let hiddenWord;
let attemptsCounter = 0;

let attemptedLettersArray = [];

const hideWord = (word) => {
  hiddenWord = word.split('').map(function(character) {
     return character = '_';
  }).join(' ');
}

app.get('/', (request, response) => {
  attemptedLettersArray = [];
  response.render('index');
})

app.get('/easy', (request, response) => {
  hideWord(easyWord);
  response.render('game', {hiddenWord})
})

app.get('/normal', (request, response) => {
  hideWord(normalWord);
  response.render('game', {hiddenWord})
})

app.get('/hard', (request, response) => {
  hideWord(hardWord);
  response.render('game', {hiddenWord})
})


let displayedError;

app.post('/attempt', (request, response) => {
  const attemptedLetter = request.body.attemptedLetter;

  if (attemptsCounter < 9) {
    if (attemptedLettersArray.includes(attemptedLetter)) {
      displayedError = "No need to guess the same letter twice..";
    } else {
      attemptedLettersArray.push(attemptedLetter);
      attemptsCounter++
      displayedError = '';
    }
  } else {
    displayedError = "You have run out of attempts"
  }
  response.render('game', { hiddenWord, attemptedLetter, attemptedLettersArray, displayedError })
})

app.listen(3000, () => {
  console.log('Listening on port 3000');
})
