const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const appHelper = require('./app');
const expressValidator = require('express-validator');
const session = require('express-session');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'hangman',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());

//Get all words from file system
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

// Construct keyboard.
const keyboardRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const keyboardRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const keyboardRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

//Get a random number in range to call on word arrays.
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getEasyWord = () => {
  easyWords = words.filter(word => word.length >= 4 && word.length <= 6);
  easyWord = easyWords[getRandomInt(0, easyWords.length)];
  return easyWord;
}

const getNormalWord = () => {
  const normalWords = words.filter(word => word.length >= 4 && word.length <= 6);
  const normalWord = normalWords[getRandomInt(0, normalWords.length)];
  return normalWord;
}

const getHardWord = () => {
  const hardWords = words.filter(word => word.length >= 4 && word.length <= 6);
  const hardWord = hardWords[getRandomInt(0, hardWords.length)];
  return hardWord;
}

let existingAvatars = JSON.parse(fs.readFileSync('./avatars.json', 'utf8'));

const addAvatar = (img) => {
  let avatarImg = { img };
  existingAvatars.avatars.push(avatarImg);
  writeAvatars();
}

const writeAvatars = () => {
  fs.writeFileSync('./avatars.json', JSON.stringify(existingAvatars));
}

let attemptedLetter, displayedMessage, fullWord, hiddenWord, outcome;
let attemptedLettersArray = [];
let badAttemptCounter = 0;

//Make the word all underscore
const hideWord = (word) => {
  hiddenWord = word.split('').map((character) => {
     return character = '_';
  }).join('');
}

const resultMessage = (fullWord, hiddenWord, response) => {
  if (fullWord === hiddenWord) {
    outcome = "winner"
    console.log("We got a winner");
    response.redirect('/result');
  }
}

const getRemainingAttempts = () => {
  return `You have ${8 - badAttemptCounter} attempts left before you die.`
}

app.get('/', (request, response) => {
  console.log("This is the request" + request.session);
  request.session.word = fullWord;
  attemptedLettersArray = [];
  badAttemptCounter = 0;
  response.render('index');
});

app.get('/easy', (request, response) => {
  let easyWord = getEasyWord();
  console.log(easyWord);
  hideWord(easyWord);
  fullWord = easyWord;
  response.render('game', { keyboardRow1, keyboardRow2, keyboardRow3,  hiddenWord, fullWord, badAttemptCounter, getRemainingAttempts })
});

app.get('/normal', (request, response) => {
  let normalWord = getNormalWord();
  hideWord(normalWord);
  fullWord = normalWord;
  response.render('game', { keyboardRow1, keyboardRow2, keyboardRow3,  hiddenWord, fullWord, badAttemptCounter })
});

app.get('/hard', (request, response) => {
  let hardWord = getHardWord();
  hideWord(hardWord);
  fullWord = hardWord;
  response.render('game', { keyboardRow1, keyboardRow2, keyboardRow3,  hiddenWord, fullWord, badAttemptCounter })
});

app.get('/result', (request, response) => {
  response.render('result', { hiddenWord, fullWord, outcome })
});

app.get('/winners', (request, response) => {
  console.log(existingAvatars)
  response.render('winners', { existingAvatars })
});

app.post('/setavatar', (request, response) => {
  console.log({request})
  addAvatar(request.body.avatar);
  response.render('result', { hiddenWord, fullWord, outcome })
})

app.post('/attempt', (request, response) => {

  if (badAttemptCounter >= 8) {
    displayedMessage = "You have run out of attempts! You suck! Get a life!";
    outcome = "loser"
    return response.render('result', { outcome });
  }

  // request
  //   .checkBody("attemptedLetter", "You must guess a letter")
  //   .notEmpty()
  //   .isAlpha()
  //   .isLength(1, 1);
  //
  // const errors = request.validationErrors();
  // if (errors) {
  //   displayedMessage = "You need to type in something valid.";
  //   return response.render('game', { getRemainingAttempts, badAttemptCounter, hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
  // }

  attemptedLetter = request.query.key.toLowerCase();
  console.log({ badAttemptCounter });

  if (attemptedLettersArray.includes(attemptedLetter)) {
    displayedMessage = "You already guessed that letter! Sheesh.";
    return response.render('game', { keyboardRow1, keyboardRow2, keyboardRow3,  getRemainingAttempts, getRemainingAttempts, badAttemptCounter, hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
  }

  if (!fullWord.includes(attemptedLetter)) {
    badAttemptCounter++
  }

  hiddenWord = hiddenWord.split('').map((letter, index) => (
    attemptedLetter === fullWord[index]) ? attemptedLetter : letter
  ).join('')

  resultMessage(fullWord, hiddenWord, response);

  attemptedLettersArray.push(attemptedLetter);
  displayedMessage = '';
  return response.render('game', { keyboardRow1, keyboardRow2, keyboardRow3,  getRemainingAttempts, badAttemptCounter, hiddenWord, attemptedLetter, attemptedLettersArray, displayedMessage });
})

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
