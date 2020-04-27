const { Predictor } = require('./predictions');
const { createChart } = require('../graphs');

async function calculateOutput(firstTimeBuyer, previousPattern, previousSellingPrice, weekPrices) {
  let prices = weekPrices.reduce((accumulator, price) => {
    return [...accumulator, price[0] || NaN, price[1] || NaN];
  }, []);

  prices = [previousSellingPrice, previousSellingPrice, ...prices];

  const predictor = new Predictor(prices, firstTimeBuyer, previousPattern);

  const analyzedPossibilities = predictor.analyze_possibilities();

  // First element of array is the average
  const mostLikely = analyzedPossibilities.slice(1).sort((a, b) => b.probability - a.probability)[0];

  // Remove the average object
  const spikes = analyzedPossibilities.slice(1).reduce(
    (accumulator, posibility) => {
      // Remove sundays
      posibility.prices.slice(2).forEach((price, i) => {
        const max = parseInt(price.max);
        if (max > accumulator[i + 1]) {
          accumulator[i + 1] = max;
        }
      });
      return accumulator;
    },
    [parseInt(analyzedPossibilities[0].prices[0].max), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );

  const graph = await createChart(prices, mostLikely, spikes);

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
