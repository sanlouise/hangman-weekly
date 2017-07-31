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

//Check if guessed letter is included in the fullWord
const checkLetter = (fullWord, attemptedLetter, hiddenWord, response, outcome) => {
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
  resultMessage(fullWord, hiddenWord, response);

  console.log(hiddenWord);
  return hiddenWord;
}

app.get('/', (request, response) => {
  request.session.userName = "sandra";
  console.log(request.session);
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
  response.render('game', { hiddenWord, fullWord })
});

app.get('/normal', (request, response) => {
  let normalWord = getNormalWord();
  hideWord(normalWord);
  fullWord = normalWord;
  response.render('game', { hiddenWord, fullWord})
});

app.get('/hard', (request, response) => {
  let hardWord = getHardWord();
  hideWord(hardWord);
  fullWord = hardWord;
  response.render('game', { hiddenWord, fullWord })
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
    outcome = "loser"
    return response.render('result', { outcome });
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
