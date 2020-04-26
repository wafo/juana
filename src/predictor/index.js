const { Predictor } = require('./predictions');
const { createChart } = require('../graphs');

async function calculateOutput(firstTimeBuyer, previousPattern, previousSellingPrice, weekPrices) {
  let prices = weekPrices.reduce((accumulator, price) => {
    return [...accumulator, price[0], price[1]];
  }, []);

  prices = [previousSellingPrice, previousSellingPrice, ...prices];

  const predictor = new Predictor(prices, firstTimeBuyer, previousPattern);

  const analyzedPossibilities = predictor.analyze_possibilities();

  // First element of array is the average
  const mostLikely = analyzedPossibilities.slice(1).sort((a, b) => b.probability - a.probability)[0];

  const graph = await createChart(prices, analyzedPossibilities);

  return {
    graph,
    patterns: {
      mostLikely,
      average: analyzedPossibilities[0],
    },
  };
}

module.exports = {
  calculateOutput,
};
