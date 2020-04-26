const { CanvasRenderService } = require('chartjs-node-canvas');
const logger = require('../utils/logger');

const canvasRenderService = new CanvasRenderService(1080, 400, ChartJS => {
  ChartJS.plugins.register({
    beforeDraw: chart => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 1080, 400);
      ctx.restore();
    },
  });
  logger.server('Canvas initialized');
});

async function createChart(prices, possibilities) {
  const chartLabels = [i18next.t('weekdays.sunday')].concat(
    ...[
      i18next.t('weekdays.abr.monday'),
      i18next.t('weekdays.abr.tuesday'),
      i18next.t('weekdays.abr.wednesday'),
      i18next.t('weekdays.abr.thursday'),
      i18next.t('weekdays.abr.friday'),
      i18next.t('weekdays.abr.saturday'),
    ].map(day => {
      return [i18next.t('times.morning'), i18next.t('times.afternoon')].map(time => `${day} ${time}`);
    }),
  );

  const chartConfiguration = {
    options: {},
    elements: {
      line: {
        backgroundColor: '#0000FF',
        cubicInterpolationMode: 'monotone',
      },
    },
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index',
    },
    type: 'line',
    // TEST
    data: {
      datasets: [
        {
          label: 'Precio de entrada',
          data: prices.slice(1),
          fill: false,
          backgroundColor: 'rgba(60,60,60,.50)',
          borderColor: 'rgba(60,60,60,.50)',
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Minimo',
          data: possibilities[0].prices.slice(1).map(day => day.min),
          fill: false,
          backgroundColor: 'rgba(255,90,95,.30)',
          borderColor: 'rgba(255,90,95,.30)',
          cubicInterpolationMode: 'monotone',
        },
        {
          label: 'Máximo',
          data: possibilities[0].prices.slice(1).map(day => day.max),
          fill: '-1',
          backgroundColor: 'rgba(8,126,139,.30)',
          borderColor: 'rgba(8,126,139,.30)',
          cubicInterpolationMode: 'monotone',
        },
      ],
      labels: chartLabels,
    },
  };

  const buffer = await canvasRenderService.renderToStream(chartConfiguration);
  return buffer;
}

module.exports = {
  createChart,
};
