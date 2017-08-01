const { hideWord } = require('./express-app.js');

describe('hideWord', () => {
  test('render proper hidden word', () => {
    expect(hideWord("hello")).toBe('_____');
  })
})
