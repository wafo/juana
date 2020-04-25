const { Predictor } = require('./predictions');
const { createChart } = require('../graphs');

async function calculateOutput(firstTimeBuyer, previousPattern, previousSellingPrice, weekPrices) {
  let prices = weekPrices.reduce((accumulator, price) => {
    return [...accumulator, price[0], price[1]];
  }, []);

  prices = [previousSellingPrice, previousSellingPrice, ...prices];

  const predictor = new Predictor(prices, firstTimeBuyer, previousPattern);

  const analyzedPossibilities = predictor.analyze_possibilities();

  const graph = await createChart(prices, analyzedPossibilities);

  return {
    graph,
    analyzedPossibilities,
  };
}

module.exports = {
  calculateOutput,
};
