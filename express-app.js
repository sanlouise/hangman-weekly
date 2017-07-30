const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const appHelper = require('./app');
const expressValidator = require('express-validator');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(expressValidator());

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

let attemptedLetter, displayedMessage, fullWord, hiddenWord;
let attemptedLettersArray = [];
let badAttemptCounter = 0;
let winner = false;

//Make the word all underscore
const hideWord = (word) => {
  hiddenWord = word.split('').map(function(character) {
     return character = '_';
  }).join('');
}

app.get('/', (request, response) => {
  attemptedLettersArray = [];
  badAttemptCounter = 0;
  response.render('index');
});

app.get('/easy', (request, response) => {
  hideWord(easyWord);
  fullWord = easyWord;
  response.render('game', {hiddenWord, fullWord})
});

app.get('/normal', (request, response) => {
  hideWord(normalWord);
  fullWord = normalWord;
  response.render('game', {hiddenWord, fullWord})
});

app.get('/hard', (request, response) => {
  hideWord(hardWord);
  fullWord = hardWord;
  response.render('game', {hiddenWord, fullWord})
});

app.get('/winner', (request, response) => {
  response.render('winner', {hiddenWord, fullWord})
});

const winnerMessage = (fullWord, hiddenWord, response) => {
  if (fullWord === hiddenWord) {
    console.log("We got a winner");
    response.redirect('/winner');
  }
}

//Check if guessed letter is included in the fullWord
const checkLetter = (fullWord, attemptedLetter, hiddenWord, response) => {
  console.log(fullWord);

  fullWord = fullWord.split('');
  hiddenWord = hiddenWord.split('');

  if (!fullWord.includes(attemptedLetter)) {
    badAttemptCounter++
  }

  for (let i = 0; i < fullWord.length; i++) {
    if (fullWord[i] === attemptedLetter) {
      hiddenWord[i] = attemptedLetter;
    }
  }

  hiddenWord = hiddenWord.join('');
  fullWord = fullWord.join('');
  winnerMessage(fullWord, hiddenWord, response);

  console.log(hiddenWord);
  return hiddenWord;
}

app.post('/attempt', (request, response) => {
  request
    .checkBody("attemptedLetter", "You must guess a letter")
    .notEmpty()
    .isAlpha()
    .isLength(1, 1);

  const errors = request.validationErrors();
  if (errors) {
    displayedMessage = "You need to type in something valid.";
    return response.render('game', { hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
  }
  if (badAttemptCounter >= 9) {
    displayedMessage = "You have run out of attempts! You suck! Get a life!";
    return response.render('game', { hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
  }
  attemptedLetter = request.body.attemptedLetter.toLowerCase();
  console.log({ badAttemptCounter });
  if (attemptedLettersArray.includes(attemptedLetter)) {
    displayedMessage = "You already guessed that letter! Sheesh.";
    return response.render('game', { hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
  }

  hiddenWord = checkLetter(fullWord, attemptedLetter, hiddenWord, response);
  attemptedLettersArray.push(attemptedLetter);
  displayedMessage = '';
  return response.render('game', { hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
})

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
