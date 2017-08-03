const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const expressValidator = require('express-validator');
const session = require('express-session');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(session({
  secret: 'hangman',
  resave: false,
  saveUninitialized: true,
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
  const normalWords = words.filter(word => word.length >= 6 && word.length <= 8);
  const normalWord = normalWords[getRandomInt(0, normalWords.length)];
  return normalWord;
}

const getHardWord = () => {
  const hardWords = words.filter(word => word.length > 8);
  const hardWord = hardWords[getRandomInt(0, hardWords.length)];
  return hardWord;
}

let game = {
  attemptedLetter: undefined,
  displayedMessage: undefined,
  fullWord: undefined,
  hiddenWord: undefined,
  outcome: undefined,
  attemptedLettersArray: [],
  badAttemptCounter: 0,
  getRemainingAttempts: undefined,
  // Construct keyboard, multiple rows as mustache does not accept nested arrays.
  keyboardRow1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  keyboardRow2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  keyboardRow3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
}

//Make the word all underscore
const hideWord = (word) => word.split('').map(character => '_').join('');

const getRemainingAttempts = () => {
  return `You have ${8 - badAttemptCounter} attempts left before you die.`
}

app.get('/', (request, response) => {
  let displayedMessage = '';
  game.attemptedLettersArray = [];
  game.badAttemptCounter = 0;
  response.render('index');
});

app.get('/easy', (request, response) => {
  let easyWord = getEasyWord();
  console.log(easyWord);
  game.hiddenWord = hideWord(easyWord);
  game.fullWord = easyWord;
  response.render('game', game)
});

app.get('/normal', (request, response) => {
  let normalWord = getNormalWord();
  game.hiddenWord = hideWord(normalWord);
  game.fullWord = normalWord;
  response.render('game', game)
});

app.get('/hard', (request, response) => {
  let hardWord = getHardWord();
  console.log(hardWord);
  game.hiddenWord = hideWord(hardWord);
  game.fullWord = hardWord;
  response.render('game', game)
});

app.get('/result', (request, response) => {
  response.render('result', game)
});

app.post('/attempt', (request, response) => {

  game.attemptedLetter = request.query.key.toLowerCase();
  console.log({ badAttemptCounter: game.badAttemptCounter });

  if (game.attemptedLettersArray.includes(game.attemptedLetter)) {
    game.displayedMessage = "You already guessed that letter! Sheesh.";
    return response.render('game', game);
  }

  if (!game.fullWord.includes(game.attemptedLetter)) {
    game.badAttemptCounter++
  }

  game.hiddenWord = Array.from(game.hiddenWord).map((letter, index) => (
    game.attemptedLetter === game.fullWord[index]) ? game.attemptedLetter : letter
  ).join('');

  if (game.fullWord === game.hiddenWord) {
    game.outcome = "winner"
    console.log("We got a winner");
    return response.redirect('/result');
  }

  if (game.badAttemptCounter >= 8) {
    console.log("A loser!")
    game.displayedMessage = "You have run out of attempts, you die.";
    game.hiddenWord = game.fullWord;
    game.outcome = "loser"
    return response.render('result', game);
  }

  game.attemptedLettersArray.push(game.attemptedLetter);
  game.displayedMessage = '';
  return response.render('game', game);
})

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
