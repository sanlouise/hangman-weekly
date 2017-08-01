const { hideWord } = require('../express-app.js');
console.log("got here")
describe('hideWord', () => {
  test('render proper hidden word', () => {
    expect(hideWord("hello")).toBe('_____');
  })
})
