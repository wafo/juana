const crypto = require('crypto');

function challengeAnswer(toMatch, seed) {
  for (let i = 0; i < 99; i++) {
    const answer = i <= 9 ? `0${i}` : i;
    const hash = crypto
      .createHash('sha256')
      .update(`${seed}${answer}`)
      .digest('hex');
    if (hash === toMatch) {
      return answer;
    }
  }
}

module.exports = {
  challengeAnswer,
};
